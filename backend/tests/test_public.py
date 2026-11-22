from conftest import approved_supplier, place_order, register


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_cities_in_config_order(client):
    items = client.get("/api/cities").json()["items"]
    assert [c["id"] for c in items] == ["riyadh", "jeddah", "dammam"]
    assert items[0]["districts"][0] == {"id": "al-narjis", "name": "النرجس"}


def test_suppliers_needs_a_known_city(client):
    for url in ["/api/suppliers", "/api/suppliers?city_id=mecca"]:
        response = client.get(url)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "validation_error"
        assert response.json()["error"]["fields"] == {"city_id": "المدينة غير موجودة"}


def test_empty_city_returns_empty_list(client):
    assert client.get("/api/suppliers?city_id=riyadh").json() == {"items": []}


def test_only_approved_and_available_suppliers_are_listed(client):
    register(client, phone="0500000001")  # pending: hidden
    _, approved = approved_supplier(client, phone="0500000002", eta_minutes=40)
    _, faster = approved_supplier(client, phone="0500000003", eta_minutes=20)
    busy_headers, _ = approved_supplier(client, phone="0500000004")
    client.patch("/api/me", json={"is_available": False}, headers=busy_headers)
    approved_supplier(client, phone="0500000005", city_id="jeddah")  # other city

    items = client.get("/api/suppliers?city_id=riyadh").json()["items"]
    assert [s["id"] for s in items] == [faster["id"], approved["id"]]  # sorted by eta
    assert "phone" not in items[0] and "approval_status" not in items[0]
    assert items[0]["prices_sar"] == {"6": 120, "12": 210, "18": 300}


def test_delivered_orders_count(client):
    headers, supplier = approved_supplier(client)
    order = place_order(client, supplier["id"])
    for status in ["accepted", "delivered"]:
        client.post(f"/api/me/orders/{order['reference']}/status", json={"status": status}, headers=headers)
    items = client.get("/api/suppliers?city_id=riyadh").json()["items"]
    assert items[0]["delivered_orders_count"] == 1


def test_unexpected_error_is_server_error(client, monkeypatch):
    from app.routes import orders

    def broken(*args):
        raise RuntimeError("boom")

    monkeypatch.setattr(orders, "find_order", broken)
    response = client.get("/api/orders/MW-AAAAAAAA")
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "server_error"


def test_unknown_path_uses_error_shape(client):
    response = client.get("/api/nothing")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
