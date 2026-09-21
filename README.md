# Industrial Attachment Management System (IAMS)

Full-stack web app for Murang'a University industrial attachment: student registration, assumption of duty, e-logbook, reports, and grading by company and university supervisors.

## Demo accounts (for portfolio visitors)

Password for every demo role is `Demo@1234`.

| Role | Username |
| --- | --- |
| Student | `SC232/DEMO/2022` |
| Admin | `admin` (password only; username is fixed) |
| Company supervisor | `company.demo@iams.dev` |
| Visiting supervisor | `lecturer.demo@iams.dev` |

The sign-in page has **Use demo** buttons that fill these credentials. The demo student already has assumption-of-duty, week-1 logbook, supervisor assignment, and sample grades.

## Local development

1. Create the MySQL database, then copy `backend/.env.example` to `backend/.env` and set `MYSQL_*`.
2. Install and start the API:

```bash
cd backend
pip install -r requirements.txt
python init_db.py
python app.py
```

3. Start the React app:

```bash
cd frontend
npm install
npm start
```

The UI uses `http://http://localhost:3000` in development.

## Host the app (one Docker service)

This is the path to use for a live portfolio link. The container builds the React app and Flask serves it plus `/api`.

1. Create a **MySQL 8** database (Railway, Aiven, PlanetScale-compatible MySQL, or a VPS).
2. Push this repo to GitHub.
3. Deploy the Dockerfile to **Render**, **Railway**, **Fly.io**, or any Docker host.
4. Set environment variables:

- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`
- `SECRET_KEY` (long random string)
- `DEMO_PASSWORD=Demo@1234`
- `DEBUG=false`

On start, `init_db.py` creates tables (if needed) and upserts the demo accounts.

### Run everything on your machine with Docker

```bash
docker compose up --build
```

Open http://localhost:5000 and use the demo logins.

### Render

Create a MySQL instance first (Render does not bundle MySQL). Then create a Web Service from this repo with **Docker** runtime, paste the MySQL connection values, and use health check `/api/health`.

## Portfolio blurb

**IAMS** is a role-based industrial attachment portal (React + Flask + MySQL). Students submit assumption of duty and weekly logbooks; company and university supervisors grade performance; admins assign lecturers. Live demo accounts are on the login screen.

Replace this README's live URL once your host finishes deploying: `https://YOUR-APP.onrender.com`
