import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import { X, Package, CheckCircle } from 'lucide-react';

const RecevoirCommandeModal = ({ commande, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    numero_bon_livraison: '',
    notes: '',
    lignes: commande.lignes
      .filter((ligne) => ligne.quantite_restante > 0)
      .map((ligne) => ({
        ligne_commande: ligne.id,
        quantite_recue: ligne.quantite_restante,
        produit_nom: ligne.produit_info?.nom,
        quantite_restante: ligne.quantite_restante,
        notes: '',
      })),
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => commandesAPI.recevoir(commande.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', commande.id]);
      queryClient.invalidateQueries(['commandes']);
      queryClient.invalidateQueries(['produits']);
      alert('Livraison reçue avec succès ! Le stock a été mis à jour.');
      onClose();
    },
    onError: (error) => {
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

  const handleQuantiteChange = (index, value) => {
    const quantite = parseFloat(value) || 0;
    const ligne = formData.lignes[index];

    if (quantite > ligne.quantite_restante) {
      setError(
        `Quantité maximale pour ${ligne.produit_nom}: ${ligne.quantite_restante}`
      );
      return;
    }

    setError('');
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...ligne, quantite_recue: quantite };
    setFormData({ ...formData, lignes: newLignes });
  };

  const handleNotesLigneChange = (index, value) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], notes: value };
    setFormData({ ...formData, lignes: newLignes });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Vérifier qu'au moins une ligne a une quantité > 0
    const lignesValides = formData.lignes.filter(
      (ligne) => ligne.quantite_recue > 0
    );

    if (lignesValides.length === 0) {
      setError('Veuillez saisir au moins une quantité à recevoir');
      return;
    }

    const dataToSend = {
      numero_bon_livraison: formData.numero_bon_livraison,
      notes: formData.notes,
      lignes: lignesValides.map((ligne) => ({
        ligne_commande: ligne.ligne_commande,
        quantite_recue: ligne.quantite_recue,
        notes: ligne.notes,
      })),
    };

    mutation.mutate(dataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recevoir la livraison
              </h2>
              <p className="text-sm text-gray-600">
                Commande {commande.numero_commande}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Le stock des produits sera automatiquement mis
              à jour selon les quantités reçues.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numéro de bon de livraison</label>
              <input
                type="text"
                value={formData.numero_bon_livraison}
                onChange={(e) =>
                  setFormData({ ...formData, numero_bon_livraison: e.target.value })
                }
                className="input"
                placeholder="Ex: BL-2024-001"
              />
            </div>

            <div>
              <label className="label">Date de réception</label>
              <input
                type="text"
                value={new Date().toLocaleDateString('fr-FR')}
                className="input bg-gray-50"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="label">Notes générales (optionnel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows="2"
              placeholder="Commentaires sur la livraison..."
            />
          </div>

          {/* Liste des produits */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Produits à recevoir
            </h3>
            <div className="space-y-4">
              {formData.lignes.map((ligne, index) => (
                <div
                  key={ligne.ligne_commande}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ligne.produit_nom}</p>
                      <p className="text-sm text-gray-600">
                        Restant à recevoir : {ligne.quantite_restante} unités
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Quantité reçue *
                      </label>
                      <input
                        type="number"
                        value={ligne.quantite_recue}
                        onChange={(e) => handleQuantiteChange(index, e.target.value)}
                        className="input"
                        min="0"
                        max={ligne.quantite_restante}
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Notes sur ce produit
                      </label>
                      <input
                        type="text"
                        value={ligne.notes}
                        onChange={(e) =>
                          handleNotesLigneChange(index, e.target.value)
                        }
                        className="input"
                        placeholder="Ex: Carton endommagé"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
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
              {mutation.isPending ? 'Enregistrement...' : 'Valider la réception'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecevoirCommandeModal;