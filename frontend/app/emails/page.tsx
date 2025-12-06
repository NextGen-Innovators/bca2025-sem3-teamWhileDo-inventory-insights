"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

// Extend the Session type to include access_token
declare module "next-auth" {
  interface Session {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }
}

export default function GmailComponent() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
  });

  // API base URL
  const API_BASE_URL = "http://localhost:8000/gmail";

const handleLogout = async () => {
  await signOut({ callbackUrl: "/" });
};

  // Axios instance with credentials
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Get access token from session
  const getAuthHeaders = () => {
    if (!session?.access_token) {
      throw new Error("No access token available");
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  // Fetch emails
  const fetchEmails = async () => {
    if (!session?.access_token) {
      alert("Please login first");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/read-emails", {
        headers: getAuthHeaders(),
        params: {
          max_results: 20,
        },
      });

      setEmails(response.data.messages || []);
    } catch (error: any) {
      console.error("Error fetching emails:", error);
      alert(error.response?.data?.detail || error.message || "Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  };

  // Send email
  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.access_token) {
      alert("Please login first");
      return;
    }

    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      alert("Please fill all fields");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await api.post(
        "/send-email",
        {
          to: emailForm.to,
          subject: emailForm.subject,
          body: emailForm.body,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      alert(`Email sent successfully! Message ID: ${response.data.message_id}`);
      
      // Reset form
      setEmailForm({ to: "", subject: "", body: "" });
      
      // Refresh email list
      fetchEmails();
    } catch (error: any) {
      console.error("Error sending email:", error);
      alert(error.response?.data?.detail || error.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  // Search emails
  const searchEmails = async (query: string) => {
    if (!session?.access_token) {
      alert("Please login first");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/search", {
        headers: getAuthHeaders(),
        params: {
          q: query,
          max_results: 20,
        },
      });

      setEmails(response.data.messages || []);
    } catch (error: any) {
      console.error("Error searching emails:", error);
      alert(error.response?.data?.detail || error.message || "Failed to search emails");
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (messageId: string, markRead: boolean = true) => {
    if (!session?.access_token) return;

    try {
      await api.patch(
        `/emails/${messageId}/mark-read`,
        null,
        {
          headers: getAuthHeaders(),
          params: {
            mark_read: markRead,
          },
        }
      );

      // Refresh emails
      fetchEmails();
    } catch (error: any) {
      console.error("Error updating email:", error);
      alert(error.response?.data?.detail || error.message || "Failed to update email");
    }
  };

  // Delete email
  const deleteEmail = async (messageId: string) => {
    if (!session?.access_token) return;

    if (!confirm("Move this email to trash?")) return;

    try {
      await api.delete(`/emails/${messageId}`, {
        headers: getAuthHeaders(),
      });

      alert("Email moved to trash");
      fetchEmails();
    } catch (error: any) {
      console.error("Error deleting email:", error);
      alert(error.response?.data?.detail || error.message || "Failed to delete email");
    }
  };

  // Auto-fetch emails on mount
  useEffect(() => {
    if (session?.access_token) {
      fetchEmails();
    }
  }, [session?.access_token]);

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Gmail Integration</h1>
        <p>Please sign in to access your Gmail</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gmail Integration</h1>
      <p className="mb-4">Logged in as: {session.user?.email}</p>

      {/* Search Filters */}
      <div className="mb-4 flex gap-2 flex-wrap">

        <button onClick={handleLogout}>
          logout
        </button>
        <button
          onClick={() => fetchEmails()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          All Emails
        </button>
        <button
          onClick={() => searchEmails("is:unread")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Unread
        </button>
        <button
          onClick={() => searchEmails("has:attachment")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Has Attachment
        </button>
        <button
          onClick={() => searchEmails("is:starred")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Starred
        </button>
      </div>

      {/* Send Email Form */}
      <div className="mb-8 p-6 border rounded-lg bg-white shadow">
        <h2 className="text-2xl font-semibold mb-4">Send Email</h2>
        <form onSubmit={sendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">To:</label>
            <input
              type="email"
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="recipient@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject:</label>
            <input
              type="text"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Email subject"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Body:</label>
            <textarea
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={5}
              placeholder="Email content"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={sendingEmail}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {sendingEmail ? "Sending..." : "Send Email"}
          </button>
        </form>
      </div>

      {/* Inbox */}
      <div className="p-6 border rounded-lg bg-white shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            Inbox ({emails.length})
          </h2>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No emails found</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {emails.map((email) => (
              <div
                key={email.id}
                className="border-b pb-4 hover:bg-gray-50 p-3 rounded transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg flex-1">{email.subject}</h3>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => markAsRead(email.id, true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => deleteEmail(email.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">From: {email.from}</p>
                  <span className="text-xs text-gray-500">{email.date}</span>
                </div>
                {email.snippet && (
                  <p className="text-sm text-gray-500 mb-2 italic">{email.snippet}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{email.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}