import json
from typing import Dict, Optional, List
from ..ai import brain


def assign_to_employee(
    email: str,
    email_id: Optional[str] = None,
    category: Optional[str] = None,
    employees: Optional[List[Dict]] = None,
    category_response: Optional[Dict] = None,
    classification_response: Optional[Dict] = None
) -> Dict:
    """
    Assigns an email to the most suitable employee based on their skills, specialties, and department.
    
    Args:
        email: The email content to analyze
        email_id: Optional identifier for the email
        category: The category of the email (e.g., "billing", "technical")
        employees: List of employee dictionaries with their details
        category_response: Full categorization response with reasoning
        classification_response: Full classification response with reasoning
        
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
    
    # Build employee profiles
    employee_profiles = []
    for emp in employees:
        workload_percentage = (emp.get('current_load', 0) / emp.get('max_capacity', 10)) * 100
        profile = f"""
Employee ID: {emp.get('id', 'unknown')}
Name: {emp.get('name', 'Unknown')}
Department: {emp.get('department', 'general')}
Position: {emp.get('position', 'N/A')}
Skills: {', '.join(emp.get('skills', [])) or 'None listed'}
Specialties: {', '.join(emp.get('specialties', [])) or 'None listed'}
Tags: {', '.join(emp.get('tags', [])) or 'None listed'}
Current Workload: {emp.get('current_load', 0)}/{emp.get('max_capacity', 10)} ({workload_percentage:.0f}% capacity)
Availability: {"Available" if emp.get('current_load', 0) < emp.get('max_capacity', 10) else "At Capacity"}"""
        employee_profiles.append(profile)
    
    employees_str = "\n---".join(employee_profiles)
    
    # Build enhanced context from responses
    category_context = ""
    if category:
        category_context = f"\nEMAIL CATEGORY: {category}"
    
    if category_response:
        category_reason = category_response.get("reason", "")
        is_new_category = category_response.get("is_new_category", False)
        if category_reason:
            category_context += f"\nCategory Reasoning: {category_reason}"
        if is_new_category:
            category_context += "\nNote: This is a newly identified category type"
    
    classification_context = ""
    if classification_response:
        classification_type = classification_response.get("classification", "")
        classification_reason = classification_response.get("reason", "")
        if classification_type:
            classification_context = f"\nCLASSIFICATION TYPE: {classification_type}"
        if classification_reason:
            classification_context += f"\nClassification Reasoning: {classification_reason}"
    
    # Build comprehensive prompt
    prompt = f"""You are an expert at routing support tickets to the most appropriate team member.

TASK: Analyze the email/ticket and assign it to the BEST employee based on their skills, specialties, department, current workload, and the AI analysis provided.

AVAILABLE EMPLOYEES:
---{employees_str}

AI ANALYSIS CONTEXT:
{classification_context}
{category_context}

EMAIL/TICKET TO ASSIGN:
\"\"\"
{email.strip()}
\"\"\"

ASSIGNMENT RULES:
1. **Skills & Expertise Matching**: Prioritize employees whose skills/specialties directly match the issue
2. **Category Alignment**: Match the category to employee department and expertise
3. **Workload Balance**: Prefer employees with lower workload when skills are comparable
4. **Availability Check**: Only assign to employees who are NOT at max capacity
5. **Specialty Tags**: Give weight to tags like "expert", "senior", "specialist" for complex issues
6. **Context Awareness**: Use the AI classification and category reasoning to understand urgency and complexity

MATCHING CRITERIA BY CATEGORY:
- **technical/performance/integration**: → Engineering, DevOps, Backend developers with relevant tech skills
- **billing/payment/financial**: → Finance, Billing, Accounting department
- **sales/pricing/demo**: → Sales team, Business development
- **support/account/general**: → Customer support, Account managers
- **documentation**: → Technical writers, Documentation team
- **security/compliance**: → Security specialists, Compliance officers
- **feature_request/product**: → Product managers, Engineering leads

CONFIDENCE SCORING GUIDE:
- 0.9-1.0: Perfect match (exact skill match + low workload + right department)
- 0.7-0.89: Strong match (good skill match OR right department with capacity)
- 0.5-0.69: Moderate match (general capability with availability)
- Below 0.5: Weak match (assign only if no better options)

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no explanation):
{{
    "assigned_to": "employee_id",
    "employee_name": "Employee Name",
    "confidence": 0.0-1.0,
    "reason": "Concise explanation of why this employee is the best match (1-2 sentences)",
    "matching_factors": ["specific_factor1", "specific_factor2", "specific_factor3"],
    "alternative_assignees": [
        {{"id": "emp_id", "name": "Name", "reason": "Why they're also suitable"}}
    ]
}}

IMPORTANT:
- If NO employee has relevant skills for the category, assign to the least busy employee with lowest confidence
- Always include 1-2 alternative assignees if available
- Be specific in matching_factors (e.g., "Python API skills" not just "technical skills")

EXAMPLES:

Example 1 - Technical Issue:
Email: "API endpoint /users returning 500 error on production"
Category: "technical"
Classification: "ticket" - "Critical system failure requiring immediate attention"
Best Match: Employee with skills=["python", "api", "backend"], tags=["api_expert"], current_load=3/10
Output: {{"assigned_to": "emp_001", "employee_name": "John Doe", "confidence": 0.95, "reason": "API expert with Python backend experience and immediate availability for critical issue", "matching_factors": ["Python API expertise", "backend specialty", "api_expert tag", "low workload (30%)"], "alternative_assignees": [{{"id": "emp_002", "name": "Sarah Lee", "reason": "Backend developer with API experience but higher workload"}}]}}

