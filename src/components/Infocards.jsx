import { IoIosFlower } from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import { PiLockKeyOpenFill } from "react-icons/pi";

const PLACEHOLDER_STATS = {
  upcomingRewardTon: "0.0080",
  upcomingRewardDate: "2026-01-19 08:34",
  monthlyEstTon: "0.3077",
  monthlyEstUsd: "0.49",
  yearlyEstTon: "3.6932",
  yearlyEstUsd: "5.88",
  apy: "5.31",
};

const RewardRow = ({
  label,
  tonAmount,
  secondary,
  secondaryColor = "text-cyan-400",
}) => (
  <div className="flex justify-between items-start">
    <h1 className="text-violet-200 font-semibold text-sm md:text-base">
      {label}
    </h1>
    <div className="flex flex-col items-end">
      <h1 className="text-lg md:text-xl font-semibold text-white">
        {tonAmount} TON
      </h1>
      <span className={`${secondaryColor} text-xs md:text-sm`}>
        {secondary}
      </span>
    </div>
  </div>
);

// ─── RewardsCard ──────────────────────────────────────────────────────────────
const RewardsCard = () => (
  <div className="w-full max-w-[19rem] md:max-w-[35rem] bg-white/5 backdrop-blur-[20px] flex flex-col gap-3 rounded-2xl mt-6 border border-pink-500/25 hover:border-pink-400/50 p-4 transition-colors duration-300">
    <RewardRow
      label="Upcoming Rewards"
      tonAmount={PLACEHOLDER_STATS.upcomingRewardTon}
      secondary={`(${PLACEHOLDER_STATS.upcomingRewardDate})`}
      secondaryColor="text-violet-300"
    />
    <RewardRow
      label="Monthly Est"
      tonAmount={PLACEHOLDER_STATS.monthlyEstTon}
      secondary={`~$${PLACEHOLDER_STATS.monthlyEstUsd}`}
    />
    <RewardRow
      label="Yearly Est"
      tonAmount={PLACEHOLDER_STATS.yearlyEstTon}
      secondary={`~$${PLACEHOLDER_STATS.yearlyEstUsd}`}
    />
  </div>
);

// ─── ApyCard ──────────────────────────────────────────────────────────────────
const ApyCard = () => (
  <div className="w-full max-w-[19rem] md:max-w-[35rem] rounded-2xl mt-4 border border-cyan-500/25 hover:border-cyan-400/50 bg-white/5 backdrop-blur-[20px] flex flex-row justify-between items-center p-4 transition-colors duration-300">
    <div className="flex flex-row gap-2 items-center">
      <IoIosFlower className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
      <h1 className="text-white text-xl md:text-2xl">APY</h1>
      <IoInformationCircleOutline
        className="w-4 h-4 md:w-5 md:h-5 text-violet-300 cursor-pointer"
        title="Annual Percentage Yield — placeholder value, fetched from contract in production"
      />
    </div>
    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
      {PLACEHOLDER_STATS.apy}%
    </h1>
  </div>
);

// ─── AuditBadge ───────────────────────────────────────────────────────────────
const AuditBadge = () => (
  <div className="flex justify-center flex-col gap-2 items-center w-full max-w-[19rem] md:max-w-[35rem] mt-6">
    <div className="flex flex-col md:flex-row gap-2 items-center">
      <h1 className="text-violet-300 font-semibold">Audited By</h1>
      <PiLockKeyOpenFill className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
      <div className="text-white font-bold">
        Ton <span className="text-violet-300 font-normal">Bit</span>
      </div>
      <h1 className="font-semibold text-violet-300">TON Foundation-endorsed</h1>
    </div>
  </div>
);

const InfoCards = () => (
  <>
    <RewardsCard />
    <ApyCard />
    <AuditBadge />
  </>
);

export default InfoCards;
export { RewardsCard, ApyCard, AuditBadge };
