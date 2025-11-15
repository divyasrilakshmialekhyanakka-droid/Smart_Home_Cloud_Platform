import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, RefreshCw, UserPlus, Shield, Home, Wrench } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users?.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        user.email?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "homeowner":
        return Home;
      case "iot_team":
        return Wrench;
      case "cloud_staff":
        return Shield;
      default:
        return Users;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "cloud_staff":
        return "destructive";
      case "iot_team":
        return "default";
      case "homeowner":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground" data-testid="text-user-management-title">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts and role assignments
          </p>
        </div>
        <Button data-testid="button-add-user">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-users">
              {users?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Homeowners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users?.filter((u) => u.role === "homeowner").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IoT Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users?.filter((u) => u.role === "iot_team").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cloud Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users?.filter((u) => u.role === "cloud_staff").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="homeowner">Homeowner</SelectItem>
                <SelectItem value="iot_team">IoT Team</SelectItem>
                <SelectItem value="cloud_staff">Cloud Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" data-testid="button-refresh-users">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-4">User</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role || "homeowner");
                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-2 items-center py-3 border-b last:border-0 hover-elevate rounded-md px-2"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm">{user.email}</div>
                    <div className="col-span-2">
                      <Badge variant={getRoleBadgeVariant(user.role || "homeowner") as any}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {user.role?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">
                      {new Date(user.createdAt!).toLocaleDateString()}
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${user.id}`}>
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
