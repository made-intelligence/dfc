'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isActive: true
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/doctor/schedule');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (schedule: Partial<Schedule>) => {
    try {
      const method = schedule.id ? 'PUT' : 'POST';
      const response = await fetch('/api/doctor/schedule', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });

      if (response.ok) {
        fetchSchedules();
        setEditingId(null);
        if (!schedule.id) {
          setNewSchedule({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true });
        }
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/doctor/schedule?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Schedule Management</h1>
          <p className="text-gray-600">Manage your availability and working hours</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Day</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={newSchedule.dayOfWeek}
                onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(e.target.value) })}
              >
                {DAYS.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => handleSaveSchedule(newSchedule)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Schedule
          </CardTitle>
          <CardDescription>Your weekly availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS.map((day, dayIndex) => {
              const daySchedules = schedules.filter(s => s.dayOfWeek === dayIndex);
              
              return (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{day}</h3>
                  
                  {daySchedules.length === 0 ? (
                    <p className="text-gray-500 text-sm">No schedule set</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          {editingId === schedule.id ? (
                            <EditScheduleForm
                              schedule={schedule}
                              onSave={handleSaveSchedule}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-4">
                                <span className="font-medium">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                                <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                                  {schedule.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(schedule.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditScheduleForm({ 
  schedule, 
  onSave, 
  onCancel 
}: { 
  schedule: Schedule; 
  onSave: (schedule: Schedule) => void; 
  onCancel: () => void; 
}) {
  const [editData, setEditData] = useState(schedule);

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        type="time"
        value={editData.startTime}
        onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
        className="w-24"
      />
      <span>-</span>
      <Input
        type="time"
        value={editData.endTime}
        onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
        className="w-24"
      />
      <Switch
        checked={editData.isActive}
        onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
      />
      <Button size="sm" onClick={() => onSave(editData)}>
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}