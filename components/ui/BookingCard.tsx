'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { MapPin, Phone, X } from 'lucide-react';
import Image from 'next/image';
import { BookingStatus } from "@prisma/client";
import { toast } from 'react-toastify';

interface BookingCardProps {
  clientName: string;
  location: string;
  date: string;
  eventType: string;
  description: string;

  status: BookingStatus;         // <-- NEW
  clientPhone?: string | null;   // <-- NEW

  onReject: () => void;
  onAccept: () => void;

  className?: string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  clientName,
  location,
  date,
  eventType,
  description,

  status,          // <-- NEW
  clientPhone,     // <-- NEW

  onReject,
  className = '',
}) => {
  
  const isPending = status === "PENDING";
  const clientPhoneDigits = (clientPhone ?? "").replace(/\D/g, "");
  const hasClientPhone = clientPhoneDigits.length > 0;
  const telHref =
    clientPhoneDigits.length === 10
      ? `tel:+91${clientPhoneDigits}`
      : `tel:+${clientPhoneDigits}`;
  // State for expanding description
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Check if description overflows (more than 2 lines)
  useEffect(() => {
    const checkOverflow = () => {
      if (descriptionRef.current) {
        const lineHeight = parseFloat(getComputedStyle(descriptionRef.current).lineHeight) || 20;
        const maxHeight = lineHeight * 2; // 2 lines
        setShowMoreButton(descriptionRef.current.scrollHeight > maxHeight + 2);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [description]);

  return (
    <div className={`bg-card border border-border-color rounded-xl p-3 sm:p-4 overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="relative mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 pr-28">
          <h3 className="text-white h3 mb-1 truncate">{clientName}</h3>
          <div className="flex min-w-0 items-center secondary-text text-text-gray mb-2">
            <MapPin className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <div className="secondary-text text-text-gray absolute top-0 right-0 text-right whitespace-nowrap">{date}</div>
      </div>

      {/* Event Info */}
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3 text-card">
        <div className="flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1">
          <Image src="/icons/calander.svg" alt="Calendar" width={16} height={16} className="shrink-0" />
          <span className="secondary-text truncate">{date}</span>
        </div>
        <div className="flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1">
          <Image src="/icons/building.svg" alt="Building" width={16} height={16} className="shrink-0" />
          <span className="secondary-text truncate">{eventType}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p 
          ref={descriptionRef}
          className={`text-white secondary-text wrap-break-word ${isExpanded ? '' : 'line-clamp-2'}`}
        >
          {description}
        </p>
        {showMoreButton && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue hover:text-primary-pink/80 text-sm mt-1"
          >
            {isExpanded ? 'less' : 'more...'}
          </button>
        )}
      </div>

      {/* ---------------------------------------------------
          CONDITIONAL ACTION BUTTONS
      --------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">

        {isPending && (
          <>
            {/* REJECT */}
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="min-w-30 flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <X className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Reject</span>
            </Button>
          </>
        )}

        {/* CALL BUTTON (allowed for all statuses IF phone exists) */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (!hasClientPhone) {
              toast.info("Client phone number not available");
              return;
            }
            window.open(telHref, "_self");
          }}
          className="min-w-30 flex-1"
        >
          <Phone className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">Call</span>
        </Button>

      </div>
    </div>
  );
};

export default BookingCard;
