"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import { useDashboard } from "./context/dashboard-context";
import { useCreateEmployee } from "@/lib/apis/useUser";

interface AddEmployeeFormProps {
  companyId?: string;
}

export default function AddEmployeeForm({  companyId }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    bio: "",
    company_id: "",
  });
  
  const [skills, setSkills] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [tagInput, setTagInput] = useState("");
const{mutateAsync}=useCreateEmployee()
  // Initialize company_id if provided
  useEffect(() => {
    if (companyId) {
      setFormData(prev => ({ ...prev, company_id: companyId }));
    }
  }, [companyId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert("Name and email are required fields");
      return;
    }

    try {
      // Prepare employee data with all fields
      const employeeData = {
        name: formData.name,
        email: formData.email,
        department: formData.department || null,
        position: formData.position || null,
        company_id: formData.company_id || null,
        skills: skills,
        tags: tags,
        bio: formData.bio || null,
      };

      console.log("Submitting employee data:", employeeData);

    await mutateAsync(employeeData)

   
        
   
        // Reset form
        setFormData({
          name: "",
          email: "",
          department: "",
          position: "",
          bio: "",
          company_id: companyId || "",
        });
        setSkills([]);
        setTags([]);
        
     
    } catch (error) {
      console.error("Error creating employee:", error);
      alert("Error creating employee. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6  w-5xl mx-auto overflow-y-auto p-1">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium">
              Department
            </Label>
            <Input
              id="department"
              name="department"
              placeholder="Engineering, Marketing, Sales, etc."
              value={formData.department}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">
              Position / Job Title
            </Label>
            <Input
              id="position"
              name="position"
              placeholder="Software Engineer, Marketing Manager, etc."
              value={formData.position}
              onChange={handleInputChange}
            />
          </div>

          {!companyId && (
            <div className="space-y-2">
              <Label htmlFor="company_id" className="text-sm font-medium">
                Company ID (Optional)
              </Label>
              <Input
                id="company_id"
                name="company_id"
                placeholder="Company identifier"
                value={formData.company_id}
                onChange={handleInputChange}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Role & Profile</h3>
        
      

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">
            Bio / Description
          </Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell us about this employee's background, experience, and responsibilities..."
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Skills & Tags</h3>
        
        {/* Skills Section */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="skill-input" className="text-sm font-medium">
              Skills
            </Label>
            <div className="flex gap-2">
              <Input
                id="skill-input"
                placeholder="Add a skill (e.g., React, Python, Project Management)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddSkill}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Skill
              </Button>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Added Skills</Label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="tag-input" className="text-sm font-medium">
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                placeholder="Add tags (e.g., remote, full-time, contractor)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTag}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Tag
              </Button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Added Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-purple-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
        variant={"default"}
        className="flex-1"
          type="submit"
          disabled={!formData.name || !formData.email}
        >
          Create Employee
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
        >
          Cancel
        </Button>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>* Required fields</p>
        <p className="mt-1">Employee will be created with default onboarding status as "not onboarded"</p>
      </div>
    </form>
  );
}