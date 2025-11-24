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
  Star,
  Calendar,
  Hospital,
  Loader2,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DoctorData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  consultationFee: number;
  isActive: boolean;
  rating: number;
  totalPatients: number;
  joinDate: string;
}

interface DoctorsResponse {
  doctors: DoctorData[];
  stats: {
    totalDoctors: number;
    activeDoctors: number;
    avgRating: number;
    newThisMonth: number;
  };
}

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [stats, setStats] = useState({ totalDoctors: 0, activeDoctors: 0, avgRating: 0, newThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorDetailsLoading, setDoctorDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/doctors?${params}`);
      const data: DoctorsResponse = await response.json();
      
      setDoctors(data.doctors);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorDetails = async (doctorId: string) => {
    try {
      setDoctorDetailsLoading(true);
      const response = await fetch(`/api/admin/doctors/${doctorId}`);
      const data = await response.json();
      setSelectedDoctor(data);
    } catch (error) {
      console.error('Failed to fetch doctor details:', error);
    } finally {
      setDoctorDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors Management</h1>
          <p className="text-gray-600">Manage all registered doctors</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Doctors</p>
                <p className="text-2xl font-bold">{stats.totalDoctors}</p>
              </div>
              <Hospital className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Doctors</p>
                <p className="text-2xl font-bold">{stats.activeDoctors}</p>
              </div>
              <Hospital className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
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
            <CardTitle>All Doctors</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors..."
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
              {doctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Hospital className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{doctor.name}</h3>
                        <Badge variant="secondary">{doctor.specialty}</Badge>
                        <Badge variant={doctor.isActive ? 'default' : 'secondary'}>
                          {doctor.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {doctor.email}
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {doctor.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {doctor.rating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {doctor.totalPatients} patients
                        </div>
                        <span>₦{doctor.consultationFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => fetchDoctorDetails(doctor.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Doctor Details</DialogTitle>
                      </DialogHeader>
                      {doctorDetailsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : selectedDoctor ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Phone</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Specialty</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">License</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.license}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Experience</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.experience} years</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Consultation Fee</label>
                              <p className="text-sm text-gray-600">₦{selectedDoctor.consultationFee?.toLocaleString()}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Rating</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.avgRating?.toFixed(1)} ({selectedDoctor.totalRatings} reviews)</p>
                            </div>
                          </div>
                          {selectedDoctor.bio && (
                            <div>
                              <label className="text-sm font-medium">Bio</label>
                              <p className="text-sm text-gray-600">{selectedDoctor.bio}</p>
                            </div>
                          )}
                          {selectedDoctor.recentAppointments?.length > 0 && (
                            <div>
                              <h3 className="font-medium mb-2">Recent Appointments</h3>
                              <div className="space-y-2">
                                {selectedDoctor.recentAppointments.map((apt: any) => (
                                  <div key={apt.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                    <span>{apt.patient}</span>
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