import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  loading,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-card px-4 py-2.5 text-[15px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent text-white hover:bg-accentDark",
    ghost: "bg-transparent text-ink border border-line hover:bg-black/[0.03]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
