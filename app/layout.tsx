import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referral System",
  description: "Refer a friend, earn points.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen antialiased">{children}</body>
    </html>
  );
}