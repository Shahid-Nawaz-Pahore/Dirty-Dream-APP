import { useState, useMemo, useRef, useCallback } from "react";
import { BiWalletAlt } from "react-icons/bi";
import { LuArrowDownUp } from "react-icons/lu";
import { FaGasPump } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { Address, beginCell, toNano } from "ton";
import { z } from "zod";
import toast from "react-hot-toast";
import { POOL_ADDRESS, MINTER_ADDRESS } from "../config.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000;
const INITIAL_TX_STATE = { status: "idle", error: null };

// Maximum stake guard — clamp before passing to toNano()
const MAX_STAKE = 1_000_000;

// ─── User-friendly error map ──────────────────────────────────────────────────
const FRIENDLY_ERRORS = {
  "User rejected": "Transaction was cancelled.",
  "user rejected": "Transaction was cancelled.",
  "Insufficient funds": "Not enough TON to complete this.",
  "Transaction was not sent": "Transaction timed out. Please try again.",
};

const toFriendlyError = (raw) => {
  for (const [key, msg] of Object.entries(FRIENDLY_ERRORS)) {
    if (raw?.includes(key)) return msg;
  }
  return raw ?? "Something went wrong. Please try again.";
};

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
const StakeInputSchema = z
  .object({
    input: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .pipe(z.number().positive("Amount must be greater than 0")),
    balance: z.number(),
    connected: z.literal(true, {
      errorMap: () => ({ message: "Please connect your wallet first." }),
    }),
  })
  .refine((d) => d.input <= d.balance, {
    message: "Amount exceeds your available balance.",
    path: ["input"],
  });

const UnstakeInputSchema = z
  .object({
    input: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .pipe(z.number().positive("Amount must be greater than 0")),
    ktonBalance: z.number(),
    connected: z.literal(true, {
      errorMap: () => ({ message: "Please connect your wallet first." }),
    }),
  })
  .refine((d) => d.input <= d.ktonBalance, {
    message: "Amount exceeds your available KTON balance.",
    path: ["input"],
  });

