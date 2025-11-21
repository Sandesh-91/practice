document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    email: document.getElementById("signup-email").value,
    password: document.getElementById("signup-password").value,
    username: document.getElementById("signup-username").value,
    full_name: document.getElementById("signup-fullname").value,
    city: document.getElementById("signup-city").value,
  };

  const res = await fetch(api.signup, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.message);

  showToast("Account created successfully. Please log in!");
  showSection("login");
});
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(api.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  console.log(data);
  if (!res.ok) return showToast(data.message || "Login failed");

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  currentUser = data.user;
  updateAuthUI();

  showToast("Login successful!");
  showSection("home");
});


async function loadUserProfile() {
  if (!currentUser) return;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) throw error;
    if (!profile) return;

    document.getElementById("username").textContent = profile.username;
    const avatar = document.getElementById("user-avatar");
    avatar.textContent = profile.username.charAt(0).toUpperCase();

    // Fill profile form
    document.getElementById("profile-username").value = profile.username;
    document.getElementById("profile-fullname").value = profile.full_name;
    document.getElementById("profile-city").value = profile.city;
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

async function updateProfile(username, fullName, city) {
  if (!currentUser) return;

  try {
    showLoading(true);

    const coords = await getCoordinates(city);

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name: fullName,
        city,
        latitude: coords.lat,
        longitude: coords.lng,
        updated_at: new Date(),
      })
      .eq("id", currentUser.id);

    if (error) throw error;

    showToast("Profile updated successfully!");
    loadUserProfile();
  } catch (err) {
    console.error("Profile update error:", err);
    showToast(err.message);
  } finally {
    showLoading(false);
  }
}


function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  currentUser = null;
  updateAuthUI();
  showSection("home");

  showToast("Logged out successfully");
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");

  const storedUser = JSON.parse(localStorage.getItem("user"));
  currentUser = storedUser;

  if (storedUser) {
    document.getElementById("username").textContent = storedUser.username;
    document.getElementById("user-avatar").textContent = storedUser.email
      .charAt(0)
      .toUpperCase();

    authButtons.classList.add("hidden");
    userMenu.classList.remove("hidden");
  } else {
    authButtons.classList.remove("hidden");
    userMenu.classList.add("hidden");
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  updateAuthUI();
  await loadUserProfile(); 
});
