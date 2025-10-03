import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { RootState } from '@/store';
import TenantInfoCard from '@/components/features/settings/TenantInfoCard';
import WebhookConfig from '@/components/features/settings/WebhookConfig';
import LimitsConfig from '@/components/features/settings/LimitsConfig';

type Tab = 'general' | 'webhooks' | 'limits';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { user } = useSelector((state: RootState) => state.auth);

  // Only admins can access settings
  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'general' as Tab, label: 'Geral' },
    { id: 'webhooks' as Tab, label: 'Webhooks' },
    { id: 'limits' as Tab, label: 'Limites' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
          <p className="text-gray-600 mt-1">Configure seu tenant e providers</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'general' && <TenantInfoCard />}
          {activeTab === 'webhooks' && <WebhookConfig />}
          {activeTab === 'limits' && <LimitsConfig />}
        </div>
      </div>
    </MainLayout>
  );
}
