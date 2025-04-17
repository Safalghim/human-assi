// Form validation utilities
const validators = {
  required: (value) => value.trim() !== "",
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  minLength: (value, length) => value.length >= length,
  maxLength: (value, length) => value.length <= length,
  phone: (value) => /^\+?[\d\s-]{10,}$/.test(value),
  postalCode: (value) => /^[A-Z0-9\s-]{3,}$/i.test(value),
  cardNumber: (value) => /^[\d\s]{16,19}$/.test(value.replace(/\s/g, "")),
  expiry: (value) => {
    const [month, year] = value.split("/");
    if (!month || !year) return false;

    const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    return expDate > today;
  },
  cvv: (value) => /^\d{3,4}$/.test(value),
};

// Add validation to form inputs
function setupFormValidation(formElement) {
  const inputs = formElement.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateInput(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("error")) {
        validateInput(input);
      }
    });
  });
}

// Validate a single input
function validateInput(input) {
  const value = input.value;
  let isValid = true;
  let errorMessage = "";

  // Clear existing error
  removeError(input);

  // Required field validation
  if (input.required && !validators.required(value)) {
    isValid = false;
    errorMessage = "This field is required";
  }

  // Email validation
  if (isValid && input.type === "email" && !validators.email(value)) {
    isValid = false;
    errorMessage = "Please enter a valid email address";
  }

  // Phone validation
  if (isValid && input.type === "tel" && !validators.phone(value)) {
    isValid = false;
    errorMessage = "Please enter a valid phone number";
  }

  // Card number validation
  if (isValid && input.id === "card-number" && !validators.cardNumber(value)) {
    isValid = false;
    errorMessage = "Please enter a valid card number";
  }

  // Expiry date validation
  if (isValid && input.id === "expiry" && !validators.expiry(value)) {
    isValid = false;
    errorMessage = "Please enter a valid expiry date";
  }

  // CVV validation
  if (isValid && input.id === "cvv" && !validators.cvv(value)) {
    isValid = false;
    errorMessage = "Please enter a valid CVV";
  }

  // Password validation
  if (isValid && input.type === "password" && input.id === "password") {
    if (!validators.minLength(value, 8)) {
      isValid = false;
      errorMessage = "Password must be at least 8 characters long";
    }
  }

  // Confirm password validation
  if (isValid && input.id === "confirm-password") {
    const password = document.getElementById("password");
    if (password && value !== password.value) {
      isValid = false;
      errorMessage = "Passwords do not match";
    }
  }

  if (!isValid) {
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

// Show error message
function showError(input, message) {
  input.classList.add("error");

  // Create error message element if it doesn't exist
  let errorElement = input.parentElement.querySelector(".error-message");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.className = "error-message";
    input.parentElement.appendChild(errorElement);
  }
  errorElement.textContent = message;
}

// Remove error message
function removeError(input) {
  input.classList.remove("error");
  const errorElement = input.parentElement.querySelector(".error-message");
  if (errorElement) {
    errorElement.remove();
  }
}

// Export functions
window.setupFormValidation = setupFormValidation;
window.validateForm = validateForm;
window.validateInput = validateInput;
