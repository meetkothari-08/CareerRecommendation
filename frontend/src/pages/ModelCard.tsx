import { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { api, Metrics, pct } from '../lib/api';
import { Bar, ErrorBox, PageHeader, Spinner, Stat } from '../components/ui';

const STAGES = [
  { title: 'Inputs', items: ['Free-text skills, interests, goals', 'Education & experience'] },
  { title: 'Skill extraction', items: ['330+ skill taxonomy with aliases', 'Regex longest-match normalisation'] },
  {
    title: 'Stage 1 · candidate signals',
    items: ['Skill classifier (logistic regression on TF-IDF skill bags of postings)', 'Market skill similarity (IDF-weighted demand profiles)', 'Interest similarity (TF-IDF over career text)', 'Taxonomy overlap & education fit'],
  },
  { title: 'Stage 2 · learned ranker', items: ['Logistic-regression ranker trained on 400 labelled profiles', 'Outputs expected graded relevance → match score'] },
  { title: 'Outputs', items: ['Top-k of 56 careers', 'Demand-weighted skill gaps', 'Course recommendations', 'Fine-tuned LLM career report'] },
];

const METRIC_LABELS: Record<string, string> = {
  'relevance@3': 'Relevance@3',
  'ndcg@5': 'NDCG@5',
  top1_accuracy: 'Top-1 acc.',
  'hit@3': 'Hit@3',
  mrr: 'MRR',
};

export default function ModelCard() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.metrics().then(setM).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Model & results"
        subtitle="A two-stage hybrid recommender evaluated on 100 held-out profiles. All numbers below are produced by scripts/train.py."
      />
      {error && <ErrorBox message={error} />}
      {!m && !error && <Spinner />}
      {m && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Relevance@3" value={pct(m.headline.value, 1)} hint="100 held-out test profiles" />
            <Stat label="NDCG@5" value={m.test['ndcg@5'].toFixed(3)} />
            <Stat label="Top-1 accuracy" value={pct(m.test.top1_accuracy)} />
            <Stat label="Stage-1 classifier F1" value={m.stage1_classifier.macro_f1.toFixed(3)} hint={`${m.stage1_classifier.holdout_postings} held-out postings`} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="card p-6">
              <h2 className="font-semibold">Architecture</h2>
              <div className="mt-4 space-y-1">
                {STAGES.map((s, i) => (
                  <div key={s.title}>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-indigo-700">{s.title}</p>
                      <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                        {s.items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </div>
                    {i < STAGES.length - 1 && <ArrowDown className="mx-auto my-1 h-4 w-4 text-slate-400" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card overflow-x-auto p-6">
                <h2 className="font-semibold">Ablation on the test profiles</h2>
                <p className="mt-1 text-sm text-slate-600">Each signal alone vs. the combined model.</p>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 pr-4">Model</th>
                      {Object.values(METRIC_LABELS).map((l) => <th key={l} className="py-2 pr-3 text-right">{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(m.ablation).map(([name, row]) => {
                      const best = name.startsWith('Two-stage');
                      return (
                        <tr key={name} className={`border-b border-slate-100 ${best ? 'bg-indigo-50/60 font-semibold' : ''}`}>
                          <td className="py-2 pr-4">{name}</td>
                          {Object.keys(METRIC_LABELS).map((k) => <td key={k} className="py-2 pr-3 text-right tabular-nums">{row[k].toFixed(3)}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card p-6">
                <h2 className="font-semibold">Relevance@3 by model</h2>
                <div className="mt-4 space-y-3">
                  {Object.entries(m.ablation).map(([name, row]) => (
                    <div key={name} className="text-sm">
                      <div className="mb-1 flex justify-between"><span>{name}</span><span className="tabular-nums">{pct(row['relevance@3'], 1)}</span></div>
                      <Bar value={row['relevance@3']} className={name.startsWith('Two-stage') ? 'bg-indigo-600' : 'bg-slate-400'} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 text-sm text-slate-600">
                <h2 className="font-semibold text-slate-900">Evaluation protocol</h2>
                <p className="mt-2">{m.headline.description}</p>
                <p className="mt-2">
                  Dataset: {m.dataset.job_postings.toLocaleString()} job postings · {m.dataset.careers} careers · {m.dataset.skills_in_taxonomy} skills ·
                  ranker trained on {m.dataset.ranker_training_profiles} profiles · evaluated on {m.dataset.test_profiles} unseen profiles
                  (focused, blended-background and career-switcher personas).
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
