'use client';

import Image from 'next/image';
import { User, X, Camera } from 'lucide-react';
import { getAvatarUrl } from '@/utils/avatar';
import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  onDelete?: () => void;
  showActionIcon?: boolean;
}

export default function Avatar({ 
  src, 
  alt = 'Avatar', 
  size = 40, 
  className = '',
  onDelete,
  showActionIcon = false
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const optimizedSrc = getAvatarUrl(src, size);
  
  // Show fallback if no source or image failed to load
  if (!optimizedSrc || imageError) {
    return (
      <div 
        className={`bg-[#333] rounded-full flex items-center justify-center text-white relative ${className}`}
        style={{ width: size, height: size }}
      >
        <User size={size * 0.6} />
        
        {showActionIcon && (
          <div className="absolute bottom-1 right-1 bg-[#1BE1FF] rounded-full flex items-center justify-center p-2">
            <Camera size={size * 0.2} color="#1E1E1E" />
          </div>
        )}
      </div>
    );
  }
  // Has avatar - show image with X icon
  return (
    <div 
      className={`rounded-full overflow-hidden bg-[#333] relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={optimizedSrc}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        unoptimized={optimizedSrc.includes('cloudinary.com')}
      />
      
      {showActionIcon && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute bottom-1 right-1 bg-[#1BE1FF] rounded-full flex items-center justify-center p-2"
        >
          <X size={size * 0.2} color="#1E1E1E" />
        </div>
      )}
    </div>
  );
}
