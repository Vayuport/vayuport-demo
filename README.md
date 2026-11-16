# VAYUPORT — Corporate Website

Static, responsive corporate website for VAYUPORT (*Connecting People. Enriching Regions.*).
Plain HTML + CSS + JavaScript, no build step, hosted on Vercel with optional serverless functions in `api/`.

## Structure

```
index.html                         Home — hero image (parallax), 3D eVTOL showcase, about, solutions, applications, why, CTA
about.html                         Company, vision, mission, approach, philosophy, sustainability, Northeast India
solutions.html                     Solutions hub + interactive 11-service explorer + "Coming soon" category
vertiport-infrastructure.html      Category 01 — services 01–05
operations-asset-management.html   Category 02 — services 06–08
aviation-airspace-advisory.html    Category 03 — services 09–11
applications.html                  Six conceptual application segments
careers.html                       "Build for Bharat" — areas of work, openings, application form
contact.html                       Business enquiry form (replaces Early Access)
early-access.html                  Redirect stub → contact.html (old links keep working)
privacy-policy.html                DRAFT — needs legal review
terms-and-conditions.html          DRAFT — needs legal review
404.html                           Themed "page not found" (Vercel serves it automatically)
sitemap.xml, robots.txt, site.webmanifest, vercel.json

assets/css/style.css   All styling (design tokens at the top)
assets/js/site.js      UI layer: splash, navigation, service explorer, scroll effects, enquiry-form extras
assets/js/main.js      Form submission logic — UNCHANGED from the pre-launch build
assets/img/            Logo, hero/poster images, services/ (11), applications/ (6)
assets/3d/             3D eVTOL + vertiport model for the showcase section below the hero
assets/js/evtol-3d.js  Renders that section: fixed camera, not interactive, pauses off-screen
assets/js/vendor/      three.js r147 + GLTFLoader (loaded only on the home page, after first paint)
api/                   Serverless functions — UNCHANGED
docs/                  Testing report and image-generation prompts
```

Script order matters: every page loads `site.js` **before** `main.js`.

## Preview locally

Double-click `index.html` — everything works straight from disk, including the 3D eVTOL
(on `file://` it loads `assets/3d/vayuport-evtol.glb.js`, an embedded copy of the model).
No Python, Node or local server needed. Only the contact/careers forms and Vercel Analytics
need the deployed site, because they talk to the `/api` functions.

## 3D eVTOL section

- Model: `assets/3d/vayuport-evtol.glb` (optimised: meshes merged, meshopt-compressed, WebP textures — 4.2 MB → 0.7 MB).
- Script: `assets/js/evtol-3d.js` — zoom (`ZOOM`) and resolution caps are at the top of the file.
- Libraries: `assets/js/vendor/` (three.js r147, GLTFLoader, meshopt decoder). Loaded only when the section nears the screen.
- If you replace the .glb, regenerate the embedded copy: base64 of the .glb inside `window.VAYUPORT_EVTOL_GLB='...';`.

## Deploying (Vercel — the existing hosting)

1. Push this folder to the Git repository connected to the Vercel project (or run `vercel --prod`).
2. No build command and no output directory are needed — it is a static site. Vercel picks up `api/*.js` as functions.
3. `vercel.json` adds: permanent redirects from `/early-access` and `/early-access.html` to `/contact.html`,
   security headers, and cache rules (images 30 days; CSS/JS 1 day). CSS links carry `?v=7`, JS links `?v=4`;
   bump that number in the HTML when you change those files so visitors get the new version immediately.
4. After deploying, check: a form submission arrives in the inbox, a nonsense URL shows the 404 page,
   and `/early-access.html` redirects.

## Forms

Both forms still submit through `main.js` exactly as before (Web3Forms; the access keys in `main.js` are placeholders — set the real ones).

- **Careers** (`#careers-form`): unchanged fields, Drive-link check via `/api/check-drive`, hCaptcha.
- **Contact** (`#early-access-form` with `data-enquiry-form`): uses the existing Early Access configuration.
  `site.js` validates the extra fields (enquiry category — required; company and project location — optional)
  and adds them to the top of the message that `main.js` sends. The visitor's own text is restored immediately afterwards.

Known limits that come from keeping `main.js` unchanged (each is a small edit if you decide to allow it):
- Contact emails arrive with the subject **"VAYUPORT Early Access — Name"** (`subjectPrefix` in `main.js`).
- Phone validation accepts **Indian numbers only** (`phoneRe` in `main.js` and `api/*.js`).
- The server-side proxy `api/early-access.js` validates name/email/phone/message but not the enquiry category.

## Before going live — checklist

- [ ] Add the real Web3Forms access keys in `assets/js/main.js` (or deploy the `api/` proxy).
- [ ] Have **Privacy Policy** and **Terms & Conditions** reviewed by legal counsel (both are marked as drafts on the page).
- [ ] Confirm the social profile URLs (LinkedIn, Instagram, X) are the official ones.
- [ ] Optionally replace the 11 service illustrations with photography — see `docs/IMAGE-PROMPTS.md`.
- [ ] Add partners to the About page only once agreements are formalised.

## Content rules followed

No addresses, phone numbers, partners, certifications or regulatory approvals are stated. The only contact details
used are `info@vayuport.com` and the existing social links. Every solutions page carries a regulatory note making clear
that approvals are granted only by the competent authorities. Applications are labelled as conceptual, not operational projects.
