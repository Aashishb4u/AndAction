import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "@/components/layout/SiteLayout";
import { DEVOTIONAL_SERVICES } from "@/lib/devotional-services";
import { getSiteUrl } from "@/lib/site-url";

const title = "Devotional Event Services in Delhi NCR | ANDACTION";
const description =
  "Book Mata Ki Chowki, Sunderkand path, Akhand Ramayan, Bhagwati jagran, Khatu Shyam bhajans, and Sai Sandhya with artists listed on ANDACTION.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/services` },
  robots: { index: true, follow: true },
  openGraph: { title, description, type: "website" },
};

export default function ServicesPage() {
  return (
    <SiteLayout>
      <div className="pt-24 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-light-gray">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Services</span>
        </nav>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Devotional services</h1>
        <p className="text-text-light-gray leading-relaxed mb-8 max-w-3xl">
          These pages explain programmes people book on ANDACTION in Delhi NCR and link to artist profiles that exist on the platform. City pages are not published separately yet.
        </p>
        <ul className="grid sm:grid-cols-2 gap-4">
          {DEVOTIONAL_SERVICES.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="block h-full rounded-xl border border-background-light bg-card/30 p-5 hover:border-primary-pink"
              >
                <h2 className="text-xl font-semibold text-white mb-2">{service.name}</h2>
                <p className="text-sm text-text-light-gray leading-relaxed">{service.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SiteLayout>
  );
}
