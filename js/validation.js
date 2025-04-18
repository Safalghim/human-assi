// Form validation utilities
const validators = {
  required: (value) => value.trim() !== "",
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  minLength: (value, length) => value.length >= length,
  maxLength: (value, length) => value.length <= length,
  phone: (value) => /^\+?[\d\s-]{10,}$/.test(value),
  postalCode: (value) => /^[A-Z0-9\s-]{3,}$/i.test(value),
  cardNumber: (value) => {
    // Implement Luhn algorithm for card validation
    const sanitized = value.replace(/\s/g, "");
    if (!/^\d{16,19}$/.test(sanitized)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },
  expiry: (value) => {
    const [month, year] = value.split("/").map((v) => v.trim());
    if (!month || !year) return false;

    const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    return expDate > today && parseInt(month) >= 1 && parseInt(month) <= 12;
  },
  cvv: (value) => /^\d{3,4}$/.test(value),
  password: (value) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    return (
      value.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers
    );
  },
};

// Add validation to form inputs
function setupFormValidation(formElement) {
  if (!formElement) return;

  const inputs = formElement.querySelectorAll("input, textarea, select");
  const submitButton = formElement.querySelector('button[type="submit"]');

  // Real-time validation
  inputs.forEach((input) => {
    // Validate on blur
    input.addEventListener("blur", () => validateInput(input));

    // Real-time validation while typing
    input.addEventListener("input", () => {
      if (input.classList.contains("error")) {
        validateInput(input);
      }
      updateSubmitButton(formElement, submitButton);
    });

    // Initialize password strength meter if it's a password field
    if (input.type === "password" && input.id === "password") {
      setupPasswordStrengthMeter(input);
    }
  });

  // Prevent form submission if validation fails
  formElement.addEventListener("submit", (e) => {
    if (!validateForm(formElement)) {
      e.preventDefault();
    }
  });
}

// Password strength meter setup
function setupPasswordStrengthMeter(passwordInput) {
  const meterContainer = document.createElement("div");
  meterContainer.className = "password-strength-meter";
  const meter = document.createElement("div");
  meter.className = "strength-meter";
  const text = document.createElement("span");
  text.className = "strength-text";

  meterContainer.appendChild(meter);
  meterContainer.appendChild(text);
  passwordInput.parentElement.appendChild(meterContainer);

  passwordInput.addEventListener("input", () =>
    updatePasswordStrength(passwordInput)
  );
}

// Update password strength indicator
function updatePasswordStrength(input) {
  const value = input.value;
  const meter = input.parentElement.querySelector(".strength-meter");
  const text = input.parentElement.querySelector(".strength-text");

  if (!meter || !text) return;

  const checks = {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const width = (strength / 5) * 100;

  meter.style.width = `${width}%`;
  meter.className = `strength-meter strength-${strength}`;
  text.textContent =
    ["Very Weak", "Weak", "Fair", "Good", "Strong"][strength - 1] || "";
}

// Validate a single input
function validateInput(input) {
  const value = input.value;
  let isValid = true;
  let errorMessage = "";

  // Clear existing error
  removeError(input);

  try {
    // Required field validation
    if (input.required && !validators.required(value)) {
      throw new Error("This field is required");
    }

    // Type-specific validation
    switch (input.type) {
      case "email":
        if (!validators.email(value))
          throw new Error("Please enter a valid email address");
        break;
      case "tel":
        if (!validators.phone(value))
          throw new Error("Please enter a valid phone number");
        break;
      case "password":
        if (input.id === "password" && !validators.password(value)) {
          throw new Error(
            "Password must be at least 8 characters long with uppercase, lowercase, and numbers"
          );
        }
        if (input.id === "confirm-password") {
          const password = document.getElementById("password");
          if (password && value !== password.value) {
            throw new Error("Passwords do not match");
          }
        }
        break;
    }

    // Field-specific validation
    switch (input.id) {
      case "card-number":
        if (!validators.cardNumber(value))
          throw new Error("Please enter a valid card number");
        break;
      case "expiry":
        if (!validators.expiry(value))
          throw new Error("Please enter a valid expiry date (MM/YY)");
        break;
      case "cvv":
        if (!validators.cvv(value)) throw new Error("Please enter a valid CVV");
        break;
      case "postal-code":
        if (!validators.postalCode(value))
          throw new Error("Please enter a valid postal code");
        break;
    }
  } catch (error) {
    isValid = false;
    errorMessage = error.message;
    showError(input, errorMessage);
  }

  return isValid;
}

// Validate entire form
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll("input, textarea, select");
  let isValid = true;

  inputs.forEach((input) => {
    if (!validateInput(input)) {
      isValid = false;
    }
  });

  return isValid;
}

// Update submit button state
function updateSubmitButton(form, submitButton) {
  if (!submitButton) return;

  const inputs = form.querySelectorAll("input, textarea, select");
  let isValid = true;

  inputs.forEach((input) => {
    if (input.required && !validators.required(input.value)) {
      isValid = false;
    }
  });

  submitButton.disabled = !isValid;
}

// Show error message
function showError(input, message) {
  input.classList.add("error");

  let errorElement = input.parentElement.querySelector(".error-message");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.className = "error-message";
    input.parentElement.appendChild(errorElement);
  }

  // Add fade-in animation
  errorElement.style.opacity = "0";
  errorElement.textContent = message;
  setTimeout(() => (errorElement.style.opacity = "1"), 10);
}

// Remove error message
function removeError(input) {
  input.classList.remove("error");
  const errorElement = input.parentElement.querySelector(".error-message");
  if (errorElement) {
    // Add fade-out animation
    errorElement.style.opacity = "0";
    setTimeout(() => errorElement.remove(), 300);
  }
}

// Export functions
window.setupFormValidation = setupFormValidation;
window.validateForm = validateForm;
window.validateInput = validateInput;
