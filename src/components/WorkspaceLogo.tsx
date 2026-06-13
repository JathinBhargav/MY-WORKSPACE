import React from 'react';

interface WorkspaceLogoProps {
  className?: string;
  size?: number;
}

export const WorkspaceLogo: React.FC<WorkspaceLogoProps> = ({ className = '', size = 52 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Metallic Gold Gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="25%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Glowing Green Core Gradient */}
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Dark Metallic Ring Gradient */}
          <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          {/* Neon Green Radial Glow */}
          <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>

          {/* Gold Loop Glow */}
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          {/* Filters for Glow Effects */}
          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Outer Background Glows */}
        <circle cx="100" cy="100" r="90" fill="url(#goldGlow)" />
        <circle cx="100" cy="100" r="50" fill="url(#neonGlow)" />

        {/* Cybernetic Microchip Grounding Circles */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="#27272a"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          opacity="0.6"
        />
        <circle
          cx="100"
          cy="100"
          r="78"
          stroke="#1f2937"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* Diagonal Tech Support Leads/Pins */}
        <line x1="30" y1="30" x2="60" y2="60" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="170" y1="170" x2="140" y2="140" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="170" y1="30" x2="140" y2="60" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="30" y1="170" x2="60" y2="140" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

        {/* Heavy Outer Gold-Plated Shielding Border */}
        <circle
          cx="100"
          cy="100"
          r="74"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          opacity="0.85"
        />

        {/* Left Side Gold Metallic "W" */}
        <path
          d="M 28 85 L 42 128 L 52 104 L 62 128 L 76 85"
          stroke="url(#goldGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        />
        <path
          d="M 28 85 L 42 128 L 52 104 L 62 128 L 76 85"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Right Side Gold Metallic "W" */}
        <path
          d="M 124 85 L 138 128 L 148 104 L 158 128 L 172 85"
          stroke="url(#goldGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        />
        <path
          d="M 124 85 L 138 128 L 148 104 L 158 128 L 172 85"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Double Intertwining Orbits */}
        {/* Orbit Left-to-Right Tilt */}
        <ellipse
          cx="100"
          cy="100"
          rx="66"
          ry="26"
          transform="rotate(-30 100 100)"
          stroke="url(#goldGrad)"
          strokeWidth="4"
          className="drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="65"
          ry="25"
          transform="rotate(-30 100 100)"
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="20 40"
          opacity="0.7"
        />

        {/* Orbit Right-to-Left Tilt */}
        <ellipse
          cx="100"
          cy="100"
          rx="66"
          ry="26"
          transform="rotate(30 100 100)"
          stroke="url(#goldGrad)"
          strokeWidth="4"
          className="drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="65"
          ry="25"
          transform="rotate(30 100 100)"
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="40 20"
          opacity="0.7"
        />

        {/* Glowing Connected Nodes on the Orbits */}
        {/* Top-Right Sync Node */}
        <circle cx="132" cy="45" r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
        <circle cx="132" cy="45" r="7" stroke="#fbbf24" strokeWidth="1" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />

        {/* Bottom-Left Sync Node */}
        <circle cx="68" cy="155" r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
        <circle cx="68" cy="155" r="7" stroke="#fbbf24" strokeWidth="1" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />

        {/* Core Connection Lines */}
        <line x1="100" y1="52" x2="100" y2="74" stroke="#10b981" strokeWidth="1.5" opacity="0.7" strokeDasharray="2 2" />
        <line x1="100" y1="126" x2="100" y2="148" stroke="#10b981" strokeWidth="1.5" opacity="0.7" strokeDasharray="2 2" />

        {/* CENTRAL GLOWING CORE */}
        {/* Hexagonal Base */}
        <polygon
          points="100,74 123,87 123,113 100,126 77,113 77,87"
          fill="url(#darkMetal)"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
        />

        {/* Nested Neon Hexagon */}
        <polygon
          points="100,78 119,89 119,111 100,122 81,111 81,89"
          fill="#022c22"
          stroke="url(#greenGrad)"
          strokeWidth="2"
          filter="url(#glowGreen)"
        />

        {/* "AI" Letter Core with Glow and Drop Shadow */}
        <text
          x="100"
          y="103"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#34d399"
          fontSize="17"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
          filter="url(#glowGreen)"
          className="select-none"
        >
          AI
        </text>

        {/* Small White Specular Highlight on Core */}
        <path
          d="M 85 92 Q 90 88 100 88"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* INTEGRATED ORBITAL CATEGORY ICONS */}
        {/* 1. Envelope Node (Mail) - Top Center */}
        <g transform="translate(92, 41) scale(0.65)" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <rect width="24" height="18" rx="3" fill="#18181b" stroke="url(#goldGrad)" strokeWidth="2" />
          <path d="M 2 3 L 12 10 L 22 3" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 2. Envelope Node (Mail) - Bottom Center */}
        <g transform="translate(92, 141) scale(0.65)" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <rect width="24" height="18" rx="3" fill="#18181b" stroke="url(#goldGrad)" strokeWidth="2" />
          <path d="M 2 3 L 12 10 L 22 3" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 3. Checkmark Badge (Task) - Right Center Loop */}
        <g transform="translate(136, 91) scale(0.7)" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <rect width="22" height="22" rx="5" fill="#18181b" stroke="url(#goldGrad)" strokeWidth="2" />
          <path d="M 6 11 L 10 15 L 17 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};
