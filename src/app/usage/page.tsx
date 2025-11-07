import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlan, getPlanLimits } from '@/lib/user-plan';
import { connectToDatabase } from '@/lib/mongodb';
import Link from 'next/link';

async function getTodayUsage(email: string) {
  const { db } = await connectToDatabase();
  const dateStr = new Date().toISOString().slice(0,10);
  const docs = await db.collection('usage').find({ userEmail: email, date: dateStr }).toArray();
  const usage: Record<string, number> = {};
  docs.forEach(d => { usage[d.model] = d.requests; });
  return usage;
}

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white">
        <h1 className="text-2xl font-semibold mb-4">Usage & Limits</h1>
        <p>Please <Link href="/auth/signin" className="underline">sign in</Link> to view your usage.</p>
      </div>
    );
  }

  const planDoc = await getUserPlan(session.user.email);
  const limits = getPlanLimits(planDoc.plan);
  const usage = await getTodayUsage(session.user.email);

  const modelKeys: { key: keyof typeof limits; label: string }[] = [
    { key: 'llama', label: 'Llama' },
    { key: 'gemini', label: 'Gemini' },
    { key: 'deepseek', label: 'DeepSeek' },
    { key: 'gpt41', label: 'GPT-4.1' },
    { key: 'gpt41mini', label: 'GPT-4.1 Mini' },
    { key: 'o3mini', label: 'O3 Mini' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-2">Usage & Limits</h1>
      <p className="text-gray-400 mb-8">Daily usage reset occurs at UTC midnight. Unlimited entries show as ∞.</p>

      <div className="mb-6 p-4 rounded-xl bg-[#272727] border border-white/10">
        <p><span className="text-gray-400">Current Plan:</span> <span className="font-semibold">{planDoc.plan.toUpperCase()}</span></p>
      </div>

      <div className="space-y-4">
        {modelKeys.map(m => {
          const limit = (limits as unknown as Record<string, number>)[m.key];
          const used = usage[m.key] || 0;
          const remaining = limit < 0 ? '∞' : Math.max(limit - used, 0);
          return (
            <div key={m.key} className="p-4 rounded-xl bg-[#1E1E1E] border border-white/5 flex justify-between items-center">
              <div>
                <p className="font-medium">{m.label}</p>
                <p className="text-sm text-gray-500">Used: {used} / {limit < 0 ? '∞' : limit}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Remaining</p>
                <p className="text-lg font-semibold">{remaining}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Plan Details</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-1">
          <li>Free plan: Limited daily generations, no premium models.</li>
          <li>Pro plan: Higher limits, access to O3 Mini.</li>
          <li>Pro+ plan: Unlimited generations and all premium models.</li>
          <li>Daily limits reset at 00:00 UTC.</li>
        </ul>
      </div>
    </div>
  );
}
