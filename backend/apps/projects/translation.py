import json
from hashlib import sha256
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache


TRANSLATABLE_COST_FIELDS = ("description",)


def _translate_text(text, target_language):
    value = str(text or "").strip()
    if not value:
        return ""

    query = urlencode(
        {
            "client": "gtx",
            "sl": "auto",
            "tl": target_language,
            "dt": "t",
            "q": value,
        }
    )
    request = Request(
        f"{settings.PROJECT_TRANSLATION_URL}?{query}",
        headers={"User-Agent": "Sahmi/1.0"},
    )
    with urlopen(request, timeout=settings.PROJECT_TRANSLATION_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return "".join(part[0] for part in payload[0] if part and part[0])


def translate_project_content(project, target_language):
    language = "ar" if target_language == "ar" else "en"
    fingerprint = sha256(
        json.dumps(
            {
                "description": project.description,
                "cost_items": project.cost_items,
                "milestones": [
                    {
                        "id": str(milestone.id),
                        "title": milestone.title,
                        "description": milestone.description,
                        "deliverables": milestone.deliverables,
                    }
                    for milestone in project.milestones.all()
                ],
                "updated_at": project.updated_at.isoformat() if project.updated_at else "",
            },
            sort_keys=True,
            ensure_ascii=False,
        ).encode("utf-8")
    ).hexdigest()
    cache_key = f"project-translation:{project.pk}:{language}:{fingerprint}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    translated_cost_items = []
    for item in project.cost_items or []:
        translated = dict(item)
        for field in TRANSLATABLE_COST_FIELDS:
            if translated.get(field):
                translated[field] = _translate_text(translated[field], language)
        translated_cost_items.append(translated)

    translated_milestones = []
    for milestone in project.milestones.all():
        translated_milestones.append(
            {
                "id": str(milestone.id),
                "title": _translate_text(milestone.title, language),
                "description": _translate_text(milestone.description, language),
                "deliverables": _translate_text(milestone.deliverables, language),
            }
        )

    result = {
        "language": language,
        "description": _translate_text(project.description, language),
        "cost_items": translated_cost_items,
        "milestones": translated_milestones,
    }
    cache.set(cache_key, result, settings.PROJECT_TRANSLATION_CACHE_SECONDS)
    return result
