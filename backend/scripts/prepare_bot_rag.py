import os
import json

def process_excel_to_rag(doctors_file, depts_file, output_file):
    try:
        import pandas as pd
    except ImportError:
        print("Lỗi: Bạn cần cài đặt pandas và openpyxl.")
        print("Mở terminal và chạy lệnh: pip install pandas openpyxl")
        return

    print(f"Đang đọc dữ liệu từ: {doctors_file} và {depts_file}...")
    
    # Load data
    df_docs = pd.read_excel(doctors_file)
    df_depts = pd.read_excel(depts_file)

    # Khởi tạo nội dung Markdown
    rag_content = "# HỆ THỐNG TRI THỨC BÁC SĨ VÀ KHOA KHÁM - EYECU\n\n"
    
    rag_content += "## 1. THÔNG TIN CÁC KHOA KHÁM BỆNH\n"
    for idx, row in df_depts.iterrows():
        rag_content += f"- Khoa: {row.get('Tên khoa', row.get('Khoa', row.iloc[0]))}\n"
        for col in df_depts.columns:
            if str(row[col]) != 'nan':
                rag_content += f"  + {col}: {row[col]}\n"
        rag_content += "\n"

    rag_content += "## 2. DANH SÁCH BÁC SĨ\n"
    for idx, row in df_docs.iterrows():
        name = row.get('Tên Bác Sĩ', row.get('Tên bác sĩ', row.get('Tên', row.iloc[0])))
        rag_content += f"- Bác sĩ: {name}\n"
        for col in df_docs.columns:
            if str(row[col]) != 'nan':
                rag_content += f"  + {col}: {row[col]}\n"
        rag_content += "\n"

    # Write to text file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(rag_content)
        
    print(f"✅ Đã xử lý xong! Dữ liệu RAG được xuất ra file: {output_file}")
    print("👉 HƯỚNG DẪN: Mở trang web VNPT SmartBot -> Knowledge Base (Tri thức) -> Import file này vào.")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    doc_path = os.path.join(base_dir, "..", "database", "Danh_muc_Bac_si_1000.xlsx")
    dept_path = os.path.join(base_dir, "..", "database", "danh_muc_khoa_kham_1000.xlsx")
    out_path = os.path.join(base_dir, "..", "database", "VNPT_RAG_Knowledge.txt")
    
    process_excel_to_rag(doc_path, dept_path, out_path)
