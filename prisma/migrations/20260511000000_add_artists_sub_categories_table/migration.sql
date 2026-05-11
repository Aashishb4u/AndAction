CREATE TABLE "artists_sub_categories" (
  "id" SERIAL NOT NULL,
  "category_id" TEXT NOT NULL,
  "sub_category_label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artists_sub_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artists_sub_categories_category_id_sub_category_label_key" ON "artists_sub_categories"("category_id", "sub_category_label");
CREATE INDEX "artists_sub_categories_category_id_idx" ON "artists_sub_categories"("category_id");

ALTER TABLE "artists_sub_categories" ADD CONSTRAINT "artists_sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "artist_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
