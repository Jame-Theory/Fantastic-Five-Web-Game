import logging
import os
from flask import Blueprint, request, Request, Response, session

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

# def log_safe_http(request: Request, response: Response):
#     if full_http_logger == None:
#         return
#     headers = dict(request.headers)
    
#     full_http_logger.info(message)
