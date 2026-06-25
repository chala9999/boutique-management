import axios from './axios';

export const depensesAPI = {
  getAll: async (params) => {
    const response = await axios.get('/depenses/', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`/depenses/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await axios.post('/depenses/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await axios.patch(`/depenses/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await axios.delete(`/depenses/${id}/`);
    return response.data;
  },
  marquerRembourse: async (id) => {
    const response = await axios.post(`/depenses/${id}/marquer_rembourse/`);
    return response.data;
  },
  getStatistiques: async (params) => {
    const response = await axios.get('/depenses/statistiques/', { params });
    return response.data;
  },
};