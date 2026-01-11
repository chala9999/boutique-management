import axios from './axios';

export const ventesAPI = {
  // Liste des ventes
  getAll: async (params) => {
    const response = await axios.get('/ventes/', { params });
    return response.data;
  },

  // Détails d'une vente
  getById: async (id) => {
    const response = await axios.get(`/ventes/${id}/`);
    return response.data;
  },

  // Créer une vente
  create: async (data) => {
    const response = await axios.post('/ventes/', data);
    return response.data;
  },

  // Annuler une vente
  annuler: async (id) => {
    const response = await axios.post(`/ventes/${id}/annuler/`);
    return response.data;
  },

  // Ajouter un paiement
  ajouterPaiement: async (id, data) => {
    const response = await axios.post(`/ventes/${id}/ajouter_paiement/`, data);
    return response.data;
  },

  // Statistiques
  getStatistiques: async (params) => {
    const response = await axios.get('/ventes/statistiques/', { params });
    return response.data;
  },

  // Top produits
  getTopProduits: async (params) => {
    const response = await axios.get('/ventes/top_produits/', { params });
    return response.data;
  },

  // Ventes par jour
  getVentesParJour: async (params) => {
    const response = await axios.get('/ventes/ventes_par_jour/', { params });
    return response.data;
  },
};