class CheckoutManager {
  constructor() {
    this.form = document.getElementById("checkout-form");
    this.summarySection = document.querySelector(".summary-items");
    this.init();
  }

  async init() {
    await this.loadOrderSummary();
    this.setupFormValidation();
    this.setupCardFormatting();
  }

  async loadOrderSummary() {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const summaryItemsEl = this.summarySection;
      const subtotalEl = document.querySelector(".subtotal .amount");
      const shippingEl = document.querySelector(".shipping .amount");
      const totalEl = document.querySelector(".total .amount");
      const orderButton = document.querySelector(".place-order-button");

      if (cart.length === 0) {
        summaryItemsEl.innerHTML = `
          <div class="empty-cart">
            <p>Your cart is empty</p>
            <a href="categories.html">Continue Shopping</a>
          </div>`;
        return;
      }

      const response = await fetch("products.json");
      const data = await response.json();
      const products = data.local_products_of_nepal;

      let subtotal = 0;
      summaryItemsEl.innerHTML = cart
        .map((item) => {
          const product = products.find((p) => p.id === item.id);
          if (!product) return "";

          const itemTotal = product.price_usd * item.quantity;
          subtotal += itemTotal;

          return `
            <div class="summary-item">
              <img src="${product.image_url}" alt="${product.name}">
              <div class="item-info">
                <h4>${product.name}</h4>
                <p>Quantity: ${item.quantity}</p>
                <p class="item-price">£${itemTotal.toFixed(2)}</p>
              </div>
            </div>
          `;
        })
        .join("");

      const shipping = subtotal > 50 ? 0 : 5;
      const total = subtotal + shipping;

      // Update all price displays
      subtotalEl.textContent = `£${subtotal.toFixed(2)}`;
      shippingEl.textContent = `£${shipping.toFixed(2)}`;
      totalEl.textContent = `£${total.toFixed(2)}`;
      orderButton.textContent = `Place Order (£${total.toFixed(2)})`;
    } catch (error) {
      console.error("Error loading order summary:", error);
      this.summarySection.innerHTML = `
        <div class="error-message">
          There was an error loading your order summary. Please try again.
        </div>`;
    }
  }

  setupFormValidation() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (this.validateForm()) {
        localStorage.removeItem("cart");
        window.location.href = "confirmation.html";
      }
    });
  }

  validateForm() {
    let isValid = true;
    const requiredFields = this.form.querySelectorAll("[required]");

    requiredFields.forEach((field) => {
      field.classList.remove("error");
      if (!field.value.trim()) {
        field.classList.add("error");
        isValid = false;
      }
    });

    return isValid;
  }

  setupCardFormatting() {
    const cardInput = document.getElementById("card-number");
    if (cardInput) {
      cardInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})/g, "$1 ").trim();
        e.target.value = value.substring(0, 19);
      });
    }
  }
}

// Initialize checkout when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});
