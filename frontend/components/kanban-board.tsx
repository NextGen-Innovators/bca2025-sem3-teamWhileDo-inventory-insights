"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useGetEmployeeAssignedIssues, useUpdateIssueStatus } from "@/lib/apis/useIssues";
import { format } from "date-fns";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Mail, 
  ExternalLink,
  MoreVertical,
  ArrowRight,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  assigned_user?: {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    skills: string[];
    tags: string[];
  };
}

interface IssuesResponse {
  issues: Issue[];
  total: number;
  skip: number;
  limit: number;
  count: number;
  employee?: {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    skills: string[];
    tags: string[];
  };
}

export default function KanbanBoard() {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  
  // Get employee ID from localStorage
  const employeeId = JSON.parse(localStorage.getItem("employee") || "{}").id;
  
  // Fetch assigned issues
  const { data: issuesData, isLoading, refetch } = useGetEmployeeAssignedIssues(employeeId) as {
    data: IssuesResponse;
    isLoading: boolean;
    refetch: () => void;
  };

  // Status update mutation
  const updateStatusMutation = useUpdateIssueStatus();

  // Handle status change
  const handleStatusChange = async (issueId: string, newStatus: string) => {
    setUpdatingIssueId(issueId);
    
    try {
      await updateStatusMutation.mutateAsync({
        issueId,
        status: newStatus,
      });
      // Refetch data to update UI
      await refetch();
    } catch (error) {
      console.error("Failed to update issue status:", error);
    } finally {
      setUpdatingIssueId(null);
    }
  };

  // Get employee info
  const employee = issuesData?.employee;
  
  // Filter issues by status (matching backend enum values)
  const todoIssues = issuesData?.issues?.filter((i: Issue) => i.status === "open" || i.status === "assigned") || [];
  const inProgressIssues = issuesData?.issues?.filter((i: Issue) => i.status === "in_progress") || [];
  const finishedIssues = issuesData?.issues?.filter((i: Issue) => i.status === "resolved" || i.status === "closed") || [];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      case "low":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d");
    } catch (error) {
      return "N/A";
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get next status button config
  const getNextStatusButton = (currentStatus: string) => {
    if (currentStatus === "assigned" || currentStatus === "open") {
      return {
        label: "Start Progress",
        icon: <ArrowRight className="h-3 w-3" />,
        nextStatus: "in_progress",
        variant: "default" as const
      };
    }
    if (currentStatus === "in_progress") {
      return {
        label: "Mark Complete",
        icon: <Check className="h-3 w-3" />,
        nextStatus: "resolved",
        variant: "default" as const
      };
    }
    return null;
  };

  // Issue Card Component
  const IssueCard = ({ issue }: { issue: Issue }) => {
    const nextStatusBtn = getNextStatusButton(issue.status);
    const isLoading = updatingIssueId === issue.id;

    return (
      <div
        className="bg-card border border-border rounded-lg p-3 space-y-3 hover:shadow-md transition-all duration-200 group"
        onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Badge 
              variant="outline" 
              className={`text-xs font-normal border ${getPriorityColor(issue.priority)}`}
            >
              <div className="flex items-center gap-1">
                {getPriorityIcon(issue.priority)}
                <span className="capitalize">{issue.priority}</span>
              </div>
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {issue.category}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Issue</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Issue Title */}
        <h4 className="font-medium text-foreground text-sm line-clamp-2">
          {issue.subject}
        </h4>

        {/* Issue Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {issue.message.replace(/\r\n/g, ' ').trim()}
        </p>

        {/* Sender Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[120px]">
              {issue.from_email.split('<')[1]?.replace('>', '') || issue.from_email}
            </span>
          </div>
          <span>{formatDate(issue.created_at)}</span>
        </div>

        {/* Action Buttons */}
        {nextStatusBtn && (
          <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="w-full"
              variant={nextStatusBtn.variant}
              onClick={() => handleStatusChange(issue.id, nextStatusBtn.nextStatus)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  {nextStatusBtn.icon}
                  <span className="ml-2">{nextStatusBtn.label}</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Expanded View */}
        {expandedIssue === issue.id && (
          <div className="pt-3 border-t space-y-2">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">ID:</span>
                <span className="font-mono">{issue.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Source:</span>
                <span className="capitalize">{issue.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated:</span>
                <span>{formatDate(issue.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <Badge className={`text-xs ${getStatusColor(issue.status)}`}>
                  {issue.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {/* Assigned User in Expanded View */}
            {issue.assigned_user && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(issue.assigned_user.name)}&background=random`} 
                    alt={issue.assigned_user.name}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(issue.assigned_user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-xs font-medium">{issue.assigned_user.name}</p>
                  <p className="text-xs text-gray-500">{issue.assigned_user.position}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Kanban Column Component
  const KanbanColumn = ({
    title,
    issues: columnIssues,
    icon,
    colorClass,
  }: {
    title: string;
    issues: Issue[];
    icon: React.ReactNode;
    colorClass: string;
  }) => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 p-2">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${colorClass}`}>
              {icon}
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <Badge variant="outline" className="font-medium">
            {columnIssues.length}
          </Badge>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 flex-1 min-h-96 space-y-3 overflow-y-auto">
          {columnIssues.length === 0 ? (
            <div className="text-center py-8 rounded">
              <p className="text-sm text-muted-foreground">No issues</p>
            </div>
          ) : (
            columnIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kanban Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="flex flex-col gap-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="bg-muted/30 rounded-lg p-4 min-h-96 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-card border border-border rounded-lg p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Info Header */}
      {employee && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`} 
                    alt={employee.name}
                  />
                  <AvatarFallback>
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.position} • {employee.department}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {employee.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {employee.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{employee.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {issuesData?.count || 0} Total Issues
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Issues Kanban Board</CardTitle>
            <p className="text-sm text-muted-foreground">Click buttons to change status</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KanbanColumn
              title="To Do"
              issues={todoIssues}
              icon={<Clock className="h-4 w-4" />}
              colorClass="bg-yellow-100 text-yellow-600"
            />
            <KanbanColumn
              title="In Progress"
              issues={inProgressIssues}
              icon={<AlertCircle className="h-4 w-4" />}
              colorClass="bg-blue-100 text-blue-600"
            />
            <KanbanColumn
              title="Completed"
              issues={finishedIssues}
              icon={<CheckCircle className="h-4 w-4" />}
              colorClass="bg-green-100 text-green-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold">
                  {issuesData?.issues?.filter((i: Issue) => i.priority === "high").length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned to Me</p>
                <p className="text-2xl font-bold">{issuesData?.count || 0}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Technical Issues</p>
                <p className="text-2xl font-bold">
                  {issuesData?.issues?.filter((i: Issue) => i.category === "technical").length || 0}
                </p>
              </div>
              <ExternalLink className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">
                  {issuesData?.issues?.filter((i: Issue) => {
                    const issueDate = new Date(i.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return issueDate >= weekAgo;
                  }).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}