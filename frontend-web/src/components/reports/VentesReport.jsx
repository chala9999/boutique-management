import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../api/reports';
import { boutiquesAPI } from '../../api/boutiques';
import { usePermissions } from '../../hooks/usePermissions';

import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const VentesReport = () => {
  const { isComptable } = usePermissions();
  const [filters, setFilters] = useState({
    periode: 'mois',
    date_debut: '',
    date_fin: '',
    boutique: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
    enabled: !isComptable,
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['rapport-ventes', filters],
    queryFn: () => reportsAPI.getVentesReport(filters),
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    refetch();
  };
  const handleExportExcel = async () => {
  try {
    const blob = await reportsAPI.exportVentesExcel(filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_ventes_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur export:', error);
    alert('Erreur lors de l\'export');
  }
};
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant || 0) + ' FCFA';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Rapport des ventes</h2>
        <button
          onClick={handleExportExcel}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Exporter Excel</span>
        </button>
      </div>
      {/* Filtres */}
      <div className="card">
    
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
        </button>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label">Période</label>
              <select
                name="periode"
                value={filters.periode}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="jour">Aujourd'hui</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
                <option value="annee">Cette année</option>
                <option value="personnalise">Personnalisée</option>
              </select>
            </div>

            {filters.periode === 'personnalise' && (
              <>
                <div>
                  <label className="label">Date début</label>
                  <input
                    type="date"
                    name="date_debut"
                    value={filters.date_debut}
                    onChange={handleFilterChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Date fin</label>
                  <input
                    type="date"
                    name="date_fin"
                    value={filters.date_fin}
                    onChange={handleFilterChange}
                    className="input"
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Boutique</label>
              <select
                name="boutique"
                value={filters.boutique}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">Toutes les boutiques</option>
                {boutiques?.results?.map((b) => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Appliquer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatMontant(report?.recap?.chiffre_affaires)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nombre de ventes</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.recap?.total_ventes || 0}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bénéfice total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatMontant(report?.recap?.benefice_total)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vente moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMontant(report?.recap?.vente_moyenne)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Période */}
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        Période du <span className="font-medium">{report?.periode?.debut}</span> au{' '}
        <span className="font-medium">{report?.periode?.fin}</span>
      </div>

      {/* Graphique des ventes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Évolution des ventes
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report?.ventes_par_jour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatMontant(value), 'Montant']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Chiffre d'affaires"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produits */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 produits les plus vendus
          </h3>
          <div className="space-y-3">
            {report?.top_produits?.map((produit, index) => (
              <div key={produit.produit__id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{produit.produit__nom}</p>
                    <p className="text-xs text-gray-500">{produit.produit__reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">{produit.quantite} unités</p>
                  <p className="text-xs text-gray-500">{formatMontant(produit.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modes de paiement */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par mode de paiement
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report?.par_mode_paiement}
                  dataKey="total"
                  nameKey="mode_paiement"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ mode_paiement, percent }) => `${mode_paiement} ${(percent * 100).toFixed(0)}%`}
                >
                  {report?.par_mode_paiement?.map((entry, index) => (
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

export default VentesReport;