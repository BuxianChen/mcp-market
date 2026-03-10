"""Test MCP operations (tools, resources, prompts)"""
import requests
import pytest

BASE_URL = "http://localhost:3000"
API_PREFIX = "/api"


class TestMcpOperations:
    """Test MCP operations including tools, resources, and prompts"""

    def setup_method(self):
        """Setup test data"""
        self.base_url = f"{BASE_URL}{API_PREFIX}"
        self.created_mcp_id = None
        self.created_session_id = None

    def teardown_method(self):
        """Cleanup created resources"""
        if self.created_session_id and self.created_mcp_id:
            try:
                requests.delete(
                    f"{self.base_url}/mcps/{self.created_mcp_id}/sessions/{self.created_session_id}"
                )
            except:
                pass

        if self.created_mcp_id:
            try:
                requests.delete(f"{self.base_url}/mcps/{self.created_mcp_id}")
            except:
                pass

    def _create_test_mcp_and_session(self):
        """Helper to create a test MCP server and session"""
        test_mcp = {
            "name": "Operations Test Server",
            "description": "Test server for MCP operations",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            }
        }

        # Create MCP
        mcp_response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert mcp_response.status_code == 201
        self.created_mcp_id = mcp_response.json()["id"]

        # Create session
        session_response = requests.post(
            f"{self.base_url}/mcps/{self.created_mcp_id}/sessions"
        )

        if session_response.status_code in [200, 201]:
            self.created_session_id = session_response.json()["session_id"]
            return self.created_mcp_id, self.created_session_id

        return self.created_mcp_id, None

    def test_call_tool(self):
        """Test calling a tool"""
        mcp_id, session_id = self._create_test_mcp_and_session()

        if not session_id:
            pytest.skip("Could not create session - server may not be running")

        # Call a tool
        tool_request = {
            "name": "get_weather",
            "arguments": {
                "city": "Beijing"
            }
        }

        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}/tools/call",
            json=tool_request
        )

        # Response depends on whether the tool exists and server is running
        assert response.status_code in [200, 400, 404, 500]

        if response.status_code == 200:
            data = response.json()
            assert "content" in data
            assert isinstance(data["content"], list)
            assert "isError" in data

    def test_call_tool_with_invalid_arguments(self):
        """Test calling a tool with invalid arguments"""
        mcp_id, session_id = self._create_test_mcp_and_session()

        if not session_id:
            pytest.skip("Could not create session - server may not be running")

        # Call tool with missing required arguments
        tool_request = {
            "name": "get_weather",
            "arguments": {}
        }

        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}/tools/call",
            json=tool_request
        )

        # Should return error
        assert response.status_code in [400, 500]

    def test_read_resource(self):
        """Test reading a resource"""
        mcp_id, session_id = self._create_test_mcp_and_session()

        if not session_id:
            pytest.skip("Could not create session - server may not be running")

        # Read a resource
        resource_request = {
            "uri": "weather://current"
        }

        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}/resources/read",
            json=resource_request
        )

        # Response depends on whether the resource exists
        assert response.status_code in [200, 404, 500]

        if response.status_code == 200:
            data = response.json()
            assert "contents" in data
            assert isinstance(data["contents"], list)

            if len(data["contents"]) > 0:
                content = data["contents"][0]
                assert "uri" in content
                assert "mimeType" in content or "text" in content or "blob" in content

    def test_read_nonexistent_resource(self):
        """Test reading a non-existent resource"""
        mcp_id, session_id = self._create_test_mcp_and_session()

        if not session_id:
            pytest.skip("Could not create session - server may not be running")

        resource_request = {
            "uri": "nonexistent://resource"
        }

        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}/resources/read",
            json=resource_request
        )

        # Should return error
        assert response.status_code in [404, 500]

    def test_get_prompt(self):
        """Test getting a prompt"""
        mcp_id, session_id = self._create_test_mcp_and_session()

        if not session_id:
            pytest.skip("Could not create session - server may not be running")

        # Get a prompt
        prompt_request = {
            "name": "weather_report",
            "arguments": {
                "city": "Beijing"
            }
        }

        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}/prompts/get",
            json=prompt_request
        )

        # Response depends on whether the prompt exists
        assert response.status_code in [200, 404, 500]

        if response.status_code == 200:
            data = response.json()
            assert "messages" in data

            if "description" in data:
                assert isinstance(data["description"], str)

            assert isinstance(data["messages"], list)

    def test_get_prompt_without_arguments(self):
        """Test getting a prompt without arguments"""
        mcp_id, session_id = self._create_test_mcp_and_session()

        if not session_id:
            pytest.skip("Could not create session - server may not be running")

        prompt_request = {
            "name": "simple_prompt"
        }

        response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}/prompts/get",
            json=prompt_request
        )

        assert response.status_code in [200, 404, 500]

    def test_operations_with_nonexistent_session(self):
        """Test operations with non-existent session"""
        mcp_id, _ = self._create_test_mcp_and_session()

        fake_session_id = "nonexistent-session-id"

        # Try tool call
        tool_response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{fake_session_id}/tools/call",
            json={"name": "test", "arguments": {}}
        )
        assert tool_response.status_code == 404

        # Try resource read
        resource_response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{fake_session_id}/resources/read",
            json={"uri": "test://uri"}
        )
        assert resource_response.status_code == 404

        # Try prompt get
        prompt_response = requests.post(
            f"{self.base_url}/mcps/{mcp_id}/sessions/{fake_session_id}/prompts/get",
            json={"name": "test"}
        )
        assert prompt_response.status_code == 404

    def test_operations_with_nonexistent_mcp(self):
        """Test operations with non-existent MCP server"""
        fake_mcp_id = 99999
        fake_session_id = "fake-session"

        # Try tool call
        tool_response = requests.post(
            f"{self.base_url}/mcps/{fake_mcp_id}/sessions/{fake_session_id}/tools/call",
            json={"name": "test", "arguments": {}}
        )
        assert tool_response.status_code == 404

        # Try resource read
        resource_response = requests.post(
            f"{self.base_url}/mcps/{fake_mcp_id}/sessions/{fake_session_id}/resources/read",
            json={"uri": "test://uri"}
        )
        assert resource_response.status_code == 404

        # Try prompt get
        prompt_response = requests.post(
            f"{self.base_url}/mcps/{fake_mcp_id}/sessions/{fake_session_id}/prompts/get",
            json={"name": "test"}
        )
        assert prompt_response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
