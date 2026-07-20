from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import require_roles
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

def row_to_dict(result):
    columns = result.keys()
    rows = []
    for row in result:
        row_dict = {}
        for idx, col in enumerate(columns):
            val = row[idx]
            # Convert decimal or date objects to string
            row_dict[col] = str(val) if val is not None else None
        rows.append(row_dict)
    return rows

# =========================================================================
# GET ALL BAGS
# =========================================================================
@router.get("/bags")
def get_bags(status: Optional[str] = "in_stock", db: Session = Depends(get_db)):
    query = """
        SELECT id, bag_code, donor_code, blood_group, component_type, volume, 
               test_result, source, donation_date, expiration_date, 
               storage_location, storage_temp, status, patient_name, 
               patient_blood_group, exported_at
        FROM blood_bags
    """
    if status and status != "all":
        query += " WHERE status = :status"
        result = db.execute(text(query + " ORDER BY expiration_date ASC"), {"status": status})
    else:
        result = db.execute(text(query + " ORDER BY expiration_date ASC"))
    return row_to_dict(result)

# =========================================================================
# GET STATS
# =========================================================================
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # Total bags, count by groups, expiring soon (<= 7 days)
    stats_query = """
        SELECT
            COUNT(*) FILTER (WHERE status = 'in_stock') AS total_in_stock,
            COUNT(*) FILTER (WHERE status = 'in_stock' AND test_result = 'Đang xét nghiệm') AS testing,
            COUNT(*) FILTER (WHERE status = 'in_stock' AND expiration_date <= CURRENT_DATE + INTERVAL '7 days') AS expiring_soon,
            COUNT(*) FILTER (WHERE status = 'in_stock' AND blood_group IN ('O+', 'O-')) AS group_o,
            COUNT(*) FILTER (WHERE status = 'in_stock' AND blood_group IN ('A+', 'A-')) AS group_a,
            COUNT(*) FILTER (WHERE status = 'in_stock' AND blood_group IN ('B+', 'B-')) AS group_b,
            COUNT(*) FILTER (WHERE status = 'in_stock' AND blood_group IN ('AB+', 'AB-')) AS group_ab
        FROM blood_bags
    """
    res = db.execute(text(stats_query)).fetchone()
    return {
        "total_in_stock": int(res[0] or 0),
        "testing": int(res[1] or 0),
        "expiring_soon": int(res[2] or 0),
        "group_o": int(res[3] or 0),
        "group_a": int(res[4] or 0),
        "group_b": int(res[5] or 0),
        "group_ab": int(res[6] or 0),
    }

# =========================================================================
# ADD NEW BLOOD BAG
# =========================================================================
class BloodBagCreate(BaseModel):
    bag_code: str
    donor_code: str
    blood_group: str
    component_type: str
    volume: int
    test_result: str = "Đang xét nghiệm"
    source: str = "Cá nhân"
    donation_date: str
    expiration_date: str
    storage_location: Optional[str] = None
    storage_temp: Optional[float] = None

@router.post("/bags", dependencies=[Depends(require_roles(["admin"]))])
def create_bag(data: BloodBagCreate, db: Session = Depends(get_db)):
    try:
        db.execute(text("""
            INSERT INTO blood_bags (
                bag_code, donor_code, blood_group, component_type, volume,
                test_result, source, donation_date, expiration_date,
                storage_location, storage_temp, status
            ) VALUES (
                :bag_code, :donor_code, :blood_group, :component_type, :volume,
                :test_result, :source, CAST(:donation_date AS DATE), CAST(:expiration_date AS DATE),
                :storage_location, :storage_temp, 'in_stock'
            )
        """), data.model_dump())
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

# =========================================================================
# GET COMPATIBLE BAGS (FEFO)
# =========================================================================
def get_compatible_groups(patient_bg: str, component: str):
    # RBC / Whole Blood / Platelets compatibility
    rbc_map = {
        "O-": ["O-"],
        "O+": ["O-", "O+"],
        "A-": ["A-", "O-"],
        "A+": ["A+", "A-", "O+", "O-"],
        "B-": ["B-", "O-"],
        "B+": ["B+", "B-", "O+", "O-"],
        "AB-": ["AB-", "A-", "B-", "O-"],
        "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    }
    
    # Plasma (Huyết tương) compatibility (inverted)
    plasma_map = {
        "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "O+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "A-": ["A-", "A+", "AB-", "AB+"],
        "A+": ["A-", "A+", "AB-", "AB+"],
        "B-": ["B-", "B+", "AB-", "AB+"],
        "B+": ["B-", "B+", "AB-", "AB+"],
        "AB-": ["AB-", "AB+"],
        "AB+": ["AB-", "AB+"]
    }
    
    if component == "Huyết tương":
        return plasma_map.get(patient_bg, [patient_bg])
    else:
        return rbc_map.get(patient_bg, [patient_bg])

@router.get("/compatible")
def get_compatible_bags(patient_bg: str, component: str, db: Session = Depends(get_db)):
    compatible_groups = get_compatible_groups(patient_bg, component)
    
    # Find matching bags in stock and Safe (An toàn)
    query = """
        SELECT id, bag_code, donor_code, blood_group, component_type, volume, 
               test_result, source, donation_date, expiration_date, 
               storage_location, storage_temp, status
        FROM blood_bags
        WHERE status = 'in_stock' 
          AND test_result = 'An toàn'
          AND component_type = :component
          AND blood_group IN :groups
        ORDER BY expiration_date ASC
    """
    result = db.execute(text(query), {"component": component, "groups": tuple(compatible_groups)})
    return row_to_dict(result)

# =========================================================================
# EXPORT BLOOD BAGS
# =========================================================================
class ExportRequest(BaseModel):
    bag_ids: List[str]
    patient_name: str
    patient_blood_group: str

@router.post("/export", dependencies=[Depends(require_roles(["admin"]))])
def export_bags(data: ExportRequest, db: Session = Depends(get_db)):
    if not data.bag_ids:
        raise HTTPException(status_code=400, detail="No bags selected")
        
    try:
        # Update selected bags
        db.execute(text("""
            UPDATE blood_bags 
            SET status = 'exported',
                patient_name = :patient_name,
                patient_blood_group = :patient_blood_group,
                exported_at = NOW(),
                updated_at = NOW()
            WHERE id IN :ids AND status = 'in_stock'
        """), {"patient_name": data.patient_name, "patient_blood_group": data.patient_blood_group, "ids": tuple(data.bag_ids)})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Export failed: {str(e)}")

# =========================================================================
# CANCEL EXPORT
# =========================================================================
@router.post("/cancel-export/{bag_id}", dependencies=[Depends(require_roles(["admin"]))])
def cancel_export(bag_id: str, db: Session = Depends(get_db)):
    try:
        db.execute(text("""
            UPDATE blood_bags 
            SET status = 'in_stock',
                patient_name = NULL,
                patient_blood_group = NULL,
                exported_at = NULL,
                updated_at = NOW()
            WHERE id = CAST(:id AS UUID) AND status = 'exported'
        """), {"id": bag_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Cancel export failed: {str(e)}")

# =========================================================================
# DELETE BLOOD BAG
# =========================================================================
@router.delete("/bags/{bag_id}", dependencies=[Depends(require_roles(["admin"]))])
def delete_bag(bag_id: str, db: Session = Depends(get_db)):
    try:
        db.execute(text("""
            DELETE FROM blood_bags
            WHERE id = CAST(:id AS UUID)
        """), {"id": bag_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")

