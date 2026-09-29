/* ROVMART UI, discovery, SEO metadata and page behavior */
document.addEventListener("DOMContentLoaded", () => {
  cleanCart();
  renderCartUI();
  renderCategoryMenu();
  renderSeoCategoryLinks();
  bindGlobalEvents();
  initSearch();
  initReveal();
  initCursor();

  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("/product.html") || path.endsWith("product.html")) {
    renderProductDetail();
  } else {
    const state = getShopState();
    const input = document.getElementById("productSearch");
    if (input) input.value = state.query;
    const sort = document.getElementById("sortProducts");
    if (sort) sort.value = state.sort;
    renderProductGrid(state.category, state.query, state.sort);
    setActiveCategory(state.category);
    updateSearchMeta();
    updateHomepageMeta();
  }

  registerServiceWorker();
});

function getSiteUrl(path = "") {
  const base = String(CONFIG?.SITE_URL || window.location.origin).replace(/\/$/, "");
  return `${base}/${String(path).replace(/^\//, "")}`;
}

function getRequestedCategory() {
  const category = new URLSearchParams(window.location.search).get("category");
  return getCategories().includes(category) ? category : "All products";
}

function getShopState() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const query = (params.get("q") || "").trim();
  const requestedSort = params.get("sort") || "featured";
  const validCategory = getCategories().includes(category) ? category : "All products";
  const validSort = ["featured", "price-asc", "price-desc", "name-asc"].includes(requestedSort) ? requestedSort : "featured";
  return { category: validCategory, query, sort: validSort };
}

function getCategories() {
  const categories = [...new Set(
    products.filter(product => product.available)
      .map(product => String(product.category || "").trim())
      .filter(Boolean)
  )];
  return ["All products", ...categories];
}

function renderCategoryMenu() {
  const list = document.getElementById("categoryList");
  if (!list) return;
  list.innerHTML = getCategories().map((category, index) => `
    <button type="button" class="category-item" data-category="${escapeHtml(category)}">
      <span class="category-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="category-item-name">${escapeHtml(category)}</span>
      <span class="category-arrow">↗</span>
    </button>`).join("");
}


function renderSeoCategoryLinks() {
  const node = document.getElementById("seoCategoryLinks");
  if (!node) return;
  node.innerHTML = getCategories().filter(category => category !== "All products").map((category, index) => `
    <a href="index.html?category=${encodeURIComponent(category)}#shop">
      <span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(category)}</strong><span>Browse ↗</span>
    </a>`).join("");
}

function setActiveCategory(category) {
  document.querySelectorAll("[data-category]").forEach(button => {
    button.classList.toggle("active", button.dataset.category === category);
  });
}

function getVisibleProducts(category, searchTerm, sort = "featured") {
  const term = String(searchTerm).trim().toLowerCase();
  let visible = products.filter(product => {
    if (!product.available) return false;
    const categoryMatch = category === "All products" || product.category === category;
    const searchMatch = !term || [product.name, product.category, product.description, product.keywords, ...(product.details || [])]
      .join(" ").toLowerCase().includes(term);
    return categoryMatch && searchMatch;
  });
  if (sort === "price-asc") visible.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") visible.sort((a, b) => b.price - a.price);
  if (sort === "name-asc") visible.sort((a, b) => a.name.localeCompare(b.name));
  return visible;
}

function renderProductGrid(category = "All products", searchTerm = "", sort = "featured") {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const visible = getVisibleProducts(category, searchTerm, sort);

  const count = document.getElementById("productCount");
  if (count) count.textContent = `${visible.length} piece${visible.length === 1 ? "" : "s"}`;

  if (!visible.length) {
    grid.innerHTML = `
      <div class="empty-results">
        <p class="eyebrow">NO MATCH</p>
        <h3>Nothing found.</h3>
        <p>Try another search, category or sort option.</p>
        <button class="button button-dark" type="button" id="clearFiltersBtn">Show all products</button>
      </div>`;
    document.getElementById("clearFiltersBtn")?.addEventListener("click", () => resetShopState());
    return;
  }

  grid.innerHTML = visible.map((product, index) => {
    const discount = product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
    return `
      <article class="product-card reveal" style="--delay:${Math.min(index, 5) * 55}ms">
        <div class="product-media zoom-image" data-zoom>
          <a href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${escapeHtml(product.name)}">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)} — ${escapeHtml(product.category)}" width="800" height="1000" loading="lazy" decoding="async">
          </a>
          ${discount ? `<span class="sale-badge">-${discount}%</span>` : ""}
        </div>
        <div class="product-card-body">
          <p class="product-category">${escapeHtml(product.category)}</p>
          <h3 class="product-name"><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
          <div class="product-price-row"><strong>${formatBDT(product.price)}</strong>${product.oldPrice ? `<del>${formatBDT(product.oldPrice)}</del>` : ""}</div>
          <button type="button" class="button button-dark full" data-add="${escapeHtml(product.id)}">Add to cart</button>
        </div>
      </article>`;
  }).join("");

  setupZoomImages();
  initReveal();
}

