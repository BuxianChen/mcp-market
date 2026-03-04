"""Weather tools for MCP Server (simulated data)"""
import random
from typing import Dict, Any


def get_weather(city: str) -> Dict[str, Any]:
    """Get weather information for a city (simulated).

    Args:
        city: City name

    Returns:
        Dictionary with weather information
    """
    # Simulate weather data
    conditions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy"]
    temperature = random.randint(-10, 35)
    condition = random.choice(conditions)
    humidity = random.randint(30, 90)

    return {
        "city": city,
        "temperature": temperature,
        "condition": condition,
        "humidity": humidity,
        "unit": "Celsius",
        "note": "This is simulated weather data for demonstration purposes"
    }
