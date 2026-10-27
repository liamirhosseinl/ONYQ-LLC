import "./globals.css";

// Fallback for requests that never reach a locale (e.g. unknown files). Localised 404s are
// rendered by app/[locale]/not-found.tsx.
export default function GlobalNotFound() {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <main className="not-found wrap">
          <p className="eyebrow eyebrow--muted">Error 404</p>
          <h1 className="t-h1">This page doesn’t exist.</h1>
          <p className="t-lead">
            <a className="link-underline" href="/">
              Back to ONYQ home
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
