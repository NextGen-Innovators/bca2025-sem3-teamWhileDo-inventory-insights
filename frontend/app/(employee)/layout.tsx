import { AppSidebar } from "@/components/sidebar";

export default function EmployeeLayout({children}: {children: React.ReactNode}) {
  return (
   
    <div className="flex min-h-screen bg-gray-50">
    <AppSidebar />
    <main className="flex-1 md:ml-0 overflow-x-hidden">
      {children}
    </main>
  </div>
  )
}