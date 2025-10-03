import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MessageData {
  date: Date;
  sent: number;
  received: number;
}

interface MessagesChartProps {
  data?: MessageData[];
  loading?: boolean;
}

// Generate mock data for last 7 days
const generateMockData = (): MessageData[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    date: subDays(new Date(), 6 - i),
    sent: Math.floor(Math.random() * 100) + 20,
    received: Math.floor(Math.random() * 100) + 20,
  }));
};

export default function MessagesChart({
  data,
  loading = false
}: MessagesChartProps) {
  const chartData = data || generateMockData();

  const maxValue = useMemo(() => {
    const allValues = chartData.flatMap(d => [d.sent, d.received]);
    return Math.max(...allValues);
  }, [chartData]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, day) => ({
        sent: acc.sent + day.sent,
        received: acc.received + day.received,
      }),
      { sent: 0, received: 0 }
    );
  }, [chartData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-end gap-2 h-32">
                <div className="flex-1 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 100}%` }}></div>
                <div className="flex-1 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 100}%` }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Mensagens (Últimos 7 dias)
          </h3>
          <p className="text-sm text-gray-500">
            Enviadas e recebidas por dia
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm text-gray-600">Enviadas ({totals.sent})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Recebidas ({totals.received})</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400 w-8">
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue * 0.75)}</span>
          <span>{Math.floor(maxValue * 0.5)}</span>
          <span>{Math.floor(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="ml-10 pl-4 border-l border-gray-200">
          <div className="flex items-end justify-between gap-4 h-64">
            {chartData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                {/* Bars container */}
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  {/* Sent bar */}
                  <div
                    className="w-full bg-primary rounded-t hover:bg-primary-dark transition-all cursor-pointer group relative"
                    style={{
                      height: `${(day.sent / maxValue) * 100}%`,
                      minHeight: day.sent > 0 ? '4px' : '0',
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Enviadas: {day.sent}
                    </div>
                  </div>

                  {/* Received bar */}
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer group relative"
                    style={{
                      height: `${(day.received / maxValue) * 100}%`,
                      minHeight: day.received > 0 ? '4px' : '0',
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Recebidas: {day.received}
                    </div>
                  </div>
                </div>

                {/* Date label */}
                <div className="text-xs text-gray-600 text-center">
                  {format(day.date, 'dd/MM', { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* X-axis */}
        <div className="ml-10 mt-2 border-t border-gray-200"></div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Enviadas</p>
              <p className="text-xl font-bold text-gray-900">{totals.sent}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Recebidas</p>
              <p className="text-xl font-bold text-gray-900">{totals.received}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
