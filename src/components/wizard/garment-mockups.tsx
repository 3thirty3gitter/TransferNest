import React from 'react';
import { GarmentType } from '@/types/wizard';

interface GarmentMockupProps {
  type: GarmentType;
  className?: string;
}

export function TShirtMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* T-Shirt Body */}
      <path
        d="M60 60 L60 220 L140 220 L140 60 L160 60 L180 80 L180 100 L160 100 L160 120 L140 120 L140 60 L60 60 L60 120 L40 120 L40 100 L20 100 L20 80 L40 60 Z"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      {/* Neckline */}
      <ellipse cx="100" cy="60" rx="20" ry="12" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      {/* Sleeves */}
      <path d="M40 60 L20 80 L20 100 L40 100 L40 60 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      <path d="M160 60 L180 80 L180 100 L160 100 L160 60 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
    </svg>
  );
}

export function HoodieMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hoodie Body */}
      <path
        d="M50 50 L50 220 L150 220 L150 50 L165 50 L185 70 L185 110 L165 110 L165 120 L150 120 L150 50 L50 50 L50 120 L35 120 L35 110 L15 110 L15 70 L35 50 Z"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      {/* Hood */}
      <path
        d="M70 30 Q100 10 130 30 L130 55 L70 55 Z"
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      {/* Pocket */}
      <rect x="75" y="130" width="50" height="30" rx="5" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      {/* Sleeves */}
      <path d="M35 50 L15 70 L15 110 L35 110 L35 50 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      <path d="M165 50 L185 70 L185 110 L165 110 L165 50 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      {/* Drawstrings */}
      <line x1="85" y1="55" x2="85" y2="75" stroke="#9ca3af" strokeWidth="1" />
      <line x1="115" y1="55" x2="115" y2="75" stroke="#9ca3af" strokeWidth="1" />
    </svg>
  );
}

export function ToteBagMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bag Body */}
      <rect
        x="40"
        y="60"
        width="120"
        height="150"
        rx="5"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      {/* Handles */}
      <path
        d="M60 60 Q60 30 80 30 Q80 20 100 20 Q120 20 120 30 Q140 30 140 60"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="3"
      />
      {/* Bottom detail */}
      <rect x="45" y="200" width="110" height="5" fill="#e5e7eb" />
    </svg>
  );
}

export function HatMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hat Crown */}
      <ellipse cx="100" cy="60" rx="60" ry="35" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
      {/* Hat Bill */}
      <ellipse cx="100" cy="60" rx="80" ry="15" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      {/* Front panel */}
      <path d="M70 40 Q100 35 130 40 L130 60 L70 60 Z" fill="#fafafa" stroke="#d1d5db" strokeWidth="1" />
    </svg>
  );
}

export function TankTopMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tank Body */}
      <path
        d="M70 50 L70 220 L130 220 L130 50 L145 50 L145 90 L130 90 L130 50 L70 50 L70 90 L55 90 L55 50 Z"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      {/* Neckline */}
      <path d="M70 50 Q100 45 130 50" fill="none" stroke="#d1d5db" strokeWidth="2" />
      {/* Armholes */}
      <path d="M55 50 L55 90 Q62 80 70 70" fill="none" stroke="#d1d5db" strokeWidth="2" />
      <path d="M145 50 L145 90 Q138 80 130 70" fill="none" stroke="#d1d5db" strokeWidth="2" />
    </svg>
  );
}

export function LongSleeveMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Long Sleeve Body */}
      <path
        d="M60 60 L60 220 L140 220 L140 60 L160 60 L180 80 L180 160 L165 165 L165 120 L140 120 L140 60 L60 60 L60 120 L35 120 L35 165 L20 160 L20 80 L40 60 Z"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      {/* Neckline */}
      <ellipse cx="100" cy="60" rx="20" ry="12" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      {/* Long Sleeves */}
      <path d="M35 60 L20 80 L20 160 L35 165 L35 60 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
      <path d="M165 60 L180 80 L180 160 L165 165 L165 60 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
    </svg>
  );
}

export default function GarmentMockup({ type, className }: GarmentMockupProps) {
  switch (type) {
    case 'tshirt':
      return <TShirtMockup className={className} />;
    case 'hoodie':
      return <HoodieMockup className={className} />;
    case 'tote':
      return <ToteBagMockup className={className} />;
    case 'hat':
      return <HatMockup className={className} />;
    case 'tank':
      return <TankTopMockup className={className} />;
    case 'longsleeve':
      return <LongSleeveMockup className={className} />;
    default:
      return <TShirtMockup className={className} />;
  }
}
