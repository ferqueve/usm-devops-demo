FROM python:3.14-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libpq-dev \
       curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:${PORT:-8001}/health || exit 1

# La red privada de Railway resuelve solo IPv6: con --host 0.0.0.0 el servicio
# escucha unicamente en IPv4 y los demas servicios no lo alcanzan.
CMD ["sh", "-c", "uvicorn main:app --host :: --port ${PORT:-8001}"]
