import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "salin_admin_session";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "salin-radio-demo-secret";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function checkAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL || "admin@salinradio.demo";
  const expectedPassword = process.env.ADMIN_PASSWORD || "salinradio-demo";
  return email === expectedEmail && password === expectedPassword;
}

export function createSessionToken(email: string): string {
  const payload = `${email}.${Date.now()}`;
  const signature = sign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
