UPDATE "artists"
SET "artistType" = CASE
  WHEN LOWER(TRIM("artistType")) IN ('live band', 'live band / group', 'band', 'bands') THEN 'Live Band'
  WHEN LOWER(TRIM("artistType")) IN ('devotional/spiritual singer', 'spiritual / devotional singer', 'devotional / spiritual singer', 'spiritual singer', 'spiritual') THEN 'spiritual'
  WHEN LOWER(TRIM("artistType")) IN ('singer') THEN 'singer'
  WHEN LOWER(TRIM("artistType")) IN ('anchor/emcee/host', 'anchor / emcee / host', 'anchor', 'emcee', 'host') THEN 'anchor'
  WHEN LOWER(TRIM("artistType")) IN ('dj/vj', 'dj / vj', 'dj') THEN 'dj'
  WHEN LOWER(TRIM("artistType")) IN ('dj based band', 'dj-based-band') THEN 'dj-based-band'
  WHEN LOWER(TRIM("artistType")) IN ('dj percussionist', 'dj-percussionist', 'djpercussionist') THEN 'dj-percussionist'
  WHEN LOWER(TRIM("artistType")) IN ('musician/instrumentalist', 'musician / instrumentalist', 'musician', 'instrumentalist') THEN 'musician'
  WHEN LOWER(TRIM("artistType")) IN ('dancer/dance group', 'dancer/dance group ', 'dancer / dance group', 'dancer/dance group', 'dancer/dance group', 'dancer', 'dance group') THEN 'dancer'
  WHEN LOWER(TRIM("artistType")) IN ('magicial/illusionist', 'magician/illusionist', 'magician / illusionist', 'magician', 'illusionist') THEN 'magician'
  WHEN LOWER(TRIM("artistType")) IN ('comedian/mimicry', 'comedian / mimicry', 'comedian', 'mimicry') THEN 'comedian-mimicry'
  WHEN LOWER(TRIM("artistType")) IN ('special act performer', 'special act performer ', 'special-act', 'special act') THEN 'special-act'
  WHEN LOWER(TRIM("artistType")) IN ('motivational speaker', 'speaker / motivational artist', 'speaker', 'motivational-speaker') THEN 'motivational-speaker'
  WHEN LOWER(TRIM("artistType")) IN ('kids entertainer', 'kids entertianer', 'kids-entertainer') THEN 'kids-entertainer'
  WHEN LOWER(TRIM("artistType")) IN ('folk artist', 'folk-artist') THEN 'folk-artist'
  WHEN LOWER(TRIM("artistType")) IN ('model') THEN 'model'
  ELSE "artistType"
END
WHERE "artistType" IS NOT NULL
  AND TRIM("artistType") <> '';