function filterByCategory(category) {
  if (!getCategories().includes(category)) return;
  closeCategoryMenu();

  const isProductPage = window.location.pathname.toLowerCase().endsWith("product.html");
  if (isProductPage) {
    const params = new URLSearchParams();
    if (category !== "All products") params.set("category", category);
    window.location.href = `index.html${params.toString() ? `?${params.toString()}` : ""}#shop`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (category === "All products") params.delete("category");
  else params.set("category", category);
  params.delete("q");
  const queryString = params.toString();
  window.history.pushState({}, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}#shop`);

  const input = document.getElementById("productSearch");
  if (input) input.value = "";
  const state = getShopState();
  renderProductGrid(state.category, "", state.sort);
  setActiveCategory(state.category);
  updateSearchMeta();
  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProductDetail() {
  const container = document.getElementById("productDetail");
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get("id");
  const product = products.find(item => item.id === id && item.available);

  if (!product) {
    document.title = "Product not found — ROVMART";
    setMeta("robots", "noindex,follow");
    container.innerHTML = `<div class="not-found"><p class="eyebrow">404 / PRODUCT</p><h1>Piece not found.</h1><p>The product may have been removed or is currently unavailable.</p><a class="button button-dark" href="index.html#shop">Back to collection</a></div>`;
    return;
  }

  const productUrl = `${getSiteUrl("product.html")}?id=${encodeURIComponent(product.id)}`;
  const imageUrl = toAbsoluteUrl(product.image);
  const discount = product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  document.title = `${product.name} — ROVMART`;
  setMeta("description", `${product.name} from ROVMART. ${product.description}`);
  setMeta("robots", "index,follow,max-image-preview:large");
  setLinkCanonical(productUrl);
  setMetaProperty("og:type", "product");
  setMetaProperty("og:title", `${product.name} — ROVMART`);
  setMetaProperty("og:description", product.description);
  setMetaProperty("og:url", productUrl);
  setMetaProperty("og:image", imageUrl);
  setMetaProperty("og:site_name", "ROVMART");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", `${product.name} — ROVMART`);
  setMeta("twitter:description", product.description);
  setMeta("twitter:image", imageUrl);

  container.innerHTML = `
    <div class="detail-media zoom-image" data-zoom>
      <img id="detailImage" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)} — ${escapeHtml(product.category)}" width="1000" height="1250" loading="eager" decoding="async">
      <div class="zoom-hint">Move to zoom</div>
    </div>
    <div class="detail-copy">
      <div class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="index.html#shop">Shop</a><span>/</span><a href="index.html?category=${encodeURIComponent(product.category)}#shop">${escapeHtml(product.category)}</a><span>/</span><span>${escapeHtml(product.name)}</span></div>
      <p class="product-category">${escapeHtml(product.category)}</p>
      <h1>${escapeHtml(product.name)}</h1>
      <div class="detail-price-row"><strong>${formatBDT(product.price)}</strong>${product.oldPrice ? `<del>${formatBDT(product.oldPrice)}</del>` : ""}${discount ? `<span class="discount-pill">-${discount}%</span>` : ""}</div>
      <p class="detail-description">${escapeHtml(product.description)}</p>
      <div class="detail-block"><div class="detail-block-head"><span>Details</span><span>ROVMART / ${escapeHtml(product.id)}</span></div><ul class="detail-list">${product.details.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
      <div class="detail-actions"><div class="quantity-control large" aria-label="Select quantity"><button type="button" id="detailMinus" aria-label="Decrease quantity">−</button><span id="detailQuantity">1</span><button type="button" id="detailPlus" aria-label="Increase quantity">+</button></div><button type="button" class="button button-dark" id="detailAddBtn">Add to cart</button></div>
      <p class="detail-note">Cash on delivery · Inside Dhaka ৳50 · Outside Dhaka ৳100</p>
    </div>`;

  setProductStructuredData(product, productUrl, imageUrl);

  let quantity = 1;
  const quantityNode = document.getElementById("detailQuantity");
  document.getElementById("detailMinus")?.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1); quantityNode.textContent = String(quantity);
  });
  document.getElementById("detailPlus")?.addEventListener("click", () => {
    quantity = Math.min(Number(CONFIG?.MAX_CART_QUANTITY) || 99, quantity + 1); quantityNode.textContent = String(quantity);
  });
  document.getElementById("detailAddBtn")?.addEventListener("click", () => addToCart(product.id, quantity));

  setupZoomImages();
  initReveal();
}

