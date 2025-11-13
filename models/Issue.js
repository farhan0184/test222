import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ["Garbage","Illegal Construction","Broken Public Property","Road Damage"] },
  location: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // URL from client upload
  amount: { type: Number, required: true, default: 0 },
  email: { type: String, required: true },
  status: { type: String, enum: ["ongoing","ended"], default: "ongoing" },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Issue", issueSchema);
