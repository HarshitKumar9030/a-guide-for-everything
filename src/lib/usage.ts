import { connectToDatabase } from './mongodb';
import { getUserPlan, getPlanLimits } from './user-plan';

type PlanCounterKey = 'llama' | 'gemini' | 'deepseek' | 'gpt41' | 'gpt41mini' | 'o3mini' | 'osslarge' | 'nanobanana';

export interface UsageRecord {
  userEmail: string;
  model: string;
  date: string; // YYYY-MM-DD
  requests: number;
  textRequests: number;
  imageGenerations: number;
  tokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageSummary {
  requests: number;
  textRequests: number;
  imageGenerations: number;
  tokens: number;
}

export interface UsageHistoryEntry {
  date: string;
  requests: number;
  textRequests: number;
  imageGenerations: number;
  tokens: number;
  byModel: Record<string, UsageSummary>;
}

export interface UsageIncrement {
  /** Total request counter – supply 1 when counting a new request */
  requests?: number;
  text?: number;
  images?: number;
  tokens?: number;
}

export async function recordUsage(userEmail: string, model: string, increment: UsageIncrement = {}) {
  const { db } = await connectToDatabase();
  const collection = db.collection<UsageRecord>('usage');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const incRequests = typeof increment.requests === 'number' ? increment.requests : 0;
  const incText = typeof increment.text === 'number' ? increment.text : 0;
  const incImages = typeof increment.images === 'number' ? increment.images : 0;
  const incTokens = typeof increment.tokens === 'number' ? increment.tokens : 0;

  await collection.updateOne(
    { userEmail, model, date: dateStr },
    {
      $setOnInsert: {
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
      $inc: {
        requests: incRequests,
        textRequests: incText,
        imageGenerations: incImages,
        tokens: incTokens,
      },
    },
    { upsert: true }
  );
}

export async function getUsage(userEmail: string) {
  const { db } = await connectToDatabase();
  const collection = db.collection<UsageRecord>('usage');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const docs = await collection.find({ userEmail, date: dateStr }).toArray();
  const usageByModel: Record<string, UsageSummary> = {};
  docs.forEach(d => {
    usageByModel[d.model] = {
      requests: d.requests ?? 0,
      textRequests: d.textRequests ?? 0,
      imageGenerations: d.imageGenerations ?? 0,
      tokens: d.tokens ?? 0,
    };
  });
  return usageByModel;
}

export async function getUsageHistory(userEmail: string, days = 14) {
  const { db } = await connectToDatabase();
  const collection = db.collection<UsageRecord>('usage');
  const dayStrings: string[] = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    day.setUTCDate(day.getUTCDate() - offset);
    dayStrings.push(day.toISOString().slice(0, 10));
  }

  const baseline = new Map<string, UsageHistoryEntry>();
  dayStrings.forEach(date => {
    baseline.set(date, {
      date,
      requests: 0,
      textRequests: 0,
      imageGenerations: 0,
      tokens: 0,
      byModel: {},
    });
  });

  const docs = await collection
    .find({ userEmail, date: { $in: dayStrings } })
    .toArray();

  docs.forEach(doc => {
    const entry = baseline.get(doc.date);
    if (!entry) return;
    entry.requests += doc.requests ?? 0;
    entry.textRequests += doc.textRequests ?? 0;
    entry.imageGenerations += doc.imageGenerations ?? 0;
    entry.tokens += doc.tokens ?? 0;
    entry.byModel[doc.model] = {
      requests: doc.requests ?? 0,
      textRequests: doc.textRequests ?? 0,
      imageGenerations: doc.imageGenerations ?? 0,
      tokens: doc.tokens ?? 0,
    };
  });

  return Array.from(baseline.values());
}

export async function checkAndIncrementUsage(userEmail: string, model: string) {
  const planDoc = await getUserPlan(userEmail);
  const limits = getPlanLimits(planDoc.plan);
  const usage = await getUsage(userEmail);
  const current = usage[model]?.requests ?? 0;

  // Map model to limit key
  const keyMap: Record<string, PlanCounterKey> = {
    llama: 'llama',
    gemini: 'gemini',
    deepseek: 'deepseek',
    gpt41: 'gpt41',
    gpt41mini: 'gpt41mini',
    o3mini: 'o3mini',
    osslarge: 'osslarge',
    nanobanana: 'nanobanana',
  };
  const limitKey = keyMap[model];
  if (!limitKey) return { allowed: false, reason: 'Unknown model' };

  const limit = limits[limitKey];
  if (limit === 0) return { allowed: false, reason: 'Model not available on your plan' };
  if (limit > 0 && current >= limit) return { allowed: false, reason: 'Daily limit reached' };

  await recordUsage(userEmail, model, { requests: 1 });
  return { allowed: true, remaining: limit > 0 ? Math.max(limit - current - 1, 0) : -1 };
}
