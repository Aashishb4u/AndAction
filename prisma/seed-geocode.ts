import { PrismaClient } from "@prisma/client";
import { geocodeAddress } from "../lib/geocoding";

const prisma = new PrismaClient();

async function main() {
  console.log("🌍 Starting geocoding of artist locations...\n");

  try {
    const artistUsers = await prisma.user.findMany({
      where: {
        role: "artist",
        city: { not: null },
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
      },
    });

    console.log(`📊 Found ${artistUsers.length} artists to geocode\n`);

    if (artistUsers.length === 0) {
      console.log("✅ All artists already have coordinates!");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < artistUsers.length; i++) {
      const user = artistUsers[i];
      const progress = `[${i + 1}/${artistUsers.length}]`;

      // Skip if already has coordinates
      if (user.latitude && user.longitude) {
        console.log(`${progress} ⏭️  Skipping ${user.city} - already has coordinates`);
        skippedCount++;
        continue;
      }

      console.log(`${progress} 🔍 Geocoding: ${user.city}, ${user.state || "India"}...`);

      try {
        const coords = await geocodeAddress(user.city!, user.state || undefined);

        if (coords) {
          // Update user with coordinates
          await prisma.user.update({
            where: { id: user.id },
            data: {
              latitude: coords.lat,
              longitude: coords.lng,
              geocodedAt: new Date(),
            },
          });

          console.log(
            `${progress} ✅ Success: ${user.city} → (${coords.lat}, ${coords.lng})\n`
          );
          successCount++;

          // Rate limiting: wait 300ms between requests to be respectful to APIs
          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          console.log(`${progress} ❌ Failed: Could not geocode ${user.city}\n`);
          failCount++;
        }
      } catch (error) {
        console.error(`${progress} ❌ Error geocoding ${user.city}:`, error);
        failCount++;
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 GEOCODING SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully geocoded: ${successCount}`);
    console.log(`⏭️  Skipped (already had coords): ${skippedCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total processed: ${artistUsers.length}`);
    console.log("=".repeat(60) + "\n");

    // Show some statistics
    const totalGeocoded = await prisma.user.count({
      where: {
        role: "artist",
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const totalArtists = await prisma.user.count({
      where: { role: "artist" },
    });

    console.log(`🎯 Overall Progress: ${totalGeocoded}/${totalArtists} artists have coordinates`);
    console.log(
      `   (${Math.round((totalGeocoded / totalArtists) * 100)}% complete)\n`
    );

  } catch (error) {
    console.error("❌ Fatal error during geocoding:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Geocoding completed successfully!");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Geocoding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
