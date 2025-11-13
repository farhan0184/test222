import express from "express";
import Issue from "../models/Issue.js";

const router = express.Router();

/**
 * GET /api/issues
 * Query params:
 *  - page, limit, category, status, search (title or description), sort (date|amount)
 */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 12, category, status, search, sort = "date" } = req.query;
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ title: re }, { description: re }, { location: re }];
    }

    const sortObj = sort === "amount" ? { amount: -1 } : { date: -1 };

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ total, page: Number(page), limit: Number(limit), issues });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: latest 6
router.get("/latest", async (req, res) => {
  try {
    const issues = await Issue.find().sort({ date: -1 }).limit(6);
    res.json(issues);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET by id
router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });
    res.json(issue);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST new issue (protected in server.js with verifyToken)
router.post("/", async (req, res) => {
  try {
    const { title, category, location, description, image, amount, email } = req.body;
    // basic server validation (client should validate too)
    if (!title || !category || !location || !description || !image || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const issue = new Issue({ title, category, location, description, image, amount, email });
    await issue.save();
    res.status(201).json({ message: "Issue created", issue });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// GET issues by user email (private)
router.get("/user/:email", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // default page 1, 10 items per page
    const skip = (page - 1) * limit;

    const issues = await Issue.find({ email: req.params.email })
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Optional: send total count for frontend pagination
    const total = await Issue.countDocuments({ email: req.params.email });

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      issues,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// PUT update (protected)
router.put("/:id", async (req, res) => {
  try {
    const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", updated });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE (protected)
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Issue.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Stats: total users (this requires a users collection if you want accurate count) and issues summary
router.get("/stats/summary", async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: "ended" });
    const ongoing = await Issue.countDocuments({ status: "ongoing" });
    // total users must come from your user store; return null if not tracked here
    res.json({ totalIssues, resolved, ongoing });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
