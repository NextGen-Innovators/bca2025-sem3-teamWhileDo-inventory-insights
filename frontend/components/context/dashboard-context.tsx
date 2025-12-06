"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

export interface Employee {
  id: string;
  name: string;
  email: string;
  skills: string[];
  bio: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "finished";
  assignedTo?: string;
}

export interface Company {
  name: string;
  about: string;
}

export interface DashboardContextType {
  // Auth
  isLoggedIn: boolean;
  userRole: "admin" | "employee" | null;
  login: (email: string, password: string) => void;
  logout: () => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  company: Company | null;
  completeOnboarding: (company: Company) => void;

  // Company data
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "id">) => void;

  // Issues
  issues: Issue[];
  addIssue: (issue: Omit<Issue, "id">) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "employee" | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  const login = (email: string, password: string) => {
    setIsLoggedIn(true);
    setUserRole(email === "admin@example.com" ? "admin" : "employee");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setHasCompletedOnboarding(false);
    setCompany(null);
    setEmployees([]);
    setIssues([]);
  };

  const completeOnboarding = (companyData: Company) => {
    setCompany(companyData);
    setHasCompletedOnboarding(true);
    // Add demo issues
    setIssues([
      {
        id: "1",
        title: "Fix login bug",
        description: "Users unable to login with special characters",
        status: "in-progress",
      },
      {
        id: "2",
        title: "Design new landing page",
        description: "Create modern landing page design",
        status: "todo",
      },
      {
        id: "3",
        title: "Setup CI/CD pipeline",
        description: "Configure automatic deployment",
        status: "finished",
      },
    ]);
  };

  const addEmployee = (employee: Omit<Employee, "id">) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
    };
    setEmployees([...employees, newEmployee]);
  };

  const addIssue = (issue: Omit<Issue, "id">) => {
    const newIssue: Issue = {
      ...issue,
      id: Date.now().toString(),
    };
    setIssues([...issues, newIssue]);
  };

  const updateIssue = (id: string, updates: Partial<Issue>) => {
    setIssues(
      issues.map((issue) =>
        issue.id === id ? { ...issue, ...updates } : issue
      )
    );
  };

  const deleteIssue = (id: string) => {
    setIssues(issues.filter((issue) => issue.id !== id));
  };

  return (
    <DashboardContext.Provider
      value={{
        isLoggedIn,
        userRole,
        login,
        logout,
        hasCompletedOnboarding,
        company,
        completeOnboarding,
        employees,
        addEmployee,
        issues,
        addIssue,
        updateIssue,
        deleteIssue,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
