from datetime import UTC, datetime, timedelta

from conftest import ORDER, approved_supplier, place_order, register


def test_create_order_sets_server_price_and_hides_customer(client):
    _, supplier = approved_supplier(client)
    order = place_order(client, supplier["id"], price_sar=1)  # a client price is ignored
    assert order["status"] == "pending"
    assert order["price_sar"] == 210 + 30  # 12 ton + drinking extra
    assert order["reference"].startswith("MW-") and len(order["reference"]) == 11
    assert order["city_name"] == "الرياض" and order["district_name"] == "النرجس"
    assert order["supplier"]["phone"] is None  # not accepted yet
    assert order["scheduled_at"] is None and order["notes"] is None
    assert "customer_phone" not in order and "customer_name" not in order


def test_scheduled_order(client):
    _, supplier = approved_supplier(client)
    when = datetime.now(UTC) + timedelta(hours=3)
    local = when.astimezone().isoformat()  # with a +hh:mm offset
    order = place_order(client, supplier["id"], delivery_time="scheduled", scheduled_at=local)
    assert order["scheduled_at"] == when.strftime("%Y-%m-%dT%H:%M:%SZ")


def test_scheduled_at_rules(client):
    _, supplier = approved_supplier(client)
    soon = (datetime.now(UTC) + timedelta(minutes=1)).isoformat()
    too_late = (datetime.now(UTC) + timedelta(days=8)).isoformat()
    no_zone = (datetime.now() + timedelta(hours=3)).replace(tzinfo=None).isoformat()
    for scheduled_at in [None, soon, too_late, no_zone]:
        body = {**ORDER, "supplier_id": supplier["id"], "delivery_time": "scheduled", "scheduled_at": scheduled_at}
        response = client.post("/api/orders", json=body)
        assert response.status_code == 422, scheduled_at
        assert response.json()["error"]["fields"] == {"scheduled_at": "الموعد لازم يكون بعد الآن وخلال 7 أيام"}


def test_order_validation_errors(client):
    body = {"supplier_id": 1, **ORDER, "customer_phone": "055", "district_id": "al-safa", "capacity_tons": 10}
    response = client.post("/api/orders", json=body)
    assert response.status_code == 422
    assert response.json()["error"]["fields"] == {
        "customer_phone": "رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام",
        "district_id": "الحي غير موجود في هذه المدينة",
        "capacity_tons": "حجم الوايت غير صحيح",
    }


def test_order_supplier_checks(client):
    pending_headers, pending = register(client, phone="0500000001")
    _, jeddah = approved_supplier(client, phone="0500000002", city_id="jeddah")
    busy_headers, busy = approved_supplier(client, phone="0500000003")
    client.patch("/api/me", json={"is_available": False}, headers=busy_headers)

    cases = [
        (999, 404, "supplier_not_found"),
        (pending["id"], 409, "supplier_unavailable"),
        (busy["id"], 409, "supplier_unavailable"),
        (jeddah["id"], 422, "supplier_other_city"),
    ]
    for supplier_id, status, code in cases:
        response = client.post("/api/orders", json={**ORDER, "supplier_id": supplier_id})
        assert response.status_code == status, code
        assert response.json()["error"]["code"] == code


def test_get_order_ignores_case_and_spaces(client):
    _, supplier = approved_supplier(client)
    reference = place_order(client, supplier["id"])["reference"]
    response = client.get(f"/api/orders/%20{reference.lower()}%20")
    assert response.status_code == 200
    assert response.json()["reference"] == reference
    assert client.get("/api/orders/MW-AAAAAAAA").json()["error"]["code"] == "order_not_found"


def test_supplier_phone_shows_only_during_delivery(client):
    headers, supplier = approved_supplier(client)
    reference = place_order(client, supplier["id"])["reference"]
    client.post(f"/api/me/orders/{reference}/status", json={"status": "accepted"}, headers=headers)
    assert client.get(f"/api/orders/{reference}").json()["supplier"]["phone"] == supplier["phone"]
    client.post(f"/api/me/orders/{reference}/status", json={"status": "delivered"}, headers=headers)
    assert client.get(f"/api/orders/{reference}").json()["supplier"]["phone"] is None


def test_cancel_before_the_tanker_leaves_only(client):
    headers, supplier = approved_supplier(client)
    first = place_order(client, supplier["id"])["reference"]
    response = client.post(f"/api/orders/{first}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

    second = place_order(client, supplier["id"])["reference"]
    for status in ["accepted", "on_the_way"]:
        client.post(f"/api/me/orders/{second}/status", json={"status": status}, headers=headers)
    response = client.post(f"/api/orders/{second}/cancel")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "cannot_cancel"
