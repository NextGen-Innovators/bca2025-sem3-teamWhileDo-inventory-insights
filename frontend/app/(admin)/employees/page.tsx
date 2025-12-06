'use client'
import { useGetUserWithRole } from '@/lib/apis/useUser'

const page = () => {
    const {data:employees}=useGetUserWithRole()
    console.log(employees)
  return (
    <div>
      {employees?.map((e,i)=>(
        <div key={i}>
          {e.name}
        </div>
      ))}
    </div>
  )
}

export default page
