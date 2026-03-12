"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, Edit, Trash2, Save, X, Video, MapPin, Users2 } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";

interface Schedule {
  id: string;
  title?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  scheduleType: 'AVAILABLE' | 'BLOCKED' | 'HOLIDAY' | 'EMERGENCY';
  isRecurring: boolean;
  maxBookingsPerSlot: number;
  consultationMode: 'VIDEO' | 'IN_PERSON' | 'BOTH';
  location?: string;
  notes?: string;
  color?: string;
}

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  VIDEO: { label: "Video", color: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PERSON: { label: "In-Person", color: "bg-green-50 text-green-700 border-green-200" },
  BOTH: { label: "Video + In-Person", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function SchedulePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [consultationFee, setConsultationFee] = useState("");
  const [consultationFeeNote, setConsultationFeeNote] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    bufferTime: 0,
    scheduleType: 'AVAILABLE' as const,
    isRecurring: true,
    maxBookingsPerSlot: 1,
    consultationMode: 'VIDEO' as 'VIDEO' | 'IN_PERSON' | 'BOTH',
    location: "",
    notes: "",
    color: "#3B82F6"
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/doctor/schedule");
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules);
        if (data.consultationFee && data.consultationFee !== "0") {
          setConsultationFee(data.consultationFee);
        }
        if (data.consultationFeeNote) {
          setConsultationFeeNote(data.consultationFeeNote);
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      const res = await fetch("/api/doctor/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationFee: parseFloat(consultationFee) || 0,
          consultationFeeNote,
        }),
      });
      if (res.ok) {
        addToast({ title: "Pricing saved", type: "success" });
      } else {
        addToast({ title: "Failed to save pricing", type: "error" });
      }
    } catch {
      addToast({ title: "Failed to save pricing", type: "error" });
    } finally {
      setSavingPricing(false);
    }
  };

  const handleSaveSchedule = async (schedule: Partial<Schedule>) => {
    try {
      const method = schedule.id ? "PUT" : "POST";
      const response = await fetch("/api/doctor/schedule", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      if (response.ok) {
        fetchSchedules();
        setEditingId(null);
        if (!schedule.id) {
          setNewSchedule({
            title: "",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "17:00",
            slotDuration: 30,
            bufferTime: 0,
            scheduleType: 'AVAILABLE' as const,
            isRecurring: true,
            maxBookingsPerSlot: 1,
            consultationMode: 'VIDEO' as 'VIDEO' | 'IN_PERSON' | 'BOTH',
            location: "",
            notes: "",
            color: "#3B82F6"
          });
        }
        addToast({
          title: schedule.id ? "Schedule Updated" : "Schedule Added",
          description: schedule.id ? "Your schedule has been updated successfully." : "New schedule block added successfully.",
          type: "success",
        });
      } else {
        addToast({
          title: "Error",
          description: "Failed to save schedule. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      addToast({
        title: "Error",
        description: "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/doctor/schedule?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSchedules();
        addToast({
          title: "Schedule Deleted",
          description: "Schedule block removed successfully.",
          type: "success",
        });
      } else {
        addToast({
          title: "Error",
          description: "Failed to delete schedule.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      addToast({
        title: "Error",
        description: "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Schedule Management</h1>
          <p className="text-gray-600">
            Create flexible schedule blocks. Use different types: Available (bookable), Blocked (lunch/breaks), Holiday, or Emergency slots.
          </p>
        </div>
      </div>

      {/* Consultation Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Consultation Pricing</h2>
        <p className="text-sm text-gray-500 mb-4">Set your consultation fee. Patients will see this when booking.</p>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Consultation fee (&#8358;)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
            />
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fee note (optional)
            </label>
            <input
              type="text"
              value={consultationFeeNote}
              onChange={(e) => setConsultationFeeNote(e.target.value)}
              placeholder="e.g. Fee varies — confirm at booking"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
            />
          </div>
          <button
            onClick={handleSavePricing}
            disabled={savingPricing}
            className="px-6 py-2.5 rounded-lg bg-[#0D1F3C] text-white text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50"
          >
            {savingPricing ? "Saving..." : "Save pricing"}
          </button>
        </div>

        {consultationFee && (
          <p className="text-sm text-gray-500 mt-3">
            Patients will see: <span className="font-medium text-gray-700">&#8358;{Number(consultationFee).toLocaleString()}</span>
            {consultationFeeNote && <span> &mdash; {consultationFeeNote}</span>}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Title (Optional)</Label>
                <Input
                  placeholder="e.g., Morning Clinic, Lunch Break"
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Day</Label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
                  value={newSchedule.dayOfWeek}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      dayOfWeek: parseInt(e.target.value),
                    })
                  }
                >
                  {DAYS.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
                  value={newSchedule.scheduleType}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, scheduleType: e.target.value as any })
                  }
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newSchedule.startTime}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newSchedule.endTime}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, endTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Slot Duration</Label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
                  value={newSchedule.slotDuration}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, slotDuration: parseInt(e.target.value) })
                  }
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
              <div>
                <Label>Buffer Time</Label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
                  value={newSchedule.bufferTime}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, bufferTime: parseInt(e.target.value) })
                  }
                >
                  <option value={0}>No buffer</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                </select>
              </div>
            </div>

            {/* Consultation Mode & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Consultation Mode</Label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
                  value={newSchedule.consultationMode}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, consultationMode: e.target.value as 'VIDEO' | 'IN_PERSON' | 'BOTH' })
                  }
                >
                  <option value="VIDEO">Video (Teleconsult)</option>
                  <option value="IN_PERSON">In-Person (Physical Clinic)</option>
                  <option value="BOTH">Both (Patient Chooses)</option>
                </select>
              </div>
              {(newSchedule.consultationMode === 'IN_PERSON' || newSchedule.consultationMode === 'BOTH') && (
                <div>
                  <Label>Clinic Location / Address</Label>
                  <Input
                    placeholder="e.g. Suite 4, Reddington Hospital, Victoria Island, Lagos"
                    value={newSchedule.location}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, location: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => handleSaveSchedule(newSchedule)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule Block
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
              const daySchedules = schedules.filter(
                (s) => s.dayOfWeek === dayIndex,
              );

              return (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{day}</h3>

                  {daySchedules.length === 0 ? (
                    <p className="text-gray-500 text-sm">No schedule set</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                        >
                          {editingId === schedule.id ? (
                            <EditScheduleForm
                              schedule={schedule}
                              onSave={handleSaveSchedule}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-4">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: schedule.color || '#3B82F6' }}
                                />
                                <div>
                                  <div className="font-medium">
                                    {schedule.title || `${schedule.startTime} - ${schedule.endTime}`}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {schedule.startTime} - {schedule.endTime}
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  {schedule.slotDuration}min
                                </Badge>
                                <Badge
                                  variant={
                                    schedule.scheduleType === 'AVAILABLE' ? "default" :
                                    schedule.scheduleType === 'BLOCKED' ? "secondary" :
                                    schedule.scheduleType === 'HOLIDAY' ? "destructive" : "outline"
                                  }
                                >
                                  {schedule.scheduleType.toLowerCase()}
                                </Badge>
                                {schedule.consultationMode && (
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${MODE_LABELS[schedule.consultationMode]?.color || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                    {schedule.consultationMode === 'VIDEO' && <Video className="w-3 h-3" />}
                                    {schedule.consultationMode === 'IN_PERSON' && <MapPin className="w-3 h-3" />}
                                    {schedule.consultationMode === 'BOTH' && <Users2 className="w-3 h-3" />}
                                    {MODE_LABELS[schedule.consultationMode]?.label || schedule.consultationMode}
                                  </span>
                                )}
                                {schedule.location && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {schedule.location}
                                  </span>
                                )}
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
                                  onClick={() =>
                                    handleDeleteSchedule(schedule.id)
                                  }
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
  onCancel,
}: {
  schedule: Schedule;
  onSave: (schedule: Schedule) => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState(schedule);

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Title"
          value={editData.title || ''}
          onChange={(e) =>
            setEditData({ ...editData, title: e.target.value })
          }
          className="flex-1"
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={editData.scheduleType}
          onChange={(e) =>
            setEditData({ ...editData, scheduleType: e.target.value as any })
          }
        >
          <option value="AVAILABLE">Available</option>
          <option value="BLOCKED">Blocked</option>
          <option value="HOLIDAY">Holiday</option>
          <option value="EMERGENCY">Emergency</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="time"
          value={editData.startTime}
          onChange={(e) =>
            setEditData({ ...editData, startTime: e.target.value })
          }
          className="w-24"
        />
        <span>-</span>
        <Input
          type="time"
          value={editData.endTime}
          onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
          className="w-24"
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={editData.slotDuration}
          onChange={(e) =>
            setEditData({ ...editData, slotDuration: parseInt(e.target.value) })
          }
        >
          <option value={15}>15min</option>
          <option value={30}>30min</option>
          <option value={45}>45min</option>
          <option value={60}>60min</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={editData.consultationMode}
          onChange={(e) =>
            setEditData({ ...editData, consultationMode: e.target.value as any })
          }
        >
          <option value="VIDEO">Video</option>
          <option value="IN_PERSON">In-Person</option>
          <option value="BOTH">Both</option>
        </select>
        {(editData.consultationMode === 'IN_PERSON' || editData.consultationMode === 'BOTH') && (
          <Input
            placeholder="Clinic location"
            value={editData.location || ''}
            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
            className="flex-1"
          />
        )}
        <Button size="sm" onClick={() => onSave(editData)}>
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
