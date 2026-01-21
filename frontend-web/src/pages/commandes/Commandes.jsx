import { useState } from 'react';
/*import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';*/
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { commandesAPI } from '../../api/fournisseurs';
import { boutiquesAPI } from '../../api/boutiques';
import { fournisseursAPI } from '../../api/fournisseurs';
import { Plus, Eye, Search, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Commandes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    boutique: '',
    fournisseur: '',
    statut: '',
    statut_paiement: '',
  });

  // Récupérer les commandes
  const { data: commandes, isLoading } = useQuery({
    queryKey: ['commandes', filters],
    queryFn: () => commandesAPI.getAll(filters),
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['commandes-stats'],
    queryFn: () => commandesAPI.getStatistiques(),
  });

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Récupérer les fournisseurs
  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => fournisseursAPI.getAll(),
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

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
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}
      >
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
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}
      >
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
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes Fournisseurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos commandes et réapprovisionnements
          </p>
        </div>
        <button
          onClick={() => navigate('/commandes/nouvelle')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Commande</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.nombre_commandes || 0}
              </p>
            </div>
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.commandes_en_attente || 0}
              </p>
            </div>
            <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.commandes_en_cours || 0}
              </p>
            </div>
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant impayé</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.montant_impaye?.toLocaleString() || 0} FCFA
              </p>
            </div>
            <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
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
                placeholder="N° commande..."
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
            <label className="label">Fournisseur</label>
            <select
              name="fournisseur"
              value={filters.fournisseur}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Tous</option>
              {fournisseurs?.results?.map((fournisseur) => (
                <option key={fournisseur.id} value={fournisseur.id}>
                  {fournisseur.nom}
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
              <option value="en_attente">En attente</option>
              <option value="confirmee">Confirmée</option>
              <option value="en_cours">En cours</option>
              <option value="livree">Livrée</option>
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
        </div>
      </div>

      {/* Liste des commandes */}
      {commandes?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune commande
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par créer votre première commande
          </p>
          <button
            onClick={() => navigate('/commandes/nouvelle')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle commande</span>
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boutique
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison prévue
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
              {commandes?.results?.map((commande) => (
                <tr
                    key={commande.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/commandes/${commande.id}`)}
                  >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {commande.numero_commande}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(commande.date_commande), 'dd/MM/yyyy', {
                      locale: fr,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {commande.fournisseur_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {commande.boutique_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {commande.montant_total.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {commande.date_livraison_prevue
                      ? format(
                          new Date(commande.date_livraison_prevue),
                          'dd/MM/yyyy',
                          { locale: fr }
                        )
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatutBadge(commande.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaiementBadge(commande.statut_paiement)}
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

export default Commandes;