function setProductStructuredData(product, productUrl, imageUrl) {
  document.getElementById("productStructuredData")?.remove();
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": [imageUrl],
    "sku": product.sku || product.id,
    "brand": { "@type": "Brand", "name": product.brand || "ROVMART" },
    "category": product.category,
    "keywords": product.keywords,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "BDT",
      "price": String(product.price),
      "availability": product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": getSiteUrl() },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": getSiteUrl("#shop") },
      { "@type": "ListItem", "position": 3, "name": product.category, "item": `${getSiteUrl("index.html")}?category=${encodeURIComponent(product.category)}#shop` },
      { "@type": "ListItem", "position": 4, "name": product.name, "item": productUrl }
    ]
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "productStructuredData";
  script.textContent = JSON.stringify({ "@graph": [data, breadcrumb] });
  document.head.appendChild(script);
}

function toAbsoluteUrl(path) {
  try { return new URL(path, getSiteUrl()).href; } catch (_) { return path; }
}

function setupZoomImages() {
  document.querySelectorAll("[data-zoom]").forEach(wrapper => {
    if (wrapper.dataset.zoomReady === "true") return;
    const img = wrapper.querySelector("img");
    if (!img) return;
    const move = event => {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const rect = wrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
      img.style.transform = "scale(1.62)";
      wrapper.classList.add("is-zoomed");
    };
    const reset = () => { img.style.transform = ""; img.style.transformOrigin = ""; wrapper.classList.remove("is-zoomed"); };
    wrapper.addEventListener("pointermove", move);
    wrapper.addEventListener("pointerleave", reset);
    wrapper.dataset.zoomReady = "true";
  });
}

function bindGlobalEvents() {
  document.getElementById("menuToggle")?.addEventListener("click", toggleCategoryMenu);
  document.getElementById("closeMenuBtn")?.addEventListener("click", closeCategoryMenu);
  document.getElementById("categoryOverlay")?.addEventListener("click", closeCategoryMenu);

  document.getElementById("categoryList")?.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    filterByCategory(button.dataset.category);
  });

  document.addEventListener("click", event => {
    const add = event.target.closest("[data-add]"); if (add) addToCart(add.dataset.add);
    const plus = event.target.closest("[data-cart-plus]"); if (plus) { const item = getCart().find(entry => entry.id === plus.dataset.cartPlus); if (item) updateCartQuantity(item.id, item.quantity + 1); }
    const minus = event.target.closest("[data-cart-minus]"); if (minus) { const item = getCart().find(entry => entry.id === minus.dataset.cartMinus); if (item) updateCartQuantity(item.id, item.quantity - 1); }
    const remove = event.target.closest("[data-cart-remove]"); if (remove) removeFromCart(remove.dataset.cartRemove);
  });

  document.getElementById("cartLink")?.addEventListener("click", openCartDrawer);
  document.getElementById("closeCartBtn")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cartDrawer")?.addEventListener("click", event => { if (event.target.id === "cartDrawer") closeCartDrawer(); });
  document.getElementById("confirmOrderBtn")?.addEventListener("click", openOrderModal);
  document.getElementById("drawerConfirmBtn")?.addEventListener("click", () => { closeCartDrawer(); openOrderModal(); });
  document.getElementById("sortProducts")?.addEventListener("change", event => updateShopUrl({ sort: event.target.value }));

  window.addEventListener("popstate", () => {
    const state = getShopState();
    const input = document.getElementById("productSearch"); if (input) input.value = state.query;
    const sort = document.getElementById("sortProducts"); if (sort) sort.value = state.sort;
    if (document.getElementById("productGrid")) renderProductGrid(state.category, state.query, state.sort);
    setActiveCategory(state.category); updateSearchMeta();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeCategoryMenu(); closeCartDrawer(); closeOrderModal(); }
  });
}

