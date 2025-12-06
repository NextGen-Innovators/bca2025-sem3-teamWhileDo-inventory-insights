"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useGetUser } from "@/lib/apis/useUser";
import { useGetEmails } from "@/lib/apis/useEmails";
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
    const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
  });
console.log(user?.company_id)
const { data: emailsData } = useGetEmails(session?.access_token || "", user?.company_id || "");
console.log(emailsData)

const handleLogout = async () => {
  await signOut({ callbackUrl: "/" });
};

 











  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Gmail Integration</h1>
        <p>Please sign in to access your Gmail</p>
      </div>
    );
  }

  return (
  <div></div>
  );
}