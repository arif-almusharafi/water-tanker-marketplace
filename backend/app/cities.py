"""The fixed list of cities and districts.

To add a city or a district, edit this list. Ids are English slugs and must be
unique across all cities, because orders save them as text.
Never remove or rename an id that saved orders or suppliers already use.
"""

CITIES = [
    {
        "id": "riyadh",
        "name": "الرياض",
        "districts": [
            {"id": "al-narjis", "name": "النرجس"},
            {"id": "al-yasmin", "name": "الياسمين"},
            {"id": "al-malqa", "name": "الملقا"},
            {"id": "al-aqiq", "name": "العقيق"},
        ],
    },
    {
        "id": "jeddah",
        "name": "جدة",
        "districts": [
            {"id": "al-safa", "name": "الصفا"},
            {"id": "al-rawdah", "name": "الروضة"},
            {"id": "north-obhur", "name": "أبحر الشمالية"},
        ],
    },
    {
        "id": "dammam",
        "name": "الدمام",
        "districts": [
            {"id": "al-shati", "name": "الشاطئ"},
            {"id": "al-faisaliyah", "name": "الفيصلية"},
            {"id": "al-noor", "name": "النور"},
        ],
    },
]

CITIES_BY_ID = {city["id"]: city for city in CITIES}


def district_name(city_id: str, district_id: str) -> str | None:
    """The Arabic name of a district, or None if it is not in that city."""
    for district in CITIES_BY_ID.get(city_id, {}).get("districts", []):
        if district["id"] == district_id:
            return district["name"]
    return None
