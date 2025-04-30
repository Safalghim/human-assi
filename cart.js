class ShoppingCart {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart")) || [];
    this.updateCartCount();
    if (window.location.pathname.includes("cart.html")) {
      this.initializeCartPage();
    }
  }

  addToCart(productId) {
    const existingItem = this.cart.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({ id: productId, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(this.cart));
    this.updateCartCount();
  }

  updateCartCount() {
    const cartCount = document.querySelector(".cart-count");
    if (cartCount) {
      const total = this.cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCount.textContent = total;
    }
  }

  async initializeCartPage() {
    const cartItems = document.querySelector(".cart-items");
    const subtotalEl = document.querySelector(".subtotal span:last-child");
    const totalEl = document.querySelector(".total span:last-child");

    if (this.cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
          <a href="categories.html" class="cta-button">Continue Shopping</a>
        </div>`;
      return;
    }

    try {
      const response = await fetch("products.json");
      const data = await response.json();
      const products = data.local_products_of_nepal;

      let subtotal = 0;
      cartItems.innerHTML = this.cart
        .map((item) => {
          const product = products.find((p) => p.id === item.id);
          if (!product) return "";

          const itemTotal = product.price_usd * item.quantity;
          subtotal += itemTotal;

          return `
          <div class="cart-item" data-id="${product.id}">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="item-details">
              <h3>${product.name}</h3>
              <p class="price">£${product.price_usd}</p>
              <div class="quantity">
                <button class="decrease">-</button>
                <span>${item.quantity}</span>
                <button class="increase">+</button>
              </div>
            </div>
            <p class="item-total">£${itemTotal}</p>
            <button class="remove-item">×</button>
          </div>
        `;
        })
        .join("");

      subtotalEl.textContent = `£${subtotal}`;
      totalEl.textContent = `£${subtotal}`;

      this.setupCartEventListeners();
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }

  setupCartEventListeners() {
    document.querySelectorAll(".cart-item").forEach((item) => {
      const id = item.dataset.id;
      item
        .querySelector(".increase")
        .addEventListener("click", () => this.updateQuantity(id, 1));
      item
        .querySelector(".decrease")
        .addEventListener("click", () => this.updateQuantity(id, -1));
      item
        .querySelector(".remove-item")
        .addEventListener("click", () => this.removeItem(id));
    });
  }

  updateQuantity(id, change) {
    const item = this.cart.find((item) => item.id === id);
    if (item) {
      item.quantity = Math.max(0, item.quantity + change);
      if (item.quantity === 0) {
        this.removeItem(id);
      } else {
        localStorage.setItem("cart", JSON.stringify(this.cart));
        this.updateCartCount();
        this.initializeCartPage();
      }
    }
  }

  removeItem(id) {
    this.cart = this.cart.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(this.cart));
    this.updateCartCount();
    this.initializeCartPage();
  }

  async getCartTotal() {
    try {
      const response = await fetch("products.json");
      const data = await response.json();
      const products = data.local_products_of_nepal;

      return this.cart.reduce((total, item) => {
        const product = products.find((p) => p.id === item.id);
        return total + (product ? product.price_usd * item.quantity : 0);
      }, 0);
    } catch (error) {
      console.error("Error calculating cart total:", error);
      return 0;
    }
  }
}

const cart = new ShoppingCart();
export const addToCart = (productId) => cart.addToCart(productId);
export const getCartTotal = () => cart.getCartTotal();
