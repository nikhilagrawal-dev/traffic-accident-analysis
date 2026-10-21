import pytest
from fastapi.testclient import TestClient
from app.main import app
import pandas as pd

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_nearby_clusters_philadelphia_success(client):
    response = client.get("/spatial/clusters", params={
        "latitude": 39.9526,
        "longitude": -75.1652,
        "radius_km": 30.0,
        "limit": 20
    })
    assert response.status_code == 200
    data = response.json()

    assert data["center_latitude"] == 39.9526
    assert data["center_longitude"] == -75.1652
    assert data["radius_km"] == 30.0
    assert data["limit"] == 20
    assert data["total_found"] > 0
    assert len(data["clusters"]) <= 20
    assert "metadata" in data
    assert "DBSCAN" in data["metadata"]["clustering_method"]

    first = data["clusters"][0]
    assert isinstance(first["cluster_id"], int)
    assert isinstance(first["hotspot_label"], int)
    assert isinstance(first["cluster_size"], int)
    assert first["cluster_size"] >= 3
    assert isinstance(first["latitude"], float)
    assert isinstance(first["longitude"], float)
    assert isinstance(first["distance_km"], float)
    assert first["distance_km"] <= 30.0

def test_nearby_clusters_radius_filtering(client):
    res_small = client.get("/spatial/clusters", params={
        "latitude": 39.9526,
        "longitude": -75.1652,
        "radius_km": 5.0,
        "limit": 100
    })
    res_large = client.get("/spatial/clusters", params={
        "latitude": 39.9526,
        "longitude": -75.1652,
        "radius_km": 30.0,
        "limit": 100
    })
    assert res_small.status_code == 200
    assert res_large.status_code == 200

    small_data = res_small.json()
    large_data = res_large.json()

    assert small_data["total_found"] <= large_data["total_found"]
    for c in small_data["clusters"]:
        assert c["distance_km"] <= 5.0

def test_nearby_clusters_limit(client):
    response = client.get("/spatial/clusters", params={
        "latitude": 39.9526,
        "longitude": -75.1652,
        "radius_km": 50.0,
        "limit": 7
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["clusters"]) == 7
    assert data["total_found"] >= 7

def test_nearby_clusters_empty_for_remote_location(client):
    # Null Island (0.0, 0.0) has no US accident clusters
    response = client.get("/spatial/clusters", params={
        "latitude": 0.0,
        "longitude": 0.0,
        "radius_km": 50.0,
        "limit": 50
    })
    assert response.status_code == 200
    data = response.json()
    assert data["total_found"] == 0
    assert data["clusters"] == []

def test_nearby_clusters_bhilai_chhattisgarh_empty(client):
    # Bhilai, Chhattisgarh, India (21.2092°N, 81.4285°E) is outside contiguous US training coverage
    response = client.get("/spatial/clusters", params={
        "latitude": 21.2092,
        "longitude": 81.4285,
        "radius_km": 30.0,
        "limit": 50
    })
    assert response.status_code == 200
    data = response.json()
    assert data["center_latitude"] == 21.2092
    assert data["center_longitude"] == 81.4285
    assert data["radius_km"] == 30.0
    assert data["total_found"] == 0
    assert data["clusters"] == []
    assert data["metadata"]["source"] == "artifacts/train_dbscan_clusters.csv"

def test_nearby_clusters_invalid_coordinates(client):
    # Lat > 90
    assert client.get("/spatial/clusters", params={"latitude": 91.0, "longitude": 0.0}).status_code == 422
    # Lat < -90
    assert client.get("/spatial/clusters", params={"latitude": -95.0, "longitude": 0.0}).status_code == 422
    # Lng > 180
    assert client.get("/spatial/clusters", params={"latitude": 0.0, "longitude": 181.0}).status_code == 422
    # Lng < -180
    assert client.get("/spatial/clusters", params={"latitude": 0.0, "longitude": -190.0}).status_code == 422

def test_nearby_clusters_invalid_radius_and_limit(client):
    # Radius <= 0
    assert client.get("/spatial/clusters", params={"latitude": 39.95, "longitude": -75.16, "radius_km": 0.0}).status_code == 422
    assert client.get("/spatial/clusters", params={"latitude": 39.95, "longitude": -75.16, "radius_km": -10.0}).status_code == 422
    # Radius > 100 max
    assert client.get("/spatial/clusters", params={"latitude": 39.95, "longitude": -75.16, "radius_km": 150.0}).status_code == 422
    # Limit <= 0
    assert client.get("/spatial/clusters", params={"latitude": 39.95, "longitude": -75.16, "limit": 0}).status_code == 422
    # Limit > 200 max
    assert client.get("/spatial/clusters", params={"latitude": 39.95, "longitude": -75.16, "limit": 250}).status_code == 422

def test_nearby_clusters_matches_csv_data(client):
    # Load raw CSV to verify exact ground truth correspondence
    clusters_df = pd.read_csv("artifacts/train_dbscan_clusters.csv")

    response = client.get("/spatial/clusters", params={
        "latitude": 39.9526,
        "longitude": -75.1652,
        "radius_km": 10.0,
        "limit": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["clusters"]) > 0

    first = data["clusters"][0]
    matched_row = clusters_df[clusters_df["Hotspot_Label"] == first["hotspot_label"]].iloc[0]

    assert first["cluster_size"] == int(matched_row["Cluster_Size"])
    assert abs(first["latitude"] - float(matched_row["Center_Lat"])) < 1e-6
    assert abs(first["longitude"] - float(matched_row["Center_Lng"])) < 1e-6
