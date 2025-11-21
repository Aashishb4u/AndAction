import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "artist") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { youtubeChannelId, instagramId } = await req.json();

  const updated = await prisma.artist.update({
    where: { userId: session.user.id },
    data: {
      youtubeChannelId: youtubeChannelId ?? undefined,
      instagramId: instagramId ?? undefined,
    },
  });

  return NextResponse.json({ success: true, artist: updated });
}
