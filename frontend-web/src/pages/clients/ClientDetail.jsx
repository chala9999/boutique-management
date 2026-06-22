import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '../../api/clients';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  ShoppingBag,
  TrendingUp,
  Gift,
  Clock,
  Star,
  Crown,
  Trophy,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRecompenses, setShowRecompenses] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsAPI.getById(id),
  });

  const { data: historique } = useQuery({
    queryKey: ['client-achats', id],
    queryFn: () => clientsAPI.getHistoriqueAchats(id),
  });

  const { data: recompenses } = useQuery({
    queryKey: ['recompenses', client?.boutique],
    queryFn: () => clientsAPI.getRecompenses({ boutique: client?.boutique }),
    enabled: showRecompenses && !!client,
  });

  const echangerMutation = useMutation({
    mutationFn: ({ recompenseId }) => clientsAPI.echangerRecompense(id, recompenseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['client', id]);
      alert(data.message);
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de l\'échange');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Client non trouvé</h2>
        <button onClick={() => navigate('/clients')} className="btn-primary mt-4">
          Retour aux clients
        </button>
      </div>
    );
  }

  const niveau = client.niveau_info;
  const prochainNiveau = client.prochain_niveau_info;
  const pourcentageProgress = prochainNiveau 
    ? (client.points_fidelite / prochainNiveau.points_minimum) * 100
    : 100;

  const getCouleurNiveau = () => {
    if (!niveau) return 'bg-gray-500';
    switch (niveau.nom) {
      case 'Platine': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 'Or': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'Argent': return 'bg-gradient-to-r from-gray-300 to-gray-400';
      default: return 'bg-gradient-to-r from-amber-600 to-amber-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.nom_complet}</h1>
            <p className="text-gray-600 mt-1">Client depuis {format(new Date(client.created_at), 'MMMM yyyy', { locale: fr })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte fidélité */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-xl p-6 text-white ${getCouleurNiveau()} shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8" />
              <span className="text-sm opacity-80">Carte de fidélité</span>
            </div>
            <h3 className="text-2xl font-bold">{client.nom_complet}</h3>
            <div className="mt-4">
              <p className="text-sm opacity-80">Niveau</p>
              <p className="text-3xl font-bold">{niveau?.nom || 'Bronze'}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm opacity-80">Points fidélité</p>
              <p className="text-4xl font-bold">{client.points_fidelite}</p>
            </div>
            {prochainNiveau && (
              <div className="mt-4">
                <p className="text-sm opacity-80">Prochain niveau: {prochainNiveau.nom}</p>
                <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${pourcentageProgress}%` }}
                  />
                </div>
                <p className="text-xs opacity-80 mt-1">
                  Plus que {client.points_restants_prochain_niveau} points
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Total achats</span>
                </div>
                <span className="font-semibold">{client.nombre_achats || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Total dépensé</span>
                </div>
                <span className="font-semibold text-primary-600">
                  {client.total_achats?.toLocaleString() || 0} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Points cumulés</span>
                </div>
                <span className="font-semibold text-yellow-600">{client.points_fidelite}</span>
              </div>
            </div>
          </div>

          {/* Infos contact */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{client.telephone}</span>
              </div>
              {client.telephone2 && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{client.telephone2}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.adresse && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{client.adresse}{client.ville && `, ${client.ville}`}{client.pays && `, ${client.pays}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historique des achats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Historique des achats</h3>
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>
            {!historique?.length ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun achat effectué</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historique.slice(0, 10).map((achat) => (
                  <div
                    key={achat.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/ventes/${achat.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{achat.numero_vente}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(achat.date_vente), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">{achat.montant_final.toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500 capitalize">{achat.mode_paiement}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Programme de récompenses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Programme de récompenses</h3>
              <button
                onClick={() => setShowRecompenses(!showRecompenses)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {showRecompenses ? 'Masquer' : 'Voir les récompenses'}
              </button>
            </div>

            {showRecompenses && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {recompenses?.map((recompense) => (
                  <div key={recompense.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{recompense.nom}</h4>
                        <p className="text-sm text-gray-600 mt-1">{recompense.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600">
                            {recompense.points_requis} points
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => echangerMutation.mutate({ recompenseId: recompense.id })}
                        disabled={client.points_fidelite < recompense.points_requis || recompense.stock === 0}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          client.points_fidelite >= recompense.points_requis && recompense.stock > 0
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Échanger
                      </button>
                    </div>
                  </div>
                ))}
                {!recompenses?.length && (
                  <p className="text-gray-500 text-center py-4">Aucune récompense disponible</p>
                )}
              </div>
            )}

            {/* Points gagnés par tranche */}
            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Comment gagner des points ?</span>
              </div>
              <p className="text-sm text-gray-600">
                1 point par tranche de 1000 FCFA d'achat. Utilisez vos points pour obtenir des récompenses exclusives !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;