'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Calendar, MapPin, Phone, X, Check, Mail } from 'lucide-react';
import Image from 'next/image';
import { BookingStatus } from "@prisma/client";

interface BookingCardProps {
  clientName: string;
  location: string;
  date: string;
  eventType: string;
  description: string;

  status: BookingStatus;         // <-- NEW
  clientEmail?: string | null;   // <-- NEW
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
  clientEmail,     // <-- NEW
  clientPhone,     // <-- NEW

  onReject,
  onAccept,
  className = '',
}) => {
  
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";

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
    <div className={`bg-card border border-border-color rounded-xl p-4 ${className}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white h3 mb-1">{clientName}</h3>
          <div className="flex items-center secondary-text text-text-gray mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <div className="text-right text-text-gray secondary-text">{date}</div>
      </div>

      {/* Event Info */}
      <div className="flex items-center gap-4 mb-3 text-card">
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
          <Image src="/icons/calander.svg" alt="Calendar" width={16} height={16} />
          <span className="secondary-text">{date}</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
          <Image src="/icons/building.svg" alt="Building" width={16} height={16} />
          <span className="secondary-text">{eventType}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p 
          ref={descriptionRef}
          className={`text-white secondary-text ${isExpanded ? '' : 'line-clamp-2'}`}
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
      <div className="flex gap-3 mt-3">

        {isPending && (
          <>
            {/* ACCEPT */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAccept}
              className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>

            {/* REJECT */}
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </>
        )}

        {/* CALL BUTTON (allowed for all statuses IF phone exists) */}
        {clientPhone && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(`tel:${clientPhone}`, "_self")}
            className="flex-1"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        )}

        {/* EMAIL BUTTON (if approved or declined or completed, OR if pending too, you decide) */}
        {clientEmail && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(`mailto:${clientEmail}`, "_self")}
            className="flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        )}

      </div>
    </div>
  );
};

export default BookingCard;
