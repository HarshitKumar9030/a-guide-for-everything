import UsageTrendChart from '@/components/charts/UsageTrendChart';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getUserPlan, getPlanLimits, type PlanLimits } from '@/lib/user-plan';
import { getUsage, getUsageHistory, type UsageSummary } from '@/lib/usage';

type UsageModelKey = 'llama' | 'gemini' | 'deepseek' | 'gpt41' | 'gpt41mini' | 'o3mini' | 'osslarge' | 'nanobanana';

const MODEL_META: Array<{ key: UsageModelKey; label: string; description: string; emphasis: 'text' | 'image' }> = [
  { key: 'llama', label: 'Kimi (LLaMA)', description: 'Fast replies from Hack Club gateway', emphasis: 'text' },
  { key: 'gemini', label: 'Gemini Flash', description: 'Google multimodal text replies', emphasis: 'text' },
  { key: 'deepseek', label: 'DeepSeek', description: 'Deep reasoning for complex projects', emphasis: 'text' },
  { key: 'osslarge', label: 'OSS Large', description: 'Community OSS 20B/120B models', emphasis: 'text' },
  { key: 'o3mini', label: 'O3 Mini', description: 'Advanced Azure reasoning model', emphasis: 'text' },
  { key: 'gpt41', label: 'GPT-4.1', description: 'Premium Microsoft Copilot stack', emphasis: 'text' },
  { key: 'gpt41mini', label: 'GPT-4.1 Mini', description: 'GPT-4 class speed variant', emphasis: 'text' },
  { key: 'nanobanana', label: 'Nano Banana (Images)', description: 'Gemini Image Preview + edits', emphasis: 'image' },
];

function formatPlan(plan: string) {
  if (!plan) return 'Unknown';
  return plan.replace(/\bproplus\b/i, 'Pro+').replace(/\bpro\b/i, 'Pro').replace(/\bfree\b/i, 'Free');
}

function sumUsage(usage: Record<string, UsageSummary>) {
  return Object.values(usage).reduce(
    (acc, entry) => ({
      requests: acc.requests + (entry?.requests ?? 0),
      textRequests: acc.textRequests + (entry?.textRequests ?? 0),
      imageGenerations: acc.imageGenerations + (entry?.imageGenerations ?? 0),
      tokens: acc.tokens + (entry?.tokens ?? 0),
    }),
    { requests: 0, textRequests: 0, imageGenerations: 0, tokens: 0 }
  );
}

