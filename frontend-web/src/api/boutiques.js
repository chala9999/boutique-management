import axios from './axios';

export const boutiquesAPI = {
  // Liste des boutiques
  getAll: async (params) => {
    const response = await axios.get('/boutiques/', { params });
    return response.data;
  },

  // Détails d'une boutique
  getById: async (id) => {
    const response = await axios.get(`/boutiques/${id}/`);
    return response.data;
  },

  // Créer une boutique
  create: async (data) => {
    const response = await axios.post('/boutiques/', data);
    return response.data;
  },

  // Mettre à jour une boutique
  update: async (id, data) => {
    const response = await axios.patch(`/boutiques/${id}/`, data);
    return response.data;
  },

  // Supprimer une boutique
  delete: async (id) => {
    const response = await axios.delete(`/boutiques/${id}/`);
    return response.data;
  },

  // Mes boutiques
  getMesBoutiques: async () => {
    const response = await axios.get('/boutiques/mes_boutiques/');
    return response.data;
  },

  // Statistiques d'une boutique
  getStatistiques: async (id) => {
    const response = await axios.get(`/boutiques/${id}/statistiques/`);
    return response.data;
  },
};