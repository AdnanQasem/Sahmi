from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response") if renderer_context else None

        if response is not None and response.exception:
            envelope = {
                "success": False,
                "error": data,
                "message": self._message_from_error(data),
            }
        else:
            envelope = {
                "success": True,
                "data": data,
                "message": None,
            }

        return super().render(envelope, accepted_media_type, renderer_context)

    @staticmethod
    def _message_from_error(data):
        if isinstance(data, dict):
            if "detail" in data:
                return data["detail"]
            first = next(iter(data.values()), None)
            if isinstance(first, list) and first:
                return first[0]
            return "Request failed."
        return "Request failed."
