# ROVMART SEO + Brand Upgrade

Updated: 2026-09-28
Site base: https://mdparvezmussaruf.github.io/Rovmart2.0

## What changed

- Stronger homepage title/description and canonical URL
- Open Graph + Twitter metadata
- Organization/OnlineStore + WebSite structured data
- Product structured data generated from `products.js`
- Product breadcrumbs and dynamic canonical URLs
- Dedicated About, Contact, Shipping, Returns, Privacy and Terms pages
- Crawlable internal navigation and category links
- Search + category + sort state preserved in the URL
- Mobile bottom navigation
- Improved focus/keyboard accessibility
- Larger image previews and stable image dimensions
- Updated service worker cache version and network-first behavior for JS/config/CSS
- Updated sitemap and robots.txt
- Custom 404 page

## Important

No site can be guaranteed a particular Google ranking position. These changes improve crawlability, page relevance, structured data, internal linking and brand information. Google still determines indexing and ranking based on many signals.

## Google Search Console

1. Open Google Search Console.
2. Add the GitHub Pages site as a URL-prefix property: `https://mdparvezmussaruf.github.io/Rovmart2.0/`
3. Verify ownership using one of Google's offered verification methods.
4. Submit `https://mdparvezmussaruf.github.io/Rovmart2.0/sitemap.xml`.
5. Use URL Inspection for the homepage and several product URLs and request indexing after deployment.

Google states that structured data can help it understand pages and may make them eligible for richer search appearances, but Google does not guarantee those appearances. Product pages are the correct place for Product markup; merchant product markup should describe pages where shoppers can purchase the product.

## Product editing

Edit `products.js` for names, prices, images, descriptions, categories and keywords. The product page SEO metadata and Product JSON-LD are generated from this catalog. If you change a price, also update the authoritative catalog in `google-apps-script/Code.gs`.

## GitHub Pages deployment

Upload the contents of this folder to the `main` branch of the GitHub Pages repository. Keep the repository path as `Rovmart2.0` unless you also change `CONFIG.SITE_URL`, `robots.txt` and `sitemap.xml`.

## First deployment cache reset

After publishing, hard refresh the site. If an old service worker is still active, Chrome DevTools → Application → Service Workers → Unregister, then reload once. The new service worker is `rovmart-v5`.

## Checkout

`config.js` already contains the current Google Apps Script Web App URL from the existing project configuration. If the Apps Script deployment changes, replace only `GOOGLE_SCRIPT_URL` with the new `/exec` URL.
