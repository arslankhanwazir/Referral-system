"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Sign in failed. Please try again.");
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
      <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="ada@example.com" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Your password"
      />
      <Button type="submit" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
