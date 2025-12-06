"use client";

import type React from "react";

import { useState } from "react";
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

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [aboutUs, setAboutUs] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName && aboutUs) {
      console.log({
        name: companyName,
        about: aboutUs,
      });
    }
  };

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
              <label className="text-sm font-medium">Company Name</label>
              <Input
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">About Us</label>
              <Textarea
                placeholder="Tell us about your company"
                value={aboutUs}
                onChange={(e) => setAboutUs(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!companyName || !aboutUs}
            >
              Continue to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
