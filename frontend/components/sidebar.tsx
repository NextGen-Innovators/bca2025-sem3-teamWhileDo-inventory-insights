// components/sidebar/app-sidebar.tsx
"use client";

import * as React from "react";
import {
  Users,
  UserPlus,
  AlertCircle,
  Home,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  userName?: string | null;
  userEmail?: string | null;
  className?: string;
}

export function AppSidebar({ 
  activePage, 
  onPageChange, 
  userName = "Admin User",
  userEmail = "admin@company.com",
  className = "" 
}: AppSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      page: "dashboard",
    },
    {
      title: "Employees",
      icon: Users,
      page: "employees",
      badge: "24",
    },
    {
      title: "Create Employee",
      icon: UserPlus,
      page: "create-employee",
      variant: "default" as const,
    },
    {
      title: "Issues",
      icon: AlertCircle,
      page: "issues",
      badge: "3",
    },
    {
      title: "Settings",
      icon: Settings,
      page: "settings",
    },
  ];

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <Sidebar
        className={`border-r bg-white ${className} ${
          isMobileOpen
            ? "fixed inset-y-0 left-0 z-40 w-64 translate-x-0"
            : "hidden md:flex md:w-64"
        }`}
      >
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">HR</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">HR Dashboard</h1>
              <p className="text-xs text-gray-500">Company Portal</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      isActive={activePage === item.page}
                      onClick={() => {
                        onPageChange(item.page);
                        setIsMobileOpen(false);
                      }}
                      variant={item.variant}
                      className="justify-start"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Quick Stats */}
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Employees</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Issues</span>
                  <span className="font-semibold text-orange-600">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New Today</span>
                  <span className="font-semibold text-green-600">2</span>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  {getInitials(userName || "AU")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}