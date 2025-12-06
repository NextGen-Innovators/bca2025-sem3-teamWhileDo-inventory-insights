'use client'
import { useGetEmployees } from '@/lib/apis/useUser'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, Mail, Building, Briefcase, Tag, User, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
  company_id: string | null;
  skills: string[];
  tags: string[];
  bio: string | null;
  is_onboarded: boolean;
}

export default function EmployeesPage() {
  const { data: employees, isLoading, error } = useGetEmployees()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading employees...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Employees</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Extract unique departments and roles for filtering
  const departments: string[] = Array.from(
    new Set(
      (employees
        ?.map((e: Employee) => e.department)
        .filter((dept: string | null | undefined): dept is string => dept != null && dept !== '') || [])
    )
  )
  const roles: string[] = Array.from(
    new Set(
      (employees
        ?.map((e: Employee) => e.role)
        .filter((role: string | null | undefined): role is string => role != null && role !== '') || [])
    )
  )
  
  // Filter employees based on search and filters
  const filteredEmployees = employees?.filter((employee: Employee) => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      employee.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDepartment = 
      selectedDepartment === 'all' || employee.department === selectedDepartment
    
    const matchesRole = 
      selectedRole === 'all' || employee.role === selectedRole
    
    return matchesSearch && matchesDepartment && matchesRole
  })
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  // Function to get color based on department
  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'bg-blue-100 text-blue-800',
      'Sales': 'bg-green-100 text-green-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'HR': 'bg-pink-100 text-pink-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Operations': 'bg-indigo-100 text-indigo-800',
      'Support': 'bg-orange-100 text-orange-800',
      'Product': 'bg-teal-100 text-teal-800',
    }
    return colors[department] || 'bg-gray-100 text-gray-800'
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Employees</h1>
        <p className="text-gray-600">
          Manage and view all employees in your organization
          {employees && <span className="ml-2 font-medium">({employees.length} employees)</span>}
        </p>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees by name, email, position, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Department Filter */}
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            {/* Role Filter */}
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Employee Count and Reset Filters */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Showing {filteredEmployees?.length || 0} of {employees?.length || 0} employees
        </div>
        {(searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedDepartment('all')
              setSelectedRole('all')
            }}
            className="text-gray-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
      
      {/* Employee Grid */}
      {filteredEmployees && filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee: Employee) => (
            <Card key={employee.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`} 
                        alt={employee.name}
                      />
                      <AvatarFallback>
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {employee.position}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={employee.is_onboarded ? "default" : "outline"} className="text-xs">
                    {employee.is_onboarded ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Onboarded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-gray-500" />
                    {employee.department && (
                      <Badge className={getDepartmentColor(employee.department)}>
                        {employee.department}
                      </Badge>
                    )}
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-700">{employee.role}</span>
                  </div>
                </div>
                
                {/* Bio */}
                {employee.bio && (
                  <div className="text-sm text-gray-600">
                    <p className="line-clamp-3">{employee.bio}</p>
                  </div>
                )}
                
                <Separator />
                
                {/* Skills */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Tags */}
                {employee.tags && employee.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {employee.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Employee ID */}
                <div className="text-xs text-gray-500">
                  <span className="font-medium">ID:</span> {employee.id.substring(0, 8)}...
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button size="sm" className="flex-1">
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all'
                  ? "Try adjusting your search or filters"
                  : "No employees in the system yet"}
              </p>
              {(searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedDepartment('all')
                    setSelectedRole('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
   
    </div>
  )
}