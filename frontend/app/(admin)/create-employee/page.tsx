'use client'
import AddEmployeeForm from '@/components/add-employee-form'
import { useGetUser } from '@/lib/apis/useUser';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react'

const page = () => {
      const [showAddEmployee, setShowAddEmployee] = useState(false);
 const { data: session, status } = useSession();
    const { data: user, isLoading: isLoadingUser } = useGetUser(session?.user?.id || "");

  return (
    <div>
      <AddEmployeeForm companyId={user?.company_id || ''} />
    </div>
  )
}

export default page
