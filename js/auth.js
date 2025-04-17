// Store user data in localStorage
const users = JSON.parse(localStorage.getItem("users")) || [];

// Authentication management
class AuthManager {
  static get SESSION_DURATION() {
    return 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  static async hashPassword(password) {
    // First check if Web Crypto is available
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback to a basic hash if crypto API not available
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (error) {
      console.error("Crypto API error:", error);
      throw new Error("Failed to hash password securely");
    }
  }

  static async handleSignUp(event) {
    event.preventDefault();

    if (!validateForm(event.target)) {
      return;
    }

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      this.showNotification("Passwords do not match", "error");
      return;
    }

    if (users.some((user) => user.email === email)) {
      this.showNotification(
        "An account with this email already exists",
        "error"
      );
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

      const hashedPassword = await this.hashPassword(password);
      const user = {
        id: crypto.randomUUID(),
        fullname,
        email,
        password: hashedPassword,
        sessionToken: this.generateSessionToken(),
        created: new Date().toISOString(),
      };

      users.push(user);
      localStorage.setItem("users", JSON.stringify(users));
      this.setUserSession(user);

      this.showNotification(
        "Account created successfully! Redirecting...",
        "success"
      );
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      console.error("Sign up error:", error);
      this.showNotification(
        "There was a problem creating your account. Please try again.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  static async handleSignIn(event) {
    event.preventDefault();

    if (!validateForm(event.target)) {
      return;
    }

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Signing In...';

      const hashedPassword = await this.hashPassword(password);
      const user = users.find(
        (u) => u.email === email && u.password === hashedPassword
      );

      if (user) {
        user.sessionToken = this.generateSessionToken();
        user.lastLogin = new Date().toISOString();
        localStorage.setItem("users", JSON.stringify(users));
        this.setUserSession(user);

        this.showNotification("Welcome back! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        this.showNotification(
          "Invalid email or password. Please try again.",
          "error"
        );
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    } catch (error) {
      console.error("Sign in error:", error);
      this.showNotification(
        "There was a problem signing in. Please try again.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  static checkAuth() {
    const currentUser = this.getUserSession();
    if (!currentUser) {
      return false;
    }

    // Check if session has expired
    const lastLogin = new Date(currentUser.lastLogin).getTime();
    const now = new Date().getTime();
    if (now - lastLogin > this.SESSION_DURATION) {
      this.clearUserSession();
      this.showNotification(
        "Your session has expired. Please sign in again.",
        "error"
      );
      return false;
    }

    return true;
  }

  static generateSessionToken() {
    return crypto.randomUUID();
  }

  static setUserSession(user) {
    const sessionData = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      sessionToken: user.sessionToken,
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem("currentUser", JSON.stringify(sessionData));
  }

  static getUserSession() {
    const sessionData = localStorage.getItem("currentUser");
    if (!sessionData) return null;

    try {
      const user = JSON.parse(sessionData);
      const storedUser = users.find(
        (u) => u.id === user.id && u.sessionToken === user.sessionToken
      );

      if (!storedUser) {
        this.clearUserSession();
        return null;
      }

      return user;
    } catch (error) {
      console.error("Session error:", error);
      this.clearUserSession();
      return null;
    }
  }

  static clearUserSession() {
    localStorage.removeItem("currentUser");
  }

  static showNotification(message, type = "success") {
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }

    // Fallback notification system
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.setAttribute("role", "alert");
    notification.textContent = message;
    document.body.appendChild(notification);

    if (type === "error") {
      notification.setAttribute("aria-live", "assertive");
    } else {
      notification.setAttribute("aria-live", "polite");
    }

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize auth system
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const signinForm = document.getElementById("signin-form");

  if (signupForm) {
    setupFormValidation(signupForm);
    signupForm.addEventListener(
      "submit",
      AuthManager.handleSignUp.bind(AuthManager)
    );
  }

  if (signinForm) {
    setupFormValidation(signinForm);
    signinForm.addEventListener(
      "submit",
      AuthManager.handleSignIn.bind(AuthManager)
    );
  }

  AuthManager.checkAuth();
});

// Export the AuthManager class
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthManager;
} else {
  window.AuthManager = AuthManager;
}
