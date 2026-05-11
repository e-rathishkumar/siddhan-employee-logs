FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ make cmake libpq-dev libopenblas-dev liblapack-dev \
    libx11-dev libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/uploads/faces /app/uploads/avatars

EXPOSE 8000

CMD ["sh", "-c", "python scripts/seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
