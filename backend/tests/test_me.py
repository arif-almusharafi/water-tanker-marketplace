from datetime import UTC, datetime, timedelta

from conftest import approved_supplier, place_order, register


def change(client, headers, reference, status):
    return client.post(f"/api/me/orders/{reference}/status", json={"status": status}, headers=headers)


def test_patch_me_changes_only_sent_fields(client):
    headers, before = register(client)
    body = {
        "eta_minutes": 30,
        "prices_sar": {"6": 125, "12": 215, "18": 310},
        "tagline": None,
        "is_available": False,
        "phone": "0599999999",  # ignored
        "approval_status": "approved",  # ignored
    }
    after = client.patch("/api/me", json=body, headers=headers).json()
    assert after["eta_minutes"] == 30
    assert after["prices_sar"] == {"6": 125, "12": 215, "18": 310}
    assert after["tagline"] is None
    assert after["is_available"] is False
    assert after["name"] == before["name"]
    assert after["phone"] == before["phone"]
    assert after["approval_status"] == "pending"


def test_patch_me_validation(client):
    headers, _ = register(client)
    body = {"name": None, "prices_sar": {"6": 100}, "is_available": "yes"}
    response = client.patch("/api/me", json=body, headers=headers)
    assert response.status_code == 422
    assert set(response.json()["error"]["fields"]) == {"name", "prices_sar.12", "prices_sar.18", "is_available"}


def test_order_groups_and_status_flow(client):
    headers, supplier = approved_supplier(client)
    first = place_order(client, supplier["id"])["reference"]
    second = place_order(client, supplier["id"])["reference"]

    incoming = client.get("/api/me/orders?group=incoming", headers=headers).json()["items"]
    assert [o["reference"] for o in incoming] == [first, second]  # oldest first
    assert incoming[0]["customer_phone"] == "0551234567"

    assert change(client, headers, first, "accepted").json()["status"] == "accepted"
    assert change(client, headers, second, "rejected").status_code == 200
    active = client.get("/api/me/orders?group=active", headers=headers).json()["items"]
    assert [o["reference"] for o in active] == [first]

    for status in ["on_the_way", "arrived", "delivered"]:
        result = change(client, headers, first, status).json()
    assert result["status"] == "delivered" and result["delivered_at"].endswith("Z")

    history = client.get("/api/me/orders?group=history", headers=headers).json()["items"]
    assert {o["reference"] for o in history} == {first, second}
    assert client.get("/api/me/orders?group=active", headers=headers).json() == {"items": []}


def test_invalid_status_change(client):
    headers, supplier = approved_supplier(client)
    reference = place_order(client, supplier["id"])["reference"]
    client.post(f"/api/orders/{reference}/cancel")
    response = change(client, headers, reference, "accepted")
    assert response.status_code == 409
    assert response.json()["error"] == {
        "code": "invalid_status_change",
        "message": "ما يمكن تغيير حالة الطلب من ملغي إلى وافق المورد",
        "fields": {},
    }
    assert change(client, headers, reference, "cancelled").status_code == 422  # not a supplier status


def test_group_is_required(client):
    headers, _ = register(client)
    for url in ["/api/me/orders", "/api/me/orders?group=all"]:
        response = client.get(url, headers=headers)
        assert response.status_code == 422
        assert "group" in response.json()["error"]["fields"]


def test_other_suppliers_order_is_not_found(client):
    _, owner = approved_supplier(client, phone="0500000001")
    other_headers, _ = register(client, phone="0500000002")
    reference = place_order(client, owner["id"])["reference"]
    response = change(client, other_headers, reference, "accepted")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "order_not_found"


def test_stats(client):
    headers, supplier = approved_supplier(client)
    place_order(client, supplier["id"])  # stays pending
    active = place_order(client, supplier["id"])["reference"]
    change(client, headers, active, "accepted")
    done = place_order(client, supplier["id"], capacity_tons=6, water_type="regular")["reference"]
    change(client, headers, done, "accepted")
    change(client, headers, done, "delivered")

    stats = client.get("/api/me/stats", headers=headers).json()
    assert stats["pending_count"] == 1
    assert stats["active_count"] == 1
    assert stats["delivered_today_count"] == 1
    assert stats["revenue_today_sar"] == 120
    assert stats["delivered_total_count"] == 1

    days = stats["revenue_last_7_days"]
    riyadh_today = (datetime.now(UTC) + timedelta(hours=3)).date()
    assert len(days) == 7
    assert days[-1] == {"date": riyadh_today.isoformat(), "revenue_sar": 120}
    assert days[0]["date"] == (riyadh_today - timedelta(days=6)).isoformat()


def test_stats_empty(client):
    headers, _ = register(client)
    stats = client.get("/api/me/stats", headers=headers).json()
    assert stats["pending_count"] == 0 and stats["revenue_today_sar"] == 0
    assert [d["revenue_sar"] for d in stats["revenue_last_7_days"]] == [0] * 7
