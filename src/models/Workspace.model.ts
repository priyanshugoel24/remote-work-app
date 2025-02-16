import { Schema, model, models } from "mongoose";

const WorkspaceSchema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true }, // User who created the workspace
    members: [{ type: Schema.Types.ObjectId, ref: "User" }], // List of members
    description: { type: String },
  },
  { timestamps: true }
);

export default models.Workspace || model("Workspace", WorkspaceSchema);