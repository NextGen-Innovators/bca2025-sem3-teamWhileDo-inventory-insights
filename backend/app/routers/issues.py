from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
import traceback
from app.database import get_database
from app.schemas.issues import IssueCreate, IssueStatus, IssuePriority, IssueSource, IssueUpdate
from app.schemas.company import UserRole

router = APIRouter()


@router.post("/", status_code=201)
async def create_issue(issue_data: IssueCreate):
    """
    Create a new issue
    """
    try:
        db = get_database()
        
        # Convert Pydantic model to dict
        issue_dict = issue_data.model_dump()
        
        # Add timestamps
        issue_dict.update({
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        
        # Insert issue into database
        result = await db.issues.insert_one(issue_dict)
        issue_id = str(result.inserted_id)
        
        print(f" Issue created successfully: {issue_id}")
        return {
            "id": issue_id,
            "message": "Issue created successfully",
            **issue_dict
        }
        
    except Exception as e:
        print(f"Error creating issue: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create issue: {str(e)}")


@router.get("/")
async def get_all_issues(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned employee ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Number of records to return"),
):
    
    try:
        db = get_database()
        
        # Build query filter
        query_filter = {}
        
        if company_id:
            query_filter["company_id"] = company_id
        if status:
            query_filter["status"] = status
        if priority:
            query_filter["priority"] = priority
        if assigned_to:
            query_filter["assigned_to"] = assigned_to
        
        # Get total count
        total_count = await db.issues.count_documents(query_filter)
        
        # Get issues with pagination
        issues = await db.issues.find(query_filter).skip(skip).limit(limit).to_list(length=limit)
        
        # Collect all unique assigned_to IDs
        assigned_user_ids = set()
        for issue in issues:
            if issue.get("assigned_to"):
                assigned_user_ids.add(issue["assigned_to"])
        
        # Fetch all assigned users in one query
        assigned_users = {}
        if assigned_user_ids:
            # Convert string IDs to ObjectId for querying
            object_ids = []
            for uid in assigned_user_ids:
                try:
                    object_ids.append(ObjectId(uid))
                except:
                    # Skip invalid ObjectId formats
                    continue
            
            if object_ids:
                users = await db.users.find({
                    "_id": {"$in": object_ids}
                }).to_list(1000)
                
                # Create mapping using string IDs as keys (matching issue format)
                for user in users:
                    user_id = str(user["_id"])
                    assigned_users[user_id] = {
                        "id": user_id,
                        "name": user.get("name"),
                        "email": user.get("email"),
                        "department": user.get("department"),
                        "position": user.get("position"),
                        "skills": user.get("skills", []),
                        "tags": user.get("tags", []),
                    }
        
        # Convert ObjectId to string and create JSON-serializable dicts
        result = []
        for issue in issues:
            issue_dict = dict(issue)  # Create a copy to avoid modifying original
            if "_id" in issue_dict:
                issue_dict["id"] = str(issue_dict["_id"])
                del issue_dict["_id"]  # Remove _id to avoid duplication
            
            # Add assigned user information if available
            assigned_to_id = issue_dict.get("assigned_to")
            if assigned_to_id and assigned_to_id in assigned_users:
                issue_dict["assigned_user"] = assigned_users[assigned_to_id]
            elif assigned_to_id:
                # User not found, but keep the ID
                issue_dict["assigned_user"] = None
            
            result.append(issue_dict)
        
        return {
            "issues": result,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "count": len(result)
        }
        
    except Exception as e:
        print(f"Error fetching issues: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch issues: {str(e)}")


@router.get("/assigned/{employee_id}")
async def get_employee_assigned_issues(
    employee_id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Number of records to return"),
):
    """
    Get all issues assigned to a specific employee
    """
    try:
        db = get_database()
        
        # Verify employee exists
        try:
            employee = await db.users.find_one({"_id": ObjectId(employee_id)})
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")
        except:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        # Build query filter - must be assigned to this employee
        query_filter = {"assigned_to": employee_id}
        
        if company_id:
            query_filter["company_id"] = company_id
        if status:
            query_filter["status"] = status
        if priority:
            query_filter["priority"] = priority
        
        # Get total count
        total_count = await db.issues.count_documents(query_filter)
        
        # Get issues with pagination
        issues = await db.issues.find(query_filter).skip(skip).limit(limit).to_list(length=limit)
        
        # Get employee information for assigned_user
        employee_info = {
            "id": employee_id,
            "name": employee.get("name"),
            "email": employee.get("email"),
            "department": employee.get("department"),
            "position": employee.get("position"),
            "skills": employee.get("skills", []),
            "tags": employee.get("tags", []),
        }
        
        # Convert ObjectId to string and create JSON-serializable dicts
        result = []
        for issue in issues:
            issue_dict = dict(issue)  # Create a copy to avoid modifying original
            if "_id" in issue_dict:
                issue_dict["id"] = str(issue_dict["_id"])
                del issue_dict["_id"]  # Remove _id to avoid duplication
            
            # Add assigned user information (always the same employee)
            issue_dict["assigned_user"] = employee_info
            
            result.append(issue_dict)
        
        return {
            "issues": result,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "count": len(result),
            "employee": employee_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching employee assigned issues: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch assigned issues: {str(e)}")


@router.get("/{issue_id}")
async def get_issue(issue_id: str):
 
    try:
        db = get_database()
        
        issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        issue["id"] = str(issue["_id"])
        return issue
        
    except HTTPException:
        raise
    except Exception as e:
        print(f" Error fetching issue: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid issue ID")


@router.put("/{issue_id}")
async def update_issue(issue_id: str, update_data: IssueUpdate):
    
    try:
        db = get_database()
        
        # Check if issue exists
        issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
        
        if "assigned_to" not in update_dict:
            update_dict["assigned_to"] = issue.get("assigned_to")
        
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.issues.update_one(
            {"_id": ObjectId(issue_id)},
            {"$set": update_dict}
        )
        
        updated_issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        
        issue_dict = dict(updated_issue)
        issue_dict["id"] = str(issue_dict["_id"])
        del issue_dict["_id"]
        
        assigned_to_id = issue_dict.get("assigned_to")
        if assigned_to_id:
            try:
                user = await db.users.find_one({"_id": ObjectId(assigned_to_id)})
                if user:
                    issue_dict["assigned_user"] = {
                        "id": str(user["_id"]),
                        "name": user.get("name"),
                        "email": user.get("email"),
                        "department": user.get("department"),
                        "position": user.get("position"),
                        "skills": user.get("skills", []),
                        "tags": user.get("tags", []),
                    }
            except:
                pass
        
        print(f" Issue updated successfully: {issue_id}")
        return issue_dict
        
    except HTTPException:
        raise
    except Exception as e:
        print(f" Error updating issue: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Failed to update issue: {str(e)}")


@router.delete("/{issue_id}")
async def delete_issue(issue_id: str):
    """
    Delete an issue
    """
    try:
        db = get_database()
        
        # Check if issue exists
        issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        # Delete issue
        await db.issues.delete_one({"_id": ObjectId(issue_id)})
        
        print(f" Issue deleted: {issue_id}")
        return {"message": "Issue deleted successfully", "issue_id": issue_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting issue: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid issue ID")
