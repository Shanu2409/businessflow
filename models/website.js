import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema({
  website_name: {
    type: String,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  url: { type: String },
  current_balance: { type: Number },
  history: { type: Array, default: [] }, // Array of Numbers
  urls: { type: String, default: "fuc" },
  created_by: { type: String },
  group: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for unique website_name per group
websiteSchema.index({ website_name: 1, group: 1 }, { unique: true });

const Website =
  mongoose.models.website || mongoose.model("website", websiteSchema);
export default Website;
