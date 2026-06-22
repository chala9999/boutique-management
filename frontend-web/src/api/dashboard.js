import axios from './axios';

export const dashboardAPI = {
  getStatsAvance: async (periode = '30j') => {
    const response = await axios.get('/boutiques/dashboard/stats-avance/', {
      params: { periode }
    });
    return response.data;
  },
};