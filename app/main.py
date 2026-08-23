from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictionRequest, PredictionResponse
from .inference import LeakageFreeInferencePipeline
import traceback
from contextlib import asynccontextmanager

pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    try:
        pipeline = LeakageFreeInferencePipeline()
    except Exception as e:
        pipeline = None
        print(f"Failed to initialize inference pipeline: {e}")
        traceback.print_exc()
    yield
    # Optional cleanup on shutdown
    pipeline = None

app = FastAPI(
    title="Traffic Accident Severity Predictor",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://traffic-accident-analysis-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "healthy" if pipeline is not None else "unhealthy",
        "pipeline_loaded": pipeline is not None
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Inference pipeline is not loaded."
        )

    try:
        request_data = request.model_dump(by_alias=True)
        explain = request_data.pop("explain", False)

        result = pipeline.predict(
            request_data,
            explain=explain
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
