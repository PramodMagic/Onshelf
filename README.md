# Onshelf Bin Tool

Mobile se bin + product scan, computer par data, date-wise Excel export.

## Files
- `index.html` — poora app (mobile + computer)
- `api/saves.js`, `api/draft.js`, `api/_lib.js` — Vercel backend
- `package.json` — dependency (`@upstash/redis`)

## Deploy (GitHub + Vercel)
1. GitHub par naya repo banao aur ye saari files upload/push karo (root mein `index.html`, `api/`, `package.json`).
2. vercel.com → **Add New → Project** → apna GitHub repo import karo → **Deploy** (koi setting badalni nahi).
3. Vercel project → **Storage** tab → **Create Database / Marketplace → Upstash Redis** (free plan) → project se **Connect** karo.
   Ye khud `KV_REST_API_URL` aur `KV_REST_API_TOKEN` environment variables laga deta hai.
4. Project → **Settings → Environment Variables** → naya variable: `APP_PIN` = aapka PIN (jaise 4829). Isi PIN se app khulega.
5. **Deployments → Redeploy** karo (taaki naye variables lag jayein).
6. Mobile aur laptop dono par Vercel ka link kholo, PIN daalo. Mobile par “Add to Home Screen” kar sakte ho.

## Data kahan rehta hai
Saved bins Upstash Redis mein rehti hain (refresh/phone change par bhi). Date-wise Excel app se download hoti hai.

## Free rehne ke liye
- Upstash database banate waqt **Free plan** hi chuno (Pay as You Go nahi). Free plan mein 500K commands/month aur 256 MB milta hai.
- Vercel **Hobby** plan free hai, lekin sirf personal / non-commercial use ke liye.
- Computer ka Data tab har 30 second mein khud refresh hota hai (aur 🔄 button se turant), taaki free command limit na bhare.
