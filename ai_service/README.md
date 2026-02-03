# Trashio AI Service

FastAPI microservice providing AI decisions for report approval and cleaning verification.

## Endpoints
- `POST /analyze/before`
- `POST /analyze/after`

## Run locally
```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 9000
```
