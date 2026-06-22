import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import { fournisseursAPI } from '../../api/fournisseurs';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  Package,
} from 'lucide-react';

const NouvelleCommande = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [searchProduit, setSearchProduit] = useState('');
  const [panier, setPanier] = useState([]);
  const [dateLivraison, setDateLivraison] = useState('');
  const [notes, setNotes] = useState('');

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Récupérer les fournisseurs
  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs', selectedBoutique],
    queryFn: () => fournisseursAPI.getAll({ boutique: selectedBoutique }),
    enabled: !!selectedBoutique,
  });

  // Récupérer les produits
  const { data: produits } = useQuery({
    queryKey: ['produits', selectedBoutique, searchProduit],
    queryFn: () =>
      produitsAPI.getAll({
        boutique: selectedBoutique,
        search: searchProduit,
        actifs: true,
      }),
    enabled: !!selectedBoutique,
  });

  // Créer la commande
  const createCommandeMutation = useMutation({
    mutationFn: (data) => commandesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes']);
      alert('Commande créée avec succès !');
      navigate('/commandes');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la création de la commande');
    },
  });

  // Ajouter un produit au panier
  const ajouterAuPanier = (produit) => {
    const existe = panier.find((item) => item.produit === produit.id);

    if (existe) {
      setPanier(
        panier.map((item) =>
          item.produit === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        )
      );
    } else {
      setPanier([
        ...panier,
        {
          produit: produit.id,
          produit_info: produit,
          quantite: 1,
          prix_unitaire: produit.prix_achat || 0,
        },
      ]);
    }
  };

  // Modifier la quantité
  const modifierQuantite = (produitId, quantite) => {
    if (quantite <= 0) {
      retirerDuPanier(produitId);
      return;
    }

    setPanier(
      panier.map((item) =>
        item.produit === produitId ? { ...item, quantite } : item
      )
    );
  };

  // Modifier le prix unitaire
  const modifierPrix = (produitId, prix) => {
    setPanier(
      panier.map((item) =>
        item.produit === produitId
          ? { ...item, prix_unitaire: parseFloat(prix) || 0 }
          : item
      )
    );
  };

  // Retirer du panier
  const retirerDuPanier = (produitId) => {
    setPanier(panier.filter((item) => item.produit !== produitId));
  };

  // Vider le panier
  const viderPanier = () => {
    if (window.confirm('Voulez-vous vraiment vider le panier ?')) {
      setPanier([]);
    }
  };

  // Calculs
  const calculerSousTotal = (item) => {
    return item.quantite * item.prix_unitaire;
  };

  const montantTotal = panier.reduce(
    (acc, item) => acc + calculerSousTotal(item),
    0
  );

  // Soumettre la commande
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedBoutique) {
      alert('Veuillez sélectionner une boutique');
      return;
    }

    if (!selectedFournisseur) {
      alert('Veuillez sélectionner un fournisseur');
      return;
    }

    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }

    const commandeData = {
      boutique: parseInt(selectedBoutique),
      fournisseur: parseInt(selectedFournisseur),
      date_livraison_prevue: dateLivraison || null,
      notes: notes,
      lignes: panier.map((item) => ({
        produit: item.produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
      })),
    };

    createCommandeMutation.mutate(commandeData);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Commande</h1>
          <p className="text-gray-600 mt-1">Créer une commande fournisseur</p>
        </div>
        <button
          onClick={() => navigate('/commandes')}
          className="btn-secondary flex items-center space-x-2"
        >
          <X className="w-5 h-5" />
          <span>Annuler</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - Sélection produits */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sélection boutique et fournisseur */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                1. Informations de base
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Boutique *</label>
                  <select
                    value={selectedBoutique}
                    onChange={(e) => {
                      setSelectedBoutique(e.target.value);
                      setSelectedFournisseur('');
                      setPanier([]);
                    }}
                    className="input"
                    required
                  >
                    <option value="">Choisir une boutique</option>
                    {boutiques?.results?.map((boutique) => (
                      <option key={boutique.id} value={boutique.id}>
                        {boutique.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBoutique && (
                  <div>
                    <label className="label">Fournisseur *</label>
                    <select
                      value={selectedFournisseur}
                      onChange={(e) => setSelectedFournisseur(e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">Choisir un fournisseur</option>
                      {fournisseurs?.results?.map((fournisseur) => (
                        <option key={fournisseur.id} value={fournisseur.id}>
                          {fournisseur.nom} {fournisseur.entreprise && `(${fournisseur.entreprise})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Date de livraison prévue</label>
                  <input
                    type="date"
                    value={dateLivraison}
                    onChange={(e) => setDateLivraison(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Recherche produit */}
            {selectedBoutique && selectedFournisseur && (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    2. Rechercher des produits
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchProduit}
                      onChange={(e) => setSearchProduit(e.target.value)}
                      className="input pl-10"
                      placeholder="Nom, référence, code barre..."
                    />
                  </div>
                </div>

                {/* Liste des produits */}
                <div className="card max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Produits disponibles
                  </h3>
                  {produits?.results?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p>Aucun produit trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {produits?.results?.map((produit) => (
                        <div
                          key={produit.id}
                          onClick={() => ajouterAuPanier(produit)}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {produit.image_principale ? (
                              <img
                                src={produit.image_principale}
                                alt={produit.nom}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {produit.nom}
                              </p>
                              <p className="text-sm text-gray-600">
                                {produit.reference} • Stock: {produit.stock_actuel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Prix d'achat
                            </p>
                            <p className="font-bold text-gray-900">
                              {produit.prix_achat?.toLocaleString() || 0} FCFA
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Colonne droite - Panier */}
          <div className="space-y-6">
            {/* Panier */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Panier ({panier.length})</span>
                </h3>
                {panier.length > 0 && (
                  <button
                    type="button"
                    onClick={viderPanier}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Vider
                  </button>
                )}
              </div>

              {panier.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p>Panier vide</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {panier.map((item) => (
                    <div
                      key={item.produit}
                      className="p-3 border border-gray-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {item.produit_info.nom}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.produit_info.reference}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => retirerDuPanier(item.produit)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantité */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          Quantité
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              modifierQuantite(item.produit, item.quantite - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantite}
                            onChange={(e) =>
                              modifierQuantite(
                                item.produit,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              modifierQuantite(item.produit, item.quantite + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Prix unitaire */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          Prix unitaire (FCFA)
                        </label>
                        <input
                          type="number"
                          value={item.prix_unitaire}
                          onChange={(e) =>
                            modifierPrix(item.produit, e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Sous-total */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sous-total</span>
                          <span className="font-semibold text-gray-900">
                            {calculerSousTotal(item).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes et Total */}
            {panier.length > 0 && (
              <>
                <div className="card">
                  <label className="label">Notes (optionnel)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="Informations supplémentaires sur la commande..."
                  />
                </div>

                {/* Total */}
                <div className="card bg-primary-50 border-primary-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total de la commande
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                      {montantTotal.toLocaleString()} FCFA
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {panier.length} produit{panier.length > 1 ? 's' : ''} •{' '}
                    {panier.reduce((acc, item) => acc + item.quantite, 0)} unité
                    {panier.reduce((acc, item) => acc + item.quantite, 0) > 1
                      ? 's'
                      : ''}
                  </p>
                </div>

                {/* Bouton valider */}
                <button
                  type="submit"
                  disabled={createCommandeMutation.isPending}
                  className="w-full btn-primary py-4 text-lg"
                >
                  {createCommandeMutation.isPending
                    ? 'Création...'
                    : 'Créer la commande'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NouvelleCommande;