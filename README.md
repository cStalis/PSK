# Precision Shooting Pétanque

Mobile-first static scorecard for pétanque precision shooting competitions.

## Required software

To install dependencies, run the development server, execute tests, or create a production build locally, install:

- **Node.js 22 LTS or newer** — includes the `npm` package manager.
- **Git** — required to clone and update the repository.
- A modern browser — Chrome, Edge, Firefox, or Safari for running the app.

The application has no backend, database server, or runtime service dependency. After building, the `dist/` directory contains static files that can be served by any static web host.

Check the installed versions with:

```bash
node --version
npm --version
git --version
```

Node.js and npm are provided automatically by the GitHub Actions workflow, so no software installation is required on the GitHub-hosted runner.

## Local development

Clone the repository and install the JavaScript dependencies:

```bash
git clone <repository-url>
cd boule
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Verification

```bash
npm test
npm run lint
npm run build
```

The production output is written to `dist/` and can be hosted by any static web server.

To preview the production build locally:

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` tests and builds the app, then deploys `dist/` to GitHub Pages whenever `main` is updated.

In the repository settings, configure **Pages → Source** as **GitHub Actions**. The workflow supplies the repository base path during the build, so project Pages URLs work without additional configuration.

Scorecards are stored in the browser's local storage. They do not synchronize between browsers or devices.
