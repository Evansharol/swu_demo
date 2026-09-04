# Still With You

Still With You is a memory and remembrance platform for preserving messages, photos, audio, video, virtual flower tributes, and surprise deliveries. It includes a React frontend, an Express API, and MongoDB persistence.

## Features

- User authentication with JWT
- Personal memory creation and management
- Audio and video memory support
- Virtual flower tributes and memory vaults
- Surprise and shop workflows
- User, admin, and shop dashboards
- Face verification support in the frontend
- Scheduled reminder and email services
- Leaflet-based location features

## Project Structure

```text
.
├── backend/              Express API, MongoDB models, routes, and services
├── Stillwithyou_updated/ React/Vite frontend
├── docker-compose.yml    MongoDB, backend, and frontend services
└── .env.example          Example environment configuration
```

## Requirements

- Docker Desktop, or Node.js 20+ and MongoDB for local development
- npm

## Run With Docker Compose

1. Copy the environment template and replace placeholder values, especially `JWT_SECRET` and email credentials:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Start the application:

   ```bash
   docker compose up --build
   ```

3. Open the frontend at [http://localhost:8080](http://localhost:8080).

The backend is available through the frontend reverse proxy at `/api`. A basic health check is available at [http://localhost:8080/api/test](http://localhost:8080/api/test).

To stop the services while keeping MongoDB data:

```bash
docker compose down
```

To remove the MongoDB volume as well:

```bash
docker compose down -v
```

Set `FRONTEND_PORT` in `.env` to use a different host port.

## Run Locally

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` with at least:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/stillwithyou
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
```

Optional email settings used by reminder services:

```env
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
```

Start the API:

```bash
npm run dev
```

The API listens on `http://localhost:5000`.

### Frontend

In a second terminal:

```bash
cd Stillwithyou_updated
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally [http://localhost:5173](http://localhost:5173). For local development, make sure the frontend API configuration points to the backend at `http://localhost:5000`.

Build and preview the production frontend with:

```bash
npm run build
npm run preview
```

## Seed Data

With MongoDB running and the backend environment configured, import seed data from the `backend` directory:

```bash
cd backend
npm run data:import
```

## API Routes

The API is grouped under these base paths:

- `/api/auth` - registration and authentication
- `/api/users` - user operations
- `/api/memories` - memory operations
- `/api/surprises` - surprise workflows
- `/api/shops` - shop operations
- `/api/test` - backend reachability check

## Security Notes

- Do not commit `.env` files or real credentials.
- Use a strong, unique `JWT_SECRET` outside local development.
- Use an email provider app password rather than an account password where required.
- Restrict CORS and proxy access before deploying publicly.

## License

This project does not currently declare a production license. Add one before distributing it publicly.
