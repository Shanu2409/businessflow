import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema({
  website_name: { type: String, unique: true },
  url: { type: String },
  current_balance: { type: Number },
  created_by: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Website =
  mongoose.models.website || mongoose.model("website", websiteSchema);
export default Website;
