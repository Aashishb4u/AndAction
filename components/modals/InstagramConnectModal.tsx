"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  Instagram,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  previewInstagramAccount,
  type InstagramAccountPreview,
} from "@/hooks/use-integrations";

interface InstagramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (username: string) => Promise<void>;
}

const InstagramConnectModal: React.FC<InstagramConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [step, setStep] = useState<"input" | "preview">("input");
  const [usernameInput, setUsernameInput] = useState("");
  const [accountPreview, setAccountPreview] =
    useState<InstagramAccountPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleFetchAccount = async () => {
    if (!usernameInput.trim()) {
      setError("Please enter your Instagram username");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const preview = await previewInstagramAccount(usernameInput.trim());
      setAccountPreview(preview);
      setStep("preview");
    } catch (err: any) {
      setError(err?.message || "Failed to fetch account details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmConnect = async () => {
    if (!accountPreview) return;

    setIsConnecting(true);
    setError("");

    try {
      await onConnect(accountPreview.username);
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Failed to connect account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBack = () => {
    setStep("input");
    setAccountPreview(null);
    setError("");
  };

  const handleClose = () => {
    setStep("input");
    setUsernameInput("");
    setAccountPreview(null);
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "input"
          ? "Connect Instagram Account"
          : "Confirm Account"
      }
      size="md"
    >
      <div className="px-8 py-6">
        {step === "input" ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-card border border-border-color rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Instagram className="w-6 h-6 text-pink-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-white font-medium text-sm">
                    How to find your Username
                  </h3>
                  <ol className="text-text-gray text-sm space-y-1.5 list-decimal list-inside">
                    <li>Open the Instagram app or website</li>
                    <li>Go to your profile page</li>
                    <li>
                      Your username is shown at the top - it starts with @
                    </li>
                  </ol>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-text-gray text-xs">Examples:</p>
                    <div className="bg-background/50 rounded px-3 py-2 font-mono text-xs text-white">
                      <div className="mb-1">Username: @username</div>
                      <div>Profile: instagram.com/username</div>
                    </div>
                  </div>
                  <p className="text-text-gray text-xs mt-2">
                    Note: Only public Instagram Business or Creator accounts can
                    be connected.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                Instagram Username
              </label>
              <Input
                type="text"
                placeholder="e.g., @username"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value.toLowerCase());
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFetchAccount();
                  }
                }}
                disabled={isLoading}
                variant="filled"
                className="w-full lowercase"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
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
                onClick={handleFetchAccount}
                disabled={isLoading || !usernameInput.trim()}
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4 mr-2" />
                    Search Account
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Preview */}
            {accountPreview && (
              <div className="bg-card border border-border-color rounded-lg overflow-hidden">
                <div className="p-6 space-y-4">
                  {/* Account Header */}
                  <div className="flex items-start gap-4">
                    {accountPreview.profilePictureUrl && (
                      <img
                        src={accountPreview.profilePictureUrl}
                        alt={accountPreview.username}
                        className="w-20 h-20 rounded-full object-cover border-2 border-border-color"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {accountPreview.name || accountPreview.username}
                        </h3>
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      </div>
                      <p className="text-text-gray text-sm">
                        @{accountPreview.username}
                      </p>
                      {accountPreview.biography && (
                        <p className="text-text-gray text-sm mt-2 line-clamp-2 whitespace-pre-line">
                          {accountPreview.biography}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="flex gap-6 pt-2 border-t border-border-color">
                    {accountPreview.followersCount && (
                      <div>
                        <p className="text-text-gray text-xs">Followers</p>
                        <p className="text-white font-medium">
                          {accountPreview.followersCount}
                        </p>
                      </div>
                    )}
                    {accountPreview.followsCount && (
                      <div>
                        <p className="text-text-gray text-xs">Following</p>
                        <p className="text-white font-medium">
                          {accountPreview.followsCount}
                        </p>
                      </div>
                    )}
                    {accountPreview.mediaCount !== undefined && (
                      <div>
                        <p className="text-text-gray text-xs">Posts</p>
                        <p className="text-white font-medium">
                          {accountPreview.mediaCount}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* View on Instagram Link */}
                  <a
                    href={`https://www.instagram.com/${accountPreview.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Instagram
                  </a>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="bg-background/50 border border-border-color rounded-lg p-4">
              <p className="text-text-gray text-sm">
                By connecting this account, your reels and posts will be
                automatically synced to your profile. You can disconnect at any
                time.
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
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90"
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

export default InstagramConnectModal;
