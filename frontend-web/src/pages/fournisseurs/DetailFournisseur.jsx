import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fournisseursAPI, commandesAPI } from '../../api/fournisseurs';
import { usePermissions } from '../../hooks/usePermissions';
import {
  ArrowLeft,
  Truck,
  Phone,
  Mail,
  MapPin,
  Building2,
  Banknote,
  Package,
  ShoppingBag,
  AlertCircle,
  Calendar,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DetailFournisseur = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCommandes, setShowCommandes] = useState(true);
  const { can } = usePermissions();

  const { data: fournisseur, isLoading } = useQuery({
    queryKey: ['fournisseur', id],
    queryFn: () => fournisseursAPI.getById(id),
  });

  const { data: stats } = useQuery({
    queryKey: ['fournisseur-stats', id],
    queryFn: () => fournisseursAPI.getStatistiques(id),
    enabled: !!id,
  });

  const { data: commandes } = useQuery({
    queryKey: ['fournisseur-commandes', id],
    queryFn: () => fournisseursAPI.getCommandes(id),
    enabled: !!id && showCommandes,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!fournisseur) {
    return (
      <div className="text-center py-12">
        <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Fournisseur non trouvé</h2>
        <button onClick={() => navigate('/fournisseurs')} className="btn-primary mt-4">
          Retour aux fournisseurs
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
      en_cours: 'En cours',
      livree: 'Livrée',
      annulee: 'Annulée',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/fournisseurs')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{fournisseur.nom}</h1>
            {fournisseur.entreprise && (
              <p className="text-gray-600 mt-1">{fournisseur.entreprise}</p>
            )}
          </div>
        </div>
        {/* ✅ Vendeur et admin peuvent créer une commande */}
        {can.createCommande && (
          <button
            onClick={() => navigate(`/commandes/nouvelle?fournisseur=${id}`)}
            className="btn-primary flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Nouvelle commande</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos fournisseur */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{fournisseur.telephone}</span>
              </div>
              {fournisseur.telephone2 && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{fournisseur.telephone2}</span>
                </div>
              )}
              {fournisseur.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{fournisseur.email}</span>
                </div>
              )}
              {fournisseur.adresse && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>
                    {fournisseur.adresse}
                    {fournisseur.ville && `, ${fournisseur.ville}`}
                    {fournisseur.pays && `, ${fournisseur.pays}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations bancaires</h3>
            <div className="space-y-3">
              {fournisseur.numero_compte && (
                <div className="flex items-center space-x-2">
                  <Banknote className="w-4 h-4 text-gray-400" />
                  <span>Compte: {fournisseur.numero_compte}</span>
                </div>
              )}
              {fournisseur.banque && (
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>Banque: {fournisseur.banque}</span>
                </div>
              )}
              {!fournisseur.numero_compte && !fournisseur.banque && (
                <p className="text-gray-500 text-sm">Aucune information bancaire</p>
              )}
            </div>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre commandes</span>
                  <span className="font-semibold">{stats.nombre_commandes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total dépensé</span>
                  <span className="font-semibold text-primary-600">
                    {stats.total_commandes?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commandes en cours</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.commandes_en_cours || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commandes livrées</span>
                  <span className="font-semibold text-green-600">
                    {stats.commandes_livrees || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant impayé</span>
                  <span className="font-semibold text-red-600">
                    {stats.montant_impaye?.toLocaleString() || 0} FCFA
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {fournisseur.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600 text-sm">{fournisseur.notes}</p>
            </div>
          )}
        </div>

        {/* Commandes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Historique des commandes
              </h3>
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>

            {!commandes?.length ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune commande passée à ce fournisseur</p>
              {/* ✅ Vendeur et admin */}
              {can.createCommande && (
                <button
                  onClick={() => navigate(`/commandes/nouvelle?fournisseur=${id}`)}
                  className="btn-primary mt-4 inline-flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Passer une commande</span>
                </button>
              )}
            </div>
            ) : (
              <div className="space-y-3">
                {commandes.map((commande) => (
                  <div
                    key={commande.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/commandes/${commande.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-medium text-gray-900">
                          {commande.numero_commande}
                        </p>
                        {getStatutBadge(commande.statut)}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(commande.date_commande), 'dd/MM/yyyy')}</span>
                        </span>
                        <span>Montant: {commande.montant_total.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailFournisseur;