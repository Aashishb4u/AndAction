"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Artist } from "@/types";
import {
  Youtube,
  Instagram,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  useIntegrationStatus,
  useYouTubeConnect,
  useYouTubeDisconnect,
  useInstagramConnect,
  useInstagramDisconnect,
} from "@/hooks/use-integrations";

interface IntegrationsTabProps {
  artist: Artist;
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ artist }) => {
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnectType, setDisconnectType] = useState<"youtube" | "instagram">(
    "youtube"
  );

  const { data: integrationStatus, isLoading: isLoadingStatus } =
    useIntegrationStatus();

  const youtubeConnectMutation = useYouTubeConnect();
  const youtubeDisconnectMutation = useYouTubeDisconnect();
  const instagramConnectMutation = useInstagramConnect();
  const instagramDisconnectMutation = useInstagramDisconnect();

  const handleYouTubeConnect = () => {
    youtubeConnectMutation.mutate();
  };

  const handleYouTubeDisconnect = () => {
    setDisconnectType("youtube");
    setDisconnectDialogOpen(true);
  };

  const handleInstagramConnect = () => {
    instagramConnectMutation.mutate();
  };

  const handleInstagramDisconnect = () => {
    setDisconnectType("instagram");
    setDisconnectDialogOpen(true);
  };

  const confirmDisconnect = () => {
    setDisconnectDialogOpen(false);
    if (disconnectType === "youtube") {
      youtubeDisconnectMutation.mutate();
    } else {
      instagramDisconnectMutation.mutate();
    }
  };

  const isYouTubeLoading =
    youtubeConnectMutation.isPending || youtubeDisconnectMutation.isPending;
  const isInstagramLoading =
    instagramConnectMutation.isPending || instagramDisconnectMutation.isPending;

  // Default status while loading
  const status = integrationStatus || {
    youtube: { connected: false },
    instagram: { connected: false },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Platform Integrations
        </h2>
        <p className="text-text-gray text-sm">
          Connect your social media accounts to automatically sync your videos
          and content.
        </p>
      </div>

      {/* Responsive Integrations Table */}
      <div className="bg-card border border-border-color rounded-xl overflow-hidden">
        {/* Table Head for md+ */}
        <table className="w-full hidden md:table">
          <thead>
            <tr className="bg-background/50 border-b border-border-color">
              <th className="text-left py-4 px-6 text-sm font-medium text-text-gray">Platform</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-text-gray">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-text-gray">Account</th>
              <th className="text-right py-4 px-6 text-sm font-medium text-text-gray">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* YouTube Row */}
            <tr className="border-b border-border-color hover:bg-background/30 transition-colors">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Youtube className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">YouTube</p>
                    <p className="text-xs text-text-gray">Sync your videos & shorts</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                {status.youtube.connected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-text-gray" />
                    <span className="text-text-gray text-sm">Not connected</span>
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                {status.youtube.connected ? (
                  <div>
                    <p className="text-white text-sm">{status.youtube.channelName}</p>
                    {status.youtube.connectedAt && (
                      <p className="text-xs text-text-gray">Connected {new Date(status.youtube.connectedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-text-gray text-sm">—</span>
                )}
              </td>
              <td className="py-4 px-6 text-right">
                {status.youtube.connected ? (
                  <Button variant="outline" size="sm" onClick={handleYouTubeDisconnect} disabled={isYouTubeLoading} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                    {isYouTubeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleYouTubeConnect} disabled={isYouTubeLoading} className="bg-red-600 hover:bg-red-700">
                    {isYouTubeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Youtube className="w-4 h-4 mr-2" />}
                    Connect YouTube
                  </Button>
                )}
              </td>
            </tr>
            {/* Instagram Row */}
            <tr className="hover:bg-background/30 transition-colors">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Instagram</p>
                    <p className="text-xs text-text-gray">Sync your reels & posts</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                {status.instagram.connected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-text-gray" />
                    <span className="text-text-gray text-sm">Not connected</span>
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                {status.instagram.connected ? (
                  <div>
                    <p className="text-white text-sm">@{status.instagram.username}</p>
                    {status.instagram.connectedAt && (
                      <p className="text-xs text-text-gray">Connected {new Date(status.instagram.connectedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-text-gray text-sm">—</span>
                )}
              </td>
              <td className="py-4 px-6 text-right">
                {status.instagram.connected ? (
                  <Button variant="outline" size="sm" onClick={handleInstagramDisconnect} disabled={isInstagramLoading} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                    {isInstagramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleInstagramConnect} disabled={isInstagramLoading} className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90">
                    {isInstagramLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Instagram className="w-4 h-4 mr-2" />}
                    Connect Instagram
                  </Button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        {/* Mobile view: flex cards */}
        <div className="flex flex-col gap-2 md:hidden p-2">
          {/* YouTube Card */}
          <div className="bg-background/50 border-b border-border-color rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">YouTube</p>
                <p className="text-xs text-text-gray">Sync your videos & shorts</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-gray w-20">Status:</span>
              {status.youtube.connected ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-500 text-sm font-medium">Connected</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-text-gray" /><span className="text-text-gray text-sm">Not connected</span></>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-gray w-20">Account:</span>
              {status.youtube.connected ? (
                <span className="text-white text-sm">{status.youtube.channelName}</span>
              ) : (
                <span className="text-text-gray text-sm">—</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {status.youtube.connected && status.youtube.connectedAt && (
                <span className="text-xs text-text-gray">Connected {new Date(status.youtube.connectedAt).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex justify-end">
              {status.youtube.connected ? (
                <Button variant="outline" size="sm" onClick={handleYouTubeDisconnect} disabled={isYouTubeLoading} className="text-red-400 border-red-400/30 hover:bg-red-400/10 w-full">
                  {isYouTubeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleYouTubeConnect} disabled={isYouTubeLoading} className="bg-red-600 hover:bg-red-700 w-full flex items-center justify-center">
                  {isYouTubeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Youtube className="w-4 h-4 mr-2" />}
                  Connect YouTube
                </Button>
              )}
            </div>
          </div>
          {/* Instagram Card */}
          <div className="bg-background/50 border-b border-border-color rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Instagram</p>
                <p className="text-xs text-text-gray">Sync your reels & posts</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-gray w-20">Status:</span>
              {status.instagram.connected ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-500 text-sm font-medium">Connected</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-text-gray" /><span className="text-text-gray text-sm">Not connected</span></>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-gray w-20">Account:</span>
              {status.instagram.connected ? (
                <span className="text-white text-sm">@{status.instagram.username}</span>
              ) : (
                <span className="text-text-gray text-sm">—</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {status.instagram.connected && status.instagram.connectedAt && (
                <span className="text-xs text-text-gray">Connected {new Date(status.instagram.connectedAt).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex justify-end">
              {status.instagram.connected ? (
                <Button variant="outline" size="sm" onClick={handleInstagramDisconnect} disabled={isInstagramLoading} className="text-red-400 border-red-400/30 hover:bg-red-400/10 w-full">
                  {isInstagramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleInstagramConnect} disabled={isInstagramLoading} className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 w-full flex items-center justify-center">
                  {isInstagramLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Instagram className="w-4 h-4 mr-2" />}
                  Connect Instagram
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        title={`Disconnect ${
          disconnectType === "youtube" ? "YouTube" : "Instagram"
        }`}
        description={`Are you sure you want to disconnect your ${
          disconnectType === "youtube" ? "YouTube" : "Instagram"
        } account? Your synced content will remain on your profile.`}
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="danger"
        isLoading={
          disconnectType === "youtube"
            ? youtubeDisconnectMutation.isPending
            : instagramDisconnectMutation.isPending
        }
        onConfirm={confirmDisconnect}
      />
    </div>
  );
};

export default IntegrationsTab;
