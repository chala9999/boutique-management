import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';


import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Package,
  Search,
  Eye,
} from 'lucide-react';
import CategorieModal from '../../components/produits/CategorieModal';

const Categories = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = usePermissions();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => produitsAPI.getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => produitsAPI.deleteCategorie(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData?.error?.includes('est utilisé')) {
        alert('Cette catégorie contient des produits. Supprimez d\'abord les produits ou déplacez-les.');
      } else {
        alert(errorData?.error || 'Erreur lors de la suppression');
      }
    },
  });

  const handleEdit = (categorie) => {
    setSelectedCategorie(categorie);
    setIsModalOpen(true);
  };

  const handleDelete = (categorie) => {
    if (window.confirm(`Supprimer la catégorie "${categorie.nom}" ?\n\nLes produits ne seront pas supprimés mais n'auront plus de catégorie.`)) {
      deleteMutation.mutate(categorie.id);
    }
  };

  const handleView = (id) => {
    navigate(`/categories/${id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategorie(null);
  };

  const filteredCategories = categories?.results?.filter(cat =>
    cat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-600 mt-1">Organisez vos produits par catégories</p>
        </div>
        {/* ✅ Seulement admin */}
        {can.createCategorie && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nouvelle catégorie</span>
          </button>
        )}
      </div>

      {/* Recherche */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Liste des catégories */}
      {filteredCategories.length === 0 ? (
        <div className="card text-center py-12">
          <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Aucun résultat' : 'Aucune catégorie'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Essayez une autre recherche' : 'Créez votre première catégorie'}
          </p>
          {!searchTerm && can.createCategorie && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Créer une catégorie</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((categorie) => (
            <div key={categorie.id} className="card hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="mb-4">
                {categorie.image ? (
                  <img
                    src={categorie.image}
                    alt={categorie.nom}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <FolderTree className="w-16 h-16 text-primary-600" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {categorie.nom}
                  </h3>
                  <span className="inline-flex items-center space-x-1 text-sm text-gray-500">
                    <Package className="w-3 h-3" />
                    <span>{categorie.nombre_produits || 0} produits</span>
                  </span>
                </div>
                {categorie.description && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {categorie.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleView(categorie.id)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Voir</span>
                </button>
                {can.editCategorie && (
                  <button
                    onClick={() => handleEdit(categorie)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                )}
                {can.deleteCategorie && (
                  <button
                    onClick={() => handleDelete(categorie)}
                    className="flex-1 btn-danger flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {can.createCategorie && isModalOpen && (
        <CategorieModal categorie={selectedCategorie} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Categories;