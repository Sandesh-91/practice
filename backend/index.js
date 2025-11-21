
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const authMiddleware = require("./middleware/auth");
const booksRoutes = require("./routes/book"); 
const purchasesRoutes = require("./routes/purchase");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());



app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);


const { supabase } = require("./supabaseClient");

app.get("/api/books", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).send(error.message);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});



app.use("/api/books/protected", authMiddleware, booksRoutes);

app.use("/api/purchases", authMiddleware, purchasesRoutes);



app.get("/api/notifications", authMiddleware, async (req, res) => {
  const { supabaseAdmin } = require("./supabaseClient");
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Could not fetch" });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});



app.listen(PORT, () => console.log(`Server running on ${PORT}`));