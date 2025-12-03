// This shows what tables exist in the database

import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("[v0] DATABASE_URL not set")
  process.exit(1)
}

const sql = neon(databaseUrl)

async function verifyDatabase() {
  try {
    console.info("[v0] Checking database schema...");

    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

    console.info("[v0] Tables in database:", tables);

    const studentTable =
      await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Student'`;

    console.info("[v0] Student table columns:", studentTable);
  } catch (error) {
    console.error("[v0] Database verification failed:", error)
  }
}

verifyDatabase()
