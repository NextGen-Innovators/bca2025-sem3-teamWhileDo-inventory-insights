import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.tasks import classification

# Test email 1: Spam
spam_email = """
Hello,

We offer bulk SEO packages for only $29/month.
Grow your business with our promotional services.

Best regards,
SEO Boost Team
"""

print("Testing spam email classification:")
result = classification(spam_email)
print(f"Result: {result}")
print()

# Test email 2: Inquiry
inquiry_email = """
Hi,

I'm interested in learning more about your product pricing and features.
Could you please send me more information?

Thanks,
John
"""

print("Testing inquiry email classification:")
result = classification(inquiry_email)
print(f"Result: {result}")
print()

# Test email 3: Ticket
ticket_email = """
Dear Support,

I'm experiencing an error when trying to log into my account.
The error message says "Invalid credentials" even though I'm using the correct password.

Please help!
Sarah
"""

print("Testing ticket email classification:")
result = classification(ticket_email)
print(f"Result: {result}")
