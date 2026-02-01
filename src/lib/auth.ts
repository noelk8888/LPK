import crypto from "crypto";

export const AUTH_COOKIE_NAME = "dashboard_session";

// Simple HMAC-based session token: timestamp + HMAC signature
export function createSessionToken(): string {
  const secret = process.env.DASHBOARD_PASSWORD!;
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${hmac}`;
}

export function validateSessionToken(token: string): boolean {
  try {
    const secret = process.env.DASHBOARD_PASSWORD!;
    const [timestamp, signature] = token.split(".");
    if (!timestamp || !signature) return false;

    // Check if token is expired (7 days)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 7 * 24 * 60 * 60 * 1000) return false;

    // Verify HMAC with timing-safe comparison
    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(timestamp)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}
