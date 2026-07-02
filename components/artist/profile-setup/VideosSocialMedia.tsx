"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import YouTubeConnectModal from "@/components/modals/YouTubeConnectModal";
import InstagramConnectModal from "@/components/modals/InstagramConnectModal";
import Image from "next/image";
import { Loader2, CheckCircle, Youtube, Instagram } from "lucide-react";
import {
  useIntegrationStatus,
  useYouTubeConnectByChannel,
  useInstagramConnectByUsername,
  useInstagramDisconnect,
} from "@/hooks/use-integrations";

interface VideosSocialMediaProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const VideosSocialMedia: React.FC<VideosSocialMediaProps> = ({
  onNext,
  onBack,
}) => {
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [instagramModalOpen, setInstagramModalOpen] = useState(false);

  const { data: integrationStatus, isLoading: isLoadingStatus } =
    useIntegrationStatus();
  const connectYouTubeByChannelMutation = useYouTubeConnectByChannel();

  const instagramConnectMutation = useInstagramConnectByUsername();
  const instagramDisconnectMutation = useInstagramDisconnect();

  const youtubeConnected = integrationStatus?.youtube.connected ?? false;
  const instagramConnected = integrationStatus?.instagram.connected ?? false;
  const isInstagramLoading =
    instagramConnectMutation.isPending || instagramDisconnectMutation.isPending;

  const handleYouTubeConnect = () => {
    setYoutubeModalOpen(true);
  };

  const handleYouTubeConnectConfirm = async (channelId: string) => {
    await connectYouTubeByChannelMutation.mutateAsync(channelId);
    setYoutubeModalOpen(false);
  };

  const connectInstagram = () => {
    setInstagramModalOpen(true);
  };

  const handleInstagramConnectConfirm = async (username: string) => {
    await instagramConnectMutation.mutateAsync(username);
    setInstagramModalOpen(false);
  };

  const disconnectInstagram = () => {
    instagramDisconnectMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-primary-pink transition-colors duration-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden md:block">Back</span>
          <span className="md:hidden h2">Profile Setup</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-32">
          <div className="max-w-xl md:max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="h2 text-white mb-2 hidden md:block">
              Profile setup
            </h1>

            {/* Progress Bar */}
            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-full"></div>
            </div>

            {/* Step Info */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Image
                  src="/icons/video.svg"
                  alt="Videos & Social Media"
                  width={24}
                  height={24}
                />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Videos & Social media</h2>
              </div>
            </div>
            <p className="text-text-gray text-sm text-left">
              Connect your YouTube and Instagram account to import your videos &
              reels.
            </p>
          </div>

          {/* Social Media Connections */}
          <div className="space-y-6">
            {/* YouTube Channel */}
            <div className="bg-card border border-border-color rounded-xl p-3">
              <div className="flex items-start gap-4">
                {/* YouTube Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="text-white btn1 mb-1">YouTube Channel</h3>
                  <p className="text-text-gray secondary-text mb-4">
                    Import all videos & shorts from your YouTube channel
                  </p>
                </div>
              </div>

              {isLoadingStatus ? (
                <div className="flex items-center justify-center gap-2 text-text-gray text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking status...
                </div>
              ) : youtubeConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center text-center gap-2 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                    {integrationStatus?.youtube.channelName && (
                      <span className="text-text-gray ml-1">
                        ({integrationStatus.youtube.channelName})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleYouTubeConnect}
                    className="w-full py-2 text-sm border border-border-color text-white rounded-full font-medium hover:bg-card transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="gradient-text">Change YouTube Channel</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleYouTubeConnect}
                  disabled={connectYouTubeByChannelMutation.isPending}
                  className="w-full py-2 text-sm bg-white rounded-full font-medium hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {connectYouTubeByChannelMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="gradient-text font-semibold">Connecting...</span>
                    </>
                  ) : (
                    <span className="gradient-text font-semibold">Connect YouTube</span>
                  )}
                </button>
              )}
            </div>

            {/* Instagram Account */}
            <div className="bg-card border border-border-color rounded-xl p-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="text-white btn1 mb-1">Instagram Account</h3>
                  <p className="text-text-gray secondary-text mb-4">
                    Import all reels from your Instagram account
                  </p>
                </div>
              </div>

              {instagramConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center text-center gap-2 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                    {integrationStatus?.instagram.username && (
                      <span className="text-text-gray ml-1">
                        (@{integrationStatus.instagram.username})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={disconnectInstagram}
                    disabled={isInstagramLoading}
                    className="w-full py-2 text-sm border border-red-400/30 text-red-400 rounded-full font-medium hover:bg-red-400/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isInstagramLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Disconnect"
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectInstagram}
                  disabled={isInstagramLoading}
                  className="w-full py-2 text-sm bg-white rounded-full font-semibold hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isInstagramLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="gradient-text font-semibold">Connecting...</span>
                    </>
                  ) : (
                    <span className="gradient-text font-semibold">Connect Instagram</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F0F0F] border-t border-border-color md:px-6 px-5 py-4">
        <div className="max-w-md mx-auto">
          <Button variant="primary" size="md" onClick={onNext} className="w-full">
            Save
          </Button>
        </div>
      </div>

      <YouTubeConnectModal
        isOpen={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
        onConnect={handleYouTubeConnectConfirm}
      />
      <InstagramConnectModal
        isOpen={instagramModalOpen}
        onClose={() => setInstagramModalOpen(false)}
        onConnect={handleInstagramConnectConfirm}
      />
    </div>
  );
};

export default VideosSocialMedia;
