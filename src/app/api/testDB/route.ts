import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Fetch users from MongoDB (Assume there's a "users" collection)
    const users = await db.collection("users").find({}).toArray();

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data", details: error }, { status: 500 });
  }
}