import { connectToDatabase } from './mongodb';

export interface UserLimitDoc {
  userEmail: string;
  llamaGuides: number;
  geminiGuides: number;
  lastExport: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserLimits(userEmail: string): Promise<UserLimitDoc> {
  const { db } = await connectToDatabase();
  const collection = db.collection<UserLimitDoc>('user_limits');

  const userLimits = await collection.findOne({ userEmail });

  if (!userLimits) {
    const newUserLimits: UserLimitDoc = {
      userEmail,
      llamaGuides: 0,
      geminiGuides: 0,
      lastExport: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newUserLimits);
    return newUserLimits;
  }

  return userLimits;
}

export async function incrementGuideCount(userEmail: string, model: string): Promise<void> {
  const { db } = await connectToDatabase();
  const collection = db.collection<UserLimitDoc>('user_limits');

  const updateField = model === 'llama' ? 'llamaGuides' : 'geminiGuides';
  
  await collection.updateOne(
    { userEmail },
    { 
      $inc: { [updateField]: 1 },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

export async function updateLastExport(userEmail: string): Promise<void> {
  const { db } = await connectToDatabase();
  const collection = db.collection<UserLimitDoc>('user_limits');

  await collection.updateOne(
    { userEmail },
    { 
      $set: { 
        lastExport: Date.now(),
        updatedAt: new Date() 
      }
    },
    { upsert: true }
  );
}
