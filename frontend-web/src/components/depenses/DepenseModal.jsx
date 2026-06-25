import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { depensesAPI } from '../../api/depenses';
import { boutiquesAPI } from '../../api/boutiques';
import { X } from 'lucide-react';

const DepenseModal = ({ depense, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    boutique: '',
    titre: '',
    description: '',
    montant: '',
    categorie: 'autre',
    type_depense: 'boutique',
    statut_remboursement: 'na',
    date_depense: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  useEffect(() => {
    if (depense) {
      setFormData({
        boutique: depense.boutique || '',
        titre: depense.titre || '',
        description: depense.description || '',
        montant: depense.montant || '',
        categorie: depense.categorie || 'autre',
        type_depense: depense.type_depense || 'boutique',
        statut_remboursement: depense.statut_remboursement || 'na',
        date_depense: depense.date_depense || new Date().toISOString().split('T')[0],
      });
    }
  }, [depense]);

  const mutation = useMutation({
    mutationFn: (data) => depense ? depensesAPI.update(depense.id, data) : depensesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['depenses']);
      onClose();
    },
    onError: (error) => {
      const errors = error.response?.data;
      if (errors) {
        setError(Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join('\n'));
      } else {
        setError('Une erreur est survenue');
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Si type change vers boutique, reset remboursement
    if (name === 'type_depense' && value === 'boutique') {
      setFormData(prev => ({ ...prev, type_depense: value, statut_remboursement: 'na' }));
    } else if (name === 'type_depense' && value === 'personnelle') {
      setFormData(prev => ({ ...prev, type_depense: value, statut_remboursement: 'en_attente' }));
    }
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.boutique) { setError('Veuillez sélectionner une boutique'); return; }
    if (!formData.montant || parseFloat(formData.montant) <= 0) { setError('Montant invalide'); return; }
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {depense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="label">Boutique *</label>
            <select name="boutique" value={formData.boutique} onChange={handleChange} className="input" required>
              <option value="">Sélectionner une boutique</option>
              {boutiques?.results?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Titre *</label>
            <input type="text" name="titre" value={formData.titre} onChange={handleChange} className="input" placeholder="Ex: Loyer du mois de janvier" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type de dépense *</label>
              <select name="type_depense" value={formData.type_depense} onChange={handleChange} className="input">
                <option value="boutique">Dépense boutique</option>
                <option value="personnelle">Dépense personnelle</option>
              </select>
            </div>
            <div>
              <label className="label">Catégorie *</label>
              <select name="categorie" value={formData.categorie} onChange={handleChange} className="input">
                <option value="loyer">Loyer</option>
                <option value="electricite">Électricité</option>
                <option value="eau">Eau</option>
                <option value="internet">Internet / Téléphone</option>
                <option value="fournitures">Fournitures</option>
                <option value="transport">Transport</option>
                <option value="salaire">Salaire / Prime</option>
                <option value="maintenance">Maintenance</option>
                <option value="publicite">Publicité</option>
                <option value="personnel">Personnel</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Montant (FCFA) *</label>
              <input type="number" name="montant" value={formData.montant} onChange={handleChange} className="input" min="0" placeholder="0" required />
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" name="date_depense" value={formData.date_depense} onChange={handleChange} className="input" required />
            </div>
          </div>

          {formData.type_depense === 'personnelle' && (
            <div>
              <label className="label">Statut remboursement</label>
              <select name="statut_remboursement" value={formData.statut_remboursement} onChange={handleChange} className="input">
                <option value="en_attente">En attente de remboursement</option>
                <option value="rembourse">Remboursé</option>
              </select>
            </div>
          )}

          <div>
            <label className="label">Description (optionnel)</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input" rows="3" placeholder="Détails sur cette dépense..." />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={mutation.isPending}>Annuler</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
              {mutation.isPending ? 'Enregistrement...' : (depense ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepenseModal;