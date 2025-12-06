from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
from app.services.gmail import get_gmail_service
import base64
from email.mime.text import MIMEText
from datetime import datetime

from app.services.classification import classification
from app.services.response import generate_inquiry_response
from app.services.categorized import category
from app.services.assignment import assign_to_employee
from app.database import get_database
from app.schemas.company import UserRole
from app.schemas.issues import IssueCreate, IssueStatus, IssuePriority, IssueSource
from app.schemas.assignments import AssignmentCreate, AssignmentSource, AssignmentStatus
from bson import ObjectId

router = APIRouter()


class EmailData(BaseModel):
    to: EmailStr
    subject: str
    body: str


class ProcessedEmailData(BaseModel):
    email_id: str
    classification: str
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    issue_id: Optional[str] = None
    response_generated: bool = False


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


async def save_draft(service, to_email: str, subject: str, body: str):
    """Save email as draft in Gmail"""
    try:
        message = MIMEText(body)
        message['to'] = to_email
        message['subject'] = subject
        
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        draft = service.users().drafts().create(
            userId="me",
            body={
                "message": {
                    "raw": encoded_message
                }
            }
        ).execute()
        
        return draft.get("id")
    except Exception as e:
        print(f" Failed to save draft: {e}")
        return None


async def mark_email_as_read(service, message_id: str):
    """Mark email as read"""
    try:
        service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]}
        ).execute()
        print(f" Marked email {message_id} as read")
    except Exception as e:
        print(f" Failed to mark email as read: {e}")


async def send_assignment_email(
    service,
    employee_email: str,
    subject: str,
    message: str,
    category: str,
    issue_id: str
):
    try:
        email_body = f"""
Hello,

You have been assigned a new issue:

Subject: {subject}
Category: {category}
Issue ID: {issue_id}

Message:
{message}

Please review and take appropriate action.

Best regards,
Support Team
"""
        
        email_message = MIMEText(email_body)
        email_message['to'] = employee_email
        email_message['subject'] = f"New Assignment: {subject}"
        
        encoded_message = base64.urlsafe_b64encode(email_message.as_bytes()).decode()
        
        service.users().messages().send(
            userId="me",
            body={"raw": encoded_message}
        ).execute()
        
        print(f" Sent assignment email to {employee_email}")
    except Exception as e:
        print(f" Failed to send assignment email: {e}")


