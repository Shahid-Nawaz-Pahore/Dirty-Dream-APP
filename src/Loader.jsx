const Loader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-50">
      <div
        className="flex flex-col items-center gap-6 px-8 py-6 rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
      >
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 animate-spin [animation-direction:reverse]"></div>
        </div>

        <p className="text-white text-md tracking-wide animate-pulse textoutline-light">
          Loading your experience...
        </p>
      </div>
    </div>
  );
};

export default Loader;
