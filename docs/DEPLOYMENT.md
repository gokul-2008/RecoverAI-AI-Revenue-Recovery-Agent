# 🚀 RecoverAI Production Deployment Guide

This guide provides step-by-step instructions for deploying the **RecoverAI – AI Revenue Recovery Agent** to cloud platforms.

---

## 📌 Option 1: Render Blueprint (Recommended - 1 Click)

RecoverAI includes a pre-configured `render.yaml` blueprint file at the repository root.

### Steps to Deploy on Render:
1. Push your repository to GitHub: `https://github.com/gokul-2008/RecoverAI-AI-Revenue-Recovery-Agent.git`
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
3. Connect your `RecoverAI-AI-Revenue-Recovery-Agent` GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   - Build Command: `npm run postinstall && npm run build && npm run seed`
   - Start Command: `npm run start`
   - Node Version: 18+
5. Fill in your environment variables in Render:
   - `MONGODB_URI`: Your MongoDB Atlas URI (or leave blank to use embedded engine).
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `RAZORPAY_KEY_ID`: Your Razorpay Test Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Test Key Secret.
   - `RAZORPAY_WEBHOOK_SECRET`: Your Razorpay Webhook Secret.
6. Click **Apply**. Your app will build, seed database, and go live!

---

## 📌 Option 2: Full-Stack Vercel Deployment

RecoverAI includes a pre-configured `vercel.json` file for Vercel deployment.

### Steps to Deploy on Vercel:
1. Install Vercel CLI or connect via [Vercel Dashboard](https://vercel.com/new).
2. Import the `RecoverAI-AI-Revenue-Recovery-Agent` repository.
3. Configure Environment Variables in Vercel settings:
   - `GEMINI_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `MONGODB_URI`
4. Click **Deploy**. Vercel will build the Vite frontend assets and deploy the backend serverless endpoints automatically via `vercel.json`.

---

## 📌 Option 3: Docker Container Deployment

RecoverAI includes a multi-stage `Dockerfile` for container environments (AWS ECS, GCP Cloud Run, Railway, Docker Swarm).

### Build & Run Container Locally / Server:
```bash
# 1. Build Docker image
docker build -t recover-ai:latest .

# 2. Run Docker container
docker run -d \
  -p 5000:5000 \
  -e PORT=5000 \
  -e GEMINI_API_KEY="your_api_key" \
  -e RAZORPAY_KEY_ID="rzp_test_xxxx" \
  -e RAZORPAY_KEY_SECRET="xxxx" \
  --name recover-ai-app \
  recover-ai:latest
```

---

## 📌 Option 4: Single Node.js Server Deployment

You can run both backend & frontend from a single Node.js instance (e.g. AWS EC2, DigitalOcean Droplet, VPS).

```bash
# 1. Clone repo
git clone https://github.com/gokul-2008/RecoverAI-AI-Revenue-Recovery-Agent.git
cd RecoverAI-AI-Revenue-Recovery-Agent

# 2. Install all dependencies and build production assets
npm run postinstall
npm run build

# 3. Seed database
npm run seed

# 4. Start production server
npm run start
```
The server will start on port 5000, serving the REST API under `/api/*` and the interactive React frontend on `/`.

---

## 🔐 Production Environment Variables Checklist

| Variable | Description | Required / Fallback |
| :--- | :--- | :--- |
| `PORT` | HTTP Server Port (provided automatically by Render) | Required on Render (default `5000` locally) |
| `NODE_ENV` | Set to `production` | Required in Production |
| `MONGODB_URI` | MongoDB Atlas Connection String (`mongodb+srv://...`) | **Required on Render** (Embedded DB disabled in prod) |
| `FRONTEND_URL` | Deployed Frontend URL (e.g. `https://recover-ai-seven-beige.vercel.app`) | Recommended for CORS & Razorpay Callbacks |
| `BACKEND_URL` | Deployed Backend URL (e.g. `https://recover-ai.onrender.com`) | Recommended for Webhook & Payment Link URLs |
| `JWT_SECRET` | Secret key for JWT session signing | Required |
| `GEMINI_API_KEY` | Google Gemini API Key | Optional (falls back to Rule Engine) |
| `AI_PROVIDER` | `GEMINI` or `MOCK` | Optional (default `MOCK`) |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID (`rzp_test_...`) | Required for Razorpay links |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Key Secret | Required for Razorpay links |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | Required for Webhook verification |

---

## 💡 Health Checks & Monitoring

Once deployed, you can verify your service status using:
- **Server & DB Health**: `GET https://your-domain.com/health`
- **Detailed DB Diagnostics**: `GET https://your-domain.com/api/health/db`