async def send_response_to_customer(
    service,
    customer_email: str,
    subject: str,
    body: str
):
    try:
        email_message = MIMEText(body)
        email_message['to'] = customer_email
        email_message['subject'] = f"Re: {subject}"
        
        encoded_message = base64.urlsafe_b64encode(email_message.as_bytes()).decode()
        
        service.users().messages().send(
            userId="me",
            body={"raw": encoded_message}
        ).execute()
        
        print(f" Sent response to customer {customer_email}")
    except Exception as e:
        print(f" Failed to send response to customer: {e}")


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

        employees_list: list[Dict] = []
        company_info: Optional[Dict] = None
        
        if company_id:
            try:
                db = get_database()
                employees = await db.users.find({
                    "company_id": company_id, 
                    "role": UserRole.EMPLOYEE.value
                }).to_list(200)
                
                employees_list = [
                    {
                        "id": str(e.get("_id")),
                        "name": e.get("name"),
                        "email": e.get("email"),
                        "department": e.get("department"),
                        "position": e.get("position"),
                        "skills": e.get("skills", []),
                        "specialties": e.get("specialties", []),
                        "tags": e.get("tags", []),
                        "current_load": e.get("current_load", 0),
                        "max_capacity": e.get("max_capacity", 10)
                    }
                    for e in employees
                ]

                company_doc = await db.companies.find_one({"_id": ObjectId(company_id)})
                if company_doc:
                    company_info = {
                        "id": str(company_doc.get("_id")),
                        "name": company_doc.get("name"),
                        "email": company_doc.get("email"),
                        "website": str(company_doc.get("website")) if company_doc.get("website") else None,
                    }
            except Exception as e:
                print(f" Failed to load company data: {e}")

        if not messages:
            return {
                "user": user["email"],
                "messages": [],
                "employees": employees_list,
                "company": company_info,
                "message": f"No {'unread ' if unread_only else ''}emails found",
            }

        detailed_messages = []
        db = get_database()

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
                email_text = f"From: {parsed['from']}\nSubject: {parsed['subject']}\n\n{parsed['body']}"

                classification_result = classification(email=email_text, email_id=parsed["id"])
                parsed["classification"] = classification_result
                classification_type = classification_result.get('classification')

                print(f"\n CLASSIFICATION: {classification_type} for {parsed['id']}")

                if classification_type in ('none', 'spam', None):
                    print(f"Skipping {classification_type} email")
                    continue

                if classification_type == 'inquiry':
                    response_result = generate_inquiry_response(
                        email=email_text,
                        email_id=parsed["id"],
                        category=classification_type,
                        context={
                            "company_name": company_info.get("name") if company_info else "Our Company",
                            "support_email": company_info.get("email") if company_info else "support@company.com",
                            "website": company_info.get("website") if company_info else "www.company.com"
                        },
                        tone="professional"
                    )
                    parsed["response"] = response_result
                    print(f"\n GENERATED RESPONSE for inquiry")

                    if response_result.get("body"):
                        draft_id = await save_draft(
                            service,
                            parsed['from'],
                            response_result.get("subject", f"Re: {parsed['subject']}"),
                            response_result.get("body")
                        )
                        parsed["draft_id"] = draft_id
                        
                        await db.emails.insert_one({
                            "email_id": parsed["id"],
                            "sender": parsed['from'],
                            "subject": parsed['subject'],
                            "body": parsed['body'],
                            "classification": classification_type,
                            "response": response_result,
                            "draft_id": draft_id,
                            "processed_at": datetime.utcnow(),
                            "company_id": company_id,
                            "status": "draft_created"
                        })

                elif classification_type == 'ticket':
                    category_result = category(
                        email=email_text,
                        email_id=parsed["id"],
                        allow_new_categories=True
                    )
                    parsed["ticket_category"] = category_result
                    ticket_category = category_result.get("category", "general")
                    
                    print(f"\n CATEGORY: {ticket_category}")

                    if employees_list:
                        assignment_result = assign_to_employee(
                            email=email_text,
                            email_id=parsed["id"],
                            category=ticket_category,
                            employees=employees_list,
                            category_response=category_result,
                            classification_response=classification_result
                        )
                        parsed["assignment"] = assignment_result
                        
                        assigned_employee_id = assignment_result.get("assigned_to")
                        
                        if assigned_employee_id:
                            print(f"\n ASSIGNED TO: {assignment_result.get('employee_name')}")
                            
                            issue_data = {
                                "company_id": company_id,
                                "subject": parsed['subject'],
                                "message": parsed['body'],
                                "from_email": parsed['from'],
                                "category": ticket_category,
                                "priority": IssuePriority.MEDIUM.value,
                                "status": IssueStatus.ASSIGNED.value,
                                "source": IssueSource.EMAIL.value,
                                "assigned_to": assigned_employee_id,
                                "emailId": parsed["id"],
                                "created_at": datetime.utcnow(),
                                "updated_at": datetime.utcnow()
                            }
                            
                            issue_result = await db.issues.insert_one(issue_data)
                            issue_id = str(issue_result.inserted_id)
                            parsed["issue_id"] = issue_id
                            
                            print(f"\n CREATED ISSUE: {issue_id}")

                            assignment_data = {
                                "employee_id": assigned_employee_id,
                                "company_id": company_id,
                                "issue_id": issue_id,
                                "subject": parsed['subject'],
                                "message": parsed['body'],
                                "category": ticket_category,
                                "priority": "medium",
                                "status": AssignmentStatus.TODO.value,
                                "source": AssignmentSource.AUTO.value,
                                "created_at": datetime.utcnow(),
                                "updated_at": datetime.utcnow()
                            }
                            
                            assignment_db_result = await db.assignments.insert_one(assignment_data)
                            print(f"\n CREATED ASSIGNMENT: {assignment_db_result.inserted_id}")

                            employee = next((e for e in employees_list if e["id"] == assigned_employee_id), None)
                            if employee:
                                await send_assignment_email(
                                    service,
                                    employee["email"],
                                    parsed['subject'],
                                    parsed['body'],
                                    ticket_category,
                                    issue_id
                                )

                            confirmation_body = f"""
Thank you for contacting us.

Your issue has been received and assigned to our team. 

Issue ID: {issue_id}
Category: {ticket_category}

We will get back to you shortly.

Best regards,
{company_info.get('name') if company_info else 'Support Team'}
"""
                            await send_response_to_customer(
                                service,
                                parsed['from'],
                                parsed['subject'],
                                confirmation_body
                            )

                            await mark_email_as_read(service, parsed["id"])
                            
                            await db.emails.insert_one({
                                "email_id": parsed["id"],
                                "sender": parsed['from'],
                                "subject": parsed['subject'],
                                "body": parsed['body'],
                                "classification": classification_type,
                                "category": ticket_category,
                                "assigned_to": assigned_employee_id,
                                "issue_id": issue_id,
                                "processed_at": datetime.utcnow(),
                                "company_id": company_id,
                                "status": "processed"
                            })

                detailed_messages.append(parsed)
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"⚠️ Error processing message {msg['id']}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue

        return {
            "user": user["email"],
            "messages": detailed_messages,
            "employees": employees_list,
            "company": company_info,
            "count": len(detailed_messages),
            "total_in_inbox": len(messages),
            "unread_only": unread_only,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f" Error reading emails: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to read emails: {str(e)}")


@router.post("/send-email")
async def send_email(
    data: EmailData,
    authorization: str = Header(...)
):
    """Send an email via Gmail"""
    try:
        access_token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        service, user = await get_gmail_service(access_token=access_token)
        
        message = MIMEText(data.body)
        message['to'] = data.to
        message['from'] = user['email']
        message['subject'] = data.subject
        
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        send_message = service.users().messages().send(
            userId="me",
            body={"raw": encoded_message}
        ).execute()
        
        return {
            "status": "sent",
            "message_id": send_message.get("id"),
            "from": user['email'],
            "to": data.to,
            "subject": data.subject
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")