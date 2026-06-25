import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depensesAPI } from '../../api/depenses';
import { boutiquesAPI } from '../../api/boutiques';
import { usePermissions } from '../../hooks/usePermissions';
import { Plus, Edit, Trash2, Search, Receipt, TrendingDown, CheckCircle } from 'lucide-react';
import DepenseModal from '../../components/depenses/DepenseModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Depenses = () => {
  const { can, isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, depenseId: null });
  const [filters, setFilters] = useState({
    search: '',
    boutique: '',
    categorie: '',
    type_depense: '',
    statut_remboursement: '',
    date_debut: '',
    date_fin: '',
  });

  const { data: depenses, isLoading } = useQuery({
    queryKey: ['depenses', filters],
    queryFn: () => depensesAPI.getAll(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ['depenses-stats', filters],
    queryFn: () => depensesAPI.getStatistiques(filters),
  });

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => depensesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['depenses']);
      setConfirmModal({ isOpen: false, depenseId: null });
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const rembourserMutation = useMutation({
    mutationFn: (id) => depensesAPI.marquerRembourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['depenses']);
      alert('Dépense marquée comme remboursée');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur');
    },
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getCategorieLabel = (cat) => {
    const labels = {
      loyer: 'Loyer', electricite: 'Électricité', eau: 'Eau',
      internet: 'Internet', fournitures: 'Fournitures', transport: 'Transport',
      salaire: 'Salaire', maintenance: 'Maintenance', publicite: 'Publicité',
      personnel: 'Personnel', autre: 'Autre',
    };
    return labels[cat] || cat;
  };

  const getRemboursementBadge = (statut) => {
    if (statut === 'na') return null;
    if (statut === 'rembourse') return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Remboursé</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">En attente</span>;
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
          <h1 className="text-3xl font-bold text-gray-900">Dépenses</h1>
          <p className="text-gray-600 mt-1">Gérez les dépenses de vos boutiques</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Dépense</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total dépenses</p>
              <p className="text-2xl font-bold text-red-600">{parseFloat(stats?.total_depenses || 0).toLocaleString()} FCFA</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dépenses boutique</p>
              <p className="text-2xl font-bold text-gray-900">{parseFloat(stats?.depenses_boutique || 0).toLocaleString()} FCFA</p>
            </div>
            <Receipt className="w-8 h-8 text-gray-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dépenses personnelles</p>
              <p className="text-2xl font-bold text-purple-600">{parseFloat(stats?.depenses_personnelles || 0).toLocaleString()} FCFA</p>
            </div>
            <Receipt className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="card p-4 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">À rembourser</p>
              <p className="text-2xl font-bold text-orange-600">{parseFloat(stats?.en_attente_remboursement || 0).toLocaleString()} FCFA</p>
            </div>
            <Receipt className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="input pl-10" placeholder="Titre, description..." />
            </div>
          </div>
          <div>
            <label className="label">Boutique</label>
            <select name="boutique" value={filters.boutique} onChange={handleFilterChange} className="input">
              <option value="">Toutes</option>
              {boutiques?.results?.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type_depense" value={filters.type_depense} onChange={handleFilterChange} className="input">
              <option value="">Tous</option>
              <option value="boutique">Boutique</option>
              <option value="personnelle">Personnelle</option>
            </select>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select name="categorie" value={filters.categorie} onChange={handleFilterChange} className="input">
              <option value="">Toutes</option>
              <option value="loyer">Loyer</option>
              <option value="electricite">Électricité</option>
              <option value="eau">Eau</option>
              <option value="internet">Internet</option>
              <option value="fournitures">Fournitures</option>
              <option value="transport">Transport</option>
              <option value="salaire">Salaire</option>
              <option value="maintenance">Maintenance</option>
              <option value="publicite">Publicité</option>
              <option value="personnel">Personnel</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="label">Remboursement</label>
            <select name="statut_remboursement" value={filters.statut_remboursement} onChange={handleFilterChange} className="input">
              <option value="">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="rembourse">Remboursé</option>
              <option value="na">Non applicable</option>
            </select>
          </div>
          <div>
            <label className="label">Du</label>
            <input type="date" name="date_debut" value={filters.date_debut} onChange={handleFilterChange} className="input" />
          </div>
          <div>
            <label className="label">Au</label>
            <input type="date" name="date_fin" value={filters.date_fin} onChange={handleFilterChange} className="input" />
          </div>
          {Object.values(filters).some(v => v) && (
            <div className="flex items-end">
              <button onClick={() => setFilters({ search: '', boutique: '', categorie: '', type_depense: '', statut_remboursement: '', date_debut: '', date_fin: '' })} className="btn-secondary w-full">
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste */}
      {depenses?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune dépense</h3>
          <p className="text-gray-600 mb-4">Commencez par enregistrer une dépense</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nouvelle dépense</span>
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Par</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remboursement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {depenses?.results?.map((depense) => (
                <tr key={depense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {format(new Date(depense.date_depense), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{depense.titre}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{depense.boutique_nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{depense.effectuee_par_nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getCategorieLabel(depense.categorie)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${depense.type_depense === 'boutique' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {depense.type_depense === 'boutique' ? 'Boutique' : 'Personnelle'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                    {parseFloat(depense.montant).toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3">{getRemboursementBadge(depense.statut_remboursement)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setSelectedDepense(depense); setIsModalOpen(true); }} className="text-primary-600 hover:text-primary-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      {isAdmin && depense.statut_remboursement === 'en_attente' && (
                        <button onClick={() => rembourserMutation.mutate(depense.id)} className="text-green-600 hover:text-green-900" title="Marquer remboursé">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setConfirmModal({ isOpen: true, depenseId: depense.id })} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, depenseId: null })}
        onConfirm={() => deleteMutation.mutate(confirmModal.depenseId)}
        title="Supprimer la dépense"
        message="Êtes-vous sûr de vouloir supprimer cette dépense ?"
        confirmText="Supprimer"
        confirmVariant="danger"
      />

      {isModalOpen && (
        <DepenseModal depense={selectedDepense} onClose={() => { setIsModalOpen(false); setSelectedDepense(null); }} />
      )}
    </div>
  );
};

export default Depenses;