import json
from typing import Dict, Optional, List
from ..ai import brain

def generate_inquiry_response(
    email: str,
    email_id: Optional[str] = None,
    category: Optional[str] = None,
    context: Optional[Dict] = None,
    tone: str = "professional"
) -> Dict:
    """
    Generate a response email for inquiries
    
    Args:
        email: The original inquiry email content
        email_id: Optional identifier for the email
        category: The category of the inquiry (e.g., "sales", "support", "billing")
        context: Optional context about the company/product
                 e.g., {
                     "company_name": "Acme Corp",
                     "product_name": "Dashboard Pro",
                     "support_email": "support@acme.com",
                     "website": "www.acme.com",
                     "pricing_url": "www.acme.com/pricing",
                     "docs_url": "docs.acme.com"
                 }
        tone: Response tone - "professional", "friendly", "formal", "casual"
        
    Returns:
        Dict with 'email_id', 'subject', 'body', and 'suggested_actions' keys
    """
    
    # Default context if none provided
    if context is None:
        context = {}
    
    company_name = context.get("company_name", "our company")
    product_name = context.get("product_name", "our product")
    support_email = context.get("support_email", "support@company.com")
    website = context.get("website", "www.company.com")
    pricing_url = context.get("pricing_url", f"{website}/pricing")
    docs_url = context.get("docs_url", f"docs.{website}")
    
    # Build context string for prompt
    context_str = f"""
COMPANY CONTEXT:
- Company Name: {company_name}
- Product Name: {product_name}
- Support Email: {support_email}
- Website: {website}
- Pricing Page: {pricing_url}
- Documentation: {docs_url}
"""
    
    # Category-specific guidance
    category_guidance = ""
    if category:
        category_guidance = f"""
CATEGORY: {category}

Category-Specific Guidelines:
"""
        if category == "sales":
            category_guidance += """- Highlight product benefits and value proposition
- Offer a demo or trial if appropriate
- Provide pricing information or direct to pricing page
- Be enthusiastic about the product"""
        elif category == "support":
            category_guidance += """- Be helpful and solution-oriented
- Provide clear step-by-step guidance
- Link to relevant documentation
- Offer to escalate if needed"""
        elif category == "billing":
            category_guidance += """- Be empathetic about billing concerns
- Provide clear information about charges
- Offer to check account details
- Explain refund/credit policies if relevant"""
        elif category == "technical":
            category_guidance += """- Acknowledge the technical issue
- Ask for relevant details if needed
- Provide troubleshooting steps or workarounds
- Escalate to engineering if necessary"""
        elif category == "documentation":
            category_guidance += """- Provide direct links to relevant docs
- Summarize key information
- Offer additional resources
- Ask if they need further clarification"""
        elif category == "integration":
            category_guidance += """- Provide integration setup guidance
- Link to API documentation
- Offer code examples if appropriate
- Mention available support for integration"""
        elif category == "feature_request":
            category_guidance += """- Thank them for the suggestion
- Explain current feature status if known
- Mention how feature requests are tracked
- Invite them to share more details"""
        else:
            category_guidance += f"""- Address the {category}-related inquiry professionally
- Provide relevant information
- Be helpful and courteous"""
    
    # Tone guidance
    tone_guidance = {
        "professional": "Use professional business language. Be courteous and respectful. Maintain formality.",
        "friendly": "Use warm, approachable language. Be personable but still professional. Use contractions and conversational style.",
        "formal": "Use very formal business language. Avoid contractions. Be extremely polite and traditional.",
        "casual": "Use relaxed, conversational language. Be friendly and approachable. Keep it light but helpful."
    }
    
    selected_tone = tone_guidance.get(tone, tone_guidance["professional"])
    
    prompt = f"""You are an expert customer service representative writing a response to a customer inquiry.

{context_str}
{category_guidance}

TONE: {tone}
{selected_tone}

ORIGINAL INQUIRY EMAIL:
\"\"\"
{email.strip()}
\"\"\"

TASK: Generate a complete, helpful response email that:
1. Addresses all questions/concerns in the original email
2. Provides clear, actionable information
3. Maintains the specified tone
4. Includes relevant links/resources when appropriate
5. Ends with a clear call-to-action or next steps
6. Uses proper email formatting (greeting, body, closing)

RESPONSE STRUCTURE:
- Start with a personalized greeting (use "there" if no name is apparent)
- Acknowledge their inquiry/concern
- Provide helpful, specific answers
- Include relevant links or resources
- End with a professional closing and offer further assistance
- Sign off appropriately

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown):
{{
    "subject": "Re: [brief subject line based on inquiry]",
    "body": "Full email response with proper formatting and line breaks",
    "suggested_actions": ["action1", "action2"],
    "requires_human_review": true | false,
    "review_reason": "Reason if human review is needed, null otherwise"
}}

IMPORTANT GUIDELINES:
- If the inquiry requires specific account information you don't have, acknowledge this and offer to look into it
- If technical details are needed that aren't provided, politely ask for them
- For complex issues, offer to schedule a call or escalate
- Always be helpful, never dismissive
- Use "\\n\\n" for paragraph breaks in the body
- Set "requires_human_review" to true if: legal questions, pricing negotiations, complaints, sensitive issues

Generate the response now:"""

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
        
        # Add email_id
        result["email_id"] = email_id
        
        # Validate structure
        required_fields = ["subject", "body"]
        if not all(field in result for field in required_fields):
            return {
                "email_id": email_id,
                "subject": None,
                "body": None,
                "suggested_actions": [],
                "requires_human_review": True,
                "review_reason": "Invalid response structure",
                "error": "Missing required fields",
                "raw": response
            }
        
        # Set defaults
        if "suggested_actions" not in result:
            result["suggested_actions"] = []
        
        if "requires_human_review" not in result:
            result["requires_human_review"] = False
        
        if "review_reason" not in result:
            result["review_reason"] = None
        
        return result
        
    except json.JSONDecodeError as e:
        return {
            "email_id": email_id,
            "subject": None,
            "body": None,
            "suggested_actions": [],
            "requires_human_review": True,
            "review_reason": f"JSON parse error: {str(e)}",
            "raw": response
        }
    except Exception as e:
        return {
            "email_id": email_id,
            "subject": None,
            "body": None,
            "suggested_actions": [],
            "requires_human_review": True,
            "review_reason": f"Error: {str(e)}",
            "raw": response if 'response' in locals() else None
        }


