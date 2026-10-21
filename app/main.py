from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .schemas import (
    PredictionRequest,
    PredictionResponse,
    CityPredictionRequest,
    CityPredictionResponse,
    NearbyClustersResponse,
)
from .inference import LeakageFreeInferencePipeline
from .enrichment import build_city_feature_dict
from .spatial import get_cluster_service
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
        "http://127.0.0.1",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
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

        return {
            **result,
            "latitude": request.Start_Lat,
            "longitude": request.Start_Lng,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@app.post("/predict-by-city", response_model=CityPredictionResponse)
async def predict_by_city(request: CityPredictionRequest):
    """
    Estimate accident severity under current conditions for a city.

    Resolves city-center coordinates (representative, not road-level),
    fetches live weather, derives city-local time features, assembles 47
    base features, and passes them to the existing leakage-free pipeline.
    """
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Inference pipeline is not loaded."
        )

    try:
        advanced_options = None
        if request.advanced_options is not None:
            advanced_options = request.advanced_options.model_dump(
                by_alias=True, exclude_none=True
            )

        feature_dict, metadata = await build_city_feature_dict(
            request.city,
            advanced_options=advanced_options,
        )

        result = pipeline.predict(feature_dict, explain=request.explain)

        return {
            **result,
            "city_resolved": metadata["city_resolved"],
            "state_resolved": metadata["state_resolved"],
            "latitude": metadata["latitude"],
            "longitude": metadata["longitude"],
            "local_time": metadata["local_time"],
            "weather_context": metadata["weather_context"],
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except KeyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Feature assembly error: {e}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/spatial/clusters", response_model=NearbyClustersResponse)
def get_nearby_clusters(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    radius_km: float = Query(30.0, gt=0.0, le=100.0, description="Search radius in kilometers"),
    limit: int = Query(50, gt=0, le=200, description="Maximum number of cluster centers to return"),
):
    """
    Retrieve genuine DBSCAN cluster centers near a geographic coordinate.

    Queries the spatial BallTree index over training cluster centroids
    (`train_dbscan_clusters.csv`) using the Haversine metric.
    """
    try:
        service = get_cluster_service()
        return service.get_nearby_clusters(
            lat=latitude,
            lng=longitude,
            radius_km=radius_km,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spatial cluster query failed: {e}")
