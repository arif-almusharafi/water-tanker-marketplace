from conftest import SUPPLIER, register


def test_register_logs_in_as_pending(client):
    response = client.post("/api/auth/register", json=SUPPLIER)
    assert response.status_code == 201
    body = response.json()
    assert len(body["token"]) == 43
    supplier = body["supplier"]
    assert supplier["approval_status"] == "pending"
    assert supplier["is_available"] is True
    assert supplier["delivered_orders_count"] == 0
    assert supplier["created_at"].endswith("Z")
    assert "password_hash" not in supplier and "password" not in supplier


def test_register_trims_text_and_empty_optional_becomes_null(client):
    _, supplier = register(client, name="  مياه  ", tagline="   ", driver_name="")
    assert supplier["name"] == "مياه"
    assert supplier["tagline"] is None
    assert supplier["driver_name"] is None


def test_register_same_phone_is_phone_taken(client):
    register(client)
    response = client.post("/api/auth/register", json={**SUPPLIER, "name": "غيره"})
    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == "phone_taken"
    assert "phone" in error["fields"]


def test_register_validation_errors_name_each_field(client):
    bad = {
        **SUPPLIER,
        "phone": "0612345678",
        "password": "short",
        "city_id": "mecca",
        "eta_minutes": 5,
        "prices_sar": {"6": 120, "12": 0},
        "drinking_extra_sar": "30",  # must be a number, not text
    }
    response = client.post("/api/auth/register", json=bad)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert error["message"] == "تحقق من البيانات المدخلة"
    assert error["fields"] == {
        "phone": "رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام",
        "password": "كلمة المرور لازم تكون 8 أحرف على الأقل",
        "city_id": "المدينة غير موجودة",
        "eta_minutes": "وقت الوصول لازم يكون بين 10 و 240 دقيقة",
        "prices_sar.12": "السعر لازم يكون بين 1 و 5000",
        "prices_sar.18": "السعر لازم يكون بين 1 و 5000",
        "drinking_extra_sar": "المبلغ لازم يكون بين 0 و 1000",
    }


def test_bad_json_body_is_validation_error(client):
    response = client.post("/api/auth/register", content="{not json", headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_login_works_and_wrong_password_or_phone_fail_the_same(client):
    register(client)
    ok = client.post("/api/auth/login", json={"phone": SUPPLIER["phone"], "password": SUPPLIER["password"]})
    assert ok.status_code == 200
    assert ok.json()["supplier"]["phone"] == SUPPLIER["phone"]

    wrong_logins = [
        (SUPPLIER["phone"], "wrong-pass-1"),
        (SUPPLIER["phone"], "abc"),  # QA-1: a short password is a wrong password, not a 422
        (SUPPLIER["phone"], ""),
        ("0599999999", SUPPLIER["password"]),
    ]
    for phone, password in wrong_logins:
        response = client.post("/api/auth/login", json={"phone": phone, "password": password})
        assert response.status_code == 401
        assert response.json()["error"] == {
            "code": "invalid_credentials",
            "message": "رقم الجوال أو كلمة المرور غير صحيحة",
            "fields": {},
        }


def test_logout_deletes_the_session(client):
    headers, _ = register(client)
    assert client.get("/api/me", headers=headers).status_code == 200
    assert client.post("/api/auth/logout", headers=headers).status_code == 204
    response = client.get("/api/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_me_needs_a_valid_token(client):
    for headers in [{}, {"Authorization": "Bearer not-a-token"}, {"Authorization": "Basic abc"}]:
        assert client.get("/api/me", headers=headers).status_code == 401
    assert client.post("/api/auth/logout").status_code == 401
