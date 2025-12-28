'use client';

import React from 'react';
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
      <p className="text-white secondary-text mb-3 line-clamp-2">
        {description}
        <button className="text-blue hover:text-primary-pink/80 ml-1">more...</button>
      </p>

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
