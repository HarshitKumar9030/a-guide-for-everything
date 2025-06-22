// This should only contain client-safe functions

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}


export function getOptimizedImageUrl(
  publicId: string,
  width: number = 150,
  height: number = 150
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('Cloudinary cloud name not configured');
    return '';
  }

  const transformations = [
    `w_${width}`,
    `h_${height}`,
    'c_fill',
    'g_face', 
    'q_auto:best', 
    'f_auto', 
    'dpr_2.0' 
  ].join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}
