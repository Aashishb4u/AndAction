import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role");
  console.log(`Role: ${role}`);
  const redirect = searchParams.get("redirect") || "/";

  try {
    const session = await auth();

    if (session?.user?.id && role === "artist") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          createdAt: true,
          role: true,
          artist: true,
        },
      });

      if (!user) {
        console.error("OAuth callback: User not found");
        return NextResponse.redirect(new URL("/", request.url));
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isNewUser = user.createdAt > fiveMinutesAgo;
      const isDefaultRole = user.role === "user";

      if (!isNewUser || !isDefaultRole) {
        console.warn(
          `OAuth callback: Blocked role change attempt for user ${session.user.id}. ` +
            `isNewUser: ${isNewUser}, isDefaultRole: ${isDefaultRole}`
        );
        if (user.role === "artist") {
          return NextResponse.redirect(
            new URL("/artist/dashboard", request.url)
          );
        }
        return NextResponse.redirect(new URL(redirect, request.url));
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "artist" },
      });

      if (!user.artist) {
        await prisma.artist.create({
          data: {
            userId: session.user.id,
          },
        });
      }

      return NextResponse.redirect(
        new URL("/artist/profile-setup", request.url)
      );
    }

    return NextResponse.redirect(new URL(redirect, request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}