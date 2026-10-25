"use client";

import { useState, useEffect, type ReactNode } from "react";
import { formatWatRange, WAT_LABEL, WAT_LONG_LABEL } from "@/lib/wat";
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
  validFrom?: string | null;
  validUntil?: string | null;
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

/** "2026-12-25" -> "Fri, 25 Dec 2026" */
const formatYmd = (ymd: string) =>
  new Date(`${ymd.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const dateRangeLabel = (s: Schedule) => {
  if (!s.validFrom) return "";
  const from = s.validFrom.slice(0, 10);
  const until = s.validUntil?.slice(0, 10);
  return until && until !== from ? `${formatYmd(from)} – ${formatYmd(until)}` : formatYmd(from);
};

/**
 * A doctor's schedule blocks and consultation fee. The doctor edits their own
 * (apiUrl /api/doctor/schedule); the secretariat edits a doctor's through the
 * admin API, passing doctorName so the wording is about that doctor.
 */
export default function ScheduleManager({
  apiUrl,
  doctorName,
  header,
}: {
  apiUrl: string;
  doctorName?: string;
  header?: ReactNode;
}) {
  const whose = doctorName ? `${doctorName}'s` : "your";
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
    scheduleType: 'AVAILABLE' as Schedule['scheduleType'],
    isRecurring: true,
    maxBookingsPerSlot: 1,
    validFrom: "",
    validUntil: "",
    consultationMode: 'VIDEO' as 'VIDEO' | 'IN_PERSON' | 'BOTH',
    location: "",
    notes: "",
    color: "#3B82F6"
  });

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(apiUrl);
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
      const res = await fetch(apiUrl, {
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
      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...schedule,
          validFrom: schedule.validFrom ? schedule.validFrom.slice(0, 10) : null,
          validUntil: schedule.validUntil ? schedule.validUntil.slice(0, 10) : null,
        }),
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
            scheduleType: 'AVAILABLE' as Schedule['scheduleType'],
            isRecurring: true,
            maxBookingsPerSlot: 1,
    validFrom: "",
    validUntil: "",
            consultationMode: 'VIDEO' as 'VIDEO' | 'IN_PERSON' | 'BOTH',
            location: "",
            notes: "",
            color: "#3B82F6"
          });
        }
        addToast({
          title: schedule.id ? "Schedule Updated" : "Schedule Added",
          description: schedule.id ? "The schedule has been updated successfully." : "New schedule block added successfully.",
          type: "success",
        });
      } else {
        const data = await response.json().catch(() => ({}));
        addToast({
          title: "Couldn't save schedule",
          description: data.error || "Failed to save schedule. Please try again.",
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
    if (!window.confirm("Delete this schedule block?")) return;
    try {
      const response = await fetch(`${apiUrl}?id=${encodeURIComponent(id)}`, {
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

  const datedSchedules = schedules
    .filter((s) => !s.isRecurring)
    .sort((a, b) => (a.validFrom || "").localeCompare(b.validFrom || "") || a.startTime.localeCompare(b.startTime));

  const renderRow = (schedule: Schedule) => (
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
                                    {formatWatRange(schedule.startTime, schedule.endTime)}
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  {schedule.slotDuration}min
                                </Badge>
                                {schedule.bufferTime > 0 && (
                                  <Badge variant="outline">+{schedule.bufferTime}min buffer</Badge>
                                )}
                                {schedule.maxBookingsPerSlot > 1 && (
                                  <Badge variant="outline">{schedule.maxBookingsPerSlot} per slot</Badge>
                                )}
                                {!schedule.isRecurring && schedule.validFrom && (
                                  <Badge variant="outline">{dateRangeLabel(schedule)}</Badge>
                                )}
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
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {header ?? (
            <h1 className="text-2xl font-bold text-[#0D1F3C]">Schedule Management</h1>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Create flexible schedule blocks. Use different types: Available (bookable), Blocked (lunch/breaks), Holiday, or Emergency slots.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6E75]/10 px-3 py-1.5 text-sm font-medium text-[#0A6E75]">
            All times are {WAT_LONG_LABEL}, wherever you are. Patients book and see these same times.
          </p>
        </div>
      </div>

      {/* Consultation Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Consultation Pricing</h2>
        <p className="text-sm text-gray-500 mb-4">Set {whose} consultation fee. Patients will see this when booking.</p>

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
                <Label>Repeats</Label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base"
                  value={newSchedule.isRecurring ? "weekly" : "dates"}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, isRecurring: e.target.value === "weekly" })
                  }
                >
                  <option value="weekly">Every week</option>
                  <option value="dates">Specific date(s) only</option>
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

            {newSchedule.isRecurring ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>From date</Label>
                  <Input
                    type="date"
                    value={newSchedule.validFrom}
                    onChange={(e) => setNewSchedule({ ...newSchedule, validFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label>To date (optional)</Label>
                  <Input
                    type="date"
                    min={newSchedule.validFrom || undefined}
                    value={newSchedule.validUntil}
                    onChange={(e) => setNewSchedule({ ...newSchedule, validUntil: e.target.value })}
                  />
                </div>
                <p className="text-sm text-gray-500 md:self-end md:pb-2">
                  For a whole day off, use type Holiday with 00:00 – 23:59.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Start Time ({WAT_LABEL})</Label>
                <Input
                  type="time"
                  value={newSchedule.startTime}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Time ({WAT_LABEL})</Label>
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
              <div>
                <Label>Patients per slot</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newSchedule.maxBookingsPerSlot}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, maxBookingsPerSlot: parseInt(e.target.value) || 1 })
                  }
                />
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
          <CardDescription>{doctorName ? `${doctorName}'s` : "Your"} weekly availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS.map((day, dayIndex) => {
              const daySchedules = schedules.filter(
                (s) => s.isRecurring && s.dayOfWeek === dayIndex,
              );

              return (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{day}</h3>

                  {daySchedules.length === 0 ? (
                    <p className="text-gray-500 text-sm">No schedule set</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules.map(renderRow)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Specific Dates
          </CardTitle>
          <CardDescription>
            One-off changes such as days off, leave or an extra clinic. These override {whose} weekly schedule on those dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datedSchedules.length === 0 ? (
            <p className="text-gray-500 text-sm">No date-specific blocks</p>
          ) : (
            <div className="space-y-2">{datedSchedules.map(renderRow)}</div>
          )}
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
      <div className="flex flex-wrap items-center gap-2">
        {editData.isRecurring ? (
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={editData.dayOfWeek}
          onChange={(e) =>
            setEditData({ ...editData, dayOfWeek: parseInt(e.target.value) })
          }
        >
          {DAYS.map((day, index) => (
            <option key={index} value={index}>
              {day}
            </option>
          ))}
        </select>
        ) : (
          <>
            <Input
              type="date"
              value={editData.validFrom?.slice(0, 10) || ""}
              onChange={(e) => setEditData({ ...editData, validFrom: e.target.value })}
              className="w-40"
            />
            <span>to</span>
            <Input
              type="date"
              min={editData.validFrom?.slice(0, 10) || undefined}
              value={editData.validUntil?.slice(0, 10) || ""}
              onChange={(e) => setEditData({ ...editData, validUntil: e.target.value })}
              className="w-40"
            />
          </>
        )}
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
        <span className="text-sm text-gray-500">{WAT_LABEL}</span>
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
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={editData.bufferTime}
          onChange={(e) =>
            setEditData({ ...editData, bufferTime: parseInt(e.target.value) })
          }
        >
          <option value={0}>No buffer</option>
          <option value={5}>5min buffer</option>
          <option value={10}>10min buffer</option>
          <option value={15}>15min buffer</option>
        </select>
        <Input
          type="number"
          min={1}
          max={20}
          title="Patients per slot"
          value={editData.maxBookingsPerSlot}
          onChange={(e) => setEditData({ ...editData, maxBookingsPerSlot: parseInt(e.target.value) || 1 })}
          className="w-20"
        />
        <span className="text-sm text-gray-500">per slot</span>
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
