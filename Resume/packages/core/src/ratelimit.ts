import { prisma } from "./prisma";

/**
 * Check whether a userId+endpoint combination is within the allowed rate.
 * Uses Prisma for persistent tracking across serverless instances.
 * 
 * @param userId   The authenticated user's ID
 * @param endpoint A short string identifying the route (e.g. "interview")
 * @param max      Maximum requests allowed per minute (default: 10)
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  max = 10,
): Promise<boolean> {
  const key = `${userId}:${endpoint}`;
  const now = new Date();

  try {
    // 1. Find or create the rate limit record
    const entry = await prisma.rateLimit.upsert({
      where: { key },
      update: {},
      create: {
        key,
        count: 0,
        resetAt: new Date(now.getTime() + 60_000), // 1 minute window
      },
    });

    // 2. If the window has expired, reset it
    if (now > entry.resetAt) {
      await prisma.rateLimit.update({
        where: { key },
        data: {
          count: 1,
          resetAt: new Date(now.getTime() + 60_000),
        },
      });
      return true;
    }

    // 3. If within limit, increment
    if (entry.count >= max) {
      return false;
    }

    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });

    return true;
  } catch (error) {
    console.error("[RateLimit] Database failure:", error);
    // Fail open (allow request) to prevent blocking users on DB issues,
    // but log it for investigation.
    return true;
  }
}
