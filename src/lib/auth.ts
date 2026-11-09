
import { SignJWT, jwtVerify } from "jose";

const getSecret = () => {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET belum dikonfigurasi.");
  }

  return new TextEncoder().encode(secret);
};

export async function createToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    return payload.role === "admin";
  } catch {
    return false;
  }
}
