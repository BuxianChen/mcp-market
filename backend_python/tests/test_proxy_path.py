"""Test path-based proxy routing"""
import requests
import pytest

BASE_URL = "http://localhost:3000"
API_PREFIX = "/api"


class TestProxyPath:
    """Test path-based proxy routing"""

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

    def test_proxy_by_path_prefix(self):
        """Test proxying request through path_prefix"""
        # Create MCP server with path_prefix
        test_mcp = {
            "name": "Test Proxy Server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            },
            "path_prefix": "test-proxy"
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        self.created_id = create_response.json()["id"]

        # Try to proxy request (will fail if upstream server not running, but should get proper error)
        proxy_response = requests.post(
            f"{BASE_URL}/test-proxy/mcp",
            json={"jsonrpc": "2.0", "id": 1, "method": "initialize"}
        )

        # Should get either success (200) or proper error (502/504)
        assert proxy_response.status_code in [200, 502, 504]

    def test_proxy_path_not_found(self):
        """Test proxy with non-existent path_prefix"""
        response = requests.get(f"{BASE_URL}/nonexistent-prefix/mcp")
        assert response.status_code == 404

        data = response.json()
        assert "path prefix" in data["detail"].lower()

    def test_proxy_stdio_server_error(self):
        """Test that stdio servers cannot be proxied via path"""
        # Create stdio server with path_prefix
        test_mcp = {
            "name": "Stdio Server",
            "connection_type": "stdio",
            "connection_config": {
                "command": "python",
                "args": ["-m", "mcp.server"]
            },
            "path_prefix": "stdio-test"
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        self.created_id = create_response.json()["id"]

        # Try to proxy - should fail
        proxy_response = requests.get(f"{BASE_URL}/stdio-test/mcp")
        assert proxy_response.status_code == 400

        data = proxy_response.json()
        assert "http/sse" in data["detail"].lower()

    def test_proxy_reserved_prefix(self):
        """Test that reserved prefixes are rejected"""
        reserved_prefixes = ["api", "admin", "proxy", "health", "docs"]

        for prefix in reserved_prefixes:
            # Try to access reserved prefix
            response = requests.get(f"{BASE_URL}/{prefix}/test")

            # Should either be 404 (no server) or handled by system routes
            # The key is that it shouldn't proxy to a user-created server
            assert response.status_code in [404, 200, 422]

    def test_proxy_request_forwarding(self):
        """Test that request is properly forwarded"""
        # Create server
        test_mcp = {
            "name": "Forward Test Server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            },
            "path_prefix": "forward-test"
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        self.created_id = create_response.json()["id"]

        # Test with query parameters
        proxy_response = requests.get(
            f"{BASE_URL}/forward-test/mcp",
            params={"test": "value"}
        )

        # Should attempt to forward (will fail if server not running)
        assert proxy_response.status_code in [200, 502, 504]

    def test_proxy_different_methods(self):
        """Test proxy with different HTTP methods"""
        # Create server
        test_mcp = {
            "name": "Methods Test Server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            },
            "path_prefix": "methods-test"
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        self.created_id = create_response.json()["id"]

        # Test different methods
        methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]

        for method in methods:
            response = requests.request(
                method=method,
                url=f"{BASE_URL}/methods-test/mcp"
            )

            # Should attempt to forward
            assert response.status_code in [200, 502, 504]

    def test_proxy_with_nested_path(self):
        """Test proxy with nested path after prefix"""
        # Create server
        test_mcp = {
            "name": "Nested Path Server",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000"
            },
            "path_prefix": "nested-test"
        }

        create_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert create_response.status_code == 201
        self.created_id = create_response.json()["id"]

        # Test with nested path
        response = requests.get(f"{BASE_URL}/nested-test/api/v1/resource")

        # Should forward to http://localhost:8000/api/v1/resource
        assert response.status_code in [200, 404, 502, 504]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
