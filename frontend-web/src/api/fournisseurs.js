import axios from './axios';

export const fournisseursAPI = {
  // Liste des fournisseurs
  getAll: async (params) => {
    const response = await axios.get('/fournisseurs/fournisseurs/', { params });
    return response.data;
  },

  // Détails d'un fournisseur
  getById: async (id) => {
    const response = await axios.get(`/fournisseurs/fournisseurs/${id}/`);
    return response.data;
  },

  // Créer un fournisseur
  create: async (data) => {
    const response = await axios.post('/fournisseurs/fournisseurs/', data);
    return response.data;
  },

  // Mettre à jour un fournisseur
  update: async (id, data) => {
    const response = await axios.patch(`/fournisseurs/fournisseurs/${id}/`, data);
    return response.data;
  },

  // Supprimer un fournisseur
  delete: async (id) => {
    const response = await axios.delete(`/fournisseurs/fournisseurs/${id}/`);
    return response.data;
  },

  // Statistiques fournisseur
  getStatistiques: async (id) => {
    const response = await axios.get(`/fournisseurs/fournisseurs/${id}/statistiques/`);
    return response.data;
  },
};

export const commandesAPI = {
  // Liste des commandes
  getAll: async (params) => {
    const response = await axios.get('/fournisseurs/commandes/', { params });
    return response.data;
  },
// Modifier une commande
update: async (id, data) => {
  const response = await axios.patch(`/fournisseurs/commandes/${id}/`, data);
  return response.data;
},
  // Détails d'une commande
  getById: async (id) => {
    const response = await axios.get(`/fournisseurs/commandes/${id}/`);
    return response.data;
  },

  // Créer une commande
  create: async (data) => {
    const response = await axios.post('/fournisseurs/commandes/', data);
    return response.data;
  },

  // Changer le statut
  changerStatut: async (id, statut) => {
    const response = await axios.post(`/fournisseurs/commandes/${id}/changer_statut/`, {
      statut,
    });
    return response.data;
  },

  // Annuler une commande
  annuler: async (id) => {
    const response = await axios.post(`/fournisseurs/commandes/${id}/annuler/`);
    return response.data;
  },

  // Ajouter un paiement
  ajouterPaiement: async (id, data) => {
    const response = await axios.post(
      `/fournisseurs/commandes/${id}/ajouter_paiement/`,
      data
    );
    return response.data;
  },

  // Recevoir une livraison
  recevoir: async (id, data) => {
    const response = await axios.post(`/fournisseurs/commandes/${id}/recevoir/`, data);
    return response.data;
  },

  // Statistiques
  getStatistiques: async (params) => {
    const response = await axios.get('/fournisseurs/commandes/statistiques/', {
      params,
    });
    return response.data;
  },

// Commandes d'un fournisseur
getCommandes: async (id, params) => {
  const response = await axios.get(`/fournisseurs/fournisseurs/${id}/commandes/`, { params });
  return response.data;
},
};