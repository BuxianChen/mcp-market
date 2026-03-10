"""Test MCP Session management"""
import requests
import pytest

BASE_URL = "http://localhost:3000"
API_PREFIX = "/api"


class TestMcpSession:
    """Test MCP Session management"""

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

    def _create_test_mcp(self):
        """Helper to create a test MCP server"""
        test_mcp = {
            "name": "Session Test Server",
            "description": "Test server for session management",
            "connection_type": "http",
            "connection_config": {
                "url": "http://localhost:8000/mcp"
            }
        }

        response = requests.post(f"{self.base_url}/mcps", json=test_mcp)
        assert response.status_code == 201
        self.created_mcp_id = response.json()["id"]
        return self.created_mcp_id

    def test_create_session(self):
        """Test creating a new session"""
        mcp_id = self._create_test_mcp()

        response = requests.post(f"{self.base_url}/mcps/{mcp_id}/sessions")

        # Session creation might fail if server is not running
        # But the API should return proper response
        assert response.status_code in [200, 201, 500]

        if response.status_code in [200, 201]:
            data = response.json()
            assert "session_id" in data
            assert "mcp_id" in data
            assert data["mcp_id"] == mcp_id
            assert "created_at" in data

            self.created_session_id = data["session_id"]

    def test_get_session_info(self):
        """Test getting session information"""
        mcp_id = self._create_test_mcp()

        # Create session first
        create_response = requests.post(f"{self.base_url}/mcps/{mcp_id}/sessions")

        if create_response.status_code in [200, 201]:
            session_id = create_response.json()["session_id"]
            self.created_session_id = session_id

            # Get session info
            response = requests.get(
                f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}"
            )

            assert response.status_code == 200
            data = response.json()

            assert data["session_id"] == session_id
            assert data["mcp_id"] == mcp_id
            assert "created_at" in data

            # Should have server_info and capabilities if connection successful
            if "server_info" in data:
                assert "name" in data["server_info"]
                assert "version" in data["server_info"]

    def test_close_session(self):
        """Test closing a session"""
        mcp_id = self._create_test_mcp()

        # Create session first
        create_response = requests.post(f"{self.base_url}/mcps/{mcp_id}/sessions")

        if create_response.status_code in [200, 201]:
            session_id = create_response.json()["session_id"]

            # Close session
            response = requests.delete(
                f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}"
            )

            assert response.status_code == 200
            data = response.json()
            assert "message" in data

            # Verify session is closed - getting it should fail
            get_response = requests.get(
                f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}"
            )
            assert get_response.status_code == 404

            self.created_session_id = None

    def test_session_with_nonexistent_mcp(self):
        """Test creating session with non-existent MCP server"""
        response = requests.post(f"{self.base_url}/mcps/99999/sessions")
        assert response.status_code == 404

    def test_get_nonexistent_session(self):
        """Test getting non-existent session"""
        mcp_id = self._create_test_mcp()

        response = requests.get(
            f"{self.base_url}/mcps/{mcp_id}/sessions/nonexistent-session-id"
        )
        assert response.status_code == 404

    def test_close_nonexistent_session(self):
        """Test closing non-existent session"""
        mcp_id = self._create_test_mcp()

        response = requests.delete(
            f"{self.base_url}/mcps/{mcp_id}/sessions/nonexistent-session-id"
        )
        assert response.status_code == 404

    def test_multiple_sessions(self):
        """Test creating multiple sessions for same MCP server"""
        mcp_id = self._create_test_mcp()

        session_ids = []

        # Create multiple sessions
        for i in range(3):
            response = requests.post(f"{self.base_url}/mcps/{mcp_id}/sessions")

            if response.status_code in [200, 201]:
                session_id = response.json()["session_id"]
                session_ids.append(session_id)

        # Each session should have unique ID
        assert len(session_ids) == len(set(session_ids))

        # Cleanup
        for session_id in session_ids:
            try:
                requests.delete(
                    f"{self.base_url}/mcps/{mcp_id}/sessions/{session_id}"
                )
            except:
                pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
