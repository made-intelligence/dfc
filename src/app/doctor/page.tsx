'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useScrollAnimation } from '@/lib/useScrollAnimation';
import { useCountUp } from '@/lib/useCountUp';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: scheduleRef, isVisible: scheduleVisible } = useScrollAnimation();
  const { ref: patientsRef, isVisible: patientsVisible } = useScrollAnimation();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollAnimation();

  const todayAppointments = useCountUp({ end: 8, isVisible: statsVisible, duration: 1500 });
  const totalPatients = useCountUp({ end: 156, isVisible: statsVisible, duration: 2000 });
  const rating = useCountUp({ end: 48, isVisible: statsVisible, duration: 2000 });

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, Dr. {user.name}
        </h1>
        <p className="text-blue-100">
          Here's what's happening with your practice today
        </p>
      </div>

      {/* Quick Stats */}
      <div ref={statsRef} className={`grid md:grid-cols-4 gap-6 animate-fade-up ${statsVisible ? 'visible' : ''}`}>
        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +12 this month
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦245,000</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(rating / 10).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Based on 89 reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card ref={scheduleRef} className={`animate-fade-up ${scheduleVisible ? 'visible' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your appointments for today</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '09:00 AM', patient: 'John Doe', type: 'Consultation', status: 'confirmed' },
                { time: '10:30 AM', patient: 'Jane Smith', type: 'Follow-up', status: 'confirmed' },
                { time: '11:00 AM', patient: 'Mike Johnson', type: 'Check-up', status: 'pending' },
                { time: '02:00 PM', patient: 'Sarah Wilson', type: 'Consultation', status: 'confirmed' },
                { time: '03:30 PM', patient: 'Available Slot', type: 'Open', status: 'available' },
              ].map((appointment, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.time}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{appointment.patient}</div>
                      <div className="text-xs text-gray-500">{appointment.type}</div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      appointment.status === 'confirmed' ? 'default' :
                      appointment.status === 'pending' ? 'secondary' :
                      'outline'
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card ref={patientsRef} className={`animate-fade-up ${patientsVisible ? 'visible' : ''}`}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: CheckCircle,
                  message: 'Appointment with John Doe completed',
                  time: '2 hours ago',
                  type: 'success'
                },
                {
                  icon: Calendar,
                  message: 'New appointment booked for tomorrow',
                  time: '4 hours ago',
                  type: 'info'
                },
                {
                  icon: AlertCircle,
                  message: 'Subscription expires in 7 days',
                  time: '1 day ago',
                  type: 'warning'
                },
                {
                  icon: Users,
                  message: 'New patient registered',
                  time: '2 days ago',
                  type: 'info'
                },
              ].map((activity, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className={`
                    p-2 rounded-full
                    ${activity.type === 'success' ? 'bg-green-100 text-green-600' :
                      activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'}
                  `}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card ref={actionsRef} className={`animate-fade-up ${actionsVisible ? 'visible' : ''}`}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Manage Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>View Patients</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Clock className="h-6 w-6" />
              <span>Set Availability</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <DollarSign className="h-6 w-6" />
              <span>Update Pricing</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
