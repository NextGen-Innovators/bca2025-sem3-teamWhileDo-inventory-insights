import json

def classification(email: str):
    prompt = f"""
You are an expert operations manager for a company.

Your task:
Classify the following email into one of these categories:

1. "inquiry" — general questions, pricing, information request, demo request, etc.
2. "ticket" — issues, complaints, bugs, errors, or anything requiring support action.
3. If the email is spam, marketing, irrelevant, blank, or not related to the company → return null.

Email Content:
\"\"\" 
{email}
\"\"\"

Output:
Return ONLY a valid JSON using one of these patterns:

For a valid classification:
{{
    "classification": "inquiry" | "ticket",
    "reason": "<short reason>"
}}

For spam or irrelevant email:
{{
    "classification": null,
    "reason": "spam" | "irrelevant" | "not related"
}}

Do NOT return anything except the JSON.
"""

    # Call your LLM
    response = brain(prompt)

    # Safely convert JSON string → Python dict
    try:
        return json.loads(response)
    except Exception:
        return {
            "classification": None,
            "reason": "failed_to_parse_response",
            "raw": response
        }
