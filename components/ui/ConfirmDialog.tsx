"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const iconColors = {
    danger: "text-red-500 bg-red-500/10",
    warning: "text-yellow-500 bg-yellow-500/10",
    default: "text-primary-pink bg-primary-pink/10",
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-card border border-border-color rounded-2xl p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 p-2 text-text-gray hover:text-white hover:bg-[#2D2D2D] rounded-full transition-all duration-200"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </Dialog.Close>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${iconColors[variant]}`}>
              <AlertTriangle size={24} />
            </div>
          </div>

          {/* Title */}
          <Dialog.Title className="text-lg font-semibold text-white text-center mb-2">
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="text-text-gray text-center mb-6">
            {description}
          </Dialog.Description>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant="primary"
              className={`flex-1 ${
                variant === "danger" ? "!bg-red-600 hover:!bg-red-700" : ""
              }`}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
