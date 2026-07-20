from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import require_roles
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


def row_to_dict(result):
    columns = result.keys()
    rows = []
    for row in result:
        row_dict = {}
        for idx, col in enumerate(columns):
            val = row[idx]
            row_dict[col] = str(val) if val is not None else None
        rows.append(row_dict)
    return rows


# =========================================================================
# THIET BI Y TE (medical_equipment)
# =========================================================================

@router.get("/equipment")
def get_equipment(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            e.id, e.name, e.code, e.manufacturer, e.model, e.serial_number,
            e.purchase_date, e.warranty_expiry, e.last_maintenance_date,
            e.next_maintenance_date, e.status, e.location, e.purchase_price, e.notes,
            e.created_at, e.updated_at,
            d.name AS department_name, d.id AS department_id,
            c.name AS category_name, c.id AS category_id
        FROM medical_equipment e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN equipment_categories c ON e.category_id = c.id
        ORDER BY e.created_at DESC
    """))
    return row_to_dict(result)


@router.get("/equipment/stats")
def get_equipment_stats(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance,
            SUM(CASE WHEN status = 'broken' THEN 1 ELSE 0 END) AS broken,
            SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) AS retired
        FROM medical_equipment
    """)).fetchone()
    return {
        "total": int(result[0] or 0),
        "active": int(result[1] or 0),
        "maintenance": int(result[2] or 0),
        "broken": int(result[3] or 0),
        "retired": int(result[4] or 0),
    }


class EquipmentCreate(BaseModel):
    name: str
    code: str
    category_id: Optional[str] = None
    department_id: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_expiry: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    next_maintenance_date: Optional[str] = None
    status: Optional[str] = "active"
    location: Optional[str] = None
    purchase_price: Optional[int] = None
    notes: Optional[str] = None


@router.post("/equipment", dependencies=[Depends(require_roles(["admin"]))])
def create_equipment(data: EquipmentCreate, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO medical_equipment
          (name, code, category_id, department_id, manufacturer, model, serial_number,
           purchase_date, warranty_expiry, last_maintenance_date, next_maintenance_date,
           status, location, purchase_price, notes)
        VALUES
          (:name, :code,
           CASE WHEN :category_id IS NOT NULL THEN CAST(:category_id AS UUID) ELSE NULL END,
           CASE WHEN :department_id IS NOT NULL THEN CAST(:department_id AS UUID) ELSE NULL END,
           :manufacturer, :model, :serial_number,
           CASE WHEN :purchase_date IS NOT NULL THEN CAST(:purchase_date AS DATE) ELSE NULL END,
           CASE WHEN :warranty_expiry IS NOT NULL THEN CAST(:warranty_expiry AS DATE) ELSE NULL END,
           CASE WHEN :last_maintenance_date IS NOT NULL THEN CAST(:last_maintenance_date AS DATE) ELSE NULL END,
           CASE WHEN :next_maintenance_date IS NOT NULL THEN CAST(:next_maintenance_date AS DATE) ELSE NULL END,
           :status, :location, :purchase_price, :notes)
    """), data.model_dump())
    db.commit()
    return {"status": "success"}


@router.put("/equipment/{equipment_id}", dependencies=[Depends(require_roles(["admin"]))])
def update_equipment(equipment_id: str, data: EquipmentCreate, db: Session = Depends(get_db)):
    params = data.model_dump()
    params["id"] = equipment_id
    db.execute(text("""
        UPDATE medical_equipment SET
          name=:name, code=:code,
          category_id=CASE WHEN :category_id IS NOT NULL THEN CAST(:category_id AS UUID) ELSE NULL END,
          department_id=CASE WHEN :department_id IS NOT NULL THEN CAST(:department_id AS UUID) ELSE NULL END,
          manufacturer=:manufacturer, model=:model, serial_number=:serial_number,
          purchase_date=CASE WHEN :purchase_date IS NOT NULL THEN CAST(:purchase_date AS DATE) ELSE NULL END,
          warranty_expiry=CASE WHEN :warranty_expiry IS NOT NULL THEN CAST(:warranty_expiry AS DATE) ELSE NULL END,
          last_maintenance_date=CASE WHEN :last_maintenance_date IS NOT NULL THEN CAST(:last_maintenance_date AS DATE) ELSE NULL END,
          next_maintenance_date=CASE WHEN :next_maintenance_date IS NOT NULL THEN CAST(:next_maintenance_date AS DATE) ELSE NULL END,
          status=:status, location=:location, purchase_price=:purchase_price,
          notes=:notes, updated_at=NOW()
        WHERE id=CAST(:id AS UUID)
    """), params)
    db.commit()
    return {"status": "success"}


class EquipmentStatusUpdate(BaseModel):
    status: str

@router.patch("/equipment/{equipment_id}/status", dependencies=[Depends(require_roles(["admin"]))])
def update_equipment_status(equipment_id: str, data: EquipmentStatusUpdate, db: Session = Depends(get_db)):
    db.execute(text("""
        UPDATE medical_equipment 
        SET status=:status, updated_at=NOW()
        WHERE id=CAST(:id AS UUID)
    """), {"id": equipment_id, "status": data.status})
    db.commit()
    return {"status": "success"}


@router.delete("/equipment/{equipment_id}", dependencies=[Depends(require_roles(["admin"]))])
def delete_equipment(equipment_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM medical_equipment WHERE id=CAST(:id AS UUID)"), {"id": equipment_id})
    db.commit()
    return {"status": "success"}


# =========================================================================
# VAT TU TIEU HAO (medical_supplies)
# =========================================================================

@router.get("/supplies")
def get_supplies(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            s.id, s.name, s.category, s.unit, s.quantity, s.min_quantity,
            s.supplier, s.expiration_date, s.location,
            s.notes, s.created_at, s.updated_at, s.department_id, s.barcode,
            d.name AS department_name
        FROM medical_supplies s
        LEFT JOIN departments d ON s.department_id = d.id
        ORDER BY s.name
    """))
    return row_to_dict(result)


