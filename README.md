# Career Space

A private Next.js hub for interview preparation. It brings three existing study spaces together and provides one search across their content:

- MERN interview questions
- GenAI interview prep
- DSA practice sheet

## Run locally

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Verify a production build

```sh
npm run typecheck
npm run build
```

The app uses Next.js static export, so the production files are written to `out/`.

## Deploy to Vercel

Import this repository in Vercel and keep the detected **Next.js** framework settings. Vercel can use the existing `npm run build` command; no environment variables are required.

If `CENTRAL_REPO` is selected as the Git repository root, set Vercel's **Root Directory** to `career-space`. If the `career-space` folder itself is the repository, leave Root Directory empty.
