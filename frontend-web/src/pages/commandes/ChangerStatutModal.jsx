import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import { X, Edit } from 'lucide-react';

const ChangerStatutModal = ({ commande, onClose }) => {
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState(commande.statut);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (nouveauStatut) => commandesAPI.changerStatut(commande.id, nouveauStatut),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', commande.id]);
      queryClient.invalidateQueries(['commandes']);
      alert('Statut modifié avec succès');
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Une erreur est survenue');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (statut === commande.statut) {
      setError('Veuillez sélectionner un statut différent');
      return;
    }

    mutation.mutate(statut);
  };

  const statutsDisponibles = [
    { value: 'en_attente', label: 'En attente', description: 'Commande en attente de confirmation' },
    { value: 'confirmee', label: 'Confirmée', description: 'Commande confirmée par le fournisseur' },
    { value: 'en_cours', label: 'En cours', description: 'Commande en cours de préparation/livraison' },
    { value: 'livree', label: 'Livrée', description: 'Commande entièrement livrée' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Changer le statut</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Commande : <span className="font-semibold">{commande.numero_commande}</span>
            </p>
            <p className="text-sm text-gray-700">
              Statut actuel : <span className="font-semibold capitalize">{commande.statut.replace('_', ' ')}</span>
            </p>
          </div>

          <div>
            <label className="label">Nouveau statut *</label>
            <div className="space-y-2">
              {statutsDisponibles.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    statut === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="statut"
                    value={option.value}
                    checked={statut === option.value}
                    onChange={(e) => setStatut(e.target.value)}
                    className="mt-1 text-primary-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
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

export default ChangerStatutModal;