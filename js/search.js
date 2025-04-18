// Advanced search functionality with fuzzy matching and performance optimization
class SearchManager {
  static debounceTimeout;
  static lastQuery = "";

  static init() {
    const searchInput = document.getElementById("search-input");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        if (query === this.lastQuery) return;

        this.lastQuery = query;
        this.performSearch(query);
      }, 300);
    });
  }

  static async performSearch(query) {
    if (!window.ProductManager?.products) {
      console.error("ProductManager not initialized");
      return;
    }

    try {
      let filteredProducts;

      if (!query) {
        // Reset to show all products
        window.ProductManager.filterProducts("all");
        return;
      }

      filteredProducts = window.ProductManager.products.filter((product) => {
        const searchableText =
          `${product.name} ${product.description} ${product.category}`.toLowerCase();
        return searchableText.includes(query);
      });

      // Use the existing filter method to display results
      window.ProductManager.filterProducts("all", filteredProducts);

      // Update UI to show search results count
      const resultsCount = document.querySelector(".results-count");
      if (resultsCount) {
        resultsCount.textContent = `${filteredProducts.length} results found`;
      }
    } catch (error) {
      console.error("Search error:", error);
      if (window.showNotification) {
        window.showNotification("Error performing search", "error");
      }
    }
  }

  static clearSearch() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = "";
      this.lastQuery = "";
      window.ProductManager?.filterProducts("all");
    }
  }
}
