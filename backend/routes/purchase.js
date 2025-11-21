// routes/purchases.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClient");

// list purchases for current user (as buyer or seller)
router.get("/", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  try {
    const { data, error } = await supabaseAdmin
      .from("purchase_requests")
      .select("*")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Could not fetch" });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// seller confirms purchase
router.post("/:id/confirm", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const purchaseId = req.params.id;
  try {
    const { data: pr, error: prErr } = await supabaseAdmin
      .from("purchase_requests")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (prErr || !pr)
      return res.status(404).json({ error: "Purchase request not found" });
    if (pr.seller_id !== userId)
      return res.status(403).json({ error: "Not authorized" });
    if (pr.status !== "PENDING")
      return res.status(400).json({ error: "Cannot confirm" });

    // update purchase status
    await supabaseAdmin
      .from("purchase_requests")
      .update({ status: "CONFIRMED" })
      .eq("id", purchaseId);
    // mark book as SOLD
    await supabaseAdmin
      .from("books")
      .update({ status: "SOLD" })
      .eq("id", pr.book_id);

    // notify buyer
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: pr.buyer_id,
        title: "Purchase Confirmed",
        body: "Seller confirmed your purchase request.",
      },
    ]);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// cancel purchase (buyer or seller)
router.post("/:id/cancel", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const purchaseId = req.params.id;
  try {
    const { data: pr, error: prErr } = await supabaseAdmin
      .from("purchase_requests")
      .select("*")
      .eq("id", purchaseId)
      .single();
    if (prErr || !pr)
      return res.status(404).json({ error: "Purchase request not found" });
    if (![pr.buyer_id, pr.seller_id].includes(userId))
      return res.status(403).json({ error: "Not authorized" });

    await supabaseAdmin
      .from("purchase_requests")
      .update({ status: "CANCELLED" })
      .eq("id", purchaseId);

    // optional: notify the other party
    const other = userId === pr.buyer_id ? pr.seller_id : pr.buyer_id;
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: other,
        title: "Purchase Cancelled",
        body: "The purchase request was cancelled.",
      },
    ]);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
