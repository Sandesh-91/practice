// scripts/app.js
// UI Functions
let USER_LOCATION = null;

// Function to open post book form with specific type
function openPostFor(type) {
  // Show the post-book section
  showSection('post-book');

  // Set the book type in the form
  const typeSelect = document.getElementById('book-type');
  const priceInput = document.getElementById('book-price');
  if (typeSelect) {
    typeSelect.value = type;
    // Handle price for donate type
    if (type === 'donate' && priceInput) {
      priceInput.value = 0;
      priceInput.disabled = true;
    } else if (priceInput) {
      priceInput.disabled = false;
    }
  }
}

// Function to open browse section with specific type filter
function openBrowseWithType(type, filterOnly) {
  // Show the browse section
  showSection('browse');

  // Set the type filter
  const typeFilter = document.getElementById('book-type-filter');
  if (typeFilter) {
    typeFilter.value = type;
  }

  // Trigger search to apply the filter
  searchBooks();
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
    currentSection = sectionId;

    // Load section-specific data
    switch (sectionId) {
      case "browse":
        searchBooks();
        break;
      case "my-books":
        loadMyBooks();
        break;
      case "my-rentals":
        loadMyRentals();
        break;
      case "profile":
        loadUserProfile();
        break;
    }
  }
}

function showRentalTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Activate selected tab
  event.target.classList.add("active");
  document
    .getElementById(
      tabName === "requests" ? "rental-requests" : "received-requests"
    )
    .classList.add("active");
}

// Authentication handlers
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  await signIn(email, password);
}

async function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const username = document.getElementById("signup-username").value;
  const fullName = document.getElementById("signup-fullname").value;
  const city = document.getElementById("signup-city").value;
  await signUp(email, password, username, fullName, city);
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const username = document.getElementById("profile-username").value;
  const fullName = document.getElementById("profile-fullname").value;
  const city = document.getElementById("profile-city").value;
  await updateProfile(username, fullName, city);
}

async function handlePostBook(event) {
  event.preventDefault();

  const bookData = {
    title: document.getElementById("book-title").value,
    author: document.getElementById("book-author").value,
    isbn: document.getElementById("book-isbn").value,
    price: parseFloat(document.getElementById("book-price").value) || 0,
    condition: document.getElementById("book-condition").value,
    type: document.getElementById("book-type").value,
    description: document.getElementById("book-description").value,
    city: document.getElementById("book-city").value,
  };

  await postBook(bookData);
}

function handleImagePreview(event) {
  const preview = document.getElementById("image-preview");
  preview.innerHTML = "";

  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.objectFit = "cover";
      img.style.margin = "5px";
      img.style.borderRadius = "5px";
      preview.appendChild(img);
    };

    reader.readAsDataURL(file);
  }
}

// Book management functions
async function editBook(bookId) {
  // Implementation for editing books
  showToast("Edit feature coming soon!", "success");
}

async function deleteBook(bookId) {
  if (confirm("Are you sure you want to delete this book?")) {
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("owner_id", currentUser.id);

      if (error) throw error;

      showToast("Book deleted successfully!", "success");
      showSection("my-books");
    } catch (error) {
      console.error("Delete book error:", error);
      showToast(error.message, "error");
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  await loadUserCityFromProfile();
  searchBooks();

  // Add enhanced CSS
  const style = document.createElement("style");
  style.textContent = `
        .enhanced-features {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 0;
            margin: 2rem 0;
            border-radius: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .action-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .trending-books {
            margin: 3rem 0;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        
        .view-all {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
    `;
  document.head.appendChild(style);
});
