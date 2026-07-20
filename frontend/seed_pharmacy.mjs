import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.tmjcsqwprlgqqzcubkeb:hackaithon2026%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

const medicinesData = [
  // Kháng sinh & Kháng nấm
  { name: 'Augmentin 1g', active: 'Amoxicillin/Clavulanate', cat: 'Kháng sinh', min: 100 },
  { name: 'Zinnat 500mg', active: 'Cefuroxime', cat: 'Kháng sinh', min: 200 },
  { name: 'Klamentin 875/125', active: 'Amoxicillin/Clavulanate', cat: 'Kháng sinh', min: 150 },
  { name: 'Klazina 500mg', active: 'Clarithromycin', cat: 'Kháng sinh', min: 100 },
  { name: 'Cravit 500mg', active: 'Levofloxacin', cat: 'Kháng sinh', min: 100 },
  { name: 'Azithromycin 500mg', active: 'Azithromycin', cat: 'Kháng sinh', min: 200 },
  { name: 'Nizoral 2%', active: 'Ketoconazole', cat: 'Kháng sinh', min: 50 },
  { name: 'Sporal 100mg', active: 'Itraconazole', cat: 'Kháng sinh', min: 80 },

  // Giảm đau, hạ sốt, chống viêm
  { name: 'Panadol Extra', active: 'Paracetamol 500mg + Caffeine 65mg', cat: 'Giảm đau, hạ sốt', min: 500 },
  { name: 'Hapacol 500', active: 'Paracetamol 500mg', cat: 'Giảm đau, hạ sốt', min: 1000 },
  { name: 'Efferalgan 500mg', active: 'Paracetamol 500mg', cat: 'Giảm đau, hạ sốt', min: 800 },
  { name: 'Voltaren 75mg', active: 'Diclofenac', cat: 'Giảm đau, hạ sốt', min: 100 },
  { name: 'Celebrex 200mg', active: 'Celecoxib', cat: 'Giảm đau, hạ sốt', min: 200 },
  { name: 'Mobic 7.5mg', active: 'Meloxicam', cat: 'Giảm đau, hạ sốt', min: 100 },
  { name: 'Arcoxia 90mg', active: 'Etoricoxib', cat: 'Giảm đau, hạ sốt', min: 150 },
  { name: 'Ibuprofen 400mg', active: 'Ibuprofen', cat: 'Giảm đau, hạ sốt', min: 300 },

  // Tim mạch & Huyết áp
  { name: 'Concor 5mg', active: 'Bisoprolol', cat: 'Tim mạch', min: 200 },
  { name: 'Amlor 5mg', active: 'Amlodipine', cat: 'Tim mạch', min: 300 },
  { name: 'Lipanthyl 145mg', active: 'Fenofibrate', cat: 'Tim mạch', min: 100 },
  { name: 'Crestor 10mg', active: 'Rosuvastatin', cat: 'Tim mạch', min: 250 },
  { name: 'Lipitor 20mg', active: 'Atorvastatin', cat: 'Tim mạch', min: 300 },
  { name: 'Plavix 75mg', active: 'Clopidogrel', cat: 'Tim mạch', min: 200 },
  { name: 'Micardis 40mg', active: 'Telmisartan', cat: 'Tim mạch', min: 150 },
  { name: 'Aspirin 81mg', active: 'Acetylsalicylic acid', cat: 'Tim mạch', min: 500 },

  // Dạ dày & Tiêu hóa
  { name: 'Nexium 40mg', active: 'Esomeprazole', cat: 'Dạ dày', min: 300 },
  { name: 'Gaviscon', active: 'Sodium alginate', cat: 'Dạ dày', min: 200 },
  { name: 'Phosphalugel', active: 'Aluminium phosphate', cat: 'Dạ dày', min: 500 },
  { name: 'Smecta', active: 'Diosmectite', cat: 'Dạ dày', min: 400 },
  { name: 'Enterogermina', active: 'Bacillus clausii', cat: 'Dạ dày', min: 400 },
  { name: 'Motilium-M', active: 'Domperidone', cat: 'Dạ dày', min: 100 },
  { name: 'Omez 20mg', active: 'Omeprazole', cat: 'Dạ dày', min: 400 },
  { name: 'Pariet 20mg', active: 'Rabeprazole', cat: 'Dạ dày', min: 200 },

  // Hô hấp & Dị ứng
  { name: 'Telfast 180mg', active: 'Fexofenadine', cat: 'Hô hấp, Dị ứng', min: 150 },
  { name: 'Aerius 5mg', active: 'Desloratadine', cat: 'Hô hấp, Dị ứng', min: 200 },
  { name: 'Ventolin Inhaler', active: 'Salbutamol', cat: 'Hô hấp, Dị ứng', min: 100 },
  { name: 'Singulair 10mg', active: 'Montelukast', cat: 'Hô hấp, Dị ứng', min: 150 },
  { name: 'Seretide Evohaler', active: 'Salmeterol/Fluticasone', cat: 'Hô hấp, Dị ứng', min: 50 },
  { name: 'Acemuc 200mg', active: 'Acetylcysteine', cat: 'Hô hấp, Dị ứng', min: 300 },
  { name: 'Bisolvon 8mg', active: 'Bromhexine', cat: 'Hô hấp, Dị ứng', min: 250 },

  // Thần kinh & An thần
  { name: 'Ginkgo Biloba 120mg', active: 'Ginkgo biloba extract', cat: 'Thần kinh', min: 200 },
  { name: 'Rotunda', active: 'Rotundin', cat: 'Thần kinh', min: 100 },
  { name: 'Seduxen 5mg', active: 'Diazepam', cat: 'Thần kinh', min: 50 },
  { name: 'Sibelium 5mg', active: 'Flunarizine', cat: 'Thần kinh', min: 150 },
  { name: 'Tanakan 40mg', active: 'Ginkgo biloba extract', cat: 'Thần kinh', min: 150 },
  { name: 'Tebokan 120mg', active: 'Ginkgo biloba extract', cat: 'Thần kinh', min: 100 },

  // Nội tiết & Tiểu đường
  { name: 'Glucophage 500mg', active: 'Metformin', cat: 'Nội tiết, Tiểu đường', min: 400 },
  { name: 'Diamicron MR 30mg', active: 'Gliclazide', cat: 'Nội tiết, Tiểu đường', min: 300 },
  { name: 'Amaryl 2mg', active: 'Glimepiride', cat: 'Nội tiết, Tiểu đường', min: 200 },
  { name: 'Berlthyrox 100mcg', active: 'Levothyroxine', cat: 'Nội tiết, Tiểu đường', min: 100 },

  // Vitamin & Khoáng chất
  { name: 'Berocca', active: 'Multivitamins', cat: 'Vitamin, Khoáng chất', min: 200 },
  { name: 'Calcium Corbiere', active: 'Calcium glubionate', cat: 'Vitamin, Khoáng chất', min: 300 },
  { name: 'Enat 400', active: 'Vitamin E 400 IU', cat: 'Vitamin, Khoáng chất', min: 150 },
  { name: 'Vitamin C 500mg', active: 'Ascorbic acid', cat: 'Vitamin, Khoáng chất', min: 500 },
  
  // Thuốc Cấp cứu
  { name: 'Adrenaline 1mg/1ml', active: 'Epinephrine', cat: 'Cấp cứu', min: 100 },
  { name: 'Atropin 0.25mg', active: 'Atropine sulfate', cat: 'Cấp cứu', min: 100 },
  { name: 'Lidocain 2%', active: 'Lidocaine', cat: 'Cấp cứu', min: 100 },
];

