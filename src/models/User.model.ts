import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true }, // Clerk authentication ID
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profilePicture: { type: String, default: "" },
    role: { type: String, enum: ["admin", "member", "guest"], default: "member" },
    workspaces: [{ type: Schema.Types.ObjectId, ref: "Workspace" }], // Workspaces the user is part of
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);