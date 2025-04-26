import logging
import os

def setup_loggers(log_dir="/logs"):
    os.makedirs(log_dir, exist_ok=True)

    # Main server logger: for requests, responses, errors
    logging.basicConfig(
        filename=os.path.join(log_dir, "server.log"),
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )

    # Separate logger for full HTTP request/response bodies
    full_http_logger = logging.getLogger("full_http")
    full_http_handler = logging.FileHandler(os.path.join(log_dir, "full_http.log"))
    full_http_logger.addHandler(full_http_handler)
    full_http_logger.setLevel(logging.INFO)

    return full_http_logger

