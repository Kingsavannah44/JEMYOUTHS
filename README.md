# JEM Youths – Birthday Celebrations

A beautiful, faith-based website celebrating the birthdays of JEM Youths members every month.

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## 📦 Deployment to Vercel (Recommended)

This project is set up for **simple static deployment** using esbuild (no complex Vite issues).

### Vercel Settings

When importing the repo on Vercel, use these exact settings:

| Setting              | Value                          |
|----------------------|--------------------------------|
| **Framework Preset** | **Other**                      |
| **Root Directory**   | `.` (leave blank / default)    |
| **Build Command**    | `npm run build`                |
| **Output Directory** | `dist`                         |
| **Install Command**  | `npm install`                  |

### Step-by-step

1. Push your latest changes to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the `JEMYOUTHS` repository.
4. Set the settings as shown in the table above.
5. Click **Deploy**.

Vercel will automatically run the build and host the site.

## 📁 Project Structure

- `Jem.jsx` — Main application (the full beautiful site)
- `index.html` — Static HTML entry point
- `main.js` — React entry point
- `package.json` — Contains the lightweight esbuild build script
- `dist/` — Generated production build (auto-created on deploy)

## ⚠️ Notes

- The `run-app/` folder is an **older Vite-based demo** used during development.  
  It is **not** used for production deployment.
- The current setup uses a simple esbuild build for maximum compatibility with Vercel.

## 🙏 Credits

Made with ❤️ for JEM Youths Ministry.

---

Need help? Feel free to reach out!
