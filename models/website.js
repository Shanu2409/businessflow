import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema({
  website_name: {
    type: String,
    unique: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  url: { type: String },
  current_balance: { type: Number },
  history: { type: Array, default: [] }, // Array of Numbers
  urls: { type: String, default: "fuc" },
  created_by: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Website =
  mongoose.models.website || mongoose.model("website", websiteSchema);
export default Website;
