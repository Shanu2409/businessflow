import { Schema } from "mongoose";

const accountUserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  type: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export function getAccountModel(conn) {
  return conn.models.account || conn.model("account", accountUserSchema);
}

export default getAccountModel;