@router.get("/supplies/stats")
def get_supplies_stats(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN quantity < min_quantity THEN 1 ELSE 0 END) AS low_stock,
            SUM(CASE WHEN expiration_date < CURRENT_DATE THEN 1 ELSE 0 END) AS expired,
            SUM(CASE WHEN expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) AS expiring_soon
        FROM medical_supplies
    """)).fetchone()
    return {
        "total": int(result[0] or 0),
        "low_stock": int(result[1] or 0),
        "expired": int(result[2] or 0),
        "expiring_soon": int(result[3] or 0),
    }


class SupplyCreate(BaseModel):
    name: str
    category: Optional[str] = "consumables"
    unit: Optional[str] = None
    quantity: Optional[int] = 0
    min_quantity: Optional[int] = 0
    supplier: Optional[str] = None
    expiration_date: Optional[str] = None
    location: Optional[str] = None
    department_id: Optional[str] = None
    notes: Optional[str] = None
    barcode: Optional[str] = None


@router.post("/supplies", dependencies=[Depends(require_roles(["admin"]))])
def create_supply(data: SupplyCreate, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO medical_supplies
          (name, category, unit, quantity, min_quantity, supplier,
           expiration_date, location, department_id, notes, barcode)
        VALUES
          (:name, :category, :unit, :quantity, :min_quantity, :supplier,
           CASE WHEN :expiration_date IS NOT NULL THEN CAST(:expiration_date AS DATE) ELSE NULL END,
           :location,
           CASE WHEN :department_id IS NOT NULL THEN CAST(:department_id AS UUID) ELSE NULL END,
           :notes, :barcode)
    """), data.model_dump())
    db.commit()
    return {"status": "success"}


@router.put("/supplies/{supply_id}", dependencies=[Depends(require_roles(["admin"]))])
def update_supply(supply_id: str, data: SupplyCreate, db: Session = Depends(get_db)):
    params = data.model_dump()
    params["id"] = supply_id
    db.execute(text("""
        UPDATE medical_supplies SET
          name=:name, category=:category, unit=:unit, quantity=:quantity,
          min_quantity=:min_quantity, supplier=:supplier,
          expiration_date=CASE WHEN :expiration_date IS NOT NULL THEN CAST(:expiration_date AS DATE) ELSE NULL END,
          location=:location,
          department_id=CASE WHEN :department_id IS NOT NULL THEN CAST(:department_id AS UUID) ELSE NULL END,
          notes=:notes, barcode=:barcode, updated_at=NOW()
        WHERE id=CAST(:id AS UUID)
    """), params)
    db.commit()
    return {"status": "success"}


@router.delete("/supplies/{supply_id}", dependencies=[Depends(require_roles(["admin"]))])
def delete_supply(supply_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM medical_supplies WHERE id=CAST(:id AS UUID)"), {"id": supply_id})
    db.commit()
    return {"status": "success"}

@router.get("/supplies/lookup-barcode/{barcode}")
def lookup_supply_barcode(barcode: str, db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT name, category, unit, min_quantity, SUM(quantity) as total_quantity
        FROM medical_supplies
        WHERE barcode = :barcode
        GROUP BY name, category, unit, min_quantity
        LIMIT 1
    """), {"barcode": barcode}).fetchone()
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Barcode not found")
    
    return {
        "name": result[0],
        "category": result[1],
        "unit": result[2],
        "min_quantity": result[3],
        "total_quantity": result[4],
    }

class SupplyExportFIFO(BaseModel):
    barcode: str
    quantity: int

@router.post("/supplies/export-fifo", dependencies=[Depends(require_roles(["admin"]))])
def export_supply_fifo(data: SupplyExportFIFO, db: Session = Depends(get_db)):
    # Lấy các lô hàng theo barcode, ưu tiên hết hạn trước
    batches = db.execute(text("""
        SELECT id, quantity, expiration_date
        FROM medical_supplies
        WHERE barcode = :barcode AND quantity > 0
        ORDER BY 
            CASE WHEN expiration_date IS NULL THEN 1 ELSE 0 END ASC, 
            expiration_date ASC, 
            created_at ASC
    """), {"barcode": data.barcode}).fetchall()

    if not batches:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Vật tư này không còn trong kho hoặc barcode không tồn tại")

    remaining_qty = data.quantity
    updated_batches = []
    
    for batch in batches:
        b_id = batch[0]
        b_qty = batch[1]
        
        if remaining_qty <= 0:
            break
            
        if b_qty >= remaining_qty:
            db.execute(text("UPDATE medical_supplies SET quantity = quantity - :qty, updated_at = NOW() WHERE id = :id"), 
                       {"qty": remaining_qty, "id": b_id})
            updated_batches.append({"id": str(b_id), "deducted": remaining_qty})
            remaining_qty = 0
        else:
            db.execute(text("UPDATE medical_supplies SET quantity = 0, updated_at = NOW() WHERE id = :id"), 
                       {"id": b_id})
            updated_batches.append({"id": str(b_id), "deducted": b_qty})
            remaining_qty -= b_qty
            
    if remaining_qty > 0:
        db.rollback()
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Không đủ số lượng trong kho. Còn thiếu {remaining_qty}")
        
    db.commit()
    return {"status": "success", "exported_quantity": data.quantity, "batches_affected": updated_batches}



# =========================================================================
# DANH MUC (equipment_categories)
# =========================================================================

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    result = db.execute(text(
        "SELECT id, name, description, icon FROM equipment_categories ORDER BY name"
    ))
    return row_to_dict(result)

