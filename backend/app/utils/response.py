import math

from fastapi.responses import JSONResponse


def success_response(data=None, message=None, status_code=200):
    body = {"success": True}
    if message:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return JSONResponse(content=body, status_code=status_code)


def error_response(message="Internal server error", status_code=500):
    return JSONResponse(
        content={"success": False, "error": message}, status_code=status_code
    )


def paginated_response(data, total, page, limit):
    return JSONResponse(
        content={
            "success": True,
            "data": data,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": math.ceil(total / limit) if limit > 0 else 0,
        }
    )
