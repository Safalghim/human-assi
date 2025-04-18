class CheckoutManager {
  static init() {
    this.populateOrderSummary();
    this.initializeFormValidation();
    this.setupPaymentMethodToggle();
  }

  static populateOrderSummary() {
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const summaryContainer = document.querySelector(".order-summary");
    const totalElement = document.querySelector(".order-total");

    if (summaryContainer) {
      if (cartItems.length === 0) {
        summaryContainer.innerHTML =
          '<p class="empty-cart">Your cart is empty</p>';
        window.location.href = "cart.html";
        return;
      }

      const itemsHtml = cartItems
        .map(
          (item) => `
                <div class="summary-item">
                    <img src="${item.image}" alt="${
            item.name
          }" class="summary-item-image">
                    <div class="summary-item-details">
                        <h3>${item.name}</h3>
                        <p class="quantity">Quantity: ${item.quantity}</p>
                        <p class="price">$${(
                          item.price * item.quantity
                        ).toFixed(2)}</p>
                    </div>
                </div>
            `
        )
        .join("");

      summaryContainer.innerHTML = itemsHtml;

      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
      }
    }
  }

  static initializeFormValidation() {
    const form = document.getElementById("checkout-form");
    if (!form) return;

    // Initialize form validation
    window.setupFormValidation(form);

    // Add custom validation for payment fields
    this.setupPaymentFieldValidation();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!window.validateForm(form)) {
        return;
      }

      await this.processOrder(form);
    });
  }

  static setupPaymentMethodToggle() {
    const paymentMethods = document.querySelectorAll(
      'input[name="payment-method"]'
    );
    const cardFields = document.querySelector(".card-fields");

    paymentMethods.forEach((method) => {
      method.addEventListener("change", (e) => {
        if (cardFields) {
          cardFields.style.display =
            e.target.value === "card" ? "block" : "none";

          // Toggle required attribute on card fields
          cardFields.querySelectorAll("input").forEach((input) => {
            input.required = e.target.value === "card";
          });
        }
      });
    });
  }

  static setupPaymentFieldValidation() {
    // Card number formatting
    const cardInput = document.getElementById("card-number");
    if (cardInput) {
      cardInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})/g, "$1 ").trim();
        e.target.value = value.substring(0, 19);
      });
    }

    // Expiry date formatting
    const expiryInput = document.getElementById("expiry");
    if (expiryInput) {
      expiryInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length >= 2) {
          value = value.substring(0, 2) + "/" + value.substring(2);
        }
        e.target.value = value.substring(0, 5);
      });
    }
  }

  static async processOrder(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      // Get form data
      const formData = new FormData(form);
      const orderData = {
        customer: {
          name: formData.get("fullname"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          address: {
            street: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            postalCode: formData.get("postal-code"),
          },
        },
        payment: {
          method: formData.get("payment-method"),
          cardDetails:
            formData.get("payment-method") === "card"
              ? {
                  number: formData.get("card-number")?.replace(/\s/g, ""),
                  expiry: formData.get("expiry"),
                  cvv: formData.get("cvv"),
                }
              : null,
        },
        items: JSON.parse(localStorage.getItem("cart") || "[]"),
        orderDate: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear cart
      localStorage.removeItem("cart");

      // Store order in order history
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(orderData);
      localStorage.setItem("orders", JSON.stringify(orders));

      // Show success message and redirect
      window.Utils.showNotification("Order placed successfully!", "success");
      setTimeout(() => {
        window.location.href = "order-confirmation.html";
      }, 1500);
    } catch (error) {
      console.error("Order processing error:", error);
      window.Utils.showNotification(
        "There was a problem processing your order. Please try again.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  CheckoutManager.init();
});
