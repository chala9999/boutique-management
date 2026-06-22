import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fournisseursAPI } from '../../api/fournisseurs';
import { boutiquesAPI } from '../../api/boutiques';
import { X } from 'lucide-react';

const FournisseurModal = ({ fournisseur, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    telephone2: '',
    adresse: '',
    ville: '',
    pays: 'Niger',
    numero_compte: '',
    banque: '',
    boutique: '',
    is_active: true,
    notes: '',
  });

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  /*useEffect(() => {
    if (fournisseur) {
      setFormData({
        nom: fournisseur.nom || '',
        entreprise: fournisseur.entreprise || '',
        email: fournisseur.email || '',
        telephone: fournisseur.telephone || '',
        telephone2: fournisseur.telephone2 || '',
        adresse: fournisseur.adresse || '',
        ville: fournisseur.ville || '',
        pays: fournisseur.pays || 'Niger',
        numero_compte: fournisseur.numero_compte || '',
        banque: fournisseur.banque || '',
        boutique: fournisseur.boutique || '',
        is_active: fournisseur.is_active !== undefined ? fournisseur.is_active : true,
        notes: fournisseur.notes || '',
      });
    }
  }, [fournisseur]);*/

  useEffect(() => {
  if (fournisseur) {
    setFormData({
      nom: fournisseur.nom || '',
      entreprise: fournisseur.entreprise || '',
      email: fournisseur.email || '',
      telephone: fournisseur.telephone || '',
      telephone2: fournisseur.telephone2 || '',
      adresse: fournisseur.adresse || '',
      ville: fournisseur.ville || '',
      pays: fournisseur.pays || 'Niger',
      numero_compte: fournisseur.numero_compte || '',
      banque: fournisseur.banque || '',
      boutique: fournisseur.boutique || '',
      is_active: fournisseur.is_active !== undefined ? fournisseur.is_active : true,
      notes: fournisseur.notes || '',
    });
  } else {
    setFormData({
      nom: '',
      entreprise: '',
      email: '',
      telephone: '',
      telephone2: '',
      adresse: '',
      ville: '',
      pays: 'Niger',
      numero_compte: '',
      banque: '',
      boutique: '',
      is_active: true,
      notes: '',
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const mutation = useMutation({
    mutationFn: (data) =>
      fournisseur
        ? fournisseursAPI.update(fournisseur.id, data)
        : fournisseursAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs']);
      alert(
        fournisseur
          ? 'Fournisseur modifié avec succès'
          : 'Fournisseur créé avec succès'
      );
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Une erreur est survenue');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom du fournisseur *</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Entreprise</label>
              <input
                type="text"
                name="entreprise"
                value={formData.entreprise}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Boutique *</label>
            <select
              name="boutique"
              value={formData.boutique}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Sélectionnez une boutique</option>
              {boutiques?.results?.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Téléphone *</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Téléphone 2</label>
              <input
                type="tel"
                name="telephone2"
                value={formData.telephone2}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Adresse</label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              className="input"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Pays</label>
              <input
                type="text"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numéro de compte</label>
              <input
                type="text"
                name="numero_compte"
                value={formData.numero_compte}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Banque</label>
              <input
                type="text"
                name="banque"
                value={formData.banque}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label className="text-sm text-gray-700">Fournisseur actif</label>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
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
                : fournisseur
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FournisseurModal;