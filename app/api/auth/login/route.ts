import { NextResponse } from "next/server";
import { loginSchema, normalizeEmail } from "@/lib/validation";
import { verifyPassword } from "@/lib/security";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const key = clientKeyFromRequest(req, "login");
  const { allowed } = rateLimit(key, { limit: 8, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic message whether the account doesn't exist or the password
  // is wrong -- avoids account enumeration via response differences.
  const invalidCredentials = () =>
    NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user) return invalidCredentials();

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) return invalidCredentials();

  await createSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 200 });
}
