from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
from app.services.gmail import get_gmail_service
import base64
from email.mime.text import MIMEText

from app.services.classification import classification
from app.services.response import generate_inquiry_response
from app.services.categorized import category
from app.database import get_database
from app.schemas.company import UserRole

router = APIRouter()


class EmailData(BaseModel):
    to: EmailStr
    subject: str
    body: str


def extract_headers(msg_data: Dict) -> Dict[str, str]:
    headers = msg_data["payload"]["headers"]
    return {h["name"]: h["value"] for h in headers}


def extract_body(msg_data: Dict) -> str:
    payload = msg_data["payload"]
    body = ""
    
    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain" and "data" in part["body"]:
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                break
            elif part["mimeType"] == "text/html" and "data" in part["body"] and not body:
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")

    elif "body" in payload and "data" in payload["body"]:
        body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8")
    
    return body


def parse_email_message(msg_data: Dict, include_full_body: bool = False) -> Dict:
    headers = extract_headers(msg_data)
    body = extract_body(msg_data)
    
    if not include_full_body and len(body) > 1000:
        body = body[:1000] + "..."
    
    return {
        "id": msg_data["id"],
        "subject": headers.get("Subject", "No Subject"),
        "from": headers.get("From", "Unknown"),
        "date": headers.get("Date", "Unknown"),
        "snippet": msg_data.get("snippet", ""),
        "body": body,
        "is_unread": "UNREAD" in msg_data.get("labelIds", [])
    }


