import axios from './axios';


export const reportsAPI = {
  // Rapport des ventes
  getVentesReport: async (params) => {
    const response = await axios.get('/rapports/ventes/', { params });
    return response.data;
  },

  // Rapport des stocks
  getStockReport: async (params) => {
    const response = await axios.get('/rapports/stock/', { params });
    return response.data;
  },

  // Rapport financier
  getFinancesReport: async (params) => {
    const response = await axios.get('/rapports/finances/', { params });
    return response.data;
  },

  exportFinancesExcel: async (params) => {
  const response = await axios.get('/rapports/export/finances/', {
    params,
    responseType: 'blob'
  });
  return response.data;
},

  // Rapport des vendeurs
  getVendeursReport: async (params) => {
    const response = await axios.get('/rapports/vendeurs/', { params });
    return response.data;
  },
  // Exports
  exportVentesExcel: async (params) => {
    const response = await axios.get('/rapports/export/ventes/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportStockExcel: async (params) => {
    const response = await axios.get('/rapports/export/stock/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  exportVendeursExcel: async (params) => {
    const response = await axios.get('/rapports/export/vendeurs/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};