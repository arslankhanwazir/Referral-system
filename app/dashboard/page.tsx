import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getReferralSummary } from "@/lib/referral";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ReferralTicket from "@/components/dashboard/ReferralTicket";
import ReferralHistoryTable from "@/components/dashboard/ReferralHistoryTable";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default async function DashboardPage() {
  // The UI never decides whether a user is authenticated -- this check
  // happens server-side, on every request, before any data is fetched.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const summary = await getReferralSummary(user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const referralUrl = `${appUrl}/register?ref=${summary.referralCode}`;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink">Welcome, {user.name}</h1>
        </div>
        <LogoutButton />
      </header>

      <div className="flex flex-col gap-6">
        <SummaryCards
          points={summary.points}
          totalReferrals={summary.totalReferrals}
          referralCode={summary.referralCode}
        />
        <ReferralTicket referralUrl={referralUrl} />
        <div>
          <h2 className="mb-3 font-display text-lg font-medium text-ink">Referral history</h2>
          <ReferralHistoryTable referrals={summary.referrals} />
        </div>
      </div>
    </main>
  );
}
