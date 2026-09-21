FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV REACT_APP_API_BASE=
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend /frontend/build /app/frontend_build
ENV FRONTEND_BUILD=/app/frontend_build
ENV PORT=5000
RUN chmod +x entrypoint.sh
EXPOSE 5000
CMD ["./entrypoint.sh"]
