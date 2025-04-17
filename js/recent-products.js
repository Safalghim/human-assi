class RecentProductsManager {
  static get STORAGE_KEY() {
    return "recentlyViewedProducts";
  }

  static get MAX_PRODUCTS() {
    return 4;
  }

  static addToRecentProducts(product) {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Local storage is not available");
      }

      let recentProducts = this.getRecentProducts();
      recentProducts = recentProducts.filter((p) => p.id !== product.id);
      recentProducts.unshift(product);

      if (recentProducts.length > this.MAX_PRODUCTS) {
        recentProducts = recentProducts.slice(0, this.MAX_PRODUCTS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentProducts));
      this.updateRecentProductsDisplay();
    } catch (error) {
      console.error("Error adding to recent products:", error);
    }
  }

  static getRecentProducts() {
    try {
      const recentProducts = localStorage.getItem(this.STORAGE_KEY);
      return recentProducts ? JSON.parse(recentProducts) : [];
    } catch (error) {
      console.error("Error getting recent products:", error);
      return [];
    }
  }

  static isStorageAvailable() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  static updateRecentProductsDisplay() {
    try {
      const container = document.querySelector(".recent-products");
      if (!container) return;

      const products = this.getRecentProducts();

      if (products.length === 0) {
        container.style.display = "none";
        return;
      }

      container.style.display = "block";
      container.innerHTML = this.generateRecentProductsHTML(products);
      this.attachCartEventListeners();
    } catch (error) {
      console.error("Error updating recent products display:", error);
    }
  }

  static generateRecentProductsHTML(products) {
    return `
      <h2>Recently Viewed Products</h2>
      <div class="recent-products-grid">
        ${products
          .map((product) => this.generateProductCardHTML(product))
          .join("")}
      </div>
    `;
  }

  static generateProductCardHTML(product) {
    const imageUrl = product.image || product.image_url;
    const price = product.price || product.price_usd;

    return `
      <div class="product-card" data-product-id="${this.escapeHtml(
        product.id
      )}">
        <img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(
      product.name
    )}" loading="lazy">
        <h3>${this.escapeHtml(product.name)}</h3>
        <p class="product-description">${this.escapeHtml(
          product.description
        )}</p>
        <p>£${typeof price === "number" ? price.toFixed(2) : "0.00"}</p>
        <button class="add-to-cart" data-id="${this.escapeHtml(product.id)}">
          Add to Cart
        </button>
      </div>
    `;
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

  static attachCartEventListeners() {
    const addToCartButtons = document.querySelectorAll(
      ".recent-products .add-to-cart"
    );
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = button.dataset.id;
        const product = this.getRecentProducts().find(
          (p) => p.id === productId
        );
        if (product && window.CartManager) {
          window.CartManager.addToCart(product);
        }
      });
    });
  }
}

// Initialize recent products display when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  RecentProductsManager.updateRecentProductsDisplay();

  // Track viewed products
  document.addEventListener("click", (e) => {
    const productCard = e.target.closest(".product-card");
    if (!productCard) return;

    const productId = productCard.dataset.productId;
    const product = window.currentProducts?.find((p) => p.id === productId);

    if (product) {
      RecentProductsManager.addToRecentProducts(product);
    }
  });
});

// Export the RecentProductsManager class
if (typeof module !== "undefined" && module.exports) {
  module.exports = RecentProductsManager;
} else {
  window.RecentProductsManager = RecentProductsManager;
}
