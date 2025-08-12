import { Schema } from "mongoose";

const websiteSchema = new Schema({
  website_name: {
    type: String,
    unique: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  url: { type: String },
  current_balance: { type: Number },
  history: { type: Array, default: [] },
  urls: { type: String, default: "fuc" },
  created_by: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export function getWebsiteModel(conn) {
  return conn.models.website || conn.model("website", websiteSchema);
}

export default getWebsiteModel;
