
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase, supabaseAdmin } = require("../supabaseClient.js");

const router = express.Router();


router.post("/signup", async (req, res) => {
  try {
    const { email, password, username, full_name, city } = req.body;


    if (!email || !password || !username || !full_name || !city)
      return res.status(400).json({ message: "All fields required!" });


    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingUser)
      return res.status(409).json({ message: "Email already registered!" });
    if (existingUserError)
      return res.status(500).json({ message: existingUserError.message });


    const responseData = await supabase.auth.signUp({
      email,
      password,
    });

    if (responseData.error)
      return res.status(500).json({ message: responseData.error.message });


    const { data, error: dbError } = await supabase
      .from("users")
      .insert([
        {
          id: responseData.data.user.id,
          email: responseData.data.user.email,
          username,
          full_name,
          city,
        },
      ])
      .select()
      .single();

    if (dbError) return res.status(500).json({ message: dbError.message });


    return res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
      },

    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required!" });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    const token = data.session.access_token;

    const usernameRes = await supabaseAdmin
      .from("users")
      .select()
      .eq("email", data.user.email)
      .single();

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: usernameRes.data.username,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;