// ─── TON logo SVG ─────────────────────────────────────────────────────────────
const TonLogo = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#ton-clip)">
      <path
        d="M20 40C31.0714 40 40 31.0714 40 20C40 8.92857 31.0714 0 20 0C8.92857 0 0 8.92857 0 20C0 31.0714 8.92857 40 20 40Z"
        fill="#0098EA"
      />
      <path
        d="M26.8573 11.1426H13.143C10.643 11.1426 9.07157 13.8569 10.2859 16.0711L18.7144 30.714C19.2859 31.6426 20.643 31.6426 21.2144 30.714L29.643 16.0711C30.9287 13.8569 29.3573 11.1426 26.8573 11.1426ZM18.7859 26.2854L16.9287 22.714L12.5001 14.7854C12.2144 14.2854 12.5716 13.6426 13.2144 13.6426H18.7859V26.2854ZM27.5001 14.7854L23.0716 22.714L21.2144 26.2854V13.6426H26.7859C27.4287 13.6426 27.7859 14.2854 27.5001 14.7854Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="ton-clip">
        <rect width="40" height="40" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const Stakecard = ({
  client,
  displayAddress,
  balance,
  ktonBalance,
  network,
  exchangeRate,
  onBalancesRefresh,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const [swap, setSwap] = useState(false); // false = stake, true = unstake
  const [input, setInput] = useState("");
  const [txState, setTxState] = useState(INITIAL_TX_STATE);

  // Cancellable poller token
  const pollCancelRef = useRef({ cancelled: false });

  const isPending = txState.status === "pending";

  // ─── Auto-dismiss tx feedback after 5s ───────────────────────────────────
  const scheduleDismiss = useCallback(() => {
    setTimeout(() => setTxState(INITIAL_TX_STATE), 5000);
  }, []);

  // ─── Cancellable balance poller ───────────────────────────────────────────
  const pollBalances = useCallback(
    (addrString) => {
      pollCancelRef.current.cancelled = true;
      const token = { cancelled: false };
      pollCancelRef.current = token;

      (async () => {
        for (let i = 0; i < POLL_ATTEMPTS; i++) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (token.cancelled) return;
          await onBalancesRefresh(addrString);
        }
      })();
    },
    [onBalancesRefresh],
  );

  // ─── Stake ────────────────────────────────────────────────────────────────
  const handleStake = async () => {
    if (!client) throw new Error("Wallet client is not ready.");

    const validation = StakeInputSchema.safeParse({
      input,
      balance: parseFloat(balance ?? "0"),
      connected: tonConnectUI.connected,
    });
    if (!validation.success)
      throw new Error(validation.error.issues[0].message);

    // Clamp before toNano to prevent BigInt overflow
    const safeAmount = Math.min(Math.max(parseFloat(input), 0), MAX_STAKE);

    setTxState({ status: "pending", error: null });

    const body = beginCell()
      .storeUint(0x47d54391, 32)
      .storeUint(0, 64)
      .endCell();

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: POOL_ADDRESS,
            amount: (toNano(safeAmount) + toNano("1")).toString(),
            payload: body.toBoc().toString("base64"),
          },
        ],
      });
      setTxState({ status: "success", error: null });
      scheduleDismiss();
      pollBalances(displayAddress);

      return true;
    } catch (e) {
      const msg = toFriendlyError(e?.message);
      setTxState({ status: "error", error: msg });
      throw new Error(msg);
    }
  };

  // ─── Unstake ──────────────────────────────────────────────────────────────
  const handleUnstake = async () => {
    if (!client) throw new Error("Wallet client is not ready.");

    const validation = UnstakeInputSchema.safeParse({
      input,
      ktonBalance: parseFloat(ktonBalance ?? "0"),
      connected: tonConnectUI.connected,
    });
    if (!validation.success)
      throw new Error(validation.error.issues[0].message);

    const safeAmount = Math.min(Math.max(parseFloat(input), 0), MAX_STAKE);

    setTxState({ status: "pending", error: null });

    try {
      const minterAddr = Address.parse(MINTER_ADDRESS);
      const userAddr = Address.parse(displayAddress);

      const userCell = beginCell().storeAddress(userAddr).endCell();

      const walletResult = await client.runMethod(
        minterAddr,
        "get_wallet_address",
        [
          {
            type: "slice",
            cell: userCell.toBoc().toString("base64"),
          },
        ],
      );
      const ktonWalletAddr = walletResult.stack.readAddress();

      const burnBody = beginCell()
        .storeUint(0x595f07bc, 32)
        .storeUint(0, 64)
        .storeCoins(toNano(safeAmount))
        .storeAddress(userAddr)
        .storeBit(false)
        .storeBit(false)
        .endCell();

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

      setTxState({ status: "success", error: null });
      scheduleDismiss();
      pollBalances(displayAddress);
      return true;
    } catch (e) {
      const msg = toFriendlyError(e?.message);
      setTxState({ status: "error", error: msg });
      throw new Error(msg);
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const receiveAmount = useMemo(() => {
    if (!input || Number(input) <= 0 || !exchangeRate) return "0";
    return swap
      ? (Number(input) * exchangeRate).toFixed(2)
      : (Number(input) / exchangeRate).toFixed(2);
  }, [input, swap, exchangeRate]);

  const handleTabSwitch = () => {
    setSwap((prev) => !prev);
    setInput("");
    setTxState(INITIAL_TX_STATE);
  };

  const handleInputChange = (e) => {
    // Prevent negative values at input level
    const val = e.target.value;
    if (val === "" || Number(val) >= 0) {
      setInput(val);
      if (txState.status !== "idle") setTxState(INITIAL_TX_STATE);
    }
  };

  const handleMax = () => {
    setInput(swap ? String(ktonBalance ?? "") : String(balance ?? ""));
  };

  const handleSwapDirection = () => {
    setSwap((prev) => !prev);
    setInput("");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center w-full">
      {/* Stake / Unstake tab switcher */}
      <div className="bg-white/5 backdrop-blur-[20px] border border-violet-500/20 w-full max-w-[19rem] md:max-w-[35rem] mt-6 md:mt-10 h-12 flex flex-row justify-center items-center rounded-3xl p-1">
        <button
          onClick={handleTabSwitch}
          className={`${
            !swap
              ? "bg-gradient-to-r from-violet-600/60 to-blue-500/60 backdrop-blur-[20px] shadow-lg shadow-violet-500/20"
              : "bg-white/5"
          } text-white font-bold text-md flex justify-center items-center w-1/2 cursor-pointer h-10 rounded-3xl transition-all`}
        >
          Stake
        </button>
        <button
          onClick={handleTabSwitch}
          className={`${
            swap
              ? "bg-gradient-to-r from-pink-600/60 to-violet-500/60 backdrop-blur-[20px] shadow-lg shadow-pink-500/20"
              : "bg-white/5"
          } text-white font-bold text-md flex justify-center items-center w-1/2 cursor-pointer h-10 rounded-3xl transition-all`}
        >
          UnStake
        </button>
      </div>

      {/* Main swap card */}
      <div className="border-wrapper w-full rounded-2xl mt-6 border border-violet-500/30 hover:border-violet-400/70 max-w-[19rem] md:max-w-[35rem] transition-colors duration-300">
        <div className="border-rotating">
          <div className="flex flex-col gap-2 items-center justify-center bg-white/5 backdrop-blur-[20px] rounded-2xl content p-4">
            {/* ── You pay ── */}
            <div className="w-full">
              <div className="flex justify-between w-full mb-2">
                <h1 className="text-sm md:text-md text-violet-200 font-semibold">
                  Amount
                </h1>
                <div className="flex flex-row gap-1 items-center">
                  <BiWalletAlt className="text-violet-300 w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-violet-200 font-semibold text-sm md:text-base">
                    {swap
                      ? ktonBalance !== null
                        ? ktonBalance
                        : "—"
                      : balance !== null
                        ? balance
                        : "—"}
                  </span>
                  <span className="text-violet-200 font-semibold text-sm md:text-base">
                    {swap ? "KTON" : "TON"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between w-full items-center">
                <input
                  placeholder={swap ? "0" : "100"}
                  type="number"
                  min="0"
                  className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-white w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                  disabled={isPending}
                  aria-label="Stake amount"
                />

                <div className="flex flex-row justify-center items-center gap-1 md:gap-2 flex-shrink-0">
                  <button
                    aria-label="Use maximum balance"
                    className="text-sm md:text-md font-semibold text-violet-200 hover:text-white bg-violet-500/20 hover:bg-violet-500/40 border border-violet-500/30 rounded-full px-4 py-1.5 cursor-pointer transition-all"
                    disabled={isPending}
                    onClick={handleMax}
                  >
                    Max
                  </button>
                  <h1 className="text-2xl md:text-3xl text-white font-semibold">
                    {swap ? "KTON" : "TON"}
                  </h1>
                  {swap ? (
                    <img
                      src="/Logo.svg"
                      className="w-8 md:w-10 rounded-full"
                      alt="KTON"
                    />
                  ) : (
                    <TonLogo />
                  )}
                </div>
              </div>
            </div>

            {/* ── Direction divider ── */}
            <div className="w-full flex flex-row justify-center items-center gap-2">
              <div className="border-t border-violet-500/30 h-1 flex-1" />
              <button
                aria-label="Swap direction"
                className="w-10 h-10 hover:bg-violet-500/40 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex justify-center items-center cursor-pointer transition-all"
                onClick={handleSwapDirection}
              >
                <LuArrowDownUp className="w-5 h-5 text-violet-200 hover:rotate-180 transition-transform font-semibold" />
              </button>
              <div className="border-t border-violet-500/30 h-1 flex-1" />
            </div>

            {/* ── You receive ── */}
            <div className="w-full">
              <div className="flex justify-start w-full mb-2">
                <h1 className="text-sm md:text-md text-violet-200">Receive</h1>
              </div>

              <div className="flex justify-between w-full items-center">
                <input
                  placeholder={swap ? "100" : "0"}
                  type="number"
                  value={receiveAmount}
                  readOnly
                  aria-label="Receive amount (estimated)"
                  className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-white w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-row gap-1 md:gap-2 items-center flex-shrink-0">
                  <h1 className="text-2xl md:text-3xl text-white font-semibold">
                    {swap ? "TON" : "KTON"}
                  </h1>
                  {swap ? (
                    <TonLogo />
                  ) : (
                    <img
                      src="/Logo.svg"
                      className="w-8 md:w-10 rounded-full"
                      alt="KTON"
                    />
                  )}
                </div>
              </div>

              {/* Rate & gas row */}
              <div className="flex justify-between w-full mt-4 text-xs md:text-sm">
                <h1 className="text-violet-200 font-semibold">
                  {exchangeRate
                    ? `1 TON = ${(1 / exchangeRate).toFixed(6)} KTON`
                    : "Fetching rate…"}
                </h1>
                <div className="flex flex-row gap-1 items-center">
                  <FaGasPump className="text-cyan-400 w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-violet-200">0.15 ~ 1.15</span>
                  <MdKeyboardArrowDown className="text-violet-200 cursor-pointer w-5 h-5" />
                </div>
              </div>

              {/* Tx feedback */}
              {txState.status === "success" && (
                <p className="mt-2 text-xs text-emerald-400 font-semibold">
                  ✓ Transaction sent — balances updating…
                </p>
              )}
              {txState.status === "error" && (
                <p className="mt-2 text-xs text-red-400 font-semibold">
                  ✗ {txState.error}
                </p>
              )}

              {/* Action button — always visible, disabled when not connected */}
              <button
                onClick={
                  tonConnectUI.connected
                    ? swap
                      ? () =>
                          toast.promise(handleUnstake(), {
                            loading: "Sending transaction…",
                            success: "Unstaked successfully!",
                            error: (err) => err.message,
                          })
                      : () =>
                          toast.promise(handleStake(), {
                            loading: "Sending transaction…",
                            success: "Staked successfully!",
                            error: (err) => err.message,
                          })
                    : undefined
                }
                disabled={isPending || !exchangeRate}
                aria-disabled={
                  !tonConnectUI.connected || isPending || !exchangeRate
                }
                className="mt-4 w-full h-11 rounded-full font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
                style={{
                  cursor:
                    tonConnectUI.connected && !isPending
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {!tonConnectUI.connected
                  ? "Connect wallet to stake"
                  : isPending
                    ? "Processing…"
                    : swap
                      ? "Unstake KTON"
                      : "Stake TON"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stakecard;
