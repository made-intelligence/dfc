'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, User, Calendar, Search, Plus, Edit, Eye } from 'lucide-react';

interface MedicalRecord {
  id: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medications: string;
  followUpDate: string;
  notes: string;
  createdAt: string;
  appointment: {
    appointmentDate: string;
    patient: {
      name: string;
      email: string;
    };
  };
}

interface NewRecord {
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medications: string;
  followUpDate: string;
  notes: string;
}

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableAppointments, setAvailableAppointments] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState<NewRecord>({
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    medications: '',
    followUpDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchAvailableAppointments();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/doctor/records');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAppointments = async () => {
    try {
      const response = await fetch('/api/doctor/records/available-appointments');
      if (response.ok) {
        const data = await response.json();
        setAvailableAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleCreateRecord = async () => {
    try {
      const response = await fetch('/api/doctor/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });

      if (response.ok) {
        fetchRecords();
        fetchAvailableAppointments();
        setShowCreateForm(false);
        setNewRecord({
          appointmentId: '',
          diagnosis: '',
          symptoms: '',
          treatment: '',
          medications: '',
          followUpDate: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const filteredRecords = records.filter(record =>
    record.appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Medical Records</h1>
          <p className="text-gray-600">Manage patient medical records and treatment history</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Record
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search records by patient name, diagnosis, or symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{record.appointment.patient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(record.appointment.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="font-medium text-sm">Diagnosis: </span>
                      <span className="text-sm">{record.diagnosis}</span>
                    </div>
                    {record.symptoms && (
                      <div>
                        <span className="font-medium text-sm">Symptoms: </span>
                        <span className="text-sm text-gray-600">{record.symptoms}</span>
                      </div>
                    )}
                    {record.treatment && (
                      <div>
                        <span className="font-medium text-sm">Treatment: </span>
                        <span className="text-sm text-gray-600">{record.treatment}</span>
                      </div>
                    )}
                  </div>

                  {record.medications && (
                    <div className="mb-3">
                      <span className="font-medium text-sm">Medications: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(record.medications).map((med: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {med}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.followUpDate && (
                    <div className="text-sm">
                      <span className="font-medium">Follow-up: </span>
                      <span className="text-blue-600">
                        {new Date(record.followUpDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRecords.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Medical records will appear here once you create them for completed appointments'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Record Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Create Medical Record
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Appointment</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newRecord.appointmentId}
                  onChange={(e) => setNewRecord({ ...newRecord, appointmentId: e.target.value })}
                >
                  <option value="">Select an appointment</option>
                  {availableAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.patient.name} - {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Diagnosis *</Label>
                <Input
                  value={newRecord.diagnosis}
                  onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                  placeholder="Enter diagnosis"
                />
              </div>

              <div>
                <Label>Symptoms</Label>
                <Textarea
                  value={newRecord.symptoms}
                  onChange={(e) => setNewRecord({ ...newRecord, symptoms: e.target.value })}
                  placeholder="Describe symptoms"
                />
              </div>

              <div>
                <Label>Treatment</Label>
                <Textarea
                  value={newRecord.treatment}
                  onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                  placeholder="Treatment provided"
                />
              </div>

              <div>
                <Label>Medications (comma-separated)</Label>
                <Input
                  value={newRecord.medications}
                  onChange={(e) => setNewRecord({ ...newRecord, medications: e.target.value })}
                  placeholder="e.g., Paracetamol 500mg, Amoxicillin 250mg"
                />
              </div>

              <div>
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={newRecord.followUpDate}
                  onChange={(e) => setNewRecord({ ...newRecord, followUpDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateRecord} disabled={!newRecord.appointmentId || !newRecord.diagnosis}>
                  Create Record
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Medical Record Details
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Patient Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedRecord.appointment.patient.name}</div>
                    <div><span className="font-medium">Date:</span> {new Date(selectedRecord.appointment.appointmentDate).toLocaleDateString()}</div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedRecord.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Diagnosis</h4>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRecord.diagnosis}</p>
              </div>

              {selectedRecord.symptoms && (
                <div>
                  <h4 className="font-semibold mb-2">Symptoms</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRecord.symptoms}</p>
                </div>
              )}

              {selectedRecord.treatment && (
                <div>
                  <h4 className="font-semibold mb-2">Treatment</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRecord.treatment}</p>
                </div>
              )}

              {selectedRecord.medications && (
                <div>
                  <h4 className="font-semibold mb-2">Medications</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedRecord.medications).map((med: string, index: number) => (
                      <Badge key={index} variant="outline">{med}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.followUpDate && (
                <div>
                  <h4 className="font-semibold mb-2">Follow-up Date</h4>
                  <p className="text-sm text-blue-600">{new Date(selectedRecord.followUpDate).toLocaleDateString()}</p>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRecord.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}