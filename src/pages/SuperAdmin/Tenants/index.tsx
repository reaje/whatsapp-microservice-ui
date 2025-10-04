import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { superAdminService } from '@/services/superadmin.service';
import type { Tenant, CreateTenantRequest } from '@/types';

export default function SuperAdminTenants() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState<CreateTenantRequest>({
    name: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
  });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: () => superAdminService.getAllTenants(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantRequest) => superAdminService.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
      setShowCreateModal(false);
      setNewTenant({ name: '', adminEmail: '', adminPassword: '', adminFullName: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => superAdminService.deleteTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newTenant);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6">Carregando...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Tenants</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Criar Novo Tenant
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants?.map((tenant: Tenant) => (
              <tr key={tenant.id}>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.name}</td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{tenant.clientId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja deletar este tenant?')) {
                        deleteMutation.mutate(tenant.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Criar Novo Tenant</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Tenant</label>
                  <input
                    type="text"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email do Admin</label>
                  <input
                    type="email"
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo do Admin</label>
                  <input
                    type="text"
                    value={newTenant.adminFullName}
                    onChange={(e) => setNewTenant({ ...newTenant, adminFullName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Senha do Admin</label>
                  <input
                    type="password"
                    value={newTenant.adminPassword}
                    onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}
