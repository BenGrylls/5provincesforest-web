'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

interface PerformanceMetrics {
  endpoint: string;
  avgResponseTime: number;
  maxResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  trend: 'improving' | 'stable' | 'degrading';
}

interface PerformanceAlert {
  type: string;
  endpoint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: number;
  threshold: number;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch performance metrics
        const metricsRes = await fetch(`/api/admin/performance?range=${timeRange}`);
        if (!metricsRes.ok) throw new Error('Failed to fetch metrics');
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.endpoints || []);

        // Fetch alerts
        const alertsRes = await fetch('/api/admin/performance/alerts');
        if (!alertsRes.ok) throw new Error('Failed to fetch alerts');
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      } catch (error) {
        toast.error('Failed to load performance data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    fetchData();
    return () => clearInterval(interval);
  }, [timeRange]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'degrading':
        return '📉';
      default:
        return '→';
    }
  };

  return (
    <AdminShell title="Performance Dashboard">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded ${
              timeRange === '24h'
                ? 'bg-forest-800 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Last 24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded ${
              timeRange === '7d'
                ? 'bg-forest-800 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded ${
              timeRange === '30d'
                ? 'bg-forest-800 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Last 30 days
          </button>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">⚠️ Performance Alerts ({alerts.length})</h2>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded border-l-4 ${getSeverityColor(
                    alert.severity
                  )}`}
                  style={{
                    borderLeftColor:
                      alert.severity === 'critical'
                        ? '#dc2626'
                        : alert.severity === 'high'
                        ? '#ea580c'
                        : alert.severity === 'medium'
                        ? '#ca8a04'
                        : '#0284c7',
                  }}
                >
                  <div className="font-semibold text-sm">{alert.endpoint}</div>
                  <div className="text-sm mt-1">{alert.message}</div>
                  <div className="text-xs mt-2 opacity-70">
                    {alert.type}: {alert.metric} (threshold: {alert.threshold})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold">📊 API Performance Metrics</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : metrics.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No performance data available yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Endpoint</th>
                    <th className="px-6 py-3 text-right font-semibold">Avg Time</th>
                    <th className="px-6 py-3 text-right font-semibold">Max Time</th>
                    <th className="px-6 py-3 text-right font-semibold">Requests</th>
                    <th className="px-6 py-3 text-right font-semibold">Error Rate</th>
                    <th className="px-6 py-3 text-center font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedEndpoint(metric.endpoint)}
                    >
                      <td className="px-6 py-4 font-mono text-xs">{metric.endpoint}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={
                            metric.avgResponseTime > 2000
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-700'
                          }
                        >
                          {metric.avgResponseTime}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {metric.maxResponseTime}ms
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {metric.requestCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={
                            metric.errorRate > 5
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-700'
                          }
                        >
                          {metric.errorRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-lg">
                        {getTrendEmoji(metric.trend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>💡 Tips:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Response times above 2 seconds are highlighted in red</li>
            <li>Error rates above 5% indicate potential issues</li>
            <li>📈 Improving, → Stable, 📉 Degrading trends</li>
            <li>Data is sampled at 10% rate for performance overhead</li>
            <li>Click on an endpoint to see detailed statistics</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
