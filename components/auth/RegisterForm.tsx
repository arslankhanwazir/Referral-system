"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export default function RegisterForm({ initialReferralCode }: { initialReferralCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      referralCode: String(form.get("referralCode") ?? ""),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Registration failed. Please try again.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <p role="alert" className="rounded-card bg-warn/10 px-3.5 py-2.5 text-sm text-warn">
          {formError}
        </p>
      )}
      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        placeholder="Ada Lovelace"
        error={fieldErrors.name?.[0]}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="ada@example.com"
        error={fieldErrors.email?.[0]}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="At least 10 characters"
        error={fieldErrors.password?.[0]}
      />
      <Field
        label="Referral code (optional)"
        name="referralCode"
        placeholder="e.g. 7K3PMXQ2"
        defaultValue={initialReferralCode}
      />
      <Button type="submit" loading={loading}>
        Create account
      </Button>
    </form>
  );
}
