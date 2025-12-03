import { prisma } from "@/lib/db"

async function main() {
  console.info("[v0] Starting database setup...");

  try {
    // Test connection
    console.info("[v0] Testing database connection...");
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.info("[v0] Database connection successful:", result);

    // Check if students table exists by trying to count
    const studentCount = await prisma.student.count();
    console.info("[v0] Students table exists. Current count:", studentCount);

    console.info("[v0] Database setup completed successfully!");
  } catch (error) {
    console.error("[v0] Database setup failed:", error);
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message);
    }
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("[v0] Fatal error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
