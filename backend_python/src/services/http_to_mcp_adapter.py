import json
import re
from typing import Any, Optional

import httpx
from jsonpath_ng import parse


class HttpToMcpAdapter:
    """Adapter to convert HTTP APIs into MCP tools"""

    def __init__(self):
        self.client = httpx.AsyncClient()

    async def execute_http_call(
        self,
        method: str,
        url: str,
        headers: Optional[dict[str, str]],
        arguments: dict[str, Any],
        response_mapping: Optional[dict[str, str]] = None,
    ) -> Any:
        """Execute HTTP call with variable substitution"""
        # Substitute variables in URL
        final_url = self._substitute_variables(url, arguments)

        # Substitute variables in headers
        final_headers = {}
        if headers:
            for key, value in headers.items():
                final_headers[key] = self._substitute_variables(value, arguments)

        # Prepare request body for POST/PUT/PATCH
        body = None
        if method.upper() in ["POST", "PUT", "PATCH"]:
            body = arguments

        # Execute HTTP request
        response = await self.client.request(
            method=method.upper(),
            url=final_url,
            headers=final_headers,
            json=body if body else None,
        )

        response.raise_for_status()

        # Parse response
        response_data = response.json()

        # Apply response mapping if provided
        if response_mapping:
            return self._apply_response_mapping(response_data, response_mapping)

        return response_data

    def _substitute_variables(self, template: str, arguments: dict[str, Any]) -> str:
        """Substitute ${arg.name} variables in template"""

        def replacer(match):
            var_path = match.group(1)
            if var_path.startswith("arg."):
                key = var_path[4:]  # Remove "arg." prefix
                value = arguments.get(key)
                return str(value) if value is not None else match.group(0)
            elif var_path.startswith("env."):
                # Environment variables not supported in this implementation
                return match.group(0)
            return match.group(0)

        return re.sub(r"\$\{([^}]+)\}", replacer, template)

    def _apply_response_mapping(self, response_data: Any, mapping: dict[str, str]) -> dict[str, Any]:
        """Apply JSONPath mapping to response data"""
        result = {}

        for key, jsonpath_expr in mapping.items():
            try:
                jsonpath = parse(jsonpath_expr)
                matches = jsonpath.find(response_data)
                if matches:
                    # If multiple matches, return list; otherwise return single value
                    if len(matches) == 1:
                        result[key] = matches[0].value
                    else:
                        result[key] = [match.value for match in matches]
                else:
                    result[key] = None
            except Exception as e:
                result[key] = f"Error: {str(e)}"

        return result

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Singleton instance
http_to_mcp_adapter = HttpToMcpAdapter()