function computeAggregateLimit(limits: PlanLimits) {
  let aggregate = 0;
  for (const meta of MODEL_META) {
    const limit = limits[meta.key];
    if (limit < 0) return Infinity;
    aggregate += limit;
  }
  return aggregate;
}

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-white">
        <h1 className="text-3xl font-semibold">Usage & Limits</h1>
        <p className="mt-4 text-white/70">
          Please <Link href="/auth/signin" className="underline">sign in</Link> to view your usage analytics.
        </p>
      </div>
    );
  }

  const email = session.user.email;
  const planDoc = await getUserPlan(email);
  const planLimits = getPlanLimits(planDoc.plan);
  const usageToday = await getUsage(email);
  const history = await getUsageHistory(email, 14);

  const totals = sumUsage(usageToday);
  const aggregateLimit = computeAggregateLimit(planLimits);
  const remainingToday = aggregateLimit === Infinity ? Infinity : Math.max(aggregateLimit - totals.requests, 0);
  const nextUtcMidnight = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1));
  const millisUntilReset = nextUtcMidnight.getTime() - Date.now();
  const resetHours = Math.max(0, Math.floor(millisUntilReset / (1000 * 60 * 60)));
  const resetMinutes = Math.max(0, Math.floor((millisUntilReset % (1000 * 60 * 60)) / (1000 * 60)));

  const chartData = history.map(day => {
    const label = new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: label,
      total: day.requests,
      text: day.textRequests,
      images: day.imageGenerations,
      tokens: day.tokens,
    };
  });

  const totalTokens = totals.tokens;
  const avgTokensPerText = totals.textRequests ? Math.round(totalTokens / totals.textRequests) : 0;
  const nanoSummary = usageToday.nanobanana ?? { requests: 0, textRequests: 0, imageGenerations: 0, tokens: 0 };
  const nanoRuns = nanoSummary.imageGenerations;
  const totalInteractions = totals.textRequests + totals.imageGenerations;
  const textPercent = totalInteractions ? Math.round((totals.textRequests / totalInteractions) * 100) : 0;
  const imagePercent = totalInteractions ? Math.max(0, 100 - textPercent) : 0;

  const modelUsage = MODEL_META.map(meta => {
    const summary = usageToday[meta.key] ?? { requests: 0, textRequests: 0, imageGenerations: 0, tokens: 0 };
    const limit = planLimits[meta.key];
    const available = limit !== 0;
    const percent = limit > 0 ? Math.min(100, Math.round((summary.requests / limit) * 100)) : undefined;
    const remaining = limit < 0 ? Infinity : Math.max(limit - summary.requests, 0);
    return {
      ...meta,
      limit,
      available,
      summary,
      percent,
      remaining,
    };
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#05060f] via-[#0c1324] to-[#15102e] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,188,66,0.12),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: 'radial-gradient(circle at 15% 35%, rgba(98, 213, 255, 0.15), transparent 55%), radial-gradient(circle at 70% 65%, rgba(255, 120, 203, 0.12), transparent 60%)' }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-12 lg:px-10">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Realtime Quotas</p>
            <h1 className="mt-2 font-just-another-hand text-6xl leading-none sm:text-7xl">Usage & Limits</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              Stay on top of your daily allotments. Every text or image request is tracked in real time, so you always know how close you are to premium thresholds.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
              Plan · {formatPlan(planDoc.plan)}
            </span>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-black shadow-lg shadow-primary/30 transition hover:bg-primary/80"
            >
              Explore Upgrades
            </Link>
          </div>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Requests today</p>
            <p className="mt-2 text-3xl font-semibold text-white">{totals.requests.toLocaleString()}</p>
            <p className="mt-3 text-sm text-white/65">
              {aggregateLimit === Infinity
                ? 'Unlimited plan active — enjoy limitless completions.'
                : `${remainingToday.toLocaleString()} remaining before the daily refresh.`}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#111933]/80 px-6 py-6 shadow-[0_18px_50px_rgba(15,20,35,0.55)]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/80">Token burn</p>
            <p className="mt-2 text-3xl font-semibold text-amber-100">{totalTokens.toLocaleString()}</p>
            <p className="mt-3 text-sm text-white/65">
              {avgTokensPerText
                ? `≈ ${avgTokensPerText.toLocaleString()} tokens per text response today.`
                : 'Tokens update as completions stream in.'}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#1a1028]/80 px-6 py-6 shadow-[0_18px_50px_rgba(30,10,55,0.55)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Nano Banana runs</p>
              <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200">
                Images
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">{nanoRuns.toLocaleString()}</p>
            <p className="mt-3 text-sm text-white/65">Only from Nano Banana</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Next reset</p>
            <p className="mt-2 text-3xl font-semibold text-white">{resetHours}h {resetMinutes}m</p>
            <p className="mt-3 text-sm text-white/65">All usage counters refresh automatically at 00:00 UTC.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0c1324]/60 px-6 py-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">14-day activity</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-white/45">Text vs Images</span>
            </div>
            <p className="mt-1 text-sm text-white/55">Track your rolling request volume and spot spikes in usage before they reach your limits.</p>
            <div className="mt-6">
              <UsageTrendChart data={chartData} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#141b30]/70 px-6 py-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Today&apos;s mix</h3>
                <span className="text-xs uppercase tracking-[0.3em] text-white/45">Live breakdown</span>
              </div>
              <p className="mt-1 text-sm text-white/55">Quick glance at where today&apos;s requests landed.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-white/55">
                    <span>Text responses</span>
                    <span>{totals.textRequests.toLocaleString()} {totalInteractions ? `(${textPercent}%)` : ''}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary via-amber-200 to-primary" style={{ width: totalInteractions ? `${textPercent}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-white/55">
                    <span>Image previews (Nano Banana)</span>
                    <span>{totals.imageGenerations.toLocaleString()} {totalInteractions ? `(${imagePercent}%)` : ''}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: totalInteractions ? `${imagePercent}%` : '0%' }} />
                  </div>
                </div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Only Nano Banana contributes to the image counter.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#141b30]/70 px-6 py-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
              <h3 className="text-lg font-semibold text-white">Quick stats</h3>
              <dl className="mt-4 space-y-3 text-sm text-white/65">
                <div className="flex items-center justify-between">
                  <dt>Total text replies</dt>
                  <dd className="font-semibold text-white">{totals.textRequests.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Nano Banana runs</dt>
                  <dd className="font-semibold text-white">{nanoRuns.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Tokens consumed</dt>
                  <dd className="font-semibold text-white">{totalTokens.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Tokens per text response</dt>
                  <dd className="font-semibold text-white">{avgTokensPerText ? avgTokensPerText.toLocaleString() : '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Per-model breakdown</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-white/45">Daily limits</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {modelUsage.map(model => (
              <div
                key={model.key}
                className="rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{model.label}</p>
                    <p className="mt-1 text-xs text-white/55">{model.description}</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
                    {model.limit < 0 ? 'Unlimited' : `${model.limit.toLocaleString()} Limit`}
                  </span>
                </div>
                {model.limit === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-3 py-2 text-xs text-white/50">
                    Not available on your current plan.
                  </div>
                ) : (
                  <>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Used today</p>
                        <p className="mt-1 text-3xl font-semibold text-white">{model.summary.requests.toLocaleString()}</p>
                      </div>
                      <div className="text-right text-xs text-white/55">
                        <p>{model.limit < 0 ? 'Unlimited plan' : `${model.remaining.toLocaleString()} remaining`}</p>
                        {model.limit >= 0 && <p className="mt-0.5 text-white/35">{model.limit.toLocaleString()} total</p>}
                      </div>
                    </div>
                    {model.limit >= 0 && (
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${model.emphasis === 'image' ? 'bg-gradient-to-r from-amber-300 to-amber-500' : 'bg-gradient-to-r from-primary via-amber-200 to-primary'}`}
                          style={{ width: `${Math.min(model.percent ?? 0, 100)}%` }}
                        />
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white/65">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">Text • {model.summary.textRequests.toLocaleString()}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">Tokens • {model.summary.tokens.toLocaleString()}</span>
                      {model.key === 'nanobanana' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-amber-100">Images • {model.summary.imageGenerations.toLocaleString()}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <h3 className="text-lg font-semibold text-white">Plan quick facts</h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-white/65">
            <li>Daily limits reset at 00:00 UTC automatically—no manual actions needed.</li>
            <li>Only Nano Banana contributes to the image counter; new renders and edits are counted the same.</li>
            <li>Upgrade to Pro or Pro+ to unlock higher caps and premium model access instantly.</li>
            <li>Token totals combine prompt and completion tokens from every AI response.</li>
            <li>All counters cover API usage from chat, templates, and automation flows.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
