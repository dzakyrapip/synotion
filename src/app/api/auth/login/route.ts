
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUsername = process.env.ADMIN_USERNAME ?? "";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "";

    const safeCompare = (a: string, b: string) => {
      const bufferA = Buffer.from(a);
      const bufferB = Buffer.from(b);

      return (
        bufferA.length === bufferB.length &&
        timingSafeEqual(bufferA, bufferB)
      );
    };

    const validUsername =
      typeof username === "string" &&
      safeCompare(username, adminUsername);

    const validPassword =
      typeof password === "string" &&
      safeCompare(password, adminPassword);

    if (!adminUsername || !adminPassword || !process.env.AUTH_SECRET) {
      return NextResponse.json(
        { message: "Konfigurasi login belum lengkap." },
        { status: 500 }
      );
    }

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { message: "Username atau password salah." },
        { status: 401 }
      );
    }

    const token = await createToken();

    const response = NextResponse.json({
      message: "Login berhasil.",
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Terjadi kesalahan saat login." },
      { status: 400 }
    );
  }
}
