import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.tmjcsqwprlgqqzcubkeb:hackaithon2026%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase DB");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.dispatch_records (
      plate character varying PRIMARY KEY,
      eta integer,
      patient_name character varying,
      gender character varying,
      age character varying,
      cccd character varying,
      chronic_conditions jsonb,
      allergies jsonb,
      alert_label character varying,
      er_team character varying,
      status character varying DEFAULT 'active',
      added_at bigint,
      lat double precision,
      lng double precision,
      completed_at bigint
    );
  `;
  await client.query(createTableQuery);
  console.log("Created table dispatch_records");

  // Disable RLS for now to allow anon frontend access in hackathon mode
  await client.query(`ALTER TABLE public.dispatch_records DISABLE ROW LEVEL SECURITY;`);
  console.log("Disabled RLS on dispatch_records");

  // Add to supabase_realtime publication
  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_records;`);
    console.log("Added dispatch_records to supabase_realtime publication");
  } catch (err) {
    // It might already be added
    console.log("Realtime pub add info:", err.message);
  }

  await client.end();
}

run().catch(console.error);
