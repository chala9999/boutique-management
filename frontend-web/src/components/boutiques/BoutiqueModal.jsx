import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boutiquesAPI } from '../../api/boutiques';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

const BoutiqueModal = ({ boutique, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    adresse: '',
    telephone: '',
    email: '',
    type_boutique: 'physique',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');

  // ✅ Correction du useEffect avec réinitialisation
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
      if (boutique.logo) {
        setLogoPreview(boutique.logo_url || boutique.logo || null);
      } else {
              setLogoPreview(null);
      }
    } else {
      // ✅ Réinitialisation quand on crée une nouvelle boutique
      setFormData({
        nom: '',
        description: '',
        adresse: '',
        telephone: '',
        email: '',
        type_boutique: 'physique',
      });
      setLogoPreview(null);
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [boutique]); // ✅ Dépendance correcte

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (boutique) {
        return await boutiquesAPI.update(boutique.id, data);
      } else {
        return await boutiquesAPI.create(data);
      }
    },
    onSuccess: async (boutiqueResult) => {
      if (logoFile && boutiqueResult.id) {
        const uploadFormData = new FormData();
        uploadFormData.append('logo', logoFile);
        await boutiquesAPI.uploadLogo(boutiqueResult.id, uploadFormData);
      }
      queryClient.invalidateQueries(['boutiques']);
      onClose();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
            return `${key}: ${value}`;
          })
          .join('\n');
        setError(errorMessages);
      } else {
        setError('Une erreur est survenue');
      }
    },
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format non supporté. Utilisez JPG, PNG, GIF ou WEBP');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5MB');
        return;
      }
      
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setError('');
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {boutique ? 'Modifier la boutique' : 'Nouvelle boutique'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Section Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la boutique
              <span className="text-gray-400 text-xs ml-2">(optionnel)</span>
            </label>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="btn-secondary inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choisir une image</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WEBP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

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
              {mutation.isPending ? 'Enregistrement...' : (boutique ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoutiqueModal;