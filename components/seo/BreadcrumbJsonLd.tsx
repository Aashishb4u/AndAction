"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

function toTitleCase(input: string): string {
  const cleaned = input.replace(/[-_]+/g, " ").trim();
  if (!cleaned) return cleaned;
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function BreadcrumbJsonLd({ siteUrl }: { siteUrl: string }) {
  const pathname = usePathname() || "/";

  const jsonLd = useMemo(() => {
    const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
    const segments = pathname.split("/").filter(Boolean);
    const items: Array<{ name: string; item: string }> = [];

    items.push({ name: "Home", item: `${normalizedSiteUrl}/` });

    let acc = "";
    for (const seg of segments) {
      acc += `/${seg}`;
      items.push({
        name: toTitleCase(decodeURIComponent(seg)),
        item: `${normalizedSiteUrl}${acc}`,
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: it.name,
        item: it.item,
      })),
    };
  }, [pathname, siteUrl]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

