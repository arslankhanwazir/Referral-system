"use client";

import { useState } from "react";

export default function ReferralTicket({ referralUrl }: { referralUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-white">
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-ink/50">Your referral link</p>
        <p className="mt-2 truncate rounded-lg bg-paper px-3.5 py-2.5 font-mono text-sm text-ink">
          {referralUrl}
        </p>
      </div>

      {/* Ticket-stub divider: dashed rule with circular cutouts at each edge */}
      <div className="relative border-t border-dashed border-line">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-paper" aria-hidden="true" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-paper" aria-hidden="true" />
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm text-ink/60">Share it — every signup earns you 10 points</p>
          <button
            onClick={copyLink}
            className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentDark"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
