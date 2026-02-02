import axios from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  // Inscription
  register: async (userData) => {
    const response = await axios.post('/users/register/', userData);
    return response.data;
  },

  // Connexion
  login: async (credentials) => {
    const response = await axios.post('/users/login/', credentials);
    return response.data;
  },

  // Récupérer le profil
  getProfile: async () => {
    const response = await axios.get('/users/me/');
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (data) => {
    const response = await axios.patch('/users/me/', data);
    return response.data;
  },

  // Liste des utilisateurs (admin seulement)
  getAllUsers: async () => {
    const response = await axios.get('/users/');
    return response.data;
  },

  // Créer un utilisateur (admin seulement)
  createUser: async (userData) => {
    const response = await axios.post('/users/', userData);
    return response.data;
  },

  // Modifier un utilisateur
  updateUser: async (id, userData) => {
    const response = await axios.patch(`/users/${id}/`, userData);
    return response.data;
  },

  // Supprimer un utilisateur (admin seulement)
  deleteUser: async (id) => {
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

  // Déconnexion
  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
  },
};