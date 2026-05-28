from slowapi import Limiter
from slowapi.util import get_remote_address

# Setup standard shared rate limiter instance
limiter = Limiter(key_func=get_remote_address)
