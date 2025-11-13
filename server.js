import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import issueRoutes from "./routes/issueRoutes.js";
import contributionRoutes from "./routes/contributionRoutes.js";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => res.send("CleanUp Tracker API is live"));




// PUBLIC routes
app.use("/api/issues", issueRoutes);            // some endpoints inside are public
app.use("/api/contributions", contributionRoutes);






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
