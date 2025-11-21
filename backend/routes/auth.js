// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase, supabaseAdmin } = require("../supabaseClient.js");

const router = express.Router();

/* -----------------------------
   SIGNUP
------------------------------ */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, username, full_name, city } = req.body;

    // Validate input
    if (!email || !password || !username || !full_name || !city)
      return res.status(400).json({ message: "All fields required!" });

    // Use Supabase's built-in sign-up method to create the user
    const responseData = await supabase.auth.signUp({
      email,
      password,
    });

    if (responseData.error)
      return res.status(500).json({ message: responseData.error.message });

    // Now that the user is signed up, save additional user details in your database
    const { data, error: dbError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: responseData.data.user.id, // Using the `user.id` returned from Supabase Auth
          username,
          full_name,
          city,
        },
      ])
      .select()
      .single();

    if (dbError) return res.status(500).json({ message: dbError.message });

    // Send back the user and session data, including JWT (if needed)
    return res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: data.id,
        email: responseData.data.user.email,
        username: data.username,
      },
      // token: responseData.data.session.access_token, // Supabase JWT token
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* -----------------------------
   LOGIN
------------------------------ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required!" });

    // Authenticate the user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    // Get the JWT from the response
    const token = data.session.access_token; // Supabase JWT

    const profileRes = await supabaseAdmin
      .from("profiles")
      .select()
      .eq("id", data.user.id)
      .maybeSingle();

    let username = data.user.email; // default

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      return res.status(500).json({ message: profileRes.error.message });
    }

    if (!profileRes.data) {
      // Insert default profile
      const insertRes = await supabaseAdmin
        .from("profiles")
        .insert({
          id: data.user.id,
          username: data.user.email,
          full_name: '',
          city: '',
        });

      if (insertRes.error) {
        return res.status(500).json({ message: insertRes.error.message });
      }
    } else {
      username = profileRes.data.username;
    }

    // Return the token and user data
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
