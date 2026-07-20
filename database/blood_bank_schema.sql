-- =========================================================================
-- QUẢN LÝ KHO MÁU (BLOOD BANK MANAGEMENT)
-- =========================================================================

CREATE TABLE IF NOT EXISTS blood_bags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bag_code VARCHAR(50) UNIQUE NOT NULL,                       -- Mã vạch túi máu (VD: BB-2026-0001)
    donor_code VARCHAR(50) NOT NULL,                            -- Mã định danh người hiến
    blood_group VARCHAR(10) NOT NULL,                           -- O+, O-, A+, A-, B+, B-, AB+, AB-
    component_type VARCHAR(50) NOT NULL
        CHECK (component_type IN ('Máu toàn phần', 'Khối hồng cầu', 'Huyết tương', 'Khối tiểu cầu')),
    volume INTEGER NOT NULL,                                    -- Thể tích (ml)
    test_result VARCHAR(50) NOT NULL DEFAULT 'Đang xét nghiệm'
        CHECK (test_result IN ('An toàn', 'Đang xét nghiệm')),
    source VARCHAR(100) NOT NULL DEFAULT 'Cá nhân',
    donation_date DATE NOT NULL,
    expiration_date DATE NOT NULL,                              -- Ngày hết hạn (FEFO)
    storage_location VARCHAR(100),                              -- Vị trí lưu trữ (VD: Tủ A - Ngăn 1)
    storage_temp NUMERIC(4,1),                                  -- Nhiệt độ lưu trữ thực tế
    status VARCHAR(20) NOT NULL DEFAULT 'in_stock'
        CHECK (status IN ('in_stock', 'exported', 'discarded')),
    patient_name VARCHAR(100),                                  -- Tên bệnh nhân nhận (nếu xuất)
    patient_blood_group VARCHAR(10),                            -- Nhóm máu bệnh nhân nhận
    exported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed dữ liệu mẫu (16 túi máu)
-- Đa dạng nhóm máu, chế phẩm, hạn dùng khác nhau để kiểm tra FEFO
INSERT INTO blood_bags 
  (bag_code, donor_code, blood_group, component_type, volume, test_result, 
   source, donation_date, expiration_date, storage_location, storage_temp, status)
VALUES
  -- Nhóm O (Dễ hiến nhất)
  ('BB-001', 'DN-9011', 'O+', 'Máu toàn phần', 350, 'An toàn', 'Cá nhân', '2026-07-01', '2026-08-12', 'Tủ lạnh Máu A - Ngăn 1', 4.2, 'in_stock'),
  ('BB-002', 'DN-1244', 'O+', 'Khối hồng cầu', 250, 'An toàn', 'Cá nhân', '2026-06-20', '2026-08-01', 'Tủ lạnh Máu A - Ngăn 2', 3.8, 'in_stock'), -- Hạn sử dụng sớm hơn BB-001
  ('BB-003', 'DN-4412', 'O-', 'Máu toàn phần', 350, 'An toàn', 'Cá nhân', '2026-07-05', '2026-08-16', 'Tủ lạnh Máu A - Ngăn 1', 4.0, 'in_stock'),
  ('BB-004', 'DN-8812', 'O-', 'Huyết tương', 150, 'Đang xét nghiệm', 'Cá nhân', '2026-07-10', '2027-07-10', 'Tủ đông Huyết tương - Ngăn 1', -20.5, 'in_stock'),
  
  -- Nhóm A
  ('BB-005', 'DN-3011', 'A+', 'Khối hồng cầu', 350, 'An toàn', 'Bệnh viện Bạch Mai', '2026-06-25', '2026-08-06', 'Tủ lạnh Máu B - Ngăn 1', 4.1, 'in_stock'),
  ('BB-006', 'DN-5122', 'A+', 'Khối hồng cầu', 350, 'An toàn', 'Cá nhân', '2026-07-02', '2026-08-13', 'Tủ lạnh Máu B - Ngăn 1', 4.1, 'in_stock'),
  ('BB-007', 'DN-0922', 'A-', 'Máu toàn phần', 450, 'An toàn', 'Cá nhân', '2026-07-08', '2026-08-19', 'Tủ lạnh Máu B - Ngăn 2', 3.9, 'in_stock'),

  -- Nhóm B
  ('BB-008', 'DN-9941', 'B+', 'Khối hồng cầu', 350, 'An toàn', 'Cá nhân', '2026-06-15', '2026-07-27', 'Tủ lạnh Máu C - Ngăn 1', 4.0, 'in_stock'), -- Sắp hết hạn nhất
  ('BB-009', 'DN-8813', 'B+', 'Khối hồng cầu', 350, 'An toàn', 'Cá nhân', '2026-07-03', '2026-08-14', 'Tủ lạnh Máu C - Ngăn 1', 4.2, 'in_stock'), -- Cùng nhóm B+, hồng cầu nhưng hạn xa hơn
  ('BB-010', 'DN-7722', 'B+', 'Huyết tương', 250, 'An toàn', 'Viện Huyết học TW', '2026-07-01', '2027-07-01', 'Tủ đông Huyết tương - Ngăn 2', -22.0, 'in_stock'),
  ('BB-011', 'DN-1055', 'B-', 'Máu toàn phần', 350, 'An toàn', 'Cá nhân', '2026-07-06', '2026-08-17', 'Tủ lạnh Máu C - Ngăn 2', 4.0, 'in_stock'),

  -- Nhóm AB
  ('BB-012', 'DN-4044', 'AB+', 'Khối tiểu cầu', 150, 'An toàn', 'Cá nhân', '2026-07-09', '2026-07-14', 'Máy lắc Tiểu cầu A', 22.0, 'in_stock'), -- Tiểu cầu hạn sử dụng rất ngắn (5 ngày)
  ('BB-013', 'DN-3032', 'AB+', 'Khối hồng cầu', 350, 'An toàn', 'Cá nhân', '2026-07-01', '2026-08-12', 'Tủ lạnh Máu D - Ngăn 1', 4.1, 'in_stock'),
  ('BB-014', 'DN-6621', 'AB-', 'Huyết tương', 200, 'An toàn', 'Cá nhân', '2026-07-04', '2027-07-04', 'Tủ đông Huyết tương - Ngăn 2', -19.5, 'in_stock'),

  -- Túi máu đã xuất / hỏng để làm phong phú dữ liệu
  ('BB-015', 'DN-0021', 'O+', 'Khối hồng cầu', 250, 'An toàn', 'Cá nhân', '2026-05-10', '2026-06-21', 'Tủ lạnh Máu A - Ngăn 2', 4.0, 'exported'),
  ('BB-016', 'DN-1199', 'A+', 'Khối hồng cầu', 350, 'Đang xét nghiệm', 'Cá nhân', '2026-07-11', '2026-08-22', 'Tủ lạnh Máu B - Ngăn 3', 4.5, 'in_stock')
ON CONFLICT (bag_code) DO NOTHING;
