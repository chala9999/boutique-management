import { useQuery } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  // Statistiques des ventes
  const { data: stats } = useQuery({
    queryKey: ['ventes-stats'],
    queryFn: () => ventesAPI.getStatistiques({ periode: 'aujourd_hui' }),
  });

  // Produits en stock faible
  const { data: stockFaible } = useQuery({
    queryKey: ['stock-faible'],
    queryFn: () => produitsAPI.getStockFaible(),
  });

  // Mes boutiques
  const { data: mesBoutiques } = useQuery({
    queryKey: ['mes-boutiques'],
    queryFn: () => boutiquesAPI.getMesBoutiques(),
  });

  // Ventes par jour (30 derniers jours)
  const { data: ventesParJour } = useQuery({
    queryKey: ['ventes-par-jour'],
    queryFn: () => ventesAPI.getVentesParJour({ jours: 30 }),
  });

  const statCards = [
    {
      title: "Chiffre d'affaires (Aujourd'hui)",
      value: `${stats?.chiffre_affaires?.toLocaleString() || 0} FCFA`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: "Ventes (Aujourd'hui)",
      value: stats?.nombre_ventes || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Mes Boutiques',
      value: mesBoutiques?.length || 0,
      icon: Store,
      color: 'bg-purple-500',
    },
    {
      title: 'Produits Stock Faible',
      value: stockFaible?.length || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique des ventes */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Évolution des ventes (30 derniers jours)
        </h2>
        <div className="h-80">
          {ventesParJour && ventesParJour.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventesParJour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="jour"
                  tickFormatter={(value) =>
                    format(new Date(value), 'dd MMM', { locale: fr })
                  }
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelFormatter={(label) =>
                    format(new Date(label), 'dd MMMM yyyy', { locale: fr })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Alertes stock faible */}
      {stockFaible && stockFaible.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Produits en stock faible
            </h2>
          </div>
          <div className="space-y-2">
            {stockFaible.slice(0, 5).map((produit) => (
              <div
                key={produit.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{produit.nom}</p>
                  <p className="text-sm text-gray-600">
                    {produit.boutique_nom}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  Stock: {produit.stock_actuel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;