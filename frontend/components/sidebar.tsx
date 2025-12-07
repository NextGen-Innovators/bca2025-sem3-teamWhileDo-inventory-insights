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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, usePathname } from "next/navigation";

export function AppSidebar() {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      page: "/dashboard",
    },
    {
      title: "Employees",
      icon: Users,
      page: "/employees",
    },
    {
      title: "Create Employee",
      icon: UserPlus,
      page: "/create-employee",
    },
    {
      title: "Issues",
      icon: AlertCircle,
      page: "/issues",
    },
    {
      title: "Settings",
      icon: Settings,
      page: "/settings",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = session?.user?.name || "Admin User";
  const userEmail = session?.user?.email || "admin@company.com";
  const userImage = session?.user?.image;

  const handleNavigation = (page: string) => {
    router.push(page);
    setIsMobileOpen(false);
  };

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-sm"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-0
          h-screen w-64 
          bg-white border-r
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="border-b p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNavigation(item.page)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`h-4 w-4 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-600'}`} />
                      <span>{item.title}</span>
                    </div>
                   
                  </button>
                );
              })}
            </div>
          </div>
          
        
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Avatar className="flex-shrink-0">
                <AvatarImage src={userImage || ""} alt={userName} />
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
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
        </div>
      </aside>
    </>
  );
}