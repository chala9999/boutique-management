import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../api/auth';
import { X } from 'lucide-react';

const UserModal = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'vendeur',
    telephone: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Ne pas afficher le mot de passe
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'vendeur',
        telephone: user.telephone || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: (data) =>
      user ? authAPI.updateUser(user.id, data) : authAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      alert(
        user
          ? 'Utilisateur modifié avec succès'
          : 'Utilisateur créé avec succès'
      );
      onClose();
    },
    onError: (error) => {
      console.error('Erreur complète:', error.response?.data);
      const errorData = error.response?.data;

      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');

        setError(errorMessages || 'Une erreur est survenue');
      } else {
        setError('Une erreur est survenue');
      }
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!user && !formData.password) {
      setError('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Préparer les données
    const dataToSend = { ...formData };

    // Si modification et pas de nouveau mot de passe, ne pas l'envoyer
    if (user && !formData.password) {
      delete dataToSend.password;
    }

    // Si modification, ne pas renvoyer le username (non modifiable)
    if (user) {
      delete dataToSend.username;
    }

    console.log('Données envoyées:', dataToSend);
    mutation.mutate(dataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Jean"
                required
              />
            </div>

            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Dupont"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Nom d'utilisateur *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="Ex: jean.dupont"
              required
              disabled={!!user} // Non modifiable si modification
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                Le nom d'utilisateur ne peut pas être modifié
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="Ex: jean@boutique.com"
              />
            </div>

            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="input"
                placeholder="Ex: 90000000"
              />
            </div>
          </div>

          <div>
            <label className="label">Rôle *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="admin">Administrateur</option>
              <option value="vendeur">Vendeur</option>
              <option value="comptable">Comptable</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'admin' && '• Accès complet à toutes les fonctionnalités'}
              {formData.role === 'vendeur' && '• Peut créer des ventes et gérer les produits'}
              {formData.role === 'comptable' && '• Accès en lecture aux ventes et statistiques'}
            </p>
          </div>

          <div>
            <label className="label">
              Mot de passe {user ? '(laisser vide pour ne pas changer)' : '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder={user ? 'Nouveau mot de passe' : 'Minimum 6 caractères'}
              required={!user}
            />
            <p className="text-xs text-gray-500 mt-1">
              {user
                ? 'Laissez vide si vous ne souhaitez pas changer le mot de passe'
                : 'Le mot de passe doit contenir au moins 6 caractères'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 btn-primary"
            >
              {mutation.isPending
                ? 'Enregistrement...'
                : user
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;