"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function deleteVideo(
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
      select: { userId: true },
    });

    if (!video) {
      return { success: false, message: "Video not found" };
    }

    if (video.userId !== session.user.id) {
      return { success: false, message: "You can only delete your own videos" };
    }

    // Delete the video
    await prisma.video.delete({
      where: { id: videoId },
    });

    revalidatePath("/artist/profile");

    return { success: true, message: "Video deleted successfully" };
  } catch (error) {
    console.error("Error deleting video:", error);
    return { success: false, message: "Failed to delete video" };
  }
}