def generate_batch_responses(
    emails: List[tuple[str, Optional[str], Optional[str]]],
    context: Optional[Dict] = None,
    tone: str = "professional"
) -> List[Dict]:
    """
    Generate responses for multiple inquiry emails
    
    Args:
        emails: List of tuples (email_content, email_id, category)
        context: Company/product context
        tone: Response tone
        
    Returns:
        List of response dictionaries
    """
    results = []
    for email, email_id, category in emails:
        result = generate_inquiry_response(
            email=email,
            email_id=email_id,
            category=category,
            context=context,
            tone=tone
        )
        results.append(result)
    return results


def generate_response_with_template(
    email: str,
    email_id: Optional[str] = None,
    category: Optional[str] = None,
    template: Optional[str] = None,
    variables: Optional[Dict] = None,
    context: Optional[Dict] = None,
    tone: str = "professional"
) -> Dict:
    """
    Generate a response using a custom template
    
    Args:
        email: Original inquiry email
        email_id: Email identifier
        category: Email category
        template: Custom email template with {{variables}}
        variables: Dict of variables to fill in template
        context: Company context
        tone: Response tone
        
    Returns:
        Response with template applied
    """
    
    if template and variables:
        # Use template-based generation
        prompt = f"""You are generating an email response using a provided template.

ORIGINAL EMAIL:
\"\"\"
{email.strip()}
\"\"\"

TEMPLATE:
\"\"\"
{template}
\"\"\"

VARIABLES TO FILL:
{json.dumps(variables, indent=2)}

TASK:
1. Fill in the template variables with the provided values
2. Ensure the response addresses the original email
3. Maintain {tone} tone
4. Make any necessary adjustments to flow naturally

OUTPUT (valid JSON only):
{{
    "subject": "Email subject",
    "body": "Filled template with proper formatting",
    "suggested_actions": [],
    "requires_human_review": false
}}

Generate now:"""
        
        try:
            response = brain(prompt)
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()
            
            result = json.loads(cleaned)
            result["email_id"] = email_id
            result["used_template"] = True
            
            return result
            
        except Exception as e:
            return {
                "email_id": email_id,
                "subject": None,
                "body": None,
                "error": str(e),
                "used_template": False
            }
    else:
        # Fall back to regular generation
        return generate_inquiry_response(email, email_id, category, context, tone)


def get_response_stats(responses: List[Dict]) -> Dict:
    """
    Get statistics about generated responses
    
    Args:
        responses: List of response dictionaries
        
    Returns:
        Statistics dict
    """
    stats = {
        "total": len(responses),
        "successful": 0,
        "requires_review": 0,
        "errors": 0,
        "by_category": {}
    }
    
    for response in responses:
        if response.get("body"):
            stats["successful"] += 1
        else:
            stats["errors"] += 1
        
        if response.get("requires_human_review"):
            stats["requires_review"] += 1
    
    return stats