@router.get("/read-emails")
async def read_emails(
    company_id: str,
    authorization: str = Header(...),
    max_results: int = 10,
    full_raw: bool = False,
    unread_only: bool = Query(True)
):
    try:
        access_token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        service, user = await get_gmail_service(access_token=access_token)

        label_ids = ["INBOX"]
        if unread_only:
            label_ids.append("UNREAD")

        results = service.users().messages().list(
            userId="me",
            maxResults=min(max_results, 100),
            labelIds=label_ids,
        ).execute()

        messages = results.get("messages", [])

        # If a company_id is provided, fetch its employees and prepare a list of dicts
        employees_list: list[Dict] = []
        if company_id:
            try:
                db = get_database()
                employees = await db.users.find({"company_id": company_id, "role": UserRole.EMPLOYEE.value}).to_list(200)
                employees_list = [
                    {
                        "id": str(e.get("_id")),
                        "name": e.get("name"),
                        "email": e.get("email"),
                        "department": e.get("department"),
                        "position": e.get("position"),
                    }
                    for e in employees
                ]
            except Exception as e:
                # Non-fatal: log and continue without employees
                print(f"⚠️ Failed to load employees for company {company_id}: {e}")

        if not messages:
            return {
                "user": user["email"],
                "messages": [],
                "employees": employees_list,
                "count": 0,
                "message": f"No {'unread ' if unread_only else ''}emails found",
            }
            
            

        detailed_messages = []

        for msg in messages:
            try:
                msg_data = service.users().messages().get(
                    userId="me",
                    id=msg["id"],
                    format="full",
                ).execute()

                if full_raw:
                    detailed_messages.append(msg_data)
                    continue

                parsed = parse_email_message(msg_data, include_full_body=True)

                email_text = (
                    f"From: {parsed['from']}\n"
                    f"Subject: {parsed['subject']}\n\n"
                    f"{parsed['body']}"
                )

                try:
                    classification_result = classification(email=email_text, email_id=parsed["id"])
                    print("\n📌 CLASSIFICATION RESULT:", classification_result)
                    parsed["classification"] = classification_result
                    classification_type = classification_result['classification']

                    if classification_type in ('none', 'spam'):
                       
                        continue 

                    elif classification_type == 'inquiry':
                        response_result = generate_inquiry_response(
                            email=email_text,
                            email_id=parsed["id"],
                            category=classification_type,
                            context=None,
                            tone="professional"
                        )
                        parsed["response"] = response_result
                        print("\n🤖 GENERATED RESPONSE:", response_result)
                    elif classification_type == 'ticket':
                        category_result = category(
                            email=email_text,
                            email_id=parsed["id"],
                            allow_new_categories=True
                        )
                        parsed["ticket_category"] = category_result
                        print("\n🤖 GENERATED RESPONSE:", category_result)
                        
                except Exception as e:
                    print(f"⚠️ Classification failed for {msg['id']}: {e}")

                detailed_messages.append(parsed)
                print(f"✅ Fetched email {parsed['id']} for {user['email']}")
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"⚠️ Error processing message {msg['id']}: {str(e)}")
                continue

                
                
        return {
            "user": user["email"],
            "messages": detailed_messages,
            "employees": employees_list,
            "count": len(detailed_messages),
            "total_in_inbox": len(messages),
            "unread_only": unread_only,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error reading emails: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to read emails: {str(e)}")
@router.post("/send-email")
async def send_email(
    data: EmailData,
    authorization: str = Header(..., description="Bearer token from session")
):
    """
    Send an email via Gmail
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        print(f"📤 Sending email from: {user['email']} to: {data.to}")
        
        message = MIMEText(data.body)
        message['to'] = data.to
        message['from'] = user['email']
        message['subject'] = data.subject
        
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        send_message = service.users().messages().send(
            userId="me",
            body={"raw": encoded_message}
        ).execute()
        
        print(f"✅ Email sent successfully. Message ID: {send_message.get('id')}")
        
        return {
            "status": "sent",
            "message_id": send_message.get("id"),
            "from": user['email'],
            "to": data.to,
            "subject": data.subject
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.get("/emails/{message_id}")
async def get_email(
    message_id: str,
    authorization: str = Header(..., description="Bearer token from session"),
    full_raw: bool = False
):
    """
    Get a specific email by ID
    - full_raw=False: Returns parsed email data
    - full_raw=True: Returns complete raw Gmail API response
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        print(f"📧 Fetching email {message_id} for: {user['email']}")
        
        msg_data = service.users().messages().get(
            userId="me", 
            id=message_id, 
            format="full"
        ).execute()
        
        if full_raw:
            # Return complete raw data
            return msg_data
        
        # Parse and return structured data
        headers = msg_data["payload"]["headers"]
        subject = next((h["value"] for h in headers if h["name"] == "Subject"), "No Subject")
        sender = next((h["value"] for h in headers if h["name"] == "From"), "Unknown")
        date = next((h["value"] for h in headers if h["name"] == "Date"), "Unknown")
        to = next((h["value"] for h in headers if h["name"] == "To"), "Unknown")
        
        body = ""
        html_body = ""
        
        if "parts" in msg_data["payload"]:
            for part in msg_data["payload"]["parts"]:
                if part["mimeType"] == "text/plain" and "data" in part["body"]:
                    body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                elif part["mimeType"] == "text/html" and "data" in part["body"]:
                    html_body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
        elif "body" in msg_data["payload"] and "data" in msg_data["payload"]["body"]:
            if msg_data["payload"]["mimeType"] == "text/html":
                html_body = base64.urlsafe_b64decode(msg_data["payload"]["body"]["data"]).decode("utf-8")
            else:
                body = base64.urlsafe_b64decode(msg_data["payload"]["body"]["data"]).decode("utf-8")
        
        return {
            "id": message_id,
            "subject": subject,
            "from": sender,
            "to": to,
            "date": date,
            "snippet": msg_data.get("snippet", ""),
            "body": body or html_body,
            "labels": msg_data.get("labelIds", [])
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get email: {str(e)}")

@router.get("/search")
async def search_emails(
    q: str,
    authorization: str = Header(..., description="Bearer token from session"),
    max_results: int = 10,
    full_raw: bool = False
):
    """
    Search emails using Gmail query syntax
    - full_raw=False: Returns parsed email data
    - full_raw=True: Returns complete raw Gmail API response
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        print(f"🔍 Searching emails for: {user['email']} with query: {q}")
        
        results = service.users().messages().list(
            userId="me",
            q=q,
            maxResults=min(max_results, 100)
        ).execute()
        
        messages = results.get("messages", [])
        
        if not messages:
            return {
                "user": user['email'],
                "query": q,
                "messages": [],
                "count": 0
            }
        
        detailed_messages = []
        
        if full_raw:
            # Return complete raw data
            for msg in messages:
                try:
                    msg_data = service.users().messages().get(
                        userId="me",
                        id=msg["id"],
                        format="full"
                    ).execute()
                    detailed_messages.append(msg_data)
                except Exception as e:
                    print(f"⚠️ Error processing message {msg['id']}: {str(e)}")
                    continue
        else:
            # Return parsed data
            for msg in messages:
                try:
                    msg_data = service.users().messages().get(
                        userId="me",
                        id=msg["id"],
                        format="metadata",
                        metadataHeaders=["Subject", "From", "Date"]
                    ).execute()
                    
                    headers = msg_data["payload"]["headers"]
                    subject = next((h["value"] for h in headers if h["name"] == "Subject"), "No Subject")
                    sender = next((h["value"] for h in headers if h["name"] == "From"), "Unknown")
                    date = next((h["value"] for h in headers if h["name"] == "Date"), "Unknown")
                    
                    detailed_messages.append({
                        "id": msg["id"],
                        "subject": subject,
                        "from": sender,
                        "date": date,
                        "snippet": msg_data.get("snippet", "")
                    })
                except Exception as e:
                    print(f"⚠️ Error processing message {msg['id']}: {str(e)}")
                    continue
        
        return {
            "user": user['email'],
            "query": q,
            "messages": detailed_messages,
            "count": len(detailed_messages)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error searching emails: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search emails: {str(e)}")

@router.get("/profile")
async def get_gmail_profile(
    authorization: str = Header(..., description="Bearer token from session")
):
    """
    Get Gmail profile information
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        profile = service.users().getProfile(userId="me").execute()
        
        return {
            "user": user['email'],
            "gmail_address": profile.get("emailAddress"),
            "messages_total": profile.get("messagesTotal"),
            "threads_total": profile.get("threadsTotal"),
            "history_id": profile.get("historyId")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.get("/labels")
async def get_labels(
    authorization: str = Header(..., description="Bearer token from session")
):
    """
    Get all Gmail labels
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        results = service.users().labels().list(userId="me").execute()
        labels = results.get("labels", [])
        
        return {
            "user": user['email'],
            "labels": labels,
            "count": len(labels)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get labels: {str(e)}")

@router.patch("/emails/{message_id}/mark-read")
async def mark_as_read(
    message_id: str,
    mark_read: bool = True,
    authorization: str = Header(..., description="Bearer token from session")
):
    """
    Mark an email as read or unread
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        if mark_read:
            # Remove UNREAD label
            service.users().messages().modify(
                userId="me",
                id=message_id,
                body={"removeLabelIds": ["UNREAD"]}
            ).execute()
            status = "read"
        else:
            # Add UNREAD label
            service.users().messages().modify(
                userId="me",
                id=message_id,
                body={"addLabelIds": ["UNREAD"]}
            ).execute()
            status = "unread"
        
        return {
            "message_id": message_id,
            "status": status
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update message: {str(e)}")

@router.delete("/emails/{message_id}")
async def delete_email(
    message_id: str,
    authorization: str = Header(..., description="Bearer token from session")
):
    """
    Move email to trash
    """
    try:
        if authorization.startswith("Bearer "):
            access_token = authorization.replace("Bearer ", "")
        else:
            access_token = authorization
        
        service, user = await get_gmail_service(access_token=access_token)
        
        service.users().messages().trash(userId="me", id=message_id).execute()
        
        return {
            "message_id": message_id,
            "status": "deleted",
            "message": "Email moved to trash"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete email: {str(e)}")