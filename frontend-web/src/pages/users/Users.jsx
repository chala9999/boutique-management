import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import {
  Plus,
  Edit,
  Trash2,
  Users as UsersIcon,
  Search,
  UserCheck,
  UserX,
  Key,
  Filter,
  Shield,
  Store,
  Eye,
} from 'lucide-react';
import UserModal from '../../components/users/UserModal';
import ChangePasswordModal from '../../components/users/ChangePasswordModal';

const Users = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('tous');
  const [statusFilter, setStatusFilter] = useState('tous');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll(),
    enabled: currentUser?.role === 'admin',
  });

  // Supprimer un utilisateur
  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      alert('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  // Activer/Désactiver un utilisateur
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => usersAPI.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id, username) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id) => {
    toggleActiveMutation.mutate(id);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-100 text-red-700',
      vendeur: 'bg-blue-100 text-blue-700',
      comptable: 'bg-green-100 text-green-700',
    };
    const labels = {
      admin: 'Administrateur',
      vendeur: 'Vendeur',
      comptable: 'Comptable',
    };
    const icons = {
      admin: <Shield className="w-3 h-3 mr-1" />,
      vendeur: <Store className="w-3 h-3 mr-1" />,
      comptable: <UsersIcon className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${styles[role]}`}>
        {icons[role]}
        {labels[role]}
      </span>
    );
  };

  // Filtrer les utilisateurs
  const usersList = users?.results || users || [];
const filteredUsers = usersList.filter((user) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      user.username?.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search);
    
    const matchesRole = roleFilter === 'tous' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'tous' || 
      (statusFilter === 'actif' && user.is_active) ||
      (statusFilter === 'inactif' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Statistiques
  const stats = {
  total: usersList.length,
  admins: usersList.filter(u => u.role === 'admin').length,
  vendeurs: usersList.filter(u => u.role === 'vendeur').length,
  comptables: usersList.filter(u => u.role === 'comptable').length,
  actifs: usersList.filter(u => u.is_active).length,
};

  // Vérifier si l'utilisateur est admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="card text-center py-12">
        <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Accès réservé aux administrateurs
        </h3>
        <p className="text-gray-600">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les employés et leurs accès
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
          <p className="text-xs text-gray-500">Administrateurs</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.vendeurs}</p>
          <p className="text-xs text-gray-500">Vendeurs</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.comptables}</p>
          <p className="text-xs text-gray-500">Comptables</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
          <p className="text-xs text-gray-500">Actifs</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                placeholder="Nom, email, username..."
              />
            </div>
          </div>

          <div>
            <label className="label">Rôle</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="tous">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="vendeur">Vendeur</option>
              <option value="comptable">Comptable</option>
            </select>
          </div>

          <div>
            <label className="label">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="tous">Tous</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>
          </div>

          <div className="flex items-end">
            {(searchTerm || roleFilter !== 'tous' || statusFilter !== 'tous') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('tous');
                  setStatusFilter('tous');
                }}
                className="btn-secondary w-full"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {user.first_name?.[0] || user.username?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name || user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{user.email || '-'}</div>
                  <div className="text-xs text-gray-500">{user.telephone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_active ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      <UserX className="w-3 h-3 mr-1" />
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(user)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Voir"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleChangePassword(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Changer le mot de passe"
                    >
                      <Key className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={
                        user.is_active
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900'
                      }
                      title={user.is_active ? 'Désactiver' : 'Activer'}
                      disabled={user.id === currentUser.id}
                    >
                      {user.is_active ? (
                        <UserX className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                      disabled={user.id === currentUser.id}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && <UserModal user={selectedUser} onClose={handleCloseModal} />}
      {isPasswordModalOpen && (
        <ChangePasswordModal user={selectedUser} onClose={handleClosePasswordModal} />
      )}
      {isViewModalOpen && selectedUser && (
        <UserModal user={selectedUser} onClose={handleCloseViewModal} readOnly />
      )}
    </div>
  );
};

export default Users;