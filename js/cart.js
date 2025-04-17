// Cart management with user-specific storage
const CART_STORAGE_KEY = "cart";

class CartManager {
  static getUserCartKey() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    return user ? `${CART_STORAGE_KEY}_${user.id}` : CART_STORAGE_KEY;
  }

  static addToCart(product) {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Local storage is not available");
      }

      if (!product || !product.id) {
        throw new Error("Invalid product data");
      }

      const cart = this.getCart();
      const existingItem = cart.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        cart.push({
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString(),
        });
      }

      this.saveCart(cart);
      this.updateCartCount();
      this.showAddToCartAnimation();
      this.showNotification("Item added to cart successfully", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      this.showNotification("Failed to add item to cart", "error");
    }
  }

  static removeFromCart(productId) {
    try {
      if (!productId) {
        throw new Error("Product ID is required");
      }

      const cart = this.getCart();
      const updatedCart = cart.filter((item) => item.id !== productId);
      this.saveCart(updatedCart);
      this.updateCartCount();
      this.refreshCart();
      this.showNotification("Item removed from cart", "success");
    } catch (error) {
      console.error("Error removing from cart:", error);
      this.showNotification("Failed to remove item from cart", "error");
    }
  }

  static updateCartCount() {
    try {
      const cart = this.getCart();
      const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const cartCount = document.querySelector(".cart-count");
      if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? "block" : "none";
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  static getCart() {
    try {
      const cartData = localStorage.getItem(this.getUserCartKey());
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error("Error getting cart:", error);
      return [];
    }
  }

  static saveCart(cart) {
    try {
      localStorage.setItem(this.getUserCartKey(), JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart:", error);
      this.showNotification("Failed to save cart changes", "error");
    }
  }

  static showAddToCartAnimation() {
    const cartIcon = document.querySelector(".cart-icon");
    if (cartIcon) {
      cartIcon.classList.add("cart-animation");
      setTimeout(() => cartIcon.classList.remove("cart-animation"), 1000);
    }
  }

  static refreshCart() {
    try {
      const cartContainer = document.querySelector(".cart-items");
      if (!cartContainer) return;

      const cart = this.getCart();

      if (cart.length === 0) {
        cartContainer.innerHTML = `
          <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <a href="categories.html" class="cta-button">Continue Shopping</a>
          </div>
        `;
        this.updateCartSummary(0);
        return;
      }

      const total = this.calculateCartTotal(cart);
      this.renderCartItems(cartContainer, cart);
      this.updateCartSummary(total);
      this.attachCartEventListeners();
    } catch (error) {
      console.error("Error refreshing cart:", error);
      this.showNotification("Failed to load cart items", "error");
    }
  }

  static calculateCartTotal(cart) {
    return cart.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
  }

  static renderCartItems(container, cart) {
    container.innerHTML = `
      <div class="cart-list">
        ${cart
          .map(
            (item) => `
          <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="item-details">
              <h3>${item.name}</h3>
              <p class="price">£${item.price.toFixed(2)}</p>
              <div class="quantity-controls">
                <button class="quantity-btn minus" aria-label="Decrease quantity">-</button>
                <span class="quantity">${item.quantity || 1}</span>
                <button class="quantity-btn plus" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="item-total">
              <p>Total: £${(item.price * (item.quantity || 1)).toFixed(2)}</p>
            </div>
            <button class="remove-item" aria-label="Remove item">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  static updateCartSummary(total) {
    const summaryContainer = document.querySelector(".cart-summary");
    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <h3>Cart Summary</h3>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>£${total.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>£${total > 0 ? "5.00" : "0.00"}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>£${(total + (total > 0 ? 5 : 0)).toFixed(2)}</span>
        </div>
        ${
          total > 0
            ? `
          <button class="checkout-btn">Proceed to Checkout</button>
        `
            : ""
        }
      `;
    }
  }

  static attachCartEventListeners() {
    document.querySelectorAll(".quantity-btn").forEach((btn) => {
      btn.addEventListener("click", this.handleQuantityChange.bind(this));
    });

    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", this.handleRemoveItem.bind(this));
    });

    const checkoutBtn = document.querySelector(".checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", this.handleCheckout.bind(this));
    }
  }

  static handleQuantityChange(e) {
    try {
      const cartItem = e.target.closest(".cart-item");
      const productId = cartItem.dataset.id;
      const cart = this.getCart();
      const item = cart.find((item) => item.id === productId);

      if (item) {
        if (e.target.classList.contains("minus")) {
          item.quantity = Math.max(1, (item.quantity || 1) - 1);
        } else {
          item.quantity = (item.quantity || 1) + 1;
        }

        this.saveCart(cart);
        this.updateCartCount();
        this.refreshCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      this.showNotification("Failed to update quantity", "error");
    }
  }

  static handleRemoveItem(e) {
    const cartItem = e.target.closest(".cart-item");
    const productId = cartItem.dataset.id;
    this.removeFromCart(productId);
  }

  static handleCheckout() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      this.showNotification("Please sign in to proceed with checkout", "error");
      setTimeout(() => {
        window.location.href = "sign-in.html";
      }, 1500);
      return;
    }
    window.location.href = "checkout.html";
  }

  static showNotification(message, type = "success") {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(message);
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
}

// Export the CartManager class
if (typeof module !== "undefined" && module.exports) {
  module.exports = CartManager;
} else {
  window.CartManager = CartManager;
}

// Initialize cart when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  CartManager.updateCartCount();
  CartManager.refreshCart();
});
