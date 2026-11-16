import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { api, ChatMessage } from '../lib/api';
import { PageHeader } from '../components/ui';

const STARTERS = [
  'How do I move from data analyst to data scientist?',
  'Which cloud certification should I get first?',
  'What should a junior ML engineer portfolio include?',
];

export default function Advisor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [llm, setLlm] = useState<{ enabled: boolean; model: string | null } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.health().then((h) => setLlm({ enabled: h.llm_enabled, model: h.llm_model })).catch(() => setLlm(null));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const history = messages;
    setMessages([...history, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.chat(text, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.text }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="AI career advisor" subtitle="Ask anything about tech careers, skills, interviews or learning paths.">
        {llm && (
          <span className={`chip ${llm.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {llm.enabled ? `Model: ${llm.model}` : 'LLM not configured'}
          </span>
        )}
      </PageHeader>

      <div className="card flex h-[60vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <Bot className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Try one of these:</p>
                <div className="mt-3 flex flex-col gap-2">
                  {STARTERS.map((s) => (
                    <button key={s} className="btn-ghost justify-center" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <div className={`prose-advice max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
          <div ref={bottom} />
        </div>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-slate-200 p-3"
        >
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a career question…" />
          <button className="btn-primary" disabled={loading || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
