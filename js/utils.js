// Utility functions for common operations
class Utils {
  static showNotification(message, type = "success") {
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.setAttribute("role", "alert");
    notification.textContent = message;

    if (type === "error") {
      notification.setAttribute("aria-live", "assertive");
    } else {
      notification.setAttribute("aria-live", "polite");
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
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
      if (error.name === "QuotaExceededError") {
        this.clearOldCache();
      }
      return false;
    }
  }

  static clearOldCache() {
    try {
      const now = Date.now();
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

      Object.keys(localStorage).forEach((key) => {
        if (key.endsWith("Cache")) {
          const data = this.getStorageItem(key);
          if (data?.timestamp && now - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error("Error clearing old cache:", error);
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

  static formatPrice(price) {
    return typeof price === "number" ? `£${price.toFixed(2)}` : "£0.00";
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static generateId() {
    return crypto.randomUUID();
  }
}

// Export the Utils class
if (typeof module !== "undefined" && module.exports) {
  module.exports = Utils;
} else {
  window.Utils = Utils;
}
