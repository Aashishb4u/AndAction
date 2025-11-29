"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function deleteInstagramVideo(
  videoId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Find the video and verify ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { userId: true, source: true },
    });

    if (!video) {
      return { success: false, message: "Video not found" };
    }

    if (video.userId !== session.user.id) {
      return { success: false, message: "You can only delete your own videos" };
    }

    if (video.source !== "instagram") {
      return { success: false, message: "This is not an Instagram video" };
    }

    // Delete the video from database (not from Instagram)
    await prisma.video.delete({
      where: { id: videoId },
    });

    revalidatePath("/artist/profile");

    return { success: true, message: "Video removed successfully" };
  } catch (error) {
    console.error("Error deleting Instagram video:", error);
    return { success: false, message: "Failed to delete video" };
  }
}

export async function deleteInstagramReel(
  reelId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    // Find the reel and verify ownership
    const reel = await prisma.video.findUnique({
      where: { id: reelId },
      select: { userId: true, source: true, isShort: true },
    });

    if (!reel) {
      return { success: false, message: "Reel not found" };
    }

    if (reel.userId !== session.user.id) {
      return { success: false, message: "You can only delete your own reels" };
    }

    if (reel.source !== "instagram" || !reel.isShort) {
      return { success: false, message: "This is not an Instagram reel" };
    }

    // Delete the reel from database (not from Instagram)
    await prisma.video.delete({
      where: { id: reelId },
    });

    revalidatePath("/artist/profile");

    return { success: true, message: "Reel removed successfully" };
  } catch (error) {
    console.error("Error deleting Instagram reel:", error);
    return { success: false, message: "Failed to delete reel" };
  }
}
