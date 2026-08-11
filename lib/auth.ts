import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "./db";
import { generateSessionToken } from "./security";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  points: number;
  createdAt: Date;
};

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  referralCode: true,
  points: true,
  createdAt: true,
} as const;

// Creates a DB-backed session row and sets the HttpOnly cookie. The cookie
// holds the raw token; only its hash ever touches the database, so a DB
// leak alone cannot be replayed as a valid session.
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Returns the authenticated user for the current request, or null.
// Also opportunistically clears expired sessions it encounters.
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: SAFE_USER_SELECT } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookies().delete(SESSION_COOKIE);
}

// Convenience guard for API routes / server components that require auth.
// Throws a typed error the route handler can map to a 401 response.
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
