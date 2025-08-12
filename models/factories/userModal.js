import { Schema } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  website_name: {
    type: String,
    required: false,
    unique: false,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  email: { type: String, required: false },
  active: { type: Boolean, default: true },
  created_by: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export function getUserClientModel(conn) {
  return conn.models.userClient || conn.model("userClient", userSchema);
}

export default getUserClientModel;
