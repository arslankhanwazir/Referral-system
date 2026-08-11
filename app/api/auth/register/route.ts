import { NextResponse } from "next/server";
import { registerSchema, normalizeEmail } from "@/lib/validation";
import { hashPassword } from "@/lib/security";
import { registerUserWithReferral, DuplicateEmailError } from "@/lib/referral";
import { createSession } from "@/lib/auth";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const key = clientKeyFromRequest(req, "register");
  const { allowed } = rateLimit(key, { limit: 5, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, password } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const referralCode = parsed.data.referralCode ? parsed.data.referralCode.trim().toUpperCase() : undefined;

  const passwordHash = await hashPassword(password);

  try {
    const user = await registerUserWithReferral({ name, email, passwordHash, referralCode });
    await createSession(user.id);
    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    // Never leak internal error details (stack traces, DB errors) to the client.
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
