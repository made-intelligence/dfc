"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading";

interface MemberData {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  category: string;
  memberStatus: string;
  goodStanding: boolean;
  path: string | null;
  memberNumber: string | null;
  duesStatus: string;
  excoPosition: string | null;
  isBotMember: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-800",
  REVOKED: "bg-gray-100 text-gray-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  MEMBER: "Full Member",
  ASSOCIATE_MEMBER: "Associate",
  HONORARY_MEMBER: "Honorary",
  LEGACY_MEMBER: "Legacy",
};

const PATH_LABELS: Record<string, string> = {
  diaspora: "Diaspora",
  local_specialist: "Nigeria Specialist",
  associate: "Associate",
  legacy: "Legacy (WhatsApp)",
};

export default function MembersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [members, setMembers] = useState<MemberData[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    newThisMonth: 0,
    categoryBreakdown: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [searchTerm, statusFilter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      setMembers(data.users || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["", "ACTIVE", "PENDING", "SUSPENDED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Members</h1>
        <p className="text-gray-600 text-sm">
          Manage DFC members — diaspora physicians, local specialists, and associates
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-[#0D1F3C]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-700">{stats.activeMembers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-amber-700">{stats.pendingMembers}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
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
              <UserPlus className="h-8 w-8 text-[#0A4A50]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === s
                      ? "bg-[#0D1F3C] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} />
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No members found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors gap-3"
                  onClick={() => router.push(`/admin/users/${member.id}`)}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 bg-[#0D1F3C] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        {member.memberNumber && (
                          <span className="text-xs font-mono text-gray-400">
                            {member.memberNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge
                          className={`text-xs ${STATUS_COLORS[member.memberStatus] || "bg-gray-100 text-gray-600"}`}
                        >
                          {member.memberStatus}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[member.category] || member.category}
                        </Badge>
                        {member.path && (
                          <span className="text-xs text-gray-500">
                            {PATH_LABELS[member.path] || member.path}
                          </span>
                        )}
                        {member.excoPosition && (
                          <Badge className="text-xs bg-[#0D1F3C] text-white">
                            {member.excoPosition.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {member.isBotMember && (
                          <Badge className="text-xs bg-[#0A4A50] text-white">BOT</Badge>
                        )}
                        {member.goodStanding && (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:block shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/users/${member.id}`);
                    }}
                  >
                    View
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
