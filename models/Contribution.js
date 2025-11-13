import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Issue" },
  amount: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  date: { type: Date, default: Date.now },
  additionalInfo: { type: String }
}, { timestamps: true });

export default mongoose.model("Contribution", contributionSchema);
