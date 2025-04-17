class ProductManager {
  static async init() {
    try {
      const productContainer = document.querySelector(".products-list");
      const cartButton = document.getElementById("cart-button");
      const shopNowBtn = document.querySelector(".shop-now");

      this.products = await this.loadProducts();

      if (shopNowBtn) {
        this.initializeShopNowButton(shopNowBtn);
      }

      this.initializeNavigation();
      this.filterProducts("all");

      if (window.CartManager) {
        window.CartManager.updateCartCount();
      }

      cartButton?.addEventListener("click", () => {
        window.location.href = "cart.html";
      });
    } catch (error) {
      console.error("Error initializing products:", error);
      this.showNotification("Failed to initialize products", "error");
    }
  }

  static async loadProducts() {
    try {
      const cached = this.getStorageItem("products");
      if (cached) return cached;

      const response = await fetch("../data/products.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      const productData = products.local_products_of_nepal || [];
      this.setStorageItem("products", productData);
      return productData;
    } catch (error) {
      console.error("Failed loading products:", error);
      this.showNotification("Failed to load products", "error");
      return [];
    }
  }

  static getStorageItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  }

  static setStorageItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
      return false;
    }
  }

  static filterProducts(category) {
    const productContainer = document.querySelector(".products-list");
    if (!productContainer) return;

    try {
      productContainer.innerHTML = "";
      const productsToShow =
        category === "all"
          ? this.products
          : this.products.filter((product) => product.category === category);

      productsToShow.forEach((product) => {
        const productCard = this.createProductCard(product);
        productContainer.appendChild(productCard);
      });
    } catch (error) {
      console.error("Error filtering products:", error);
      this.showNotification("Failed to display products", "error");
    }
  }

  static createProductCard(product) {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <img src="${this.escapeHtml(product.image_url)}" alt="${this.escapeHtml(
      product.name
    )}" loading="lazy" />
      <h2>${this.escapeHtml(product.name)}</h2>
      <p class="price">$${product.price_usd.toFixed(2)}</p>
      <button class="add-to-cart" data-id="${this.escapeHtml(product.id)}">
        <i class="fas fa-shopping-cart"></i>
        Add to Cart
      </button>
    `;

    const addButton = productCard.querySelector(".add-to-cart");
    addButton.addEventListener("click", (e) =>
      this.handleAddToCart(e, product)
    );

    return productCard;
  }

  static handleAddToCart(e, product) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const productToAdd = {
        id: product.id,
        name: product.name,
        price: product.price_usd,
        image: product.image_url,
        quantity: 1,
      };

      if (window.CartManager) {
        window.CartManager.addToCart(productToAdd);
      }

      const button = e.currentTarget;
      button.classList.add("added");
      setTimeout(() => {
        button.classList.remove("added");
        if (window.CartManager) {
          window.CartManager.refreshCart();
        }
      }, 1000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      this.showNotification("Failed to add item to cart", "error");
    }
  }

  static initializeShopNowButton(button) {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
      });

      const allCategoryLink = document.querySelector('[data-category="all"]');
      if (allCategoryLink) {
        allCategoryLink.classList.add("active");
      }

      this.filterProducts("all");

      const productsSection = document.querySelector(".products-list");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  static initializeNavigation() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        e.target.classList.add("active");
        this.filterProducts(e.target.dataset.category);

        const productContainer = document.querySelector(".products-list");
        if (productContainer) {
          productContainer.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  static escapeHtml(unsafe) {
    if (unsafe == null) return "";
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  static showNotification(message, type = "success") {
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.setAttribute("role", "alert");
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize ProductManager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  ProductManager.init();
});

// Export the ProductManager class
if (typeof module !== "undefined" && module.exports) {
  module.exports = ProductManager;
} else {
  window.ProductManager = ProductManager;
}

if (window.location.pathname.includes("checkout.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    const cartTotal = document.getElementById("cart-total");
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];

    if (cartTotal) {
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      );
      cartTotal.textContent = total.toFixed(2);
    }

    document.getElementById("payment-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Thank you for your payment!");
      localStorage.removeItem("cart");
      window.location.href = "index.html";
    });
  });
}
