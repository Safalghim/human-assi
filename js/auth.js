
class AuthManager {
  static #ENCRYPTION_KEY = "your-secret-key";
  static #SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static init() {
    this.checkAuth();
    this.setupAuthForms();
  }

  static setupAuthForms() {
    const signupForm = document.getElementById("signup-form");
    const signinForm = document.getElementById("signin-form");

    if (signupForm) {
      window.setupFormValidation(signupForm);
      signupForm.addEventListener("submit", this.handleSignUp.bind(this));
    }

    if (signinForm) {
      window.setupFormValidation(signinForm);
      signinForm.addEventListener("submit", this.handleSignIn.bind(this));
    }
  }

  static async handleSignUp(event) {
    event.preventDefault();

    if (!window.validateForm(event.target)) {
      return;
    }

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      window.Utils.showNotification("Passwords do not match", "error");
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

      const users = await this.getUsers();
      if (users.some((user) => user.email === email)) {
        throw new Error("An account with this email already exists");
      }

      const hashedPassword = await this.hashPassword(password);
      const user = {
        id: crypto.randomUUID(),
        fullname,
        email,
        password: hashedPassword,
        sessionToken: this.generateSessionToken(),
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      users.push(user);
      await this.setUsers(users);

      this.setUserSession(user);

      window.Utils.showNotification(
        "Account created successfully! Redirecting...",
        "success"
      );
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    } catch (error) {
      console.error("Sign up error:", error);
      window.Utils.showNotification(
        error.message ||
          "There was a problem creating your account. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  static async handleSignIn(event) {
    event.preventDefault();

    if (!window.validateForm(event.target)) {
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
      const users = await this.getUsers();
      const user = users.find(
        (u) => u.email === email && u.password === hashedPassword
      );

      if (user) {
        user.sessionToken = this.generateSessionToken();
        user.lastLogin = new Date().toISOString();
        await this.setUsers(users);

        this.setUserSession(user);
        window.Utils.showNotification(
          "Welcome back! Redirecting...",
          "success"
        );

        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1500);
      } else {
        throw new Error("Invalid email or password");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      window.Utils.showNotification(
        error.message || "There was a problem signing in. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  static handleSignOut() {
    this.clearUserSession();
    window.Utils.showNotification(
      "You have been signed out successfully",
      "success"
    );
    window.location.href = "../index.html";
  }

  static async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.#ENCRYPTION_KEY);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  static generateSessionToken() {
    return crypto.randomUUID();
  }

  static setUserSession(user) {
    const session = {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      sessionToken: user.sessionToken,
      expires: Date.now() + this.#SESSION_DURATION,
    };
    localStorage.setItem("session", JSON.stringify(session));
    this.updateAuthUI(true);
  }

  static clearUserSession() {
    localStorage.removeItem("session");
    this.updateAuthUI(false);
  }

  static checkAuth() {
    const session = this.getCurrentSession();
    if (!session) {
      this.clearUserSession();
      return false;
    }

    if (Date.now() > session.expires) {
      this.clearUserSession();
      return false;
    }

    this.updateAuthUI(true);
    return true;
  }

  static getCurrentSession() {
    try {
      return JSON.parse(localStorage.getItem("session"));
    } catch {
      return null;
    }
  }

  static updateAuthUI(isAuthenticated) {
    const session = this.getCurrentSession();
    const authLinks = document.querySelectorAll(".auth-link");
    const userMenu = document.querySelector(".user-menu");

    authLinks.forEach((link) => {
      link.style.display = isAuthenticated ? "none" : "block";
    });

    if (userMenu) {
      if (isAuthenticated && session) {
        userMenu.style.display = "block";
        const userNameElement = userMenu.querySelector(".user-name");
        if (userNameElement) {
          userNameElement.textContent = session.fullname;
        }
      } else {
        userMenu.style.display = "none";
      }
    }
  }

  static async getUsers() {
    try {
      const usersJson = localStorage.getItem("users");
      return usersJson ? JSON.parse(usersJson) : [];
    } catch {
      return [];
    }
  }

  static async setUsers(users) {
    try {
      localStorage.setItem("users", JSON.stringify(users));
      return true;
    } catch (error) {
      console.error("Error saving users:", error);
      return false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  AuthManager.init();
});
