import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../api/auth';
import { X, Key } from 'lucide-react';

const ChangePasswordModal = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (password) => authAPI.changePassword(user.id, password),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      alert('Mot de passe modifié avec succès');
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Une erreur est survenue');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    mutation.mutate(newPassword);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Changer le mot de passe
            </h2>
          </div>
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

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Vous modifiez le mot de passe de :{' '}
              <span className="font-semibold">
                {user.first_name} {user.last_name} (@{user.username})
              </span>
            </p>
          </div>

          <div>
            <label className="label">Nouveau mot de passe *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="Minimum 6 caractères"
              required
            />
          </div>

          <div>
            <label className="label">Confirmer le mot de passe *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Retapez le mot de passe"
              required
            />
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
              {mutation.isPending ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;