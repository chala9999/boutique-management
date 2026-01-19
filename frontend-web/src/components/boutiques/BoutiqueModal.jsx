import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boutiquesAPI } from '../../api/boutiques';
import { X } from 'lucide-react';

const BoutiqueModal = ({ boutique, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    adresse: '',
    telephone: '',
    email: '',
    type_boutique: 'physique',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (boutique) {
      setFormData({
        nom: boutique.nom || '',
        description: boutique.description || '',
        adresse: boutique.adresse || '',
        telephone: boutique.telephone || '',
        email: boutique.email || '',
        type_boutique: boutique.type_boutique || 'physique',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: (data) =>
      boutique
        ? boutiquesAPI.update(boutique.id, data)
        : boutiquesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['boutiques']);
      alert(
        boutique
          ? 'Boutique modifiée avec succès'
          : 'Boutique créée avec succès'
      );
      onClose();
    },
    onError: (error) => {
      console.error('Erreur complète:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData) {
        // Afficher toutes les erreurs de validation
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
        
        setError(errorMessages || 'Une erreur est survenue');
        alert(errorMessages || 'Une erreur est survenue');
      } else {
        setError('Une erreur est survenue');
        alert('Une erreur est survenue');
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
    
    // Validation côté client
    if (!formData.nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!formData.adresse.trim()) {
      setError('L\'adresse est requise');
      return;
    }
    if (!formData.telephone.trim()) {
      setError('Le téléphone est requis');
      return;
    }

    console.log('Données envoyées:', formData);
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {boutique ? 'Modifier la boutique' : 'Nouvelle boutique'}
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

          <div>
            <label className="label">Nom de la boutique *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Boutique Centre-Ville"
              required
            />
          </div>

          <div>
            <label className="label">Type de boutique *</label>
            <select
              name="type_boutique"
              value={formData.type_boutique}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="physique">Boutique Physique</option>
              <option value="en_ligne">Boutique en Ligne</option>
              <option value="hybride">Hybride</option>
            </select>
          </div>

          <div>
            <label className="label">Adresse *</label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Avenue de la République, Niamey"
              required
            />
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
                placeholder="Ex: +227 90 00 00 00"
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="Ex: contact@boutique.com"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Décrivez votre boutique..."
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
              {mutation.isPending
                ? 'Enregistrement...'
                : boutique
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoutiqueModal;