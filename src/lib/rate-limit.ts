export interface UserLimits {
  llamaGuides: number;
  geminiGuides: number;
  deepseekGuides: number;
  gpt41miniGuides: number;
  o3miniGuides: number;
  osslargeGuides?: number;
  lastExport: number;
}

export interface GuestLimits {
  guides: number;
}

export const RATE_LIMITS = {
  EXPORT_COOLDOWN: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  USER_LLAMA_LIMIT: 6,
  USER_GEMINI_LIMIT: 4,
  USER_DEEPSEEK_LIMIT: 4,
  USER_GPT41MINI_LIMIT: 3,
  USER_O3MINI_LIMIT: 2,
  USER_OSSLARGE_LIMIT: 8,
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
  } else if (model === 'deepseek') {
    return limits.deepseekGuides < RATE_LIMITS.USER_DEEPSEEK_LIMIT;
  } else if (model === 'gpt41mini') {
    return limits.gpt41miniGuides < RATE_LIMITS.USER_GPT41MINI_LIMIT;
  } else if (model === 'o3mini') {
    return limits.o3miniGuides < RATE_LIMITS.USER_O3MINI_LIMIT;
  } else if (model === 'osslarge') {
    return (limits.osslargeGuides || 0) < RATE_LIMITS.USER_OSSLARGE_LIMIT;
  }
  return false;
}

export function checkGuestGuideLimit(limits: GuestLimits): boolean {
  return limits.guides < RATE_LIMITS.GUEST_GUIDE_LIMIT;
}
