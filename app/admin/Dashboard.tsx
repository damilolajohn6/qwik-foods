"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";

type QuickStat = {
  totalMenuItems: number;
  totalOrders: number;
  totalUsers: number;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<QuickStat>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: status === "authenticated" && session?.user.role === "admin",
  });

  if (status === "loading") return <Skeleton className="h-screen w-full" />;
  if (status === "unauthenticated" || session?.user.role !== "admin")
    redirect("/auth/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile toggle button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static z-50 transition-transform duration-300 
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          } 
          bg-white shadow-md md:shadow-none w-64 h-full`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        {/* Title for desktop */}
        <h1 className="hidden md:block text-3xl font-bold mb-6">
          Admin Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : error ? (
                "Error loading data"
              ) : (
                stats?.totalMenuItems
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : error ? (
                "Error loading data"
              ) : (
                stats?.totalOrders
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : error ? (
                "Error loading data"
              ) : (
                stats?.totalUsers
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p>Overview of recent activities will go here.</p>
          </TabsContent>
          <TabsContent value="stats">
            <p>Detailed stats will be implemented with charts.</p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
