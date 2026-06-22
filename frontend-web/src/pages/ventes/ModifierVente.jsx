import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { clientsAPI } from '../../api/clients';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Package } from 'lucide-react';

const ModifierVente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedClient, setSelectedClient] = useState('');
  const [searchProduit, setSearchProduit] = useState('');
  const [panier, setPanier] = useState([]);
  const [remiseType, setRemiseType] = useState('pourcentage');
  const [remiseValeur, setRemiseValeur] = useState(0);
  const [modePaiement, setModePaiement] = useState('especes');
  const [montantPaye, setMontantPaye] = useState('');
  const [notes, setNotes] = useState('');

  // Charger la vente existante
  const { data: vente, isLoading } = useQuery({
    queryKey: ['vente', id],
    queryFn: () => ventesAPI.getById(id),
  });

  // Pré-remplir le formulaire
  useEffect(() => {
    if (vente) {
      setSelectedClient(vente.client || '');
      setRemiseType(vente.remise_type || 'pourcentage');
      setRemiseValeur(vente.remise_valeur || 0);
      setModePaiement(vente.mode_paiement || 'especes');
      setMontantPaye(vente.montant_paye || '');
      setNotes(vente.notes || '');

      // Reconstruire le panier depuis les lignes
      if (vente.lignes) {
        setPanier(
          vente.lignes.map((ligne) => ({
            produit: ligne.produit,
            produit_info: {
              nom: ligne.produit_nom,
              prix_vente: ligne.prix_unitaire,
              prix_achat: ligne.prix_achat_unitaire,
              stock_actuel: ligne.stock_actuel || 999,
              reference: ligne.produit_reference || '',
            },
            quantite: parseFloat(ligne.quantite),
            prix_unitaire: parseFloat(ligne.prix_unitaire),
            remise_pourcentage: parseFloat(ligne.remise_pourcentage || 0),
          }))
        );
      }
    }
  }, [vente]);

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  const { data: produits } = useQuery({
    queryKey: ['produits', vente?.boutique, searchProduit],
    queryFn: () => produitsAPI.getAll({ boutique: vente?.boutique, search: searchProduit, actifs: true }),
    enabled: !!vente?.boutique,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', vente?.boutique],
    queryFn: () => clientsAPI.getAll({ boutique: vente?.boutique }),
    enabled: !!vente?.boutique,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => ventesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ventes']);
      queryClient.invalidateQueries(['produits']);
      alert('Vente modifiée avec succès !');
      navigate(`/ventes/${id}`);
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
        prix_unitaire: produit.prix_vente,
        remise_pourcentage: 0,
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

  const retirerDuPanier = (produitId) => {
    setPanier(panier.filter((item) => item.produit !== produitId));
  };

  const calculerSousTotal = (item) => item.quantite * item.prix_unitaire;

  const montantTotal = panier.reduce((acc, item) => acc + calculerSousTotal(item), 0);
  const montantRemise = remiseType === 'pourcentage'
    ? (montantTotal * remiseValeur) / 100
    : parseFloat(remiseValeur) || 0;
  const montantFinal = montantTotal - montantRemise;
  const montantRendu = Math.max(0, parseFloat(montantPaye) - montantFinal);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }

    updateMutation.mutate({
      client: selectedClient ? parseInt(selectedClient) : null,
      mode_paiement: modePaiement,
      remise_type: remiseType,
      remise_valeur: parseFloat(remiseValeur) || 0,
      montant_paye: parseFloat(montantPaye) || 0,
      notes,
      lignes: panier.map((item) => ({
        produit: item.produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        remise_pourcentage: item.remise_pourcentage,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (vente?.statut === 'annulee') {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 font-medium">Cette vente est annulée et ne peut pas être modifiée.</p>
        <button onClick={() => navigate('/ventes')} className="btn-secondary mt-4">Retour</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier la vente</h1>
          <p className="text-gray-600 mt-1">#{vente?.numero_vente}</p>
        </div>
        <button onClick={() => navigate(`/ventes/${id}`)} className="btn-secondary flex items-center space-x-2">
          <X className="w-5 h-5" />
          <span>Annuler</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recherche produit */}
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

            {/* Liste produits */}
            <div className="card max-h-96 overflow-y-auto">
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
                      <div className="flex items-center space-x-3">
                        {produit.image_principale ? (
                          <img src={produit.image_principale} alt={produit.nom} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{produit.nom}</p>
                          <p className="text-sm text-gray-600">{produit.reference} • Stock: {produit.stock_actuel}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900">{parseFloat(produit.prix_vente).toLocaleString()} FCFA</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Client */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client</h3>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="input">
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
              </div>
              {panier.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p>Panier vide</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {panier.map((item) => (
                    <div key={item.produit} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900 text-sm">{item.produit_info.nom}</p>
                        <button type="button" onClick={() => retirerDuPanier(item.produit)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button type="button" onClick={() => modifierQuantite(item.produit, item.quantite - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200">
                            <Minus className="w-4 h-4" />
                          </button>
                          <input type="number" value={item.quantite}
                            onChange={(e) => modifierQuantite(item.produit, parseInt(e.target.value) || 0)}
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1" min="0" />
                          <button type="button" onClick={() => modifierQuantite(item.produit, item.quantite + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-semibold text-gray-900">{calculerSousTotal(item).toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remise */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Remise</h3>
              <div className="flex space-x-2">
                <select value={remiseType} onChange={(e) => setRemiseType(e.target.value)} className="input flex-1">
                  <option value="pourcentage">%</option>
                  <option value="montant">FCFA</option>
                </select>
                <input type="number" value={remiseValeur} onChange={(e) => setRemiseValeur(e.target.value)}
                  className="input flex-1" min="0" placeholder="0" />
              </div>
            </div>

            {/* Paiement */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mode de paiement</h3>
              <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} className="input mb-4">
                <option value="especes">Espèces</option>
                <option value="carte">Carte Bancaire</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
                <option value="credit">Crédit</option>
              </select>
              <div>
                <label className="label">Montant payé</label>
                <input type="number" value={montantPaye} onChange={(e) => setMontantPaye(e.target.value)}
                  className="input" min="0" placeholder="0" />
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows="2" />
            </div>

            {/* Totaux */}
            {panier.length > 0 && (
              <div className="card bg-primary-50 border-primary-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{montantTotal.toLocaleString()} FCFA</span>
                  </div>
                  {montantRemise > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remise</span>
                      <span className="font-medium text-red-600">-{montantRemise.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="border-t border-primary-200 pt-2 flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary-600">{montantFinal.toLocaleString()} FCFA</span>
                  </div>
                  {montantPaye > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monnaie à rendre</span>
                      <span className="font-medium">{montantRendu.toLocaleString()} FCFA</span>
                    </div>
                  )}
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

export default ModifierVente;