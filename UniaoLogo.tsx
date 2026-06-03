import React from 'react';

export function UniaoLogo({ className = "h-10 w-auto", textColor = "#18181b" }: { className?: string, textColor?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 380 110" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft, rich corporate gold gradient matching the uploaded logo */}
        <linearGradient id="uniaoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d1a65c" />
          <stop offset="35%" stopColor="#e5c583" />
          <stop offset="100%" stopColor="#bd9043" />
        </linearGradient>
      </defs>

      {/* Highly accurate dual-loop União logo emblem in gold */}
      <g stroke="url(#uniaoGoldGrad)" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 33,25 
                 C 33,25, 33,55, 33,65 
                 C 33,85, 53,92, 65,80 
                 C 74,70, 75,55, 75,50
                 C 75,40, 80,32, 90,32
                 C 100,32, 105,40, 105,50
                 C 105,55, 106,70, 115,80
                 C 127,92, 147,85, 147,65
                 C 147,55, 147,25, 147,25" />
      </g>

      {/* Typography section */}
      <g fill={textColor} fontFamily="Inter, system-ui, sans-serif">
        {/* 'união' in bold lowercase */}
        <text x="175" y="62" fontSize="56" fontWeight="800" letterSpacing="-1.5">
          união
        </text>
        
        {/* Customized subtle tilde matching their lightweight header logo element */}
        <path d="M 292,16 C 295,14, 298,14, 301,16 C 304,18, 307,18, 310,16" 
              stroke="url(#uniaoGoldGrad)" 
              strokeWidth="5.5" 
              strokeLinecap="round" 
              fill="none" />
      </g>

      {/* 'multimodal' in corporate silver */}
      <g fill={textColor === "#FFFFFF" ? "#a1a1aa" : "#71717a"} fontFamily="Inter, system-ui, sans-serif">
        <text x="177" y="94" fontSize="24" fontWeight="600" letterSpacing="2.5">
          multimodal
        </text>
      </g>
    </svg>
  );
}
