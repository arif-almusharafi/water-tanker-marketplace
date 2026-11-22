# موية (Mooyah) frontend: Arabic RTL React + Vite, talks to the FastAPI backend in `../backend`.

- Install: `npm install` (Node 20.19+; on Windows PowerShell use `npm.cmd`).
- Settings: copy `.env.example` to `.env`; `VITE_API_BASE_URL` is the backend address (default `http://127.0.0.1:8100`).
- Run: start the backend first, then `npm run dev` and open http://127.0.0.1:5200 (port 5200 must be free).
- Test: `npm test` (Playwright with Edge; a fake API inside `tests/fake-api.js`, no backend needed) and `npm run lint`.
- Build for deploy: `npm run build`, then serve the `dist/` folder as static files (set `VITE_API_BASE_URL` before building).
- Code: all API calls are in `src/api.js`; pages in `src/pages/`; parts in `src/components/`; helpers in `src/lib/`.
- New suppliers register at `#/supplier/register` and stay hidden until approved with `backend/scripts/approve_supplier.py`.
