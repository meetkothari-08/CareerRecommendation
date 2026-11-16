export interface ProfileInput {
  skills: string;
  interests: string;
  education: string;
  experience_years: number;
  goals: string;
  top_k?: number;
  include_advice?: boolean;
}

export interface SkillGap {
  skill: string;
  demand: number;
  priority: 'Critical' | 'Important' | 'Nice to have';
}

export interface Course {
  title: string;
  provider: string;
  url: string;
  rating: number;
  level: string;
  skill: string;
}

export interface CareerRec {
  career_id: string;
  title: string;
  family: string;
  description: string;
  match_score: number;
  confidence: number;
  signals: { classifier: number; skill_similarity: number; interest_similarity: number };
  skill_coverage: number;
  matched_skills: string[];
  missing_skills: SkillGap[];
  salary_range_usd: [number, number];
  growth: string;
  education: string;
  next_roles: string[];
  market: { postings: number; median_salary: number | null; remote_share: number | null };
  courses: Course[];
}

export interface RecommendResponse {
  extracted_skills: string[];
  recommendations: CareerRec[];
  advice: { text: string; source: 'llm' | 'template'; model: string | null } | null;
}

export interface Trend {
  month: string;
  postings: number;
}

export interface SkillShare {
  skill: string;
  share: number;
}

export interface MarketOverview {
  total_postings: number;
  careers_covered: number;
  companies: number;
  date_range: [string, string];
  remote_share: number;
  median_salary: number;
  monthly_trend: Trend[];
  top_skills: SkillShare[];
  top_careers: { career_id: string; title: string; postings: number; median_salary: number }[];
  by_family: { family: string; postings: number }[];
  by_country: { country: string; postings: number }[];
}

export interface CareerMarket {
  career_id: string;
  title: string;
  family: string;
  postings: number;
  share_of_market: number;
  remote_share: number;
  salary: { p25: number; median: number; p75: number };
  salary_by_seniority: { seniority: string; median_salary: number }[];
  monthly_trend: Trend[];
  top_skills: SkillShare[];
  top_locations: { location: string; postings: number }[];
}

export type MetricSet = Record<string, number>;

export interface Metrics {
  dataset: Record<string, number>;
  headline: { metric: string; value: number; description: string };
  test: MetricSet;
  ablation: Record<string, MetricSet>;
  stage1_classifier: { accuracy: number; macro_f1: number; holdout_postings: number };
}

export interface CareerSummary {
  id: string;
  title: string;
  family: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; llm_enabled: boolean; llm_model: string | null }>('/health'),
  recommend: (p: ProfileInput) => request<RecommendResponse>('/recommend', { method: 'POST', body: JSON.stringify(p) }),
  careers: () => request<CareerSummary[]>('/careers'),
  marketOverview: () => request<MarketOverview>('/market/overview'),
  marketCareer: (id: string) => request<CareerMarket>(`/market/careers/${id}`),
  metrics: () => request<Metrics>('/metrics'),
  chat: (message: string, history: ChatMessage[], profile?: ProfileInput) =>
    request<{ text: string; source: string; model: string | null }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, profile }),
    }),
};

export const usd = (v: number | null | undefined) => (v == null ? 'n/a' : `$${Math.round(v / 1000).toLocaleString()}k`);
export const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`;
