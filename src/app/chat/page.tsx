'use client';
// Chat page revamped UI with improved layout, sticky composer, upcoming image & model UI hooks.
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Plus, Send, Loader2, ChevronDown, Trash2, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HackClubOutageBanner from '@/components/core/HackClubOutageBanner';

interface ChatMeta { _id: string; title: string; model: string; updatedAt: string; }
interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; createdAt: string; model?: string; images?: { mimeType: string; data: string }[] }
interface ChatDoc extends ChatMeta { messages: ChatMessage[]; }

const MODEL_OPTIONS: { bucket: string; label: string; plan?: 'pro' | 'proplus' }[] = [
  { bucket: 'llama', label: 'Kimi (Base)' },
  { bucket: 'deepseek', label: 'DeepSeek' },
  { bucket: 'gemini', label: 'Gemini Flash' },
  { bucket: 'nanobanana', label: 'Nano Banana (Images)' },
  { bucket: 'osslarge', label: 'OSS Large', plan: 'pro' },
  { bucket: 'o3mini', label: 'O3 Mini', plan: 'pro' },
  { bucket: 'gpt41mini', label: 'GPT‑4.1 Mini', plan: 'proplus' },
  { bucket: 'gpt41', label: 'GPT‑4.1', plan: 'proplus' }
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [activeChat, setActiveChat] = useState<ChatDoc | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama'); // model used for new chats or current chat (header selector)
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro' | 'proplus'>('free');
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const [pendingImages, setPendingImages] = useState<{ mimeType: string; data: string; name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return; const list = Array.from(files).slice(0, 6); // limit
    const processed: { mimeType: string; data: string; name: string; size: number }[] = [];
    for (const f of list) {
      if (!f.type.startsWith('image/')) continue; if (f.size > 4*1024*1024) continue; // 4MB limit
      const buf = await f.arrayBuffer(); const b64 = Buffer.from(buf).toString('base64');
      processed.push({ mimeType: f.type, data: b64, name: f.name, size: f.size });
    }
    setPendingImages(p => [...p, ...processed].slice(0, 6));
  };

  const removeImage = (idx: number) => setPendingImages(p => p.filter((_,i)=>i!==idx));

  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [activeChat?.messages.length]);

  useEffect(() => { (async () => {
    if (!session?.user) return;
    try { const r = await fetch('/api/user/subscription'); if (r.ok) { const d = await r.json(); setPlan(d.subscription?.plan || 'free'); } } catch {}
    try { const r = await fetch('/api/chat'); if (r.ok) { const d = await r.json(); setChats(d.chats || []); } } catch {}
  })(); }, [session]);

  const loadChat = useCallback(async (id: string) => {
    const r = await fetch(`/api/chat/${id}`); if (r.ok) { const d = await r.json(); setActiveChat(d.chat); }
  }, []);

  const createChat = async () => {
    if (!selectedModel) return; setActiveChat(null);
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: selectedModel }) });
    if (r.ok) { const d = await r.json(); setChats(c => [d.chat, ...c]); await loadChat(d.chat._id); }
  };

  const deleteChat = async (id: string) => {
    if (!confirm('Delete this chat permanently?')) return;
    const r = await fetch(`/api/chat/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setChats(cs => cs.filter(c => c._id !== id));
      if (activeChat?._id === id) setActiveChat(null);
    }
  };

  const changeChatModel = async (newBucket: string) => {
    if (!activeChat) { setSelectedModel(newBucket); return; }
    if (activeChat.model === newBucket) return;
    const r = await fetch(`/api/chat/${activeChat._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: newBucket }) });
    if (r.ok) {
      const d = await r.json();
      if (d.model) {
        setActiveChat(c => c ? { ...c, model: d.model } : c);
        setChats(cs => cs.map(ch => ch._id === activeChat._id ? { ...ch, model: d.model } : ch));
        setSelectedModel(newBucket);
      }
    }
  };

  const canUseModel = (bucket: string) => {
    if (plan === 'free') return ['llama', 'gemini', 'deepseek'].includes(bucket);
    if (plan === 'pro') return bucket !== 'gpt41' && bucket !== 'gpt41mini';
    return true;
  };

  const send = async () => {
    if (!activeChat || (!input.trim() && pendingImages.length===0)) return;
    setSending(true);
    const content = input.trim(); setInput('');
    const imagesPayload = pendingImages.map(i => ({ mimeType: i.mimeType, data: i.data }));
    setPendingImages([]);
    const now = new Date().toISOString();
    // Insert user message + placeholder assistant loader
    setActiveChat(c => c ? { ...c, messages: [...c.messages, { role: 'user', content, createdAt: now, images: imagesPayload.length?imagesPayload:undefined }, { role: 'assistant', content: selectedModel==='nanobanana' ? 'Generating image(s)...' : 'Thinking...', createdAt: new Date().toISOString() }] } : c);
    try {
      const r = await fetch(`/api/chat/${activeChat._id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: content, images: imagesPayload }) });
      if (r.ok) { 
        const d = await r.json();
        setActiveChat(c => {
          if (!c) return c;
            // Replace last placeholder assistant message
            const msgs = [...c.messages];
            const idx = msgs.findIndex((m,i)=> i===msgs.length-1 && m.role==='assistant' && (m.content==='Thinking...' || m.content==='Generating image(s)...'));
            if (idx !== -1) msgs[idx] = d.message; else msgs.push(d.message);
            return { ...c, messages: msgs, title: d.newTitle ? d.newTitle : c.title };
        });
        if (d.newTitle) {
          setChats(cs => cs.map(ch => ch._id === activeChat._id ? { ...ch, title: d.newTitle } : ch));
        }
      } else {
        const err = await r.json().catch(()=>({ error: 'Failed' }));
        const quota = r.status === 429;
        setActiveChat(c => {
          if (!c) return c;
          const msgs = [...c.messages];
          const idx = msgs.findIndex((m,i)=> i===msgs.length-1 && m.role==='assistant' && (m.content==='Thinking...' || m.content==='Generating image(s)...'));
          const content = quota ? `Rate limit hit. Please wait a few seconds and try again.` : `Error: ${err.error}`;
          if (idx !== -1) msgs[idx] = { role: 'assistant', content, createdAt: new Date().toISOString() }; else msgs.push({ role: 'assistant', content, createdAt: new Date().toISOString() });
          return { ...c, messages: msgs };
        });
      }
    } finally { setSending(false); }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!session) return <div className="min-h-screen flex flex-col items-center justify-center text-white gap-6"><h1 className="font-just-another-hand text-[96px]">Chat</h1><p className="text-white/70">Sign in to chat with models.</p><Link href="/auth/signin" className="px-6 py-3 bg-primary text-black rounded-xl font-semibold">Sign In</Link></div>;

  return (
    <div className="min-h-screen bg-[#111] text-white flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 flex flex-col bg-[#141414]/80 backdrop-blur">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <span className="font-semibold tracking-wide">Chats</span>
          <button onClick={createChat} className="w-8 h-8 rounded-md bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition" title="New Chat"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search chats" className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-primary/40" />
          </div>
          <p className="mt-2 text-[10px] text-gray-500">New chats use model selected in header.</p>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10">
          {filteredChats.map(c => (
            <div key={c._id} className={`group w-full text-left px-4 py-3 text-sm border-b border-white/5 hover:bg-white/5 transition flex items-start gap-2 ${activeChat?._id === c._id ? 'bg-white/10' : ''}`}>
              <button onClick={() => loadChat(c._id)} className="flex-1 text-left">
                <span className="line-clamp-2 leading-tight flex-1 text-gray-200 group-hover:text-white block">{c.title}</span>
                <span className="mt-1 block text-[9px] uppercase tracking-wide text-gray-500">{c.model}</span>
              </button>
              <button onClick={()=>deleteChat(c._id)} className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-red-400" title="Delete chat"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {filteredChats.length === 0 && <div className="p-4 text-xs text-gray-500">No chats match.</div>}
        </div>
        <div className="p-3 border-t border-white/10 text-[10px] text-gray-500">
          <p className="leading-relaxed">Usage counts apply per model bucket. Upgrades unlock premium models.</p>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col max-h-screen">
      <HackClubOutageBanner />
        <div className="p-5 border-b border-white/10 flex flex-wrap items-center gap-4 sticky top-0 bg-[#111]/90 backdrop-blur z-10">
          <h1 className="font-just-another-hand text-4xl">Chat</h1>
          {/* In-header model selector */}
          <div className="relative" onKeyDown={e=>{ if(e.key==='Escape') setModelMenuOpen(false); }}>
            <button type="button" onClick={()=>setModelMenuOpen(o=>!o)} className="min-w-48 flex items-center justify-between gap-2 bg-[#1E1E1E] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs hover:border-primary/40 focus:outline-none">
              <span className="truncate text-left">{MODEL_OPTIONS.find(m=>m.bucket===(activeChat? activeChat.model : selectedModel))?.label || 'Select model'}</span>
              <ChevronDown className={`w-4 h-4 transition ${modelMenuOpen?'rotate-180':''}`} />
            </button>
            {modelMenuOpen && (
              <div className="absolute z-30 mt-2 w-64 max-h-72 overflow-auto rounded-md border border-white/10 bg-[#1d1d1d] shadow-xl scrollbar-thin scrollbar-thumb-white/10">
                {MODEL_OPTIONS.map(m => {
                  const allowed = canUseModel(m.bucket);
                  const activeBucket = activeChat? activeChat.model : selectedModel;
                  return (
                    <button key={m.bucket} onClick={()=>{ if(allowed){ changeChatModel(m.bucket); setModelMenuOpen(false);} }} className={`w-full text-left px-3 py-2 text-[11px] flex flex-col gap-0.5 hover:bg-white/5 ${activeBucket===m.bucket?'bg-white/10':''} ${!allowed?'opacity-40 cursor-not-allowed':''}`}> 
                      <span className="font-medium flex items-center gap-2">{m.label}{!allowed && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary">Upgrade</span>}</span>
                      {m.plan && <span className="text-[9px] uppercase tracking-wide text-gray-500">{m.plan === 'proplus' ? 'Pro+' : 'Pro'} Only</span>}
                    </button>
                  );
                })}
                <div className="p-2 border-t border-white/5 text-[9px] text-gray-500">Changing model affects future messages only.</div>
              </div>
            )}
          </div>
          {!activeChat && <button onClick={createChat} className="px-3 py-2 bg-primary text-black rounded-lg text-xs font-medium hover:bg-primary/80 flex items-center gap-1 transition"><ArrowRight className="w-4 h-4" /> New Chat</button>}
          {activeChat && <span className="text-[10px] px-2 py-1 bg-white/5 rounded-md border border-white/10 tracking-wide">ID {activeChat._id.slice(0,8)}</span>}
        </div>
        <div className="flex-1 overflow-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
          {!activeChat && <div className="text-gray-400 text-sm">Create or select a chat to begin.</div>}
          {activeChat?.messages.map((m,i) => {
            const isUser = m.role === 'user';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl w-fit ${isUser ? 'text-right' : 'text-left'}`}>
                  <div className={`text-[10px] mb-1 tracking-wide ${isUser?'text-primary/80':'text-gray-400'}`}>{isUser ? 'You' : 'Assistant'}</div>
                  <div className={`relative group p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${isUser?'bg-primary/15 border-primary/30':'bg-[#1a1a1a] border-white/10'} `}>
                    {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                    {m.images && m.images.length>0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {m.images.map((img,ii)=>(
                          <Image key={ii} src={`data:${img.mimeType};base64,${img.data}`} alt="uploaded" width={256} height={256} className="rounded-lg border border-white/10 object-cover max-h-48 w-full h-auto" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {activeChat && (
          <div className="border-t border-white/10 bg-[#141414]/80 backdrop-blur p-4">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
              <div className="flex items-end gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  {pendingImages.length>0 && (
                    <div className="flex flex-wrap gap-2">
                      {pendingImages.map((img,i)=>(
                        <div key={i} className="relative group h-20 w-20">
                          <Image src={`data:${img.mimeType};base64,${img.data}`} alt={img.name} fill className="object-cover rounded-lg border border-white/10" />
                          <button onClick={()=>removeImage(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea value={input} onChange={e=>setInput(e.target.value)} rows={1} placeholder="Type a message..." className="flex-1 resize-none bg-[#1b1b1b] border border-[#2c2c2c] rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 disabled:opacity-50" onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); }}} />
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <button type="button" onClick={()=>fileInputRef.current?.click()} className="px-2 py-1 border border-white/10 rounded-md hover:border-primary/40 hover:text-primary transition">Add Images</button>
                    <span>Up to 6 images • &lt;4MB each</span>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={e=>onFiles(e.target.files)} />
                </div>
                <button disabled={sending || (!input.trim() && pendingImages.length===0)} onClick={send} className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-primary/40 transition">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">Enter sends • Shift+Enter = newline • Nano Banana always uses Gemini Image Preview model.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
