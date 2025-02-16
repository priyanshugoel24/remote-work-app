import { Schema, model, models } from "mongoose";

const FileSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace" },
  },
  { timestamps: true }
);

export default models.File || model("File", FileSchema);