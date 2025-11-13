import express from "express";
import Contribution from "../models/Contribution.js";
import Issue from "../models/Issue.js";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

const router = express.Router();

/**
 * POST /api/contributions
 * Body: { issueId, amount, name, email, phone, address, additionalInfo }
 * Protected
 */
router.post("/", async (req, res) => {
  try {
    const { issueId, amount, name, email, phone, address, additionalInfo } = req.body;
    if (!issueId || !amount || !name || !email || !phone || !address) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    // ensure issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Associated issue not found" });

    const c = new Contribution({ issueId, amount, name, email, phone, address, additionalInfo });
    await c.save();
    res.status(201).json({ message: "Contribution saved", contribution: c });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// GET contributions by issue
router.get("/issue/:issueId", async (req, res) => {
  try {
    const contributions = await Contribution.find({ issueId: req.params.issueId }).sort({ date: -1 });
    res.json(contributions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET contributions by user (protected)
router.get("/user/:email", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // pagination defaults
    const skip = (page - 1) * limit;

    // Fetch paginated contributions with related Issue info
    const contributions = await Contribution.find({ email: req.params.email })
      .populate("issueId", "title category") // only include these two fields
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Total count for pagination
    const total = await Contribution.countDocuments({ email: req.params.email });

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      contributions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/**
 * GET /api/contributions/report/:id
 * Generates a PDF invoice/report for a single contribution (protected)
 * Returns: application/pdf
 */
router.get("/report/:id", async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ message: "Contribution not found" });

    const issue = await Issue.findById(contribution.issueId);

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // stream to response
    res.setHeader("Content-Disposition", `attachment; filename=contribution-${contribution._id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("CleanUp Tracker - Contribution Receipt", { align: "center" });
    doc.moveDown();

    // Contribution details
    doc.fontSize(12).text(`Receipt ID: ${contribution._id}`);
    doc.text(`Date: ${dayjs(contribution.date).format("YYYY-MM-DD HH:mm")}`);
    doc.text(`Contributor: ${contribution.name}`);
    doc.text(`Email: ${contribution.email}`);
    doc.text(`Phone: ${contribution.phone}`);
    doc.text(`Address: ${contribution.address}`);
    doc.moveDown();

    // Issue info
    doc.fontSize(14).text("Issue Details", { underline: true });
    doc.fontSize(12).text(`Issue Title: ${issue ? issue.title : "N/A"}`);
    doc.text(`Category: ${issue ? issue.category : "N/A"}`);
    doc.text(`Location: ${issue ? issue.location : "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Contribution", { underline: true });
    doc.fontSize(12).text(`Amount: ${contribution.amount} (in local currency)`);
    if (contribution.additionalInfo) {
      doc.moveDown();
      doc.text("Additional info:");
      doc.text(contribution.additionalInfo);
    }

    doc.moveDown(2);
    doc.text("Thank you for contributing to a cleaner community!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
