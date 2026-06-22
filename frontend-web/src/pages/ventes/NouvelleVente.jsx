import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { clientsAPI } from '../../api/clients';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  User,
  Package,
} from 'lucide-react';

const NouvelleVente = () => {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [searchProduit, setSearchProduit] = useState('');
  const [panier, setPanier] = useState([]);
  const [remiseType, setRemiseType] = useState('pourcentage');
  const [remiseValeur, setRemiseValeur] = useState(0);
  const [modePaiement, setModePaiement] = useState('especes');
  const [montantPaye, setMontantPaye] = useState('');

  // Vérifier l'autorisation
  if (!can.createVente) {
    return <Navigate to="/ventes" replace />;
  }

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
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

  // Récupérer les clients
  const { data: clients } = useQuery({
    queryKey: ['clients', selectedBoutique],
    queryFn: () => clientsAPI.getAll({ boutique: selectedBoutique }),
    enabled: !!selectedBoutique,
  });

  // Créer la vente
  const createVenteMutation = useMutation({
    mutationFn: (data) => ventesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ventes']);
      queryClient.invalidateQueries(['produits']);
      alert('Vente créée avec succès !');
      navigate('/ventes');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la création de la vente');
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
          prix_unitaire: produit.prix_vente,
          remise_pourcentage: 0,
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

  const montantRemise =
    remiseType === 'pourcentage'
      ? (montantTotal * remiseValeur) / 100
      : parseFloat(remiseValeur) || 0;

  const montantFinal = montantTotal - montantRemise;
  
  // Calcul du bénéfice estimé
  const beneficeEstime = panier.reduce((acc, item) => {
    const produit = item.produit_info;
    const beneficeUnitaire = produit.prix_vente - produit.prix_achat;
    return acc + (beneficeUnitaire * item.quantite);
  }, 0);

  const montantRendu = Math.max(0, parseFloat(montantPaye) - montantFinal);

  // Soumettre la vente
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedBoutique) {
      alert('Veuillez sélectionner une boutique');
      return;
    }

    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }

    const venteData = {
      boutique: parseInt(selectedBoutique),
      client: selectedClient ? parseInt(selectedClient) : null,
      mode_paiement: modePaiement,
      remise_type: remiseType,
      remise_valeur: parseFloat(remiseValeur) || 0,
      tva_pourcentage: 0,
      montant_paye: parseFloat(montantPaye) || 0,
      lignes: panier.map((item) => ({
        produit: item.produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        remise_pourcentage: item.remise_pourcentage,
      })),
    };

    createVenteMutation.mutate(venteData);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Vente</h1>
          <p className="text-gray-600 mt-1">Point de vente (POS)</p>
        </div>
        <button
          onClick={() => navigate('/ventes')}
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
            {/* Sélection boutique */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                1. Sélectionner une boutique
              </h3>
              <select
                value={selectedBoutique}
                onChange={(e) => {
                  setSelectedBoutique(e.target.value);
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

            {/* Recherche produit */}
            {selectedBoutique && (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    2. Rechercher un produit
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
                            <p className="font-bold text-gray-900">
                              {produit.prix_vente.toLocaleString()} FCFA
                            </p>
                            <button
                              type="button"
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Colonne droite - Panier et paiement */}
          <div className="space-y-6">
            {/* Sélection client */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Client (optionnel)
                </h3>
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="input"
                disabled={!selectedBoutique}
              >
                <option value="">Client anonyme</option>
                {clients?.results?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom_complet} ({client.telephone})
                  </option>
                ))}
              </select>
            </div>

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
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {panier.map((item) => (
                    <div
                      key={item.produit}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {item.produit_info.nom}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.prix_unitaire.toLocaleString()} FCFA
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

                      <div className="flex items-center justify-between">
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
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                            min="0"
                            max={item.produit_info.stock_actuel}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              modifierQuantite(item.produit, item.quantite + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                            disabled={
                              item.quantite >= item.produit_info.stock_actuel
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {calculerSousTotal(item).toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculs et paiement */}
            {panier.length > 0 && (
              <>
                {/* Remise */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Remise
                  </h3>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <select
                        value={remiseType}
                        onChange={(e) => setRemiseType(e.target.value)}
                        className="input flex-1"
                      >
                        <option value="pourcentage">%</option>
                        <option value="montant">FCFA</option>
                      </select>
                      <input
                        type="number"
                        value={remiseValeur}
                        onChange={(e) => setRemiseValeur(e.target.value)}
                        className="input flex-1"
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Mode de paiement */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Mode de paiement
                  </h3>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                    className="input mb-4"
                    required
                  >
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte Bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                    <option value="credit">Crédit</option>
                  </select>

                  <div>
                    <label className="label">Montant payé</label>
                    <input
                      type="number"
                      value={montantPaye}
                      onChange={(e) => setMontantPaye(e.target.value)}
                      className="input"
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Totaux */}
                <div className="card bg-primary-50 border-primary-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="font-medium text-gray-900">
                        {montantTotal.toLocaleString()} FCFA
                      </span>
                    </div>
                    {montantRemise > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remise</span>
                        <span className="font-medium text-red-600">
                          -{montantRemise.toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    <div className="border-t border-primary-200 pt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-primary-600">
                          {montantFinal.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                    {montantPaye > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payé</span>
                          <span className="font-medium text-green-600">
                            {parseFloat(montantPaye).toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monnaie à rendre</span>
                          <span className="font-medium text-gray-900">
                            {montantRendu.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Bénéfice estimé</span>
                          <span className="font-medium text-green-600">
                            +{beneficeEstime.toLocaleString()} FCFA
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bouton valider */}
                <button
                  type="submit"
                  disabled={createVenteMutation.isPending}
                  className="w-full btn-primary py-4 text-lg"
                >
                  {createVenteMutation.isPending
                    ? 'Traitement...'
                    : 'Valider la vente'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NouvelleVente;