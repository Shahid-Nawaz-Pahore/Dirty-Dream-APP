import React, { useRef } from "react";

import { BiWalletAlt } from "react-icons/bi";
import { LuArrowDownUp } from "react-icons/lu";
import { FaGasPump } from "react-icons/fa";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { IoIosFlower } from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import { PiLockKeyOpenFill } from "react-icons/pi";
import { useState, useMemo, useEffect } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { TonClient, Address, beginCell, toNano } from "ton";
import { PiWalletFill } from "react-icons/pi";
import { MINTER_ADDRESS, POOL_ADDRESS } from "../config";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
// import {
//   AppKitButton,
//   useAppKit,
//   useAppKitAccount,
//   useDisconnect,
// } from "@reown/appkit/react";

const Home = () => {
  // const [show, setShow] = useState(false);
  // const [opened, setOpened] = useState(false);
  // const [display, setDisplay] = useState(false);
  // const [check, setCheck] = useState(false);
  const [swap, setSwap] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const [balance, setBalance] = useState(null);
  const [ktonBalance, setKtonBalance] = useState(0);
  const [displayAddress, setDisplayAddress] = useState(null);
  const [network, setNetwork] = useState("testnet"); // ADDED THIS
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [input, setInput] = useState(0);
  const [txStatus, setTxStatus] = useState("idle");
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  // const { isConnected } = useAppKitAccount();
  // const { disconnect } = useDisconnect();
  // const { open } = useAppKit();

  // const handleClick = async () => {
  //   if (isConnected) {
  //     await disconnect();
  //   } else {
  //     await open({ view: "Connect", namespace: "eip155" });
  //   }
  // };

  const client = useMemo(() => {
    try {
      const endpoint =
        network === "testnet"
          ? "https://testnet.toncenter.com/api/v2/jsonRPC"
          : "https://toncenter.com/api/v2/jsonRPC";

      return new TonClient({
        endpoint: endpoint,
        apiKey: import.meta.env.VITE_API_TON_CLIENT,
      });
    } catch (e) {
      console.error("Failed to initialize TonClient:", e);
      return null;
    }
  }, [network]);

  useEffect(() => {
    if (!client || !tonConnectUI) return;

    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (!wallet) {
        setBalance(null);
        setDisplayAddress(null);
        return;
      }

      try {
        const rawAddress = wallet.account.address;

        // Detect testnet with proper priority
        let isTestnet = false;

        if (!rawAddress.includes(":")) {
          if (
            rawAddress.startsWith("k") ||
            (rawAddress.startsWith("0") && rawAddress.length > 10)
          ) {
            isTestnet = true;
          }
        }

        if (wallet.account.chain === "-3") {
          isTestnet = true;
        } else if (wallet.account.chain === "-239") {
          isTestnet = false;
        }

        console.log("Raw address:", rawAddress);
        console.log("Chain:", wallet.account.chain);
        console.log("Detected as testnet:", isTestnet);

        setNetwork(isTestnet ? "testnet" : "mainnet");

        let address;
        try {
          if (rawAddress.includes(":")) {
            address = Address.parseRaw(rawAddress);
          } else {
            const parsed = Address.parseFriendly(rawAddress);
            address = parsed.address;

            isTestnet = parsed.isTestOnly;
            setNetwork(isTestnet ? "testnet" : "mainnet");

            console.log("Parsed isTestOnly:", parsed.isTestOnly);
          }

          const friendlyAddress = address.toString({
            bounceable: false,
            testOnly: isTestnet,
          });

          setDisplayAddress(friendlyAddress);
        } catch (e) {
          console.error("Failed to parse address:", e);
          setBalance("Invalid Address");
          return;
        }

        try {
          console.log("Fetching balance for address:", address.toString());
          const info = await client.getBalance(address);
          console.log("Balance fetched successfully:", info);
          setBalance((Number(info) / 1e9).toFixed(2));
        } catch (balanceError) {
          console.error("Error fetching balance from TonClient:", balanceError);

          try {
            const apiEndpoint =
              network === "testnet"
                ? "https://testnet.toncenter.com/api/v2/getAddressBalance"
                : "https://toncenter.com/api/v2/getAddressBalance";

            const response = await fetch(
              `${apiEndpoint}?address=${address.toString()}`,
            );
            const data = await response.json();

            if (data.ok && data.result) {
              console.log("Balance fetched via fallback API:", data.result);
              setBalance((Number(data.result) / 1e9).toFixed(2));
            } else {
              console.error("Fallback API error:", data);
              setBalance("Error");
            }
          } catch (fallbackError) {
            console.error("Fallback API also failed:", fallbackError);
            setBalance("Error");
          }
        }
      } catch (e) {
        console.error("Error in wallet status change:", e);
        setBalance("Error");
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, client]);

  const handleWalletConnect = async () => {
    try {
      if (tonConnectUI.connected) {
        console.log("Wallet already connected");
        return;
      }

      await tonConnectUI.openModal();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      setShowDisconnect(false);
      setBalance(null);
      setDisplayAddress(null);
      setNetwork("mainnet"); // ADDED THIS
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDisconnect && !event.target.closest(".wallet-dropdown")) {
        setShowDisconnect(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDisconnect]);

  const getKtonBalance = async () => {
    try {
      console.log("KTON BALANCE FETCH CALLED");
      console.log("Display Address : ", displayAddress);
      console.log("Client : ", client);

      if (!displayAddress || !client) return;

      // Step 1 — get minter address from pool
      const minterAddr = MINTER_ADDRESS;
      if (!minterAddr) throw new Error("Could not fetch minter address");

      // Step 2 — get your personal KTON jetton wallet address
      const userAddr = Address.parse(displayAddress);

      const walletResult = await client.runMethod(
        minterAddr,
        "get_wallet_address",
        [
          {
            type: "slice",
            cell: beginCell().storeAddress(userAddr).endCell(),
          },
        ],
      );

      const ktonWalletAddr = walletResult.stack.readAddress();

      // Step 3 — get balance from your jetton wallet
      // get_wallet_data returns: balance, owner, minter, wallet_code
      const dataResult = await client.runMethod(
        ktonWalletAddr,
        "get_wallet_data",
        [],
      );

      const ktonBalance = dataResult.stack.readBigNumber(); // in nano KTON
      const formatted = (Number(ktonBalance) / 1e9);

      console.log("KTON Balance:", formatted);
      setKtonBalance(formatted);
    } catch (e) {
      // Wallet doesn't exist yet = 0 balance (no txs yet)
      console.log("KTON balance fetch failed (likely 0):", e.message);
      setKtonBalance("0.0000");
    }
  };

  const getTonBalance = async () => {

    if (!displayAddress || !client) return;

    const address = Address.parse(displayAddress);

    try {
          console.log("Fetching balance for address:", address.toString());
          const info = await client.getBalance(address);
          console.log("Balance fetched successfully:", info);
          setBalance((Number(info) / 1e9).toFixed(2));
        } catch (balanceError) {
          console.error("Error fetching balance from TonClient:", balanceError);

          try {
            const apiEndpoint =
              network === "testnet"
                ? "https://testnet.toncenter.com/api/v2/getAddressBalance"
                : "https://toncenter.com/api/v2/getAddressBalance";

            const response = await fetch(
              `${apiEndpoint}?address=${address.toString()}`,
            );
            const data = await response.json();

            if (data.ok && data.result) {
              console.log("Balance fetched via fallback API:", data.result);
              setBalance((Number(data.result) / 1e9).toFixed(2));
            } else {
              console.error("Fallback API error:", data);
              setBalance("Error");
            }
          } catch (fallbackError) {
            console.error("Fallback API also failed:", fallbackError);
            setBalance("Error");
          }
  };
  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (client && displayAddress) {
        await getKtonBalance();
      }
    };

    fetchBalance();
  }, [client, displayAddress]);

  const handleUnstake = async () => {
    if (!tonConnectUI.connected) throw Error("connect wallet first");
    if (!input || Number(input) <= 0) throw Error("amount must be greater than 0");
    if (parseFloat(input) > ktonBalance) throw Error(`amount must be less than ${ktonBalance}`);

    try {
      setTxStatus("pending");

      const minterAddr = Address.parse(MINTER_ADDRESS);
      if (!minterAddr) throw new Error("Could not fetch minter address");

      const userAddr = Address.parse(displayAddress);

      const walletResult = await client.runMethod(
        minterAddr,
        "get_wallet_address",
        [{ type: "slice", cell: beginCell().storeAddress(userAddr).endCell() }],
      );
      const ktonWalletAddr = walletResult.stack.readAddress();

      const waitTillRoundEnd = false; // immediate withdrawal
      const fillOrKill = false; // fallback to round-end if immediate unavailable

      // const customPayload = beginCell()
      //   .storeBit(waitTillRoundEnd)   // bit 0
      //   .storeBit(fillOrKill)         // bit 1
      //   .endCell();

      // const burnBody = beginCell()
      //   .storeUint(0x595f07bc, 32)       // op: burn
      //   .storeUint(0, 64)                 // query_id
      //   .storeCoins(toNano(input))        // jetton amount
      //   .storeAddress(userAddr)           // response_destination
      //   .storeBit(1)                      // ✅ Maybe = 1 (custom_payload present)
      //   .storeRef(customPayload)          // ✅ flags cell
      //   .endCell();

      // ✅ FIXED: Custom burn body matching sendBurnWithParams
      const burnBody = beginCell()
        .storeUint(0x595f07bc, 32) // op: "hbnr" = 0x73626e72 (custom burn)
        .storeUint(0, 64) // query_id
        .storeCoins(toNano(input)) // jetton amount
        .storeAddress(userAddr) // response_destination
        .storeBit(waitTillRoundEnd) // ✅ Flag 0: wait_till_round_end (bit)
        .storeBit(fillOrKill) // ✅ Flag 1: fill_or_kill (bit)
        .endCell();

      //   const poolAddr = Address.parse(POOL_ADDRESS); 

      // const { stack } = await client.runMethod(
      //   poolAddr,
      //   "get_pool_full_data",
      //   []
      // );

      // const state = stack.readNumber();
      // const halted = stack.readBoolean();
      // const totalBalance = stack.readBigNumber();
      // const interestRate = stack.readNumber();
      // const optimisticDepositWithdrawals = stack.readBoolean();
      // const depositsOpen = stack.readBoolean();

      // console.log({
      //   state,
      //   halted,
      //   depositsOpen,
      //   optimisticDepositWithdrawals,
      //   totalBalance: Number(totalBalance) / 1e9,
      // });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: ktonWalletAddr.toString({
              bounceable: true,
              testOnly: network === "testnet",
            }),
            amount: toNano("1").toString(),
            payload: burnBody.toBoc().toString("base64"),
          },
        ],
      });

      setTxStatus("success");
      console.log("✅ Unstake sent!");
      setTimeout(()=>{
        getKtonBalance()
        getTonBalance()
      },1000);
      return true;
    } catch (e) {
      console.error("❌ Unstake failed:", e);
      setTxStatus("error");
      throw Error(e.stack.split(':')[1].split('\n')[0]);
    }
  };

  const handleStake = async () => {
    if (!tonConnectUI.connected) throw Error("connect wallet first");
    if (!input || Number(input) <= 0) throw Error("amount must be greater than 0");
    console.log("Balance : ",balance);
    
    if (parseFloat(input) > balance) throw Error(`amount must be less than ${balance}`);

    setTxStatus("pending");

    // op code for deposit = 0x47d54391 (KTON Pool Root)
    const body = beginCell()
      .storeUint(0x47d54391, 32) // op: deposit
      .storeUint(0, 64) // query_id
      .endCell();

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 min
      messages: [
        {
          address: POOL_ADDRESS, // testnet address you got
          amount: (toNano(input) + toNano("1")).toString(), // TON amount in nanotons
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      console.log("Stake tx sent!");
      setTxStatus("success");
      setTimeout(()=>{
        getKtonBalance()
        getTonBalance()
      },1000);
      return true;
    } catch (e) {
      console.log("Stake failed:", e.stack.split(':')[1].split('\n')[0]);
      setTxStatus("error");
      throw Error(e.stack.split(':')[1].split('\n')[0]);
    }
  };

  const [exchangeRate, setExchangeRate] = useState(null); // TON per KTON ratio
  const exchangeRef = useRef(false);

  const getExchangeRate = async () => {
  try {

    if(exchangeRef.current == true) return;

    exchangeRef.current = true;

    const endpoint = network === "testnet"
      ? "https://testnet.toncenter.com/api/v2"
      : "https://toncenter.com/api/v2";

    // ✅ Get total_balance from pool AND total_supply from minter
    // in parallel using simple REST — no tuple parsing needed
    const [poolRes, minterRes] = await Promise.all([
      fetch(`${endpoint}/runGetMethod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: POOL_ADDRESS,
          method: "get_pool_full_data",
          stack: [],
        }),
      }),
      fetch(`${endpoint}/runGetMethod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: MINTER_ADDRESS,
          method: "get_jetton_data",
          stack: [],
        }),
      }),
    ]);

    const poolData = await poolRes.json();
    const minterData = await minterRes.json();

    console.log("Pool stack:", poolData.result.stack);
    console.log("Minter stack:", minterData.result.stack);

    // pool stack[0] = state (num)
    // pool stack[1] = halted (num)  
    // pool stack[2] = total_balance (num) ✅
    const totalBalance = BigInt(poolData.result.stack[2][1]);

    // minter stack[0] = total_supply ✅
    const totalSupply = BigInt(minterData.result.stack[0][1]);

    console.log("Total TON in pool:", Number(totalBalance) / 1e9);
    console.log("Total KTON supply:", Number(totalSupply) / 1e9);

    if (totalSupply === 0n) throw new Error("Total supply is 0");

    const rate = Number(totalBalance) / Number(totalSupply);
    console.log("✅ Exchange rate (TON per KTON):", rate);
    setExchangeRate(rate);
    return rate;
  } catch (e) {
    console.error("Failed to fetch exchange rate:", e);
    return null;
  }
};

  useEffect(() => {
    if (client && exchangeRate == null) {
      getExchangeRate();
    }
  }, [client,exchangeRate]);

  const receiveAmount = useMemo(() => {
    if (!input || Number(input) <= 0 || !exchangeRate) return "0";

    if (swap) {
      // Unstaking: input is KTON → receive TON
      return (Number(input) * exchangeRate).toFixed(2);
    } else {
      // Staking: input is TON → receive KTON
      return (Number(input) / exchangeRate).toFixed(2);
    }
  }, [input, swap, exchangeRate]);

  return (
    <div className="min-h-screen">
      <div className="py-4 px-4 fixed w-full z-3 px-6 flex items-center justify-between">
        <img
          onClick={() => window.open("https://dirty-dream.vercel.app/", "_blank")}
          src="/Logo.svg"
          alt="logo"
          className="size-10 rotate-0 hover:rotate-360 transform duration-500"
        />

        <div className="bg-gradient-to-r from-violet-600 to-blue-500 relative flex gap-2 justify-center items-center rounded-lg hover:scale-105 transform duration-500 border border-violet-400/30 h-10 px-3 cursor-pointer active:scale-95 transition">
          <PiWalletFill className="text-white w-6 h-6" />

          {!tonConnectUI.connected ? (
            <button
              onClick={handleWalletConnect}
              className="text-white font-semibold text-md cursor-pointer"
            >
              Connect wallet
            </button>
          ) : (
            <div className="wallet-dropdown">
              <button
                onClick={() => setShowDisconnect(!showDisconnect)}
                className="text-white font-semibold text-sm font-mono flex items-center gap-1 cursor-pointer"
              >
                {displayAddress
                  ? `${displayAddress.slice(0, 4)}...${displayAddress.slice(-3)}`
                  : tonConnectUI.wallet?.account?.address
                    ? `${tonConnectUI.wallet.account.address.slice(0, 4)}...${tonConnectUI.wallet.account.address.slice(-3)}`
                    : "Connected"}
                {network === "testnet" && <span className="text-xs"></span>}
              </button>

              {showDisconnect && (
                <div
                  className="absolute top-full right-0 mt-2 z-50 w-64"
                  style={{
                    background: "linear-gradient(145deg, #13102a, #0e0b22)",
                    border: "1px solid rgba(139,92,246,0.35)",
                    borderRadius: 16,
                    boxShadow:
                      "0 0 0 1px rgba(139,92,246,0.08), 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,0,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(99,0,255,0.12), rgba(236,72,153,0.06))",
                      borderBottom: "1px solid rgba(139,92,246,0.15)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                      }}
                    >
                      W
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] uppercase tracking-widest mb-0.5"
                        style={{ color: "rgba(167,139,250,0.7)" }}
                      >
                        Connected
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-xs font-mono truncate">
                          {displayAddress ||
                            tonConnectUI.wallet?.account?.address ||
                            "N/A"}
                        </p>
                        <button
                          onClick={() => {
                            const addr =
                              displayAddress ||
                              tonConnectUI.wallet?.account?.address;
                            if (addr) {
                              navigator.clipboard.writeText(addr);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }
                          }}
                          className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded transition-all duration-200"
                          style={{
                            background: copied
                              ? "rgba(52,211,153,0.15)"
                              : "rgba(139,92,246,0.12)",
                            border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : "rgba(139,92,246,0.25)"}`,
                            color: copied ? "#34d399" : "rgba(167,139,250,0.8)",
                          }}
                        >
                          {copied ? (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: "#34d399",
                        boxShadow: "0 0 6px #34d399",
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 p-3">
                    {network === "testnet" && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                          background: "rgba(234,179,8,0.1)",
                          border: "1px solid rgba(234,179,8,0.25)",
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <span className="text-yellow-300 text-xs font-semibold">
                          Testnet network
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {balance && (
                        <div
                          className="flex-1 rounded-xl p-2.5"
                          style={{
                            background: "rgba(139,92,246,0.08)",
                            border: "1px solid rgba(139,92,246,0.18)",
                          }}
                        >
                          <p
                            className="text-[10px] uppercase tracking-wider mb-1"
                            style={{ color: "rgba(167,139,250,0.65)" }}
                          >
                            TON
                          </p>
                          <p className="text-white font-bold text-sm">
                            {balance}
                          </p>
                        </div>
                      )}
                      {ktonBalance && (
                        <div
                          className="flex-1 rounded-xl p-2.5"
                          style={{
                            background: "rgba(6,182,212,0.08)",
                            border: "1px solid rgba(6,182,212,0.18)",
                          }}
                        >
                          <p
                            className="text-[10px] uppercase tracking-wider mb-1"
                            style={{ color: "rgba(34,211,238,0.65)" }}
                          >
                            K-TON
                          </p>
                          <p className="text-white font-bold text-sm">
                            {ktonBalance}
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      style={{ height: 1, background: "rgba(139,92,246,0.12)" }}
                    />

                    <button
                      onClick={handleWalletDisconnect}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#fca5a5",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(239,68,68,0.2)";
                        e.currentTarget.style.borderColor =
                          "rgba(239,68,68,0.45)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(239,68,68,0.1)";
                        e.currentTarget.style.borderColor =
                          "rgba(239,68,68,0.25)";
                        e.currentTarget.style.color = "#fca5a5";
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Disconnect wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center flex-col px-4 pb-6 pt-14">
        <div className="bg-white/5 backdrop-blur-[20px] border border-violet-500/20 w-full max-w-[19rem] md:max-w-[35rem] mt-6 md:mt-10 h-12 flex flex-row justify-center items-center rounded-3xl p-1">
          <button
            onClick={() => {
              setSwap((prev) => !prev);
              setInput(0);
            }}
            className={`${!swap ? "bg-gradient-to-r from-violet-600/60 to-blue-500/60 backdrop-blur-[20px] shadow-lg shadow-violet-500/20" : ""} text-white font-bold text-md md:text-md flex justify-center items-center w-1/2 cursor-pointer h-10 rounded-3xl transition-all`}
          >
            Stake
          </button>
          <button
            onClick={() => {
              setSwap((prev) => !prev);
              setInput(0);
            }}
            className={`${swap ? "bg-gradient-to-r from-pink-600/60 to-violet-500/60 backdrop-blur-[20px] shadow-lg shadow-pink-500/20" : ""} text-white font-bold text-md md:text-md flex justify-center items-center w-1/2 cursor-pointer h-10 rounded-3xl transition-all`}
          >
            UnStake
          </button>
        </div>

        <div className="border-wrapper w-full rounded-2xl mt-6 border border-violet-500/30 hover:border-violet-400/70 max-w-[19rem] md:max-w-[35rem] transition-colors duration-300">
          <div className="border-rotating">
            <div className="flex flex-col gap-2 items-center justify-center bg-white/5 backdrop-blur-[20px] rounded-2xl content p-4">
              <div className="w-full">
                <div className="flex justify-between w-full mb-2">
                  <h1 className="text-sm md:text-md text-violet-200 font-semibold">
                    Amount
                  </h1>
                  <div className="flex flex-row gap-1 items-center">
                    <BiWalletAlt className="text-violet-300 w-5 h-5 md:w-6 md:h-6" />
                    <h1 className="text-violet-200 font-semibold text-sm md:text-base">
                      -
                    </h1>
                    <h1 className="text-violet-200 font-semibold text-sm md:text-base">
                      TON
                    </h1>
                  </div>
                </div>

                <div className="flex justify-between w-full items-center">
                  <input
                    placeholder={`${swap ? "0" : "100"}`}
                    type="number"
                    className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-white w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <div className="flex flex-row justify-center items-center gap-1 md:gap-2 items-center flex-shrink-0">
                    <div className="flex justify-end items-end w-full mt-1">
                      <button
                        className="text-sm md:text-md font-semibold text-violet-200 hover:text-white bg-violet-500/20 hover:bg-violet-500/40 border border-violet-500/30 rounded-full px-4 py-1.5 cursor-pointer transition-all"
                        onClick={() => {
                          if (!swap) setInput(balance?.toString());
                          else setInput(ktonBalance?.toString());
                        }}
                      >
                        Max
                      </button>
                    </div>
                    <h1 className="text-2xl md:text-3xl text-white font-semibold">
                      {swap ? "KTON" : "TON"}
                    </h1>
                    <div className="flex items-center justify-center">
                      {swap ? (
                        <img src="/Logo.svg" className="w-22 rounded-full" />
                      ) : (
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 40 40"
                          className="md:w-10 md:h-10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_5041_15082)">
                            <path
                              d="M20 40C31.0714 40 40 31.0714 40 20C40 8.92857 31.0714 0 20 0C8.92857 0 0 8.92857 0 20C0 31.0714 8.92857 40 20 40Z"
                              fill="#0098EA"
                            />
                            <path
                              d="M26.8573 11.1426H13.143C10.643 11.1426 9.07157 13.8569 10.2859 16.0711L18.7144 30.714C19.2859 31.6426 20.643 31.6426 21.2144 30.714L29.643 16.0711C30.9287 13.8569 29.3573 11.1426 26.8573 11.1426ZM18.7859 26.2854L16.9287 22.714L12.5001 14.7854C12.2144 14.2854 12.5716 13.6426 13.2144 13.6426H18.7859V26.2854ZM27.5001 14.7854L23.0716 22.714L21.2144 26.2854V13.6426H26.7859C27.4287 13.6426 27.7859 14.2854 27.5001 14.7854Z"
                              fill="white"
                            />
                          </g>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-row justify-center items-center gap-2">
                <div className="border-t border-violet-500/30 h-1 flex-1"></div>
                <div className="w-10 h-10 hover:bg-violet-500/40 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex justify-center items-center cursor-pointer transition-all">
                  <LuArrowDownUp
                    onClick={() => setSwap((prev) => !prev)}
                    className="w-5 h-5 text-violet-200 hover:rotate-180 transition-transform font-semibold"
                  />
                </div>
                <div className="border-t border-violet-500/30 h-1 flex-1"></div>
              </div>

              <div className="w-full">
                <div className="flex justify-start items-start w-full mb-2">
                  <h1 className="text-sm md:text-md text-violet-200">
                    Receive
                  </h1>
                </div>

                <div className="flex justify-between w-full items-center">
                  <input
                    placeholder={`${swap ? "100" : "0"}`}
                    type="number"
                    value={receiveAmount}
                    readOnly
                    className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-white w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="flex flex-row gap-1 md:gap-2 items-center flex-shrink-0">
                    <h1 className="text-2xl md:text-3xl text-white font-semibold">
                      {swap ? "TON" : "KTON"}
                    </h1>
                    <div className="flex items-center justify-center">
                      {swap ? (
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 40 40"
                          className="md:w-10 md:h-10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_5041_15082)">
                            <path
                              d="M20 40C31.0714 40 40 31.0714 40 20C40 8.92857 31.0714 0 20 0C8.92857 0 0 8.92857 0 20C0 31.0714 8.92857 40 20 40Z"
                              fill="#0098EA"
                            />
                            <path
                              d="M26.8573 11.1426H13.143C10.643 11.1426 9.07157 13.8569 10.2859 16.0711L18.7144 30.714C19.2859 31.6426 20.643 31.6426 21.2144 30.714L29.643 16.0711C30.9287 13.8569 29.3573 11.1426 26.8573 11.1426ZM18.7859 26.2854L16.9287 22.714L12.5001 14.7854C12.2144 14.2854 12.5716 13.6426 13.2144 13.6426H18.7859V26.2854ZM27.5001 14.7854L23.0716 22.714L21.2144 26.2854V13.6426H26.7859C27.4287 13.6426 27.7859 14.2854 27.5001 14.7854Z"
                              fill="white"
                            />
                          </g>
                        </svg>
                      ) : (
                        <img src="/Logo.svg" className="w-10 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between w-full mt-4 text-xs md:text-sm">
                  <h1 className="text-violet-200 font-semibold">
                    {exchangeRate
                      ? `1 TON = ${(1 / exchangeRate).toFixed(6)} KTON`
                      : "Fetching rate..."
                    }
                  </h1>
                  <div className="flex flex-row gap-1 items-center">
                    <FaGasPump className="text-cyan-400 w-3 h-3 md:w-4 md:h-4" />
                    <h1 className="text-violet-200">0.15 ~ 1.15</h1>
                    <MdKeyboardArrowDown className="text-violet-200 cursor-pointer w-5 h-5" />
                  </div>
                </div>

                {tonConnectUI.connected && (
                  <button
                    onClick={
                      swap
                        ? () =>
                            toast.promise(handleUnstake(), {
                              loading: "Loading",
                              success: () => `Unstaked Successfully!!!`,
                              error: (err) => `${err.toString()}`,
                            })
                        : () =>
                            toast.promise(handleStake(), {
                              loading: "Loading",
                              success: () => `Staked Successfully!!!`,
                              error: (err) => `${err.toString()}`,
                            })
                    }
                    disabled={txStatus === "pending"}
                    className="mt-4 w-full max-w-[19rem] md:max-w-[35rem] h-11 rounded-full font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
                  >
                    {txStatus === "pending"
                      ? " Processing..."
                      : swap
                        ? "Unstake KTON"
                        : "Stake TON"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[19rem] md:max-w-[35rem] bg-white/5 backdrop-blur-[20px] flex flex-col gap-3 rounded-2xl mt-6 border border-pink-500/25 hover:border-pink-400/50 p-4 transition-colors duration-300">
          <div className="flex justify-between items-start">
            <h1 className="text-violet-200 font-semibold text-sm md:text-base">
              Upcoming rewards
            </h1>
            <div className="flex flex-col items-end">
              <h1 className="text-lg md:text-xl font-semibold text-white">
                0.0080 TON
              </h1>
              <h1 className="text-violet-300 text-xs md:text-sm">
                (2026-01-19 08:34)
              </h1>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <h1 className="text-violet-200 font-semibold text-sm md:text-base">
              Monthly (Est.)
            </h1>
            <div className="flex flex-col items-end">
              <h1 className="text-lg md:text-xl font-semibold text-white">
                0.3077 TON
              </h1>
              <h1 className="text-cyan-400 text-xs md:text-sm">~$0.49</h1>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <h1 className="text-violet-200 font-semibold">Yearly (Est.)</h1>
            <div className="flex flex-col items-end">
              <h1 className="text-lg md:text-xl font-semibold text-white">
                3.6932 TON
              </h1>
              <h1 className="text-cyan-400 text-xs md:text-sm">~$5.88</h1>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[19rem] md:max-w-[35rem] rounded-2xl mt-4 border border-cyan-500/25 hover:border-cyan-400/50 bg-white/5 backdrop-blur-[20px] flex flex-row justify-between items-center p-4 transition-colors duration-300">
          <div className="flex flex-row gap-2 items-center">
            <IoIosFlower className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
            <h1 className="text-white text-xl md:text-2xl">APY</h1>
            <IoInformationCircleOutline className="w-4 h-4 md:w-5 md:h-5 text-violet-300" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            5.31%
          </h1>
        </div>

        <div className="flex justify-center flex-col gap-2 items-center w-full max-w-[19rem] md:max-w-[35rem] mt-6">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <h1 className="text-violet-300 font-semibold">Audited by</h1>
            <PiLockKeyOpenFill className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
            <div className="text-white font-bold">
              Ton <span className="text-violet-300 font-normal">Bit</span>
            </div>
            <h1 className="font-semibold text-violet-300">
              TON Foundation-endorsed
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
