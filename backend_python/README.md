# MCP Market Backend (Python)

Python implementation of the MCP Market backend using FastAPI.

## Features

- Full MCP protocol support (tools, resources, prompts)
- Session management with automatic cleanup
- Token-based authentication and authorization
- Access logging and audit trail
- HTTP-to-MCP conversion
- Proxy forwarding with authentication
- SQLite database

## Requirements

- Python 3.10+
- uv (recommended) or pip

## Installation

### Using uv (Recommended)

1. Install uv if you haven't:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies:
```bash
cd backend_python
uv sync
```

### Using pip

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -e .
```

## Development

Install development dependencies:
```bash
# With uv
uv sync --dev

# With pip
pip install -e ".[dev]"
```

## Running

Start the server:

```bash
# With uv
uv run python -m src.main

# Or with uvicorn
uv run uvicorn src.main:app --host 0.0.0.0 --port 3000 --reload

# With pip/venv
python -m src.main
```

The API will be available at http://localhost:3000

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## Project Structure

```
backend_python/
├── src/
│   ├── db/
│   │   ├── database.py          # SQLite database wrapper
│   │   └── schema.sql           # Database schema
│   ├── services/
│   │   ├── mcp_service.py       # MCP server CRUD
│   │   ├── mcp_session_service.py  # Session management
│   │   ├��─ mcp_test_service.py  # Connection testing
│   │   ├── mcp_proxy_service.py # Proxy forwarding
│   │   └── http_to_mcp_adapter.py  # HTTP-to-MCP conversion
│   ├── routes/
│   │   ├── mcp.py               # MCP API routes
│   │   └── proxy.py             # Proxy routes
│   ├── middleware/
│   │   └── proxy_auth.py        # Authentication middleware
│   ├── types/
│   │   └── mcp.py               # Pydantic models
│   └── main.py                  # Application entry point
├── pyproject.toml               # Project configuration
└── README.md                    # This file
```

## Configuration

The server uses SQLite by default. The database file `mcp_market.db` will be created in the current directory.

## Testing

Run tests:
```bash
# With uv
uv run pytest

# With pip
pytest
```

## Code Quality

Format code:
```bash
# With uv
uv run black src/

# With pip
black src/
```

Lint code:
```bash
# With uv
uv run ruff check src/

# With pip
ruff check src/
```
