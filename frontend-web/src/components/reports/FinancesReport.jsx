import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../api/reports';
import { boutiquesAPI } from '../../api/boutiques';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  Users,
  ShoppingBag,
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
  LineChart,
  Line,
} from 'recharts';

const FinancesReport = () => {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    annee: currentYear,
    boutique: '',
  });
  const handleExportExcel = async () => {
  try {
    // Pour l'export finances, on utilise les données actuelles
    const blob = await reportsAPI.exportFinancesExcel(filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_finances_${filters.annee}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
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
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['rapport-finances', filters],
    queryFn: () => reportsAPI.getFinancesReport(filters),
  });

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant || 0) + ' FCFA';
  };

  const getEvolutionColor = (evolution) => {
    if (evolution > 0) return 'text-green-600';
    if (evolution < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getEvolutionIcon = (evolution) => {
    if (evolution > 0) return <TrendingUp className="w-4 h-4" />;
    if (evolution < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const caParMois = report?.ca_par_mois || [];

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Année</label>
            <select
              value={filters.annee}
              onChange={(e) => setFilters({ ...filters, annee: parseInt(e.target.value) })}
              className="input"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((annee) => (
                <option key={annee} value={annee}>{annee}</option>
              ))}
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
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chiffre d'affaires {filters.annee}</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatMontant(report?.recap?.ca_total)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-200" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Évolution vs {filters.annee - 1}</p>
              <div className={`flex items-center space-x-1 text-2xl font-bold ${getEvolutionColor(report?.recap?.evolution)}`}>
                {getEvolutionIcon(report?.recap?.evolution)}
                <span>{Math.abs(report?.recap?.evolution || 0)}%</span>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total des ventes</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.recap?.total_ventes || 0}
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="card p-4 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Créances impayées</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatMontant(report?.recap?.total_creances)}
              </p>
              <p className="text-xs text-orange-600">
                {report?.recap?.nombre_creances} client(s)
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Graphique CA mensuel */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Chiffre d'affaires mensuel {filters.annee}
          </h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={caParMois}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom_mois" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatMontant(value), 'Chiffre d\'affaires']}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Bar dataKey="ca" name="CA" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="benefice" name="Bénéfice" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique évolution des ventes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Évolution des ventes mensuelles
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={caParMois}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom_mois" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                formatter={(value) => [value, 'Nombre de ventes']}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="nombre_ventes"
                name="Nombre de ventes"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top clients */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Top 10 clients {filters.annee}
          </h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Téléphone</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Nombre d'achats</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total dépensé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report?.top_clients?.map((client, index) => (
                <tr key={client.client__id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                      <span className="font-medium text-gray-900">
                        {client.client__prenom} {client.client__nom}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {client.client__telephone || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {client.nombre_achats}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary-600">
                    {formatMontant(client.total_achats)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparaison avec année précédente */}
      {report?.recap?.ca_annee_precedente > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comparaison annuelle</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatMontant(report?.recap?.ca_annee_precedente)} en {filters.annee - 1}
              </p>
              <div className={`flex items-center space-x-1 mt-1 ${getEvolutionColor(report?.recap?.evolution)}`}>
                {getEvolutionIcon(report?.recap?.evolution)}
                <span className="font-medium">
                  {Math.abs(report?.recap?.evolution || 0)}% {report?.recap?.evolution > 0 ? 'de croissance' : 'de baisse'}
                </span>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-primary-300" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancesReport;