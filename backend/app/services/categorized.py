import json
from typing import Dict, Optional, List
from ..ai import brain


def category(email: str, email_id: Optional[str] = None, categories: Optional[List[str]] = None, allow_new_categories: bool = True) -> Dict:
    """
    Categorizes an email into different sectors like billing, docs, support, etc.
    
    Args:
        email: The email content to categorize
        email_id: Optional identifier for the email
        categories: List of available categories from backend (e.g., ["billing", "technical", "sales", "docs"])
        allow_new_categories: If True, AI can create new categories that don't exist in the provided list
        
    Returns:
        Dict with 'email_id', 'category', and 'reason' keys
    """
    
    # Comprehensive default categories if none provided
    if categories is None or len(categories) == 0:
        categories = [
            "billing",           # Payment, invoices, refunds, subscriptions
            "technical",         # Bugs, errors, system issues
            "sales",            # Pricing, demos, purchases
            "support",          # General help, how-to questions
            "account",          # Login, password, profile issues
            "feature_request",  # New feature suggestions
            "feedback",         # Product feedback, reviews
            "documentation",    # Docs, guides, API references
            "integration",      # Third-party integrations, webhooks
            "compliance",       # GDPR, privacy, security
            "legal",           # Terms, contracts, agreements
            "hr",              # Jobs, recruitment, employee issues
            "marketing",       # Campaigns, promotions, partnerships
            "operations",      # Process, workflow, business ops
            "product",         # Product questions, usage
            "onboarding",      # New user setup, getting started
            "cancellation",    # Account closure, service termination
            "upgrade",         # Plan upgrades, enterprise inquiries
            "downgrade",       # Plan downgrades, reduce services
            "data",            # Data export, migration, backup
            "performance",     # Speed issues, optimization
            "security",        # Security concerns, vulnerabilities
            "abuse",           # Report abuse, violations
            "spam",            # Spam, marketing emails, irrelevant
            "general"          # Miscellaneous, uncategorized
        ]
    
    # Build categories list for prompt
    categories_str = ", ".join([f'"{cat}"' for cat in categories])
    categories_examples = "\n".join([f"- \"{cat}\"" for cat in categories])
    
    # Adjust prompt based on whether new categories are allowed
    if allow_new_categories:
        category_instruction = f"""AVAILABLE CATEGORIES (you can choose from these OR create a new one if none fit well):
{categories_examples}

CREATING NEW CATEGORIES:
- If the email doesn't fit any existing category well, you can create a NEW category
- New category names should be:
  * Lowercase with underscores (e.g., "customer_retention", "api_limits")
  * Descriptive and specific (e.g., "invoice_dispute" instead of just "problem")
  * Following this format: noun or adjective_noun (e.g., "refund_request", "enterprise_migration")
- Mark new categories with "is_new_category": true in the output"""
        
        output_format = """{{
    "category": "existing_category" | "new_category_name" | null,
    "is_new_category": true | false,
    "reason": "Brief 1-sentence explanation of category choice"
}}"""
    else:
        category_instruction = f"""AVAILABLE CATEGORIES (choose ONE that best matches):
{categories_examples}"""
        
        output_format = """{{
    "category": {categories_str} | null,
    "reason": "Brief 1-sentence explanation of category choice"
}}"""
    
    prompt = f"""You are an expert email categorizer for a business operations team.

TASK: Analyze the email below and assign it to the most appropriate category.

{category_instruction}

EMAIL TO CATEGORIZE:
\"\"\"
{email.strip()}
\"\"\"

CATEGORIZATION RULES:
1. Assign the email to the MOST RELEVANT category based on its content
2. Match keywords in the email to category names (e.g., "payment" → billing, "bug" → technical)
3. If no category is a clear match{"," if allow_new_categories else " and"} choose the closest one{"or create a new specific category" if allow_new_categories else ""}
4. For spam/irrelevant emails, set category to "spam" if available, otherwise null

CATEGORY MATCHING GUIDELINES:
- "billing" / "payment" / "finance": Payment issues, invoices, refunds, subscriptions, charges, failed payments
- "technical" / "dev" / "engineering": Bugs, errors, API issues, code problems, system failures, crashes
- "sales": Pricing questions, demos, trials, purchase inquiries, partnerships, commercial inquiries
- "support": General help, how-to questions, product usage, troubleshooting
- "account": Login issues, password resets, profile updates, account access, authentication
- "feature_request": New feature suggestions, product improvements, enhancement requests
- "feedback": Product feedback, reviews, suggestions, user experience comments
- "documentation": Questions about docs, guides, tutorials, API references, technical writing
- "integration": Third-party integrations, API connections, webhooks, plugins, extensions
- "compliance": GDPR, privacy policies, data protection, regulatory compliance, certifications
- "legal": Terms of service, contracts, agreements, licensing, intellectual property
- "hr" / "recruitment": Job applications, hiring, employee questions, career inquiries
- "marketing": Marketing campaigns, brand partnerships, media inquiries, promotional content
- "operations": Process issues, workflow problems, internal operations, business processes
- "product": Product-related questions, feature explanations, product capabilities
- "onboarding": New user setup, getting started guides, initial configuration, welcome process
- "cancellation": Account closure, service termination, subscription cancellation
- "upgrade": Plan upgrades, enterprise inquiries, premium features, scaling up
- "downgrade": Plan downgrades, reducing services, cost reduction
- "data": Data export, import, migration, backup, data requests, portability
- "performance": Speed issues, slow loading, optimization requests, latency problems
- "security": Security concerns, vulnerabilities, breach reports, security audits
- "abuse": Report abuse, violations, spam reports, inappropriate content
- "spam": Promotional emails, marketing, newsletters, irrelevant content
- "general": Miscellaneous inquiries that don't fit other categories

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown, no explanation):
{output_format}

EXAMPLES:
Input: "What are your pricing plans?"
Output: {{"category": "sales", "reason": "Customer requesting pricing information"}}

Input: "I can't log into my account, getting error 500"
Output: {{"category": "technical", "reason": "Technical error requiring investigation"}}

Input: "My payment didn't go through"
Output: {{"category": "billing", "reason": "Payment issue"}}

Input: "Where can I find the API documentation?"
Output: {{"category": "documentation", "reason": "Question about documentation location"}}

Input: "I forgot my password"
Output: {{"category": "account", "reason": "Account access issue"}}

Input: "Can you add dark mode to the app?"
Output: {{"category": "feature_request", "reason": "User requesting new feature"}}

Input: "How do I integrate with Slack?"
Output: {{"category": "integration", "reason": "Question about third-party integration"}}

Input: "I want to cancel my subscription"
Output: {{"category": "cancellation", "reason": "User requesting cancellation"}}

Input: "Is your platform GDPR compliant?"
Output: {{"category": "compliance", "reason": "Question about regulatory compliance"}}

Input: "The app is very slow to load"
Output: {{"category": "performance", "reason": "Performance issue"}}

Input: "🎉 Summer Sale! 50% off everything!"
Output: {{"category": "spam", "reason": "Marketing promotional email"}}

Now categorize the email above:"""

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
        
        # Set default for is_new_category if not present
        if "is_new_category" not in result:
            result["is_new_category"] = False
        
        # Validate structure
        if "reason" not in result or "category" not in result:
            return {
                "email_id": email_id,
                "category": None,
                "is_new_category": False,
                "reason": "Invalid response structure - missing required fields",
                "raw": response
            }
        
        # Validate category value (must be in provided categories or null, OR can be new if allowed)
        if not allow_new_categories:
            valid_categories = categories + [None]
            if result["category"] not in valid_categories:
                # Try to find closest match (case-insensitive)
                category_lower = str(result["category"]).lower() if result["category"] else None
                matched_category = None
                
                for cat in categories:
                    if cat.lower() == category_lower:
                        matched_category = cat
                        break
                
                if matched_category:
                    result["category"] = matched_category
                    result["is_new_category"] = False
                else:
                    return {
                        "email_id": email_id,
                        "category": None,
                        "is_new_category": False,
                        "reason": f"Invalid category '{result['category']}' - not in available categories",
                        "available_categories": categories,
                        "raw": response
                    }
        else:
            # When new categories are allowed, check if it's an existing one first
            if result["category"] and result["category"] in categories:
                result["is_new_category"] = False
            elif result["category"]:
                # It's a new category - validate the format
                category_name = result["category"]
                if not isinstance(category_name, str) or not category_name:
                    return {
                        "email_id": email_id,
                        "category": None,
                        "is_new_category": False,
                        "reason": "New category name is invalid",
                        "raw": response
                    }
                # Mark as new category
                result["is_new_category"] = True
        
        return result
        
    except json.JSONDecodeError as e:
        return {
            "email_id": email_id,
            "category": None,
            "is_new_category": False,
            "reason": f"JSON parse error: {str(e)}",
            "raw": response
        }
    except Exception as e:
        return {
            "email_id": email_id,
            "category": None,
            "is_new_category": False,
            "reason": f"Unexpected error: {str(e)}",
            "raw": response if 'response' in locals() else None
        }


def categorize_batch(
    emails: List[tuple[str, Optional[str]]], 
    categories: Optional[List[str]] = None,
    allow_new_categories: bool = False
) -> List[Dict]:
    """
    Categorize multiple emails at once
    
    Args:
        emails: List of tuples (email_content, email_id)
        categories: List of available categories from backend
        allow_new_categories: If True, AI can create new categories
        
    Returns:
        List of categorization results
    """
    return [category(email, email_id, categories, allow_new_categories) for email, email_id in emails]