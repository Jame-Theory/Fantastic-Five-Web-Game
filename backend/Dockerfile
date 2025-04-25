FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN apt update && apt install -y curl

COPY src/ ./src

CMD ["python", "src/app.py"]







# FROM python:3.9
# WORKDIR /server

# COPY requirements.txt app.py database.py ./
# RUN pip install -r ./requirements.txt
# ENV FLASK_ENV development

# EXPOSE 5000
# CMD ["gunicorn", "-b", ":5000", "api:app"]