# server/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your Flask app
COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
