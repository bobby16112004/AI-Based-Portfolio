import { DataAPIClient } from "@datastax/astra-db-ts";

let db = null;

// Check karo environment variables properly mile hain ya nahi
if (
  process.env.ASTRA_DB_APPLICATION_TOKEN &&
  process.env.ASTRA_DB_API_ENDPOINT
) {
  try {
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
      namespace: process.env.ASTRA_DB_NAMESPACE || "default_keyspace",
    });
    console.log("✅ Astra DB connected successfully");
  } catch (error) {
    console.error("❌ Error connecting to Astra DB:", error);
  }
} else {
  console.warn(
    "⚠️ Missing Astra DB environment variables — skipping DB connection (likely in build mode)"
  );
}

export default db;
