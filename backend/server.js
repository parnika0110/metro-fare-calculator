const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 TRY connecting to MongoDB (but don't crash if fails)
mongoose.connect("mongodb://127.0.0.1:27017/metroDB")
  .then(() => console.log("MongoDB connected"))
  .catch(() => console.log("⚠️ MongoDB NOT connected (running without DB)"));

// Model (safe even if DB not connected)
const Trip = mongoose.models.Trip || mongoose.model("Trip", {
  source: String,
  destination: String,
  passengers: Number,
  fare: Number,
  route: Array,
  timestamp: Date
});

// API
app.post("/saveTrip", async (req, res) => {
  try {
    await Trip.create(req.body);
    res.send("Saved to DB");
  } catch (err) {
    console.log("⚠️ Skipping DB save");
    res.send("Saved locally (DB offline)");
  }
});

// start server
app.listen(3000, () => console.log("Server running on port 3000"));