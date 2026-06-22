import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  DollarSign,
  Package,
  User,
  Store,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DetailVente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const handleAnnuler = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette vente ?\nLe stock sera restauré.')) {
      annulerMutation.mutate();
    }
  };

  const handleImprimer = () => {
    window.print();
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
        <button onClick={() => navigate('/ventes')} className="btn-primary mt-4">
          Retour aux ventes
        </button>
      </div>
    );
  }

  const getStatutBadge = () => {
    if (vente.statut === 'annulee') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Annulée</span>;
    }
    if (vente.statut_paiement === 'paye') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Payée</span>;
    }
    if (vente.statut_paiement === 'partiel') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Paiement partiel</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Impayée</span>;
  };

  return (
    <div className="space-y-6 print:space-y-2">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/ventes')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 print:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vente {vente.numero_vente}</h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(vente.date_vente), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 print:hidden">
          <button
            onClick={handleImprimer}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          {vente.statut !== 'annulee' && (
            <button
              onClick={handleAnnuler}
              disabled={annulerMutation.isPending}
              className="btn-danger flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>{annulerMutation.isPending ? 'Annulation...' : 'Annuler la vente'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-primary-600">
                {vente.montant_final.toLocaleString()} FCFA
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payé</p>
              <p className="text-2xl font-bold text-green-600">
                {vente.montant_paye.toLocaleString()} FCFA
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Restant</p>
              <p className="text-2xl font-bold text-orange-600">
                {vente.montant_restant.toLocaleString()} FCFA
              </p>
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
        {/* Infos vente */}
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
                        <div>
                          <p className="font-medium text-gray-900">{ligne.produit_info?.nom}</p>
                          <p className="text-xs text-gray-500">{ligne.produit_info?.reference}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{ligne.quantite}</td>
                      <td className="px-4 py-3 text-right">{ligne.prix_unitaire.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 text-right font-semibold">{ligne.sous_total.toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-semibold">Sous-total :</td>
                    <td className="px-4 py-3 text-right font-semibold">{vente.montant_total.toLocaleString()} FCFA</td>
                  </tr>
                  {vente.montant_remise > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-red-600">Remise :</td>
                      <td className="px-4 py-3 text-right text-red-600">-{vente.montant_remise.toLocaleString()} FCFA</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-300">
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-lg">Total :</td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">{vente.montant_final.toLocaleString()} FCFA</td>
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
                      <p className="font-medium text-gray-900">{paiement.montant.toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500">{paiement.mode_paiement}</p>
                    </div>
                    <p className="text-sm text-gray-500">{format(new Date(paiement.date_paiement), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informations complémentaires */}
        <div className="space-y-6">
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
                <span className="text-gray-600">Mode de paiement :</span>
                <span className="font-medium capitalize">{vente.mode_paiement}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Date :</span>
                <span className="font-medium">{format(new Date(vente.date_vente), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </div>

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