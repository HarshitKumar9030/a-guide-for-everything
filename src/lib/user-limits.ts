import { connectToDatabase } from './mongodb';

export interface UserLimitDoc {
  userEmail: string;
  llamaGuides: number;
  geminiGuides: number;
  deepseekGuides: number;
  gpt41Guides: number;
  gpt41miniGuides: number;
  o3miniGuides: number;
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
      deepseekGuides: 0,
      gpt41Guides: 0,
      gpt41miniGuides: 0,
      o3miniGuides: 0,
      lastExport: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newUserLimits);
    return newUserLimits;
  }

  const fieldsToCheck = {
    deepseekGuides: 0,
    gpt41Guides: 0,
    gpt41miniGuides: 0,
    o3miniGuides: 0
  };

  const missingFields: Record<string, number> = {};
  let hasUpdates = false;

  for (const [field, defaultValue] of Object.entries(fieldsToCheck)) {
    if ((userLimits as Record<string, unknown>)[field] === undefined) {
      missingFields[field] = defaultValue;
      (userLimits as Record<string, unknown>)[field] = defaultValue;
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await collection.updateOne(
      { userEmail },
      { 
        $set: { ...missingFields, updatedAt: new Date() }
      }
    );
  }

  return userLimits;
}

export async function incrementGuideCount(userEmail: string, model: string): Promise<void> {
  const { db } = await connectToDatabase();
  const collection = db.collection<UserLimitDoc>('user_limits');

  let updateField = '';
  if (model === 'llama') {
    updateField = 'llamaGuides';
  } else if (model === 'gemini') {
    updateField = 'geminiGuides';
  } else if (model === 'deepseek') {
    updateField = 'deepseekGuides';
  } else if (model === 'gpt41') {
    updateField = 'gpt41Guides';
  } else if (model === 'gpt41mini') {
    updateField = 'gpt41miniGuides';
  } else if (model === 'o3mini') {
    updateField = 'o3miniGuides';
  } else {
    throw new Error(`Invalid model: ${model}`);
  }
  
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
