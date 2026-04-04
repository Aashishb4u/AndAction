DELETE FROM "artist_categories";

INSERT INTO "artist_categories" ("id", "value", "label", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('cat_live_band', 'Live Band', 'Live Band', 1, true, NOW(), NOW()),
  ('cat_spiritual', 'spiritual', 'Devotional/Spiritual Singer', 2, true, NOW(), NOW()),
  ('cat_singer', 'singer', 'Singer', 3, true, NOW(), NOW()),
  ('cat_anchor', 'anchor', 'Anchor/Emcee/Host', 4, true, NOW(), NOW()),
  ('cat_dj', 'dj', 'DJ/VJ', 5, true, NOW(), NOW()),
  ('cat_dj_based_band', 'dj-based-band', 'DJ based Band', 6, true, NOW(), NOW()),
  ('cat_dj_percussionist', 'dj-percussionist', 'DJ Percussionist', 7, true, NOW(), NOW()),
  ('cat_musician', 'musician', 'Musician/Instrumentalist', 8, true, NOW(), NOW()),
  ('cat_dancer', 'dancer', 'Dancer/Dance group', 9, true, NOW(), NOW()),
  ('cat_magician', 'magician', 'Magicial/Illusionist', 10, true, NOW(), NOW()),
  ('cat_comedian_mimicry', 'comedian-mimicry', 'Comedian/Mimicry', 11, true, NOW(), NOW()),
  ('cat_special_act', 'special-act', 'Special act performer', 12, true, NOW(), NOW()),
  ('cat_motivational_speaker', 'motivational-speaker', 'Motivational speaker', 13, true, NOW(), NOW()),
  ('cat_kids_entertainer', 'kids-entertainer', 'Kids entertainer', 14, true, NOW(), NOW()),
  ('cat_folk_artist', 'folk-artist', 'Folk Artist', 15, true, NOW(), NOW()),
  ('cat_model', 'model', 'Model', 16, true, NOW(), NOW());
