import logging
import os
from flask import Blueprint, request, Request, Response, session
import re

full_http_logger = None

def setup_loggers(log_dir="/logs"):
    global full_http_logger
    # Make sure the log directory exists
    os.makedirs(log_dir, exist_ok=True)

    # Set up main server logger (root logger)
    logging.basicConfig(
        filename=os.path.join(log_dir, "server.log"),
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )

    # Set up a separate logger for full HTTP request/response bodies
    full_http_logger = logging.getLogger("full_http")
    full_http_handler = logging.FileHandler(os.path.join(log_dir, "full_http.log"))
    full_http_handler.setLevel(logging.INFO)
    full_http_logger.propagate = False

    # Add a simple formatter to the full HTTP logger
    full_http_formatter = logging.Formatter("%(asctime)s %(message)s")
    full_http_handler.setFormatter(full_http_formatter)

    # Attach the handler to the full_http logger
    full_http_logger.addHandler(full_http_handler)

    return full_http_logger

def log_safe_http(req: Request, response: Response):
    if full_http_logger is None:
        return

    ip = req.remote_addr
    code = response.status_code
    method = req.method
    path = req.path
    username = session.get("username", "anonymous")

    # Redact headers that may contain tokens
    safe_headers = sanitize_headers(req.headers)
    header_str = "\n".join([f"{k}: {v}" for k, v in safe_headers.items()])
    # Raw request bytes

    try:
        raw_bytes = req.get_data()
        if b"password" in raw_bytes:
            request_body = redact_password_from_raw(raw_bytes)
        elif any(b < 32 and b not in (9, 10, 13) for b in raw_bytes[:2048]):
            request_body = "[non-text request body omitted]"
        else:
            request_body = f"{raw_bytes[:2048].decode(errors='replace')}"
    except Exception:
        request_body = "[error reading request body]"

    # Raw response bytes
    try:
        raw_response = response.get_data()
        if any(b < 32 and b not in (9, 10, 13) for b in raw_response[:2048]):
            response_body = "[non-text response body omitted]"
        else:
            response_body = f"{raw_response[:2048].decode(errors='replace')}"
    except Exception:
        response_body = "[error reading response body]"

    # Final log message
    message = (
        f"{method} {path} from {ip} (user={username}) → {code}\n"
        f"Request Headers:\n{header_str}\n\n"
        f"Request Body:\n{request_body}\n\n"
        f"Response Body:\n{response_body}\n"
    )

    full_http_logger.info(message)


def redact_password_from_raw(raw_bytes: bytes) -> str:
    """
    Redacts sensitive fields like 'password', 'auth_token', 'token', 'secret' from raw JSON body bytes.
    Returns the redacted string up to 2048 bytes.
    """
    try:
        decoded = raw_bytes.decode(errors="replace")

        # Fields to redact
        sensitive_fields = [
            "password",
            "oldPassword",
            "auth_token",
            "access_token",
            "token",
            "secret"
        ]

        # Redact each sensitive field (case-insensitive)
        for field in sensitive_fields:
            # JSON-style key: "field" : "value"
            decoded = re.sub(
                rf'("{field}"\s*:\s*)"(.*?)"',
                r'\1"[REDACTED]"',
                decoded,
                flags=re.IGNORECASE
            )

        # Truncate to first 2048 characters and return as a byte-style string
        return f"b'{decoded[:2048]}'"

    except Exception:
        return "b'[error decoding and redacting request body]'"

def sanitize_headers(headers):
    safe = {}
    for k, v in headers.items():
        # Redact auth header entirely
        if 'auth' in k.lower():
            safe[k] = '[REDACTED]'
        # Redact auth_token inside cookies
        elif k.lower() == 'cookie':
            # Carefully redact auth_token=... (but only the token, leave session intact)
            redacted_cookie = re.sub(r'(auth_token=)[^;]+', r'\1[REDACTED]', v, flags=re.IGNORECASE)
            safe[k] = redacted_cookie
        else:
            safe[k] = v
    return safe