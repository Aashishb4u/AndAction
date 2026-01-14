import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface BackupArtist {
  email: string;
  city_of_origin?: string;
  full_name?: string;
  phone?: string;
}

async function main() {
  console.log("🏙️  Starting city migration from backup...\n");

  try {
    // Read backup JSON file
    const backupPath = path.join(process.cwd(), "backup", "andaction.artists.json");
    
    if (!fs.existsSync(backupPath)) {
      console.error("❌ Backup file not found at:", backupPath);
      console.log("Please ensure backup/andaction.artists.json exists");
      process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, "utf-8")) as BackupArtist[];
    
    console.log(`📊 Found ${backupData.length} artists in backup file\n`);

    let successCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let geocodedCount = 0;

    for (let i = 0; i < backupData.length; i++) {
      const artist = backupData[i];
      const progress = `[${i + 1}/${backupData.length}]`;

      // Skip if no email
      if (!artist.email) {
        console.log(`${progress} ⏭️  Skipping - no email`);
        skippedCount++;
        continue;
      }

      // Skip if no city
      if (!artist.city_of_origin) {
        console.log(`${progress} ⏭️  Skipping ${artist.email} - no city_of_origin`);
        skippedCount++;
        continue;
      }

      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: artist.email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        });

        if (!user) {
          console.log(`${progress} ❓ User not found: ${artist.email}`);
          notFoundCount++;
          continue;
        }

        // Check if user already has city
        if (user.city && user.city === artist.city_of_origin) {
          console.log(`${progress} ✓ Already has city: ${artist.email} → ${user.city}`);
          skippedCount++;
          continue;
        }

        // Update user with city from backup
        const updateData: any = {
          city: artist.city_of_origin,
        };

        // If user doesn't have coordinates, we'll geocode later
        const needsGeocoding = !user.latitude || !user.longitude;

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        console.log(
          `${progress} ✅ Updated: ${artist.email} → ${artist.city_of_origin}${
            needsGeocoding ? " (needs geocoding)" : ""
          }`
        );
        
        successCount++;
        if (needsGeocoding) geocodedCount++;

      } catch (error: any) {
        console.error(`${progress} ❌ Error updating ${artist.email}:`, error.message);
        errorCount++;
      }

      // Add small delay to avoid overwhelming the database
      if (i % 50 === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 CITY MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️  Skipped (no email/city or already set): ${skippedCount}`);
    console.log(`❓ User not found in database: ${notFoundCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${backupData.length}`);
    console.log("=".repeat(60) + "\n");

    // Suggest next steps
    if (geocodedCount > 0) {
      console.log(`💡 Next step: Run geocoding for ${geocodedCount} artists:`);
      console.log("   npm run db:seed:geocode\n");
    }

    // Show statistics
    const totalArtistsWithCity = await prisma.user.count({
      where: {
        role: "artist",
        city: { not: null },
      },
    });

    const totalArtists = await prisma.user.count({
      where: { role: "artist" },
    });

    console.log(`🎯 Overall Progress: ${totalArtistsWithCity}/${totalArtists} artists have city`);
    console.log(`   (${Math.round((totalArtistsWithCity / totalArtists) * 100)}% complete)\n`);

  } catch (error) {
    console.error("❌ Fatal error during city migration:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ City migration completed successfully!");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ City migration failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
