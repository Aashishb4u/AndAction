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

  // make all teh video to isApproved = true
  const approvedResult = await prisma.video.updateMany({
    where: {
      isApproved: false,
    },
    data: {
      isApproved: true,
    },
  });
  console.log(
    `Updated ${approvedResult.count} videos to be approved (isApproved = true)`,
  );

  const users = await prisma.user.findMany({
    where: {
      name: { not: null },
    },
  });

  let splitCount = 0;
  for (const user of users) {
    if (user.name) {
      const parts = user.name.split(" ");
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

      if (!user.firstName && !user.lastName) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
          },
        });
        splitCount++;
      }
    }
  }
  console.log(
    `Updated ${splitCount} users with split firstName and lastName from name`,
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
