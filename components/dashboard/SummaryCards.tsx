type SummaryCardsProps = {
  points: number;
  totalReferrals: number;
  referralCode: string;
};

function Card({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-ink/50">{label}</p>
      <p className={`mt-2 text-2xl font-medium text-ink ${mono ? "font-mono tracking-wide" : "font-display"}`}>
        {value}
      </p>
    </div>
  );
}

export default function SummaryCards({ points, totalReferrals, referralCode }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card label="Total points" value={points} />
      <Card label="Total referrals" value={totalReferrals} />
      <Card label="Referral code" value={referralCode} mono />
    </div>
  );
}
