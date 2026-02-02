import axios from './axios';

export const clientsAPI = {
  // Liste des clients
  getAll: async (params) => {
    const response = await axios.get('/clients/', { params });
    return response.data;
  },

  // Détails d'un client
  getById: async (id) => {
    const response = await axios.get(`/clients/${id}/`);
    return response.data;
  },

  // Créer un client
  create: async (data) => {
    const response = await axios.post('/clients/', data);
    return response.data;
  },

  // Mettre à jour un client
  update: async (id, data) => {
    const response = await axios.patch(`/clients/${id}/`, data);
    return response.data;
  },

  // Supprimer un client
  delete: async (id) => {
    const response = await axios.delete(`/clients/${id}/`);
    return response.data;
  },

  // Historique d'achats
  getHistoriqueAchats: async (id) => {
    const response = await axios.get(`/clients/${id}/historique_achats/`);
    return response.data;
  },

  // Statistiques client
  getStatistiques: async (id) => {
    const response = await axios.get(`/clients/${id}/statistiques/`);
    return response.data;
  },
};