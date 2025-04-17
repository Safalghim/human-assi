class FilterManager {
  static init() {
    this.loadCategories();
    this.setupFilterListeners();
  }

  static async loadCategories() {
    try {
      const products = await ProductManager.loadProducts();
      const categories = [
        ...new Set(products.map((product) => product.category)),
      ];
      this.renderFilterGroups(categories);
      this.updateProductCount(products.length);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  static renderFilterGroups(categories) {
    const filterContainer = document.querySelector(".filter-container");

    filterContainer.innerHTML = `
      <div class="filter-group">
        <h3>Categories</h3>
        <ul class="category-filters">
          <li>
            <button class="filter-btn active" data-category="all">
              All Products
            </button>
          </li>
          ${categories
            .map(
              (category) => `
            <li>
              <button class="filter-btn" data-category="${category}">
                ${category}
              </button>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `;
  }

  static updateProductCount(count) {
    const countContainer = document.querySelector(".category-count");
    countContainer.innerHTML = `
      <p>${count} Products Found</p>
    `;
  }

  static setupFilterListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("filter-btn")) {
        const buttons = document.querySelectorAll(".filter-btn");
        buttons.forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");

        const category = e.target.dataset.category;
        ProductManager.filterProducts(category);

        const products =
          category === "all"
            ? ProductManager.products
            : ProductManager.products.filter((p) => p.category === category);
        this.updateProductCount(products.length);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  FilterManager.init();
});
