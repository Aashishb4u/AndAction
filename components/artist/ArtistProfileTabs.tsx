"use client";

import React from "react";
import AboutTab from "./tabs/AboutTab";
import PerformanceTab from "./tabs/PerformanceTab";
import VideosTab from "./tabs/VideosTab";
import ShortsTab from "./tabs/ShortsTab";
import IntegrationsTab from "./tabs/IntegrationsTab";
import { Artist } from "@/types";

interface ArtistProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  artist: Artist;
}

const tabs = [
  { id: "about", label: "About" },
  { id: "performance", label: "Performance" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "integrations", label: "Integrations" },
];

const ArtistProfileTabs: React.FC<ArtistProfileTabsProps> = ({
  activeTab,
  onTabChange,
  artist,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return <AboutTab artist={artist} />;
      case "performance":
        return <PerformanceTab artist={artist} />;
      case "videos":
        return <VideosTab artist={artist} />;
      case "shorts":
        return <ShortsTab artist={artist} />;
      case "integrations":
        return <IntegrationsTab artist={artist} />;
      default:
        return <AboutTab artist={artist} />;
    }
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-border-color mb-4 bg-card md:bg-transparent">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-6 md:px-8 border-b-2 font-medium text-base whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-primary-pink text-white"
                  : "border-transparent text-text-gray hover:text-white hover:border-[#404040]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px] md:p-5 p-4 pt-0">{renderTabContent()}</div>
    </div>
  );
};

export default ArtistProfileTabs;
