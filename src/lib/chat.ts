import { connectToDatabase } from './mongodb';
import { getUserPlan, checkModelAccess, getPlanLimits } from './user-plan';
import { getUserLimits, incrementGuideCount } from './user-limits';
import { getUsage, recordUsage } from './usage';

export interface ChatMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  model?: string;
  images?: { mimeType: string; data: string }[]; // base64 images
}

export interface ChatSessionDoc {
  _id?: string;
  userEmail: string;
  title: string;
  model: string; // usage bucket key (llama, gemini, deepseek, gpt41, gpt41mini, o3mini, osslarge)
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  archived?: boolean;
}

const COLLECTION = 'chat_sessions';

export async function listChatSessions(userEmail: string): Promise<ChatSessionDoc[]> {
  const { db } = await connectToDatabase();
  return db.collection<ChatSessionDoc>(COLLECTION)
    .find({ userEmail, archived: { $ne: true } }, { projection: { messages: { $slice: 0 } } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();
}

export async function getChatSession(userEmail: string, id: string): Promise<ChatSessionDoc | null> {
  const { db } = await connectToDatabase();
  const session = await db.collection<ChatSessionDoc>(COLLECTION).findOne({ _id: id, userEmail });
  return session;
}

export async function createChatSession(userEmail: string, model: string, initialMessage?: string): Promise<ChatSessionDoc> {
  const { db } = await connectToDatabase();
  const now = new Date().toISOString();
  const doc: ChatSessionDoc = {
    _id: crypto.randomUUID(),
    userEmail,
    title: initialMessage ? truncateTitle(initialMessage) : 'New Chat',
    model,
    createdAt: now,
    updatedAt: now,
    messages: initialMessage ? [{ role: 'user', content: initialMessage, createdAt: now }] : []
  };
  await db.collection<ChatSessionDoc>(COLLECTION).insertOne(doc as unknown as ChatSessionDoc);
  return doc;
}

interface UpdateShape { $push: { messages: ChatMessage }; $set: { updatedAt: string; title?: string } }
export async function appendMessage(userEmail: string, chatId: string, message: ChatMessage, updateTitleIfNeeded = false): Promise<void> {
  const { db } = await connectToDatabase();
  const update: UpdateShape = {
    $push: { messages: message },
    $set: { updatedAt: message.createdAt }
  };
  if (updateTitleIfNeeded && message.role === 'user') {
    update.$set.title = truncateTitle(message.content);
  }
  await db.collection<ChatSessionDoc>(COLLECTION).updateOne({ _id: chatId, userEmail }, update);
}

export function truncateTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? clean.slice(0, 57) + '...' : clean || 'New Chat';
}

export async function ensureModelAccess(userEmail: string, bucket: string) {
  const userPlan = await getUserPlan(userEmail);
  if (!checkModelAccess(userPlan.plan, bucket)) {
    throw new Error(`Plan ${userPlan.plan} cannot access ${bucket}.`);
  }
  const limits = await getUserLimits(userEmail);
  const planLimits = getPlanLimits(userPlan.plan);
  const currentCount = bucket === 'llama' ? limits.llamaGuides
    : bucket === 'gemini' ? limits.geminiGuides
    : bucket === 'deepseek' ? limits.deepseekGuides
    : bucket === 'gpt41' ? limits.gpt41Guides
    : bucket === 'gpt41mini' ? limits.gpt41miniGuides
    : bucket === 'o3mini' ? limits.o3miniGuides
    : bucket === 'osslarge' ? (limits.osslargeGuides || 0)
    : bucket === 'nanobanana' ? (limits as unknown as { nanobananaGuides?: number }).nanobananaGuides || 0
    : 0;
  const bucketLimitMap: Record<string, number> = {
    llama: planLimits.llama,
    gemini: planLimits.gemini,
    deepseek: planLimits.deepseek,
    gpt41: planLimits.gpt41,
    gpt41mini: planLimits.gpt41mini,
    o3mini: planLimits.o3mini,
    osslarge: planLimits.osslarge,
    nanobanana: (planLimits as unknown as { nanobanana?: number }).nanobanana ?? 0
  };
  const modelLimit: number = bucketLimitMap[bucket];
  if (modelLimit !== -1 && currentCount >= modelLimit) {
    throw new Error(`Limit reached for ${bucket}.`);
  }
  if (modelLimit !== -1) {
    const todaysUsage = await getUsage(userEmail);
    const dailyCount = todaysUsage[bucket]?.requests ?? 0;
    if (dailyCount >= modelLimit) {
      throw new Error(`Daily limit reached for ${bucket}.`);
    }
  }
  return { userPlan, limits, bucket };
}

export async function incrementUsage(
  userEmail: string,
  bucket: string,
  counters?: { textIncrements?: number; imageIncrements?: number; tokenIncrements?: number; requestIncrements?: number }
) {
  await incrementGuideCount(userEmail, bucket);
  await recordUsage(userEmail, bucket, {
    requests: counters?.requestIncrements ?? 0,
    text: counters?.textIncrements ?? (bucket === 'nanobanana' ? 0 : 1),
    images: counters?.imageIncrements ?? (bucket === 'nanobanana' ? 1 : 0),
    tokens: counters?.tokenIncrements ?? 0,
  });
}

export async function deleteChatSession(userEmail: string, chatId: string) {
  const { db } = await connectToDatabase();
  await db.collection<ChatSessionDoc>(COLLECTION).deleteOne({ _id: chatId, userEmail });
}

export async function updateChatModel(userEmail: string, chatId: string, newBucket: string) {
  const { db } = await connectToDatabase();
  // Access check
  await ensureModelAccess(userEmail, newBucket);
  await db.collection<ChatSessionDoc>(COLLECTION).updateOne({ _id: chatId, userEmail }, { $set: { model: newBucket, updatedAt: new Date().toISOString() } });
}
