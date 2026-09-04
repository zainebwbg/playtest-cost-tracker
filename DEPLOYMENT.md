# Deployment Guide — Playtest Cost Tracker

## Architecture Overview

```
Airtable (backend)
    ↕ REST API
React App (frontend)
    ↓ static build
Azure Static Web Apps (hosting)
    ↓ iframe embed
SharePoint Modern Page (access)
```

---

## Step 1: Set Up Airtable

### 1.1 Create a new Airtable Base
Go to https://airtable.com and create a new base. Name it "Playtest Cost Tracker".

### 1.2 Create the following tables with exact field names:

#### Table: **Games**
| Field Name          | Type           | Options                                               |
|---------------------|----------------|-------------------------------------------------------|
| Name                | Single line text |                                                     |
| Description         | Long text      |                                                       |
| Status              | Single select  | Active, On Hold, Shipped, Cancelled                   |
| Current Phase       | Single select  | Discovery, Pre-Alpha, Alpha, Beta, Gold, Launch       |
| Studio              | Single line text |                                                     |
| Target Launch Date  | Date           |                                                       |

#### Table: **Product Goals**
| Field Name    | Type             | Options                   |
|---------------|------------------|---------------------------|
| Name          | Single line text |                           |
| Description   | Long text        |                           |
| Game          | Link to Games    |                           |
| Priority      | Single select    | High, Medium, Low         |

#### Table: **Player Experience Goals**
| Field Name         | Type                            | Options                                               |
|--------------------|---------------------------------|-------------------------------------------------------|
| Name               | Single line text                |                                                       |
| Description        | Long text                       |                                                       |
| Product Goal       | Link to Product Goals           |                                                       |
| Development Phase  | Single select                   | Discovery, Pre-Alpha, Alpha, Beta, Gold, Launch       |
| Status             | Single select                   | Not Started, Planning, In Progress, Measuring, Complete |
| Forecasted Cost    | Currency (USD)                  |                                                       |
| Notes              | Long text                       |                                                       |

#### Table: **Studies**
| Field Name              | Type                                     | Options                                                          |
|-------------------------|------------------------------------------|------------------------------------------------------------------|
| Name                    | Single line text                         |                                                                  |
| Player Experience Goal  | Link to Player Experience Goals          |                                                                  |
| Type                    | Single select                            | Playtest, Survey, Interview, Diary Study, Analytics Review, Heuristic Evaluation |
| Status                  | Single select                            | Planned, In Progress, Complete, Cancelled                       |
| Date                    | Date                                     |                                                                  |
| Actual Cost             | Currency (USD)                           |                                                                  |
| Forecasted Cost         | Currency (USD)                           |                                                                  |
| Insights                | Long text                                |                                                                  |
| Participants            | Number                                   |                                                                  |

### 1.3 Get your credentials
1. Go to **https://airtable.com/account** → **Developer hub** → **Personal access tokens**
2. Click **Create new token**
3. Name: "Playtest Cost Tracker"
4. Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
5. Access: your new base
6. Copy the token (starts with `pat...`)

Your **Base ID** is in the URL when viewing the base:  
`https://airtable.com/appXXXXXXXXXX/...`  
Copy the `appXXXXXXXXXX` part.

---

## Step 2: Configure the App

```bash
# In the project root:
cp .env.example .env
```

Edit `.env`:
```
VITE_AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
VITE_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

Test locally:
```bash
npm install
npm run dev
```
The app will open at http://localhost:5173.

---

## Step 3: Deploy to Azure Static Web Apps (Free)

Azure Static Web Apps gives you a free HTTPS URL, perfect for embedding in SharePoint.

### Option A — GitHub Actions (recommended)

1. Push this repo to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_ORG/playtest-cost-tracker.git
   git push -u origin main
   ```

2. Go to https://portal.azure.com → **Create a resource** → **Static Web App**

3. Fill in:
   - **Subscription**: your Azure subscription
   - **Resource Group**: create new (e.g. `rg-playtest-tracker`)
   - **Name**: `playtest-cost-tracker`
   - **Plan type**: Free
   - **Region**: pick nearest
   - **Source**: GitHub → authorize → select your repo and `main` branch
   - **Build Presets**: React
   - **App location**: `/`
   - **Output location**: `dist`

4. Click **Review + Create** → **Create**

5. Azure will create a GitHub Actions workflow. Add secrets:
   - In GitHub repo → Settings → Secrets and variables → Actions
   - Add `VITE_AIRTABLE_API_KEY` and `VITE_AIRTABLE_BASE_ID`
   - Update the auto-generated workflow YAML to pass these:
     ```yaml
     env:
       VITE_AIRTABLE_API_KEY: ${{ secrets.VITE_AIRTABLE_API_KEY }}
       VITE_AIRTABLE_BASE_ID: ${{ secrets.VITE_AIRTABLE_BASE_ID }}
     ```

6. Push to trigger a deploy. Your app URL will be:
   `https://happy-tree-XXXX.azurestaticapps.net`

### Option B — Deploy manually

```bash
npm run build        # Creates dist/ folder

# Install Azure CLI if needed:
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

az login
az staticwebapp create \
  --name playtest-cost-tracker \
  --resource-group rg-playtest-tracker \
  --source . \
  --location "West US 2" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

---

## Step 4: Embed in SharePoint

Once your app is deployed to Azure Static Web Apps, embed it in a SharePoint page:

1. Open your **SharePoint site** → **New page** (or edit existing)
2. Click **+** to add a web part → search for **Embed**
3. In the Embed dialog, enter your Azure URL:
   ```
   https://happy-tree-XXXX.azurestaticapps.net
   ```
4. Resize the embedded web part to **Full Width** for best experience
5. **Publish** the page

### Tip: Full-screen in SharePoint
For the best experience, use a SharePoint **full-width** column layout:
- Page → Edit → Add section → **Full Width**
- Add the Embed web part in that section

### Alternative: SharePoint App Page
If you have SharePoint Framework (SPFx) development access, you can wrap the React app
as an SPFx web part for deeper integration. Contact your SharePoint admin.

---

## Step 5: Share Access

- Share the **SharePoint page URL** with your team
- Anyone with SharePoint site access can view and interact with the tracker
- The Airtable base can be shared separately for admins who want to edit records directly

---

## Data Ownership & Security Notes

- Your Airtable Personal Access Token is embedded in the built app bundle.
  For internal use this is acceptable; if the app will be publicly accessible,
  consider adding an authentication layer or using Azure API Management as a proxy.
- The free Azure Static Web Apps tier includes authentication via Azure AD —
  enabling this will restrict access to users in your Microsoft 365 tenant.

---

## Updating the App

After any code changes:
```bash
git add .
git commit -m "Update: ..."
git push origin main
# GitHub Actions will auto-deploy
```

After any Airtable schema changes:
- Update field names in `src/services/airtable.ts`
- Update types in `src/types/index.ts`

---

## Local Development

```bash
npm install
npm run dev        # Development server with hot reload
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
```
