from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

# Skema otorisasi standar (Bearer Token)
security = HTTPBearer()

# Samakan dengan yang ada di routers/auth.py
SECRET_KEY = "supersecretkey_langkahlegal" 
ALGORITHM = "HS256"

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Fungsi ini akan mengekstrak token dari header 'Authorization', 
    memvalidasinya, dan mengembalikan data user (id_user & role).
    """
    token = credentials.credentials
    try:
        # Bongkar tokennya
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload # Akan menghasilkan dict seperti {"id_user": 1, "role": "client"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token sudah kedaluwarsa. Silakan login ulang."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token tidak valid."
        )