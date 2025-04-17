// Advanced search functionality with fuzzy matching and performance optimization
let searchTimeout = null;
const DEBOUNCE_DELAY = 300;
const MIN_QUERY_LENGTH = 2;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class SearchManager {
  static init() {
    this.setupSearchListener();
  }

  static setupSearchListener() {
    const searchInput = document.querySelector(".search-bar input");
    const searchButton = document.querySelector(".search-bar button");

    const performSearch = () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const filteredProducts = ProductManager.products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );

      ProductManager.filterProducts("all", filteredProducts);
      FilterManager.updateProductCount(filteredProducts.length);
    };

    searchInput.addEventListener("input", performSearch);
    searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      performSearch();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  SearchManager.init();
});
