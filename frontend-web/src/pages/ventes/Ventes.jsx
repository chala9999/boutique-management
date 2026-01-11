import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { boutiquesAPI } from '../../api/boutiques';
import { Link } from 'react-router-dom';
import {
  Plus,
  Eye,
  Search,
  Calendar,
  ShoppingCart,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Ventes = () => {
  const [filters, setFilters] = useState({
    search: '',
    boutique: '',
    statut: '',
    statut_paiement: '',
    date_debut: '',
    date_fin: '',
  });

  // Récupérer les ventes
  const { data: ventes, isLoading } = useQuery({
    queryKey: ['ventes', filters],
    queryFn: () => ventesAPI.getAll(filters),
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['ventes-stats', 'aujourd_hui'],
    queryFn: () => ventesAPI.getStatistiques({ periode: 'aujourd_hui' }),
  });

  // Récupérer les boutiques pour le filtre
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const getStatutBadge = (statut) => {
    const styles = {
      completee: 'bg-green-100 text-green-700',
      en_cours: 'bg-yellow-100 text-yellow-700',
      annulee: 'bg-red-100 text-red-700',
    };
    const labels = {
      completee: 'Complétée',
      en_cours: 'En cours',
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
      partiel: 'Partiel',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}>
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventes</h1>
          <p className="text-gray-600 mt-1">
            Gérez et suivez vos ventes
          </p>
        </div>
        <Link to="/ventes/nouvelle" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Nouvelle Vente</span>
        </Link>
      </div>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventes aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.nombre_ventes || 0}
              </p>
            </div>
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.chiffre_affaires?.toLocaleString() || 0} FCFA
              </p>
            </div>
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bénéfice</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.benefice_total?.toLocaleString() || 0} FCFA
              </p>
            </div>
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="input pl-10"
                placeholder="N° vente..."
              />
            </div>
          </div>

          <div>
            <label className="label">Boutique</label>
            <select
              name="boutique"
              value={filters.boutique}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Toutes</option>
              {boutiques?.results?.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Statut</label>
            <select
              name="statut"
              value={filters.statut}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Tous</option>
              <option value="completee">Complétée</option>
              <option value="en_cours">En cours</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          <div>
            <label className="label">Paiement</label>
            <select
              name="statut_paiement"
              value={filters.statut_paiement}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Tous</option>
              <option value="paye">Payé</option>
              <option value="impaye">Impayé</option>
              <option value="partiel">Partiel</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Liste des ventes */}
      {ventes?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune vente
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par créer votre première vente
          </p>
          <Link to="/ventes/nouvelle" className="btn-primary inline-flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nouvelle vente</span>
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Vente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boutique
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventes?.results?.map((vente) => (
                <tr key={vente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vente.numero_vente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(vente.date_vente), 'dd/MM/yyyy HH:mm', {
                      locale: fr,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {vente.boutique_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {vente.client_nom || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {vente.montant_final.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatutBadge(vente.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaiementBadge(vente.statut_paiement)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary-600 hover:text-primary-900">
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Ventes;