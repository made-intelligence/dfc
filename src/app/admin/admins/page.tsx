'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Shield,
  Loader2
} from 'lucide-react';

interface AdminData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminsResponse {
  admins: AdminData[];
  stats: {
    totalAdmins: number;
    activeAdmins: number;
    superAdmins: number;
    newThisMonth: number;
  };
}

export default function AdminsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [stats, setStats] = useState({ totalAdmins: 0, activeAdmins: 0, superAdmins: 0, newThisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, [searchTerm]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/admins?${params}`);
      const data: AdminsResponse = await response.json();
      
      setAdmins(data.admins);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage platform administrators</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Admins</p>
                <p className="text-2xl font-bold">{stats.totalAdmins}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold">{stats.activeAdmins}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold">{stats.superAdmins}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Administrators</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search admins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{admin.name}</h3>
                        <Badge variant={admin.role === 'SUPERADMIN' ? 'default' : 'secondary'}>
                          <Shield className="h-3 w-3 mr-1" />
                          {admin.role}
                        </Badge>
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {admin.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}