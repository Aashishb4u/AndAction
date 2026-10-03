import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import DevotionalServiceView from "@/components/services/DevotionalServiceView";
import { DEVOTIONAL_SERVICES, getDevotionalService } from "@/lib/devotional-services";
import { getServiceArtists } from "@/lib/get-service-artists";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DEVOTIONAL_SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getDevotionalService(slug);
  if (!service) return {};

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/services/${service.slug}`;

  return {
    title: service.title,
    description: service.description,
    keywords: service.keywords.join(", "),
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: service.title,
      description: service.description,
      url: canonical,
      siteName: "ANDACTION",
      type: "website",
    },
  };
}

export const revalidate = 3600;

export default async function DevotionalServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getDevotionalService(slug);
  if (!service) notFound();

  const { matched, related } = await getServiceArtists(service.artistKeywords);

  return (
    <SiteLayout>
      <div className="pt-24">
        <DevotionalServiceView service={service} matched={matched} related={related} />
      </div>
    </SiteLayout>
  );
}
