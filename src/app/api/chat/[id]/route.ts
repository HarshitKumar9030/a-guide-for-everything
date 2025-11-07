import { NextRequest, NextResponse } from 'next/server';
// Ensure Node.js runtime so streaming & larger responses work reliably for image generation
export const runtime = 'nodejs';
// Allow slower image generation responses (Gemini image preview may take several seconds)
export const maxDuration = 60; // seconds
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChatSession, appendMessage, ensureModelAccess, incrementUsage, deleteChatSession, updateChatModel } from '@/lib/chat';
import { geminiCompletion, geminiImagePreview } from '@/lib/ai/gemini';
import { aiCompletion, stripThinkTags } from '@/lib/ai/hackclub';
import { deepseekCompletion } from '@/lib/ai/deepseek';
import { gpt41MiniCompletion } from '@/lib/ai/azure-gpt';
import { gpt41Completion } from '@/lib/ai/azure-gpt41';
import { o3MiniCompletion } from '@/lib/ai/azure-o3mini';
// Placeholder: nanobanana completion (reuse gemini until real impl)
// In future replace with dedicated multimodal model call

// Simple model dispatch mapping bucket -> executor
interface RunModelResult {
  text: string;
  model: string;
  tokens?: { input: number; output: number; total: number };
  images?: { mimeType: string; data: string }[];
}

const normaliseTokens = (input?: number | null, output?: number | null, total?: number | null) => {
  const safe = (v?: number | null) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
  const totalVal = total ?? (safe(input) + safe(output));
  if (!safe(input) && !safe(output) && !safe(totalVal)) return undefined;
  return { input: safe(input), output: safe(output), total: safe(totalVal) };
};

