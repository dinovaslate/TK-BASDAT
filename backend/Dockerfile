FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . ./

RUN SECRET_KEY=build-time-secret \
    DEBUG=False \
    ALLOWED_HOSTS=localhost \
    DB_NAME=postgres \
    DB_USER=postgres \
    DB_PASSWORD=build-time-placeholder \
    DB_HOST=localhost \
    python manage.py collectstatic --noinput

CMD exec gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT}
