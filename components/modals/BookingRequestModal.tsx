"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import Textarea from "../ui/Textarea";
import PhoneInput from "../ui/PhoneInput";
import { format, formatDate, startOfDay } from "date-fns";

interface BookingRequestModalProps {
  isOpen: boolean;
  disabledDates?: Date[];
  onClose: () => void;
  onSubmit: (formData: BookingFormData) => void;
  // artistName: string;
}

export interface BookingFormData {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  state: string;
  city: string;
  eventType: string;
  eventDate: string;
  time: string;
  note: string;
  totalPrice: number;
}

const BookingRequestModal: React.FC<BookingRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  disabledDates
  // artistName,
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    state: "",
    city: "",
    eventType: "",
    eventDate: "",
    time: "",
    note: "",
    totalPrice: 1000,
  });

  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  // Sample data - in real app, these would come from API
  const stateOptions = [
    { value: "gujarat", label: "Gujarat" },
    { value: "maharashtra", label: "Maharashtra" },
    { value: "rajasthan", label: "Rajasthan" },
    { value: "delhi", label: "Delhi" },
    { value: "mumbai", label: "Mumbai" },
  ];

  const cityOptions = [
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "surat", label: "Surat" },
    { value: "vadodara", label: "Vadodara" },
    { value: "rajkot", label: "Rajkot" },
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
  ];

  const eventTypeOptions = [
    { value: "wedding", label: "Wedding" },
    { value: "birthday", label: "Birthday Party" },
    { value: "corporate", label: "Corporate Event" },
    { value: "concert", label: "Concert" },
    { value: "festival", label: "Festival" },
    { value: "other", label: "Other" },
  ];

  const timeSlotOptions = [
    { value: "morning", label: "Morning (6 AM - 12 PM)" },
    { value: "afternoon", label: "Afternoon (12 PM - 6 PM)" },
    { value: "evening", label: "Evening (6 PM - 12 AM)" },
    { value: "night", label: "Night (12 AM - 6 AM)" },
  ];

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.mobileNumber.trim())
      newErrors.mobileNumber = "Mobile number is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.eventType) newErrors.eventType = "Event type is required";
    if (!formData.eventDate) newErrors.eventDate = "Event date is required";
    if (!formData.time) newErrors.time = "Time slot is required";

    // Validate mobile number format
    if (
      formData.mobileNumber &&
      !/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ""))
    ) {
      newErrors.mobileNumber = "Please enter a valid 10-digit mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      mobileNumber: "",
      state: "",
      city: "",
      eventType: "",
      eventDate: "",
      time: "",
      note: "",
      totalPrice: 1000,
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request booking"
      size="lg"
      className="max-h-[90vh]"
      headerClassName="md:px-8 md:py-6 px-4! py-4!"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 md:px-8 px-4 md:py-6 py-4 space-y-6 overflow-y-auto md:max-h-[calc(100vh-300px)] max-h-[calc(90vh-180px)]">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              error={errors.firstName}
              required
            />
            <Input
              label="Last name"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              error={errors.lastName}
              required
            />
          </div>

          {/* Mobile Number */}

          <PhoneInput
            label="Mobile number"
            placeholder="Enter mobile number"
            value={formData.mobileNumber}
            onChange={(value) => handleInputChange("mobileNumber", value)}
            required
          />

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="State"
              placeholder="Select"
              options={stateOptions}
              value={formData.state}
              onChange={(value) => handleInputChange("state", value)}
              error={errors.state}
              required
            />
            <Select
              label="City"
              placeholder="Select"
              options={cityOptions}
              value={formData.city}
              onChange={(value) => handleInputChange("city", value)}
              error={errors.city}
              required
            />
          </div>

          {/* Event Type */}
          <Select
            label="Event type"
            placeholder="Select event type"
            options={eventTypeOptions}
            value={formData.eventType}
            onChange={(value) => handleInputChange("eventType", value)}
            error={errors.eventType}
            required
          />

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <DateInput
              label="Event date"
              placeholder="DD/MM/YYYY"
              value={formData.eventDate ? new Date(formData.eventDate) : null}
              onChange={(value) => handleInputChange("eventDate", value instanceof Date ? format(value, 'yyyy-MM-dd') : "")}
              error={errors.eventDate}
              disabledDates={disabledDates}
              required
            />
            <Select
              label="Time"
              placeholder="Select slot"
              options={timeSlotOptions}
              value={formData.time}
              onChange={(value) => handleInputChange("time", value)}
              error={errors.time}
              required
            />
          </div>
          <div className="relative">
            <Input
              label="Total Price"
              placeholder="Total Price"
              value={formData.totalPrice}
              onChange={(e) => handleInputChange("totalPrice", e.target.value)}
              type="number"
              min={1000}
              required
            />
          </div>

          {/* Note */}
          <div className="relative">
            <Textarea
              label="Note"
              placeholder="Add Note"
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              rows={4}
            />
            <button className="absolute top-0 right-0 text-blue p-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Fixed Submit Button */}
        <div className="md:px-8 px-4 md:py-6 py-4 border-t border-border-color bg-background">
          <Button type="submit" variant="primary" size="md" className="w-full">
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BookingRequestModal;
