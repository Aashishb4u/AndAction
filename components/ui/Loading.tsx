import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const loadingCircle = (
  <svg
    className="w-full h-full text-transparent"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="50"
      cy="50"
      r="45"
      stroke="currentColor"
      strokeWidth="8"
      strokeOpacity="0.3"
      className="text-gray-800"
    />
    <circle
      cx="50"
      cy="50"
      r="45"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="280"
      strokeDashoffset="80"
      className="text-purple-500"
    >
      <animate
        attributeName="stroke-dashoffset"
        values="280;0"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

export default function LoadingSpinner({
  size = "lg",
  text = "Loading artists...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinnerSize = sizeClasses[size];

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6">
          <div className={`${spinnerSize} animate-spin`}>{loadingCircle}</div>
          <p className="text-lg font-medium text-white animate-pulse">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-20">
      <div className={`${spinnerSize} animate-spin`}>{loadingCircle}</div>
      {text && (
        <p className="mt-6 text-lg font-medium text-gray-300 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}