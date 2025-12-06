class email():
    sender:str
    subject:str
    body:str
    
def classification(email:email):
    prompt = f"""
    act like a personal assistant and classify the email into two categories:
    1. inquiry
    2. ticket

    
    """
