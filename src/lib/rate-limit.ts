export interface UserLimits {
  llamaGuides: number;
  geminiGuides: number;
  lastExport: number;
}

export interface GuestLimits {
  guides: number;
}

export const RATE_LIMITS = {
  EXPORT_COOLDOWN: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  USER_LLAMA_LIMIT: 6,
  USER_GEMINI_LIMIT: 4,
  GUEST_GUIDE_LIMIT: 3, // guest limit 3 generations forverr
};

export function checkExportCooldown(lastExport: number): boolean {
  const now = Date.now();
  return (now - lastExport) >= RATE_LIMITS.EXPORT_COOLDOWN;
}

export function getTimeUntilNextExport(lastExport: number): number {
  const now = Date.now();
  const elapsed = now - lastExport;
  const remaining = RATE_LIMITS.EXPORT_COOLDOWN - elapsed;
  return Math.max(0, remaining);
}

export function formatTimeRemaining(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function checkUserGuideLimit(model: string, limits: UserLimits): boolean {
  if (model === 'llama') {
    return limits.llamaGuides < RATE_LIMITS.USER_LLAMA_LIMIT;
  } else if (model === 'gemini') {
    return limits.geminiGuides < RATE_LIMITS.USER_GEMINI_LIMIT;
  }
  return false;
}

export function checkGuestGuideLimit(limits: GuestLimits): boolean {
  return limits.guides < RATE_LIMITS.GUEST_GUIDE_LIMIT;
}
