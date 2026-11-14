import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "ANDACTION - Book Singers, Bhajan & Devotional Artists in Delhi NCR",
  description:
    "Book verified singers, bands, DJs and devotional artists for Mata Ki Chowki, Jagran, Bhajan Sandhya, weddings and events in Delhi NCR with ANDACTION.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomeClient />;
}
