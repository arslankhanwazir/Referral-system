import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Get started</p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">Create your account</h1>
        </div>
        <div className="rounded-card border border-line bg-white p-6 shadow-sm">
          <RegisterForm initialReferralCode={searchParams.ref} />
        </div>
        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:text-accentDark">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
