"use client";

import Image from "next/image";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { DEVOTIONAL_SERVICES } from "@/lib/devotional-services";

export default function ServicesPopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Services" size="lg">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 md:p-6">
        {DEVOTIONAL_SERVICES.map((service) => (
          <li key={service.slug}>
            <Link
              href={`/services/${service.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 hover:border-primary-pink"
            >
              {service.image ? (
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </span>
              ) : null}
              <span className="text-base font-semibold text-white">{service.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
