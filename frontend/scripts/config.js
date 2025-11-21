
let currentUser = null;

const API_BASE_URL = "http://localhost:8080/api";

const api = {
  signup: `${API_BASE_URL}/auth/signup`,
  login: `${API_BASE_URL}/auth/login`,
  books: `${API_BASE_URL}/books`,
  rent: `${API_BASE_URL}/purchase/rent`,
};


function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

function showLoading(show = true) {
  const loading = document.getElementById("loading");
  if (show) {
    loading.classList.remove("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return "Free";
  return `$${parseFloat(price).toFixed(2)}`;
}

function getConditionText(condition) {
  const conditions = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
  };
  return conditions[condition] || condition;
}

function getBookTypeText(type) {
  const types = {
    sell: "For Sale",
    donate: "Donation",
    rent: "For Rent",
  };
  return types[type] || type;
}
