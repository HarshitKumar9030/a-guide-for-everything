'use client';

import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarUpdate?: (url: string | null) => void;
  size?: number;
  showLabel?: boolean;
}

export default function AvatarUpload({
  currentAvatar,
  onAvatarUpdate,
  size = 220,
  showLabel = true
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar } = useAvatarUpload();


  const handleAvatarClick: () => void = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadAvatar(file);
      if (result && result.url) {
        onAvatarUpdate?.(result.url);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasValidAvatar = currentAvatar && currentAvatar.trim() !== '';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div 
          className="rounded-full bg-[#272727] border border-[#323232] overflow-hidden"
          style={{ width: size, height: size }}
        >
          {hasValidAvatar ? (
            <Image
              src={currentAvatar}
              alt="User avatar"
              width={size}
              height={size}
              className="w-full h-full object-cover"
              unoptimized={currentAvatar.includes('cloudinary.com')}
              onError={(e) => {
                console.error('Image failed to load:', currentAvatar);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={size * 0.6} color="#666" />
            </div>
          )}
        </div>
        
        <div 
          className="absolute bottom-2 right-2 bg-[#1BE1FF] rounded-full w-[60px] h-[60px] flex items-center justify-center cursor-pointer"
          onClick={handleAvatarClick}
        >
          <Camera 
            size={24} 
            color="#1E1E1E" 
          />
        </div>
      </div>

      {showLabel && (
        <span className="mt-4 text-white  text-sm">
          Update your Avatar
        </span>
      )}

      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
