'use client'
import AdminDashboard from '@/components/admin-dashboard'
import { useGetEmails } from '@/lib/apis/useEmails';
import { useGetUser } from '@/lib/apis/useUser';
import { useSession } from 'next-auth/react';
import React from 'react'

const page = () => {
  const { data: session } = useSession();
  const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");
  // Fetch emails
  const { data: emailsData, isLoading, error } = useGetEmails(
    session?.access_token || "",
    user?.company_id || ""
  ) 
  console.log(emailsData)
  return (
    <div>
      <AdminDashboard/>
    </div>
  )
}

export default page
