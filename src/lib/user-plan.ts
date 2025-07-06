import { connectToDatabase } from './mongodb';

export type UserPlan = 'free' | 'pro' | 'proplus';

export interface UserPlanDoc {
  userEmail: string;
  plan: UserPlan;
  planStartDate?: Date;
  planEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanLimits {
  llama: number;
  gemini: number;
  deepseek: number;
  gpt41: number;
  gpt41mini: number;
  o3mini: number;
  exportCooldownHours: number;
  hasAdvancedModels: boolean;
  hasTeamSharing: boolean;
  hasAdvancedTemplates: boolean;
  hasEarlyAccess: boolean;
  supportLevel: 'none' | 'email' | 'priority' | 'live';
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    llama: 6,
    gemini: 4,
    deepseek: 4,
    gpt41: 0,     // Disabled for free users
    gpt41mini: 0, // Disabled for free users
    o3mini: 0,    // Disabled for free users
    exportCooldownHours: 6,
    hasAdvancedModels: false,
    hasTeamSharing: false,
    hasAdvancedTemplates: false,
    hasEarlyAccess: false,
    supportLevel: 'none'
  },
  pro: {
    llama: 20,
    gemini: 15,
    deepseek: 15,
    gpt41: 0,     // Pro doesn't have GPT-4.1, only Pro+ does
    gpt41mini: 0, // Pro doesn't have GPT-4.1, only Pro+ does
    o3mini: 10,   // Pro has O3 Mini access
    exportCooldownHours: 1,
    hasAdvancedModels: true,
    hasTeamSharing: false,
    hasAdvancedTemplates: false,
    hasEarlyAccess: false,
    supportLevel: 'email'
  },
  proplus: {
    llama: -1, // Unlimited
    gemini: -1, // Unlimited
    deepseek: -1, // Unlimited
    gpt41: -1,    // Unlimited GPT-4.1 access for Pro+
    gpt41mini: -1, // Unlimited GPT-4.1 Mini access for Pro+
    o3mini: -1,   // Unlimited O3 Mini access
    exportCooldownHours: 0, // No cooldown
    hasAdvancedModels: true,
    hasTeamSharing: true,
    hasAdvancedTemplates: true,
    hasEarlyAccess: true,
    supportLevel: 'live'
  }
};

export async function getUserPlan(userEmail: string): Promise<UserPlanDoc> {
  // Special users get Pro+ automatically
  const specialUsers = ['harshitkumar9030@gmail.com', 'mamtarani07275@gmail.com'];
  const isSpecialUser = specialUsers.includes(userEmail);

  if (isSpecialUser) {
    return {
      userEmail,
      plan: 'proplus',
      planStartDate: new Date(),
      planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      stripeCustomerId: 'special_user',
      stripeSubscriptionId: 'special_subscription',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const { db } = await connectToDatabase();
  const collection = db.collection<UserPlanDoc>('user_plans');

  const userPlan = await collection.findOne({ userEmail });

  if (!userPlan) {
    const newUserPlan: UserPlanDoc = {
      userEmail,
      plan: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newUserPlan);
    return newUserPlan;
  }

  return userPlan;
}

export async function updateUserPlan(
  userEmail: string, 
  plan: UserPlan, 
  planEndDate?: Date,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const { db } = await connectToDatabase();
  const collection = db.collection<UserPlanDoc>('user_plans');

  await collection.updateOne(
    { userEmail },
    { 
      $set: { 
        plan,
        planStartDate: new Date(),
        planEndDate,
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date() 
      }
    },
    { upsert: true }
  );
}

export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function checkModelAccess(plan: UserPlan, model: string): boolean {
  // Free users can't access premium models
  if (plan === 'free') {
    return model === 'llama' || model === 'gemini' || model === 'deepseek';
  }
  
  // Pro users can access all except GPT-4.1 models
  if (plan === 'pro') {
    return model !== 'gpt41' && model !== 'gpt41mini';
  }
  
  // Pro+ users can access all models
  return true;
}

export function checkGenerationLimit(plan: UserPlan, model: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  
  let modelLimit = 0;
  switch (model) {
    case 'llama':
      modelLimit = limits.llama;
      break;
    case 'gemini':
      modelLimit = limits.gemini;
      break;
    case 'deepseek':
      modelLimit = limits.deepseek;
      break;
    case 'gpt41':
      modelLimit = limits.gpt41;
      break;
    case 'gpt41mini':
      modelLimit = limits.gpt41mini;
      break;
    case 'o3mini':
      modelLimit = limits.o3mini;
      break;
    default:
      return false;
  }
  
  // -1 means unlimited
  if (modelLimit === -1) return true;
  
  return currentCount < modelLimit;
}

export function getExportCooldown(plan: UserPlan): number {
  const planLimits = getPlanLimits(plan);
  return planLimits.exportCooldownHours * 60 * 60 * 1000; // Convert to milliseconds
}
