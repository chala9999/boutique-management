import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI, fournisseursAPI } from '../../api/fournisseurs';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Package } from 'lucide-react';

const ModifierCommande = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [notes, setNotes] = useState('');
  const [searchProduit, setSearchProduit] = useState('');
  const [panier, setPanier] = useState([]);
  const [peutModifierLignes, setPeutModifierLignes] = useState(true);

  // Charger la commande
  const { data: commande, isLoading } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => commandesAPI.getById(id),
  });

  // Pré-remplir
  useEffect(() => {
    if (commande) {
      setSelectedFournisseur(commande.fournisseur || '');
      setDateLivraison(commande.date_livraison_prevue || '');
      setNotes(commande.notes || '');
      setPeutModifierLignes(!commande.receptions?.length);

      if (commande.lignes) {
        setPanier(
          commande.lignes.map((ligne) => ({
            produit: ligne.produit,
            produit_info: {
              nom: ligne.produit_info?.nom || '',
              prix_achat: ligne.prix_unitaire,
              reference: ligne.produit_info?.reference || '',
              stock_actuel: 999,
            },
            quantite: parseFloat(ligne.quantite_commandee),
            prix_unitaire: parseFloat(ligne.prix_unitaire),
          }))
        );
      }
    }
  }, [commande]);

  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs', commande?.boutique],
    queryFn: () => fournisseursAPI.getAll({ boutique: commande?.boutique }),
    enabled: !!commande?.boutique,
  });

  const { data: produits } = useQuery({
    queryKey: ['produits', commande?.boutique, searchProduit],
    queryFn: () => produitsAPI.getAll({
      boutique: commande?.boutique,
      search: searchProduit,
      actifs: true,
    }),
    enabled: !!commande?.boutique && peutModifierLignes,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => commandesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes']);
      queryClient.invalidateQueries(['commande', id]);
      alert('Commande modifiée avec succès !');
      navigate(`/commandes/${id}`);
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const ajouterAuPanier = (produit) => {
    const existe = panier.find((item) => item.produit === produit.id);
    if (existe) {
      setPanier(panier.map((item) =>
        item.produit === produit.id ? { ...item, quantite: item.quantite + 1 } : item
      ));
    } else {
      setPanier([...panier, {
        produit: produit.id,
        produit_info: produit,
        quantite: 1,
        prix_unitaire: parseFloat(produit.prix_achat) || 0,
      }]);
    }
  };

  const modifierQuantite = (produitId, quantite) => {
    if (quantite <= 0) {
      setPanier(panier.filter((item) => item.produit !== produitId));
      return;
    }
    setPanier(panier.map((item) =>
      item.produit === produitId ? { ...item, quantite } : item
    ));
  };

  const modifierPrix = (produitId, prix) => {
    setPanier(panier.map((item) =>
      item.produit === produitId ? { ...item, prix_unitaire: parseFloat(prix) || 0 } : item
    ));
  };

  const retirerDuPanier = (produitId) => {
    setPanier(panier.filter((item) => item.produit !== produitId));
  };

  const montantTotal = panier.reduce((acc, item) => acc + item.quantite * item.prix_unitaire, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }

    const payload = {
      fournisseur: parseInt(selectedFournisseur),
      date_livraison_prevue: dateLivraison || null,
      notes,
    };

    if (peutModifierLignes) {
      payload.lignes = panier.map((item) => ({
        produit: item.produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
      }));
    }

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (commande?.statut === 'livree' || commande?.statut === 'annulee') {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 font-medium">
          Cette commande est {commande.statut} et ne peut pas être modifiée.
        </p>
        <button onClick={() => navigate(`/commandes/${id}`)} className="btn-secondary mt-4">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier la commande</h1>
          <p className="text-gray-600 mt-1">#{commande?.numero_commande}</p>
        </div>
        <button onClick={() => navigate(`/commandes/${id}`)} className="btn-secondary flex items-center space-x-2">
          <X className="w-5 h-5" />
          <span>Annuler</span>
        </button>
      </div>

      {!peutModifierLignes && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg text-sm">
          Des réceptions ont déjà été enregistrées — les lignes de produits ne peuvent plus être modifiées.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infos de base */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Fournisseur *</label>
                  <select
                    value={selectedFournisseur}
                    onChange={(e) => setSelectedFournisseur(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Choisir un fournisseur</option>
                    {fournisseurs?.results?.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom} {f.entreprise && `(${f.entreprise})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date de livraison prévue</label>
                  <input
                    type="date"
                    value={dateLivraison}
                    onChange={(e) => setDateLivraison(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Recherche produits — seulement si pas de réception */}
            {peutModifierLignes && (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechercher un produit</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchProduit}
                      onChange={(e) => setSearchProduit(e.target.value)}
                      className="input pl-10"
                      placeholder="Nom, référence..."
                    />
                  </div>
                </div>

                <div className="card max-h-80 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits disponibles</h3>
                  {!produits?.results?.length ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p>Aucun produit trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {produits.results.map((produit) => (
                        <div
                          key={produit.id}
                          onClick={() => ajouterAuPanier(produit)}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{produit.nom}</p>
                            <p className="text-sm text-gray-600">{produit.reference} • Stock: {produit.stock_actuel}</p>
                          </div>
                          <p className="font-bold text-gray-900">
                            {parseFloat(produit.prix_achat || 0).toLocaleString()} FCFA
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Colonne droite — Panier */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Panier ({panier.length})</span>
                </h3>
              </div>

              {panier.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p>Panier vide</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {panier.map((item) => (
                    <div key={item.produit} className="p-3 border border-gray-200 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900 text-sm">{item.produit_info.nom}</p>
                        {peutModifierLignes && (
                          <button type="button" onClick={() => retirerDuPanier(item.produit)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {peutModifierLignes ? (
                          <>
                            <button type="button" onClick={() => modifierQuantite(item.produit, item.quantite - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200">
                              <Minus className="w-3 h-3" />
                            </button>
                            <input type="number" value={item.quantite}
                              onChange={(e) => modifierQuantite(item.produit, parseInt(e.target.value) || 0)}
                              className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-sm" min="0" />
                            <button type="button" onClick={() => modifierQuantite(item.produit, item.quantite + 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200">
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-600">Qté: {item.quantite}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Prix unitaire (FCFA)</label>
                        <input
                          type="number"
                          value={item.prix_unitaire}
                          onChange={(e) => modifierPrix(item.produit, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1"
                          disabled={!peutModifierLignes}
                          min="0"
                        />
                      </div>

                      <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                        <span className="text-gray-600">Sous-total</span>
                        <span className="font-semibold">{(item.quantite * item.prix_unitaire).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            {panier.length > 0 && (
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {montantTotal.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            )}

            <button type="submit" disabled={updateMutation.isPending} className="w-full btn-primary py-4 text-lg">
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ModifierCommande;