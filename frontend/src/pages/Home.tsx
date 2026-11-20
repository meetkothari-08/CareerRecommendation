import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpen, Brain, MessageSquare, Target, Wand2 } from 'lucide-react';
import { api, Metrics, pct } from '../lib/api';
import { Stat } from '../components/ui';

const pipeline = [
  { icon: Wand2, title: 'Skill extraction', text: 'Free text like "sklearn, k8s, some ML" is normalised onto a 330+ skill taxonomy.' },
  { icon: Brain, title: 'Deep learning + LambdaMART', text: 'A two-tower neural network and market-demand signals feed a LightGBM learning-to-rank model.' },
  { icon: Target, title: 'Skill-gap analysis', text: 'Missing skills are prioritised by how often employers ask for them in job postings.' },
  { icon: MessageSquare, title: 'Grounded LLM advice', text: 'An LLM turns the structured results into a grounded, personalised 90-day plan.' },
];

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  useEffect(() => {
    api.metrics().then(setMetrics).catch(() => setMetrics(null));
  }, []);

  return (
    <>
      <section className="bg-gradient-to-b from-indigo-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            AI career recommendations grounded in job-market data
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            CareerRec combines machine learning over job postings with an LLM advisor to recommend from 50+ career
            paths, pinpoint your skill gaps and build a learning plan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/recommend" className="btn-primary px-6 py-3 text-base">
              Get my recommendations <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-ghost px-6 py-3 text-base">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="-mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Job postings analysed" value={metrics ? metrics.dataset.job_postings.toLocaleString() : '1,200'} />
          <Stat label="Career paths" value={metrics?.dataset.careers ?? 56} />
          <Stat label="Recommendation relevance" value={metrics ? pct(metrics.headline.value, 1) : '—'} hint="relevance@3, 100 test profiles" />
          <Stat label="NDCG@5" value={metrics ? metrics.test['ndcg@5'].toFixed(3) : '—'} hint="graded ranking quality" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="how-it-works" className="scroll-mt-24 text-center text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {pipeline.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-slate-400">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link to="/market" className="card group flex items-center gap-4 p-6 hover:border-indigo-300">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <div className="flex-1">
              <h3 className="font-semibold">Explore the job market</h3>
              <p className="text-sm text-slate-600">Demand trends, salaries and the most requested skills per career.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
          </Link>
          <Link to="/advisor" className="card group flex items-center gap-4 p-6 hover:border-indigo-300">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <div className="flex-1">
              <h3 className="font-semibold">Ask the AI career advisor</h3>
              <p className="text-sm text-slate-600">Chat about careers with answers grounded in your recommendations.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
