FROM python:3.9-slim

# Set working directory
ENV APP_HOME=/app
WORKDIR $APP_HOME

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY ./src ./src

# Run the app with uvicorn
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8080"]
