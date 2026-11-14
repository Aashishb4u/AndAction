import type { Metadata } from "next";
import { getArtistSeo } from "@/lib/artist-seo";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtistSeo(id);
  const path = `/artists/${id}`;

  if (!artist) {
    return { title: "Artist | ANDACTION", alternates: { canonical: path } };
  }

  const place = [artist.city, artist.state].filter(Boolean).join(", ");
  const role = artist.category ? `${artist.name} - ${artist.category}` : artist.name;
  const title = `${role}${place ? ` in ${place}` : ""} | Book on ANDACTION`;
  const fallback = `Book ${artist.name}${artist.category ? `, ${artist.category}` : ""}${place ? ` from ${place}` : ""} for your wedding, event or devotional programme. See videos, details and send a booking request on ANDACTION.`;
  const description = truncate(artist.bio || fallback, 157);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "profile",
      ...(artist.image ? { images: [{ url: artist.image, alt: artist.name }] } : {}),
    },
    twitter: {
      card: artist.image ? "summary_large_image" : "summary",
      title,
      description,
      ...(artist.image ? { images: [artist.image] } : {}),
    },
  };
}

export default function ArtistDetailLayout({ children }: Pick<Props, "children">) {
  return children;
}
