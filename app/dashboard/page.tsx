// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name}! Here's what's happening with your fleet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-905 dark:text-white">24</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Trips Running</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-905 dark:text-white">12</div>
              <p className="text-xs text-red-500">3 delayed</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Drivers On Duty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-905 dark:text-white">18</div>
              <p className="text-xs text-green-600">6 available</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Cost (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-905 dark:text-white">$12,450</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
            <CardDescription>Latest fleet operations updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display yet. Start by creating your first trip or registering a vehicle.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
