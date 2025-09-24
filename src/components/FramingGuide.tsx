import React from 'react';

export const FramingGuide: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* This oval shape guides face placement */}
        <ellipse
          cx="50"
          cy="50"
          rx="30"
          ry="40"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1"
          strokeDasharray="4 2"
          fill="none"
        />
        {/* A line for the smile/mouth level */}
        <line
          x1="30"
          y1="60"
          x2="70"
          y2="60"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      </svg>
    </div>
  );
};