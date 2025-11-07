'use client';

interface HackClubOutageBannerProps {
  className?: string;
  message?: string;
}

export default function HackClubOutageBanner({
  className = '',
  message = "HackClub models are temporarily out of service. We're working with the provider to restore access. Thanks for your patience.",
}: HackClubOutageBannerProps) {
  return (
    <div
      className={`w-full rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-xs font-medium text-amber-100 shadow-lg shadow-amber-900/30 backdrop-blur ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
