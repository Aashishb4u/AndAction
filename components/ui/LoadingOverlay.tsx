import React from 'react';
import LoadingSpinner from './Loading';

interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function LoadingOverlay({ text = 'Loading...', size = 'lg' }: Props) {
  return <LoadingSpinner fullScreen={true} size={size} text={text} />;
}
