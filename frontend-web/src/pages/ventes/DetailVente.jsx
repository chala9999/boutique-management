import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { usePermissions } from '../../hooks/usePermissions';
import {
  ArrowLeft, Printer, DollarSign, Package, User, Store,
  Calendar, CreditCard, AlertCircle, CheckCircle, XCircle, Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DetailVente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [paiementData, setPaiementData] = useState({
    montant: '',
    mode_paiement: 'especes',
    reference: '',
    notes: '',
  });

  const { data: vente, isLoading, refetch } = useQuery({
    queryKey: ['vente', id],
    queryFn: () => ventesAPI.getById(id),
  });

  const annulerMutation = useMutation({
    mutationFn: () => ventesAPI.annuler(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vente', id]);
      queryClient.invalidateQueries(['ventes']);
      refetch();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation');
    },
  });

  const paiementMutation = useMutation({
    mutationFn: (data) => ventesAPI.ajouterPaiement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vente', id]);
      queryClient.invalidateQueries(['ventes']);
      refetch();
      setShowPaiementForm(false);
      setPaiementData({ montant: '', mode_paiement: 'especes', reference: '', notes: '' });
      alert('Paiement ajouté avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de l\'ajout du paiement');
    },
  });

  const handleAnnuler = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette vente ?\nLe stock sera restauré.')) {
      annulerMutation.mutate();
    }
  };

  const handlePaiementSubmit = (e) => {
    e.preventDefault();
    if (!paiementData.montant || parseFloat(paiementData.montant) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (parseFloat(paiementData.montant) > parseFloat(vente.montant_restant)) {
      alert(`Le montant ne peut pas dépasser le restant dû (${parseFloat(vente.montant_restant).toLocaleString()} FCFA)`);
      return;
    }
    paiementMutation.mutate(paiementData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!vente) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Vente non trouvée</h2>
        <button onClick={() => navigate('/ventes')} className="btn-primary mt-4">Retour aux ventes</button>
      </div>
    );
  }

  const getStatutBadge = () => {
    if (vente.statut === 'annulee') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Annulée</span>;
    if (vente.statut_paiement === 'paye') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Payée</span>;
    if (vente.statut_paiement === 'partiel') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Paiement partiel</span>;
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Impayée</span>;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/ventes')} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vente {vente.numero_vente}</h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(vente.date_vente), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => window.print()} className="btn-secondary flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          {vente.statut !== 'annulee' && can.cancelVente && (
            <button onClick={handleAnnuler} disabled={annulerMutation.isPending} className="btn-danger flex items-center space-x-2">
              <XCircle className="w-4 h-4" />
              <span>{annulerMutation.isPending ? 'Annulation...' : 'Annuler'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-primary-600">{parseFloat(vente.montant_final).toLocaleString()} FCFA</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payé</p>
              <p className="text-2xl font-bold text-green-600">{parseFloat(vente.montant_paye).toLocaleString()} FCFA</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Restant</p>
              <p className="text-2xl font-bold text-orange-600">{parseFloat(vente.montant_restant).toLocaleString()} FCFA</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <div className="mt-1">{getStatutBadge()}</div>
            </div>
            <CreditCard className="w-8 h-8 text-gray-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Produits */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Produits vendus</h3>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qté</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Prix U.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vente.lignes?.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{ligne.produit_info?.nom}</p>
                        <p className="text-xs text-gray-500">{ligne.produit_info?.reference}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{ligne.quantite}</td>
                      <td className="px-4 py-3 text-right">{parseFloat(ligne.prix_unitaire).toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 text-right font-semibold">{parseFloat(ligne.sous_total).toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-semibold">Sous-total :</td>
                    <td className="px-4 py-3 text-right font-semibold">{parseFloat(vente.montant_total).toLocaleString()} FCFA</td>
                  </tr>
                  {parseFloat(vente.montant_remise) > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-red-600">Remise :</td>
                      <td className="px-4 py-3 text-right text-red-600">-{parseFloat(vente.montant_remise).toLocaleString()} FCFA</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-300">
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-lg">Total :</td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">{parseFloat(vente.montant_final).toLocaleString()} FCFA</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Historique paiements */}
          {vente.paiements?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des paiements</h3>
              <div className="space-y-2">
                {vente.paiements.map((paiement) => (
                  <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{parseFloat(paiement.montant).toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500 capitalize">{paiement.mode_paiement}{paiement.reference && ` • ${paiement.reference}`}</p>
                    </div>
                    <p className="text-sm text-gray-500">{format(new Date(paiement.date_paiement), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Informations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Boutique :</span>
                <span className="font-medium">{vente.boutique_nom}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Vendeur :</span>
                <span className="font-medium">{vente.vendeur_nom}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Client :</span>
                <span className="font-medium">{vente.client_info?.nom_complet || 'Client anonyme'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Mode paiement :</span>
                <span className="font-medium capitalize">{vente.mode_paiement}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Date :</span>
                <span className="font-medium">{format(new Date(vente.date_vente), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* ✅ Ajouter paiement — si vente non annulée et montant restant > 0 */}
          {can.ajouterPaiementVente && vente.statut !== 'annulee' && parseFloat(vente.montant_restant) > 0 && (
            <div className="card">
              <button
                onClick={() => setShowPaiementForm(!showPaiementForm)}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un paiement</span>
              </button>

              {showPaiementForm && (
                <form onSubmit={handlePaiementSubmit} className="mt-4 space-y-3">
                  {/* Récapitulatif */}
                  <div className="p-3 bg-orange-50 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Total :</span>
                      <span className="font-semibold">{parseFloat(vente.montant_final).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Déjà payé :</span>
                      <span className="font-semibold text-green-600">{parseFloat(vente.montant_paye).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between border-t border-orange-200 mt-2 pt-2">
                      <span className="text-orange-700 font-medium">Restant dû :</span>
                      <span className="font-bold text-red-600">{parseFloat(vente.montant_restant).toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Montant *</label>
                    <input
                      type="number"
                      value={paiementData.montant}
                      onChange={(e) => setPaiementData({ ...paiementData, montant: e.target.value })}
                      className="input"
                      min="0"
                      max={vente.montant_restant}
                      placeholder="0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPaiementData({ ...paiementData, montant: vente.montant_restant })}
                      className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                    >
                      Solder la totalité ({parseFloat(vente.montant_restant).toLocaleString()} FCFA)
                    </button>
                  </div>

                  <div>
                    <label className="label">Mode de paiement *</label>
                    <select
                      value={paiementData.mode_paiement}
                      onChange={(e) => setPaiementData({ ...paiementData, mode_paiement: e.target.value })}
                      className="input"
                    >
                      <option value="especes">Espèces</option>
                      <option value="carte">Carte Bancaire</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cheque">Chèque</option>
                      <option value="virement">Virement</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Référence (optionnel)</label>
                    <input
                      type="text"
                      value={paiementData.reference}
                      onChange={(e) => setPaiementData({ ...paiementData, reference: e.target.value })}
                      className="input"
                      placeholder="N° transaction..."
                    />
                  </div>

                  <div>
                    <label className="label">Notes (optionnel)</label>
                    <textarea
                      value={paiementData.notes}
                      onChange={(e) => setPaiementData({ ...paiementData, notes: e.target.value })}
                      className="input"
                      rows="2"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPaiementForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={paiementMutation.isPending}
                      className="flex-1 btn-primary"
                    >
                      {paiementMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {vente.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600">{vente.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailVente;