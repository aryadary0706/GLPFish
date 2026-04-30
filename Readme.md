# GLPFish 🐟

> AI-powered marine fish quality control at the receiving point.

A mobile-first React application designed to standardize quality inspection of marine fish using Computer Vision.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [React 18](https://react.dev/) | UI framework |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [Tailwind CSS v3](https://tailwindcss.com/) | Utility-first styling |

---

## Project Structure

```
src/
├── assets/              # Static assets (images, icons)
├── components/
│   ├── layout/          # AppLayout, AuthLayout
│   └── ui/              # Reusable UI components (InputField, Logo, ProtectedRoute)
├── context/
│   └── AuthContext.jsx  # Global auth state & actions
├── hooks/
│   └── useForm.js       # Lightweight form state hook
├── pages/               # One file per route
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   └── NotFoundPage.jsx
├── utils/
│   └── validators.js    # Form validation helpers
├── App.jsx              # Route tree
├── main.jsx             # React entry point
└── index.css            # Tailwind directives + global styles
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your API base URL
```

### 3. Start the dev server
```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Adding a New Feature / Page

1. Create `src/pages/YourPage.jsx`
2. Add a route in `src/App.jsx` inside the protected `<AppLayout>` route block
3. Add a `<NavLink>` in `src/components/layout/AppLayout.jsx`
4. That's it ✅

---

## Connecting a Real Backend

All mock auth logic lives in `src/context/AuthContext.jsx`.  
Look for the `// TODO` comments and replace the `setTimeout` mocks with your real API calls:

```js
// Before (mock)
await new Promise(r => setTimeout(r, 800))

// After (real API)
const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const data = await res.json()
```

---

## Push to GitHub

```bash
# Inside the project folder:
git init
git add .
git commit -m "feat: initial project setup with auth (login & register)"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace the remote URL with your actual GitHub repo URL.

---

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
