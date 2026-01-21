import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import RecevoirCommandeModal from '../../components/commandes/RecevoirCommandeModal';
import AjouterPaiementModal from '../../components/commandes/AjouterPaiementModal';
import ChangerStatutModal from '../../components/commandes/ChangerStatutModal';

const DetailCommande = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRecevoirModalOpen, setIsRecevoirModalOpen] = useState(false);
  const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false);
  const [isStatutModalOpen, setIsStatutModalOpen] = useState(false);

  // Récupérer les détails de la commande
  const { data: commande, isLoading } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => commandesAPI.getById(id),
  });

  // Annuler la commande
  const annulerMutation = useMutation({
    mutationFn: () => commandesAPI.annuler(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', id]);
      queryClient.invalidateQueries(['commandes']);
      alert('Commande annulée avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation');
    },
  });

  const handleAnnuler = () => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.'
      )
    ) {
      annulerMutation.mutate();
    }
  };

  const getStatutBadge = (statut) => {
    const styles = {
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
      confirmee: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      en_cours: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Truck },
      livree: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      annulee: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    };
    const labels = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      en_cours: 'En cours',
      livree: 'Livrée',
      annulee: 'Annulée',
    };
    const config = styles[statut];
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        <span>{labels[statut]}</span>
      </span>
    );
  };

  const getPaiementBadge = (statut) => {
    const styles = {
      paye: 'bg-green-100 text-green-700',
      impaye: 'bg-red-100 text-red-700',
      partiel: 'bg-orange-100 text-orange-700',
    };
    const labels = {
      paye: 'Payé',
      impaye: 'Impayé',
      partiel: 'Partiel',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="card text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Commande introuvable
        </h3>
        <button
          onClick={() => navigate('/commandes')}
          className="btn-primary mt-4"
        >
          Retour aux commandes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/commandes')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Commande {commande.numero_commande}
            </h1>
            <p className="text-gray-600 mt-1">
              Créée le{' '}
              {format(new Date(commande.date_commande), 'dd MMMM yyyy à HH:mm', {
                locale: fr,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {commande.statut !== 'annulee' && commande.statut !== 'livree' && (
            <>
              <button
                onClick={() => setIsStatutModalOpen(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Changer statut</span>
              </button>
              <button
                onClick={() => setIsRecevoirModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Package className="w-5 h-5" />
                <span>Recevoir livraison</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statuts */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Statut commande</p>
              {getStatutBadge(commande.statut)}
            </div>
            <div className="border-l border-gray-300 h-12"></div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Statut paiement</p>
              {getPaiementBadge(commande.statut_paiement)}
            </div>
          </div>

          {commande.statut !== 'annulee' && (
            <button
              onClick={handleAnnuler}
              disabled={annulerMutation.isPending}
              className="btn-danger"
            >
              {annulerMutation.isPending ? 'Annulation...' : 'Annuler la commande'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informations générales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fournisseur</p>
                <p className="font-medium text-gray-900">
                  {commande.fournisseur_info?.nom}
                </p>
                {commande.fournisseur_info?.entreprise && (
                  <p className="text-sm text-gray-600">
                    {commande.fournisseur_info.entreprise}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Boutique</p>
                <p className="font-medium text-gray-900">{commande.boutique_nom}</p>
              </div>
              {commande.date_livraison_prevue && (
                <div>
                  <p className="text-sm text-gray-600">Livraison prévue</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(commande.date_livraison_prevue), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </p>
                </div>
              )}
              {commande.date_livraison_reelle && (
                <div>
                  <p className="text-sm text-gray-600">Livraison effectuée</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(commande.date_livraison_reelle), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </p>
                </div>
              )}
            </div>
            {commande.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-gray-900">{commande.notes}</p>
              </div>
            )}
          </div>

          {/* Produits commandés */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Produits commandés
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qté commandée
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qté reçue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Restante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sous-total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commande.lignes?.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {ligne.produit_info?.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            {ligne.produit_info?.reference}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {ligne.prix_unitaire?.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {ligne.quantite_commandee}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            ligne.quantite_recue >= ligne.quantite_commandee
                              ? 'text-green-600'
                              : ligne.quantite_recue > 0
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {ligne.quantite_recue}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {ligne.quantite_restante}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {ligne.sous_total?.toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Réceptions */}
          {commande.receptions && commande.receptions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Historique des réceptions
              </h3>
              <div className="space-y-3">
                {commande.receptions.map((reception) => (
                  <div
                    key={reception.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          Reçu le{' '}
                          {format(
                            new Date(reception.date_reception),
                            'dd MMMM yyyy à HH:mm',
                            { locale: fr }
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          Par {reception.received_by_nom}
                        </p>
                      </div>
                      {reception.numero_bon_livraison && (
                        <span className="text-sm text-gray-600">
                          BL: {reception.numero_bon_livraison}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {reception.lignes?.map((ligne, index) => (
                        <p key={index} className="text-sm text-gray-700">
                          • {ligne.produit_nom} : {ligne.quantite_recue} unités
                        </p>
                      ))}
                    </div>
                    {reception.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        {reception.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite - Résumé */}
        <div className="space-y-6">
          {/* Résumé financier */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résumé financier
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant total</span>
                <span className="font-medium text-gray-900">
                  {commande.montant_total?.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant payé</span>
                <span className="font-medium text-green-600">
                  {commande.montant_paye?.toLocaleString()} FCFA
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Restant à payer</span>
                  <span className="text-xl font-bold text-red-600">
                    {commande.montant_restant?.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
            {commande.statut_paiement !== 'paye' && commande.statut !== 'annulee' && (
              <button
                onClick={() => setIsPaiementModalOpen(true)}
                className="w-full btn-primary mt-4"
              >
                <DollarSign className="w-5 h-5 inline mr-2" />
                Ajouter un paiement
              </button>
            )}
          </div>

          {/* Historique des paiements */}
          {commande.paiements && commande.paiements.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Historique des paiements
              </h3>
              <div className="space-y-2">
                {commande.paiements.map((paiement) => (
                  <div
                    key={paiement.id}
                    className="p-3 bg-gray-50 rounded-lg flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {paiement.montant?.toLocaleString()} FCFA
                      </p>
                      <p className="text-sm text-gray-600">
                        {paiement.mode_paiement === 'especes' && 'Espèces'}
                        {paiement.mode_paiement === 'carte' && 'Carte'}
                        {paiement.mode_paiement === 'mobile_money' && 'Mobile Money'}
                        {paiement.mode_paiement === 'cheque' && 'Chèque'}
                        {paiement.mode_paiement === 'virement' && 'Virement'}
                      </p>
                      {paiement.reference && (
                        <p className="text-xs text-gray-500">
                          Réf: {paiement.reference}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(
                        new Date(paiement.date_paiement),
                        'dd/MM/yyyy',
                        { locale: fr }
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isRecevoirModalOpen && (
        <RecevoirCommandeModal
          commande={commande}
          onClose={() => setIsRecevoirModalOpen(false)}
        />
      )}
      {isPaiementModalOpen && (
        <AjouterPaiementModal
          commande={commande}
          onClose={() => setIsPaiementModalOpen(false)}
        />
      )}
      {isStatutModalOpen && (
        <ChangerStatutModal
          commande={commande}
          onClose={() => setIsStatutModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DetailCommande;