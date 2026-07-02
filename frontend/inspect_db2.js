import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.tmjcsqwprlgqqzcubkeb:hackaithon2026%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const tables = res.rows.map(r => r.table_name);

  const schema = {};
  for (const table of tables) {
    const colRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [table]);
    schema[table] = colRes.rows.map(r => `${r.column_name} (${r.data_type})`);
  }

  console.log(JSON.stringify(schema, null, 2));
  await client.end();
}

run().catch(console.error);
