# Baldeep Singh Kwatra portfolio

Static HTML, CSS and JavaScript, published through GitHub Pages at https://bsk.bz.
No frontend framework or production build is required. Preserve the `CNAME` file.

## Local preview

Run `python3 -m http.server 8000` from the repository root and open
http://127.0.0.1:8000/.

## Site files

- `index.html`: content, metadata and structured data.
- `assets/site.css`: responsive layout, device themes and reduced-motion support.
- `assets/site.js`: navigation, interactive diagrams and contact form behavior.
- `assets/contact-config.js`: public Formspree endpoint, never account credentials.
- `assets/baldeep-*.webp`: responsive professional portraits.
- `assets/social-preview.jpg`: social sharing image.
- `assets/Baldeep-Singh-Kwatra-Resume.pdf`: current resume download.

The editable resume and private career references are maintained outside this repository.
Both homepage resume links use the same PDF asset. Verify the exported PDF's text,
links and layout before replacing it.

## Repeatable checks

Run commands from the repository root:

```sh
python3 scripts/validate.py
node --check assets/site.js
python3 scripts/check-links.py
```

Browser checks require a running local preview, Node.js, Playwright, Google Chrome,
and axe-core for accessibility checks. Install development dependencies locally with
`npm install --no-save --package-lock=false playwright axe-core`.
Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright package directory
and `AXE_PATH` to an existing `axe.min.js` file.

```sh
node scripts/browser-qa.cjs
node scripts/theme-qa.cjs
node scripts/accessibility-qa.cjs
node scripts/hero-qa.cjs
node scripts/story-qa.cjs
node scripts/seo-qa.cjs
node scripts/contact-qa.cjs
node scripts/performance-qa.cjs
```

Checks create screenshots and results in ignored `qa/`. Generated results and one-time
migration/design utilities stay local. HTTP link checks may encounter bot protection;
inspect failures before treating them as broken links. Performance checks are local lab
measurements, not production Core Web Vitals.

Contact tests intercept submissions and do not send messages to Formspree. Verify the
recipient, allowed domains, spam filtering and notifications in the Formspree account
before deployment. Browser autofill suppression is a request, not a guarantee.

## Deployment

GitHub Pages serves the site from the configured publishing branch. `_config.yml`
excludes scripts, local QA outputs, this README and the historical page from publication.
Before merging, review desktop/mobile layouts in both themes and run the relevant checks.
After deployment, verify navigation, resume downloads, contact delivery, canonical URL,
and social previews on the live domain. External sites open in new tabs; section links
remain in the current tab.
