import { connectToDatabase } from './mongodb';
import { getUserPlan, getPlanLimits } from './user-plan';

export interface UsageRecord {
  userEmail: string;
  model: string;
  date: string; // YYYY-MM-DD
  requests: number;
  tokens?: number; // optional if token counting added later
  createdAt: Date;
  updatedAt: Date;
}

export async function recordUsage(userEmail: string, model: string, increment = 1) {
  const { db } = await connectToDatabase();
  const collection = db.collection<UsageRecord>('usage');
  const today = new Date();
  const dateStr = today.toISOString().slice(0,10);

  await collection.updateOne(
    { userEmail, model, date: dateStr },
    { 
      $setOnInsert: { createdAt: new Date() },
      $set: { updatedAt: new Date() },
      $inc: { requests: increment }
    },
    { upsert: true }
  );
}

export async function getUsage(userEmail: string) {
  const { db } = await connectToDatabase();
  const collection = db.collection<UsageRecord>('usage');
  const today = new Date();
  const dateStr = today.toISOString().slice(0,10);

  const docs = await collection.find({ userEmail, date: dateStr }).toArray();
  const usageByModel: Record<string, number> = {};
  docs.forEach(d => { usageByModel[d.model] = d.requests; });
  return usageByModel;
}

export async function checkAndIncrementUsage(userEmail: string, model: string) {
  const planDoc = await getUserPlan(userEmail);
  const limits = getPlanLimits(planDoc.plan);
  const usage = await getUsage(userEmail);
  const current = usage[model] || 0;

  // Map model to limit key
  const keyMap: Record<string,string> = {
    llama: 'llama',
    gemini: 'gemini',
    deepseek: 'deepseek',
    gpt41: 'gpt41',
    gpt41mini: 'gpt41mini',
    o3mini: 'o3mini'
  };
  const limitKey = keyMap[model];
  if (!limitKey) return { allowed: false, reason: 'Unknown model' };

  const limit = (limits as unknown as Record<string, number | boolean>)[limitKey] as number;
  if (limit === 0) return { allowed: false, reason: 'Model not available on your plan' };
  if (limit > 0 && current >= limit) return { allowed: false, reason: 'Daily limit reached' };

  await recordUsage(userEmail, model, 1);
  return { allowed: true, remaining: limit > 0 ? (limit - current - 1) : -1 };
}
