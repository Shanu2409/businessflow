import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  website_name: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  current_balance: { type: Number, require: true },
  createdAt: { type: Date, default: Date.now },
  ttlExpiresAt: { type: Date, expires: "3600s" },
});

const Website =
  mongoose.models.website || mongoose.model("website", websiteSchema);
export default Website;
