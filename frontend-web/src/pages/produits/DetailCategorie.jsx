import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { ArrowLeft, FolderTree, Package, Edit, Trash2 } from 'lucide-react';

const DetailCategorie = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: categorie, isLoading } = useQuery({
    queryKey: ['categorie', id],
    queryFn: () => produitsAPI.getCategorieById(id),
  });

  const { data: produits } = useQuery({
    queryKey: ['categorie-produits', id],
    queryFn: () => produitsAPI.getCategorieProduits(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!categorie) {
    return (
      <div className="text-center py-12">
        <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Catégorie non trouvée</h2>
        <button onClick={() => navigate('/categories')} className="btn-primary mt-4">
          Retour aux catégories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/categories')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{categorie.nom}</h1>
            {categorie.description && (
              <p className="text-gray-600 mt-1">{categorie.description}</p>
            )}
          </div>
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            {categorie.image ? (
              <img
                src={categorie.image}
                alt={categorie.nom}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <FolderTree className="w-24 h-24 text-primary-600" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nombre de produits</span>
                <span className="text-2xl font-bold text-primary-600">
                  {categorie.nombre_produits || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Créée le</span>
                <span className="font-medium">
                  {new Date(categorie.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {categorie.updated_at !== categorie.created_at && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Modifiée le</span>
                  <span className="font-medium">
                    {new Date(categorie.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Produits associés */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Produits dans cette catégorie
              </h3>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            
            {!produits?.results?.length ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun produit dans cette catégorie</p>
                <button
                  onClick={() => navigate('/produits')}
                  className="btn-secondary mt-4 inline-flex items-center space-x-2"
                >
                  <span>Ajouter des produits</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {produits.results.map((produit) => (
                  <div
                    key={produit.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/produits/${produit.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      {produit.image_principale ? (
                        <img
                          src={produit.image_principale}
                          alt={produit.nom}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{produit.nom}</p>
                        <p className="text-sm text-gray-500">{produit.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">
                        {produit.prix_vente.toLocaleString()} FCFA
                      </p>
                      <p className={`text-sm ${produit.stock_actuel > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Stock: {produit.stock_actuel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailCategorie;