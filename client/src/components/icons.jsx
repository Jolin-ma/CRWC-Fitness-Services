const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

export function CalendarIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function ClipboardIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5M8.5 11h7M8.5 15h5" />
    </svg>
  );
}

export function GridIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.8" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.8" />
    </svg>
  );
}

export function TrendIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 17.5l6-6.5 4 4 7-8" />
      <path d="M15.5 6.5h5v5" />
    </svg>
  );
}

export function FolderIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function TargetIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DumbbellIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M2.5 12h2M19.5 12h2M4.5 9v6M19.5 9v6M7 7v10a1.5 1.5 0 0 0 1.5 1.5v0A1.5 1.5 0 0 0 10 17V7a1.5 1.5 0 0 0-1.5-1.5v0A1.5 1.5 0 0 0 7 7zM14 7v10a1.5 1.5 0 0 0 1.5 1.5v0A1.5 1.5 0 0 0 17 17V7a1.5 1.5 0 0 0-1.5-1.5v0A1.5 1.5 0 0 0 14 7z" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function AppleIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 8.5c-1.2-1.4-3-2-4.5-1.3C5.5 8 4.5 10.3 4.5 12.7c0 3.3 2.3 7.3 4.8 7.3.9 0 1.3-.5 2.2-.5.9 0 1.3.5 2.2.5 2 0 3.8-2.9 4.6-5.3-2.4-1-2.7-4.6-.3-6-1-.9-2.3-1.2-3.4-.7-.5.2-1 .5-1.6.5-.5 0-.6-.4-1-1z" />
      <path d="M12.5 6c.2-1.2 1.2-2.2 2.5-2.5-.1 1.3-1.3 2.6-2.5 2.5z" />
    </svg>
  );
}

export function LogoutIcon({ className = "h-[15px] w-[15px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9M16 16l5-4-5-4M21 12H9" />
    </svg>
  );
}
