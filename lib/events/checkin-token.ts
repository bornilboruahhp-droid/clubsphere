import crypto from "crypto";

const SECRET =
  process.env.CHECKIN_SECRET ||
  "clubsphere-dev-default-checkin-secret-key-32chars";

/**
 * Returns the 60-second time bucket index for a timestamp.
 */
export function getCheckinBucket(timeMs = Date.now()): number {
  return Math.floor(timeMs / 60000);
}

/**
 * Returns seconds remaining until the current 60-second bucket rotates.
 */
export function getSecondsUntilNextBucket(timeMs = Date.now()): number {
  return 60 - Math.floor((timeMs % 60000) / 1000);
}

/**
 * Generates an HMAC-SHA256 token for an event and bucket, encoded in base64url.
 */
export function generateCheckinToken(
  eventId: string,
  bucket = getCheckinBucket()
): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${eventId}:${bucket}`)
    .digest("base64url");
}

/**
 * Verifies a token against the current bucket and the two previous buckets
 * using timing-safe comparisons.
 */
export function verifyCheckinToken(
  eventId: string,
  token: string,
  timeMs = Date.now()
): boolean {
  if (!token || typeof token !== "string") return false;

  const currentBucket = getCheckinBucket(timeMs);
  // Accepts the current bucket and the two previous buckets (up to 3 minutes window)
  const validBuckets = [currentBucket, currentBucket - 1, currentBucket - 2];

  const tokenBuf = Buffer.from(token);

  for (const b of validBuckets) {
    const expected = generateCheckinToken(eventId, b);
    const expectedBuf = Buffer.from(expected);

    if (tokenBuf.length === expectedBuf.length) {
      if (crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
        return true;
      }
    }
  }

  return false;
}
