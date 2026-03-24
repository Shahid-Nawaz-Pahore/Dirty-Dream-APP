import React from "react";

import { BiWalletAlt } from "react-icons/bi";
import { LuArrowDownUp } from "react-icons/lu";
import { FaGasPump } from "react-icons/fa";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { IoIosFlower } from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import { PiLockKeyOpenFill } from "react-icons/pi";
import { useState } from "react";
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

  return (
    <div className=" min-h-screen bg-gray-700">
      <div className="flex justify-center items-center flex-col px-4 pb-6">
        <div className="bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px] w-full max-w-[19rem] md:max-w-[35rem] mt-6 md:mt-10 h-12 flex flex-row justify-center items-center rounded-3xl p-1">
          <button
            onClick={() => setSwap((prev) => !prev)}
            className={`${swap ? "" : "bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px]"} text-white font-bold text-md md:text-md flex justify-center items-center w-1/2 cursor-pointer h-10 rounded-3xl transition-all`}
          >
            Stake
          </button>
          <button
            onClick={() => setSwap((prev) => !prev)}
            className={`${swap ? "bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px]" : ""} text-white font-bold text-md md:text-md flex justify-center items-center w-1/2 cursor-pointer h-10 rounded-3xl transition-all`}
          >
            Un stake
          </button>
        </div>

        <div className="border-wrapper mt-5 w-full max-w-[19rem] md:max-w-[35rem]">
          <div className="border-rotating">
            <div className="flex flex-col gap-2 items-center justify-center bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px] rounded-2xl content p-4">
              <div className="w-full">
                <div className="flex justify-between w-full mb-2">
                  <h1 className="text-sm md:text-md text-white font-semibold">
                    {swap ? "Receive" : "Stake amount"}
                  </h1>
                  <div className="flex flex-row gap-1 items-center">
                    <BiWalletAlt className="text-white w-5 h-5 md:w-6 md:h-6" />
                    <h1 className="text-white font-semibold text-sm md:text-base">
                      -
                    </h1>
                    <h1 className="text-white font-semibold text-sm md:text-base">
                      TON
                    </h1>
                  </div>
                </div>

                <div className="flex justify-between w-full items-center">
                  <input
                    placeholder={`${swap ? "0" : "100"}`}
                    type="number"
                    className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-white w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="flex flex-row justify-center items-center gap-1 md:gap-2 items-center flex-shrink-0">
                    <div className="flex justify-end items-end w-full mt-1">
                      <button className="text-sm md:text-md font-semibold text-black bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px] rounded-full px-4 py-1.5 cursor-pointer transition-colors">
                        Max
                      </button>
                    </div>
                    <h1 className="text-2xl md:text-3xl text-white font-semibold">
                      {swap ? "KTON" : "TON"}
                    </h1>
                    <div className="flex items-center justify-center">
                      {swap ? (
                        // <svg
                        //   width="32"
                        //   height="32"
                        //   viewBox="0 0 40 40"
                        //   className="md:w-10 md:h-10"
                        //   fill="none"
                        //   xmlns="http://www.w3.org/2000/svg"
                        // >
                        //   <g clipPath="url(#clip0_5041_13487)">
                        //     <path
                        //       d="M20 40C31.0714 40 40 31.0714 40 20C40 8.92857 31.0714 0 20 0C8.92857 0 0 8.92857 0 20C0 31.0714 8.92857 40 20 40Z"
                        //       fill="#545CCB"
                        //       fillOpacity="0.5"
                        //     />
                        //     <g clipPath="url(#clip1_5041_13487)">
                        //       <path
                        //         d="M20.0017 19.998L13.9652 31.6449L12.9473 31.0564L20.0017 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M6.91016 19.4102L20.0011 19.9987L6.91016 20.5872V19.4102Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.002 19.9984L29.5261 13.8125L30.1138 14.8318L20.002 19.9984Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.9998 19.9991L19.4121 8.64648H20.5875L19.9998 19.9991Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.0005 19.9984L9.88867 14.8318L10.4764 13.8125L20.0005 19.9984Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.002 19.998L30.1138 25.1646L29.5261 26.1839L20.002 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.9998 19.998L20.5875 31.3507H19.4121L19.9998 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.0005 19.998L10.4764 26.1839L9.88867 25.1646L20.0005 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M33.0929 21.2945L20.002 20.1175V19.8821L33.0929 18.7051V21.2945Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.8984 19.9411L25.426 8L27.6655 9.29473L20.1022 20.0589L19.8984 19.9411Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.8993 20.0589L12.3359 9.29473L14.5755 8L20.1028 19.9411L19.8993 20.0589Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.1022 19.9414L27.6655 30.7055L25.426 32.0003L19.8984 20.0591L20.1022 19.9414Z"
                        //         fill="white"
                        //       />
                        //     </g>
                        //   </g>
                        // </svg>
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

                {/* <div className="flex justify-end items-end w-full mt-2">
                  <button className="text-sm md:text-md font-semibold text-white bg-[#3B3B3E] hover:bg-[#37373a] rounded-full px-4 py-1.5 cursor-pointer transition-colors">
                    Max
                  </button>
                </div> */}
              </div>

              <div className="w-full flex flex-row justify-center items-center gap-2">
                <div className="border-t-2 h-1 bg-white flex-1"></div>
                <div className="w-10 h-10 hover:bg-white rounded-2xl flex justify-center items-center cursor-pointer transition-all">
                  <LuArrowDownUp
                    onClick={() => setSwap((prev) => !prev)}
                    className="w-5 h-5 text-black hover:rotate-180 transition-transform font-semibold"
                  />
                </div>
                <div className="border-t-2 h-1 bg-white flex-1"></div>
              </div>

              <div className="w-full">
                <div className="flex justify-start items-start w-full mb-2">
                  <h1 className="text-sm md:text-md text-white font-semibold">
                    {swap ? "Unstack amount" : "receive"}
                  </h1>
                </div>

                <div className="flex justify-between w-full items-center">
                  <input
                    placeholder={`${swap ? "100" : "0"}`}
                    type="number"
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
                        // <svg
                        //   width="32"
                        //   height="32"
                        //   viewBox="0 0 40 40"
                        //   className="md:w-10 md:h-10"
                        //   fill="none"
                        //   xmlns="http://www.w3.org/2000/svg"
                        // >
                        //   <g clipPath="url(#clip0_5041_13487)">
                        //     <path
                        //       d="M20 40C31.0714 40 40 31.0714 40 20C40 8.92857 31.0714 0 20 0C8.92857 0 0 8.92857 0 20C0 31.0714 8.92857 40 20 40Z"
                        //       fill="#545CCB"
                        //       fillOpacity="0.5"
                        //     />
                        //     <g clipPath="url(#clip1_5041_13487)">
                        //       <path
                        //         d="M20.0017 19.998L13.9652 31.6449L12.9473 31.0564L20.0017 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M6.91016 19.4102L20.0011 19.9987L6.91016 20.5872V19.4102Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.002 19.9984L29.5261 13.8125L30.1138 14.8318L20.002 19.9984Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.9998 19.9991L19.4121 8.64648H20.5875L19.9998 19.9991Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.0005 19.9984L9.88867 14.8318L10.4764 13.8125L20.0005 19.9984Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.002 19.998L30.1138 25.1646L29.5261 26.1839L20.002 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.9998 19.998L20.5875 31.3507H19.4121L19.9998 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.0005 19.998L10.4764 26.1839L9.88867 25.1646L20.0005 19.998Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M33.0929 21.2945L20.002 20.1175V19.8821L33.0929 18.7051V21.2945Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.8984 19.9411L25.426 8L27.6655 9.29473L20.1022 20.0589L19.8984 19.9411Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M19.8993 20.0589L12.3359 9.29473L14.5755 8L20.1028 19.9411L19.8993 20.0589Z"
                        //         fill="white"
                        //       />
                        //       <path
                        //         d="M20.1022 19.9414L27.6655 30.7055L25.426 32.0003L19.8984 20.0591L20.1022 19.9414Z"
                        //         fill="white"
                        //       />
                        //     </g>
                        //   </g>
                        // </svg>
                        <img src="/Logo.svg" className="w-10 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between w-full mt-4 text-xs md:text-sm">
                  <h1 className="text-white font-semibold">
                    1TON = 0.999365 KTON
                  </h1>
                  <div className="flex flex-row gap-1 items-center">
                    <FaGasPump className="text-white w-3 h-3 md:w-4 md:h-4" />
                    <h1 className="text-white">0.15 ~ 1.15</h1>
                    <MdKeyboardArrowDown className="text-white cursor-pointer w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[19rem] md:max-w-[35rem] bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px] flex flex-col gap-3 rounded-2xl mt-6 border-2 border-gray-200 p-4">
          <div className="flex justify-between items-start">
            <h1 className="text-white font-semibold text-sm md:text-base">
              Upcoming rewards
            </h1>
            <div className="flex flex-col items-end">
              <h1 className="text-lg md:text-xl font-semibold text-white">
                0.0080 TON
              </h1>
              <h1 className="text-white text-xs md:text-sm">
                (2026-01-19 08:34)
              </h1>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <h1 className="text-white font-semibold text-sm md:text-base">
              Monthly (Est.)
            </h1>
            <div className="flex flex-col items-end">
              <h1 className="text-lg md:text-xl font-semibold text-white">
                0.3077 TON
              </h1>
              <h1 className="text-white text-xs md:text-sm">~$0.49</h1>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <h1 className="text-white font-semibold text-sm md:text-base">
              Yearly (Est.)
            </h1>
            <div className="flex flex-col items-end">
              <h1 className="text-lg md:text-xl font-semibold text-white">
                3.6932 TON
              </h1>
              <h1 className="text-white text-xs md:text-sm">~$5.88</h1>
            </div>
          </div>
        </div>

        <button
          // onClick={handleClick}
          className="flex items-center mt-6 md:mt-8 justify-center cursor-pointer bg-[rgba(255,255,255,0.2)] backdrop-blur-[20px] border-gray-200 border-2  transition-colors text-white w-full max-w-[19rem] md:max-w-[35rem] font-semibold text-md h-11 rounded-full"
        >
          Connect Wallet
        </button>

        <div className="w-full max-w-[19rem] md:max-w-[35rem] rounded-2xl mt-4 border-2 border-gray-200 flex flex-row justify-between items-center p-4">
          <div className="flex flex-row gap-2 items-center">
            <IoIosFlower className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <h1 className="text-white text-xl md:text-2xl">APY</h1>
            <IoInformationCircleOutline className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">3.69%</h1>
        </div>
      

        <div className="flex justify-center flex-col gap-2 items-center w-full max-w-[19rem] md:max-w-[35rem] mt-6">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <h1 className="text-white font-semibold">
              Audited by
            </h1>
            <PiLockKeyOpenFill className="w-6 h-6 md:w-8 md:h-8 text-white" />
            <div className="text-white font-bold">
              Ton{" "}
              <span className="text-white font-normal">
                Bit
              </span>
            </div>
            <h1 className="font-semibold text-white">
              TON Foundation-endorsed
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