function generateId(prefix, index) {
  return `${prefix}${index.toString().padStart(3, '0')}`;
}

// Sinh ma EAN-13 hop le voi check digit chinh xac (prefix 893 = Viet Nam)
function generateEAN13() {
  const digits = [8, 9, 3];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  // Tinh check digit theo chuan EAN-13
  let total = 0;
  for (let i = 0; i < 12; i++) {
    total += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (total % 10)) % 10;
  digits.push(check);
  return digits.join('');
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
  await client.connect();
  
  try {
    console.log("Dropping existing tables if any...");
    await client.query(`
      DROP TABLE IF EXISTS pharmacy_batches CASCADE;
      DROP TABLE IF EXISTS pharmacy_medicines CASCADE;
    `);

    console.log("Creating pharmacy_medicines table...");
    await client.query(`
      CREATE TABLE pharmacy_medicines (
          id VARCHAR PRIMARY KEY,
          barcode VARCHAR,
          name VARCHAR NOT NULL,
          active_ingredient VARCHAR,
          category VARCHAR,
          min_quantity INT NOT NULL DEFAULT 0,
          unit VARCHAR NOT NULL DEFAULT 'Hộp',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating pharmacy_batches table...");
    await client.query(`
      CREATE TABLE pharmacy_batches (
          id VARCHAR PRIMARY KEY,
          medicine_id VARCHAR NOT NULL REFERENCES pharmacy_medicines(id) ON DELETE CASCADE,
          batch_number VARCHAR NOT NULL,
          quantity INT NOT NULL DEFAULT 0,
          expiration_date DATE NOT NULL,
          supplier VARCHAR,
          location VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Inserting medicines and batches...");

    for (let i = 0; i < medicinesData.length; i++) {
      const med = medicinesData[i];
      const medId = generateId('MED', i + 1);
      // Sinh ma EAN-13 hop le
      const barcode = generateEAN13();
      
      await client.query(`
        INSERT INTO pharmacy_medicines (id, barcode, name, active_ingredient, category, min_quantity, unit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [medId, barcode, med.name, med.active, med.cat, med.min, 'Hộp']);

      // Generate 1 to 3 batches per medicine
      const numBatches = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numBatches; j++) {
        const batchId = `${medId}-B${j + 1}`;
        const year = 2023 + Math.floor(Math.random() * 5); // 2023 - 2027
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const batchNumber = `B${year}-${month}`;
        
        // Random quantity: some will be low stock
        const quantity = Math.floor(Math.random() * (med.min * 2));
        
        // Expiration dates: Mix of expired, expiring soon, and good
        const now = new Date();
        const randType = Math.random();
        let expDate;
        if (randType < 0.1) {
          // Expired (Past 1 year)
          expDate = getRandomDate(new Date(now.getTime() - 365 * 24 * 3600 * 1000), new Date(now.getTime() - 24 * 3600 * 1000));
        } else if (randType < 0.25) {
          // Expiring soon (Next 30 days)
          expDate = getRandomDate(now, new Date(now.getTime() + 30 * 24 * 3600 * 1000));
        } else {
          // Good (Next 1-3 years)
          expDate = getRandomDate(new Date(now.getTime() + 30 * 24 * 3600 * 1000), new Date(now.getTime() + 3 * 365 * 24 * 3600 * 1000));
        }

        const expDateStr = expDate.toISOString().split('T')[0];
        const supplier = "Công ty Dược phẩm Trung Ương";
        const location = `Kho ${Math.floor(Math.random() * 3) + 1} - Kệ ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`;

        await client.query(`
          INSERT INTO pharmacy_batches (id, medicine_id, batch_number, quantity, expiration_date, supplier, location)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [batchId, medId, batchNumber, quantity, expDateStr, supplier, location]);
      }
    }

    console.log("Seeding completed successfully!");
    
  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await client.end();
  }
}

run();
