-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "countryCode" TEXT,
    "phoneNumber" TEXT,
    "password" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "zip" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isAccountVerified" BOOLEAN NOT NULL DEFAULT false,
    "isArtistVerified" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "googleId" TEXT,
    "facebookId" TEXT,
    "appleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stageName" TEXT,
    "artistType" TEXT,
    "subArtistType" TEXT,
    "achievements" TEXT,
    "yearsOfExperience" INTEGER,
    "shortBio" TEXT,
    "performingLanguage" TEXT,
    "performingEventType" TEXT,
    "performingStates" TEXT,
    "performingDurationFrom" TEXT,
    "performingDurationTo" TEXT,
    "performingMembers" TEXT,
    "offStageMembers" TEXT,
    "contactNumber" TEXT,
    "whatsappNumber" TEXT,
    "contactEmail" TEXT,
    "soloChargesFrom" DECIMAL(10,2),
    "soloChargesTo" DECIMAL(10,2),
    "soloChargesDescription" TEXT,
    "chargesWithBacklineFrom" DECIMAL(10,2),
    "chargesWithBacklineTo" DECIMAL(10,2),
    "chargesWithBacklineDescription" TEXT,
    "youtubeChannelId" TEXT,
    "instagramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "artists_userId_key" ON "artists"("userId");

-- CreateIndex
CREATE INDEX "artists_userId_idx" ON "artists"("userId");

-- CreateIndex
CREATE INDEX "artists_artistType_idx" ON "artists"("artistType");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
