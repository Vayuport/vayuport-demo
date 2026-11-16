# VAYUPORT — Testing report

Tested 15 Nov 2026 in headless Chromium (Playwright) against a local static server.
Not deployed: hosting-specific behaviour (Vercel redirects, headers, 404 routing, analytics, live Web3Forms delivery,
hCaptcha) must be confirmed after deployment. Safari and Firefox were not tested.

## Summary

| Area | Result |
|---|---|
| Horizontal overflow — 12 pages × 10 widths (1920, 1440, 1366, 1280, 1024, 820, 768, 430, 390, 360) | 0 issues in 120 page loads |
| Browser console errors (same 120 loads) | 0 (external services blocked offline are excluded) |
| Internal links, image/video sources, srcsets, in-page anchors — all 13 HTML files | All resolve |
| One `<h1>` per page, unique IDs, `alt` on every image | Pass (redirect stub intentionally has no heading) |
| `main.js` and `api/*.js` | Byte-for-byte identical to the original ZIP |

## Splash screen
- Ring → mark → wordmark assembly, then the mark flies into the nav logo position (frames checked at 0.5–3.6 s). Pass.
- Plays once per browser session; skippable with click / Esc / Enter / Space. Pass.
- Disabled for `prefers-reduced-motion`. Pass.
- Cannot block the page: CSS removes it after 6 s even if JavaScript fails. Pass.

## Navigation
- Desktop mega-menu opens on hover and click; closes on mouse-leave, outside click and Esc (focus returns to trigger). Pass.
- Keyboard: Enter/↓ opens; Tab moves trigger → mega links → next nav item and closes the menu. Pass (fixed during testing).
- Mobile/tablet (< 1080 px): hamburger menu, Solutions submenu expands, menu closes after choosing a link, body scroll locked while open. Pass.
- Active page indicator on every page (including category pages → "Our Solutions", Contact → highlighted button). Pass.
- Category sub-navigation highlights and scrolls to the current service. Pass (fixed during testing).

## Service explorer (solutions.html)
- Desktop hover: skeleton shimmer shown while loading (verified with a throttled request), then fade/zoom to image. Pass.
- All 11 services show their own image, number, category, title and description. Pass.
- Clicking a service opens the correct `category-page.html#service-NN`. Pass.
- Touch/tablet/mobile: tap-to-expand accordion, image loads on expand, nothing hover-only. Pass.
- Failed image → branded fallback panel (explorer and detail pages). Pass.

## Forms (Web3Forms endpoint intercepted — nothing sent to the real service)
- Contact, empty submit: all 7 required fields flagged, nothing sent. Pass.
- Contact, missing category only: blocked, category flagged. Pass.
- Contact, invalid phone: blocked by `main.js`; visitor's message text restored unchanged. Pass.
- Contact, valid: one request sent; message contains category, company and location followed by the visitor's text; success panel shown. Pass.
- `?enquiry=partnership` (Partner With Us) preselects the category. Pass.
- Careers, empty submit: all fields plus captcha flagged; non-Drive resume link rejected with the existing message. Pass.
- `early-access.html` redirects to `contact.html`. Pass.

## Robustness
- `site.js` blocked: all content visible within 3 s, no splash. Pass.
- `main.js` blocked: pages fully usable (forms cannot submit, as expected). Pass.
- Reduced motion: no splash, no parallax, all content visible immediately. Pass.
- JavaScript disabled: content, images and explorer panels all visible. Pass.

## Performance (home page, first load)
- Desktop: 16 requests, ~2.3 MB of which ~2.0 MB is the hero video (loaded after the poster image).
- Mobile: 14 requests, ~1.0 MB; receives the 0.67 MB mobile video.
- Data-saver or reduced-motion visitors get the still poster instead of the video.
- All content images are WebP with 800 w / 1600 w variants, lazy-loaded, with reserved dimensions (no layout shift).
- A Lighthouse audit was not run.

## Not verified here — check after deployment
- Live form delivery (requires real Web3Forms keys in `main.js`), hCaptcha widget, `/api/check-drive`.
- Vercel redirects, headers and automatic 404 page.
- Safari (iOS/macOS) and Firefox rendering.
- Social-preview cards (use LinkedIn Post Inspector / X card preview once live).
