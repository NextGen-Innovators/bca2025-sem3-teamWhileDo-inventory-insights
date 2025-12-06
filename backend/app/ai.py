from bytez import Bytez
from dotenv import load_dotenv
import os
import json

load_dotenv()
key = os.getenv("BYTEZ_KEY")

sdk = Bytez(key)


def brain(prompt: str):
    model = sdk.model("openai/gpt-4.1-mini")

    resp = model.run([
        {
            "role": "system",
            "content": "You are a helpful assistant. Always respond in valid JSON when requested."
        },
        {
            "role": "user",
            "content": prompt
        }
    ])

    try:
        if hasattr(resp, 'output'):
            # If resp has an output attribute
            content = resp.output.get('content', str(resp.output))
        elif isinstance(resp, dict):
            content = resp.get('content', resp.get('output', str(resp)))
        elif isinstance(resp, list) and len(resp) > 0:
            content = resp[0].get('content', str(resp[0]))
        else:
            content = str(resp)
        
        return content
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Response type: {type(resp)}")
        print(f"Response: {resp}")
        return str(resp)


email = """
Hello,

We offer bulk SEO packages for only $29/month.
Grow your business with our promotional services.
Best regards,
SEO Boost Team
"""

print(classification(email))