Example 2 - Billing Question:
Email: "Why was I charged twice for my subscription?"
Category: "billing"
Classification: "ticket" - "Billing dispute requiring investigation"
Best Match: Employee in billing department, current_load=2/10
Output: {{"assigned_to": "emp_005", "employee_name": "Jane Smith", "confidence": 0.88, "reason": "Billing specialist with payment systems expertise and excellent availability", "matching_factors": ["Billing department", "payment processing skills", "very low workload (20%)", "dispute resolution experience"], "alternative_assignees": [{{"id": "emp_006", "name": "Mike Chen", "reason": "Finance team member who handles refunds"}}]}}

Example 3 - Sales Inquiry:
Email: "Interested in enterprise plan with custom SLA"
Category: "sales"
Classification: "inquiry" - "High-value enterprise sales opportunity"
Best Match: Employee with tags=["enterprise", "sales"], skills=["negotiation"]
Output: {{"assigned_to": "emp_003", "employee_name": "Mike Johnson", "confidence": 0.92, "reason": "Enterprise sales specialist experienced in custom contract negotiations", "matching_factors": ["Enterprise sales tag", "SLA negotiation experience", "sales department", "moderate workload (40%)"], "alternative_assignees": [{{"id": "emp_004", "name": "Lisa Wang", "reason": "Senior account executive with enterprise experience"}}]}}

Now assign the email/ticket above based on all provided context:"""

    try:
        response = brain(prompt)
        
        # Clean response - remove markdown code blocks if present
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        
        result = json.loads(cleaned)
        
        # Add email_id to result
        result["email_id"] = email_id
        
        # Validate assigned employee exists
        assigned_id = result.get("assigned_to")
        if assigned_id:
            employee_ids = [emp.get("id") for emp in employees]
            if assigned_id not in employee_ids:
                return {
                    "email_id": email_id,
                    "assigned_to": None,
                    "employee_name": None,
                    "confidence": 0.0,
                    "reason": f"AI returned invalid employee ID: {assigned_id}",
                    "matching_factors": [],
                    "alternative_assignees": [],
                    "error": "Employee not found in provided list",
                    "raw_response": response
                }
        
        # Set defaults for missing fields
        if "confidence" not in result:
            result["confidence"] = 0.7
        
        if "matching_factors" not in result:
            result["matching_factors"] = []
        
        if "alternative_assignees" not in result:
            result["alternative_assignees"] = []
        
        # Ensure employee_name is present
        if "employee_name" not in result and assigned_id:
            for emp in employees:
                if emp.get("id") == assigned_id:
                    result["employee_name"] = emp.get("name", "Unknown")
                    break
        
        # Add metadata about the analysis
        result["used_classification"] = classification_response is not None
        result["used_category"] = category_response is not None
        
        return result
        
    except json.JSONDecodeError as e:
        return {
            "email_id": email_id,
            "assigned_to": None,
            "employee_name": None,
            "confidence": 0.0,
            "reason": f"Failed to parse AI response as JSON: {str(e)}",
            "matching_factors": [],
            "alternative_assignees": [],
            "error": "JSON parsing failed",
            "raw_response": response
        }
    except Exception as e:
        return {
            "email_id": email_id,
            "assigned_to": None,
            "employee_name": None,
            "confidence": 0.0,
            "reason": f"Unexpected error during assignment: {str(e)}",
            "matching_factors": [],
            "alternative_assignees": [],
            "error": str(e),
            "raw_response": response if 'response' in locals() else None
        }


def assign_batch_emails(
    emails: List[tuple[str, Optional[str], Optional[str], Optional[Dict], Optional[Dict]]],
    employees: List[Dict]
) -> List[Dict]:
    """
    Assign multiple emails to employees with workload tracking
    
    Args:
        emails: List of tuples (email_content, email_id, category, category_response, classification_response)
        employees: List of employee dictionaries
        
    Returns:
        List of assignment results
    """
    results = []
    # Track assignments to update workload dynamically
    workload_tracker = {emp["id"]: emp.get("current_load", 0) for emp in employees}
    
    for email_data in emails:
        email_content = email_data[0]
        email_id = email_data[1] if len(email_data) > 1 else None
        category = email_data[2] if len(email_data) > 2 else None
        category_response = email_data[3] if len(email_data) > 3 else None
        classification_response = email_data[4] if len(email_data) > 4 else None
        
        # Update employee workloads for this batch
        updated_employees = []
        for emp in employees:
            emp_copy = emp.copy()
            emp_copy["current_load"] = workload_tracker.get(emp["id"], emp.get("current_load", 0))
            updated_employees.append(emp_copy)
        
        # Assign email with full context
        result = assign_to_employee(
            email=email_content,
            email_id=email_id,
            category=category,
            employees=updated_employees,
            category_response=category_response,
            classification_response=classification_response
        )
        
        # Update workload tracker if assignment succeeded
        if result.get("assigned_to"):
            assigned_id = result["assigned_to"]
            workload_tracker[assigned_id] = workload_tracker.get(assigned_id, 0) + 1
        
        results.append(result)
    
    return results