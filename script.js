import { addToCart } from "./cart.js";



// Initialize featured products
function initializeFeaturedProducts() {
  const featuredProducts = document.querySelectorAll(".product-card");

  featuredProducts.forEach((card) => {
    const addButton = card.querySelector(".add-to-cart");
    const productId = card.dataset.productId;

    addButton.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart(productId);
      showNotification("Product added to cart!");
    });
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification success";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize dynamic products (for categories page)
async function initializeDynamicProducts() {
  const productsContainer = document.querySelector(".products-list");
  if (!productsContainer) return;

  try {
    const response = await fetch("products.json");
    const data = await response.json();
    const products = data.local_products_of_nepal;

    // Setup category filters
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
      button.addEventListener("click", () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        // Filter products
        const category = button.dataset.category;
        const filteredProducts = category === "all"
          ? products
          : products.filter(product => product.category === category);

        // Display filtered products
        displayProducts(filteredProducts);
      });
    });

    // Initial display
    displayProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayProducts(products) {
  const productsContainer = document.querySelector(".products-list");
  productsContainer.innerHTML = products.map(product => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image_url}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="price">£${product.price_usd}</p>
      <p class="product-description">${product.description}</p>
      <button class="add-to-cart">Add to Cart</button>
    </div>
  `).join("");

  // Reattach event listeners
  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", (e) => {
      const productId = e.target.closest(".product-card").dataset.productId;
      addToCart(productId);
      showNotification("Product added to cart!");
    });
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializeFeaturedProducts(); // For featured products on home page
  initializeDynamicProducts(); // For dynamic products on categories page

  // Add to cart buttons
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.target.closest(".product-card").dataset.productId;
      addToCart(productId);
      showNotification("Product added to cart!");
    });
  });
});
