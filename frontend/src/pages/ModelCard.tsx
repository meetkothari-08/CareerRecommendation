import { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { api, Metrics, pct } from '../lib/api';
import { Bar, ErrorBox, PageHeader, Spinner, Stat } from '../components/ui';

const STAGES = [
  { title: 'Inputs', items: ['Free-text skills, interests, goals', 'Education & experience'] },
  { title: 'Skill extraction', items: ['330+ skill taxonomy with aliases', 'Regex longest-match normalisation'] },
  {
    title: 'Stage 1 · candidate signals',
    items: [
      'Skill classifier: logistic regression on TF-IDF skill bags of 1,200 postings',
      'Market skill similarity: IDF-weighted demand profiles',
      'Interest similarity: TF-IDF over career descriptions',
      'Two-tower neural network (PyTorch): learned user and career embeddings',
    ],
  },
  {
    title: 'Stage 2 · LightGBM LambdaMART',
    items: ['Learning-to-rank over 11 features, trained on 2,000 labelled profiles', 'Optuna-tuned, Platt-calibrated, TreeSHAP explanations'],
  },
  { title: 'Outputs', items: ['Top-k of 56 careers with reasons', 'Demand-weighted skill gaps', 'Course recommendations', 'LLM career report'] },
];

const METRIC_LABELS: Record<string, string> = {
  'relevance@3': 'Relevance@3',
  'ndcg@5': 'NDCG@5',
  top1_accuracy: 'Top-1',
  'hit@3': 'Hit@3',
  mrr: 'MRR',
};

const FEATURE_LABELS: Record<string, string> = {
  clf_proba: 'Classifier probability',
  clf_log_proba: 'Classifier log-probability',
  clf_reciprocal_rank: 'Classifier rank',
  skill_similarity: 'Market skill similarity',
  interest_similarity: 'Interest similarity',
  interest_similarity_scaled: 'Interest similarity (scaled)',
  education_fit: 'Education fit',
  taxonomy_jaccard: 'Taxonomy skill overlap',
  core_skill_coverage: 'Core skill coverage',
  two_tower_score: 'Two-tower neural score',
  two_tower_reciprocal_rank: 'Two-tower neural rank',
};

export default function ModelCard() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.metrics().then(setM).catch((e) => setError(e.message));
  }, []);

  const importance = m ? m.feature_importance[m.selected_model] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Model & results"
        subtitle="Nine models compared on the same held-out test profiles. The production model is picked on a separate validation set. All numbers come from scripts/train.py."
      />
      {error && <ErrorBox message={error} />}
      {!m && !error && <Spinner />}
      {m && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Relevance@3" value={pct(m.headline.value, 1)} hint={`${m.dataset.test_profiles} held-out test profiles`} />
            <Stat label="NDCG@5" value={m.test['ndcg@5'].toFixed(3)} />
            <Stat label="Top-1 accuracy" value={pct(m.test.top1_accuracy)} />
            <Stat label="Production model" value={<span className="text-base leading-tight">{m.selected_model}</span>} hint="selected on validation" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-6">
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

              {importance && (
                <div className="card p-6">
                  <h2 className="font-semibold">What the ranker relies on</h2>
                  <p className="mt-1 text-sm text-slate-600">LightGBM feature importance (share of total gain).</p>
                  <div className="mt-4 space-y-2.5">
                    {Object.entries(importance).map(([f, v]) => (
                      <div key={f} className="text-sm">
                        <div className="mb-1 flex justify-between"><span>{FEATURE_LABELS[f] ?? f}</span><span className="tabular-nums text-slate-500">{pct(v, 1)}</span></div>
                        <Bar value={v / Math.max(...Object.values(importance))} className={f.startsWith('two_tower') ? 'bg-indigo-600' : 'bg-sky-500'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="card overflow-x-auto p-6">
                <h2 className="font-semibold">Model comparison: test set</h2>
                <p className="mt-1 text-sm text-slate-600">From single signals to the full hybrid. All models are evaluated on the same 100 unseen profiles.</p>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 pr-4">Model</th>
                      {Object.values(METRIC_LABELS).map((l) => <th key={l} className="py-2 pr-3 text-right">{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(m.ablation).map(([name, row]) => {
                      const best = name === m.selected_model;
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
                      <Bar value={row['relevance@3']} className={name === m.selected_model ? 'bg-indigo-600' : 'bg-slate-400'} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 text-sm text-slate-600">
                <h2 className="font-semibold text-slate-900">Evaluation protocol</h2>
                <p className="mt-2">{m.headline.description}</p>
                <p className="mt-2">
                  Data: {m.dataset.job_postings.toLocaleString()} job postings · {m.dataset.careers} careers · {m.dataset.skills_in_taxonomy} skills.
                  Profiles: {m.dataset.train_profiles.toLocaleString()} train / {m.dataset.validation_profiles} validation / {m.dataset.test_profiles} test,
                  covering focused, blended-background and career-switcher personas.
                </p>
                {m.two_tower && (
                  <p className="mt-2">
                    Two-tower network: {m.two_tower.parameters.toLocaleString()} user-tower parameters,
                    {' '}{m.two_tower.config.embedding_dim}-d embeddings, trained {m.two_tower.epochs_trained} epochs with early stopping.
                    It is exported to NumPy, so the API serves it without PyTorch.
                  </p>
                )}
                <p className="mt-2">Every training and tuning run is logged to MLflow. Full pipeline runtime: {Math.round(m.training_seconds)} s on CPU.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
