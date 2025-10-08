import React from 'react';

export const FramingGuide: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Contorno da cabeça */}
        <ellipse 
          cx="100" 
          cy="80" 
          rx="60" 
          ry="80" 
          stroke="white" 
          strokeWidth="2" 
          strokeDasharray="5 5" 
          fill="none" 
        />
        
        {/* Linha dos olhos */}
        <line 
          x1="60" 
          y1="65" 
          x2="140" 
          y2="65" 
          stroke="white" 
          strokeWidth="1" 
          strokeDasharray="3 3" 
        />
        
        {/* Linha do nariz */}
        <line 
          x1="100" 
          y1="65" 
          x2="100" 
          y2="105" 
          stroke="white" 
          strokeWidth="1" 
          strokeDasharray="3 3" 
        />

        {/* Linha da boca */}
        <line 
          x1="75" 
          y1="105" 
          x2="125" 
          y2="105" 
          stroke="white" 
          strokeWidth="1" 
          strokeDasharray="3 3" 
        />
      </svg>
    </div>
  );
};