import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../api/reports';
import { boutiquesAPI } from '../../api/boutiques';
import { usePermissions } from '../../hooks/usePermissions';

import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Trophy,
  Medal,
  Award,
  Filter,
  RefreshCw,
  Crown,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#6366F1'];

const VendeursReport = () => {
  const { isComptable } = usePermissions();
  const [filters, setFilters] = useState({
    periode: 'mois',
    boutique: '',
  });
  const handleExportExcel = async () => {
  try {
    const blob = await reportsAPI.exportVendeursExcel(filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_vendeurs_${filters.periode}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur export:', error);
    alert('Erreur lors de l\'export');
  }
};

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
    enabled: !isComptable,
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['rapport-vendeurs', filters],
    queryFn: () => reportsAPI.getVendeursReport(filters),
  });

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant || 0) + ' FCFA';
  };

  const getMedalIcon = (index) => {
    switch(index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <Award className="w-5 h-5 text-blue-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const performance = report?.performance || [];
  const meilleurVendeur = report?.meilleur_vendeur;

  return (
    <div className="space-y-6">
      {/* Filtres */}
       <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Performance des vendeurs</h2>
        <button
          onClick={handleExportExcel}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Exporter Excel</span>
        </button>
      </div>
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Période</label>
            <select
              value={filters.periode}
              onChange={(e) => setFilters({ ...filters, periode: e.target.value })}
              className="input"
            >
              <option value="30j">30 derniers jours</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
              <option value="annee">Cette année</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">Boutique</label>
            <select
              value={filters.boutique}
              onChange={(e) => setFilters({ ...filters, boutique: e.target.value })}
              className="input"
            >
              <option value="">Toutes les boutiques</option>
              {boutiques?.results?.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => refetch()}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Période du <span className="font-medium">{report?.date_debut}</span> à aujourd'hui
        </div>
      </div>

      {/* Meilleur vendeur */}
      {meilleurVendeur && (
        <div className="card bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-700">Meilleur vendeur de la période</p>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {meilleurVendeur.vendeur_nom}
              </h3>
              <div className="flex flex-wrap gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500">Chiffre d'affaires</p>
                  <p className="text-lg font-bold text-primary-600">
                    {formatMontant(meilleurVendeur.chiffre_affaires)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ventes réalisées</p>
                  <p className="text-lg font-bold text-gray-900">
                    {meilleurVendeur.total_ventes}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vente moyenne</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatMontant(meilleurVendeur.vente_moyenne)}
                  </p>
                </div>
              </div>
            </div>
            <Crown className="w-16 h-16 text-yellow-400 opacity-50" />
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{performance.length}</p>
          <p className="text-xs text-gray-500">Vendeurs actifs</p>
        </div>
        <div className="card p-4 text-center">
          <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{formatMontant(report?.total_chiffre)}</p>
          <p className="text-xs text-gray-500">CA total</p>
        </div>
        <div className="card p-4 text-center">
          <ShoppingCart className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{report?.total_ventes || 0}</p>
          <p className="text-xs text-gray-500">Ventes totales</p>
        </div>
      </div>

      {/* Classement des vendeurs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Classement des vendeurs
          </h3>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Vendeur</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Ventes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">CA</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Vente moyenne</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Bénéfice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {performance.map((vendeur, index) => (
                <tr key={vendeur.vendeur_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      {getMedalIcon(index)}
                      <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{vendeur.vendeur_nom}</p>
                      <p className="text-xs text-gray-500">@{vendeur.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-gray-900">{vendeur.total_ventes}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-primary-600">{formatMontant(vendeur.chiffre_affaires)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatMontant(vendeur.vente_moyenne)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatMontant(vendeur.benefice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique CA par vendeur */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Chiffre d'affaires par vendeur
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vendeur_nom" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'chiffre_affaires') return [formatMontant(value), 'CA'];
                  if (name === 'benefice') return [formatMontant(value), 'Bénéfice'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="chiffre_affaires" name="CA" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="benefice" name="Bénéfice" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition des ventes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition des ventes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performance}
                  dataKey="total_ventes"
                  nameKey="vendeur_nom"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ vendeur_nom, percent }) => `${vendeur_nom} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {performance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} ventes`, 'Nombre']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition du CA
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performance}
                  dataKey="chiffre_affaires"
                  nameKey="vendeur_nom"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ vendeur_nom, percent }) => `${vendeur_nom} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {performance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMontant(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendeursReport;