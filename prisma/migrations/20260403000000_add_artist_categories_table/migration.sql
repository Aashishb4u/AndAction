CREATE TABLE "artist_categories" (
  "id" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artist_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_categories_value_key" ON "artist_categories"("value");
CREATE INDEX "artist_categories_sortOrder_idx" ON "artist_categories"("sortOrder");
CREATE INDEX "artist_categories_isActive_idx" ON "artist_categories"("isActive");

INSERT INTO "artist_categories" ("id", "value", "label", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('cat_singer', 'singer', 'Singer', 1, true, NOW(), NOW()),
  ('cat_spiritual', 'spiritual', 'Spiritual / Devotional Singer', 2, true, NOW(), NOW()),
  ('cat_dancer', 'dancer', 'Dancer / Dance Group', 3, true, NOW(), NOW()),
  ('cat_musician', 'musician', 'Musician / Instrumentalist', 4, true, NOW(), NOW()),
  ('cat_comedian', 'comedian', 'Comedian', 5, true, NOW(), NOW()),
  ('cat_mimicry', 'mimicry', 'Mimicry / Impressionist', 6, true, NOW(), NOW()),
  ('cat_magician', 'magician', 'Magician / Illusionist', 7, true, NOW(), NOW()),
  ('cat_actor', 'actor', 'Theatre Artist / Actor', 8, true, NOW(), NOW()),
  ('cat_anchor', 'anchor', 'Anchor / Emcee / Host', 9, true, NOW(), NOW()),
  ('cat_live_band', 'Live Band', 'Live Band / Group', 10, true, NOW(), NOW()),
  ('cat_dj', 'dj', 'DJ / VJ', 11, true, NOW(), NOW()),
  ('cat_dj_percussionist', 'dj-percussionist', 'DJ Percussionist', 12, true, NOW(), NOW()),
  ('cat_special_act', 'special-act', 'Special Act Performer', 13, true, NOW(), NOW()),
  ('cat_kids_entertainer', 'kids-entertainer', 'Kids Entertainer', 14, true, NOW(), NOW()),
  ('cat_poet', 'poet', 'Poet / Shayari Artist', 15, true, NOW(), NOW()),
  ('cat_speaker', 'speaker', 'Speaker / Motivational Artist', 16, true, NOW(), NOW());
