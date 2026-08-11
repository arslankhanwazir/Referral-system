import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { generateReferralCode } from "./security";

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "DuplicateEmailError";
  }
}

// Generates a referral code and confirms it isn't already taken. Collisions
// are astronomically unlikely (32^8 keyspace) but checked anyway, and the
// column also carries a DB-level unique constraint as a final backstop.
async function uniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique referral code, please retry");
}

type RegisterParams = {
  name: string;
  email: string;
  passwordHash: string;
  referralCode?: string;
};

// The critical path from the assessment spec: user creation, referral
// recording, and the referrer's point increment all happen inside one
// transaction, so a crash mid-way never leaves partial points behind.
//
// Duplicate rewards are impossible even under concurrent requests because
// Referral.referredUserId is @unique at the schema level -- a newly created
// user id can only ever be attached to one Referral row, full stop.
export async function registerUserWithReferral(params: RegisterParams) {
  const { name, email, passwordHash, referralCode } = params;
  const newCode = await uniqueReferralCode();

  try {
    return await prisma.$transaction(async (tx) => {
      const referrer = referralCode
        ? await tx.user.findUnique({ where: { referralCode } })
        : null;

      const user = await tx.user.create({
        data: { name, email, passwordHash, referralCode: newCode },
      });

      // referrer.id !== user.id guards against self-referral. It can only
      // ever trip if a user's own referral code were somehow submitted on
      // their own registration, which is impossible today since the code
      // is generated after this point -- kept as defense in depth.
      if (referrer && referrer.id !== user.id) {
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            pointsAwarded: 10,
          },
        });

        await tx.user.update({
          where: { id: referrer.id },
          data: { points: { increment: 10 } },
        });
      }

      return user;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Unique constraint violation. In this flow that can only be the
      // email column (referredUserId can't collide -- it's a freshly
      // created id) -- e.g. two concurrent registrations for the same
      // address. Surface a safe, generic error to the client.
      throw new DuplicateEmailError();
    }
    throw err;
  }
}

export async function getReferralSummary(userId: string) {
  const [user, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, referralCode: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        referredUser: { select: { name: true, email: true, createdAt: true } },
      },
    }),
  ]);

  return {
    points: user?.points ?? 0,
    referralCode: user?.referralCode ?? "",
    totalReferrals: referrals.length,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredName: r.referredUser.name,
      referredEmail: r.referredUser.email,
      pointsAwarded: r.pointsAwarded,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}
