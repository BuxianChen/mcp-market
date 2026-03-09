from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes import mcp, proxy
from src.services.mcp_session_service import mcp_session_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    print("Starting MCP Market Backend...")
    await mcp_session_service.start_cleanup()

    yield

    # Shutdown
    print("Shutting down MCP Market Backend...")
    await mcp_session_service.cleanup()


# Create FastAPI app
app = FastAPI(
    title="MCP Market Backend",
    description="Backend API for MCP Market",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(mcp.router)
app.include_router(proxy.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "MCP Market Backend API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
