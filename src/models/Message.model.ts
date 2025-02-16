import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace" }, // If it's a workspace message
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Message || model("Message", MessageSchema);