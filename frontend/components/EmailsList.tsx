"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, User, Clock, Tag, Wrench } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useGetUser } from "@/lib/apis/useUser";
import { useGetEmails } from "@/lib/apis/useEmails";
import { useState } from "react";

interface EmailData {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  is_unread: boolean;
  classification: {
    classification: string;
    reason: string;
  };
  ticket_category: {
    category: string;
    is_new_category: boolean;
  };
  assignment: {
    assigned_to: string;
    employee_name: string;
    confidence: number;
    reason: string;
    matching_factors: string[];
  };
  issue_id?: string;
}

interface EmailsResponse {
  user: string;
  messages: EmailData[];
  count: number;
  total_in_inbox: number;
  unread_only: boolean;
}

export default function EmailsList() {
  const { data: session, status } = useSession();
  const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  
  // Fetch emails
  const { data: emailsData, isLoading, error } = useGetEmails(
    session?.access_token || "",
    user?.company_id || ""
  ) as { data: EmailsResponse; isLoading: boolean; error: any };
  
  const emails = emailsData?.messages || [];
  const totalEmails = emailsData?.count || 0;
  const totalPages = Math.ceil(totalEmails / itemsPerPage);
  
  const getClassificationColor = (classification: string) => {
    switch (classification?.toLowerCase()) {
      case "ticket":
        return "bg-blue-100 text-blue-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      case "spam":
        return "bg-red-100 text-red-800";
      case "support":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "technical":
        return "bg-orange-100 text-orange-800";
      case "billing":
        return "bg-green-100 text-green-800";
      case "support":
        return "bg-purple-100 text-purple-800";
      case "feature":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      // Parse the date string (e.g., "Sun, 7 Dec 2025 02:09:23 +0545")
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch (error) {
      return dateString;
    }
  };
  
  const extractEmailFromSender = (sender: string) => {
    // Extract email from format like "Name <email@example.com>"
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender;
  };
  
  const extractNameFromSender = (sender: string) => {
    // Extract name from format like "Name <email@example.com>"
    const match = sender.match(/^([^<]+)/);
    return match ? match[1].trim() : sender;
  };
  
  if (isLoadingUser || isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Email Tickets</CardTitle>
          <CardDescription>Loading emails...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading email tickets...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Email Tickets</CardTitle>
          <CardDescription>Error loading emails</CardDescription>
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Email Tickets</CardTitle>
        <CardDescription>
          Tickets automatically created from emails • {totalEmails} tickets 
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No email tickets found. {emailsData?.unread_only ? "All emails have been processed." : "Connect your email to get started."}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {emails.map((email: EmailData) => (
                <div
                  key={email.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                    email.is_unread ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {email.is_unread && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        )}
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {email.subject}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{extractNameFromSender(email.from)}</span>
                          <span className="text-gray-500">({extractEmailFromSender(email.from)})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(email.date)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded">
                        {email.snippet}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getClassificationColor(email?.classification?.classification)}>
                          {email?.classification?.classification}
                        </Badge>
                        <Badge className={getCategoryColor(email?.ticket_category?.category)}>
                          <Tag className="h-3 w-3 mr-1" />
                          {email?.ticket_category?.category}
                          {email?.ticket_category?.is_new_category && (
                            <span className="ml-1 text-xs">(New)</span>
                          )}
                        </Badge>
                      </div>
                      
                      {email.assignment && (
                        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {email.assignment.employee_name}
                          <span className="text-xs ml-1">
                            ({Math.round(email.assignment.confidence * 100)}%)
                          </span>
                        </Badge>
                      )}
                      
                      {email.issue_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            // Navigate to issue
                            console.log("View issue:", email.issue_id);
                          }}
                        >
                          View Issue
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Matching Factors */}
                  {email.assignment?.matching_factors && email.assignment.matching_factors.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="h-3 w-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">Matching Factors:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {email.assignment.matching_factors.map((factor, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      <span>ID: {email.id.substring(0, 10)}...</span>
                      {email.assignment?.reason && (
                        <span className="ml-4 text-xs text-gray-500 italic">
                          Reason: {email.assignment.reason.substring(0, 80)}...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // View full email
                          console.log("View full email:", email.id);
                        }}
                      >
                        View Full
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Reassign email
                          console.log("Reassign email:", email.id);
                        }}
                      >
                        Reassign
                      </Button>
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
                  {Math.min((currentPage + 1) * itemsPerPage, totalEmails)} of{" "}
                  {totalEmails} email tickets
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
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