# 🚀 Still With You — Deployment Guide (Render + MongoDB Atlas)

This guide deploys the full stack:
- **Frontend** → Render Web Service (Docker/Nginx)
- **Backend** → Render Web Service (Docker/Node.js)
- **Database** → MongoDB Atlas (free cloud DB)

---

## Step 1 — Create a Free MongoDB Atlas Database

> This takes about 3 minutes. You get a free 512 MB cluster, no credit card needed.

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account (or sign in with Google).
2. Click **"Build a Database"** → choose **M0 FREE** → Select any region (e.g., AWS / Singapore) → click **Create**.
3. **Username & Password** — Create a database user:
   - Username: `swuadmin`
   - Password: Choose a strong password, copy it somewhere safe.
   - Click **Create User**.
4. **Network Access** — When asked "Where would you like to connect from?":
   - Click **"Add My Current IP Address"** (for testing) then also add `0.0.0.0/0` (Allow from anywhere) so Render can connect.
   - Click **Finish and Close**.
5. Go to **Database** → click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://swuadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password and add the DB name:
   ```
   mongodb+srv://swuadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/stillwithyou?retryWrites=true&w=majority
   ```
   **Save this URI — you'll need it in Step 3.**

---

## Step 2 — Push Code to GitHub

Make sure all the latest changes are pushed:

```bash
# From the project root (d:\stillwithyou)
git add .
git commit -m "Add Render deployment files"
git push origin main
```

---

## Step 3 — Deploy Backend on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repo: **`Evansharol/swu_demo`** → click **Connect**.
4. Fill in the settings:
   | Field | Value |
   |---|---|
   | Name | `swu-backend` |
   | Region | Singapore (or closest to you) |
   | Branch | `main` |
   | Root Directory | `backend` |
   | Runtime | **Docker** |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | **Free** |
5. Scroll down to **Environment Variables** and add these:

   | Key | Value |
   |---|---|
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | _(your Atlas URI from Step 1)_ |
   | `JWT_SECRET` | _(any long random string, e.g. `swu_super_secret_key_2024_xyz`)_ |
   | `EMAIL_USER` | `evanzzsharol@gmail.com` |
   | `EMAIL_PASS` | `nbjo rire apda pypt` |

6. Click **"Create Web Service"** → wait for the build to finish (3–5 minutes).
7. Once deployed, your backend URL will be:
   ```
   https://swu-backend.onrender.com
   ```
   ✅ Test it: visit `https://swu-backend.onrender.com/api/test` — you should see:
   ```json
   {"message":"Backend is reachable","instanceId":"..."}
   ```

---

## Step 4 — Update `render.yaml` with Your Real Backend URL

> **IMPORTANT:** The backend URL in `render.yaml` must match exactly what Render assigned in Step 3.
> If your backend URL is different from `https://swu-backend.onrender.com`, update this line in `render.yaml`:
>
> ```yaml
>     dockerBuildArgs:
>       - BACKEND_URL=https://YOUR-ACTUAL-BACKEND-URL.onrender.com
> ```
>
> Then commit and push the change.

---

## Step 5 — Deploy Frontend on Render

1. Go to Render Dashboard → click **"New +"** → **"Web Service"**.
2. Select the same GitHub repo: **`Evansharol/swu_demo`**.
3. Fill in the settings:
   | Field | Value |
   |---|---|
   | Name | `swu-frontend` |
   | Region | Singapore (same as backend) |
   | Branch | `main` |
   | Root Directory | `Stillwithyou_updated` |
   | Runtime | **Docker** |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | **Free** |
4. Under **Docker Build Arguments**, add:
   | Key | Value |
   |---|---|
   | `BACKEND_URL` | `https://swu-backend.onrender.com` |
   _(Replace with your actual backend URL if different)_
5. No environment variables needed for the frontend.
6. Click **"Create Web Service"** → wait for build (5–8 minutes, it builds the React app).
7. Once deployed, your frontend URL will be:
   ```
   https://swu-frontend.onrender.com
   ```
   ✅ Open it in the browser — the Still With You app should load!

---

## Step 6 — Verify Everything Works

| Check | URL | Expected Result |
|---|---|---|
| Backend health | `https://swu-backend.onrender.com/api/test` | `{"message":"Backend is reachable"}` |
| Frontend loads | `https://swu-frontend.onrender.com` | Still With You app |
| API via frontend proxy | `https://swu-frontend.onrender.com/api/test` | `{"message":"Backend is reachable"}` |

---

## ⚠️ Important Notes

- **Free tier sleep:** Render free services sleep after 15 minutes of inactivity. The first request after sleeping may take 30–50 seconds to respond. Upgrade to a paid plan for always-on services.
- **MongoDB Atlas free tier:** 512 MB storage, shared cluster. Sufficient for demo/portfolio use.
- **Local development:** Your local `docker-compose up --build` still works unchanged — it uses the `backend:5000` hostname internally.

---

## Quick Reference — Your Deployment URLs

| Service | URL |
|---|---|
| 🌐 Frontend | `https://swu-frontend.onrender.com` |
| ⚙️ Backend API | `https://swu-backend.onrender.com` |
| 🔍 Health check | `https://swu-backend.onrender.com/api/test` |
| 🗄️ Database | MongoDB Atlas (cloud) |

---

## Troubleshooting

**Build fails on Render?**
- Check the Render build logs for specific errors
- Make sure the Root Directory is set correctly (`backend` or `Stillwithyou_updated`)

**Frontend shows 502 Bad Gateway on /api routes?**
- The `BACKEND_URL` build arg may be wrong — verify it matches your backend service URL exactly (no trailing slash)

**MongoDB connection fails?**
- Double-check your Atlas URI has the correct password and DB name (`/stillwithyou?`)
- Make sure `0.0.0.0/0` is in your Atlas Network Access list

**Emails not sending?**
- Gmail app passwords require 2FA enabled on the Gmail account
- Go to Google Account → Security → App Passwords to generate one
