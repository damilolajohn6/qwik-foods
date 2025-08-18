"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart } from "@/components/admin/Chart"; 

type Stats = {
  totalMenuItems: number;
  totalOrders: number;
  totalUsers: number;
  ordersByStatus: { [key: string]: number };
  salesByDay: { date: string; total: number }[];
};

export default function AdminStats() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<Stats>({
    queryKey: ["adminStatsDetailed"],
    queryFn: async () => {
      const res = await fetch("/api/stats/detailed");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error loading stats</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Stats</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="pie"
              data={Object.entries(stats?.ordersByStatus || {}).map(
                ([label, value]) => ({ label, value })
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="line"
              data={
                stats?.salesByDay.map((d) => ({ x: d.date, y: d.total })) || []
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
