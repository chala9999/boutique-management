import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import { usePermissions } from '../../hooks/usePermissions';

import {
  ArrowLeft,
  Truck,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  DollarSign,
  Eye,
  Printer,
  RefreshCw,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DetailCommande = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [showReceptionForm, setShowReceptionForm] = useState(false);
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState('virement');
  const [receptionData, setReceptionData] = useState({});
  const { can } = usePermissions();

  const { data: commande, isLoading, refetch } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => commandesAPI.getById(id),
  });

  const changerStatutMutation = useMutation({
    mutationFn: (statut) => commandesAPI.changerStatut(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', id]);
      queryClient.invalidateQueries(['commandes']);
      refetch();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors du changement de statut');
    },
  });

  const annulerMutation = useMutation({
    mutationFn: () => commandesAPI.annuler(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', id]);
      queryClient.invalidateQueries(['commandes']);
      refetch();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation');
    },
  });

  const ajouterPaiementMutation = useMutation({
    mutationFn: (data) => commandesAPI.ajouterPaiement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', id]);
      setShowPaiementForm(false);
      setPaiementMontant('');
      refetch();
      alert('Paiement ajouté avec succès');
    },
    onError: (error) => {
      console.log('ERREUR PAIEMENT:', error.response?.data);
      alert(error.response?.data?.error || 'Erreur lors de l\'ajout du paiement');
    },
  });

  const recevoirCommandeMutation = useMutation({
    mutationFn: (data) => commandesAPI.recevoir(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commande', id]);
      setShowReceptionForm(false);
      setReceptionData({});
      refetch();
      alert('Réception enregistrée avec succès');
    },
    onError: (error) => {
      console.log('ERREUR RECEPTION:', error.response?.data);
      alert(error.response?.data?.error || 'Erreur lors de la réception');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Commande non trouvée</h2>
        <button onClick={() => navigate('/commandes')} className="btn-primary mt-4">
          Retour aux commandes
        </button>
      </div>
    );
  }

  const getStatutBadge = (statut) => {
    const styles = {
      en_attente: 'bg-yellow-100 text-yellow-700',
      confirmee: 'bg-blue-100 text-blue-700',
      en_cours: 'bg-purple-100 text-purple-700',
      livree: 'bg-green-100 text-green-700',
      annulee: 'bg-red-100 text-red-700',
    };
    const labels = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      en_cours: 'En cours de livraison',
      livree: 'Livrée',
      annulee: 'Annulée',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}>
        {labels[statut]}
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
      partiel: 'Paiement partiel',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  const handleChangerStatut = (statut) => {
    if (window.confirm(`Passer la commande en statut "${statut}" ?`)) {
      changerStatutMutation.mutate(statut);
    }
  };

  const handleAnnuler = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      annulerMutation.mutate();
    }
  };

  const handleAjouterPaiement = (e) => {
    e.preventDefault();
    if (!paiementMontant || parseFloat(paiementMontant) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (parseFloat(paiementMontant) > commande.montant_restant) {
      alert(`Le montant ne peut pas dépasser le restant dû (${commande.montant_restant.toLocaleString()} FCFA)`);
      return;
    }
    ajouterPaiementMutation.mutate({
      montant: parseFloat(paiementMontant),
      mode_paiement: paiementMode,
      commande: commande.id,
    });
  };

  const handleRecevoirCommande = (e) => {
    e.preventDefault();
    const lignes = commande.lignes.map(ligne => ({
      ligne_commande: ligne.id,
      quantite_recue: receptionData[ligne.id] || 0,
    })).filter(l => l.quantite_recue > 0);
    
    if (lignes.length === 0) {
      alert('Veuillez indiquer les quantités reçues');
      return;
    }
    
    recevoirCommandeMutation.mutate({ lignes });
  };

  const updateReceptionQuantite = (ligneId, quantite) => {
    setReceptionData(prev => ({
      ...prev,
      [ligneId]: parseFloat(quantite) || 0
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/commandes')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{commande.numero_commande}</h1>
              {getStatutBadge(commande.statut)}
            </div>
            <p className="text-gray-600 mt-1">
              Fournisseur: {commande.fournisseur_info?.nom}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer</span>
        </button>
          {can.editCommande && commande.statut !== 'annulee' && commande.statut !== 'livree' && (
            <button
              onClick={() => navigate(`/commandes/${id}/modifier`)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          )}
          {can.cancelCommande && commande.statut !== 'annulee' && commande.statut !== 'livree' && (
            <button
              onClick={() => handleChangerStatut('confirmee')}
              className="btn-secondary flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmer</span>
            </button>
          )}

          {/* Annuler — admin seulement */}
          {can.cancelCommande && commande.statut !== 'annulee' && commande.statut !== 'livree' && (
            <button
              onClick={handleAnnuler}
              className="btn-danger flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total commande</p>
              <p className="text-2xl font-bold text-primary-600">
                {commande.montant_total.toLocaleString()} FCFA
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Déjà payé</p>
              <p className="text-2xl font-bold text-green-600">
                {commande.montant_paye.toLocaleString()} FCFA
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Restant à payer</p>
              <p className="text-2xl font-bold text-orange-600">
                {commande.montant_restant.toLocaleString()} FCFA
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut paiement</p>
              <div className="mt-1">{getPaiementBadge(commande.statut_paiement)}</div>
            </div>
            <CreditCard className="w-8 h-8 text-gray-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Produits commandés */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Produits commandés</h3>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qté cmd</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qté reçue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Prix U.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commande.lignes?.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{ligne.produit_info?.nom}</p>
                          <p className="text-xs text-gray-500">{ligne.produit_info?.reference}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{ligne.quantite_commandee}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={ligne.quantite_recue === ligne.quantite_commandee ? 'text-green-600' : 'text-orange-600'}>
                          {ligne.quantite_recue}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{ligne.prix_unitaire.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 text-right font-semibold">{ligne.sous_total.toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="border-t border-gray-300">
                    <td colSpan="4" className="px-4 py-3 text-right font-bold text-lg">Total :</td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">
                      {commande.montant_total.toLocaleString()} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Historique paiements */}
          {commande.paiements?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des paiements</h3>
              <div className="space-y-2">
                {commande.paiements.map((paiement) => (
                  <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{paiement.montant.toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500 capitalize">{paiement.mode_paiement}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(paiement.date_paiement), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions et infos */}
        <div className="space-y-6">
          {/* Informations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Fournisseur :</span>
                <span className="font-medium">{commande.fournisseur_info?.nom}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Date commande :</span>
                <span className="font-medium">
                  {format(new Date(commande.date_commande), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              {commande.date_livraison_prevue && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Livraison prévue :</span>
                  <span className="font-medium">
                    {format(new Date(commande.date_livraison_prevue), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              {commande.date_livraison_reelle && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Livrée le :</span>
                  <span className="font-medium">
                    {format(new Date(commande.date_livraison_reelle), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Créé par :</span>
                <span className="font-medium">{commande.created_by_nom}</span>
              </div>
            </div>
          </div>

          {/* Ajouter paiement */}
          {commande.statut !== 'annulee' && commande.montant_restant > 0 && (
            <div className="card">
              <button
                onClick={() => setShowPaiementForm(!showPaiementForm)}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Ajouter un paiement</span>
              </button>
              
              {showPaiementForm && (
                <form onSubmit={handleAjouterPaiement} className="mt-4 space-y-3">
                  <div>
                    <label className="label">Montant</label>
                    <input
                      type="number"
                      value={paiementMontant}
                      onChange={(e) => setPaiementMontant(e.target.value)}
                      className="input"
                      placeholder="Montant à payer"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Mode de paiement</label>
                    <select
                      value={paiementMode}
                      onChange={(e) => setPaiementMode(e.target.value)}
                      className="input"
                    >
                      <option value="especes">Espèces</option>
                      <option value="carte">Carte bancaire</option>
                      <option value="virement">Virement</option>
                      <option value="cheque">Chèque</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={ajouterPaiementMutation.isPending}
                    className="w-full btn-primary"
                  >
                    {ajouterPaiementMutation.isPending ? 'Traitement...' : 'Enregistrer le paiement'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Réception commande */}
          {commande.statut !== 'annulee' && commande.statut !== 'livree' && (
            <div className="card">
              <button
                onClick={() => setShowReceptionForm(!showReceptionForm)}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>Recevoir la livraison</span>
              </button>
              
              {showReceptionForm && (
                <form onSubmit={handleRecevoirCommande} className="mt-4 space-y-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {commande.lignes?.map((ligne) => (
                      <div key={ligne.id} className="p-2 border border-gray-200 rounded-lg">
                        <p className="text-sm font-medium">{ligne.produit_info?.nom}</p>
                        <p className="text-xs text-gray-500">Commandé: {ligne.quantite_commandee}</p>
                        <p className="text-xs text-gray-500">Déjà reçu: {ligne.quantite_recue}</p>
                        <div className="mt-2">
                          <label className="text-xs text-gray-600">Quantité reçue</label>
                          <input
                            type="number"
                            value={receptionData[ligne.id] || 0}
                            onChange={(e) => updateReceptionQuantite(ligne.id, e.target.value)}
                            className="input text-sm w-full"
                            min="0"
                            max={ligne.quantite_commandee - ligne.quantite_recue}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={recevoirCommandeMutation.isPending}
                    className="w-full btn-primary"
                  >
                    {recevoirCommandeMutation.isPending ? 'Traitement...' : 'Valider la réception'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Notes */}
          {commande.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600 text-sm">{commande.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailCommande;