import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import { X, DollarSign } from 'lucide-react';

const AjouterPaiementModal = ({ commande, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    montant: commande.montant_restant,
    mode_paiement: 'especes',
    reference: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => commandesAPI.ajouterPaiement(commande.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', commande.id]);
      queryClient.invalidateQueries(['commandes']);
      alert('Paiement ajouté avec succès');
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Une erreur est survenue');
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

    const montant = parseFloat(formData.montant);

    if (montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (montant > commande.montant_restant) {
      setError(`Le montant ne peut pas dépasser ${commande.montant_restant} FCFA`);
      return;
    }

    mutation.mutate({
      ...formData,
      montant: montant,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Ajouter un paiement</h2>
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

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-800">Montant total :</span>
              <span className="font-semibold text-blue-900">
                {commande.montant_total?.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-800">Déjà payé :</span>
              <span className="font-semibold text-green-600">
                {commande.montant_paye?.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
              <span className="text-blue-800 font-medium">Restant à payer :</span>
              <span className="font-bold text-red-600">
                {commande.montant_restant?.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          <div>
            <label className="label">Montant du paiement (FCFA) *</label>
            <input
              type="number"
              name="montant"
              value={formData.montant}
              onChange={handleChange}
              className="input"
              min="0"
              max={commande.montant_restant}
              step="0.01"
              required
            />
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, montant: commande.montant_restant })
              }
              className="text-sm text-primary-600 hover:text-primary-700 mt-1"
            >
              Solder la totalité
            </button>
          </div>

          <div>
            <label className="label">Mode de paiement *</label>
            <select
              name="mode_paiement"
              value={formData.mode_paiement}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="especes">Espèces</option>
              <option value="carte">Carte Bancaire</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
            </select>
          </div>

          <div>
            <label className="label">Référence (optionnel)</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="input"
              placeholder="N° de transaction, chèque, etc."
            />
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows="2"
              placeholder="Informations complémentaires..."
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
              {mutation.isPending ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjouterPaiementModal;