import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../api/dashboard';
import {
  TrendingUp, TrendingDown, ShoppingCart, Store, Package, Users,
  AlertTriangle, CreditCard, Wallet, Landmark, Smartphone,
  Award, Activity, Calendar, ChevronRight, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const [periode, setPeriode] = useState('30j');

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats-avance', periode],
    queryFn: () => dashboardAPI.getStatsAvance(periode),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = statsData?.stats_globales || {};
  const ventesParPaiement = statsData?.ventes_par_paiement || [];
  const topProduits = statsData?.top_produits || [];
  const boutiqueActive = statsData?.boutique_active;
  const activites = statsData?.activites_recentes || [];
  const ventesParJour = statsData?.ventes_par_jour || [];

  // Couleurs pour les graphiques
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
  
  const getPaiementIcon = (mode) => {
    switch(mode) {
      case 'cash': return <Landmark className="w-4 h-4" />;
      case 'mobile_money': return <Smartphone className="w-4 h-4" />;
      case 'carte': return <CreditCard className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const getPaiementLabel = (mode) => {
    switch(mode) {
      case 'cash': return 'Espèces';
      case 'mobile_money': return 'Mobile Money';
      case 'carte': return 'Carte bancaire';
      default: return mode;
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant || 0) + ' FCFA';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { value: 'aujourd_hui', label: 'Aujourd\'hui' },
              { value: '7j', label: '7 jours' },
              { value: '30j', label: '30 jours' },
              { value: 'mois', label: 'Ce mois' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriode(p.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  periode === p.value
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Carte CA */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatMontant(stats.chiffre_affaires)}
              </p>
              <div className="flex items-center mt-1">
                {stats.evolution_ca > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${stats.evolution_ca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(stats.evolution_ca)}%
                </span>
                <span className="text-xs text-gray-400 ml-1">vs période précédente</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Carte Ventes */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ventes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.nombre_ventes || 0}
              </p>
              <div className="flex items-center mt-1">
                {stats.evolution_ventes > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${stats.evolution_ventes > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(stats.evolution_ventes)}%
                </span>
                <span className="text-xs text-gray-400 ml-1">vs période précédente</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Carte Boutiques */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Boutiques</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.nombre_boutiques || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.nombre_produits || 0} produits au total
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Carte Stock faible */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stock faible</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.produits_stock_faible || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.nombre_clients || 0} clients fidèles
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique des ventes */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution des ventes
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{statsData?.date_debut} - {statsData?.date_fin}</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventesParJour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: fr })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => [formatMontant(value), 'Montant']}
                  labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: fr })}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par mode de paiement */}
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Modes de paiement
          </h3>
          {ventesParPaiement.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Aucune donnée
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ventesParPaiement}
                      dataKey="total"
                      nameKey="mode_paiement"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ mode_paiement, percent }) => `${getPaiementLabel(mode_paiement)} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ventesParPaiement.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMontant(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {ventesParPaiement.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-600">{getPaiementLabel(item.mode_paiement)}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatMontant(item.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top produits et boutique active */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produits */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top produits vendus
            </h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          {topProduits.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucune vente récente
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProduits} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="produit__nom" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'quantite') return [`${value} unités`, 'Quantité'];
                    return [formatMontant(value), 'Montant'];
                  }} />
                  <Legend />
                  <Bar dataKey="quantite" name="Quantité vendue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Boutique la plus active */}
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Boutique la plus active
          </h3>
          {boutiqueActive ? (
            <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">🏆 Meilleure performance</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {boutiqueActive.boutique__nom}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Ventes</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {boutiqueActive.total_ventes}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Chiffre d'affaires</p>
                      <p className="text-lg font-semibold text-primary-600">
                        {formatMontant(boutiqueActive.total_ca)}
                      </p>
                    </div>
                  </div>
                </div>
                <Store className="w-12 h-12 text-primary-200" />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Activités récentes */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Activités récentes
          </h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        {activites.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucune activité récente
          </div>
        ) : (
          <div className="space-y-3">
            {activites.map((activite, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Vente de {formatMontant(activite.montant)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activite.client} • {activite.boutique}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{activite.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;