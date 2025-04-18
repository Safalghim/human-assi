class RecentProductsManager {
  static init() {
    this.maxRecentProducts = 4;
    this.loadRecentProducts();
  }

  static loadRecentProducts() {
    const recentProducts =
      JSON.parse(localStorage.getItem("recentProducts")) || [];
    const container = document.querySelector(".recent-products");

    if (recentProducts.length > 0) {
      container.innerHTML = `
        <h2>Recently Viewed</h2>
        <div class="recent-products-grid">
          ${recentProducts
            .slice(0, this.maxRecentProducts)
            .map(
              (product) => `
            <div class="recent-product-card">
              <img src="${product.image}" alt="${product.name}" loading="lazy">
              <h3>${product.name}</h3>
              <p class="price">$${product.price.toFixed(2)}</p>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
  }

  static addToRecent(product) {
    let recentProducts =
      JSON.parse(localStorage.getItem("recentProducts")) || [];

    recentProducts = recentProducts.filter((p) => p.id !== product.id);
    recentProducts.unshift(product);
    recentProducts = recentProducts.slice(0, this.maxRecentProducts);

    localStorage.setItem("recentProducts", JSON.stringify(recentProducts));
    this.loadRecentProducts();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  RecentProductsManager.init();
});
