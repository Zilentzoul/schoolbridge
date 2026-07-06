# SchoolBridge — Parent Portal

A world-class parent–school platform where every interaction (messages, grades,
attendance, assignments, payments, announcements) flows through **one secure
system**. Parents never contact teachers via personal numbers — all
communication is routed and logged by the school.

Built with **React 18 + Vite**, charts by **Recharts**, icons by **lucide-react**.

---

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

## Build

```bash
npm run build      # outputs to /dist
npm run preview    # preview the production build locally
```

---

## Deploy to Netlify

The repo already includes `netlify.toml` with the correct build settings and an
SPA redirect. Two ways to deploy:

### A) Git-based (recommended)

1. Push this folder to a GitHub / GitLab / Bitbucket repo.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Netlify auto-detects the config:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 20 (set in `netlify.toml`)
4. Click **Deploy**. Every push to the main branch redeploys automatically.

### B) Netlify CLI (no Git needed)

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### C) Drag-and-drop

Run `npm run build`, then drag the generated `dist` folder onto
[app.netlify.com/drop](https://app.netlify.com/drop).

---

## Notes for production

This is a front-end prototype with mock data. Before going live you'll want:

- **Backend + database** for real users, wards, grades, and messages
- **Authentication** with role-based access (parent / teacher / admin)
- **Payment gateway** — for Ghana, integrate Paystack or Flutterwave
  (use Netlify Functions or a separate API to keep secret keys off the client)
- **Notifications** — email / SMS / push for new messages and announcements

Netlify Functions (in a `netlify/functions` folder) can host your API endpoints
on the same deploy if you prefer a serverless backend.
