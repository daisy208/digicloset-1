import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Users,
  ShoppingBag,
  Zap,
  Activity,
  Target,
  AlertCircle,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { predictiveAnalytics } from '../services/predictiveAnalytics';
import MerchantProfilePanel from './MerchantProfilePanel';

interface DashboardMetrics {
  predictedRevenue: number;
  conversionLikelihood: number;
  churnRisk: number;
  topTrends: any[];
  customerSegments: any[];
  recommendations: string[];
}

const AIDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMetrics({
        predictedRevenue: 487500,
        conversionLikelihood: 73.2,
        churnRisk: 18.5,
        topTrends: [
          { name: 'Minimalist', demand: 92, growth: 15.3 },
          { name: 'Casual', demand: 85, growth: 8.7 },
          { name: 'Business', demand: 78, growth: 5.2 },
          { name: 'Trendy', demand: 71, growth: 12.1 }
        ],
        customerSegments: [
          { name: 'High Value', value: 35, color: '#8B5CF6' },
          { name: 'Try-On Enthusiasts', value: 28, color: '#06B6D4' },
          { name: 'Casual Shoppers', value: 22, color: '#10B981' },
          { name: 'Window Shoppers', value: 15, color: '#F59E0B' }
        ],
        recommendations: [
          'Focus marketing on minimalist styles - 15.3% growth trend detected',
          'Target high-value segment with exclusive early access',
          'Reduce churn risk with personalized re-engagement campaigns',
          'Increase mobile optimization - 78% of traffic from mobile devices'
        ]
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const predictionData = [
    { month: 'Jan', actual: 145000, predicted: 148000 },
    { month: 'Feb', actual: 162000, predicted: 165000 },
    { month: 'Mar', actual: 178000, predicted: 182000 },
    { month: 'Apr', actual: 195000, predicted: 198000 },
    { month: 'May', actual: 212000, predicted: 215000 },
    { month: 'Jun', actual: 234000, predicted: 238000 },
    { month: 'Jul', actual: null, predicted: 255000 },
    { month: 'Aug', actual: null, predicted: 271000 }
  ];

  const conversionFunnelData = [
    { stage: 'Visits', users: 10000, predicted: 10500 },
    { stage: 'Product Views', users: 7500, predicted: 7875 },
    { stage: 'Try-On', users: 5200, predicted: 5460 },
    { stage: 'Add to Cart', users: 3800, predicted: 4104 },
    { stage: 'Purchase', users: 2900, predicted: 3248 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI-powered insights...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <Brain className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Predictive insights powered by machine learning</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <button
                onClick={loadMetrics}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Zap size={16} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <span className="text-green-600 text-sm font-medium">+12.5%</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Predicted Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${(metrics.predictedRevenue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 mt-2">Next 30 days</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="text-green-600" size={24} />
              </div>
              <span className="text-green-600 text-sm font-medium">+8.3%</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Conversion Likelihood</h3>
            <p className="text-2xl font-bold text-gray-900">{metrics.conversionLikelihood}%</p>
            <p className="text-xs text-gray-500 mt-2">Above industry avg</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
              <span className="text-red-600 text-sm font-medium">-3.2%</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Churn Risk</h3>
            <p className="text-2xl font-bold text-gray-900">{metrics.churnRisk}%</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Sparkles className="text-purple-600" size={24} />
              </div>
              <span className="text-green-600 text-sm font-medium">AI Active</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">ML Models Running</h3>
            <p className="text-2xl font-bold text-gray-900">4</p>
            <p className="text-xs text-gray-500 mt-2">Real-time analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <LineChart size={20} className="mr-2 text-blue-600" />
                Revenue Prediction vs Actual
              </h3>
              <span className="text-xs text-gray-500">95% confidence</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Actual Revenue"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Predicted Revenue"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 size={20} className="mr-2 text-green-600" />
                Conversion Funnel Prediction
              </h3>
              <span className="text-xs text-gray-500">Next week forecast</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#06b6d4" name="Current" />
                <Bar dataKey="predicted" fill="#8b5cf6" name="Predicted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp size={20} className="mr-2 text-orange-600" />
                Trending Styles (AI-Detected)
              </h3>
            </div>
            <div className="space-y-4">
              {metrics.topTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{trend.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium">+{trend.growth}%</span>
                        <span className="text-sm text-gray-600">{trend.demand}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${trend.demand}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users size={20} className="mr-2 text-purple-600" />
                Customer Segments
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={metrics.customerSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {metrics.customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <MerchantProfilePanel />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Sparkles className="text-purple-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg mt-1">
                        <Activity size={16} className="text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-700 flex-1">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
