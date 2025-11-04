import { DataAPIClient } from "@datastax/astra-db-ts";

// ✅ DB client ko ek baar initialize karne ke liye safe wrapper
let db = null;

function connectToAstra() {
  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const endpoint = process.env.ASTRA_DB_API_ENDPOINT;
  const namespace = process.env.ASTRA_DB_NAMESPACE || "default_keyspace";

  if (!token || !endpoint) {
    console.warn("⚠️ Missing Astra DB environment variables — skipping DB connection (build mode)");
    return null;
  }

  try {
    const client = new DataAPIClient(token);
    return client.db(endpoint, { namespace });
  } catch (err) {
    console.error("❌ Error initializing Astra DB:", err.message);
    return null;
  }
}

// ✅ build logs me secret na aaye
if (!process.env.NETLIFY) {
  db = connectToAstra();
}

export default db;
