class ContactManager {
  static init() {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    window.setupFormValidation(contactForm);
    contactForm.addEventListener(
      "submit",
      this.handleContactSubmission.bind(this)
    );
  }

  static async handleContactSubmission(event) {
    event.preventDefault();

    if (!window.validateForm(event.target)) {
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Sending...';

      const formData = this.getFormData();

      // Validate email format
      if (!this.isValidEmail(formData.email)) {
        throw new Error("Invalid email format");
      }

      // Sanitize form data
      const sanitizedData = this.sanitizeFormData(formData);

      // Store in localStorage for demo purposes
      // In a real app, this would be sent to a server
      this.storeContactMessage(sanitizedData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.showNotification(
        "Message sent successfully! We'll get back to you soon.",
        "success"
      );
      event.target.reset();
    } catch (error) {
      console.error("Contact form error:", error);
      this.showNotification(
        error.message || "Failed to send message. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  static getFormData() {
    return {
      name: document.getElementById("name")?.value || "",
      email: document.getElementById("email")?.value || "",
      subject: document.getElementById("subject")?.value || "",
      message: document.getElementById("message")?.value || "",
      timestamp: new Date().toISOString(),
    };
  }

  static sanitizeFormData(data) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, this.escapeHtml(value)])
    );
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

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static storeContactMessage(data) {
    try {
      const messages = this.getStorageItem("contactMessages") || [];
      messages.push({
        id: crypto.randomUUID(),
        ...data,
      });
      this.setStorageItem("contactMessages", messages);
    } catch (error) {
      console.error("Error storing contact message:", error);
      throw new Error("Failed to store message");
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

// Initialize contact form when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  ContactManager.init();
});

// Export the ContactManager class
if (typeof module !== "undefined" && module.exports) {
  module.exports = ContactManager;
} else {
  window.ContactManager = ContactManager;
}
