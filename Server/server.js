const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/file");
const qboRoutes = require("./routes/qbo");
const qboCompany = require("./routes/qboCompany");
const qboSyncRoutes = require("./routes/qboSync");
const qboRawData = require("./routes/qboRawData");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/qbo", qboRoutes);
app.use("/api/qbocompany", qboCompany);
app.use("/api/qbo", qboSyncRoutes);
app.use("/api/qborawdata", qboRawData);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.listen(8000, () => {
  console.log("Server running on port 8000");
});


// KEJIJO5WRINUTLOCX643JR6DRLQBYKGH
// ngrok config add-authtoken 38BdXIJZqg2Y9ykl8bcSJTDwU8r_4jUwDwG3MkXde9ouwE9NV