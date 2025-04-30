import { addToCart } from "./cart.js";

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

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification success";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

async function initializeDynamicProducts() {
  const productsContainer = document.querySelector(".products-list");
  if (!productsContainer) return;

  try {
    const response = await fetch("products.json");
    const data = await response.json();
    const products = data.local_products_of_nepal;

    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const category = button.dataset.category;
        const filteredProducts =
          category === "all"
            ? products
            : products.filter((product) => product.category === category);

        displayProducts(filteredProducts);
      });
    });

    displayProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayProducts(products) {
  const productsContainer = document.querySelector(".products-list");
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image_url}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="price">£${product.price_usd}</p>
      <p class="product-description">${product.description}</p>
      <button class="add-to-cart">Add to Cart</button>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.target.closest(".product-card").dataset.productId;
      addToCart(productId);
      showNotification("Product added to cart!");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeFeaturedProducts();
  initializeDynamicProducts();

  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.target.closest(".product-card").dataset.productId;
      addToCart(productId);
      showNotification("Product added to cart!");
    });
  });

  const signInForm = document.getElementById("signin-form");
  if (signInForm) {
    signInForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showNotification("Sign in successful! Redirecting to home page...");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    });
  }

  const signUpForm = document.getElementById("signup-form");
  if (signUpForm) {
    signUpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showNotification(
        "Account created successfully! Redirecting to home page..."
      );
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    });
  }

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showNotification(
        "Thank you for your payment! Redirecting to home page..."
      );
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    });
  }
});
