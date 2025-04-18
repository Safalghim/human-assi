// Load product data and handle add to cart functionality
async function loadProductData() {
  try {
    const response = await fetch("/data/products.json");
    const data = await response.json();
    return data.local_products_of_nepal;
  } catch (error) {
    console.error("Error loading product data:", error);
    return [];
  }
}

// Initialize add to cart buttons
async function initializeAddToCartButtons() {
  const products = await loadProductData();
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach((button) => {
    const productCard = button.closest(".product-card");
    const productId = productCard.dataset.productId;
    const product = products.find((p) => p.id === productId);

    if (product) {
      button.addEventListener("click", () => {
        const productToAdd = {
          id: product.id,
          name: product.name,
          price: product.price_usd,
          category: product.category,
          image_url: product.image_url,
        };
        CartManager.addToCart(productToAdd);
      });
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeAddToCartButtons();
  CartManager.updateCartCount();
});
