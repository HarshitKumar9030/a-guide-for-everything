import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listHackClubModels } from '@/lib/ai/hackclub';
import { getUserPlan } from '@/lib/user-plan';
import Link from 'next/link';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const planDoc = email ? await getUserPlan(email) : null;
  const plan = (planDoc?.plan ?? 'free') as 'free' | 'pro' | 'proplus';
  const hackclub = await listHackClubModels();
  // Enrich HackClub list with bucket + friendly flags
  const hackclubModels = hackclub.map(m => {
    const id = m.id.toLowerCase();
    const isOssLarge = /qwen3-32b|gpt-oss-20b|gpt-oss-120b/.test(id);
    const bucket = isOssLarge ? 'osslarge' : 'llama';
    return { ...m, bucket };
  });

  // Other static provider models (these don't come from HackClub list)
  const staticModels = [
    { id: 'gemini-2.5-flash', provider: 'Google', bucket: 'gemini', premium: false, thinking: false },
    { id: 'deepseek-r1-free', provider: 'OpenRouter', bucket: 'deepseek', premium: false, thinking: true },
    { id: 'gpt-4.1', provider: 'Azure OpenAI', bucket: 'gpt41', premium: true, thinking: false },
    { id: 'gpt-4.1-mini', provider: 'Azure OpenAI', bucket: 'gpt41mini', premium: true, thinking: false },
    { id: 'o3-mini', provider: 'Azure OpenAI', bucket: 'o3mini', premium: true, thinking: false }
  ];

  const models = [...hackclubModels, ...staticModels];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-4xl font-bold mb-2">AI Models</h1>
  <p className="text-gray-400 mb-8">Unified model catalogue across providers. Thinking models have internal reasoning stripped before display. Large open-source models now have a separate osslarge bucket.</p>
      {!email && (
        <p className="mb-6 text-sm text-yellow-400">Sign in to see plan-based access and usage limits.</p>
      )}
      {models.length === 0 && (
        <div className="text-sm text-gray-400 mb-6">No models available right now. Using fallback set soon; please refresh.</div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {models.map(m => {
          const access = m.premium
            ? (m.bucket === 'gpt41' || m.bucket === 'gpt41mini'
                ? (plan === 'proplus' ? 'Granted' : 'Pro+ required')
                : (plan === 'pro' || plan === 'proplus' ? 'Granted' : 'Upgrade'))
            : 'Free';
          return (
            <div key={m.id} className="border border-white/10 rounded-xl p-5 bg-[#1E1E1E] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg break-all">{m.id}</h2>
                {m.premium && <span className="text-xs px-2 py-1 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40">Premium</span>}
              </div>
              <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
                <span>{m.thinking ? 'Thinking model' : 'Standard model'}</span>
                <span>Bucket: {m.bucket}</span>
                <span>Access: {access}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-10 text-sm text-gray-500">
  <p>Legacy &quot;llama&quot; bucket now maps to Kimi base variants. Large OSS (Qwen / GPT-OSS) tracked under osslarge.</p>
        <p className="mt-2">See <Link href="/usage" className="underline">Usage & Limits</Link> for remaining requests; Pro unlocks osslarge & O3 Mini; Pro+ adds GPT‑4.1 family.</p>
      </div>
    </div>
  );
}
