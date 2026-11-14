const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface JobTrends {
  month: Record<string, number>;
}

export interface SalaryData {
  histogram: Record<string, number>;
}

export interface GlobalDemand {
  country: string;
  count: number;
}

async function marketRequest<T>(endpoint: string, jobTitle: string, country?: string): Promise<T> {
  const params = new URLSearchParams({ title: jobTitle });
  if (country) params.set('country', country);
  const response = await fetch(`${API_URL}/api/market/${endpoint}?${params}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Job market service is unavailable');
  return data as T;
}

class MarketAnalysisService {
  async fetchJobTrends(jobTitle: string, country = 'us'): Promise<JobTrends | null> {
    try {
      return await marketRequest<JobTrends>('history', jobTitle, country);
    } catch (error) {
      console.error('Unable to retrieve job trends:', error);
      return null;
    }
  }

  async fetchSalaryTrends(jobTitle: string, country = 'us'): Promise<SalaryData | null> {
    try {
      return await marketRequest<SalaryData>('histogram', jobTitle, country);
    } catch (error) {
      console.error('Unable to retrieve salary trends:', error);
      return null;
    }
  }

  async fetchGlobalDemand(jobTitle: string): Promise<GlobalDemand[]> {
    try {
      return await marketRequest<GlobalDemand[]>('demand', jobTitle);
    } catch (error) {
      console.error('Unable to retrieve global demand:', error);
      return [];
    }
  }
}

export const marketAnalysisService = new MarketAnalysisService();
