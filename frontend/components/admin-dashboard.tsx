"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut } from "lucide-react";
import IssuesList from "./issues-list";
import EmailsList from "./EmailsList"; // Add this import
import AddEmployeeForm from "./add-employee-form";
import { signOut, useSession } from "next-auth/react";
import { useGetUser } from "@/lib/apis/useUser";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (isLoadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.company_name || "Admin Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.name || "Admin"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues Section */}
          <div className="lg:col-span-2">
            <IssuesList />
          </div>

          {/* Sidebar */}
          <div>
          <EmailsList /> {/* Add this component */}

            {/* You can add more sidebar components here */}
          </div>
        </div>
      </main>
    </div>
  );
}