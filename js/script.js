class ProductManager {
  static async init() {
    try {
      const productContainer = document.querySelector(".products-grid");
      if (!productContainer) return;

      // Add loading state
      this.showLoadingState(productContainer);

      this.products = await this.loadProducts();

      // Initialize filters and navigation
      this.initializeFilters();
      this.initializeNavigation();

      // Update product count
      this.updateProductCount(this.products.length);

      // Remove loading state and show products
      this.hideLoadingState(productContainer);
      this.filterProducts("all");

      if (window.CartManager) {
        window.CartManager.updateCartCount();
      }
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

  static filterProducts(category, customProducts = null) {
    const productContainer = document.querySelector(".products-grid");
    const categoryTags = document.querySelectorAll(".category-tag");
    if (!productContainer) return;

    try {
      productContainer.innerHTML = "";
      let productsToShow = customProducts;

      // Update category tag active state
      categoryTags.forEach((tag) => {
        tag.classList.remove("active");
        if (tag.textContent.toLowerCase() === category.toLowerCase()) {
          tag.classList.add("active");
        }
      });

      if (!productsToShow) {
        productsToShow =
          category.toLowerCase() === "all products"
            ? this.products
            : this.products.filter(
                (product) =>
                  product.category.toLowerCase() === category.toLowerCase()
              );
      }

      if (productsToShow.length === 0) {
        productContainer.innerHTML = `
          <div class="no-products">
            <p>No products found in this category</p>
          </div>
        `;
        return;
      }

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
    productCard.dataset.category = product.category;

    const imageUrl = product.image_url.startsWith("../")
      ? product.image_url
      : "../" + product.image_url;

    productCard.innerHTML = `
      <img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(
      product.name
    )}" loading="lazy" />
      <h3>${this.escapeHtml(product.name)}</h3>
      <p class="product-description">${this.escapeHtml(product.description)}</p>
      <p class="price">£${product.price_usd.toFixed(2)}</p>
      <button class="add-to-cart" data-id="${this.escapeHtml(product.id)}">
        <i class="fas fa-shopping-cart"></i>
        Add to Cart
      </button>
    `;

    const addButton = productCard.querySelector(".add-to-cart");
    addButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAddToCart(e, product);
    });

    return productCard;
  }

  static handleAddToCart(e, product) {
    try {
      const button = e.currentTarget;
      const icon = button.querySelector("i");

      // Add loading state
      button.disabled = true;
      icon.classList.remove("fa-shopping-cart");
      icon.classList.add("fa-spinner", "fa-spin");

      setTimeout(() => {
        const productToAdd = {
          id: product.id,
          name: product.name,
          price: product.price_usd,
          image: product.image_url.startsWith("../")
            ? product.image_url
            : "../" + product.image_url,
          quantity: 1,
          category: product.category,
        };

        if (window.CartManager) {
          window.CartManager.addToCart(productToAdd);
        }

        // Success state
        icon.classList.remove("fa-spinner", "fa-spin");
        icon.classList.add("fa-check");
        button.classList.add("added");
        button.innerHTML = '<i class="fas fa-check"></i> Added to Cart';

        setTimeout(() => {
          button.disabled = false;
          button.classList.remove("added");
          button.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }, 2000);

        // Add to recently viewed
        if (window.RecentProductsManager) {
          window.RecentProductsManager.addToRecent(product);
        }
      }, 800); // Simulate network delay for better UX
    } catch (error) {
      console.error("Error adding to cart:", error);
      this.showNotification("Failed to add item to cart", "error");
    }
  }

  static initializeShopNowButton(button) {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-link, .category-tag").forEach((el) => {
        el.classList.remove("active");
      });

      const allCategoryTag = document.querySelector(
        ".category-tag:first-child"
      );
      if (allCategoryTag) {
        allCategoryTag.classList.add("active");
      }

      this.filterProducts("All Products");

      const productsSection = document.querySelector(".products-grid");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Initialize category tag click handlers
    document.querySelectorAll(".category-tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        const category = tag.textContent;
        this.filterProducts(category);
      });
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
    } else {
      console.log(message);
    }
  }

  static showLoadingState(container) {
    const loadingCards = Array(6)
      .fill(0)
      .map(
        () => `
      <div class="product-card loading">
        <div class="img"></div>
        <div class="h3"></div>
        <div class="price"></div>
        <div class="product-description"></div>
        <button class="add-to-cart" disabled>
          <i class="fas fa-shopping-cart"></i>
          Add to Cart
        </button>
      </div>
    `
      )
      .join("");

    container.innerHTML = loadingCards;
  }

  static hideLoadingState(container) {
    container.innerHTML = "";
  }

  static updateProductCount(count) {
    const countElement = document.getElementById("product-count");
    if (countElement) {
      countElement.textContent = count;
    }
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
