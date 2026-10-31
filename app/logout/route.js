import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(req) {
  await logout();
  return NextResponse.redirect(new URL("/login", req.url), 303);
}
