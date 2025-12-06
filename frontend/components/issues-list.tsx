"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Clock,
  Mail,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  MoreVertical
} from "lucide-react";
import { useDashboard } from "@/components/context/dashboard-context";
import { useGetIssues } from "@/lib/apis/useIssues";
import { useSession } from "next-auth/react";
import { useGetUser } from "@/lib/apis/useUser";
import { useState } from "react";
// Date formatting utility
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch (error) {
    return "Invalid date";
  }
};
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssignedUser {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  skills: string[];
  tags: string[];
}

interface Issue {
  id: string;
  subject: string;
  message: string;
  from_email: string;
  created_at: string;
  updated_at: string;
  category: string;
  status: string;
  priority: string;
  source: string;
  assigned_to: string;
  assigned_user?: AssignedUser;
}

export default function IssuesList() {
  const { data: session, status } = useSession();
  const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");
  
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  
  const { data: issuesData, isLoading, error } = useGetIssues(
    user?.company_id,
    {
      skip: currentPage * itemsPerPage,
      limit: itemsPerPage
    }
  );
  
  const issues = issuesData?.issues || [];
  const totalIssues = issuesData?.total || 0;
  const totalPages = Math.ceil(totalIssues / itemsPerPage);
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "todo":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: Circle,
          label: "To Do"
        };
      case "in-progress":
        return {
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Loader2,
          label: "In Progress"
        };
      case "finished":
        return {
          color: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle2,
          label: "Finished"
        };
      case "assigned":
        return {
          color: "bg-purple-50 text-purple-700 border-purple-200",
          icon: User,
          label: "Assigned"
        };
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: Circle,
          label: status
        };
    }
  };
  
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: AlertCircle,
          label: "High"
        };
      case "medium":
        return {
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: AlertCircle,
          label: "Medium"
        };
      case "low":
        return {
          color: "bg-green-50 text-green-700 border-green-200",
          icon: AlertCircle,
          label: "Low"
        };
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: AlertCircle,
          label: priority
        };
    }
  };
  

  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (isLoadingUser || isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>Loading issues...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="shadow-sm border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Issues</CardTitle>
          <CardDescription>There was a problem fetching the issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Issues</CardTitle>
          <Badge variant="secondary" className="text-sm font-normal">
            {totalIssues} Total
          </Badge>
        </div>
        <CardDescription>
          Manage and track project issues and tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No issues found</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first issue to get started with tracking.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {issues.map((issue: Issue) => {
                const statusConfig = getStatusConfig(issue.status);
                const priorityConfig = getPriorityConfig(issue.priority);
                const StatusIcon = statusConfig.icon;
                const PriorityIcon = priorityConfig.icon;
                
                return (
                  <Card key={issue.id} className="group hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header Section with Color Accent */}
                      <div className={`h-1.5 ${priorityConfig.color.split(' ')[0]}`}></div>
                      
                      <div className="p-5">
                        {/* Title and Actions Row */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1.5 group-hover:text-blue-600 transition-colors">
                              {issue.subject}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {issue.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className={`${statusConfig.color} border font-medium px-3 py-1`}
                                  >
                                    <StatusIcon className={`h-3.5 w-3.5 mr-1.5 ${issue.status === 'in-progress' ? 'animate-spin' : ''}`} />
                                    {statusConfig.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Current Status</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className={`${priorityConfig.color} border font-medium px-3 py-1`}
                                  >
                                    <PriorityIcon className="h-3.5 w-3.5 mr-1.5" />
                                    {priorityConfig.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Priority Level</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit Issue</DropdownMenuItem>
                                <DropdownMenuItem>Change Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => console.log("Delete issue:", issue.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Issue
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs text-gray-500">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 hover:text-gray-700 transition-colors cursor-default">
                                  <Mail className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[200px]">{issue.from_email}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Submitted by: {issue.from_email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(issue.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" />
                            <span className="capitalize">{issue.category}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 ml-auto">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {issue.source}
                            </Badge>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* Assignment Section */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">
                              Assigned to:
                            </span>
                            {issue.assigned_user ? (
                              <div className="flex items-center gap-3 flex-1 min-w-0 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-gray-200">
                                  <AvatarImage 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(issue.assigned_user.name)}&background=random`} 
                                    alt={issue.assigned_user.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
                                    {getInitials(issue.assigned_user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-semibold text-gray-900 truncate">
                                    {issue.assigned_user.name}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">
                                    {issue.assigned_user.position} • {issue.assigned_user.department}
                                  </span>
                                </div>
                                {issue.assigned_user.skills && issue.assigned_user.skills.length > 0 && (
                                  <div className="hidden xl:flex items-center gap-1.5">
                                    {issue.assigned_user.skills.slice(0, 3).map((skill, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs font-normal px-2 py-0.5">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {issue.assigned_user.skills.length > 3 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5 cursor-default">
                                              +{issue.assigned_user.skills.length - 3}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="flex flex-col gap-1">
                                              {issue.assigned_user.skills.slice(3).map((skill, index) => (
                                                <span key={index} className="text-xs">{skill}</span>
                                              ))}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : issue.assigned_to ? (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 px-3 py-1.5">
                                <User className="h-3.5 w-3.5 mr-1.5" />
                                User {issue.assigned_to.substring(0, 8)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-200 px-3 py-1.5">
                                <User className="h-3.5 w-3.5 mr-1.5" />
                                Unassigned
                              </Badge>
                            )}
                          </div>
                          
                          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Updated {formatDate(issue.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{currentPage * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min((currentPage + 1) * itemsPerPage, totalIssues)}</span> of{" "}
                  <span className="font-medium">{totalIssues}</span> issues
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 2) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}