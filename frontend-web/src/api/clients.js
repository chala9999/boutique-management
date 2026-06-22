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

// Niveaux de fidélité
getNiveauxFidelite: async () => {
  const response = await axios.get('/clients/niveaux_fidelite/');
  return response.data;
},

// Récompenses
getRecompenses: async (params) => {
  const response = await axios.get('/clients/recompenses/', { params });
  return response.data;
},

// Échanger une récompense
echangerRecompense: async (clientId, recompenseId) => {
  const response = await axios.post(`/clients/${clientId}/echanger_recompense/`, {
    recompense_id: recompenseId
  });
  return response.data;
},

// Historique des récompenses
getHistoriqueRecompenses: async (clientId) => {
  const response = await axios.get(`/clients/${clientId}/historique_recompenses/`);
  return response.data;
},

// Top clients
getTopClients: async (by = 'points') => {
  const response = await axios.get('/clients/top_clients/', { params: { by } });
  return response.data;
},
};