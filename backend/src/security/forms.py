from fastapi import APIRouter, HTTPException, status, Depends, Response, Path, Form
from typing import Optional


class OAuth2PasswordRequestFormWithEmail:
    def __init__(
        self,
        email: str = Form(...),
        password: str = Form(...),
        scope: str = Form(""),
        client_id: Optional[str] = Form(None),
        client_secret: Optional[str] = Form(None),
    ):
        self.email = email
        self.password = password
        self.scope = scope
        self.client_id = client_id
        self.client_secret = client_secret