function toggleCategoryMenu() {
  const menu = document.getElementById("categoryMenu"); const overlay = document.getElementById("categoryOverlay"); if (!menu || !overlay) return;
  const open = !menu.classList.contains("open"); menu.classList.toggle("open", open); overlay.classList.toggle("hidden", !open); menu.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("no-scroll", open); document.getElementById("menuToggle")?.setAttribute("aria-expanded", String(open));
}
function closeCategoryMenu() { const menu = document.getElementById("categoryMenu"); const overlay = document.getElementById("categoryOverlay"); if (!menu || !overlay) return; menu.classList.remove("open"); overlay.classList.add("hidden"); menu.setAttribute("aria-hidden", "true"); document.body.classList.remove("no-scroll"); document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false"); }
function openCartDrawer() { renderCartUI(); const drawer = document.getElementById("cartDrawer"); if (!drawer) return; drawer.classList.remove("hidden"); drawer.setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll"); }
function closeCartDrawer() { const drawer = document.getElementById("cartDrawer"); if (!drawer) return; drawer.classList.add("hidden"); drawer.setAttribute("aria-hidden", "true"); document.body.classList.remove("no-scroll"); }
function showToast(message) { let toast = document.getElementById("toast"); if (!toast) { toast = document.createElement("div"); toast.id = "toast"; toast.className = "toast"; document.body.appendChild(toast); } toast.textContent = message; toast.classList.add("show"); window.clearTimeout(window.toastTimer); window.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1900); }

function initSearch() {
  const input = document.getElementById("productSearch"); if (!input) return;
  input.addEventListener("input", () => updateShopUrl({ q: input.value.trim() }));
  document.getElementById("clearSearchBtn")?.addEventListener("click", () => { input.value = ""; updateShopUrl({ q: "" }); input.focus(); });
}

function updateShopUrl(changes = {}) {
  const state = getShopState();
  const next = { category: changes.category ?? state.category, q: changes.q ?? state.query, sort: changes.sort ?? state.sort };
  const params = new URLSearchParams();
  if (next.category !== "All products") params.set("category", next.category);
  if (next.q) params.set("q", next.q);
  if (next.sort !== "featured") params.set("sort", next.sort);
  const currentBase = window.location.pathname.split("/").pop() || "index.html";
  window.history.replaceState({}, "", `${currentBase}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash || ""}`);
  renderProductGrid(next.category, next.q, next.sort); setActiveCategory(next.category); updateSearchMeta();
}

function resetShopState() {
  const input = document.getElementById("productSearch"); if (input) input.value = "";
  const sort = document.getElementById("sortProducts"); if (sort) sort.value = "featured";
  window.history.replaceState({}, "", `${window.location.pathname}#shop`);
  renderProductGrid("All products", "", "featured"); setActiveCategory("All products"); updateSearchMeta();
}

function updateSearchMeta() { const meta = document.getElementById("searchMeta"); const input = document.getElementById("productSearch"); const value = input?.value.trim() || ""; if (meta) meta.textContent = value ? `Searching for “${value}”` : "Browse the collection"; }
function initReveal() { const items = document.querySelectorAll(".reveal:not(.is-visible)"); if (!items.length) return; if (!("IntersectionObserver" in window)) { items.forEach(item => item.classList.add("is-visible")); return; } const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .08 }); items.forEach(item => observer.observe(item)); }
function initCursor() { const dot = document.getElementById("cursorDot"); if (!dot || window.matchMedia("(pointer: coarse)").matches) return; document.addEventListener("pointermove", event => { dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`; }); document.addEventListener("pointerover", event => dot.classList.toggle("cursor-active", Boolean(event.target.closest("a,button,.zoom-image")))); }
function registerServiceWorker() { if (!("serviceWorker" in navigator)) return; navigator.serviceWorker.register("service-worker.js?v=20260928").catch(() => {}); }
function updateHomepageMeta() { setMetaProperty("og:type", "website"); setMetaProperty("og:url", getSiteUrl()); setMetaProperty("og:image", CONFIG?.OG_IMAGE || getSiteUrl("assets/og-image.svg")); }
function setLinkCanonical(url) { let link = document.querySelector('link[rel="canonical"]'); if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); } link.href = url; }
function setMeta(name, content) { let el = document.querySelector(`meta[name="${cssEscape(name)}"]`); if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); } el.setAttribute("content", content); }
function setMetaProperty(property, content) { let el = document.querySelector(`meta[property="${cssEscape(property)}"]`); if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); } el.setAttribute("content", content); }
function cssEscape(value) { return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }
function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
