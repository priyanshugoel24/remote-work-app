import { Schema, model, models } from "mongoose";

const CallLogSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace" },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // Duration in seconds
  },
  { timestamps: true }
);

export default models.CallLog || model("CallLog", CallLogSchema);