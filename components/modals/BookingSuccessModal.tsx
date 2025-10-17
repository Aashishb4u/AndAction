'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Image from 'next/image';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistName?: string;
}

const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      closeOnBackdropClick={false}
      className="text-center"
    >
      <div className="px-8 py-12 flex flex-col items-center">
        {/* Success Icon */}
        <div className="mb-8">
          <Image
            src="/success.svg"
            alt="Success"
            width={80}
            height={80}
            className="mx-auto"
          />
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Booking Request Sent!
        </h2>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
          Your request has been shared with the artist. They&apos;ll reach out to you soon to 
          confirm the details. Keep an eye on your calls or messages!
        </p>

        {/* Done Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onClose}
          className="w-full"
        >
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default BookingSuccessModal;
