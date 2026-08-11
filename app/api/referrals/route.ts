import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReferralSummary } from "@/lib/referral";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Scoped to the authenticated user's own id -- there is no way to pass a
  // different user id in and read someone else's referral data.
  const summary = await getReferralSummary(user.id);
  return NextResponse.json(summary);
}
