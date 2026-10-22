# Production Deployment Guide - Nigeria Election Watch

This guide outlines deployment procedures for the unified Nigeria Election Watch platform, including instructions to disconnect legacy Google Cloud Run triggers and deploy to Render.com or any Node/Docker hosting provider.

---

## 1. Disconnecting Google Cloud Run Auto-Deployments from GitHub

If pushing commits to GitHub previously triggered automated deployments to Google Cloud Run, follow these steps to stop them:

### Method A: Disable/Delete Trigger in Google Cloud Console
1. Navigate to the **[Google Cloud Console](https://console.cloud.google.com/)** and select your project.
2. In the navigation menu, go to **Cloud Build** > **Triggers**.
3. Locate the trigger associated with your GitHub repository and Cloud Run service (e.g., `election-watch-backend` or `election-watch-frontend`).
4. Click the three dots icon (`⋮`) next to the trigger and select **Disable** (to pause) or **Delete** (to permanently remove).
5. Alternatively, open **Cloud Run** > select your service > click **Edit Continuous Deployment** > **Disconnect / Delete Trigger**.

### Method B: Disconnect Google Cloud Build from GitHub
1. Open your GitHub account: **Settings** > **Applications** > **Authorized GitHub Apps** (or **Installed GitHub Apps**).
2. Find **Google Cloud Build**.
3. Under **Repository access**, remove this repository or revoke access.
4. Also check your GitHub repository's **Settings** > **Webhooks**: if there is a webhook pointing to `cloudbuild.googleapis.com`, delete or disable it.

### Method C: Disabling via gcloud CLI
```bash
# List active Cloud Build triggers
gcloud builds triggers list

# Delete or disable the trigger
gcloud builds triggers delete <TRIGGER_NAME_OR_ID>
```

---

## 2. Deploying to Render.com (Recommended)

The app includes native `render.yaml` blueprint configuration for automated continuous deployment on Render.

### Option 1: Automatic Blueprint Deployment
1. Log in to [Render.com](https://render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render automatically parses `render.yaml`:
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check**: `/api/v1/health`
5. Click **Apply**. Render will automatically deploy new commits whenever you push to GitHub.

### Option 2: Manual Web Service on Render
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/v1/health`
4. In the **Environment Variables** section, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render sets this dynamically, but `server.ts` handles it automatically)
   - (Optional) `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, or `ANTHROPIC_API_KEY` for AI OCR.

---

## 3. Local Development & Docker Deployment

### Step-by-Step Local Run
```bash
# Install dependencies
npm install

# Build client bundle
npm run build

# Start production server
npm start
```

### Docker Container Run
```bash
# Build the unified container
docker build -t election-watch:latest .

# Run container on port 3000 (or any port)
docker run -p 3000:3000 -e PORT=3000 election-watch:latest
```

---

## 4. Verification & Health Probes

Once deployed, verify the service using the built-in health probes:
```bash
curl -f https://<your-render-url>/api/v1/health
curl -f https://<your-render-url>/api/v1/health/live
```
