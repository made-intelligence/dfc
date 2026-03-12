"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";

const CATEGORY_LABELS: Record<string, string> = {
  MEMBER: "Full Member",
  ASSOCIATE_MEMBER: "Associate Member",
  HONORARY_MEMBER: "Honorary Member",
  LEGACY_MEMBER: "Legacy Member",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-800",
  REVOKED: "bg-gray-100 text-gray-600",
};

const PATH_LABELS: Record<string, string> = {
  diaspora: "Diaspora Physician",
  local_specialist: "Nigeria-Based Specialist",
  associate: "Associate Member",
  legacy_whatsapp: "Legacy WhatsApp Migration",
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchMemberDetails(params.id as string);
    }
  }, [params.id]);

  const fetchMemberDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMember(data);
      }
    } catch (error) {
      console.error("Failed to fetch member details:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (updates: Record<string, any>) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        fetchMemberDetails(params.id as string);
        addToast({ type: "success", title: "Updated", description: "Member record updated successfully" });
      }
    } catch {
      addToast({ type: "error", title: "Error", description: "Failed to update member" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loading type="pulse" size="lg" />;
  }

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Member not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  const dp = member.doctorProfile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Member Details</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0D1F3C] flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold">
                    {member.name?.charAt(0) || "?"}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {dp?.title ? `${dp.title} ` : ""}{member.name}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={STATUS_COLORS[member.memberStatus] || "bg-gray-100"}>
                      {member.memberStatus}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[member.category] || member.category}
                    </Badge>
                    {member.excoPosition && (
                      <Badge className="bg-purple-100 text-purple-800">
                        {member.excoPosition}
                      </Badge>
                    )}
                    {member.isBotMember && (
                      <Badge className="bg-blue-100 text-blue-800">BOT Member</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="break-all">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{member.phone || "Not provided"}</span>
                </div>
                {member.memberNumber && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span>{member.memberNumber}</span>
                  </div>
                )}
                {member.path && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{PATH_LABELS[member.path] || member.path}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional details */}
          {dp && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Specialty</span>
                    <p className="font-medium">{dp.specialty?.name || "Not set"}</p>
                  </div>
                  {dp.subSpecialty && (
                    <div>
                      <span className="text-gray-500">Sub-specialty</span>
                      <p className="font-medium">{dp.subSpecialty}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Institution</span>
                    <p className="font-medium">{dp.institution || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location</span>
                    <p className="font-medium">
                      {dp.city || "—"}{dp.country ? `, ${dp.country}` : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Experience</span>
                    <p className="font-medium">{dp.experience} years</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Consultation Fee</span>
                    <p className="font-medium">
                      {Number(dp.consultationFee) > 0
                        ? `₦${Number(dp.consultationFee).toLocaleString()}`
                        : "Not set"}
                    </p>
                  </div>
                  {dp.mdcnNumber && (
                    <div>
                      <span className="text-gray-500">MDCN Number</span>
                      <p className="font-medium">{dp.mdcnNumber}</p>
                    </div>
                  )}
                  {dp.diasporaLicence && (
                    <div>
                      <span className="text-gray-500">Diaspora Licence</span>
                      <p className="font-medium">{dp.diasporaLicence}</p>
                    </div>
                  )}
                </div>
                {dp.bio && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">Bio</span>
                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">{dp.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Endorsements */}
          {member.endorsements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Peer Endorsements ({member.endorsements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.endorsements.map((e: any) => (
                    <div key={e.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{e.endorserName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{e.relationshipType}</p>
                      <p className="text-sm text-gray-700">{e.statement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Good Standing</span>
                {member.goodStanding ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Dues Status</span>
                <Badge variant="outline" className="text-xs">
                  {member.duesStatus || "NOT_YET_DUE"}
                </Badge>
              </div>
              {member.duesPaidAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Payment</span>
                  <span className="text-sm font-medium">
                    ₦{Number(member.duesPaidAmount).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm">Joined</span>
                <span className="text-sm text-gray-600">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {member.memberStatus === "PENDING" && (
                <Button
                  className="w-full"
                  size="sm"
                  disabled={updating}
                  onClick={() => updateMember({ status: "ACTIVE" })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Member
                </Button>
              )}
              {member.memberStatus === "ACTIVE" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  size="sm"
                  disabled={updating}
                  onClick={() => updateMember({ status: "SUSPENDED" })}
                >
                  Suspend Member
                </Button>
              )}
              {member.memberStatus === "SUSPENDED" && (
                <Button
                  className="w-full"
                  size="sm"
                  disabled={updating}
                  onClick={() => updateMember({ status: "ACTIVE" })}
                >
                  Reinstate Member
                </Button>
              )}
              {!member.goodStanding && (
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={updating}
                  onClick={() => updateMember({ goodStanding: true })}
                >
                  Mark Good Standing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Assigned cases */}
          {member.assignedCases?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Second Opinion Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {member.assignedCases.map((c: any) => (
                    <div key={c.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{c.reference}</span>
                        <Badge variant="outline" className="text-xs">{c.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.specialty}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Initiatives */}
          {member.initiatives?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Committees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {member.initiatives.map((i: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{i.name}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{i.type}</Badge>
                        <Badge variant="outline" className="text-xs">{i.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
