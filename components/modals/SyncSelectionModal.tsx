"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Youtube,
  Instagram,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useIntegrationStatus } from "@/hooks/use-integrations";

export type SyncPlatform = "youtube" | "instagram";

interface SyncSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: (platforms: SyncPlatform[]) => Promise<void>;
  title?: string;
  description?: string;
  contentType?: "videos" | "shorts"; // To show relevant messaging
}

const SyncSelectionModal: React.FC<SyncSelectionModalProps> = ({
  open,
  onOpenChange,
  onSync,
  title = "Sync Content",
  description = "Select which platforms you want to sync content from.",
  contentType = "videos",
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SyncPlatform>>(
    new Set()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: integrations, isLoading: isLoadingIntegrations } =
    useIntegrationStatus();

  const togglePlatform = (platform: SyncPlatform) => {
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  };

  const handleSync = async () => {
    if (selectedPlatforms.size === 0) return;
    setIsSyncing(true);
    try {
      await onSync(Array.from(selectedPlatforms));
      onOpenChange(false);
      setSelectedPlatforms(new Set());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    if (!isSyncing) {
      onOpenChange(false);
      setSelectedPlatforms(new Set());
    }
  };

  const youtubeConnected = integrations?.youtube?.connected ?? false;
  const instagramConnected = integrations?.instagram?.connected ?? false;
  const hasAnyConnection = youtubeConnected || instagramConnected;

  const platformInfo = {
    youtube: {
      name: "YouTube",
      icon: Youtube,
      connected: youtubeConnected,
      channelName: integrations?.youtube?.channelName,
      description:
        contentType === "videos"
          ? "Import your YouTube videos"
          : "Import your YouTube Shorts",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500",
    },
    instagram: {
      name: "Instagram",
      icon: Instagram,
      connected: instagramConnected,
      channelName: integrations?.instagram?.username,
      description:
        contentType === "videos"
          ? "Import your Instagram videos"
          : "Import your Instagram Reels",
      color: "text-pink-500",
      bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      borderColor: "border-pink-500",
    },
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-card border border-border-color rounded-2xl p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 p-2 text-text-gray hover:text-white hover:bg-[#2D2D2D] rounded-full transition-all duration-200"
              aria-label="Close"
              disabled={isSyncing}
            >
              <X size={18} />
            </button>
          </Dialog.Close>

          {/* Title */}
          <Dialog.Title className="text-xl font-semibold text-white mb-2">
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="text-text-gray mb-6">
            {description}
          </Dialog.Description>

          {/* Loading state */}
          {isLoadingIntegrations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-pink" />
            </div>
          ) : !hasAnyConnection ? (
            /* No connections state */
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-white font-medium mb-1">
                No Platforms Connected
              </p>
              <p className="text-text-gray text-sm mb-4">
                Connect YouTube or Instagram from your Integrations settings to
                sync content.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = "/artist/profile?tab=integrations";
                }}
              >
                Go to Integrations
              </Button>
            </div>
          ) : (
            /* Platform Selection */
            <>
              <div className="space-y-3 mb-6">
                {(Object.keys(platformInfo) as SyncPlatform[]).map(
                  (platform) => {
                    const info = platformInfo[platform];
                    const Icon = info.icon;
                    const isSelected = selectedPlatforms.has(platform);
                    const isDisabled = !info.connected;

                    return (
                      <button
                        key={platform}
                        onClick={() => !isDisabled && togglePlatform(platform)}
                        disabled={isDisabled || isSyncing}
                        className={`
                        w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                        ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed border-border-color bg-[#1A1A1A]"
                            : isSelected
                            ? `${info.borderColor} ${info.bgColor}`
                            : "border-border-color hover:border-text-gray bg-[#1A1A1A] hover:bg-[#2D2D2D]"
                        }
                      `}
                      >
                        <div className="flex items-center gap-4">
                          {/* Platform Icon */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.bgColor}`}
                          >
                            <Icon className={`w-6 h-6 ${info.color}`} />
                          </div>

                          {/* Platform Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {info.name}
                              </span>
                              {info.connected ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                                  Connected
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-text-gray/20 text-text-gray">
                                  Not Connected
                                </span>
                              )}
                            </div>
                            {info.connected && info.channelName && (
                              <p className="text-sm text-text-gray truncate">
                                @{info.channelName}
                              </p>
                            )}
                            {!info.connected && (
                              <p className="text-sm text-text-gray">
                                Connect in Integrations settings
                              </p>
                            )}
                          </div>

                          {/* Checkbox */}
                          <div
                            className={`
                            w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                            ${
                              isDisabled
                                ? "border-border-color bg-transparent"
                                : isSelected
                                ? `${info.borderColor} bg-current`
                                : "border-border-color bg-transparent"
                            }
                          `}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isSyncing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSync}
                  disabled={selectedPlatforms.size === 0 || isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    `Sync ${
                      selectedPlatforms.size > 0
                        ? `(${selectedPlatforms.size})`
                        : ""
                    }`
                  )}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SyncSelectionModal;
