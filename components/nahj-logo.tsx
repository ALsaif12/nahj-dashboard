// Stylised mark inspired by the NAHJ logo: graduation cap + book + gold diamond.
// Pure SVG so it scales cleanly at any size.

export function NahjLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="NAHJ logo">
      <defs>
        <linearGradient id="nahj-cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A8A9D" />
          <stop offset="100%" stopColor="#1F6E82" />
        </linearGradient>
        <linearGradient id="nahj-book" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F6E82" />
          <stop offset="100%" stopColor="#0E3B47" />
        </linearGradient>
      </defs>
      {/* Mortarboard cap */}
      <path d="M32 8 L58 18 L32 28 L6 18 Z" fill="url(#nahj-cap)" />
      <path d="M32 8 L58 18 L32 28 L6 18 Z" fill="none" stroke="#0E3B47" strokeWidth="0.6" />
      {/* Book/scroll body */}
      <path d="M14 26 L50 26 L50 52 Q32 60 14 52 Z" fill="url(#nahj-book)" />
      {/* Inner page panel */}
      <path d="M20 30 L44 30 L44 48 Q32 54 20 48 Z" fill="#FAF7F0" opacity="0.95" />
      {/* Gold diamond accent */}
      <rect x="28" y="36" width="8" height="8" transform="rotate(45 32 40)" fill="#E0A82E" stroke="#0E3B47" strokeWidth="0.6" />
    </svg>
  );
}
