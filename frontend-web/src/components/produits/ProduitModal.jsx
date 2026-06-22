import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { X, Upload, Package, Trash2 } from 'lucide-react';

const ProduitModal = ({ produit, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    reference: '',
    code_barre: '',
    categorie: '',
    boutique: '',
    prix_achat: '',
    prix_vente: '',
    stock_actuel: '',
    stock_minimum: '5',
    unite: 'unite',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Récupérer les catégories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => produitsAPI.getCategories(),
  });

  useEffect(() => {
  if (produit) {
    // 🔥 DEBUG : Affiche tout ce que contient produit
    console.log('📦 PRODUIT COMPLET:', JSON.stringify(produit, null, 2));

    // ✅ Fonction qui extrait l'ID de n'importe quel format
    const getId = (field) => {
      if (!field) return '';
      if (typeof field === 'number') return String(field);
      if (typeof field === 'string') return field;
      if (typeof field === 'object') {
        return field.id ? String(field.id) : '';
      }
      return '';
    };

    setFormData({
      nom: produit.nom || '',
      description: produit.description || '',
      reference: produit.reference || '',
      code_barre: produit.code_barre || '',
      categorie: getId(produit.categorie),
      boutique: getId(produit.boutique),
      prix_achat: produit.prix_achat || '',
      prix_vente: produit.prix_vente || '',
      stock_actuel: produit.stock_actuel || '',
      stock_minimum: produit.stock_minimum || '5',
      unite: produit.unite || 'unite',
    });
    
    if (produit.image_principale) {
      setImagePreview(produit.image_principale);
    }
  } else {
    setFormData({
      nom: '',
      description: '',
      reference: '',
      code_barre: '',
      categorie: '',
      boutique: '',
      prix_achat: '',
      prix_vente: '',
      stock_actuel: '',
      stock_minimum: '5',
      unite: 'unite',
    });
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
}, [produit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      let result;
      if (produit) {
        result = await produitsAPI.update(produit.id, data);
      } else {
        result = await produitsAPI.create(data);
      }
      
      // Upload image si sélectionnée
      if (imageFile && result.id) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        await produitsAPI.uploadImage(result.id, uploadFormData);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['produits']);
      onClose();
    },
    onError: (error) => {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.entries(errors)
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.prix_vente) < parseFloat(formData.prix_achat)) {
      setError('Le prix de vente ne peut pas être inférieur au prix d\'achat');
      return;
    }
    
    mutation.mutate(formData);
  };

  const marge = formData.prix_achat && formData.prix_vente 
    ? ((parseFloat(formData.prix_vente) - parseFloat(formData.prix_achat)) / parseFloat(formData.prix_achat)) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {produit ? 'Modifier le produit' : 'Nouveau produit'}
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
              Image du produit
              <span className="text-gray-400 text-xs ml-2">(optionnel)</span>
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
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
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="product-image"
                />
                <label
                  htmlFor="product-image"
                  className="btn-secondary inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choisir une image</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Formulaire existant */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom du produit *</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">Référence *</label>
              <input type="text" name="reference" value={formData.reference} onChange={handleChange} className="input" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Boutique *</label>
              <select name="boutique" value={formData.boutique} onChange={handleChange} className="input" required>
                <option value="">Sélectionnez une boutique</option>
                {boutiques?.results?.map((b) => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select name="categorie" value={formData.categorie} onChange={handleChange} className="input">
                <option value="">Aucune catégorie</option>
                {categories?.results?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Prix d'achat *</label>
              <input type="number" name="prix_achat" value={formData.prix_achat} onChange={handleChange} className="input" min="0" required />
            </div>
            <div>
              <label className="label">Prix de vente *</label>
              <input type="number" name="prix_vente" value={formData.prix_vente} onChange={handleChange} className="input" min="0" required />
            </div>
            <div>
              <label className="label">Unité</label>
              <select name="unite" value={formData.unite} onChange={handleChange} className="input">
                <option value="unite">Unité</option>
                <option value="kg">Kilogramme</option>
                <option value="g">Gramme</option>
                <option value="l">Litre</option>
                <option value="ml">Millilitre</option>
                <option value="paquet">Paquet</option>
                <option value="carton">Carton</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Stock actuel *</label>
              <input type="number" name="stock_actuel" value={formData.stock_actuel} onChange={handleChange} className="input" min="0" required />
            </div>
            <div>
              <label className="label">Stock minimum</label>
              <input type="number" name="stock_minimum" value={formData.stock_minimum} onChange={handleChange} className="input" min="0" />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input" rows="3" />
          </div>

          {formData.prix_achat && formData.prix_vente && (
            <div className={`p-4 rounded-lg ${marge > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm">
                <span className="font-medium">Marge bénéficiaire :</span>{' '}
                <span className={marge > 0 ? 'text-green-600' : 'text-red-600'}>
                  {marge.toFixed(2)}%
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
              {mutation.isPending ? 'Enregistrement...' : (produit ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProduitModal;