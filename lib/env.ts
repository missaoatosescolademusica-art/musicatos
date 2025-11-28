if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const DATABASE_URL = process.env.DATABASE_URL
