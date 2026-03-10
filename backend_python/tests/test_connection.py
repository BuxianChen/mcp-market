"""Test MCP Server connection testing"""
import requests
import pytest

BASE_URL = "http://localhost:3000"
API_PREFIX = "/api"


class TestMcpConnection:
    """Test MCP Server connection testing"""

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

    def test_connection_with_real_server(self):
        """Test connection with a real MCP server (requires actual server running)"""
        # Create a test MCP server pointing to a real server
        # Note: This test requires an actual MCP server to be running
        test_mcp = {
            "name": "Real Test Server",
            "description": "Connection test with real server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            }
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]
        self.created_id = mcp_id

        # Test connection
        response = requests.post(f"{self.base_url}/mcps/{mcp_id}/test")

        # Response could be success or failure depending on whether server is running
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data

        if data["success"]:
            assert "server_info" in data
            assert "capabilities" in data

    def test_connection_with_timeout(self):
        """Test connection with custom timeout"""
        # Create a test MCP server
        test_mcp = {
            "name": "Timeout Test Server",
            "description": "Test timeout parameter",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:9999/mcp"  # Non-existent server
            }
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]
        self.created_id = mcp_id

        # Test with short timeout
        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/test",
            params={"timeout": 2000}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "error" in data or "message" in data

    def test_connection_nonexistent_mcp(self):
        """Test connection with non-existent MCP server"""
        response = requests.post(f"{self.base_url}/mcps/99999/test")
        assert response.status_code == 404

    def test_connection_stdio_server(self):
        """Test connection with stdio type server"""
        test_mcp = {
            "name": "Stdio Test Server",
            "description": "Test stdio connection",
            "connection_type": "stdio",
            "connection_config": {
                "command": "python",
                "args": ["-m", "mcp.server.stdio"],
                "env": {}
            }
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]
        self.created_id = mcp_id

        # Test connection
        response = requests.post(f"{self.base_url}/mcps/{mcp_id}/test")
        assert response.status_code == 200

        data = response.json()
        assert "success" in data

    def test_connection_response_structure(self):
        """Test that connection response has correct structure"""
        # Create any MCP server
        test_mcp = {
            "name": "Structure Test Server",
            "description": "Test response structure",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            }
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        mcp_id = create_response.json()["id"]
        self.created_id = mcp_id

        # Test connection
        response = requests.post(f"{self.base_url}/mcps/{mcp_id}/test")
        assert response.status_code == 200

        data = response.json()

        # Check required fields
        assert "success" in data
        assert "message" in data

        # If successful, check additional fields
        if data["success"]:
            assert "server_info" in data
            assert "capabilities" in data

            # Check server_info structure
            server_info = data["server_info"]
            assert "name" in server_info
            assert "version" in server_info

            # Check capabilities structure
            capabilities = data["capabilities"]
            assert isinstance(capabilities, dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
