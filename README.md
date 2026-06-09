# AI Reporting Dashboard

A polished, frontend-only MVP dashboard for insurance reporting workflows. The app lets users upload CSV report data, computes operational KPIs, renders charts, previews parsed rows, and generates a realistic mock AI executive summary without calling any external AI API.

## Features

- Professional SaaS dashboard layout with sidebar navigation
- CSV upload and drag-and-drop import
- Required column validation
- KPI cards for total records, approvals, rejections, and SLA percentage
- Responsive Recharts visualizations
- Recent report row preview
- Mock AI executive summary with risks, recommendations, and SLA observations
- Frontend-only implementation with no backend, database, auth, payments, or AI API

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- PapaParse
- Recharts

## CSV Format

Uploaded CSV files must include these columns:

```csv
claimId,date,agent,status,tat,sla
CLM-10001,2026-06-01,Maya Patel,Approved,16h,Yes
CLM-10002,2026-06-01,Noah Williams,Rejected,31h,No
CLM-10003,2026-06-02,Sophia Chen,Pending,22h,Met
```

Supported SLA values include `Yes`, `No`, `Met`, `Missed`, `true`, `false`, and percentage values.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Quality Checks

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Deploy To Vercel

### Option 1: Vercel Dashboard

1. Push this project to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com/new).
3. Import the repository.
4. Set the framework preset to `Next.js`.
5. Use the default build command:

```bash
npm run build
```

6. Use the default output settings.
7. Click Deploy.

### Option 2: Vercel CLI

Install the Vercel CLI:

```bash
npm install -g vercel
```

Login:

```bash
vercel login
```

Deploy from the project directory:

```bash
vercel
```
Screeshot:
<img width="1248" height="902" alt="Screenshot 2026-06-09 221514" src="https://github.com/user-attachments/assets/198e86ab-5ee3-4282-8e74-ed78a79046a4" />
<img width="928" height="779" alt="Screenshot 2026-06-09 221800" src="https://github.com/user-attachments/assets/c61ae933-d6fc-4639-9d7a-31abf9a0ea68" />
<img width="930" height="814" alt="Screenshot 2026-06-09 221822" src="https://github.com/user-attachments/assets/8857dddc-1b75-4d62-a703-76639f2eae19" />
<img width="934" height="812" alt="Screenshot 2026-06-09 221846" src="https://github.com/user-attachments/assets/0615f1d2-0b2b-437d-ad16-2ff046c010a9" />
<img width="927" height="831" alt="Screenshot 2026-06-09 221907" src="https://github.com/user-attachments/assets/1ff5cb1a-275a-4cc0-b219-b435cb88c215" />

Deploy to production:

```bash
vercel --prod
```

## Notes

This is an MVP demo. CSV parsing, charting, KPI calculation, and mock summary generation all run in the browser. Future versions can add real AI summaries, persistence, authentication, and reporting APIs.
