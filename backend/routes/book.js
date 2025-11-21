// routes/books.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin, supabase } = require("../supabaseClient");
const { haversineKm } = require("../utils/haversine");
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");
const getCoordinates = require("../utils/getCoordinates");

const BUCKET = process.env.STORAGE_BUCKET;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5242880", 10);

// Create book (multipart form)
router.post("/", async (req, res) => {
  const form = formidable({
    multiples: true, // Critical for multiple files
    maxFileSize: MAX_FILE_SIZE,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ error: "Invalid form data" });
    }

    try {
      const {
        title,
        author,
        isbn,
        price,
        condition,
        type = "sell",
        description,
        city,
      } = fields;

      if (!title || !author || !condition || !type || !city) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate and normalize condition
      const validConditions = ['new', 'like_new', 'good', 'fair'];
      if (!validConditions.includes(condition)) {
        condition = 'good'; // default
      }

      // Validate and normalize type
      const validTypes = ['sell', 'donate', 'rent'];
      if (!validTypes.includes(type.toLowerCase())) {
        type = 'sell'; // default
      }

      const sellerId = req.user.id;

      let imageUrls = [];

      // Handle multiple images: files.images can be object or array
      const imageFiles = files.images
        ? Array.isArray(files.images)
          ? files.images
          : [files.images]
        : [];

      for (const file of imageFiles) {
        if (file.size === 0) continue; // skip empty

        const ext = file.originalFilename?.split(".").pop() || "jpg";
        const fileName = `books/${uuidv4()}.${ext}`;

        const fileBuffer = await fs.promises.readFile(file.filepath);

        const { error: uploadErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(fileName, fileBuffer, {
            contentType: file.mimetype || "image/jpeg",
            upsert: false,
          });

        if (uploadErr) {
          console.error("Upload failed:", uploadErr);
          continue; // skip bad image, continue with others
        }

        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }

      let coordinates = await getCoordinates(city);
      console.log(coordinates);

      // Save to DB — store as JSON array or separate images table if needed later
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("books")
        .insert({
          title: title.trim(),
          author: author.trim(),
          isbn: isbn?.trim() || null,
          price: price ? parseFloat(price) : null,
          condition,
          type: type.toLowerCase(),
          description: description?.trim() || null,
          city: city.trim(),
          latitude: coordinates?.lat || null,
          longitude: coordinates?.lng || null,
          image_urls: imageUrls, // array of strings
          owner_id: sellerId,
          status: "available",
        })
        .select()
        .single();

      if (insertErr) {
        console.error("DB Insert Error:", insertErr);
        return res.status(500).json({ error: "Failed to save book" });
      }

      return res.status(201).json(inserted);
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

// helper to read file into buffer
const fs = require("fs");
function fsReadFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

// Search books with optional distance calculation
router.get("/", async (req, res) => {
  try {
    const {
      q,
      city,
      type,
      minPrice,
      maxPrice,
      condition,
      lat,
      lng,
      radiusKm,
      page = 1,
      size = 20,
    } = req.query;

    let query = supabaseAdmin
      .from("books")
      .select("*")
      .eq("status", "available");

    if (city) query = query.eq("city", city);
    if (type) query = query.eq("type", type);
    if (condition) query = query.eq("condition", condition);
    if (minPrice) query = query.gte("price", minPrice);
    if (maxPrice) query = query.lte("price", maxPrice);
    if (q) query = query.ilike("title", `%${q}%`);

    // fetch results (limit large enough; we will paginate in JS or via supabase paging)
    const pageSize = Math.min(100, parseInt(size, 10) || 20);
    const offset = (parseInt(page, 10) - 1) * pageSize;

    const { data: books, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Search failed" });
    }

    // if lat/lng provided, compute distance and optionally filter by radius
    let results = books;
    if (lat && lng) {
      const latNum = parseFloat(lat),
        lngNum = parseFloat(lng);
      results = books
        .map((b) => {
          const dist =
            b.latitude != null && b.longitude != null
              ? haversineKm(latNum, lngNum, +b.latitude, +b.longitude)
              : null;
          return { ...b, distance_km: dist };
        })
        .filter((b) => {
          if (!radiusKm) return true;
          if (b.distance_km === null) return false;
          return b.distance_km <= parseFloat(radiusKm);
        })
        .sort((a, b) => {
          if (a.distance_km === null) return 1;
          if (b.distance_km === null) return -1;
          return a.distance_km - b.distance_km;
        });
    }

    res.json({ page: parseInt(page, 10), size: pageSize, results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// get book by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.query;
  try {
    const { data: book, error } = await supabaseAdmin
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Book not found" });

    let result = book;
    if (lat && lng && book.latitude && book.longitude) {
      result = {
        ...book,
        distance_km: haversineKm(
          parseFloat(lat),
          parseFloat(lng),
          +book.latitude,
          +book.longitude
        ),
      };
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// buy request (requires auth)
router.post("/:id/buy", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const buyer = req.user;
    const bookId = req.params.id;

    // fetch book
    const { data: book, error: bookErr } = await supabaseAdmin
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();
    if (bookErr || !book)
      return res.status(404).json({ error: "Book not found" });
    if (book.status !== "available")
      return res.status(400).json({ error: "Book not available" });
    if (book.owner_id === buyer.id)
      return res.status(400).json({ error: "Cannot buy your own book" });

    // create purchase_request
    const { data: pr, error: prErr } = await supabaseAdmin
      .from("purchase_requests")
      .insert([
        {
          book_id: bookId,
          buyer_id: buyer.id,
          seller_id: book.owner_id,
          status: "PENDING",
        },
      ])
      .select()
      .single();

    if (prErr) {
      console.error(prErr);
      return res
        .status(500)
        .json({ error: "Could not create purchase request" });
    }

    // create notification for seller
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: book.owner_id,
        title: "Purchase Request",
        body: `${buyer.name || "Someone"} requested to buy "${book.title}"`,
      },
    ]);

    res.json(pr);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
