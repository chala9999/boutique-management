import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../api/reports';
import { boutiquesAPI } from '../../api/boutiques';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const StockReport = () => {
  const [filters, setFilters] = useState({
    boutique: '',
  });

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });
  const handleExportExcel = async () => {
  try {
    const blob = await reportsAPI.exportStockExcel(filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_stocks_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur export:', error);
    alert('Erreur lors de l\'export');
  }
};

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['rapport-stock', filters],
    queryFn: () => reportsAPI.getStockReport(filters),
  });

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
      {/* Filtres */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Boutique</label>
            <select
              value={filters.boutique}
              onChange={(e) => setFilters({ boutique: e.target.value })}
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total produits</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.recap?.total_produits || 0}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valeur du stock</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatMontant(report?.recap?.valeur_stock_total)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="card p-4 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Stock faible</p>
              <p className="text-2xl font-bold text-yellow-700">
                {report?.recap?.stock_faible || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="card p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">En rupture</p>
              <p className="text-2xl font-bold text-red-700">
                {report?.recap?.rupture || 0}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Stock faible */}
      {report?.stock_faible_list?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Produits en stock faible</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700">Produit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-yellow-700">Stock actuel</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-yellow-700">Stock minimum</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-yellow-700">Prix de vente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.stock_faible_list.map((produit) => (
                  <tr key={produit.id}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{produit.nom}</p>
                        <p className="text-xs text-gray-500">{produit.reference}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{produit.stock_actuel}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{produit.stock_minimum}</td>
                    <td className="px-4 py-3 text-right">{formatMontant(produit.prix_vente)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Par catégorie */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Valeur du stock par catégorie
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report?.par_categorie}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categorie__nom" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatMontant(value)} />
              <Bar dataKey="total_valeur" name="Valeur du stock" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StockReport;