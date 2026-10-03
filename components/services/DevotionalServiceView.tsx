import Link from "next/link";
import { buildArtishProfileUrl } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";
import type { DevotionalService } from "@/lib/devotional-services";
import type { ServiceArtistCard } from "@/lib/get-service-artists";
import { DEVOTIONAL_SERVICES } from "@/lib/devotional-services";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ArtistGrid({
  artists,
  emptyLabel,
}: {
  artists: ServiceArtistCard[];
  emptyLabel: string;
}) {
  if (!artists.length) {
    return <p className="text-text-light-gray leading-relaxed">{emptyLabel}</p>;
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {artists.map((artist) => {
        const image = artist.image ? buildArtishProfileUrl(artist.image) : "";
        const place = [artist.city, artist.state].filter(Boolean).join(", ");
        return (
          <li key={artist.id} className="min-w-0">
            <Link
              href={`/artists/${artist.id}`}
              className="block h-full rounded-xl border border-background-light bg-card/40 overflow-hidden hover:border-primary-pink/50 transition-colors"
            >
              <div className="aspect-[3/4] bg-background-light relative">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={`${artist.name}, devotional artist listed on ANDACTION`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="p-3 space-y-1">
                <p className="font-semibold text-white text-sm leading-snug">{artist.name}</p>
                {artist.category ? (
                  <p className="text-xs text-text-light-gray">{artist.category}</p>
                ) : null}
                {place ? <p className="text-xs text-text-light-gray">{place}</p> : null}
                {artist.yearsOfExperience ? (
                  <p className="text-xs text-text-light-gray">
                    {artist.yearsOfExperience} years on profile
                  </p>
                ) : null}
                {artist.chargesFrom ? (
                  <p className="text-xs text-white">From {formatInr(artist.chargesFrom)}</p>
                ) : null}
                <span className="inline-block text-xs text-primary-pink pt-1">View profile</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function DevotionalServiceView({
  service,
  matched,
  related,
}: {
  service: DevotionalService;
  matched: ServiceArtistCard[];
  related: ServiceArtistCard[];
}) {
  const others = DEVOTIONAL_SERVICES.filter((item) => item.slug !== service.slug);
  const isChowki = service.slug === "mata-ki-chowki";
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/services/${service.slug}`;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.h1,
    description: service.description,
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: "ANDACTION",
      url: siteUrl,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Delhi NCR",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const itemList =
    matched.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${service.name} artists on ANDACTION`,
          itemListElement: matched.map((artist, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: artist.name,
            url: `${siteUrl}/artists/${artist.id}`,
          })),
        }
      : null;

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {itemList ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      ) : null}

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-text-light-gray">
          <li>
            <Link href="/" className="hover:text-white">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/services" className="hover:text-white">Services</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-white">{service.name}</li>
        </ol>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">{service.h1}</h1>
        <div className="space-y-4 text-text-light-gray leading-relaxed text-base md:text-lg">
          {service.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <a
            href="#artists"
            className="inline-flex items-center justify-center rounded-full bg-primary-pink text-white px-5 py-2.5 text-sm font-semibold"
          >
            See artists
          </a>
          <Link
            href={`/artists?search=${encodeURIComponent(service.searchQuery)}`}
            className="inline-flex items-center justify-center rounded-full border border-white/20 text-white px-5 py-2.5 text-sm font-semibold hover:border-primary-pink"
          >
            Search {service.name}
          </Link>
        </div>
      </header>

      <section className="mb-12" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-2xl md:text-3xl font-semibold text-white mb-6">
          About {service.name}
        </h2>
        <div className="space-y-8">
          {service.about.map((block) => (
            <div key={block.heading}>
              <h3 className="text-xl font-semibold text-white mb-3">{block.heading}</h3>
              <div className="space-y-3 text-text-light-gray leading-relaxed">
                {block.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12" aria-labelledby="occasions-heading">
        <h2 id="occasions-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {isChowki ? "Book Mata Ki Chowki for different occasions" : `Where people book ${service.name}`}
        </h2>
        <p className="text-text-light-gray leading-relaxed mb-6">{service.occasionsIntro}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {service.occasions.map((occasion) => (
            <div key={occasion.title} className="rounded-xl border border-background-light bg-card/30 p-5">
              <h3 className="text-lg font-semibold text-white mb-2">{occasion.title}</h3>
              <p className="text-text-light-gray leading-relaxed text-sm">{occasion.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12" aria-labelledby="included-heading">
        <h2 id="included-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {isChowki ? "What’s included in a Mata Ki Chowki programme" : `What a ${service.name} booking can include`}
        </h2>
        <p className="text-text-light-gray leading-relaxed mb-6">{service.inclusionsIntro}</p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {service.inclusions.map((item) => (
            <li key={item.title} className="rounded-xl border border-background-light p-4">
              <h3 className="text-white font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-text-light-gray leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="artists" className="mb-12 scroll-mt-24" aria-labelledby="artists-heading">
        <h2 id="artists-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {isChowki ? "Mata Ki Chowki artists and mandalis" : `${service.name} artists on ANDACTION`}
        </h2>
        <p className="text-text-light-gray leading-relaxed mb-6">
          Profiles below come from ANDACTION’s artist records. The first group matched words such as “{service.artistKeywords[0]}” in the artist’s own name, bio, or event types. A second group, when shown, is other devotional listings — useful to contact, but not labelled as confirmed {service.name} providers.
        </p>
        <h3 className="text-lg font-semibold text-white mb-3">Profiles that mention this work</h3>
        <ArtistGrid
          artists={matched}
          emptyLabel={`No artist profile currently mentions ${service.name} in the stored name, bio, or event type. You can still search devotional singers and ask them directly.`}
        />
        {related.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">Other devotional artists</h3>
            <ArtistGrid artists={related} emptyLabel="" />
          </div>
        ) : null}
      </section>

      <section className="mb-12" aria-labelledby="area-heading">
        <h2 id="area-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {service.area.heading}
        </h2>
        <div className="space-y-3 text-text-light-gray leading-relaxed">
          {service.area.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="mb-12" aria-labelledby="book-heading">
        <h2 id="book-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          How to book {service.name}
        </h2>
        <p className="text-text-light-gray leading-relaxed mb-4">{service.bookingIntro}</p>
        <ol className="list-decimal pl-5 space-y-2 text-text-light-gray leading-relaxed">
          {service.bookingSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="mb-12" aria-labelledby="price-heading">
        <h2 id="price-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {service.name} price and charges
        </h2>
        <div className="space-y-3 text-text-light-gray leading-relaxed">
          {service.pricing.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="mb-12" aria-labelledby="why-heading">
        <h2 id="why-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          Why book {service.name} through ANDACTION
        </h2>
        <ul className="space-y-3">
          {service.why.map((point) => (
            <li key={point} className="text-text-light-gray leading-relaxed border-l-2 border-primary-pink pl-4">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          Questions before you book
        </h2>
        <div className="space-y-3">
          {service.faqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-background-light bg-card/30 p-4">
              <h3 className="text-base md:text-lg font-semibold text-white">{faq.question}</h3>
              <p className="text-text-light-gray leading-relaxed mt-3">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-2xl md:text-3xl font-semibold text-white mb-4">
          Other devotional services
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/services/${item.slug}`}
                className="block rounded-xl border border-background-light px-4 py-3 text-white hover:border-primary-pink"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
