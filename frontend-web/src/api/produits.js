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
  // Uploader l'image principale
uploadImage: async (id, formData) => {
  const response = await axios.post(`/produits/${id}/upload-image/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
},

// Activer un produit
activer: async (id) => {
  const response = await axios.post(`/produits/${id}/activer/`);
  return response.data;
},

// Désactiver un produit
desactiver: async (id) => {
  const response = await axios.post(`/produits/${id}/desactiver/`);
  return response.data;
},
toggleActive: async (id) => {
  const response = await axios.post(`/produits/${id}/toggle_active/`);
  return response.data;
},
// Détails d'un produit (déjà existant)
getById: async (id) => {
  const response = await axios.get(`/produits/${id}/`);
  return response.data;
},
// Liste des catégories
getCategories: async (params) => {
  const response = await axios.get('/produits/categories/', { params });
  return response.data;
},

// Détails d'une catégorie
getCategorieById: async (id) => {
  const response = await axios.get(`/produits/categories/${id}/`);
  return response.data;
},

// Créer une catégorie
createCategorie: async (data) => {
  const response = await axios.post('/produits/categories/', data);
  return response.data;
},

// Mettre à jour une catégorie
updateCategorie: async (id, data) => {
  const response = await axios.patch(`/produits/categories/${id}/`, data);
  return response.data;
},

// Supprimer une catégorie
deleteCategorie: async (id) => {
  const response = await axios.delete(`/produits/categories/${id}/`);
  return response.data;
},

// Upload image catégorie
uploadCategorieImage: async (id, formData) => {
  const response = await axios.post(`/produits/categories/${id}/upload-image/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
},

// Produits d'une catégorie
getCategorieProduits: async (id, params) => {
  const response = await axios.get(`/produits/categories/${id}/produits/`, { params });
  return response.data;
},
};