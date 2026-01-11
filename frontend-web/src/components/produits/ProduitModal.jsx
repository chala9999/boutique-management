import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { X } from 'lucide-react';

const ProduitModal = ({ produit, onClose }) => {
  const queryClient = useQueryClient();
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

  /*useEffect(() => {
    if (produit) {
      setFormData({
        nom: produit.nom || '',
        description: produit.description || '',
        reference: produit.reference || '',
        code_barre: produit.code_barre || '',
        categorie: produit.categorie || '',
        boutique: produit.boutique || '',
        prix_achat: produit.prix_achat || '',
        prix_vente: produit.prix_vente || '',
        stock_actuel: produit.stock_actuel || '',
        stock_minimum: produit.stock_minimum || '5',
        unite: produit.unite || 'unite',
      });
    }
  }, [produit]);*/

  useEffect(() => {
  if (produit) {
    setFormData({
      nom: produit.nom || '',
      description: produit.description || '',
      reference: produit.reference || '',
      code_barre: produit.code_barre || '',
      categorie: produit.categorie || '',
      boutique: produit.boutique || '',
      prix_achat: produit.prix_achat || '',
      prix_vente: produit.prix_vente || '',
      stock_actuel: produit.stock_actuel || '',
      stock_minimum: produit.stock_minimum || '5',
      unite: produit.unite || 'unite',
    });
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
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const mutation = useMutation({
    mutationFn: (data) =>
      produit
        ? produitsAPI.update(produit.id, data)
        : produitsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['produits']);
      alert(
        produit
          ? 'Produit modifié avec succès'
          : 'Produit créé avec succès'
      );
      onClose();
    },
    onError: (error) => {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.entries(errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        alert(errorMessages);
      } else {
        alert('Une erreur est survenue');
      }
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (parseFloat(formData.prix_vente) < parseFloat(formData.prix_achat)) {
      alert('Le prix de vente ne peut pas être inférieur au prix d\'achat');
      return;
    }
    
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {produit ? 'Modifier le produit' : 'Nouveau produit'}
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
              <label className="label">Nom du produit *</label>
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
              <label className="label">Référence *</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="label">Catégorie</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="input"
              >
                <option value="">Aucune catégorie</option>
                {categories?.results?.map((categorie) => (
                  <option key={categorie.id} value={categorie.id}>
                    {categorie.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Code barre</label>
            <input
              type="text"
              name="code_barre"
              value={formData.code_barre}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Prix d'achat *</label>
              <input
                type="number"
                name="prix_achat"
                value={formData.prix_achat}
                onChange={handleChange}
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="label">Prix de vente *</label>
              <input
                type="number"
                name="prix_vente"
                value={formData.prix_vente}
                onChange={handleChange}
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="label">Unité</label>
              <select
                name="unite"
                value={formData.unite}
                onChange={handleChange}
                className="input"
              >
                <option value="unite">Unité</option>
                <option value="kg">Kilogramme</option>
                <option value="g">Gramme</option>
                <option value="l">Litre</option>
                <option value="ml">Millilitre</option>
                <option value="m">Mètre</option>
                <option value="paquet">Paquet</option>
                <option value="carton">Carton</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Stock actuel *</label>
              <input
                type="number"
                name="stock_actuel"
                value={formData.stock_actuel}
                onChange={handleChange}
                className="input"
                min="0"
                required
              />
            </div>

            <div>
              <label className="label">Stock minimum (alerte)</label>
              <input
                type="number"
                name="stock_minimum"
                value={formData.stock_minimum}
                onChange={handleChange}
                className="input"
                min="0"
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
            />
          </div>

          {/* Calcul de la marge */}
          {formData.prix_achat && formData.prix_vente && (
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Marge bénéficiaire :</span>{' '}
                {(
                  parseFloat(formData.prix_vente) -
                  parseFloat(formData.prix_achat)
                ).toLocaleString()}{' '}
                FCFA (
                {(
                  ((parseFloat(formData.prix_vente) -
                    parseFloat(formData.prix_achat)) /
                    parseFloat(formData.prix_achat)) *
                  100
                ).toFixed(2)}
                %)
              </p>
            </div>
          )}

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
                : produit
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProduitModal;