import axios from './axios';

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

  // Déconnexion (côté client uniquement)
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};