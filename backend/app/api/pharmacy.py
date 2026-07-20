from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
import uuid
import random

router = APIRouter()

def generate_ean13() -> str:
    """Sinh ma EAN-13 hop le voi check digit chinh xac (prefix 893 = Viet Nam)."""
    # 12 chu so dau (prefix 893 + 9 chu so ngau nhien)
    digits = [8, 9, 3] + [random.randint(0, 9) for _ in range(9)]
    # Tinh check digit theo chuan EAN-13
    total = sum(
        d * (1 if i % 2 == 0 else 3)
        for i, d in enumerate(digits)
    )
    check = (10 - (total % 10)) % 10
    digits.append(check)
    return ''.join(map(str, digits))

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

@router.get("/batches")
def get_pharmacy_batches(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT 
            b.id,
            b.batch_number,
            m.name,
            m.active_ingredient,
            m.category,
            b.quantity,
            m.min_quantity,
            m.unit,
            b.expiration_date,
            b.supplier,
            b.location,
            m.id as medicine_id,
            m.barcode
        FROM pharmacy_batches b
        JOIN pharmacy_medicines m ON b.medicine_id = m.id
        ORDER BY m.name ASC, b.expiration_date ASC
    """))
    return row_to_dict(result)

@router.get("/lookup-barcode/{barcode}")
def lookup_barcode(barcode: str, db: Session = Depends(get_db)):
    medicine = db.execute(text("""
        SELECT id, barcode, name, active_ingredient, category, min_quantity, unit
        FROM pharmacy_medicines
        WHERE barcode = :barcode
    """), {"barcode": barcode}).fetchone()

    if not medicine:
        raise HTTPException(status_code=404, detail="Khong tim thay thuoc voi ma barcode nay")

    med_dict = {
        "id": str(medicine[0]),
        "barcode": str(medicine[1]) if medicine[1] else None,
        "name": str(medicine[2]),
        "active_ingredient": str(medicine[3]) if medicine[3] else "",
        "category": str(medicine[4]) if medicine[4] else "",
        "min_quantity": int(medicine[5]) if medicine[5] else 0,
        "unit": str(medicine[6]) if medicine[6] else "Hop",
    }

    batches = db.execute(text("""
        SELECT id, batch_number, quantity, expiration_date, supplier, location
        FROM pharmacy_batches
        WHERE medicine_id = :med_id AND quantity > 0
        ORDER BY expiration_date ASC
    """), {"med_id": medicine[0]}).fetchall()

    total_quantity = sum(int(b[2]) for b in batches)
    batch_list = [
        {
            "id": str(b[0]),
            "batch_number": str(b[1]),
            "quantity": int(b[2]),
            "expiration_date": str(b[3]),
            "supplier": str(b[4]) if b[4] else "",
            "location": str(b[5]) if b[5] else "",
        }
        for b in batches
    ]

    return {
        **med_dict,
        "total_quantity": total_quantity,
        "batches": batch_list,
    }

@router.post("/export-fifo")
def export_fifo(payload: dict, db: Session = Depends(get_db)):
    barcode = payload.get("barcode")
    export_qty = int(payload.get("quantity", 0))

    if not barcode:
        raise HTTPException(status_code=400, detail="Thieu ma barcode")
    if export_qty <= 0:
        raise HTTPException(status_code=400, detail="So luong xuat phai lon hon 0")

    medicine = db.execute(text("""
        SELECT id, name, unit FROM pharmacy_medicines WHERE barcode = :barcode
    """), {"barcode": barcode}).fetchone()

    if not medicine:
        raise HTTPException(status_code=404, detail="Khong tim thay thuoc voi ma barcode nay")

    med_id = medicine[0]
    med_name = str(medicine[1])
    med_unit = str(medicine[2])

    batches = db.execute(text("""
        SELECT id, batch_number, quantity, expiration_date
        FROM pharmacy_batches
        WHERE medicine_id = :med_id AND quantity > 0
        ORDER BY expiration_date ASC
    """), {"med_id": med_id}).fetchall()

    total_available = sum(int(b[2]) for b in batches)

    if total_available < export_qty:
        raise HTTPException(
            status_code=400,
            detail=f"Khong du so luong trong kho. Hien con: {total_available} {med_unit}"
        )

    remain = export_qty
    exported_detail = []

    for batch in batches:
        if remain <= 0:
            break

        batch_id = batch[0]
        batch_number = str(batch[1])
        batch_qty = int(batch[2])
        exp_date = str(batch[3])

        if batch_qty <= remain:
            deduct = batch_qty
            new_qty = 0
        else:
            deduct = remain
            new_qty = batch_qty - deduct

        db.execute(text("""
            UPDATE pharmacy_batches SET quantity = :new_qty WHERE id = :batch_id
        """), {"new_qty": new_qty, "batch_id": batch_id})

        exported_detail.append({
            "batch_id": str(batch_id),
            "batch_number": batch_number,
            "expiration_date": exp_date,
            "deducted": deduct,
        })

        remain -= deduct

    db.commit()

    return {
        "status": "success",
        "medicine_name": med_name,
        "unit": med_unit,
        "total_exported": export_qty,
        "fifo_detail": exported_detail,
    }

@router.post("/medicines")
def add_medicine(payload: dict, db: Session = Depends(get_db)):
    med_id = f"MED-{uuid.uuid4().hex[:8].upper()}"
    barcode = generate_ean13()
    db.execute(text("""
        INSERT INTO pharmacy_medicines (id, barcode, name, active_ingredient, category, min_quantity, unit)
        VALUES (:id, :barcode, :name, :active_ingredient, :category, :min_quantity, :unit)
    """), {
        "id": med_id,
        "barcode": payload.get("barcode") or barcode,
        "name": payload.get("name"),
        "active_ingredient": payload.get("active_ingredient", ""),
        "category": payload.get("category", ""),
        "min_quantity": int(payload.get("min_quantity", 0)),
        "unit": payload.get("unit", "Hop")
    })
    db.commit()
    return {"status": "success", "id": med_id}

@router.post("/batches")
def add_batch(payload: dict, db: Session = Depends(get_db)):
    batch_id = f"BAT-{uuid.uuid4().hex[:8].upper()}"
    db.execute(text("""
        INSERT INTO pharmacy_batches (id, medicine_id, batch_number, quantity, expiration_date, supplier, location)
        VALUES (:id, :medicine_id, :batch_number, :quantity, :expiration_date, :supplier, :location)
    """), {
        "id": batch_id,
        "medicine_id": payload.get("medicine_id"),
        "batch_number": payload.get("batch_number"),
        "quantity": int(payload.get("quantity", 0)),
        "expiration_date": payload.get("expiration_date"),
        "supplier": payload.get("supplier", ""),
        "location": payload.get("location", "")
    })
    db.commit()
    return {"status": "success", "id": batch_id}
