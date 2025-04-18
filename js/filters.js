class FilterManager {
  static activeFilters = {
    category: "all",
    priceRange: null,
    sortBy: null,
  };

  static init() {
    this.initializeFilters();
    this.setupFilterListeners();
  }

  static initializeFilters() {
    const sortFilter = document.getElementById("sort-filter");
    const priceFilter = document.getElementById("price-filter");
    const categoryTags = document.querySelectorAll(".category-tag");

    // Initialize category filter
    categoryTags.forEach((tag) => {
      tag.addEventListener("click", () => {
        const category = tag.dataset.category;
        this.activeFilters.category = category;
        this.applyFilters();

        // Update active state
        categoryTags.forEach((t) => t.classList.remove("active"));
        tag.classList.add("active");
      });
    });

    // Initialize sort filter
    if (sortFilter) {
      sortFilter.addEventListener("change", () => {
        this.activeFilters.sortBy = sortFilter.value;
        this.applyFilters();
      });
    }

    // Initialize price filter
    if (priceFilter) {
      priceFilter.addEventListener("change", () => {
        this.activeFilters.priceRange = priceFilter.value;
        this.applyFilters();
      });
    }
  }

  static applyFilters() {
    if (!window.ProductManager?.products) {
      console.error("ProductManager not initialized");
      return;
    }

    try {
      let filteredProducts = [...window.ProductManager.products];

      // Apply category filter
      if (this.activeFilters.category !== "all") {
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.category.toLowerCase() ===
            this.activeFilters.category.toLowerCase()
        );
      }

      // Apply price filter
      if (this.activeFilters.priceRange) {
        const [min, max] = this.activeFilters.priceRange
          .split("-")
          .map((val) => {
            if (val === "+") return Infinity;
            return Number(val);
          });

        filteredProducts = filteredProducts.filter((product) => {
          const price = product.price_usd;
          return price >= min && (max === Infinity ? true : price <= max);
        });
      }

      // Apply sorting
      if (this.activeFilters.sortBy) {
        filteredProducts.sort((a, b) => {
          switch (this.activeFilters.sortBy) {
            case "price-low":
              return a.price_usd - b.price_usd;
            case "price-high":
              return b.price_usd - a.price_usd;
            case "name-asc":
              return a.name.localeCompare(b.name);
            case "name-desc":
              return b.name.localeCompare(a.name);
            default:
              return 0;
          }
        });
      }

      // Update product count
      window.ProductManager.updateProductCount(filteredProducts.length);

      // Update display using ProductManager
      window.ProductManager.filterProducts(
        this.activeFilters.category,
        filteredProducts
      );
    } catch (error) {
      console.error("Error applying filters:", error);
      if (window.showNotification) {
        window.showNotification("Error applying filters", "error");
      }
    }
  }

  static setupFilterListeners() {
    // Handle reset filters
    const resetButton = document.querySelector(".reset-filters");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        this.resetFilters();
      });
    }

    // Add smooth transitions when filters change
    const productsGrid = document.querySelector(".products-grid");
    if (productsGrid) {
      productsGrid.addEventListener("transitionend", (e) => {
        if (e.propertyName === "opacity") {
          productsGrid.classList.remove("filtering");
        }
      });
    }
  }

  static resetFilters() {
    this.activeFilters = {
      category: "all",
      priceRange: null,
      sortBy: null,
    };

    // Reset UI elements
    const sortFilter = document.getElementById("sort-filter");
    const priceFilter = document.getElementById("price-filter");
    const categoryTags = document.querySelectorAll(".category-tag");

    if (sortFilter) sortFilter.selectedIndex = 0;
    if (priceFilter) priceFilter.selectedIndex = 0;

    categoryTags.forEach((tag) => {
      tag.classList.remove("active");
      if (tag.dataset.category === "all") {
        tag.classList.add("active");
      }
    });

    this.applyFilters();
  }
}

// Initialize FilterManager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  FilterManager.init();
});
