import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { TonClient4 } from "@ton/ton";
import { Address, beginCell, TupleBuilder } from "@ton/core";
import { z } from "zod";
import toast from "react-hot-toast";

import Nav from "../components/Nav.jsx";
import Stakecard from "../components/Stakecard.jsx";
import Infocards from "../components/Infocards.jsx";
import { MINTER_ADDRESS, POOL_ADDRESS } from "../config.js";

// ─── Free public endpoints — no API key needed ────────────────────────────────
const V4_ENDPOINTS = {
  mainnet: "https://mainnet-v4.tonhubapi.com",
  testnet: "https://testnet-v4.tonhubapi.com",
};

// ─── Validate contract addresses at module load ───────────────────────────────
try {
  Address.parse(POOL_ADDRESS);
  Address.parse(MINTER_ADDRESS);
} catch {
  throw new Error("[config] POOL_ADDRESS or MINTER_ADDRESS is invalid.");
}

const Home = () => {
  const [tonConnectUI] = useTonConnectUI();

  const [balance, setBalance] = useState(null);
  const [ktonBalance, setKtonBalance] = useState(null);
  const [displayAddress, setDisplayAddress] = useState(null);
  const [network, setNetwork] = useState("mainnet");
  const [exchangeRate, setExchangeRate] = useState(null);

  const networkRef = useRef("mainnet");
  const unsubscribeRef = useRef(null);
  const isFetchingKton = useRef(false);
  const exchangeFetching = useRef(false);

  useEffect(() => {
    networkRef.current = network;
  }, [network]);

  // ─── TonClient4: fast, no API key, ~300ms responses ──────────────────────
  const client = useMemo(
    () =>
      new TonClient4({
        endpoint: V4_ENDPOINTS[network] ?? V4_ENDPOINTS.mainnet,
        timeout: 15_000,
      }),
    [network],
  );

  // ─── Reset on disconnect / network switch ────────────────────────────────
  const resetWalletState = useCallback(() => {
    setBalance(null);
    setKtonBalance(null);
    setDisplayAddress(null);
    setExchangeRate(null);
    exchangeFetching.current = false;
    isFetchingKton.current = false;
  }, []);

  // ─── Helper: latest seqno (TonClient4 requires block number per call) ────
  const getSeqno = useCallback(async () => {
    const last = await client.getLastBlock();
    return last.last.seqno;
  }, [client]);

  // ─── TON balance ──────────────────────────────────────────────────────────
  // getAccountLite returns { account: { balance: { coins: "1234567890" } } }
  // coins is a string in nano — divide by 1e9 for TON
  const getTonBalance = useCallback(
    async (address) => {
      if (!address) return;
      try {
        const seqno = await getSeqno();
        const account = await client.getAccountLite(seqno, address);
        const nanoStr = account.account.balance.coins; // string e.g. "12345678900"
        setBalance((Number(nanoStr) / 1e9).toFixed(2));
      } catch (e) {
        console.error("TON balance error:", e.message);
        setBalance("0.00");
      }
    },
    [client, getSeqno],
  );

  // ─── KTON balance ─────────────────────────────────────────────────────────
  // TonClient4.runMethod returns:
  //   { exitCode, result: TupleItem[], reader: TupleReader, ... }
  //
  // TupleItem shapes:
  //   integer  → { type: "int",   value: BigInt }   ← readBigNumber()
  //   address  → { type: "slice", cell: Cell }       ← readAddress()
  //   cell     → { type: "cell",  cell: Cell }       ← readCell()
  //
  // ALWAYS use reader.readXxx() — never access result[] directly
  const getKtonBalance = useCallback(
    async (addrString) => {
      if (!addrString || isFetchingKton.current) return;
      isFetchingKton.current = true;

      try {
        const seqno = await getSeqno();
        const minterAddr = Address.parse(MINTER_ADDRESS);
        const userAddr = Address.parse(addrString);

        // Pass user address as a slice argument using TupleBuilder.writeAddress()
        // This produces { type: "slice", cell: beginCell().storeAddress(addr).endCell() }
        const args = new TupleBuilder();
        args.writeAddress(userAddr);

        // Step 1: get the KTON jetton wallet address for this user
        const walletResult = await client.runMethod(
          seqno,
          minterAddr,
          "get_wallet_address",
          args.build(),
        );
        // get_wallet_address returns: [slice(address)]
        // reader.readAddress() handles: readCell().beginParse().loadAddress()
        const ktonWalletAddr = walletResult.reader.readAddress();

        // Step 2: get the wallet's balance
        const dataResult = await client.runMethod(
          seqno,
          ktonWalletAddr,
          "get_wallet_data",
          [],
        );
        // get_wallet_data returns: [int(balance), int(something), slice(minterAddr), cell(code)]
        // First item is the balance as a BigInt
        const ktonBal = dataResult.reader.readBigNumber();
        setKtonBalance((Number(ktonBal) / 1e9).toFixed(4));
      } catch (e) {
        console.error("KTON balance error:", e.message);
        setKtonBalance("0.0000");
      } finally {
        isFetchingKton.current = false;
      }
    },
    [client, getSeqno],
  );

  // ─── Exchange rate ────────────────────────────────────────────────────────
  // get_pool_full_data stack layout (index → value):
  //   [0] state, [1] halted, [2] totalBalance ← we need this
  //
  // get_jetton_data stack layout:
  //   [0] totalSupply ← we need this
  //
  // rate = totalBalance / totalSupply  (both in nanoTON/nanoKTON — ratio is unitless)
  const getExchangeRate = useCallback(async () => {
    if (exchangeFetching.current) return;
    exchangeFetching.current = true;

    try {
      const seqno = await getSeqno();
      const poolAddr = Address.parse(POOL_ADDRESS);
      const minterAddr = Address.parse(MINTER_ADDRESS);

      const [poolResult, minterResult] = await Promise.all([
        client.runMethod(seqno, poolAddr, "get_pool_full_data", []),
        client.runMethod(seqno, minterAddr, "get_jetton_data", []),
      ]);

      // Skip first two values in pool stack, read third
      const poolReader = poolResult.reader;
      poolReader.readBigNumber(); // index 0 — skip
      poolReader.readBigNumber(); // index 1 — skip
      const totalBalance = poolReader.readBigNumber(); // index 2

      // First value in minter stack
      const totalSupply = minterResult.reader.readBigNumber(); // index 0

      if (totalSupply === 0n) throw new Error("Total supply is 0");

      const rate = Number(totalBalance) / Number(totalSupply);
      setExchangeRate(rate);
      console.log("Exchange rate:", rate);
    } catch (e) {
      console.error("Exchange rate error:", e.message);
      exchangeFetching.current = false; // allow retry
    }
  }, [client, getSeqno]);

  // ─── Combined refresh — passed into StakeCard poller ─────────────────────
  const handleBalancesRefresh = useCallback(
    async (addrString) => {
      await Promise.all([
        getTonBalance(Address.parse(addrString)),
        getKtonBalance(addrString),
      ]);
    },
    [getTonBalance, getKtonBalance],
  );

  // ─── Fetch exchange rate immediately when client is ready ────────────────
  useEffect(() => {
    exchangeFetching.current = false;
    getExchangeRate();
  }, [client]); // re-runs when network changes → new client

  // ─── Auto-refresh balances every 60s ─────────────────────────────────────
  useEffect(() => {
    if (!displayAddress) return;
    const id = setInterval(() => handleBalancesRefresh(displayAddress), 60_000);
    return () => clearInterval(id);
  }, [displayAddress, handleBalancesRefresh]);

  // ─── Wallet status listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!tonConnectUI) return;
    if (unsubscribeRef.current) unsubscribeRef.current();

    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (!wallet) {
        resetWalletState();
        return;
      }

      try {
        // chain "-3" = testnet, "-239" = mainnet — only canonical source
        const isTestnet = wallet.account.chain === "-3";
        const newNetwork = isTestnet ? "testnet" : "mainnet";

        if (networkRef.current !== newNetwork) {
          setExchangeRate(null);
          exchangeFetching.current = false;
        }
        setNetwork(newNetwork);

        const raw = wallet.account.address;
        let address;
        try {
          address = raw.includes(":")
            ? Address.parseRaw(raw)
            : Address.parseFriendly(raw).address;
        } catch {
          setBalance("Invalid address");
          return;
        }

        const friendly = address.toString({
          bounceable: false,
          testOnly: isTestnet,
        });
        setDisplayAddress(friendly);

        // Fetch both balances in parallel immediately on connect
        await Promise.all([getTonBalance(address), getKtonBalance(friendly)]);
      } catch (e) {
        if (e instanceof z.ZodError) toast.error("Wallet data format error.");
        setBalance("Error");
      }
    });

    unsubscribeRef.current = unsubscribe;
    return () => unsubscribe();
  }, [tonConnectUI, getTonBalance, getKtonBalance, resetWalletState]);

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    resetWalletState();
    setNetwork("mainnet");
  }, [resetWalletState]);

  return (
    <div className="min-h-screen">
      <Nav
        displayAddress={displayAddress}
        balance={balance}
        ktonBalance={ktonBalance}
        network={network}
        onDisconnect={handleDisconnect}
      />
      <div className="flex justify-center items-center flex-col px-4 pb-6 pt-14">
        <Stakecard
          client={client}
          displayAddress={displayAddress}
          balance={balance}
          ktonBalance={ktonBalance}
          network={network}
          exchangeRate={exchangeRate}
          onBalancesRefresh={handleBalancesRefresh}
        />
        <Infocards />
      </div>
    </div>
  );
};

export default Home;
