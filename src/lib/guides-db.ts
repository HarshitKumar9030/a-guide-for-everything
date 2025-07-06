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
  _id?: string | object; // MongoDB ObjectId
  id?: string; // unique guide ID (optional for backwards compatibility)
  title: string;
  content: string;
  nutshell?: string;
  model?: string;
  prompt?: string;
  userId: string;
  userEmail: string;
  isPublic: boolean;
  collaborative?: boolean;
  tags?: string[];
  folderId?: string; // Reference to folder
  folderPath?: string; // Hierarchical folder path like "Projects/Web Development"
  tokens?: {
    total: number;
    input: number;
    output: number;
  };
  createdAt: Date;
  updatedAt: Date;
  views?: number;
  likes?: number;
  sharedWith?: string[]; // Array of user emails who have access
  teamId?: string; // Reference to team if shared with team
}

export async function getGuidesCollection(): Promise<Collection<SavedGuide>> {
  const db = await getDatabase();
  return db.collection<SavedGuide>('guides');
}

export interface GuideFolder {
  _id?: string | object;
  id?: string;
  name: string;
  parentId?: string; // For nested folders
  path: string; // Full hierarchical path
  userId: string;
  userEmail: string;
  color?: string; // Folder color for UI
  icon?: string; // Folder icon
  isShared?: boolean;
  sharedWith?: string[];
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
  guidesCount?: number; // Computed field
}

export async function getFoldersCollection(): Promise<Collection<GuideFolder>> {
  const db = await getDatabase();
  return db.collection<GuideFolder>('guide_folders');
}
