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
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboard } from "@/components/context/dashboard-context";
import { useGetIssues } from "@/lib/apis/useIssues";
import { useSession } from "next-auth/react";
import { useGetUser } from "@/lib/apis/useUser";
import { useState } from "react";
import { format } from "date-fns";

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
}

export default function IssuesList() {
  const { data: session, status } = useSession();
  const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10; // Or use limit from API
  
  // Fetch issues with company_id filter
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "finished":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  if (isLoadingUser || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>Loading issues...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>Error loading issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues</CardTitle>
        <CardDescription>
          Manage project issues and tasks • {totalIssues} total issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No issues found. Create your first issue to get started.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {issues.map((issue: Issue) => (
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{issue.subject}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {issue.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>From: {issue.from_email}</span>
                        <span>•</span>
                        <span>Created: {formatDate(issue.created_at)}</span>
                        <span>•</span>
                        <span>Category: {issue.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                      <Badge className={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // Handle delete
                          console.log("Delete issue:", issue.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        ID: {issue.id.substring(0, 8)}...
                      </span>
                      <span className="text-gray-600">
                        Source: {issue.source}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last updated: {formatDate(issue.updated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * itemsPerPage + 1} to{" "}
                  {Math.min((currentPage + 1) * itemsPerPage, totalIssues)} of{" "}
                  {totalIssues} issues
                </div>
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
                      // Show pages around current page
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
                          className="h-8 w-8 p-0"
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