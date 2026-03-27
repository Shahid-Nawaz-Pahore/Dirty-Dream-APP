import React from "react";
import { useState, useEffect } from "react";
import { Route, Routes } from "react-router";
import Home from "./pages/Home.jsx";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";
import Loader from "./Loader.jsx";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initApp();

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <TonConnectUIProvider manifestUrl="https://stakee-stake.vercel.app/tonconnect-manifest.json">
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toasterId="default"
        toastOptions={{
          // Define default options
          className: "",
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: "#363636",
            color: "#fff",
          },

          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </TonConnectUIProvider>
  );
};

export default App;
