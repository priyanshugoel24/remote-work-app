import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ["task", "message", "system"], required: true },
  },
  { timestamps: true }
);

export default models.Notification || model("Notification", NotificationSchema);