"""Test path_prefix functionality"""
import requests
import pytest

BASE_URL = "http://localhost:3000"
API_PREFIX = "/api"


class TestPathPrefix:
    """Test path_prefix functionality"""

    def setup_method(self):
        """Setup test data"""
        self.base_url = f"{BASE_URL}{API_PREFIX}"
        self.created_id = None

    def teardown_method(self):
        """Cleanup created resources"""
        if self.created_id:
            try:
                requests.delete(f"{self.base_url}/mcps/{self.created_id}")
            except:
                pass

    def test_create_mcp_with_path_prefix(self):
        """Test creating MCP server with path_prefix"""
        test_mcp = {
            "name": "Weather Server",
            "description": "Test weather server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            },
            "path_prefix": "weather"
        }

        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 201

        data = response.json()
        assert data["path_prefix"] == "weather"
        self.created_id = data["id"]

    def test_path_prefix_uniqueness(self):
        """Test that path_prefix must be unique"""
        test_mcp1 = {
            "name": "Server 1",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8000/mcp"},
            "path_prefix": "test-prefix"
        }

        test_mcp2 = {
            "name": "Server 2",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8001/mcp"},
            "path_prefix": "test-prefix"  # Same prefix
        }

        # Create first server
        response1 = requests.post(f"{self.base_url}/mcps", json=test_mcp1)
        assert response1.status_code == 201
        self.created_id = response1.json()["id"]

        # Try to create second server with same prefix
        response2 = requests.post(f"{self.base_url}/mcps", json=test_mcp2)
        assert response2.status_code == 400  # Should fail

    def test_path_prefix_validation(self):
        """Test path_prefix format validation"""
        # Invalid: uppercase letters
        test_mcp = {
            "name": "Test Server",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8000/mcp"},
            "path_prefix": "Weather"  # Invalid: uppercase
        }

        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 422  # Validation error

        # Invalid: too short
        test_mcp["path_prefix"] = "ab"
        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 422

        # Invalid: special characters
        test_mcp["path_prefix"] = "test_prefix"
        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 422

    def test_get_by_path_prefix(self):
        """Test retrieving server by path_prefix"""
        test_mcp = {
            "name": "Time Server",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8000/mcp"},
            "path_prefix": "time"
        }

        # Create server
        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        self.created_id = create_response.json()["id"]

        # Get all servers and verify path_prefix
        get_response = requests.get(f"{self.base_url}/mcps")
        assert get_response.status_code == 200

        servers = get_response.json()
        time_server = next((s for s in servers if s.get("path_prefix") == "time"), None)
        assert time_server is not None
        assert time_server["name"] == "Time Server"

    def test_update_path_prefix(self):
        """Test updating path_prefix"""
        test_mcp = {
            "name": "Test Server",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8000/mcp"},
            "path_prefix": "old-prefix"
        }

        # Create server
        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        server_id = create_response.json()["id"]
        self.created_id = server_id

        # Update path_prefix
        update_data = {
            "name": "Test Server",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8000/mcp"},
            "path_prefix": "new-prefix"
        }

        update_response = requests.put(f"{self.base_url}/mcps/{server_id}", json=update_data)
        assert update_response.status_code == 200

        data = update_response.json()
        assert data["path_prefix"] == "new-prefix"

    def test_create_without_path_prefix(self):
        """Test creating server without path_prefix (should be optional)"""
        test_mcp = {
            "name": "No Prefix Server",
            "connection_type": "http",
            "connection_config": {"url": "http://localhost:8000/mcp"}
            # No path_prefix
        }

        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 201

        data = response.json()
        assert data.get("path_prefix") is None
        self.created_id = data["id"]

    def test_path_prefix_with_stdio(self):
        """Test that path_prefix can be set for stdio (but won't be used for proxy)"""
        test_mcp = {
            "name": "Stdio Server",
            "connection_type": "stdio",
            "connection_config": {
                "command": "python",
                "args": ["-m", "mcp.server"]
            },
            "path_prefix": "stdio-test"
        }

        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 201

        data = response.json()
        assert data["path_prefix"] == "stdio-test"
        self.created_id = data["id"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
