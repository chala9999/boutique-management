import axios from './axios';

export const produitsAPI = {
  // Liste des produits
  getAll: async (params) => {
    const response = await axios.get('/produits/', { params });
    return response.data;
  },

  // Détails d'un produit
  getById: async (id) => {
    const response = await axios.get(`/produits/${id}/`);
    return response.data;
  },

  // Créer un produit
  create: async (data) => {
    const response = await axios.post('/produits/', data);
    return response.data;
  },

  // Mettre à jour un produit
  update: async (id, data) => {
    const response = await axios.patch(`/produits/${id}/`, data);
    return response.data;
  },

  // Supprimer un produit
  delete: async (id) => {
    const response = await axios.delete(`/produits/${id}/`);
    return response.data;
  },

  // Produits en stock faible
  getStockFaible: async () => {
    const response = await axios.get('/produits/stock_faible/');
    return response.data;
  },

  // Ajouter du stock
  ajouterStock: async (id, quantite) => {
    const response = await axios.post(`/produits/${id}/ajouter_stock/`, {
      quantite,
    });
    return response.data;
  },

  // Catégories
  getCategories: async () => {
    const response = await axios.get('/produits/categories/');
    return response.data;
  },

  createCategorie: async (data) => {
    const response = await axios.post('/produits/categories/', data);
    return response.data;
  },
};