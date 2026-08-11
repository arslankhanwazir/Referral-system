type ReferralRow = {
  id: string;
  referredName: string;
  referredEmail: string;
  pointsAwarded: number;
  status: string;
  createdAt: string | Date;
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReferralHistoryTable({ referrals }: { referrals: ReferralRow[] }) {
  if (referrals.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white/60 p-10 text-center">
        <p className="font-display text-lg text-ink">No referrals yet</p>
        <p className="mt-1 text-sm text-ink/60">
          Copy your referral link above and share it. New signups will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.1em] text-ink/50">
            <th className="px-5 py-3 font-medium">Referred user</th>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="px-5 py-3.5">
                <div className="font-medium text-ink">{r.referredName}</div>
                <div className="text-xs text-ink/50">{r.referredEmail}</div>
              </td>
              <td className="px-5 py-3.5 text-ink/70">{formatDate(r.createdAt)}</td>
              <td className="px-5 py-3.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.status === "COMPLETED"
                      ? "bg-accent/10 text-accentDark"
                      : "bg-warn/10 text-warn"
                  }`}
                >
                  {r.status === "COMPLETED" ? "Completed" : "Rejected"}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-ink">+{r.pointsAwarded}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