async function runModel(bucket: string, prompt: string, hackclubModel?: string, images?: { mimeType: string; data: string }[]): Promise<RunModelResult> {
  if (bucket === 'gemini') {
    const r = await geminiCompletion(prompt);
    return { text: r.content || '', model: r.model, tokens: normaliseTokens(r.tokens?.input, r.tokens?.output, r.tokens?.total) };
  } else if (bucket === 'deepseek') {
    const r = await deepseekCompletion(prompt);
    return { text: r.content || '', model: r.model, tokens: normaliseTokens(r.tokens?.input, r.tokens?.output, r.tokens?.total) };
  } else if (bucket === 'gpt41') {
    const r = await gpt41Completion(prompt);
    return { text: r.content || '', model: r.model, tokens: normaliseTokens(r.tokens?.input, r.tokens?.output, r.tokens?.total) };
  } else if (bucket === 'gpt41mini') {
    const r = await gpt41MiniCompletion(prompt);
    return { text: r.content || '', model: r.model, tokens: normaliseTokens(r.tokens?.input, r.tokens?.output, r.tokens?.total) };
  } else if (bucket === 'o3mini') {
    const r = await o3MiniCompletion(prompt);
    return { text: r.content || '', model: r.model, tokens: normaliseTokens(r.tokens?.input, r.tokens?.output, r.tokens?.total) };
  } else if (bucket === 'nanobanana') {
    // Strictly use the image-preview model for generation & editing.
    try {
      let userInstruction = prompt;
      const m = prompt.match(/USER:\s*([\s\S]*?)\nASSISTANT:$/);
      if (m) userInstruction = m[1].trim();
      if (/USER:/i.test(userInstruction)) {
        const parts = userInstruction.split(/\bUSER:\s*/i).filter(Boolean);
        userInstruction = parts[parts.length - 1].trim();
      }
      const genVerb = /^(imagine|create|generate|make|design|draw)\b/i.test(userInstruction);
      const baseInstruction = images && images.length
        ? `Perform an image edit on the provided image(s) following this instruction. Maintain fidelity, lighting and perspective. Instruction: ${userInstruction}`
        : (genVerb ? userInstruction : `Generate a detailed, high-quality image. Description: ${userInstruction}`);
      let r = await geminiImagePreview(baseInstruction, images && images.length ? images : undefined);
      if ((!r.images || r.images.length === 0) && (!images || images.length === 0)) {
        const retryPrompt = baseInstruction + '\nYou must return at least one image.';
        const r2 = await geminiImagePreview(retryPrompt);
        if (r2.images && r2.images.length) r = r2;
      }
      return { text: r.content || 'Generated images below.', model: 'nanobanana', images: r.images };
    } catch (err) {
      console.warn('nanobanana image-preview failure', err);
      return { text: 'Image generation failed.', model: 'nanobanana' };
    }
  } else if (bucket === 'llama' || bucket === 'osslarge') {
    const r = await aiCompletion(prompt, hackclubModel);
    let text = r.choices?.[0]?.message?.content || '';
    text = stripThinkTags(text);
    const usage = r.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
    const tokens = usage ? normaliseTokens(usage.prompt_tokens, usage.completion_tokens, usage.total_tokens) : undefined;
    return { text, model: hackclubModel || 'moonshotai/kimi-k2-instruct', tokens };
  }
  return { text: 'Model not implemented', model: bucket };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const chat = await getChatSession(session.user.email, id);
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ chat });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const chat = await getChatSession(session.user.email, id);
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { message, images } = await req.json();
  if (!message || typeof message !== 'string') return NextResponse.json({ error: 'message required' }, { status: 400 });
  type ImgIn = { mimeType?: unknown; data?: unknown };
  const imageArray: { mimeType: string; data: string }[] = Array.isArray(images)
    ? (images as ImgIn[])
        .filter(im => im && typeof im.data === 'string' && typeof im.mimeType === 'string' && (im.mimeType as string).startsWith('image/'))
        .slice(0,6)
        .map(im => ({ mimeType: im.mimeType as string, data: im.data as string }))
    : [];
  try {
    await ensureModelAccess(session.user.email, chat.model);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Access denied' }, { status: 403 });
  }
  const ts = new Date().toISOString();
  await appendMessage(session.user.email, chat._id!, { role: 'user', content: message, createdAt: ts, images: imageArray.length?imageArray:undefined });
  const systemWrapped = `You are a helpful assistant. Respond conversationally.\n\nConversation so far (most recent last):\n${chat.messages.slice(-20).map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n')}\nUSER: ${message}\nASSISTANT:`;
  let result;
  try {
    result = await runModel(chat.model, systemWrapped, undefined, imageArray);
  } catch (err) {
    // Gracefully surface Gemini quota/429 errors to the client
    const msg = err instanceof Error ? err.message : 'Generation failed';
    const isQuota = /RESOURCE_EXHAUSTED|\b429\b|quota exceeded/i.test(String(msg));
    if (isQuota) {
      // Try to extract a retry-after seconds hint
      const m = String(msg).match(/retry in\s*([0-9]+\.?[0-9]*)s/i);
      const retryAfter = m ? Math.max(1, Math.round(parseFloat(m[1]))) : 10;
      return new NextResponse(JSON.stringify({ error: 'Image generation is temporarily rate limited. Please try again in a few seconds.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) } });
    }
    return NextResponse.json({ error: 'Failed to generate a response.' }, { status: 500 });
  }
  const assistantMsg = { role: 'assistant' as const, content: result.text, createdAt: new Date().toISOString(), model: result.model, images: result.images?.length ? result.images : undefined };
  await appendMessage(session.user.email, chat._id!, assistantMsg);
  await incrementUsage(session.user.email, chat.model, {
    textIncrements: chat.model === 'nanobanana' ? (assistantMsg.content ? 1 : 0) : 1,
    imageIncrements: assistantMsg.images?.length ?? (chat.model === 'nanobanana' ? 1 : 0),
    tokenIncrements: result.tokens?.total ?? 0,
  });
  // Title generation: if still default and at least one user + assistant exchange, use oss 20b (hackclub) to summarize
  let newTitle: string | undefined;
  if ((chat.title === 'New Chat' || chat.title.startsWith('New Chat')) && chat.messages.length + 2 >= 2) {
    try {
      const titlePrompt = `Generate a 5-8 word concise title (no quotes) summarizing this conversation:\n${message}\nAssistant: ${assistantMsg.content}`;
  const tr = await aiCompletion(titlePrompt, 'openai/gpt-oss-20b');
      let t = tr.choices?.[0]?.message?.content?.trim().replace(/^("|'|#)+|("|'|#)+$/g,'') || 'Chat';
      if (t.length > 60) t = t.slice(0,57)+'...';
      await appendMessage(session.user.email, chat._id!, { role: 'system', content: `[title-updated] ${t}`, createdAt: new Date().toISOString() });
      newTitle = t;
    } catch {}
  }
  return NextResponse.json({ message: assistantMsg, newTitle });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const chat = await getChatSession(session.user.email, id);
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await deleteChatSession(session.user.email, id);
  return NextResponse.json({ deleted: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const body = await req.json().catch(()=>({}));
  const { model } = body as { model?: string };
  if (!model || typeof model !== 'string') return NextResponse.json({ error: 'model required' }, { status: 400 });
  const chat = await getChatSession(session.user.email, id);
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (chat.model === model) return NextResponse.json({ updated: false, model });
  try {
    await updateChatModel(session.user.email, id, model);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Update failed' }, { status: 400 });
  }
  return NextResponse.json({ updated: true, model });
}
