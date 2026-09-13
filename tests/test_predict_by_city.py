from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

import app.enrichment as enrichment
from app.enrichment import NON_SPATIAL_FEATURES, build_city_feature_dict
from app.main import app

MOCK_GEO = (39.952583, -75.165222, "Pennsylvania", "America/New_York", "Philadelphia")
MOCK_WEATHER = {
    "Temperature(F)": 72.0,
    "Humidity(%)": 55.0,
    "Pressure(in)": 30.01,
    "Visibility(mi)": 10.0,
    "Wind_Speed(mph)": 6.0,
    "Precipitation(in)": 0.0,
    "Wind_Direction": "SW",
    "Weather_Condition": "Clear",
    "Is_Night": 0,
}


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clear_enrichment_caches():
    enrichment._geocoding_cache.clear()
    enrichment._weather_cache.clear()


@pytest.mark.asyncio
async def test_build_city_feature_dict_has_exactly_47_base_features():
    with patch(
        "app.enrichment.fetch_city_data",
        new=AsyncMock(return_value=MOCK_GEO),
    ), patch(
        "app.enrichment.fetch_weather_data",
        new=AsyncMock(return_value=MOCK_WEATHER),
    ):
        feature_dict, metadata = await build_city_feature_dict("Philadelphia")

    assert set(feature_dict.keys()) == set(NON_SPATIAL_FEATURES)
    assert len(feature_dict) == 47
    assert feature_dict["City"] == "Philadelphia"
    assert feature_dict["State"] == "Pennsylvania"
    assert feature_dict["Start_Lat"] == MOCK_GEO[0]
    assert feature_dict["Start_Lng"] == MOCK_GEO[1]
    assert "coordinate_note" in metadata
    assert "city-center" in metadata["coordinate_note"]


@pytest.mark.asyncio
async def test_geocoding_cache_uses_normalized_city_name():
    response = {"results": [{
        "latitude": 39.95,
        "longitude": -75.16,
        "admin1": "Pennsylvania",
        "timezone": "America/New_York",
        "name": "Philadelphia",
    }]}
    with patch("app.enrichment._get_json_with_retry", new=AsyncMock(return_value=response)) as get_json:
        first = await enrichment.fetch_city_data(" Philadelphia ")
        second = await enrichment.fetch_city_data("philadelphia")

    assert first == second
    get_json.assert_awaited_once()


@pytest.mark.asyncio
async def test_weather_cache_reuses_live_result_within_ttl():
    response = {"current": {
        "temperature_2m": 20, "relative_humidity_2m": 55, "precipitation": 0,
        "weather_code": 0, "surface_pressure": 1016, "wind_speed_10m": 10,
        "wind_direction_10m": 180, "is_day": 1,
    }, "hourly": {"visibility": [10000]}}
    with patch("app.enrichment._get_json_with_retry", new=AsyncMock(return_value=response)) as get_json:
        first = await enrichment.fetch_weather_data(39.95, -75.16)
        second = await enrichment.fetch_weather_data(39.95, -75.16)

    assert first == second
    assert first is not second
    get_json.assert_awaited_once()


@pytest.mark.asyncio
async def test_rate_limit_retries_once_using_retry_after():
    calls = 0

    async def handler(request):
        nonlocal calls
        calls += 1
        if calls == 1:
            return httpx.Response(429, headers={"Retry-After": "1"}, request=request)
        return httpx.Response(200, json={"ok": True}, request=request)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with patch("app.enrichment.httpx.AsyncClient", return_value=client), patch(
        "app.enrichment.asyncio.sleep", new=AsyncMock()
    ) as sleep:
        result = await enrichment._get_json_with_retry("https://example.test/weather")

    assert result == {"ok": True}
    assert calls == 2
    sleep.assert_awaited_once_with(1.0)


@pytest.mark.asyncio
async def test_transient_failure_has_only_one_retry():
    calls = 0

    async def handler(request):
        nonlocal calls
        calls += 1
        return httpx.Response(503, request=request)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with patch("app.enrichment.httpx.AsyncClient", return_value=client), patch(
        "app.enrichment.asyncio.sleep", new=AsyncMock()
    ) as sleep:
        with pytest.raises(httpx.HTTPStatusError):
            await enrichment._get_json_with_retry("https://example.test/weather")

    assert calls == 2
    assert sleep.await_count == 1


def test_predict_by_city_endpoint(client):
    with patch(
        "app.enrichment.fetch_city_data",
        new=AsyncMock(return_value=MOCK_GEO),
    ), patch(
        "app.enrichment.fetch_weather_data",
        new=AsyncMock(return_value=MOCK_WEATHER),
    ):
        response = client.post(
            "/predict-by-city",
            json={"city": "Philadelphia", "explain": True},
        )

    assert response.status_code == 200
    data = response.json()

    assert data["city_resolved"] == "Philadelphia"
    assert data["state_resolved"] == "Pennsylvania"
    assert data["local_time"]
    assert data["weather_context"]["condition"] == "Clear"
    assert data["weather_context"]["temperature_f"] == 72.0
    assert 1 <= data["predicted_severity"] <= 4
    assert "probabilities" in data
    assert "spatial_information" in data
    assert data["shap_explanation"] is not None


def test_predict_by_city_unknown_city(client):
    with patch(
        "app.enrichment.fetch_city_data",
        new=AsyncMock(
            side_effect=ValueError("City 'Nowhereville' could not be found.")
        ),
    ):
        response = client.post(
            "/predict-by-city",
            json={"city": "Nowhereville"},
        )

    assert response.status_code == 404
    assert "could not be found" in response.json()["detail"]


def test_predict_by_city_weather_failure(client):
    with patch(
        "app.enrichment.fetch_city_data",
        new=AsyncMock(return_value=MOCK_GEO),
    ), patch(
        "app.enrichment.fetch_weather_data",
        new=AsyncMock(
            side_effect=RuntimeError("Live weather unavailable (HTTP 503).")
        ),
    ):
        response = client.post(
            "/predict-by-city",
            json={"city": "Philadelphia"},
        )

    assert response.status_code == 502
    assert "weather" in response.json()["detail"].lower()


def test_predict_by_city_advanced_options(client):
    with patch(
        "app.enrichment.fetch_city_data",
        new=AsyncMock(return_value=MOCK_GEO),
    ), patch(
        "app.enrichment.fetch_weather_data",
        new=AsyncMock(return_value=MOCK_WEATHER),
    ):
        response = client.post(
            "/predict-by-city",
            json={
                "city": "Philadelphia",
                "advanced_options": {
                    "Junction": 1,
                    "Traffic_Signal": 1,
                    "Duration_Minutes": 90.0,
                },
            },
        )

    assert response.status_code == 200
