"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useCreateCompany } from "@/lib/apis/useCompanies";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  


  const [formData, setFormData] = useState({
    user_id:'',
    name: "",
    email: "",
    description: "",
    industry: "",
    website: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });


useEffect(() => {
  const user = session?.user;
  if (!user) return;

  setFormData(prev => ({
    ...prev,
    email: user.email ?? prev.email,
    user_id: user.id ?? prev.user_id,
  }));
}, [session]);

const {mutateAsync:createCompany}=useCreateCompany()


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.name && formData.email) {
      console.log("Submitting form data:", formData);
      
      try {
      createCompany(formData)
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error submitting form. Please try again.");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Please sign in to access the onboarding page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/api/auth/signin'}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Welcome to Dashboard</CardTitle>
          <CardDescription>
            Let's get started by setting up your company information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                placeholder="Enter your company name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                name="email"
                type="email"
                placeholder="company@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                readOnly={!!session?.user?.email} // Make readonly if from session
                className={session?.user?.email ? "bg-muted" : ""}
              />
              {session?.user?.email && (
                <p className="text-xs text-muted-foreground">
                  Email from your account. Contact support to change.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                placeholder="Tell us about your company"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input
                name="industry"
                placeholder="e.g., Technology, Healthcare"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Input
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Input
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!formData.name || !formData.email}
            >
              Continue to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}