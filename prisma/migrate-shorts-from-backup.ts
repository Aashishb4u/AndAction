import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type ShortsBackupItem = {
  youtubeVideoId?: string;
};

type ShortsBackupFile = {
  shorts?: ShortsBackupItem[];
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const customFilePath = getArgValue("--file");
  const backupFilePath = customFilePath
    ? path.resolve(process.cwd(), customFilePath)
    : path.join(process.cwd(), "backup", "migration_shorts.json");

  console.log("Starting shorts migration...");
  console.log(`Source file: ${backupFilePath}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "APPLY CHANGES"}`);

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  const fileText = fs.readFileSync(backupFilePath, "utf-8");
  const parsed = JSON.parse(fileText) as ShortsBackupFile;

  const shorts = Array.isArray(parsed.shorts) ? parsed.shorts : [];
  const videoIds = Array.from(
    new Set(
      shorts
        .map((item) => (item.youtubeVideoId ?? "").trim())
        .filter((id) => id.length > 0),
    ),
  );

  if (videoIds.length === 0) {
    console.log(
      "No youtubeVideoId values found in shorts payload. Nothing to do.",
    );
    return;
  }

  console.log(`Unique shorts IDs in backup: ${videoIds.length}`);

  const chunks = chunkArray(videoIds, 500);

  let matchedCount = 0;
  let alreadyShortCount = 0;
  let updatableCount = 0;
  let updatedCount = 0;

  for (const idsChunk of chunks) {
    const matchedInChunk = await prisma.video.count({
      where: {
        youtubeVideoId: { in: idsChunk },
      },
    });

    const alreadyShortInChunk = await prisma.video.count({
      where: {
        youtubeVideoId: { in: idsChunk },
        isShort: true,
      },
    });

    matchedCount += matchedInChunk;
    alreadyShortCount += alreadyShortInChunk;
    updatableCount += matchedInChunk - alreadyShortInChunk;

    if (!dryRun) {
      const result = await prisma.video.updateMany({
        where: {
          youtubeVideoId: { in: idsChunk },
          isShort: false,
        },
        data: {
          isShort: true,
        },
      });

      updatedCount += result.count;
    }
  }

  console.log("\nMigration summary:");
  console.log(`Rows matched by youtubeVideoId: ${matchedCount}`);
  console.log(`Rows already marked isShort=true: ${alreadyShortCount}`);
  console.log(`Rows eligible for update: ${updatableCount}`);

  if (dryRun) {
    console.log("Dry run complete. No database rows were updated.");
  } else {
    console.log(`Rows updated to isShort=true: ${updatedCount}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Shorts migration failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
