import { connectToDatabase } from './mongodb';

export interface GuestLimitDoc {
  ipAddress: string;
  guides: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getGuestLimits(ipAddress: string): Promise<GuestLimitDoc> {
  const { db } = await connectToDatabase();
  const collection = db.collection<GuestLimitDoc>('guest_limits');

  const guestLimits = await collection.findOne({ ipAddress });

  if (!guestLimits) {
    const newGuestLimits: GuestLimitDoc = {
      ipAddress,
      guides: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newGuestLimits);
    return newGuestLimits;
  }

  return guestLimits;
}

export async function incrementGuestGuideCount(ipAddress: string): Promise<void> {
  const { db } = await connectToDatabase();
  const collection = db.collection<GuestLimitDoc>('guest_limits');

  await collection.updateOne(
    { ipAddress },
    { 
      $inc: { guides: 1 },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfIP) {
    return cfIP;
  }
  
  return 'unknown';
}
