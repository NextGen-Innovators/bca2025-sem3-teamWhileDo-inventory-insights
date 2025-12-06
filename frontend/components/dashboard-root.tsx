"use client";

import React from "react";
import { DashboardProvider } from "./context/dashboard-context";
import AdminDashboard from "./admin-dashboard";

export default function DashboardRoot() {
  return (
    <DashboardProvider>
      <AdminDashboard />
    </DashboardProvider>
  );
}
