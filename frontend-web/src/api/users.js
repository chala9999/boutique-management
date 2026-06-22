import axios from './axios';

export const usersAPI = {
  // Liste des utilisateurs (admin seulement)
  getAll: async (params) => {
    const response = await axios.get('/users/', { params });
    return response.data;
  },

  // Détails d'un utilisateur
  getById: async (id) => {
    const response = await axios.get(`/users/${id}/`);
    return response.data;
  },

  // Créer un utilisateur (admin seulement)
  create: async (data) => {
    const response = await axios.post('/users/', data);
    return response.data;
  },

  // Mettre à jour un utilisateur
  update: async (id, data) => {
    const response = await axios.patch(`/users/${id}/`, data);
    return response.data;
  },

  // Supprimer un utilisateur (admin seulement)
  delete: async (id) => {
    const response = await axios.delete(`/users/${id}/`);
    return response.data;
  },

  // Activer/Désactiver un utilisateur
  toggleActive: async (id) => {
    const response = await axios.post(`/users/${id}/toggle_active/`);
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (id, newPassword) => {
    const response = await axios.post(`/users/${id}/change_password/`, {
      new_password: newPassword,
    });
    return response.data;
  },

  // Statistiques utilisateurs
  getStatistiques: async () => {
    const response = await axios.get('/users/statistiques/');
    return response.data;
  },
};