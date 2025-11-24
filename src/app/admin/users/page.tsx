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
  User,
  Loader2,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: UserData[];
  stats: {
    totalPatients: number;
    activePatients: number;
    totalDoctors: number;
    newThisMonth: number;
  };
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({ totalPatients: 0, activePatients: 0, totalDoctors: 0, newThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();
      
      setUsers(data.users);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setUserDetailsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setSelectedUser(data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'DOCTOR': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients Management</h1>
          <p className="text-gray-600">Manage all platform patients</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold">{stats.activePatients.toLocaleString()}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doctors</p>
                <p className="text-2xl font-bold">{stats.totalDoctors.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{stats.newThisMonth.toLocaleString()}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Patients</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
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
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.name}</h3>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'DOCTOR' ? 'secondary' : 'outline'}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </Badge>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => fetchUserDetails(user.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Patient Details</DialogTitle>
                      </DialogHeader>
                      {userDetailsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : selectedUser ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <p className="text-sm text-gray-600">{selectedUser.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <p className="text-sm text-gray-600">{selectedUser.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Phone</label>
                              <p className="text-sm text-gray-600">{selectedUser.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <p className="text-sm text-gray-600">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                            </div>
                          </div>
                          {selectedUser.profile && (
                            <div>
                              <h3 className="font-medium mb-2">Profile Information</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <label className="font-medium">Date of Birth</label>
                                  <p className="text-gray-600">{selectedUser.profile.dateOfBirth ? new Date(selectedUser.profile.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium">Gender</label>
                                  <p className="text-gray-600">{selectedUser.profile.gender || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium">Blood Group</label>
                                  <p className="text-gray-600">{selectedUser.profile.bloodGroup || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium">Emergency Contact</label>
                                  <p className="text-gray-600">{selectedUser.profile.emergencyContact || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedUser.recentAppointments?.length > 0 && (
                            <div>
                              <h3 className="font-medium mb-2">Recent Appointments</h3>
                              <div className="space-y-2">
                                {selectedUser.recentAppointments.map((apt: any) => (
                                  <div key={apt.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                    <span>{apt.doctor} - {apt.specialty}</span>
                                    <span>{new Date(apt.date).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}