import json
from typing import Dict, Optional, List
from ..ai import brain


def assign_to_employee(
    email: str,
    email_id: Optional[str] = None,
    category: Optional[str] = None,
    employees: Optional[List[Dict]] = None,
    category_response: Optional[str] = None,
    classification_response: Optional[str] = None

) -> Dict:
    """
    Assigns an email to the most suitable employee based on their skills, specialties, and department.
    
    Args:
        email: The email content to analyze
        email_id: Optional identifier for the email
        category: The category of the email (e.g., "billing", "technical")
        employees: List of employee dictionaries with their details
                   e.g., [
                       {
                           "id": "emp_001",
                           "name": "John Doe",
                           "department": "engineering",
                           "skills": ["python", "react", "api"],
                           "specialties": ["backend", "database"],
                           "tags": ["senior", "api_expert"],
                           "current_load": 5,  # number of current assignments
                           "max_capacity": 10
                       }
                   ]
        
    Returns:
        Dict with 'email_id', 'assigned_to', 'confidence', and 'reason' keys
    """
    
    if not employees or len(employees) == 0:
        return {
            "email_id": email_id,
            "assigned_to": None,
            "employee_name": None,
            "confidence": 0.0,
            "reason": "No employees available for assignment",
            "matching_factors": [],
            "alternative_assignees": [],
            "error": "Empty employee list"
        } 
    employee_profiles = []
    for emp in employees:
        profile = f"""
Employee ID: {emp.get('id', 'unknown')}
Name: {emp.get('name', 'Unknown')}
Department: {emp.get('department', 'general')}
Skills: {', '.join(emp.get('skills', []))}
Specialties: {', '.join(emp.get('specialties', []))}
Tags: {', '.join(emp.get('tags', []))}
Current Workload: {emp.get('current_load', 0)}/{emp.get('max_capacity', 10)}
Availability: {"Available" if emp.get('current_load', 0) < emp.get('max_capacity', 10) else "At Capacity"}"""
        employee_profiles.append(profile)
    
    employees_str = "\n---".join(employee_profiles)
    
    category_context = f"\nEMAIL CATEGORY: {category}" if category else ""
    
    prompt = f"""You are an expert at routing emails to the most appropriate team member.

TASK: Analyze the email and assign it to the BEST employee based on their skills, specialties, department, and current workload.

AVAILABLE EMPLOYEES:
---{employees_str}

{category_context}

EMAIL TO ASSIGN:
\"\"\"
{email.strip()}
\"\"\"

ASSIGNMENT RULES:
1. Match email content to employee skills and specialties
2. Consider the category when making assignments
3. Prioritize employees with relevant tags (e.g., "api_expert" for API issues)
4. Factor in current workload - prefer less busy employees when skills are similar
5. Department should align with the email category when possible
6. If multiple employees are equally qualified, choose the one with lower workload
7. Only assign to employees who are available (not at max capacity)

MATCHING CRITERIA:
- Technical emails → employees with technical skills
- Billing emails → employees in billing/finance department
- Sales emails → employees with sales experience
- Look for keyword matches between email content and employee skills/specialties
- Tags like "expert", "senior", "specialist" indicate deep knowledge

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown):
{{
    "assigned_to": "employee_id",
    "employee_name": "Employee Name",
    "confidence": 0.0-1.0,
    "reason": "Brief explanation of why this employee is the best match",
    "matching_factors": ["factor1", "factor2", "factor3"],
    "alternative_assignees": [
        {{"id": "emp_id", "name": "Name", "reason": "Why they're also suitable"}}
    ]
}}

EXAMPLES:

Example 1:
Email: "API endpoint returning 500 error"
Category: "technical"
Best Match: Employee with skills=["api", "backend"], tags=["api_expert"]
Output: {{"assigned_to": "emp_001", "employee_name": "John Doe", "confidence": 0.95, "reason": "API expert with backend experience", "matching_factors": ["api skills", "backend specialty", "senior tag"]}}

Example 2:
Email: "Question about invoice charges"
Category: "billing"
Best Match: Employee in billing department with lower workload
Output: {{"assigned_to": "emp_005", "employee_name": "Jane Smith", "confidence": 0.85, "reason": "Billing specialist with availability", "matching_factors": ["billing department", "low workload", "accounting skills"]}}

Example 3:
Email: "Need demo of enterprise features"
Category: "sales"
Best Match: Employee with sales skills and "enterprise" tag
Output: {{"assigned_to": "emp_003", "employee_name": "Mike Johnson", "confidence": 0.90, "reason": "Enterprise sales specialist", "matching_factors": ["enterprise tag", "sales skills", "demo experience"]}}

Now assign the email above:"""

    try:
        response = brain(prompt)
        
        # Clean response
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        
        result = json.loads(cleaned)
        
        result["email_id"] = email_id
        
        assigned_id = result.get("assigned_to")
        if assigned_id:
            employee_ids = [emp.get("id") for emp in employees]
            if assigned_id not in employee_ids:
                return {
                    "email_id": email_id,
                    "assigned_to": None,
                    "employee_name": None,
                    "confidence": 0.0,
                    "reason": f"Invalid employee ID: {assigned_id}",
                    "matching_factors": [],
                    "alternative_assignees": [],
                    "error": "Employee not found in provided list",
                    "raw": response
                }
        
        if "confidence" not in result:
            result["confidence"] = 0.7
        
        if "matching_factors" not in result:
            result["matching_factors"] = []
        
        if "alternative_assignees" not in result:
            result["alternative_assignees"] = []
        
        if "employee_name" not in result:
            for emp in employees:
                if emp.get("id") == assigned_id:
                    result["employee_name"] = emp.get("name", "Unknown")
                    break
        
        return result
        
    except json.JSONDecodeError as e:
        return {
            "email_id": email_id,
            "assigned_to": None,
            "employee_name": None,
            "confidence": 0.0,
            "reason": f"JSON parse error: {str(e)}",
            "matching_factors": [],
            "alternative_assignees": [],
            "error": "Failed to parse AI response",
            "raw": response
        }
    except Exception as e:
        return {
            "email_id": email_id,
            "assigned_to": None,
            "employee_name": None,
            "confidence": 0.0,
            "reason": f"Unexpected error: {str(e)}",
            "matching_factors": [],
            "alternative_assignees": [],
            "error": str(e),
            "raw": response if 'response' in locals() else None
        }


def assign_batch_emails(
    emails: List[tuple[str, Optional[str], Optional[str]]],
    employees: List[Dict]
) -> List[Dict]:
    """
    Assign multiple emails to employees with workload tracking
    
    Args:
        emails: List of tuples (email_content, email_id, category)
        employees: List of employee dictionaries
        
    Returns:
        List of assignment results
    """
    results = []
    # Track assignments to update workload
    workload_tracker = {emp["id"]: emp.get("current_load", 0) for emp in employees}
    
    for email, email_id, category in emails:
        # Update employee workloads for this batch
        updated_employees = []
        for emp in employees:
            emp_copy = emp.copy()
            emp_copy["current_load"] = workload_tracker.get(emp["id"], emp.get("current_load", 0))
            updated_employees.append(emp_copy)
        
        # Assign email
        result = assign_to_employee(
            email=email,
            email_id=email_id,
            category=category,
            employees=updated_employees
        )
        
        # Update workload tracker
        if result.get("assigned_to"):
            assigned_id = result["assigned_to"]
            workload_tracker[assigned_id] = workload_tracker.get(assigned_id, 0) + 1
        
        results.append(result)
    
    return results

