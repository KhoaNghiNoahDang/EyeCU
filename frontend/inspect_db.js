import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.tmjcsqwprlgqqzcubkeb:hackaithon2026%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected successfully");

  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  
  console.log("Tables in public schema:");
  const tables = res.rows.map(r => r.table_name);
  console.log(tables);

  for (const table of tables) {
    const colRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [table]);
    console.log("Table: " + table);
    console.table(colRes.rows);
  }

  await client.end();
}

run().catch(console.error);
