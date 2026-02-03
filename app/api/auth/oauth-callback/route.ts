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

      // Update role to artist but don't create artist profile yet
      // User should go through the full signup flow to provide required info
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "artist" },
      });

      // Don't create artist profile yet - let them go through signup flow
      // Redirect to artist auth page with OAuth success flag
      // The page will detect they're logged in and show remaining fields
      return NextResponse.redirect(
        new URL("/artist/profile-setup?oauth=true", request.url)
      );
    }

    return NextResponse.redirect(new URL(redirect, request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}