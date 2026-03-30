import React, { useState, useEffect, useRef } from "react";
import { Route, Routes } from "react-router";
import Home from "./pages/Home.jsx";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";
import Loader from "./Loader.jsx";

function DotCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "rgba(167,139,250,0.7)",
      "rgba(96,165,250,0.7)",
      "rgba(244,114,182,0.7)",
      "rgba(34,211,238,0.7)",
    ];

    const dots = Array.from({ length: 80 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.7,
      color: COLORS[i % COLORS.length],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = a.color;
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(167,139,250,${(1 - dist / 120) * 0.18})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <TonConnectUIProvider manifestUrl="https://dirty-dreamapp.vercel.app/tonconnect-manifest.json">
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "#020510",
        }}
      >
        <div
          style={{
            position: "fixed",
            width: 700,
            height: 600,
            top: -220,
            left: -160,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(99,0,255,0.45) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)",
            filter: "blur(80px)",
            animation: "f1 20s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "fixed",
            width: 550,
            height: 450,
            top: "20%",
            right: -160,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(236,72,153,0.4) 0%, rgba(168,85,247,0.2) 40%, transparent 70%)",
            filter: "blur(80px)",
            animation: "f2 24s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "fixed",
            width: 500,
            height: 380,
            bottom: -100,
            left: "20%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(6,182,212,0.35) 0%, rgba(59,130,246,0.15) 40%, transparent 70%)",
            filter: "blur(90px)",
            animation: "f1 28s ease-in-out infinite reverse",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "fixed",
            width: 300,
            height: 280,
            top: "50%",
            left: "40%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(251,146,60,0.18) 0%, transparent 70%)",
            filter: "blur(70px)",
            animation: "f2 16s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <style>{`
          @keyframes f1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,-40px) scale(1.05)} }
          @keyframes f2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,30px) scale(0.95)} }
        `}</style>

        <DotCanvas />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
              duration: 5000,
              style: {
                background: "#1e1b2e",
                color: "#fff",
                border: "1px solid rgba(167,139,250,0.3)",
              },
              success: {
                duration: 3000,
                iconTheme: { primary: "#a78bfa", secondary: "#1e1b2e" },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </TonConnectUIProvider>
  );
};

export default App;
