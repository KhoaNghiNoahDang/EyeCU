-- =========================================================================
-- QUẢN LÍ VẬT TƯ & THIẾT BỊ Y TẾ (MEDICAL INVENTORY)
-- Chạy script này trên Supabase SQL Editor
-- Lưu ý: bảng departments đã tồn tại, bảng staffs đã tồn tại
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. BẢNG DANH MỤC THIẾT BỊ Y TẾ (equipment_categories)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),  -- tên icon (vd: 'monitor', 'syringe', ...)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. BẢNG THIẾT BỊ Y TẾ (medical_equipment)
-- Liên kết với departments (bảng khoa phòng đã có)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,               -- Mã thiết bị (VD: TB-001)
    category_id UUID REFERENCES equipment_categories(id),
    department_id UUID REFERENCES departments(id),  -- Liên kết khoa phòng
    manufacturer VARCHAR(200),                      -- Nhà sản xuất
    model VARCHAR(100),                             -- Model / Dòng sản phẩm
    serial_number VARCHAR(100) UNIQUE,              -- Số serial
    purchase_date DATE,                             -- Ngày mua
    warranty_expiry DATE,                           -- Ngày hết bảo hành
    last_maintenance_date DATE,                     -- Bảo trì lần cuối
    next_maintenance_date DATE,                     -- Bảo trì lần tới
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'maintenance', 'broken', 'retired')),
    location VARCHAR(200),                          -- Vị trí đặt thiết bị (phòng, tầng...)
    purchase_price BIGINT,                          -- Giá mua (VNĐ)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 3. BẢNG NHẬT KÝ BẢO TRÌ THIẾT BỊ (equipment_maintenance_logs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES medical_equipment(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES staffs(id),        -- Nhân viên thực hiện
    maintenance_type VARCHAR(50) 
        CHECK (maintenance_type IN ('scheduled', 'repair', 'inspection', 'calibration')),
    description TEXT,
    cost BIGINT,                                    -- Chi phí bảo trì (VNĐ)
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 4. BẢNG DANH MỤC VẬT TƯ TIÊU HAO (supply_categories)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supply_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 5. BẢNG VẬT TƯ TIÊU HAO (medical_supplies)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_supplies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,                     -- Tên vật tư
    category VARCHAR(50) DEFAULT 'consumables'
        CHECK (category IN ('consumables', 'chemicals', 'protective_gear', 'other')),
    unit VARCHAR(50),                               -- Đơn vị (cái, hộp, chai, cuộn...)
    quantity INTEGER DEFAULT 0,                     -- Số lượng tồn kho
    min_quantity INTEGER DEFAULT 0,                 -- Ngưỡng tối thiểu (cảnh báo sắp hết)
    supplier VARCHAR(200),                          -- Nhà cung cấp
    unit_price BIGINT,                              -- Đơn giá (VNĐ)
    expiration_date DATE,                           -- Hạn sử dụng
    location VARCHAR(200),                          -- Vị trí lưu kho
    department_id UUID REFERENCES departments(id),  -- Khoa phòng phụ trách
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 6. BẢNG LỊCH SỬ XUẤT/NHẬP VẬT TƯ (supply_transactions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supply_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supply_id UUID NOT NULL REFERENCES medical_supplies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    performed_by UUID REFERENCES staffs(id),
    department_id UUID REFERENCES departments(id),
    reason TEXT,                                    -- Lý do xuất/nhập
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- =========================================================================

-- Danh mục thiết bị
INSERT INTO equipment_categories (name, description, icon) VALUES
    ('Thiết bị chẩn đoán hình ảnh', 'Máy X-quang, CT, MRI, siêu âm', 'scan'),
    ('Thiết bị hồi sức cấp cứu', 'Máy thở, máy sốc điện, máy monitor', 'activity'),
    ('Thiết bị phẫu thuật', 'Dụng cụ và thiết bị phòng mổ', 'scissors'),
    ('Thiết bị xét nghiệm', 'Máy phân tích máu, sinh hóa, vi sinh', 'flask-conical'),
    ('Thiết bị vật lý trị liệu', 'Thiết bị phục hồi chức năng', 'dumbbell')
ON CONFLICT (name) DO NOTHING;

-- Khoa phòng mẫu (nếu bảng departments trống, chèn thêm; nếu đã có thì bỏ qua)
INSERT INTO departments (name, description) VALUES
    ('Khoa Cấp cứu', 'Tiếp nhận và xử lý các trường hợp cấp cứu'),
    ('Khoa Nội tổng hợp', 'Khám và điều trị các bệnh nội khoa'),
    ('Khoa Ngoại tổng hợp', 'Phẫu thuật và điều trị ngoại khoa'),
    ('Khoa Xét nghiệm', 'Thực hiện các xét nghiệm lâm sàng'),
    ('Khoa Chẩn đoán hình ảnh', 'X-quang, CT, MRI, siêu âm'),
    ('Khoa Hồi sức tích cực (ICU)', 'Chăm sóc bệnh nhân nặng, nguy kịch'),
    ('Khoa Nhi', 'Khám và điều trị bệnh trẻ em'),
    ('Khoa Sản', 'Sản khoa và phụ khoa')
ON CONFLICT (name) DO NOTHING;

-- Thiết bị y tế (dữ liệu demo 15 thiết bị)
WITH
  cats AS (
    SELECT id, name FROM equipment_categories
  ),
  depts AS (
    SELECT id, name FROM departments
  )
INSERT INTO medical_equipment 
  (name, code, category_id, department_id, manufacturer, model, serial_number, 
   purchase_date, warranty_expiry, last_maintenance_date, next_maintenance_date,
   status, location, purchase_price, notes)
VALUES
  -- Thiết bị cấp cứu / ICU
  ('Máy thở xâm nhập HAMILTON-C6', 'TB-001',
    (SELECT id FROM cats WHERE name='Thiết bị hồi sức cấp cứu'),
    (SELECT id FROM depts WHERE name='Khoa Hồi sức tích cực (ICU)'),
    'Hamilton Medical', 'Hamilton-C6', 'HMC6-2024-001',
    '2024-01-15', '2027-01-15', '2025-04-10', '2025-10-10',
    'active', 'ICU - Phòng 1, Giường 3', 850000000,
    'Máy thở cao cấp, hỗ trợ đa mode thở'),

  ('Máy monitor đa thông số Mindray MEC-1200', 'TB-002',
    (SELECT id FROM cats WHERE name='Thiết bị hồi sức cấp cứu'),
    (SELECT id FROM depts WHERE name='Khoa Cấp cứu'),
    'Mindray', 'MEC-1200', 'MRM12-2023-045',
    '2023-06-20', '2026-06-20', '2025-06-20', '2025-12-20',
    'active', 'Cấp cứu - Phòng tiếp nhận', 95000000,
    'Monitor theo dõi SpO2, ECG, huyết áp, nhiệt độ'),

  ('Máy khử rung tim (AED) Philips HeartStart', 'TB-003',
    (SELECT id FROM cats WHERE name='Thiết bị hồi sức cấp cứu'),
    (SELECT id FROM depts WHERE name='Khoa Cấp cứu'),
    'Philips', 'HeartStart FRx', 'PHL-AED-2023-012',
    '2023-03-10', '2026-03-10', '2025-03-10', '2025-09-10',
    'active', 'Cấp cứu - Tủ thiết bị số 2', 45000000,
    'AED tự động, dễ sử dụng trong trường hợp ngừng tim'),

  ('Máy bơm truyền dịch Baxter SIGMA Spectrum', 'TB-004',
    (SELECT id FROM cats WHERE name='Thiết bị hồi sức cấp cứu'),
    (SELECT id FROM depts WHERE name='Khoa Hồi sức tích cực (ICU)'),
    'Baxter', 'SIGMA Spectrum', 'BXT-SP-2024-008',
    '2024-02-01', '2027-02-01', '2025-05-01', '2025-11-01',
    'active', 'ICU - Phòng 2, Giường 1', 35000000,
    'Kiểm soát tốc độ truyền dịch chính xác'),

  -- Thiết bị chẩn đoán hình ảnh
  ('Máy X-quang kỹ thuật số Shimadzu RADspeed', 'TB-005',
    (SELECT id FROM cats WHERE name='Thiết bị chẩn đoán hình ảnh'),
    (SELECT id FROM depts WHERE name='Khoa Chẩn đoán hình ảnh'),
    'Shimadzu', 'RADspeed Pro', 'SMZ-XR-2022-003',
    '2022-08-15', '2025-08-15', '2025-02-15', '2025-08-15',
    'active', 'Phòng X-quang số 1, Tầng 2', 1200000000,
    'Hệ thống X-quang kỹ thuật số toàn thân'),

  ('Máy siêu âm GE LOGIQ E10', 'TB-006',
    (SELECT id FROM cats WHERE name='Thiết bị chẩn đoán hình ảnh'),
    (SELECT id FROM depts WHERE name='Khoa Chẩn đoán hình ảnh'),
    'GE Healthcare', 'LOGIQ E10', 'GEL-2023-021',
    '2023-11-01', '2026-11-01', '2025-05-01', '2025-11-01',
    'active', 'Phòng Siêu âm số 2, Tầng 2', 980000000,
    'Siêu âm 4D, có AI hỗ trợ chẩn đoán'),

  ('Máy CT Scanner Siemens SOMATOM Go.Now', 'TB-007',
    (SELECT id FROM cats WHERE name='Thiết bị chẩn đoán hình ảnh'),
    (SELECT id FROM depts WHERE name='Khoa Chẩn đoán hình ảnh'),
    'Siemens Healthineers', 'SOMATOM Go.Now', 'SIE-CT-2021-001',
    '2021-05-10', '2024-05-10', '2024-11-10', '2025-11-10',
    'maintenance', 'Phòng CT, Tầng 1', 8500000000,
    'Đang trong đợt bảo trì định kỳ tháng 7/2025'),

  -- Thiết bị xét nghiệm
  ('Máy phân tích huyết học Sysmex XN-3000', 'TB-008',
    (SELECT id FROM cats WHERE name='Thiết bị xét nghiệm'),
    (SELECT id FROM depts WHERE name='Khoa Xét nghiệm'),
    'Sysmex', 'XN-3000', 'SYS-XN3K-2023-004',
    '2023-04-20', '2026-04-20', '2025-04-20', '2025-10-20',
    'active', 'Phòng Xét nghiệm Huyết học, Tầng 3', 750000000,
    'Phân tích 29 chỉ số huyết học tự động'),

  ('Máy sinh hóa tự động Roche COBAS c311', 'TB-009',
    (SELECT id FROM cats WHERE name='Thiết bị xét nghiệm'),
    (SELECT id FROM depts WHERE name='Khoa Xét nghiệm'),
    'Roche Diagnostics', 'COBAS c311', 'RCH-C311-2022-007',
    '2022-09-15', '2025-09-15', '2025-03-15', '2025-09-15',
    'active', 'Phòng Sinh hóa, Tầng 3', 620000000,
    'Phân tích sinh hóa 400 mẫu/giờ'),

  ('Máy xét nghiệm miễn dịch Roche COBAS e411', 'TB-010',
    (SELECT id FROM cats WHERE name='Thiết bị xét nghiệm'),
    (SELECT id FROM depts WHERE name='Khoa Xét nghiệm'),
    'Roche Diagnostics', 'COBAS e411', 'RCH-E411-2023-002',
    '2023-07-01', '2026-07-01', '2025-01-01', '2025-07-01',
    'active', 'Phòng Miễn dịch, Tầng 3', 880000000,
    'Xét nghiệm hormone, ung thư dấu ấn, truyền nhiễm'),

  -- Thiết bị phẫu thuật
  ('Hệ thống nội soi Olympus EVIS X1', 'TB-011',
    (SELECT id FROM cats WHERE name='Thiết bị phẫu thuật'),
    (SELECT id FROM depts WHERE name='Khoa Ngoại tổng hợp'),
    'Olympus', 'EVIS X1 Endoscopy System', 'OLY-EVIS-2024-001',
    '2024-03-15', '2027-03-15', '2025-03-15', '2025-09-15',
    'active', 'Phòng mổ Nội soi số 1, Tầng 4', 2200000000,
    'Hệ thống nội soi 4K với công nghệ AI'),

  ('Bàn mổ điện Maquet Alphastar', 'TB-012',
    (SELECT id FROM cats WHERE name='Thiết bị phẫu thuật'),
    (SELECT id FROM depts WHERE name='Khoa Ngoại tổng hợp'),
    'Getinge/Maquet', 'Alphastar', 'MQT-ALP-2022-003',
    '2022-11-20', '2025-11-20', '2025-05-20', '2025-11-20',
    'active', 'Phòng mổ số 3, Tầng 4', 450000000,
    'Bàn mổ đa năng điều chỉnh điện'),

  ('Máy gây mê Dräger Fabius GS Premium', 'TB-013',
    (SELECT id FROM cats WHERE name='Thiết bị phẫu thuật'),
    (SELECT id FROM depts WHERE name='Khoa Ngoại tổng hợp'),
    'Dräger', 'Fabius GS Premium', 'DRG-FGS-2023-002',
    '2023-01-10', '2026-01-10', '2025-01-10', '2025-07-10',
    'active', 'Phòng mổ số 2, Tầng 4', 520000000,
    'Máy gây mê tích hợp monitor thở'),

  -- Thiết bị Nhi
  ('Lồng ấp sơ sinh Atom 2196 (Neo)', 'TB-014',
    (SELECT id FROM cats WHERE name='Thiết bị hồi sức cấp cứu'),
    (SELECT id FROM depts WHERE name='Khoa Nhi'),
    'Atom Medical', '2196-N', 'ATM-2196-2024-005',
    '2024-05-01', '2027-05-01', '2025-05-01', '2025-11-01',
    'active', 'Khoa Nhi - Phòng NICU', 180000000,
    'Lồng ấp sơ sinh với kiểm soát nhiệt độ chính xác'),

  -- Thiết bị bị hỏng
  ('Máy siêu âm tim Philips EPIQ 7 (cũ)', 'TB-015',
    (SELECT id FROM cats WHERE name='Thiết bị chẩn đoán hình ảnh'),
    (SELECT id FROM depts WHERE name='Khoa Chẩn đoán hình ảnh'),
    'Philips', 'EPIQ 7', 'PHL-EPIQ7-2018-001',
    '2018-06-01', '2021-06-01', '2024-12-01', NULL,
    'broken', 'Kho thiết bị, Tầng B1', 1500000000,
    'Hỏng đầu dò siêu âm - đang chờ quyết định thanh lý')
;

-- -------------------------------------------------------------------------
-- Vật tư tiêu hao (demo 15 mục)
-- -------------------------------------------------------------------------
WITH depts AS (SELECT id, name FROM departments)
INSERT INTO medical_supplies
  (name, category, unit, quantity, min_quantity, supplier, unit_price, 
   expiration_date, location, department_id, notes)
VALUES
  -- Vật tư tiêu hao chung
  ('Găng tay y tế nitrile size M (hộp 100 cái)', 'consumables',
    'hộp', 45, 20,
    'Công ty TNHH Y tế Phước Thiện', 85000,
    '2027-12-31', 'Kho vật tư - Kệ A1',
    (SELECT id FROM depts WHERE name='Khoa Cấp cứu'),
    'Găng không bột, chịu hóa chất'),

  ('Khẩu trang y tế 3 lớp (hộp 50 cái)', 'protective_gear',
    'hộp', 120, 30,
    'Công ty CP Dược phẩm Vimedimex', 35000,
    '2026-06-30', 'Kho vật tư - Kệ A2',
    NULL, 'Tiêu chuẩn TCVN'),

  ('Kim tiêm 23G (hộp 100 cái)', 'consumables',
    'hộp', 8, 15,
    'Công ty TNHH Nipro Vietnam', 28000,
    '2028-01-31', 'Tủ vật tư - Ngăn B3',
    (SELECT id FROM depts WHERE name='Khoa Nội tổng hợp'),
    'CẦN BỔ SUNG - dưới mức tối thiểu'),

  ('Dây truyền dịch (hộp 50 bộ)', 'consumables',
    'hộp', 62, 25,
    'Công ty TNHH Y tế Phước Thiện', 95000,
    '2027-03-31', 'Kho vật tư - Kệ B1',
    (SELECT id FROM depts WHERE name='Khoa Hồi sức tích cực (ICU)'),
    NULL),

  ('Bông y tế cuộn 500g', 'consumables',
    'cuộn', 35, 15,
    'Công ty CP Y tế Danameco', 22000,
    '2026-12-31', 'Kho vật tư - Kệ A3',
    NULL, NULL),

  ('Cồn isopropyl 70% (chai 500ml)', 'chemicals',
    'chai', 42, 20,
    'Công ty CP Hóa chất Đức Giang', 18000,
    '2026-09-30', 'Tủ hóa chất - Ngăn C1',
    (SELECT id FROM depts WHERE name='Khoa Xét nghiệm'),
    NULL),

  ('Oxy y tế bình 45 lít', 'consumables',
    'bình', 12, 5,
    'Công ty TNHH Khí công nghiệp Việt Nhật', 680000,
    NULL, 'Kho khí y tế - Tầng B1',
    (SELECT id FROM depts WHERE name='Khoa Hồi sức tích cực (ICU)'),
    'Kiểm tra áp suất mỗi tuần'),

  ('Bộ truyền máu (hộp 25 bộ)', 'consumables',
    'hộp', 18, 10,
    'Công ty TNHH Nipro Vietnam', 125000,
    '2027-05-31', 'Tủ lạnh vật tư - Ngăn D1',
    (SELECT id FROM depts WHERE name='Khoa Ngoại tổng hợp'),
    NULL),

  ('Thuốc thử xét nghiệm máu toàn phần Sysmex', 'chemicals',
    'bộ', 4, 5,
    'Công ty TNHH Sysmex Vietnam', 2800000,
    '2025-09-30', 'Tủ lạnh XN - Ngăn E1',
    (SELECT id FROM depts WHERE name='Khoa Xét nghiệm'),
    'CẢNH BÁO - Sắp hết hàng và gần hết hạn'),

  ('Áo phẫu thuật vô khuẩn (bộ)', 'protective_gear',
    'bộ', 90, 40,
    'Công ty CP Y tế Danameco', 45000,
    '2028-12-31', 'Kho vô khuẩn - Phòng mổ Tầng 4',
    (SELECT id FROM depts WHERE name='Khoa Ngoại tổng hợp'),
    'Bảo quản nhiệt độ phòng'),

  ('Bơm tiêm 10ml (hộp 100 cái)', 'consumables',
    'hộp', 55, 25,
    'Công ty TNHH Y tế Phước Thiện', 48000,
    '2028-06-30', 'Tủ vật tư - Ngăn B1',
    NULL, NULL),

  ('Ống nghiệm chân không EDTA (hộp 100 ống)', 'consumables',
    'hộp', 28, 20,
    'Công ty TNHH BD Biosciences', 115000,
    '2027-08-31', 'Tủ lạnh XN - Ngăn E2',
    (SELECT id FROM depts WHERE name='Khoa Xét nghiệm'),
    NULL),

  ('Gel siêu âm (chai 250ml)', 'chemicals',
    'chai', 25, 10,
    'Công ty TNHH Parker Laboratories VN', 55000,
    '2026-07-31', 'Phòng Siêu âm - Tủ nhỏ',
    (SELECT id FROM depts WHERE name='Khoa Chẩn đoán hình ảnh'),
    NULL),

  ('Khăn trải giường dùng 1 lần (hộp 50 tờ)', 'consumables',
    'hộp', 7, 15,
    'Công ty TNHH Kimberly-Clark Vietnam', 165000,
    '2028-12-31', 'Kho vật tư - Kệ A4',
    (SELECT id FROM depts WHERE name='Khoa Nội tổng hợp'),
    'CẦN ĐẶT HÀNG NGAY'),

  ('Tã sơ sinh giấy (gói 30 cái)', 'consumables',
    'gói', 38, 20,
    'Công ty TNHH Y tế Phước Thiện', 85000,
    '2027-12-31', 'Kho Nhi - Kệ F1',
    (SELECT id FROM depts WHERE name='Khoa Nhi'),
    NULL)
;

-- =========================================================================
-- KÍCH HOẠT ROW LEVEL SECURITY (RLS) cho Supabase (tùy chọn)
-- Bỏ comment nếu muốn dùng RLS
-- =========================================================================
-- ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE medical_equipment ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE medical_supplies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE supply_transactions ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc public (admin frontend)
-- CREATE POLICY "Allow read all" ON medical_equipment FOR SELECT USING (true);
-- CREATE POLICY "Allow read all" ON medical_supplies FOR SELECT USING (true);
-- CREATE POLICY "Allow all" ON medical_equipment FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON medical_supplies FOR ALL USING (true);
