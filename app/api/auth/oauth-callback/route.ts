import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkProfileCompletion } from "@/lib/profile-completion";

/**
 * Post-OAuth landing route.
 *
 * Every Google/Facebook sign-in comes through here (see lib/auth.ts) so the
 * profile-completeness check runs for BOTH roles, not just artist signups.
 * OAuth providers only give us name/email/avatar, so anyone signing in this
 * way still has to finish the signup form.
 */

/**
 * Canonical base for post-OAuth redirects. request.url is only a fallback:
 * behind a reverse proxy that doesn't forward Host it points at the internal
 * localhost origin, which would bounce users to localhost after Google login.
 */
function getRedirectBase(request: NextRequest): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.url
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role");
  const redirect = searchParams.get("redirect") || "/";
  const base = getRedirectBase(request);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.warn("OAuth callback: no session, sending to sign-in");
      return NextResponse.redirect(new URL("/auth/signin", base));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        state: true,
        city: true,
        dob: true,
        gender: true,
        address: true,
        zip: true,
      },
    });

    if (!user) {
      console.error("OAuth callback: User not found");
      return NextResponse.redirect(new URL("/", base));
    }

    let effectiveRole = user.role;

    // Role elevation, only for a genuine artist signup. Kept as-is: a account
    // that already exists must not be flipped to artist by replaying this URL.
    if (role === "artist") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isNewUser = user.createdAt > fiveMinutesAgo;
      const isDefaultRole = user.role === "user";

      if (isNewUser && isDefaultRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "artist" },
        });
        effectiveRole = "artist";
        console.log(`OAuth callback: elevated user ${user.id} to artist`);
      } else if (!isDefaultRole) {
        // Already an artist - normal repeat sign-in, not an escalation attempt.
        console.log(
          `OAuth callback: user ${user.id} is already role=${user.role}`,
        );
      } else {
        console.warn(
          `OAuth callback: refused role change for user ${user.id} ` +
            `(isNewUser: ${isNewUser}, isDefaultRole: ${isDefaultRole})`,
        );
      }
    }

    // The missing step: send anyone with an unfinished profile to the right
    // Complete Profile page, whatever their role and however old the account.
    const completion = checkProfileCompletion({ ...user, role: effectiveRole });

    if (!completion.isComplete) {
      console.log(
        `OAuth callback: profile incomplete for ${user.id} (role=${effectiveRole}), ` +
          `missing [${completion.missingFields.join(", ")}] -> ${completion.completeProfilePath}`,
      );
      return NextResponse.redirect(
        new URL(completion.completeProfilePath, base),
      );
    }

    if (effectiveRole === "artist") {
      return NextResponse.redirect(new URL("/artist/dashboard", base));
    }

    return NextResponse.redirect(new URL(redirect, base));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/", base));
  }
}
