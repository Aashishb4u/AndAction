import React from 'react';

interface PlayProps {
  className?: string;
  size?: number;
}

const Play: React.FC<PlayProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
};

export default Play;
