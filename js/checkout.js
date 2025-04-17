class CheckoutManager {
  static init() {
    this.populateOrderSummary();
    this.initializeFormValidation();
  }

  static populateOrderSummary() {
    const summaryItems = document.querySelector(".summary-items");
    const subtotalElement = document.querySelector(".subtotal span:last-child");
    const shippingElement = document.querySelector(".shipping span:last-child");
    const totalElement = document.querySelector(".total span:last-child");

    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];

    // Clear existing items
    summaryItems.innerHTML = "";

    // Add each item to the summary
    cartItems.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "summary-item";
      itemElement.innerHTML = `
        <div class="item-details">
          <span class="item-name">${item.name}</span>
          <span class="item-quantity">x${item.quantity}</span>
        </div>
        <span class="item-price">£${(item.price * item.quantity).toFixed(
          2
        )}</span>
      `;
      summaryItems.appendChild(itemElement);
    });

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal > 0 ? 5.0 : 0; // £5 shipping fee if cart not empty
    const total = subtotal + shipping;

    // Update totals display
    subtotalElement.textContent = `£${subtotal.toFixed(2)}`;
    shippingElement.textContent = `£${shipping.toFixed(2)}`;
    totalElement.textContent = `£${total.toFixed(2)}`;
  }

  static initializeFormValidation() {
    const form = document.getElementById("checkout-form");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (this.validateForm()) {
        // Process the order
        this.processOrder();
      }
    });
  }

  static validateForm() {
    // Add form validation logic here
    return true;
  }

  static processOrder() {
    // Clear cart
    localStorage.removeItem("cart");

    // Show success message
    alert("Thank you for your order!");

    // Redirect to confirmation page
    window.location.href = "confirmation.html";
  }
}

// Initialize CheckoutManager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  CheckoutManager.init();
});
