from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
import traceback
from app.database import get_database
from app.schemas.issues import IssueCreate, IssueStatus, IssuePriority, IssueSource
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
        print(f"❌ Error creating issue: {str(e)}")
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
        
        # Convert ObjectId to string and create JSON-serializable dicts
        result = []
        for issue in issues:
            issue_dict = dict(issue)  # Create a copy to avoid modifying original
            if "_id" in issue_dict:
                issue_dict["id"] = str(issue_dict["_id"])
                del issue_dict["_id"]  # Remove _id to avoid duplication
            result.append(issue_dict)
        
        return {
            "issues": result,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "count": len(result)
        }
        
    except Exception as e:
        print(f"❌ Error fetching issues: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch issues: {str(e)}")


@router.get("/{issue_id}")
async def get_issue(issue_id: str):
    """
    Get a specific issue by ID
    """
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
        print(f"❌ Error fetching issue: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid issue ID")


@router.put("/{issue_id}")
async def update_issue(issue_id: str, update_data: dict):
    """
    Update an issue
    """
    try:
        db = get_database()
        
        # Check if issue exists
        issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        # Update timestamps
        update_data["updated_at"] = datetime.utcnow()
        
        # Perform update
        result = await db.issues.update_one(
            {"_id": ObjectId(issue_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            # No changes made, return existing issue
            issue["id"] = str(issue["_id"])
            return issue
        
        # Fetch updated issue
        updated_issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        updated_issue["id"] = str(updated_issue["_id"])
        
        print(f"✅ Issue updated successfully: {issue_id}")
        return updated_issue
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating issue: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid issue ID")


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
        
        print(f"✅ Issue deleted: {issue_id}")
        return {"message": "Issue deleted successfully", "issue_id": issue_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting issue: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid issue ID")
