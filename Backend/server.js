const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "HBCR Backend is running"
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`HBCR Backend running on port ${PORT}`);
});