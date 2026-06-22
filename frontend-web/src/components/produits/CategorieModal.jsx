import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

const CategorieModal = ({ categorie, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categorie) {
      setFormData({
        nom: categorie.nom || '',
        description: categorie.description || '',
      });
      if (categorie.image) {
        setImagePreview(categorie.image);
      }
    }
  }, [categorie]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      let result;
      if (categorie) {
        result = await produitsAPI.updateCategorie(categorie.id, data);
      } else {
        result = await produitsAPI.createCategorie(data);
      }
      
      if (imageFile && result.id) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        await produitsAPI.uploadCategorieImage(result.id, uploadFormData);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      onClose();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError('Une erreur est survenue');
      }
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format non supporté');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image trop grande (max 5MB)');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
    
    if (!formData.nom.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }
    
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {categorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
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

          {/* Upload image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image de la catégorie
              <span className="text-gray-400 text-xs ml-2">(optionnel)</span>
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="categorie-image"
                />
                <label
                  htmlFor="categorie-image"
                  className="btn-secondary inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choisir une image</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Nom de la catégorie *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Électronique, Vêtements, Alimentation..."
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Description de la catégorie..."
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
              {mutation.isPending ? 'Enregistrement...' : (categorie ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategorieModal;