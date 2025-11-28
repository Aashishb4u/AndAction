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
} from "@/hooks/use-integrations";
import { toast } from "react-toastify";

interface IntegrationsTabProps {
  artist: Artist;
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ artist }) => {
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const { data: integrationStatus, isLoading: isLoadingStatus } =
    useIntegrationStatus();

  const connectMutation = useYouTubeConnect();
  const disconnectMutation = useYouTubeDisconnect();

  const handleYouTubeConnect = () => {
    connectMutation.mutate();
  };

  const handleYouTubeDisconnect = () => {
    setDisconnectDialogOpen(true);
  };

  const confirmDisconnect = () => {
    setDisconnectDialogOpen(false);
    disconnectMutation.mutate();
  };

  const handleInstagramConnect = () => {
    toast.info("Instagram integration coming soon!");
  };

  const isLoading = connectMutation.isPending || disconnectMutation.isPending;

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

      {/* Integrations Table */}
      <div className="bg-card border border-border-color rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background/50 border-b border-border-color">
              <th className="text-left py-4 px-6 text-sm font-medium text-text-gray">
                Platform
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-text-gray">
                Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-text-gray">
                Account
              </th>
              <th className="text-right py-4 px-6 text-sm font-medium text-text-gray">
                Action
              </th>
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
                    <p className="text-xs text-text-gray">
                      Sync your videos & shorts
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                {status.youtube.connected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">
                      Connected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-text-gray" />
                    <span className="text-text-gray text-sm">
                      Not connected
                    </span>
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                {status.youtube.connected ? (
                  <div>
                    <p className="text-white text-sm">
                      {status.youtube.channelName}
                    </p>
                    {status.youtube.connectedAt && (
                      <p className="text-xs text-text-gray">
                        Connected{" "}
                        {new Date(
                          status.youtube.connectedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-text-gray text-sm">—</span>
                )}
              </td>
              <td className="py-4 px-6 text-right">
                {status.youtube.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleYouTubeDisconnect}
                    disabled={isLoading}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleYouTubeConnect}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Youtube className="w-4 h-4 mr-2" />
                    )}
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
                    <p className="text-xs text-text-gray">
                      Sync your reels & posts
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                {status.instagram.connected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">
                      Connected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-text-gray" />
                    <span className="text-text-gray text-sm">
                      Not connected
                    </span>
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                {status.instagram.connected ? (
                  <div>
                    <p className="text-white text-sm">
                      @{status.instagram.username}
                    </p>
                    {status.instagram.connectedAt && (
                      <p className="text-xs text-text-gray">
                        Connected{" "}
                        {new Date(
                          status.instagram.connectedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-text-gray text-sm">—</span>
                )}
              </td>
              <td className="py-4 px-6 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInstagramConnect}
                  disabled={true}
                  className="opacity-50 cursor-not-allowed"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">
          Why connect your accounts?
        </h4>
        <ul className="text-sm text-text-gray space-y-1">
          <li>• Automatically import your videos and shorts to your profile</li>
          <li>• Keep your content synced with your latest uploads</li>
          <li>
            • Show potential clients your best work without manual uploads
          </li>
        </ul>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        title="Disconnect YouTube"
        description="Are you sure you want to disconnect your YouTube account? Your synced videos will remain on your profile."
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="danger"
        isLoading={disconnectMutation.isPending}
        onConfirm={confirmDisconnect}
      />
    </div>
  );
};

export default IntegrationsTab;
