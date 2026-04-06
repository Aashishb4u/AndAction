import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.video.count({
    where: {
      youtubeVideoId: {
        contains: "insta",
      },
    },
  });
  // console.log(`Deleted ${result} instagram videos`);
  // delete all videos with youtubeVideoId containing "insta"
  console.log(`Found ${count} videos with youtubeVideoId containing "insta"`);
  const result = await prisma.video.deleteMany({
    where: {
      youtubeVideoId: {
        contains: "insta",
      },
    },
  });
  console.log(
    `Deleted ${result.count} videos with youtubeVideoId containing "insta"`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
