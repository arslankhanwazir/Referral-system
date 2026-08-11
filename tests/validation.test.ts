import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, normalizeEmail } from "@/lib/validation";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Ada@Example.COM  ")).toBe("ada@example.com");
  });
});

describe("registerSchema", () => {
  it("accepts valid input without a referral code", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correcthorse1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password with no digits", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "onlyletters",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 10 characters", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "not-an-email",
      password: "correcthorse1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty or too-short name", () => {
    const result = registerSchema.safeParse({
      name: "A",
      email: "ada@example.com",
      password: "correcthorse1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts well-formed credentials", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });
});
