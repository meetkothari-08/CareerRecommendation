import axios from 'axios';

const APP_ID = "43269a17";
const APP_KEY = "19ba1f2c6e26e34f4169b756815527ed";
const BASE_URL = "https://api.adzuna.com/v1/api/jobs";

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

class MarketAnalysisService {
  async fetchJobTrends(jobTitle: string, country: string = "us"): Promise<JobTrends | null> {
    try {
      const response = await axios.get(`${BASE_URL}/${country}/history`, {
        params: {
          app_id: APP_ID,
          app_key: APP_KEY,
          what: jobTitle,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job trends:', error);
      return null;
    }
  }

  async fetchSalaryTrends(jobTitle: string, country: string = "us"): Promise<SalaryData | null> {
    try {
      const response = await axios.get(`${BASE_URL}/${country}/histogram`, {
        params: {
          app_id: APP_ID,
          app_key: APP_KEY,
          what: jobTitle,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching salary trends:', error);
      return null;
    }
  }

  async fetchGlobalDemand(jobTitle: string): Promise<GlobalDemand[]> {
    const countries = ["gb", "us", "au", "de", "ca", "nl", "fr", "it", "br", "in"];
    const countryData: GlobalDemand[] = [];

    for (const country of countries) {
      try {
        const response = await axios.get(`${BASE_URL}/${country}/search/1`, {
          params: {
            app_id: APP_ID,
            app_key: APP_KEY,
            what: jobTitle,
          }
        });
        countryData.push({
          country: country.toUpperCase(),
          count: response.data.count || 0
        });
      } catch (error) {
        console.error(`Error fetching data for ${country}:`, error);
      }
    }

    return countryData;
  }
}

export const marketAnalysisService = new MarketAnalysisService();