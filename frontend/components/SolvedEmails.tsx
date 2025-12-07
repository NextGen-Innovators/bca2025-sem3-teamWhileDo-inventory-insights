"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, User, Clock, Tag, CheckCircle, MessageSquare, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { useGetUser } from "@/lib/apis/useUser";
import { useReadEmails } from "@/lib/apis/useEmails";

interface EmailData {
  id: string;
  email_id: string;
  sender: string;
  subject: string;
  body: string;
  classification: string;
  status: string;
  processed_at: string;
  response?: {
    body: string;
    subject: string;
    suggested_actions: string[];
    requires_human_review: boolean;
    review_reason: string | null;
  };
  category?: string;
  issue_id?: string;
  assigned_to?: string;
  draft_id?: string;
  company_id: string;
}

interface SolvedEmailsResponse {
  emails: EmailData[];
  count: number;
  total: number;
  skip: number;
  limit: number;
}

interface SolvedEmailsProps {
  data?: SolvedEmailsResponse;
  isLoading?: boolean;
  error?: any;
}

export default function SolvedEmails({  isLoading, error }: SolvedEmailsProps) {
  const { data: session } = useSession();
  const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");
  const { data, isLoading: loadingEmail } =   useReadEmails(session?.user?.id || "", user?.company_id || "");
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;
  
  // Filter for solved emails (draft_created, processed, or other completed statuses)
  const solvedEmails = data?.emails || [];
  const totalEmails = data?.count || 0;
  const totalPages = Math.ceil(totalEmails / itemsPerPage);
  
  // Get current page emails
  const currentEmails = solvedEmails.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft_created":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "processed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "closed":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case "resolved":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const getClassificationColor = (classification: string) => {
    switch (classification?.toLowerCase()) {
      case "ticket":
        return "bg-blue-100 text-blue-800";
      case "inquiry":
        return "bg-green-100 text-green-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      case "support":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800";
    
    switch (category?.toLowerCase()) {
      case "technical":
        return "bg-orange-100 text-orange-800";
      case "billing":
        return "bg-green-100 text-green-800";
      case "sales":
        return "bg-blue-100 text-blue-800";
      case "support":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch (error) {
      return dateString;
    }
  };
  
  const extractEmailFromSender = (sender: string) => {
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender;
  };
  
  const extractNameFromSender = (sender: string) => {
    const match = sender.match(/^([^<]+)/);
    return match ? match[1].trim() : sender;
  };
  
  const formatEmailBody = (body: string) => {
    return body
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*-\s*\n/g, '\n• ')
      .replace(/^\s*-\s*\n/gm, '• ')
      .trim();
  };
  
  const handleViewDetails = (email: EmailData) => {
    setSelectedEmail(email);
    setIsDialogOpen(true);
  };
  
  const handleCopyResponse = () => {
    if (selectedEmail?.response?.body) {
      navigator.clipboard.writeText(selectedEmail.response.body);
      // You could add a toast notification here
      console.log("Response copied to clipboard");
    }
  };
  
  const handleDownloadEmail = () => {
    if (!selectedEmail) return;
    
    const emailContent = `
Subject: ${selectedEmail.subject}
From: ${selectedEmail.sender}
Date: ${formatDate(selectedEmail.processed_at)}
Status: ${selectedEmail.status}
Classification: ${selectedEmail.classification}
${selectedEmail.category ? `Category: ${selectedEmail.category}\n` : ''}

--- ORIGINAL EMAIL ---
${formatEmailBody(selectedEmail.body)}

${selectedEmail.response ? `
--- AI RESPONSE ---
Subject: ${selectedEmail.response.subject}
${formatEmailBody(selectedEmail.response.body)}

${selectedEmail.response.suggested_actions?.length > 0 ? `
--- SUGGESTED ACTIONS ---
${selectedEmail.response.suggested_actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}
` : ''}
` : ''}

--- METADATA ---
Email ID: ${selectedEmail.email_id}
Processed: ${selectedEmail.processed_at}
${selectedEmail.draft_id ? `Draft ID: ${selectedEmail.draft_id}\n` : ''}
${selectedEmail.issue_id ? `Issue ID: ${selectedEmail.issue_id}\n` : ''}
${selectedEmail.assigned_to ? `Assigned To: ${selectedEmail.assigned_to}\n` : ''}
    `.trim();
    
    const blob = new Blob([emailContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solved-email-${selectedEmail.email_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Solved Emails</CardTitle>
          <CardDescription>Loading solved emails...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Solved Emails</CardTitle>
          <CardDescription>Error loading solved emails</CardDescription>
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
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Solved Emails
              </CardTitle>
              <CardDescription>
                Emails that have been processed and responded to • {totalEmails} solved emails
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {data?.count || 0} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentEmails.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No solved emails found</h3>
              <p className="text-gray-500">
                All processed emails will appear here once they&apos;ve been resolved.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentEmails.map((email: EmailData) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <h3 className="font-semibold text-lg truncate">
                            {email.subject}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{extractNameFromSender(email.sender)}</span>
                            <span className="text-gray-500 text-xs">
                              ({extractEmailFromSender(email.sender)})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(email.processed_at)}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded">
                          {formatEmailBody(email.body).substring(0, 150)}...
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(email.status)}>
                            {email.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getClassificationColor(email.classification)}>
                            {email.classification.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {email.category && (
                          <Badge className={getCategoryColor(email.category)}>
                            <Tag className="h-3 w-3 mr-1" />
                            {email.category.toUpperCase()}
                          </Badge>
                        )}
                        
                        {email.response && (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            AI Responded
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="text-xs text-gray-600 flex items-center gap-4">
                        <span>ID: {email.email_id.substring(0, 10)}...</span>
                        {email.draft_id && (
                          <span className="text-green-600">
                            Draft: {email.draft_id.substring(0, 8)}...
                          </span>
                        )}
                        {email.issue_id && (
                          <span className="text-blue-600">
                            Issue: {email.issue_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleViewDetails(email)}
                        >
                          View Details
                        </Button>
                        {email.response && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleViewDetails(email)}
                          >
                            View Response
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {Math.min(currentPage * itemsPerPage + 1, totalEmails)} to{" "}
                    {Math.min((currentPage + 1) * itemsPerPage, totalEmails)} of{" "}
                    {totalEmails} solved emails
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
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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

      {/* Email Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedEmail && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {selectedEmail.subject}
              </DialogTitle>
              <DialogDescription>
                Email processed on {formatDate(selectedEmail.processed_at)}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="original" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original">Original Email</TabsTrigger>
                <TabsTrigger value="response" disabled={!selectedEmail.response}>
                  AI Response
                </TabsTrigger>
                <TabsTrigger value="actions" disabled={!selectedEmail.response?.suggested_actions}>
                  Suggested Actions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-500">From</p>
                    <p>{selectedEmail.sender}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Status</p>
                    <Badge className={getStatusColor(selectedEmail.status)}>
                      {selectedEmail.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Classification</p>
                    <Badge className={getClassificationColor(selectedEmail.classification)}>
                      {selectedEmail.classification.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Category</p>
                    {selectedEmail.category ? (
                      <Badge className={getCategoryColor(selectedEmail.category)}>
                        {selectedEmail.category.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Not categorized</span>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium">Email Content</h4>
                  </div>
                  <Textarea
                    value={formatEmailBody(selectedEmail.body)}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-white"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="response" className="space-y-4">
                {selectedEmail.response && (
                  <>
                    <div className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium">AI Response</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyResponse}
                          >
                            Copy Response
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-700 mb-2">
                          Subject: {selectedEmail.response.subject}
                        </p>
                        <Textarea
                          value={formatEmailBody(selectedEmail.response.body)}
                          readOnly
                          className="min-h-[300px] font-mono text-sm bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="actions">
                {selectedEmail.response?.suggested_actions && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">Suggested Actions</h4>
                    </div>
                    <ul className="space-y-3">
                      {selectedEmail.response.suggested_actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-gray-500 space-y-1">
                <p>Email ID: {selectedEmail.email_id}</p>
                <p>Processed: {formatDate(selectedEmail.processed_at)}</p>
                {selectedEmail.draft_id && (
                  <p>Draft ID: {selectedEmail.draft_id}</p>
                )}
                {selectedEmail.issue_id && (
                  <p>Issue ID: {selectedEmail.issue_id}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadEmail}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}