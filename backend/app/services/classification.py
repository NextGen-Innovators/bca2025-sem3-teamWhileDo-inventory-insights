import json
from typing import Dict, Optional, Literal
from ..ai import brain


def classification(email: str, email_id: Optional[str] = None) -> Dict:
    """
    Classifies an email into inquiry, ticket, or null (spam/irrelevant).
    
    Args:
        email: The email content to classify
        email_id: Optional identifier for the email
        
    Returns:
        Dict with 'email_id', 'classification' and 'reason' keys
    """
    prompt = f"""You are an expert email classifier for a business operations team.

TASK: Analyze the email below and classify it into exactly ONE category.

CATEGORIES:
- "inquiry": Questions about products/services, pricing requests, demo requests, partnership inquiries, general information requests
- "ticket": Technical issues, bugs, errors, complaints, problems requiring support intervention, account access issues
- null: Spam, marketing emails, newsletters, automated messages, completely irrelevant content, blank emails

EMAIL TO CLASSIFY:
\"\"\"
{email.strip()}
\"\"\"

CLASSIFICATION RULES:
1. If the email asks a question or requests information → "inquiry"
2. If the email reports a problem or requests help fixing something → "ticket"  
3. If the email is promotional, automated, spam, or unrelated to business operations → null
4. When in doubt between inquiry and ticket, choose based on whether action is needed (ticket) vs information is needed (inquiry)

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no explanation):
{{
    "classification": "inquiry" | "ticket" | null,
    "reason": "Brief 1-sentence explanation of why this classification was chosen"
}}

EXAMPLES:
Input: "What are your pricing plans?"
Output: {{"classification": "inquiry", "reason": "Customer requesting pricing information"}}

Input: "I can't log into my account, getting error 500"
Output: {{"classification": "ticket", "reason": "Technical issue requiring support intervention"}}

Input: "🎉 Summer Sale! 50% off everything!"
Output: {{"classification": null, "reason": "Marketing promotional email"}}

Now classify the email above:"""

    try:
        response = brain(prompt)
        
        # Clean response - remove markdown code blocks if present
        cleaned = response.strip()
        if cleaned.startswith("```"):
            # Remove ```json and ``` wrappers
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        
        result = json.loads(cleaned)
        
        # Add email_id to result
        result["email_id"] = email_id
        
        # Validate structure
        if "classification" not in result or "reason" not in result:
            return {
                "email_id": email_id,
                "classification": None,
                "reason": "Invalid response structure",
                "raw": response
            }
        
        valid_classifications = ["inquiry", "ticket", None]
        if result["classification"] not in valid_classifications:
            return {
                "email_id": email_id,
                "classification": None,
                "reason": f"Invalid classification value: {result['classification']}",
                "raw": response
            }
        
        return result
        
    except json.JSONDecodeError as e:
        return {
            "email_id": email_id,
            "classification": None,
            "reason": f"JSON parse error: {str(e)}",
            "raw": response
        }
    except Exception as e:
        return {
            "email_id": email_id,
            "classification": None,
            "reason": f"Unexpected error: {str(e)}",
            "raw": response if 'response' in locals() else None
        }


def classify_batch(emails: list[tuple[str, Optional[str]]]) -> list[Dict]:
    """
    Classify multiple emails at once
    
    Args:
        emails: List of tuples (email_content, email_id)
    """
    return [classification(email, email_id) for email, email_id in emails]
