import { MongoClient, Db, Collection } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('agfe');
}

export interface SavedGuide {
  _id?: string;
  id: string; // unique guide ID
  title: string;
  content: string;
  nutshell?: string;
  model: string;
  prompt: string;
  userId: string;
  userEmail: string;
  isPublic: boolean;
  tokens?: {
    total: number;
    input: number;
    output: number;
  };
  createdAt: Date;
  updatedAt: Date;
  views?: number;
  likes?: number;
}

export async function getGuidesCollection(): Promise<Collection<SavedGuide>> {
  const db = await getDatabase();
  return db.collection<SavedGuide>('guides');
}
