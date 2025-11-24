'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Download,
  BarChart3,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    revenueGrowth: number;
    newPatients: number;
    patientGrowth: number;
    totalAppointments: number;
    appointmentGrowth: number;
    completionRate: number;
  };
  topSpecialties: Array<{
    specialty: string;
    count: number;
  }>;
  peakHours: Array<{
    time: string;
    appointments: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      const data: AnalyticsData = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return <div>Failed to load analytics data</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform performance and insights</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₦{analytics.metrics.totalRevenue.toLocaleString()}</p>
                <div className={`flex items-center gap-1 text-sm ${
                  analytics.metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.metrics.revenueGrowth >= 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  {analytics.metrics.revenueGrowth >= 0 ? '+' : ''}{analytics.metrics.revenueGrowth.toFixed(1)}% from last month
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Patients</p>
                <p className="text-2xl font-bold">{analytics.metrics.newPatients}</p>
                <div className={`flex items-center gap-1 text-sm ${
                  analytics.metrics.patientGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.metrics.patientGrowth >= 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  {analytics.metrics.patientGrowth >= 0 ? '+' : ''}{analytics.metrics.patientGrowth.toFixed(1)}% from last month
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Appointments</p>
                <p className="text-2xl font-bold">{analytics.metrics.totalAppointments}</p>
                <div className={`flex items-center gap-1 text-sm ${
                  analytics.metrics.appointmentGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.metrics.appointmentGrowth >= 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  {analytics.metrics.appointmentGrowth >= 0 ? '+' : ''}{analytics.metrics.appointmentGrowth.toFixed(1)}% from last month
                </div>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.metrics.completionRate.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Revenue chart would be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">User growth chart would be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSpecialties.map((item, i) => {
                const total = analytics.topSpecialties.reduce((sum, s) => sum + s.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.specialty}</p>
                      <p className="text-sm text-gray-600">{item.count} doctors</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{percentage.toFixed(1)}%</p>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.peakHours.map((item, i) => {
                const maxAppointments = Math.max(...analytics.peakHours.map(h => h.appointments));
                const percentage = maxAppointments > 0 ? (item.appointments / maxAppointments) * 100 : 0;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-sm">{item.time}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-green-600 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.appointments}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Server Uptime</span>
                <span className="font-medium text-green-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Response Time</span>
                <span className="font-medium">245ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Size</span>
                <span className="font-medium">2.4 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Calls Today</span>
                <span className="font-medium">45,678</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}