
let userCoordinates = null; 

document
  .getElementById("post-book-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please login first", "error");
      return;
    }
    const city = document.getElementById("book-city").value.trim();
    const coords = await getCoordinates(city);

    if (!coords) {
      console.warn("Unable to get location for the provided city", "error");
    }

    const formData = new FormData();
    formData.append(
      "title",
      document.getElementById("book-title").value.trim()
    );
    formData.append(
      "author",
      document.getElementById("book-author").value.trim()
    );
    formData.append("isbn", document.getElementById("book-isbn").value.trim());

    const price = document.getElementById("book-price").value;
    formData.append("price", price || 0);

    formData.append(
      "condition",
      document.getElementById("book-condition").value
    );
    formData.append("type", document.getElementById("book-type").value);
    formData.append(
      "description",
      document.getElementById("book-description").value.trim()
    );
    formData.append("city", document.getElementById("book-city").value.trim());
    formData.append("latitude", coords.lat);
    formData.append("longitude", coords.lng);

    
    const images = document.getElementById("book-images").files;
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const res = await fetch(`${api.books}/protected`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post book");
      }

      showToast("Book posted successfully!", "success");
      document.getElementById("post-book-form").reset();
      document.getElementById("image-preview").innerHTML = "";
      showSection("browse");
      searchBooks();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  });


function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // e.g. 14.7 km
}


async function getCoordinates(city) {
  if (!city?.trim()) return null;
  const key = `geo_${city.toLowerCase().trim()}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        city
      )}&limit=1`
    );
    const data = await res.json();
    if (data[0]) {
      const coords = { lat: +data[0].lat, lng: +data[0].lon };
      sessionStorage.setItem(key, JSON.stringify(coords));
      return coords;
    }
  } catch (e) {}
  return null;
}


async function loadUserCityFromProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const {
      data: { user },
      error,
    } = await window.supabase.auth.getUser(token);

    if (error || !user) {
      console.log("No user found from token");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("city")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.city) {
      console.log("No city in profile");
      return;
    }

    const city = profile.city.trim();

  
    const input = document.getElementById("location-filter");
    if (input) {
      input.value = city;
    }

    userCoordinates = await getCoordinates(city);
    console.log(userCoordinates);

    if (userCoordinates) {
      showToast(`Showing books near ${city}`, "success");
    }
  } catch (err) {
    console.log("Failed to load user location:", err);
  }
}


async function searchBooks() {
  const container = document.getElementById("books-grid");
  container.innerHTML = "<p>Loading books near you...</p>";

  try {

    const manualCity = document.getElementById("location-filter").value.trim();
    if (
      manualCity &&
      manualCity !== (localStorage.getItem("lastAutoCity") || "")
    ) {
      userCoordinates = await getCoordinates(manualCity);
    }

    const params = new URLSearchParams();
    const q = document.getElementById("search-input").value.trim();
    const type = document.getElementById("book-type-filter").value;
    const cond = document.getElementById("condition-filter").value;
    if (q) params.append("q", q);
    if (type !== "all") params.append("type", type);
    if (cond !== "all") params.append("condition", cond);

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${api.books}?${params}`, { headers });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to load books");

    let books = Array.isArray(result) ? result : result.results || [];

    if (userCoordinates && books.length > 0) {
      books.forEach((book) => {
        if (book.latitude && book.longitude) {
          book.distance = haversineDistance(
            userCoordinates.lat,
            userCoordinates.lng,
            book.latitude,
            book.longitude
          );
        } else {
          book.distance = null;
        }
      });

      books.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));
    }

    displayBooks(books);
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function displayBooks(books) {
  const container = document.getElementById("books-grid");
  if (!books || books.length === 0) {
    container.innerHTML = '<p class="no-books">No books found</p>';
    return;
  }

  const userCoord = await loadUserCityFromProfile();

  container.innerHTML = books
    .map((book) => {
      const imageArr = book.image_urls || [];
      const img =
        (imageArr.length > 0 && imageArr[0]) ||
        "https://placehold.co/300x400/f0f0f0/888?text=No+Image";

      const distanceMeasure = haversineDistance(
        userCoordinates.lat,
        userCoordinates.lng,
        book.latitude,
        book.longitude
      );
      console.log(distanceMeasure);
      const distance =
        distanceMeasure != null
          ? ` • <strong style="color:#27ae60">${distanceMeasure} km away</strong>`
          : "";

      return `
      <div class="book-card" onclick="showBookDetail('${book.id}')">
        <img src="${img}" alt="${book.title || ""}" loading="lazy"
             onerror="this.src='https://placehold.co/300x400/f0f0f0/aaa?text=No+Image'">
        <div class="book-card-content">
          <h3>${book.title || "Untitled"}</h3>
          <p class="author">by ${book.author || "Unknown"}</p>
          <p class="price">${
            book.price ? "$" + Number(book.price).toFixed(2) : "Free"
          }</p>
          <div class="tags">
            <span class="condition">${book.condition || ""}</span>
            <span class="type">${book.type || ""}</span>
          </div>
          <p class="location">
            <i class="fas fa-map-marker-alt"></i> ${
              book.city || "Unknown location"
            }
            ${distance}
          </p>
        </div>
      </div>
    `;
    })
    .join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadUserCityFromProfile();
  searchBooks();


  const bookTypeSelect = document.getElementById("book-type");
  const bookPriceInput = document.getElementById("book-price");

  if (bookTypeSelect && bookPriceInput) {
    bookTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "donate") {
        bookPriceInput.value = 0;
        bookPriceInput.disabled = true;
      } else {
        bookPriceInput.disabled = false;
      }
    });
  }
});
