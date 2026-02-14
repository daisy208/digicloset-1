## How to integrate this Frontend Upgrade Pack (Minimal) into your Digicloset project

1. **Copy files** from this pack into the root of your frontend project (where package.json and src/ live).

2. **Install required dependencies** (if missing):
   ```bash
   npm install --save-dev vite @vitejs/plugin-react tailwindcss postcss autoprefixer
   npm install react react-dom
   ```
   (adjust if you're using yarn or pnpm)

3. **Tailwind setup**: ensure `index.css` imports Tailwind base/utilities/components:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

4. **Build locally**:
   ```bash
   npm run build
   ```
   The production output will be in `dist/`

   ```bash
   ```
   Then open http://localhost:8080

6. **Nginx caching & headers**:
   - The included `nginx.conf` sets long cache headers for static assets and short for index.html.
   - If you serve over HTTPS add HSTS header in nginx.conf

7. **Notes (minimal pack)**:
   - It intentionally excludes optional enterprise add-ons like PWA, Storybook, telemetry, and complex CI/CD.
