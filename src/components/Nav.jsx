import { useState } from "react";
import { PiWalletFill } from "react-icons/pi";
import { useTonConnectUI } from "@tonconnect/ui-react";
const Nav = ({ displayAddress, balance, ktonBalance, network, onDisconnect }) => {
const [tonConnectUI] = useTonConnectUI();
const [showDropdown, setShowDropdown] = useState(false);
const [copied, setCopied] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (tonConnectUI.connected) return;
    try {
      await tonConnectUI.openModal();
    } catch (e) {
      console.error("Wallet connect error:", e);
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (e) {
      console.error("Wallet disconnect error:", e);
    } finally {
      setShowDropdown(false);
      onDisconnect?.();
    }
  };

  const handleCopy = () => {
    const addr = displayAddress || tonConnectUI.wallet?.account?.address;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown when clicking outside
  const handleOutsideClick = (e) => {
    if (!e.target.closest(".wallet-dropdown")) setShowDropdown(false);
  };

  // Attach / detach outside-click listener
  const onDropdownToggle = (next) => {
    setShowDropdown(next);
    if (next) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 4)}...${addr.slice(-3)}` : "Connected";

  const visibleAddress =
    displayAddress || tonConnectUI.wallet?.account?.address || null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-6 fixed w-full z-30 flex items-center justify-between">
      {/* Logo */}
      <img
        onClick={() => window.open("https://dirty-dream.vercel.app/", "_blank")}
        src="/Logo.svg"
        alt="logo"
        className="size-10 hover:rotate-360 transform duration-500 cursor-pointer"
      />

      {/* Wallet button */}
      <div onClick={handleConnect} className="bg-gradient-to-r from-violet-600 to-blue-500 relative flex gap-2 justify-center items-center rounded-lg hover:scale-105 transform duration-500 border border-violet-400/30 h-10 px-3 cursor-pointer active:scale-95 transition">
        <PiWalletFill className="text-white w-6 h-6" />

        {!tonConnectUI.connected ? (
          <button
            // onClick={handleConnect}
            className="text-white h-10 font-semibold text-md cursor-pointer"
          >
            Connect wallet
          </button>
        ) : (
          <div className="wallet-dropdown">
            {/* Address pill */}
            <button
              onClick={() => onDropdownToggle(!showDropdown)}
              className="text-white font-semibold text-sm font-mono flex items-center gap-1 cursor-pointer"
            >
              {shortAddress(visibleAddress)}
              {network === "testnet" && (
                <span className="text-xs text-yellow-300">⬡</span>
              )}
            </button>

            {/* Dropdown panel */}
            {showDropdown && (
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
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,0,255,0.12), rgba(236,72,153,0.06))",
                    borderBottom: "1px solid rgba(139,92,246,0.15)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
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
                        {visibleAddress ?? "N/A"}
                      </p>
                      {/* Copy button */}
                      <button
                        onClick={handleCopy}
                        aria-label="Copy address"
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
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Online dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }}
                  />
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2.5 p-3">
                  {/* Testnet badge */}
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

                  {/* Balance tiles */}
                  <div className="flex gap-2">
                    {balance && (
                      <div
                        className="flex-1 rounded-xl p-2.5"
                        style={{
                          background: "rgba(139,92,246,0.08)",
                          border: "1px solid rgba(139,92,246,0.18)",
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(167,139,250,0.65)" }}>
                          TON
                        </p>
                        <p className="text-white font-bold text-sm">{balance}</p>
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
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(34,211,238,0.65)" }}>
                          K-TON
                        </p>
                        <p className="text-white font-bold text-sm">{ktonBalance}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: "rgba(139,92,246,0.12)" }} />

                  {/* Disconnect */}
                  <button
                    onClick={handleDisconnect}
                    aria-label="Disconnect wallet"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#fca5a5",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                      e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                      e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                      e.currentTarget.style.color = "#fca5a5";
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  );
};

export default Nav;