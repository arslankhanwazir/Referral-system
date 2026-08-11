/**
 * Integration tests for the referral transaction logic.
 *
 * These hit a real PostgreSQL database (point DATABASE_URL at a disposable
 * test database, e.g. `referral_db_test`) because the behavior under test
 * -- unique constraints, transaction atomicity -- can't be meaningfully
 * verified against a mock. Run with:
 *
 *   DATABASE_URL="postgresql://.../referral_db_test" npx prisma migrate deploy
 *   DATABASE_URL="postgresql://.../referral_db_test" npx vitest run tests/referral.integration.test.ts
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { registerUserWithReferral, DuplicateEmailError, getReferralSummary } from "@/lib/referral";

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

d("registerUserWithReferral", () => {
  beforeEach(async () => {
    // Clean slate between tests -- Referral rows cascade-delete with User.
    await prisma.user.deleteMany({ where: { email: { contains: "@test.local" } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a user without a referral code and awards no points", async () => {
    const user = await registerUserWithReferral({
      name: "No Referrer",
      email: "no-referrer@test.local",
      passwordHash: "hash",
    });
    const summary = await getReferralSummary(user.id);
    expect(summary.points).toBe(0);
    expect(summary.totalReferrals).toBe(0);
  });

  it("awards exactly 10 points to the referrer on a valid referral", async () => {
    const referrer = await registerUserWithReferral({
      name: "Referrer",
      email: "referrer@test.local",
      passwordHash: "hash",
    });

    await registerUserWithReferral({
      name: "Referred",
      email: "referred@test.local",
      passwordHash: "hash",
      referralCode: referrer.referralCode,
    });

    const summary = await getReferralSummary(referrer.id);
    expect(summary.points).toBe(10);
    expect(summary.totalReferrals).toBe(1);
  });

  it("awards no points when the referral code does not exist", async () => {
    const user = await registerUserWithReferral({
      name: "Bad Code",
      email: "bad-code@test.local",
      passwordHash: "hash",
      referralCode: "NOTAREALCODE",
    });
    const summary = await getReferralSummary(user.id);
    expect(summary.points).toBe(0);
  });

  it("rejects duplicate email registration", async () => {
    await registerUserWithReferral({
      name: "First",
      email: "duplicate@test.local",
      passwordHash: "hash",
    });

    await expect(
      registerUserWithReferral({
        name: "Second",
        email: "duplicate@test.local",
        passwordHash: "hash",
      })
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it("cannot create two referral rewards for the same referred user", async () => {
    const referrer = await registerUserWithReferral({
      name: "Referrer Two",
      email: "referrer-two@test.local",
      passwordHash: "hash",
    });

    const referred = await registerUserWithReferral({
      name: "Referred Two",
      email: "referred-two@test.local",
      passwordHash: "hash",
      referralCode: referrer.referralCode,
    });

    // Attempting to attach a second Referral row to the same referredUserId
    // must fail at the database level (referredUserId is @unique).
    await expect(
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: referred.id,
          pointsAwarded: 10,
        },
      })
    ).rejects.toThrow();
  });
});
