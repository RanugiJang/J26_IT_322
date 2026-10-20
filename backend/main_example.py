# EXAMPLE ONLY - do not replace your own main.py. Just add the 3 marked lines to it.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from module3.router import router as module3_router          # <-- ADD (1)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])   # <-- ADD (2) if you don't have CORS yet
app.include_router(module3_router)                             # <-- ADD (3)
