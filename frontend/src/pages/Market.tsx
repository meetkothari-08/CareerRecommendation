import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, CareerMarket, CareerSummary, MarketOverview, pct, usd } from '../lib/api';
import { CHART, ErrorBox, PageHeader, Spinner, Stat } from '../components/ui';

const axis = { stroke: CHART.axis, fontSize: 12, tickLine: false, axisLine: false };

function ChartCard({ title, children, height = 260 }: { title: string; children: React.ReactElement; height?: number }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

const monthLabel = (m: string) => new Date(`${m}-01`).toLocaleString('en', { month: 'short' });

export default function Market() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [careers, setCareers] = useState<CareerSummary[]>([]);
  const [selected, setSelected] = useState('data_scientist');
  const [detail, setDetail] = useState<CareerMarket | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.marketOverview(), api.careers()])
      .then(([o, c]) => {
        setOverview(o);
        setCareers([...c].sort((a, b) => a.title.localeCompare(b.title)));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    api.marketCareer(selected).then(setDetail).catch((e) => setError(e.message));
  }, [selected]);

  if (error) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorBox message={error} /></div>;
  if (!overview) return <Spinner label="Loading market data…" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Job-market insights"
        subtitle={`${overview.total_postings.toLocaleString()} postings from ${overview.companies} companies, ${overview.date_range[0]} to ${overview.date_range[1]}.`}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Postings" value={overview.total_postings.toLocaleString()} />
        <Stat label="Careers covered" value={overview.careers_covered} />
        <Stat label="Median salary (USD)" value={usd(overview.median_salary)} />
        <Stat label="Remote-friendly" value={pct(overview.remote_share)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly posting volume">
          <LineChart data={overview.monthly_trend}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
            <YAxis {...axis} width={36} />
            <Tooltip />
            <Line type="monotone" dataKey="postings" stroke={CHART.primary} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Most in-demand skills (share of all postings)">
          <BarChart data={overview.top_skills.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tickFormatter={(v) => pct(v)} {...axis} />
            <YAxis type="category" dataKey="skill" width={110} {...axis} />
            <Tooltip formatter={(v: number) => pct(v, 1)} />
            <Bar dataKey="share" fill={CHART.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Careers with the most openings" height={320}>
          <BarChart data={overview.top_careers.slice(0, 10)} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey="title" width={150} {...axis} />
            <Tooltip />
            <Bar dataKey="postings" fill={CHART.secondary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Postings by career family" height={320}>
          <BarChart data={overview.by_family} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey="family" width={150} {...axis} />
            <Tooltip />
            <Bar dataKey="postings" fill={CHART.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-12 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold">Career deep dive</h2>
        <select className="input sm:w-72" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {careers.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      {detail && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Postings" value={detail.postings} hint={`${pct(detail.share_of_market, 1)} of market`} />
            <Stat label="Median salary" value={usd(detail.salary.median)} hint={`IQR ${usd(detail.salary.p25)} – ${usd(detail.salary.p75)}`} />
            <Stat label="Remote-friendly" value={pct(detail.remote_share)} />
            <Stat label="Top location" value={<span className="text-lg">{detail.top_locations[0]?.location ?? '—'}</span>} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard title={`Skills employers ask for — ${detail.title}`} height={320}>
              <BarChart data={detail.top_skills} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => pct(v)} {...axis} />
                <YAxis type="category" dataKey="skill" width={130} {...axis} />
                <Tooltip formatter={(v: number) => pct(v, 0)} />
                <Bar dataKey="share" fill={CHART.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Median salary by seniority (USD)" height={320}>
              <BarChart data={detail.salary_by_seniority}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="seniority" {...axis} />
                <YAxis tickFormatter={(v) => usd(v)} {...axis} width={56} />
                <Tooltip formatter={(v: number) => usd(v)} />
                <Bar dataKey="median_salary" fill={CHART.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
