from bytez import Bytez
from dotenv import load_dotenv
import os
from .base.base_mode import email
load_dotenv()
key = os.getenv("BYTEZ_KEY")

sdk = Bytez(key)


def brain(email_data: email):
    model = sdk.model("openai/gpt-4.1-mini")
    
    # Format the email data into a readable string
    email_content = f"""
Sender: {email_data.sender}
Subject: {email_data.subject}
Body: {email_data.body}
"""

    resp = model.run([
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": email_content
        }
    ])

    print(resp)
    return resp
