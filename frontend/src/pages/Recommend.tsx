import { FormEvent, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Briefcase, ExternalLink, GraduationCap, Loader2, Sparkles, Star, TrendingUp } from 'lucide-react';
import { api, CareerRec, pct, ProfileInput, RecommendResponse, usd } from '../lib/api';
import { Bar, ErrorBox, PageHeader } from '../components/ui';

const EMPTY: ProfileInput = { skills: '', interests: '', education: '', experience_years: 0, goals: '' };

const SAMPLES: { label: string; profile: ProfileInput }[] = [
  {
    label: 'CS student into ML',
    profile: {
      skills: 'Python, pandas, sklearn, SQL, a bit of PyTorch, git',
      interests: 'machine learning, building AI products',
      education: 'B.Tech in Computer Science',
      experience_years: 1,
      goals: 'Become an ML engineer at a product company',
    },
  },
  {
    label: 'Sysadmin → cloud',
    profile: {
      skills: 'Linux, bash, Windows Server, networking, some AWS',
      interests: 'cloud, automation',
      education: 'Diploma in IT',
      experience_years: 5,
      goals: 'Move into DevOps or cloud engineering',
    },
  },
  {
    label: 'Analyst → product',
    profile: {
      skills: 'Excel, SQL, Tableau, stakeholder management, Jira, communication',
      interests: 'product, startups, users',
      education: 'MBA',
      experience_years: 4,
      goals: 'Lead a product team',
    },
  },
];

const PRIORITY_STYLE: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  Important: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Nice to have': 'bg-slate-100 text-slate-600',
};

export default function Recommend() {
  const [form, setForm] = useState<ProfileInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecommendResponse | null>(null);

  const set = (key: keyof ProfileInput) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: key === 'experience_years' ? Number(e.target.value) : e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setResult(await api.recommend({ ...form, top_k: 5 }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Career recommendations"
        subtitle="Describe your background in your own words. Aliases like “sklearn”, “k8s” or “ML” are understood."
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button type="button" key={s.label} className="chip bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setForm(s.profile)}>
                {s.label}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Skills *</label>
            <textarea className="input" rows={3} required value={form.skills} onChange={set('skills')} placeholder="Python, SQL, React, Docker…" />
          </div>
          <div>
            <label className="label">Interests</label>
            <input className="input" value={form.interests} onChange={set('interests')} placeholder="AI, healthcare, design…" />
          </div>
          <div>
            <label className="label">Education</label>
            <input className="input" value={form.education} onChange={set('education')} placeholder="B.Tech in Computer Science" />
          </div>
          <div>
            <label className="label">Experience: {form.experience_years} years</label>
            <input type="range" min={0} max={20} value={form.experience_years} onChange={set('experience_years')} className="w-full accent-indigo-600" />
          </div>
          <div>
            <label className="label">Career goals</label>
            <textarea className="input" rows={2} value={form.goals} onChange={set('goals')} placeholder="What do you want to be doing in 2 years?" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Analysing…' : 'Recommend careers'}
          </button>
        </form>

        <div className="space-y-6">
          {error && <ErrorBox message={error} />}
          {!result && !error && (
            <div className="card grid place-items-center p-16 text-center text-slate-500">
              <Briefcase className="mb-3 h-10 w-10 text-slate-300" />
              Fill in your profile or pick a sample to see ranked careers, skill gaps and a learning plan.
            </div>
          )}
          {result && (
            <>
              <div className="card p-5">
                <p className="text-sm font-medium text-slate-700">Recognised skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.extracted_skills.length ? (
                    result.extracted_skills.map((s) => (
                      <span key={s} className="chip bg-indigo-50 text-indigo-700">{s}</span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">None recognised — results rely on your interests.</span>
                  )}
                </div>
              </div>
              {result.recommendations.map((rec, i) => (
                <CareerCard key={rec.career_id} rec={rec} rank={i + 1} />
              ))}
              {result.advice && (
                <div className="card p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="h-5 w-5 text-indigo-600" /> Personalised career report
                    </h2>
                    <span className="chip bg-slate-100 text-slate-600">
                      {result.advice.source === 'llm' ? `LLM · ${result.advice.model}` : 'Template (no LLM key set)'}
                    </span>
                  </div>
                  <div className="prose-advice text-sm leading-relaxed text-slate-700">
                    <ReactMarkdown>{result.advice.text}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CareerCard({ rec, rank }: { rec: CareerRec; rank: number }) {
  const [open, setOpen] = useState(rank === 1);
  return (
    <div className="card overflow-hidden">
      <button className="flex w-full items-start gap-4 p-5 text-left" onClick={() => setOpen(!open)}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 font-semibold text-white">{rank}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{rec.title}</h3>
            <span className="chip bg-slate-100 text-slate-600">{rec.family}</span>
            <span className={`chip ${rec.growth === 'High' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              <TrendingUp className="mr-1 h-3 w-3" /> {rec.growth} growth
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{rec.description}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Metric label="Match score" value={`${rec.match_score.toFixed(0)}%`} bar={rec.match_score / 100} />
            <Metric label="Skill coverage" value={pct(rec.skill_coverage)} bar={rec.skill_coverage} color="bg-sky-500" />
            <div>
              <p className="text-xs text-slate-500">Median salary · postings</p>
              <p className="text-sm font-semibold">
                {usd(rec.market.median_salary)} · {rec.market.postings}
              </p>
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 p-5 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold">Skills you have</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {rec.matched_skills.length ? (
                rec.matched_skills.map((s) => <span key={s} className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{s}</span>)
              ) : (
                <span className="text-sm text-slate-500">No direct overlap yet</span>
              )}
            </div>
            <h4 className="mt-5 text-sm font-semibold">Skill gaps (by employer demand)</h4>
            <ul className="mt-2 space-y-1.5">
              {rec.missing_skills.slice(0, 8).map((g) => (
                <li key={g.skill} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate">{g.skill}</span>
                  <div className="flex-1"><Bar value={g.demand} className="bg-slate-400" /></div>
                  <span className={`chip w-24 justify-center ${PRIORITY_STYLE[g.priority]}`}>{g.priority}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Model signals — classifier {pct(rec.signals.classifier)}, market similarity {pct(rec.signals.skill_similarity)}, interest
              similarity {pct(rec.signals.interest_similarity)}
            </p>
          </div>
          <div>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold"><GraduationCap className="h-4 w-4" /> Recommended courses</h4>
            <ul className="mt-2 space-y-2">
              {rec.courses.length ? (
                rec.courses.map((c) => (
                  <li key={c.url}>
                    <a href={c.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-300">
                      <p className="flex items-start justify-between gap-2 text-sm font-medium">
                        {c.title} <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        {c.provider} · <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {c.rating} · for {c.skill}
                      </p>
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No matching courses in the catalogue.</li>
              )}
            </ul>
            <div className="mt-5 text-sm text-slate-600">
              <p><span className="font-medium text-slate-800">Salary range:</span> {usd(rec.salary_range_usd[0])} – {usd(rec.salary_range_usd[1])}</p>
              <p><span className="font-medium text-slate-800">Typical education:</span> {rec.education}</p>
              <p><span className="font-medium text-slate-800">Next roles:</span> {rec.next_roles.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, bar, color }: { label: string; value: string; bar: number; color?: string }) {
  return (
    <div>
      <p className="flex justify-between text-xs text-slate-500">
        {label} <span className="font-semibold text-slate-800">{value}</span>
      </p>
      <div className="mt-1.5"><Bar value={bar} className={color} /></div>
    </div>
  );
}
