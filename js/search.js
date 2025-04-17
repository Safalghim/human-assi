// Advanced search functionality with fuzzy matching and performance optimization
let searchTimeout = null;
const DEBOUNCE_DELAY = 300;
const MIN_QUERY_LENGTH = 2;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

document.addEventListener("DOMContentLoaded", () => {
  initializeSearch();
});

function initializeSearch() {
  const searchInput = document.querySelector(".search-bar input");
  const searchResults = document.getElementById("search-results");

  if (!searchInput || !searchResults) return;

  // Initialize search index
  initializeSearchIndex();

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length === 0) {
      clearSearch(searchInput, searchResults);
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      showMinQueryMessage(searchResults);
      return;
    }

    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_DELAY);
  });

  // Clear search on escape key
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearSearch(searchInput, searchResults);
    }
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = "none";
    }
  });
}

async function initializeSearchIndex() {
  try {
    const cached = getStorageItem("productsCache");
    const now = Date.now();
    let products = [];

    if (cached) {
      const { data, timestamp } = cached;
      if (now - timestamp < CACHE_DURATION) {
        products = data;
      }
    }

    if (products.length === 0) {
      const response = await fetch("products.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      products = await response.json();

      // Cache the products with timestamp
      setStorageItem("productsCache", {
        data: products,
        timestamp: now,
      });
    }

    // Create search index
    window.searchIndex = products.map((product) => ({
      ...product,
      searchText: `${product.name} ${product.category} ${
        product.description || ""
      }`.toLowerCase(),
    }));
  } catch (error) {
    console.error("Error initializing search index:", error);
    showErrorMessage(document.getElementById("search-results"));
  }
}

// Safe storage operations
function getStorageItem(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return null;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
    // Handle quota exceeded error
    if (error.name === "QuotaExceededError") {
      clearOldCache();
    }
    return false;
  }
}

function clearOldCache() {
  try {
    const cacheKeys = Object.keys(localStorage).filter((key) =>
      key.endsWith("Cache")
    );
    const now = Date.now();

    cacheKeys.forEach((key) => {
      const data = getStorageItem(key);
      if (data && now - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing old cache:", error);
  }
}

function clearSearch(input, results) {
  input.value = "";
  results.style.display = "none";
  if (window.applyFilters) {
    window.applyFilters();
  }
}

async function performSearch(query) {
  const searchResults = document.getElementById("search-results");

  if (!query) {
    searchResults.style.display = "none";
    if (window.applyFilters) {
      window.applyFilters();
    }
    return;
  }

  try {
    if (!window.searchIndex) {
      await initializeSearchIndex();
    }

    const results = searchProducts(query.toLowerCase());
    displaySearchResults(results, query);
  } catch (error) {
    console.error("Error performing search:", error);
    showErrorMessage(searchResults);
  }
}

function searchProducts(query) {
  // Split query into words for better matching
  const queryWords = query.split(/\s+/).filter((word) => word.length > 0);

  return window.searchIndex
    .map((product) => {
      const score = calculateSearchScore(product, queryWords);
      return { ...product, score };
    })
    .filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Limit to top 10 results for performance
}

function calculateSearchScore(product, queryWords) {
  let score = 0;

  for (const word of queryWords) {
    // Exact matches in name
    if (product.name.toLowerCase().includes(word)) {
      score += 10;
    }
    // Exact matches in category
    if (product.category.toLowerCase().includes(word)) {
      score += 5;
    }
    // Fuzzy matches
    if (calculateLevenshteinDistance(word, product.name.toLowerCase()) <= 2) {
      score += 3;
    }
    // Description matches
    if (
      product.description &&
      product.description.toLowerCase().includes(word)
    ) {
      score += 2;
    }
  }

  return score;
}

function calculateLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1)
    .fill()
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

function displaySearchResults(results, query) {
  const searchResults = document.getElementById("search-results");

  if (results.length === 0) {
    showNoResults(searchResults, query);
    return;
  }

  searchResults.innerHTML = generateSearchResultsHTML(results, query);
  searchResults.style.display = "block";
  attachSearchResultListeners();
}

function generateSearchResultsHTML(results, query) {
  return `
    <div class="search-results-header">
      <h3>Search Results (${results.length})</h3>
      <button class="close-search" aria-label="Close search results">×</button>
    </div>
    <div class="search-results-grid">
      ${results.map((product) => generateProductHTML(product, query)).join("")}
    </div>
  `;
}

function generateProductHTML(product, query) {
  return `
    <div class="search-result-item" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div class="search-result-details">
        <h4>${highlightMatch(product.name, query)}</h4>
        <p class="price">£${product.price.toFixed(2)}</p>
        <p class="category">${highlightMatch(product.category, query)}</p>
        ${
          product.description
            ? `<p class="description">${highlightMatch(
                truncateText(product.description, 100),
                query
              )}</p>`
            : ""
        }
      </div>
      <button class="add-to-cart" data-id="${product.id}" aria-label="Add ${
    product.name
  } to cart">
        <i class="fas fa-shopping-cart"></i>
      </button>
    </div>
  `;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);

  const words = query.split(/\s+/).filter((word) => word.length > 0);
  let highlightedText = escapeHtml(text);

  words.forEach((word) => {
    const regex = new RegExp(`(${escapeRegExp(word)})`, "gi");
    highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
  });

  return highlightedText;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function showNoResults(container, query) {
  container.innerHTML = `
    <div class="no-results">
      <p>No products found matching "${escapeHtml(query)}"</p>
      <p>Try using different keywords or check for typos</p>
    </div>
  `;
  container.style.display = "block";
}

function showErrorMessage(container) {
  container.innerHTML = `
    <div class="search-error">
      <p>An error occurred while searching. Please try again.</p>
    </div>
  `;
  container.style.display = "block";
}

function showMinQueryMessage(container) {
  container.innerHTML = `
    <div class="search-message">
      <p>Please enter at least ${MIN_QUERY_LENGTH} characters to search</p>
    </div>
  `;
  container.style.display = "block";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function attachSearchResultListeners() {
  const searchResults = document.getElementById("search-results");

  // Close button
  const closeButton = searchResults.querySelector(".close-search");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      searchResults.style.display = "none";
    });
  }

  // Add to cart buttons
  const addToCartButtons = searchResults.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", handleAddToCart);
  });

  // Product click navigation
  const productItems = searchResults.querySelectorAll(".search-result-item");
  productItems.forEach((item) => {
    item.addEventListener("click", handleProductClick);
  });
}

function handleAddToCart(e) {
  e.preventDefault();
  e.stopPropagation();

  const button = e.target.closest(".add-to-cart");
  const productId = button.dataset.id;

  try {
    const { data } = JSON.parse(localStorage.getItem("productsCache"));
    const product = data.find((p) => p.id === productId);

    if (product && window.addToCart) {
      window.addToCart(product);
      showAddToCartAnimation(button);
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
  }
}

function showAddToCartAnimation(button) {
  button.classList.add("added");
  button.setAttribute("disabled", "true");

  setTimeout(() => {
    button.classList.remove("added");
    button.removeAttribute("disabled");
  }, 1000);
}

function handleProductClick(e) {
  if (!e.target.closest(".add-to-cart")) {
    const productId = e.currentTarget.dataset.productId;
    window.location.href = `product.html?id=${productId}`;
  }
}

// Expose necessary functions for other modules
window.performSearch = performSearch;
