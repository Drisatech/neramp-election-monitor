import React from 'react';

interface NerampLogoProps {
  className?: string;
  size?: number;
}

export const NerampLogo: React.FC<NerampLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="NERAMP - Nigeria Election Results Analysis and Monitoring Platform"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Gradients for rich visual depth */}
          <linearGradient id="boxGrad" x1="10" y1="26" x2="54" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          <linearGradient id="lidGrad" x1="6" y1="22" x2="58" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="paperGrad" x1="24" y1="4" x2="40" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>

          <filter id="shadow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#022c22" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* --- BALLOT SHEET (Being inserted into the opening) --- */}
        <g id="ballot-sheet">
          {/* The vote sheet angled descending into the box opening */}
          <path
            d="M24 5C24 4.44772 24.4477 4 25 4H39C39.5523 4 40 4.44772 40 5V27H24V5Z"
            fill="url(#paperGrad)"
            stroke="#cbd5e1"
            strokeWidth="0.8"
          />

          {/* Fold / 3D shading on ballot paper */}
          <path d="M24 23H40V26H24V23Z" fill="#94a3b8" fillOpacity="0.3" />

          {/* Printed lines on ballot paper representing voting options */}
          <line x1="28" y1="9" x2="36" y2="9" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="28" y1="13" x2="36" y2="13" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />

          {/* Green election checkmark mark on ballot sheet */}
          <path
            d="M28.5 18L30.5 20L35.5 15.5"
            stroke="#059669"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* --- BALLOT BOX (Lid and Main Container) --- */}
        {/* Main Box Body */}
        <rect
          x="10"
          y="26"
          width="44"
          height="32"
          rx="3"
          fill="url(#boxGrad)"
          stroke="#064e3b"
          strokeWidth="1.2"
        />

        {/* Front Plate / Seal on Box */}
        <rect
          x="16"
          y="34"
          width="32"
          height="18"
          rx="2"
          fill="#065f46"
          stroke="#10b981"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />

        {/* NERAMP Text on Ballot Box Front */}
        <text
          x="32"
          y="44.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="6.2"
          fontWeight="900"
          letterSpacing="0.8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          NERAMP
        </text>

        {/* Nigeria Flag Accent Stripe below NERAMP text */}
        <rect x="23" y="47.5" width="6" height="1.8" fill="#10b981" rx="0.4" />
        <rect x="29" y="47.5" width="6" height="1.8" fill="#ffffff" rx="0.4" />
        <rect x="35" y="47.5" width="6" height="1.8" fill="#10b981" rx="0.4" />

        {/* Box Lid (slight bevel overhang) */}
        <rect
          x="7"
          y="23"
          width="50"
          height="6"
          rx="1.5"
          fill="url(#lidGrad)"
          stroke="#064e3b"
          strokeWidth="1"
        />

        {/* Ballot Slot Opening (the narrow opening through which the vote sheet enters) */}
        <rect
          x="22"
          y="24.5"
          width="20"
          height="3"
          rx="1"
          fill="#022c22"
          stroke="#047857"
          strokeWidth="0.5"
        />
        {/* Slot interior shadow to create depth */}
        <line x1="23.5" y1="26" x2="40.5" y2="26" stroke="#000000" strokeWidth="1" opacity="0.7" />
      </svg>
    </div>
  );
};
