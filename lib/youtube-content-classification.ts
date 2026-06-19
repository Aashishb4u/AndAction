const YT_SHORTS_TAG_REGEX = /(^|\s)#shorts(\s|$)/i;
const DEFAULT_CONCURRENCY = 5;

interface YouTubeShortDetectionInput {
  id: string;
  title?: string | null;
  description?: string | null;
}

function hasExplicitShortsMarker(input: YouTubeShortDetectionInput): boolean {
  const combinedText = `${input.title || ""} ${input.description || ""}`;
  return YT_SHORTS_TAG_REGEX.test(combinedText);
}

async function resolveYouTubeShortStatus(videoId: string): Promise<boolean> {
  const shortsUrl = `https://www.youtube.com/shorts/${videoId}`;

  for (const method of ["HEAD", "GET"] as const) {
    try {
      const response = await fetch(shortsUrl, {
        method,
        redirect: "follow",
        cache: "no-store",
        headers: {
          Accept: "text/html",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        },
      });

      const finalUrl = response.url || shortsUrl;

      if (finalUrl.includes(`/shorts/${videoId}`)) {
        return true;
      }

      if (finalUrl.includes(`watch?v=${videoId}`)) {
        return false;
      }
    } catch (error) {
      console.warn(`Failed to detect YouTube Shorts status for ${videoId}:`, error);
    }
  }

  return false;
}

export async function detectYouTubeShortIds(
  videos: YouTubeShortDetectionInput[],
  concurrency = DEFAULT_CONCURRENCY
): Promise<Set<string>> {
  const shortIds = new Set<string>();
  const remainingVideos: YouTubeShortDetectionInput[] = [];

  for (const video of videos) {
    if (hasExplicitShortsMarker(video)) {
      shortIds.add(video.id);
      continue;
    }

    remainingVideos.push(video);
  }

  if (remainingVideos.length === 0) {
    return shortIds;
  }

  let currentIndex = 0;
  const workerCount = Math.min(concurrency, remainingVideos.length);

  async function worker() {
    while (currentIndex < remainingVideos.length) {
      const nextIndex = currentIndex++;
      const video = remainingVideos[nextIndex];

      if (await resolveYouTubeShortStatus(video.id)) {
        shortIds.add(video.id);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return shortIds;
}
