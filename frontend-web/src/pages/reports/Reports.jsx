import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';
import VentesReport from '../../components/reports/VentesReport';
import StockReport from '../../components/reports/StockReport';
import FinancesReport from '../../components/reports/FinancesReport';
import VendeursReport from '../../components/reports/VendeursReport';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('ventes');

  const tabs = [
    { id: 'ventes', name: 'Rapport des ventes', icon: TrendingUp },
    { id: 'stock', name: 'Rapport des stocks', icon: Package },
    { id: 'finances', name: 'Rapport financier', icon: DollarSign },
    { id: 'vendeurs', name: 'Performance vendeurs', icon: Users },
  ];

  const handleExport = (type) => {
    // TODO: Implémenter l'export PDF/Excel
    alert(`Export ${type} en cours de développement...`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-600 mt-1">
            Analysez vos performances et suivez l'évolution de votre activité
          </p>
        </div>
        <button
          onClick={() => handleExport(activeTab)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {activeTab === 'ventes' && <VentesReport />}
        {activeTab === 'stock' && <StockReport />}
        {activeTab === 'finances' && <FinancesReport />}
        {activeTab === 'vendeurs' && <VendeursReport />}
      </div>
    </div>
  );
};

export default Reports;