import json
from typing import Dict, Optional, Literal, List, Tuple
from ..ai import brain


def classification(email: str, email_id: Optional[str] = None) -> Dict:
    """
    Classifies an email into inquiry, ticket, or null (spam/irrelevant).
    
    Args:
        email: The email content to classify
        email_id: Optional identifier for the email
        
    Returns:
        Dict with 'classification', 'reason', and 'email_id'
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

OUTPUT FORMAT (ONLY JSON):
{{
    "classification": "inquiry" | "ticket" | null,
    "reason": "Brief 1-sentence explanation"
}}

Now classify the email:
"""

    try:
        response = brain(prompt).strip()

        # Remove code fences if model returns ```json ... ```
        if response.startswith("```"):
            parts = response.split("```")
            if len(parts) >= 2:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
                response = cleaned.strip()

        # Parse JSON
        result = json.loads(response)

        # Fix email_id handling
        result["email_id"] = email_id

        # Validate output shape
        if "classification" not in result or "reason" not in result:
            return {
                "classification": None,
                "reason": "Invalid response structure",
                "email_id": email_id,
                "raw": response
            }

        # Validate classification type
        if result["classification"] not in ["inquiry", "ticket", None]:
            return {
                "classification": None,
                "reason": f"Invalid classification value: {result['classification']}",
                "email_id": email_id,
                "raw": response
            }

        return result

    except json.JSONDecodeError as e:
        return {
            "classification": None,
            "reason": f"JSON parse error: {str(e)}",
            "email_id": email_id,
            "raw": response
        }

    except Exception as e:
        return {
            "classification": None,
            "reason": f"Unexpected error: {str(e)}",
            "email_id": email_id,
            "raw": response if 'response' in locals() else None
        }


def classify_batch(emails: List[Tuple[str, Optional[str]]]) -> List[Dict]:
    """
    Classify multiple emails at once.
    
    Args:
        emails: List of (email_text, email_id)
    """
    results = []
    for content, eid in emails:
        results.append(classification(content, eid))
    return results
