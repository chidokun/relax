const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const PlayIcon = () => (
  <svg {...base} width={18} height={18} fill="currentColor" stroke="none">
    <path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z" />
  </svg>
);

export const PauseIcon = () => (
  <svg {...base} width={18} height={18} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const PrevIcon = () => (
  <svg {...base}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const NextIcon = () => (
  <svg {...base}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const TimerIcon = () => (
  <svg {...base} width={17} height={17}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l2.2 1.6M10 3h4" />
  </svg>
);

export const InfinityIcon = () => (
  <svg {...base} width={18} height={18}>
    <path d="M7.2 15.2c-1.8 0-3.2-1.4-3.2-3.2s1.4-3.2 3.2-3.2c3.3 0 6.3 6.4 9.6 6.4 1.8 0 3.2-1.4 3.2-3.2s-1.4-3.2-3.2-3.2c-3.3 0-6.3 6.4-9.6 6.4z" />
  </svg>
);

export const VolumeIcon = ({ level, muted }: { level: number; muted: boolean }) => (
  <svg {...base}>
    <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" fill="currentColor" fillOpacity="0.15" />
    {muted || level === 0 ? (
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    ) : (
      <>
        <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
        {level > 0.5 && <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />}
      </>
    )}
  </svg>
);

export const SettingsIcon = () => (
  <svg {...base}>
    <path d="M5 7h9M18 7h1M5 17h1M10 17h9" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);

export const ChevronDown = () => (
  <svg {...base} width={14} height={14}>
    <path d="M7 10l5 5 5-5" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} width={16} height={16}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ModeIcons = {
  focus: () => (
    <svg {...base} width={16} height={16}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  relax: () => (
    <svg {...base} width={16} height={16}>
      <path d="M3 14c3-4 6-4 9 0s6 4 9 0" />
      <path d="M3 9c3-4 6-4 9 0s6 4 9 0" opacity="0.6" />
    </svg>
  ),
  sleep: () => (
    <svg {...base} width={16} height={16}>
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
    </svg>
  ),
};
