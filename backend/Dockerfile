# backend/Dockerfile
#FROM python:3.9
#
#WORKDIR /app
#
#COPY requirements.txt requirements.txt
#RUN pip install -r requirements.txt
#
#COPY . .
#
#EXPOSE 5000
#
#CMD ["python", "app.py"]

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN apt update && apt install -y curl

COPY src/ ./src

CMD ["python", "src/app.py"]