from tests.api.helpers import make_ingredient


def test_list_ingredients_filters_by_query_category_top(client, session):
    make_ingredient(session, name="양파필터테스트", category="채소", unit="개", is_top=True)
    make_ingredient(session, name="돼지고기필터테스트", category="육류", unit="g", is_top=False)

    resp = client.get("/api/v1/ingredients", params={"query": "양파필터"})
    assert resp.status_code == 200
    names = [i["name"] for i in resp.json()]
    assert "양파필터테스트" in names
    assert "돼지고기필터테스트" not in names

    resp = client.get("/api/v1/ingredients", params={"category": "육류"})
    names = [i["name"] for i in resp.json()]
    assert "돼지고기필터테스트" in names
    assert "양파필터테스트" not in names

    resp = client.get("/api/v1/ingredients", params={"top": "true"})
    names = [i["name"] for i in resp.json()]
    assert "양파필터테스트" in names
    assert "돼지고기필터테스트" not in names
