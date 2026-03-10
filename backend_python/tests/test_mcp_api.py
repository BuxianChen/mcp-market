"""Test MCP Server CRUD operations"""
import requests
import pytest

BASE_URL = "http://localhost:3000"
API_PREFIX = "/api"


class TestMcpCRUD:
    """Test MCP Server CRUD operations"""

    def setup_method(self):
        """Setup test data"""
        self.base_url = f"{BASE_URL}{API_PREFIX}"
        self.test_mcp = {
            "name": "Test Weather Server",
            "description": "Test weather server for API testing",
            "connection_type": "stdio",
            "connection_config": {
                "command": "node",
                "args": ["weather-server.js"],
                "env": {}
            }
        }
        self.created_id = None

    def teardown_method(self):
        """Cleanup created resources"""
        if self.created_id:
            try:
                requests.delete(f"{self.base_url}/mcps/{self.created_id}")
            except:
                pass

    def test_create_mcp_server(self):
        """Test creating a new MCP server"""
        response = requests.post(f"{self.base_url}/mcps", json=self.test_mcp)
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert data["name"] == self.test_mcp["name"]
        assert data["description"] == self.test_mcp["description"]
        assert data["connection_type"] == self.test_mcp["connection_type"]

        self.created_id = data["id"]

    def test_get_all_mcps(self):
        """Test getting all MCP servers"""
        response = requests.get(f"{self.base_url}/mcps")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

    def test_get_single_mcp(self):
        """Test getting a single MCP server"""
        # Create first
        create_response = requests.post(f"{self.base_url}/mcps", json=self.test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]
        self.created_id = mcp_id

        # Get
        response = requests.get(f"{self.base_url}/mcps/{mcp_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == mcp_id
        assert data["name"] == self.test_mcp["name"]

    def test_update_mcp(self):
        """Test updating an MCP server"""
        # Create first
        create_response = requests.post(f"{self.base_url}/mcps", json=self.test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]
        self.created_id = mcp_id

        # Update
        updated_data = self.test_mcp.copy()
        updated_data["name"] = "Updated Weather Server"
        updated_data["description"] = "Updated description"

        response = requests.put(f"{self.base_url}/mcps/{mcp_id}", json=updated_data)
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Updated Weather Server"
        assert data["description"] == "Updated description"

    def test_delete_mcp(self):
        """Test deleting an MCP server"""
        # Create first
        create_response = requests.post(f"{self.base_url}/mcps", json=self.test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]

        # Delete
        response = requests.delete(f"{self.base_url}/mcps/{mcp_id}")
        assert response.status_code == 200

        data = response.json()
        assert "message" in data

        # Verify deleted
        get_response = requests.get(f"{self.base_url}/mcps/{mcp_id}")
        assert get_response.status_code == 404

        self.created_id = None

    def test_create_sse_mcp(self):
        """Test creating SSE type MCP server"""
        sse_mcp = {
            "name": "Test SSE Server",
            "description": "Test SSE server",
            "connection_type": "sse",
            "connection_config": {
                "url": "http://localhost:3001/sse"
            }
        }

        response = requests.post(f"{self.base_url}/mcps", json=sse_mcp)
        assert response.status_code == 201

        data = response.json()
        assert data["connection_type"] == "sse"
        assert data["connection_config"]["url"] == "http://localhost:3001/sse"

        self.created_id = data["id"]

    def test_create_http_mcp(self):
        """Test creating HTTP type MCP server"""
        http_mcp = {
            "name": "Test HTTP Server",
            "description": "Test HTTP server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:3001/mcp"
            }
        }

        response = requests.post(f"{self.base_url}/mcps", json=http_mcp)
        assert response.status_code == 201

        data = response.json()
        assert data["connection_type"] == "http"
        assert data["connection_config"]["url"] == "http://localhost:3001/mcp"

        self.created_id = data["id"]

    def test_get_nonexistent_mcp(self):
        """Test getting a non-existent MCP server"""
        response = requests.get(f"{self.base_url}/mcps/99999")
        assert response.status_code == 404

    def test_update_nonexistent_mcp(self):
        """Test updating a non-existent MCP server"""
        response = requests.put(f"{self.base_url}/mcps/99999", json=self.test_mcp)
        assert response.status_code == 404

    def test_delete_nonexistent_mcp(self):
        """Test deleting a non-existent MCP server"""
        response = requests.delete(f"{self.base_url}/mcps/99999")
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
