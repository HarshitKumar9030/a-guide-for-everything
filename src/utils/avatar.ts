import { getOptimizedImageUrl } from '@/lib/cloudinary';

export function getAvatarUrl(
  avatar: string | null | undefined,
  size: number = 150
): string | null {
  if (!avatar || avatar === '/logo.svg' || avatar.includes('/logo.svg')) {
    return null;
  }
  
  if (avatar.includes('cloudinary.com') && avatar.includes('/image/upload/')) {
    return avatar;
  }
  
  if (avatar.includes('cloudinary.com') && avatar.includes('/avatars/')) {
    const matches = avatar.match(/\/avatars\/([^/.]+)/);
    if (matches?.[1]) {
      return getOptimizedImageUrl(`avatars/${matches[1]}`, size, size);
    }
  }
  
  return avatar;
}

export function isCloudinaryAvatar(avatar: string | null | undefined): boolean {
  return !!(avatar && avatar.includes('cloudinary.com') && avatar.includes('/avatars/'));
}
