"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  Youtube,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface YouTubeChannelPreview {
  channelId: string;
  channelName: string;
  customUrl?: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
}

interface YouTubeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (channelId: string) => Promise<void>;
}

const YouTubeConnectModal: React.FC<YouTubeConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [step, setStep] = useState<"input" | "selection" | "preview">("input");
  const [channelInput, setChannelInput] = useState("");
  const [channelOptions, setChannelOptions] = useState<YouTubeChannelPreview[]>([]);
  const [channelPreview, setChannelPreview] =
    useState<YouTubeChannelPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleFetchChannel = async () => {
    if (!channelInput.trim()) {
      setError("Please enter your channel name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/artists/integrations/youtube/preview-channel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelInput: channelInput.trim() }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch channel details");
      }

      // Handle multiple channels
      if (data.multiple && Array.isArray(data.data)) {
        setChannelOptions(data.data);
        setStep("selection");
      } else {
        // Single channel found
        setChannelPreview(data.data);
        setStep("preview");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch channel details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChannel = (channel: YouTubeChannelPreview) => {
    setChannelPreview(channel);
    setStep("preview");
  };

  const handleConfirmConnect = async () => {
    if (!channelPreview) return;

    setIsConnecting(true);
    setError("");

    try {
      await onConnect(channelPreview.channelId);
      // Reset state and close modal
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to connect channel");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBack = () => {
    if (step === "preview" && channelOptions.length > 0) {
      setStep("selection");
      setChannelPreview(null);
    } else {
      setStep("input");
      setChannelPreview(null);
      setChannelOptions([]);
    }
    setError("");
  };

  const handleClose = () => {
    setStep("input");
    setChannelInput("");
    setChannelPreview(null);
    setChannelOptions([]);
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "input"
          ? "Connect YouTube Channel"
          : step === "selection"
            ? "Select Your Channel"
            : "Confirm Channel"
      }
      size="md"
    >
      <div className="px-8 py-6">
        {step === "input" ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-card border border-border-color rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Youtube className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-white font-medium text-sm">
                    How to find your Channel ID
                  </h3>
                  <ol className="text-text-gray text-sm space-y-1.5 list-decimal list-inside">
                    <li>Go to your YouTube channel page</li>
                    <li>
                      Click on your profile icon and select "View your channel"
                    </li>
                    <li>
                      Look at the URL - it will contain your Channel ID or
                      Handle
                    </li>
                  </ol>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-text-gray text-xs">Examples:</p>
                    <div className="bg-background/50 rounded px-3 py-2 font-mono text-xs text-white">
                      <div className="mb-1">Handle: @username</div>
                      <div>Channel ID: UCxxxxxxxxxxxxx</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                Channel ID or Handle
              </label>
              <Input
                type="text"
                placeholder="e.g., @username or UCxxxxxxxxxxxxx"
                value={channelInput}
                onChange={(e) => {
                  setChannelInput(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFetchChannel();
                  }
                }}
                disabled={isLoading}
                variant="filled"
                className="w-full"
              />
              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleFetchChannel}
                disabled={isLoading || !channelInput.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4 mr-2" />
                    Search Channel
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : step === "selection" ? (
          <div className="space-y-4">
            {/* Info Message */}
            <div className="bg-background/50 border border-border-color rounded-lg p-4">
              <p className="text-white text-sm font-medium mb-1">
                Multiple channels found for "{channelInput}"
              </p>
              <p className="text-text-gray text-sm">
                Please select your channel from the list below.
              </p>
            </div>

            {/* Channel List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {channelOptions.map((channel) => (
                <button
                  key={channel.channelId}
                  onClick={() => handleSelectChannel(channel)}
                  className="w-full bg-card border border-border-color hover:border-red-400/50 hover:bg-background/50 rounded-lg p-4 text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {channel.thumbnailUrl && (
                      <img
                        src={channel.thumbnailUrl}
                        alt={channel.channelName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border-color group-hover:border-red-400/50"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base truncate group-hover:text-red-400 transition-colors">
                        {channel.channelName}
                      </h3>
                      {channel.customUrl && (
                        <p className="text-text-gray text-sm">
                          {channel.customUrl}
                        </p>
                      )}
                      {channel.description && (
                        <p className="text-text-gray text-xs mt-1 line-clamp-1">
                          {channel.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2">
                        {channel.subscriberCount && (
                          <span className="text-text-gray text-xs">
                            {channel.subscriberCount} subscribers
                          </span>
                        )}
                        {channel.videoCount && (
                          <span className="text-text-gray text-xs">
                            {channel.videoCount} videos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2 mb-4">
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back to Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Channel Preview */}
            {channelPreview && (
              <div className="bg-card border border-border-color rounded-lg overflow-hidden">
                <div className="p-6 space-y-4">
                  {/* Channel Header */}
                  <div className="flex items-start gap-4">
                    {channelPreview.thumbnailUrl && (
                      <img
                        src={channelPreview.thumbnailUrl}
                        alt={channelPreview.channelName}
                        className="w-20 h-20 rounded-full object-cover border-2 border-border-color"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {channelPreview.channelName}
                        </h3>
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      </div>
                      {channelPreview.customUrl && (
                        <p className="text-text-gray text-sm">
                          {channelPreview.customUrl}
                        </p>
                      )}
                      {channelPreview.description && (
                        <p className="text-text-gray text-sm mt-2 line-clamp-2">
                          {channelPreview.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Channel Stats */}
                  <div className="flex gap-6 pt-2 border-t border-border-color">
                    {channelPreview.subscriberCount && (
                      <div>
                        <p className="text-text-gray text-xs">Subscribers</p>
                        <p className="text-white font-medium">
                          {channelPreview.subscriberCount}
                        </p>
                      </div>
                    )}
                    {channelPreview.videoCount && (
                      <div>
                        <p className="text-text-gray text-xs">Videos</p>
                        <p className="text-white font-medium">
                          {channelPreview.videoCount}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* View on YouTube Link */}
                  <a
                    href={`https://www.youtube.com/channel/${channelPreview.channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on YouTube
                  </a>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="bg-background/50 border border-border-color rounded-lg p-4">
              <p className="text-text-gray text-sm">
                By connecting this channel, your videos will be automatically
                synced to your profile. You can disconnect at any time.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isConnecting}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmConnect}
                disabled={isConnecting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default YouTubeConnectModal;
