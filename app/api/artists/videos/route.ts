import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source"); // "youtube" | "instagram" | null (all)
    const type = searchParams.get("type"); // "video" | "short" | null (all)

    // Build where clause
    const where: {
      userId: string;
      source?: string;
      isShort?: boolean;
    } = {
      userId: session.user.id,
    };

    if (source) {
      where.source = source;
    }

    if (type === "video") {
      where.isShort = false;
    } else if (type === "short") {
      where.isShort = true;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        thumbnailUrl: true,
        duration: true,
        durationFormatted: true,
        views: true,
        publishedAt: true,
        isShort: true,
        source: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching artist videos:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
