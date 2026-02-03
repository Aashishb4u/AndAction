import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all artists from the database
    const artists = await prisma.artist.findMany({
      include: {
        user: true,
      },
    });
    return NextResponse.json({ success: true, data: { artists } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
