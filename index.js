const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// running server
app.get("/", (req, res) => {
  res.send("Eclectic is running");
});

app.listen(port, () => {
  console.log(`Eclectic is running on the port ${port}`);
});
