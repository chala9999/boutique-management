import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { ArrowLeft, Package, Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const DetailProduit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  

  const { data: produit, isLoading } = useQuery({
    queryKey: ['produit', id],
    queryFn: () => produitsAPI.getById(id),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (produit?.is_active) {
        await produitsAPI.desactiver(id);
      } else {
        await produitsAPI.activer(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['produit', id]);
      queryClient.invalidateQueries(['produits']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Produit non trouvé</h2>
        <button onClick={() => navigate('/produits')} className="btn-primary mt-4">
          Retour aux produits
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
            onClick={() => navigate('/produits')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{produit.nom}</h1>
            <p className="text-gray-600 mt-1">Réf: {produit.reference}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleActiveMutation.mutate()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              produit.is_active
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {produit.is_active ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>Désactiver</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Activer</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            {produit.image_principale ? (
              <img
                src={produit.image_principale}
                alt={produit.nom}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <Package className="w-16 h-16 text-primary-600" />
              </div>
            )}
          </div>

          {/* Informations stock */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Stock actuel</span>
                <span className={`text-2xl font-bold ${produit.stock_faible ? 'text-red-600' : 'text-gray-900'}`}>
                  {produit.stock_actuel}
                </span>
              </div>
              {produit.stock_faible && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Stock faible ! Minimum recommandé: {produit.stock_minimum}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stock minimum</span>
                <span className="font-medium">{produit.stock_minimum}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stock maximum</span>
                <span className="font-medium">{produit.stock_maximum}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Infos détaillées */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prix */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prix et marges</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Prix d'achat</p>
                <p className="text-xl font-semibold text-gray-900">{produit.prix_achat.toLocaleString()} FCFA</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prix de vente</p>
                <p className="text-2xl font-bold text-primary-600">{produit.prix_vente.toLocaleString()} FCFA</p>
              </div>
              {produit.prix_promo && (
                <div>
                  <p className="text-sm text-gray-500">Prix promotionnel</p>
                  <p className="text-xl font-semibold text-red-600">{produit.prix_promo.toLocaleString()} FCFA</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Marge</p>
                <p className="text-xl font-semibold text-green-600">{produit.pourcentage_marge?.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {produit.description && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{produit.description}</p>
            </div>
          )}

          {/* Infos générales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Code barre</p>
                <p className="font-medium">{produit.code_barre || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Unité</p>
                <p className="font-medium">{produit.unite}</p>
              </div>
              <div>
                <p className="text-gray-500">Catégorie</p>
                <p className="font-medium">{produit.categorie_info?.nom || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Boutique</p>
                <p className="font-medium">{produit.boutique_nom}</p>
              </div>
              <div>
                <p className="text-gray-500">Créé le</p>
                <p className="font-medium">{new Date(produit.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-gray-500">Dernière modification</p>
                <p className="font-medium">{new Date(produit.updated_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailProduit;