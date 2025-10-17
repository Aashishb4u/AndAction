'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

interface SuccessModalProps {
  isOpen: boolean;
  onGoToDashboard: () => void;
  onAddAnotherProfile: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onGoToDashboard,
  onAddAnotherProfile
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50">
      <div className="bg-card border border-border-color rounded-2xl p-8 max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <Image src="/success.svg" alt="Success" width={100} height={100} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-4">You&apos;re All Set!</h2>

        {/* Description */}
        <p className="text-text-gray text-sm leading-relaxed mb-8">
          Your artist profile is now live. You can start receiving booking requests from users.
          If you perform in more than one category, you can add another profile right away.
        </p>

        {/* Action Buttons */}
        <div className="flex md:flex-row flex-col md:items-center gap-4">
          {/* Add Another Profile Button */}
          <Button
            variant="secondary"
            size="md"
            onClick={onAddAnotherProfile}
            className="w-full gradient-text"
          >
            Add another profile
          </Button>

          {/* Go to Dashboard Button */}
          <Button
            variant="primary"
            size="md"
            onClick={onGoToDashboard}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
