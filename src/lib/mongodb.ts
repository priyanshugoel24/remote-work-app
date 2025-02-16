import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string;

if (!MONGODB_URI) {
  throw new Error("⚠️ Please define the MONGODB_URI environment variable in .env.local");
}

if (!MONGODB_DB) {
  throw new Error("⚠️ Please define the MONGODB_DB environment variable in .env.local");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Use cached MongoDB connection in development
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  global._mongoClientPromise = client.connect().then((connectedClient) => {
    console.log(`✅ Connected to MongoDB: ${MONGODB_DB}`);
    return connectedClient;
  }).catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  });
}

clientPromise = global._mongoClientPromise;

// Force the connection at startup
(async () => {
  try {
    await clientPromise;
    console.log("✅ MongoDB Connection Verified at Startup");
  } catch (error) {
    console.error("❌ MongoDB Startup Connection Error:", error);
  }
})();

export default clientPromise;