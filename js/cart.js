function showToast(message, type = "success") {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "success" ? "check-circle" : "exclamation-circle";
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

class CartManager {
  static cartItems = [];

  static init() {
    this.loadCart();
    this.updateCartCount();
    this.renderCart();
    this.initializeEventListeners();
  }

  static loadCart() {
    try {
      const savedCart = localStorage.getItem("cart");
      this.cartItems = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart:", error);
      this.showNotification("Failed to load cart items", "error");
      this.cartItems = [];
    }
  }

  static saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(this.cartItems));
      this.updateCartCount();
    } catch (error) {
      console.error("Error saving cart:", error);
      this.showNotification("Failed to save cart items", "error");
    }
  }

  static addToCart(product) {
    try {
      const existingItem = this.cartItems.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        this.cartItems.push({ ...product, quantity: 1 });
      }

      this.saveCart();
      this.showNotification("Item added to cart", "success");
      this.updateCartCount();
    } catch (error) {
      console.error("Error adding to cart:", error);
      this.showNotification("Failed to add item to cart", "error");
    }
  }

  static updateCartCount() {
    try {
      const cartCount = document.querySelector(".cart-count");
      if (cartCount) {
        const totalItems = this.cartItems.reduce(
          (sum, item) => sum + (item.quantity || 1),
          0
        );
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? "block" : "none";
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  static removeFromCart(productId) {
    try {
      this.cartItems = this.cartItems.filter((item) => item.id !== productId);
      this.saveCart();
      this.renderCart();
      this.showNotification("Item removed from cart", "success");
    } catch (error) {
      console.error("Error removing from cart:", error);
      this.showNotification("Failed to remove item", "error");
    }
  }

  static updateQuantity(productId, newQuantity) {
    try {
      const item = this.cartItems.find((item) => item.id === productId);
      if (item) {
        item.quantity = Math.max(1, parseInt(newQuantity) || 1);
        this.saveCart();
        this.renderCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      this.showNotification("Failed to update quantity", "error");
    }
  }

  static renderCart() {
    const cartContainer = document.querySelector(".cart-items");
    const cartTotal = document.querySelector(".cart-total");

    if (!cartContainer) return;

    try {
      if (this.cartItems.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        if (cartTotal) cartTotal.textContent = "0.00";
        return;
      }

      cartContainer.innerHTML = this.cartItems
        .map(
          (item) => `
          <div class="cart-item" data-id="${item.id}">
              <img src="${item.image}" alt="${item.name}" />
              <div class="item-details">
                  <h3>${item.name}</h3>
                  <p class="price">$${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                  <div class="quantity-controls">
                      <button class="quantity-btn minus" aria-label="Decrease quantity">-</button>
                      <input type="number" value="${item.quantity || 1}" min="1" class="quantity-input"
                          aria-label="Product quantity"/>
                      <button class="quantity-btn plus" aria-label="Increase quantity">+</button>
                  </div>
              </div>
              <button class="remove-item" aria-label="Remove item">×</button>
          </div>
      `
        )
        .join("");

      const total = this.cartItems.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      );
      if (cartTotal) cartTotal.textContent = total.toFixed(2);

      this.initializeCartControls();
    } catch (error) {
      console.error("Error rendering cart:", error);
      this.showNotification("Failed to display cart items", "error");
    }
  }

  static initializeCartControls() {
    document.querySelectorAll(".remove-item").forEach((button) => {
      button.addEventListener("click", (e) => {
        const cartItem = e.target.closest(".cart-item");
        if (cartItem) {
          this.removeFromCart(cartItem.dataset.id);
        }
      });
    });

    document.querySelectorAll(".quantity-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const cartItem = e.target.closest(".cart-item");
        const input = cartItem.querySelector(".quantity-input");
        const currentValue = parseInt(input.value) || 1;

        if (button.classList.contains("plus")) {
          input.value = currentValue + 1;
        } else if (button.classList.contains("minus") && currentValue > 1) {
          input.value = currentValue - 1;
        }

        this.updateQuantity(cartItem.dataset.id, input.value);
      });
    });

    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const cartItem = e.target.closest(".cart-item");
        this.updateQuantity(cartItem.dataset.id, e.target.value);
      });
    });
  }

  static initializeEventListeners() {
    const checkoutButton = document.querySelector(".checkout-button");
    if (checkoutButton) {
      checkoutButton.addEventListener("click", () => {
        if (this.cartItems.length === 0) {
          this.showNotification("Your cart is empty", "error");
          return;
        }
        window.location.href = "checkout.html";
      });
    }
  }

  static showNotification(message, type = "success") {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(message);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  CartManager.init();
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = CartManager;
} else {
  window.CartManager = CartManager;
}
