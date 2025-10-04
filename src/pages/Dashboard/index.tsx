import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, Users, Activity, CheckCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/features/dashboard/StatCard';
import MessagesChart from '@/components/features/dashboard/MessagesChart';
import SessionsOverview from '@/components/features/dashboard/SessionsOverview';
import RecentActivity from '@/components/features/dashboard/RecentActivity';
import type { RootState } from '@/store';

export default function DashboardPage() {
  const { sessions } = useSelector((state: RootState) => state.session);
  const { contacts } = useSelector((state: RootState) => state.chat);

  // Calculate stats
  const stats = useMemo(() => {
    const activeSessions = sessions.filter(s => s.isActive && s.status === 'connected').length;
    const totalContacts = contacts.length;
    const activeConversations = contacts.filter(c => c.unreadCount > 0).length;

    // Mock messages count for today (would come from API)
    const messagesToday = 127;

    return {
      activeSessions,
      messagesToday,
      totalContacts,
      activeConversations,
      deliveryRate: 98.5
    };
  }, [sessions, contacts]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema WhatsApp Multi-Tenant</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Sessões Ativas"
            value={stats.activeSessions}
            icon={Activity}
            color="primary"
            trend={{ value: 12, isPositive: true }}
          />

          <StatCard
            title="Mensagens (Hoje)"
            value={stats.messagesToday}
            icon={MessageSquare}
            color="blue"
            trend={{ value: 8, isPositive: true }}
          />

          <StatCard
            title="Conversas Ativas"
            value={stats.activeConversations}
            icon={Users}
            color="purple"
            trend={{ value: 3, isPositive: false }}
          />

          <StatCard
            title="Taxa de Entrega"
            value={`${stats.deliveryRate}%`}
            icon={CheckCircle}
            color="green"
            trend={{ value: 2.5, isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages Chart */}
          <MessagesChart />

          {/* Sessions Overview */}
          <SessionsOverview sessions={sessions} />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </MainLayout>
  );
}
