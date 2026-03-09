"""
Simple Weather API Example

这是一个简单的 HTTP API 示例，用于演示 HTTP 转 MCP 功能。
提供天气查询、城市列表等 API 端点。
"""
from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

# 模拟天气数据
WEATHER_DATA = {
    "beijing": {
        "city": "Beijing",
        "temperature": 15,
        "condition": "Sunny",
        "humidity": 45,
        "wind_speed": 12,
        "last_updated": "2024-03-09T10:00:00Z"
    },
    "shanghai": {
        "city": "Shanghai",
        "temperature": 20,
        "condition": "Cloudy",
        "humidity": 60,
        "wind_speed": 8,
        "last_updated": "2024-03-09T10:00:00Z"
    },
    "guangzhou": {
        "city": "Guangzhou",
        "temperature": 25,
        "condition": "Rainy",
        "humidity": 75,
        "wind_speed": 15,
        "last_updated": "2024-03-09T10:00:00Z"
    },
    "shenzhen": {
        "city": "Shenzhen",
        "temperature": 26,
        "condition": "Partly Cloudy",
        "humidity": 70,
        "wind_speed": 10,
        "last_updated": "2024-03-09T10:00:00Z"
    }
}


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        "status": "ok",
        "service": "weather-api",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/weather/<city>', methods=['GET'])
def get_weather(city):
    """
    获取指定城市的天气信息

    路径参数:
        city: 城市名称（英文）

    返回:
        JSON 格式的天气数据
    """
    city_lower = city.lower()

    if city_lower in WEATHER_DATA:
        return jsonify({
            "success": True,
            "data": WEATHER_DATA[city_lower]
        })
    else:
        return jsonify({
            "success": False,
            "error": f"City '{city}' not found",
            "available_cities": list(WEATHER_DATA.keys())
        }), 404


@app.route('/api/weather', methods=['GET'])
def get_weather_by_query():
    """
    通过查询参数获取天气信息

    查询参数:
        city: 城市名称（英文）

    返回:
        JSON 格式的天气数据
    """
    city = request.args.get('city', '')

    if not city:
        return jsonify({
            "success": False,
            "error": "Missing 'city' parameter"
        }), 400

    city_lower = city.lower()

    if city_lower in WEATHER_DATA:
        return jsonify({
            "success": True,
            "data": WEATHER_DATA[city_lower]
        })
    else:
        return jsonify({
            "success": False,
            "error": f"City '{city}' not found",
            "available_cities": list(WEATHER_DATA.keys())
        }), 404


@app.route('/api/cities', methods=['GET'])
def list_cities():
    """
    列出所有可用城市

    返回:
        城市列表
    """
    cities = [
        {
            "name": data["city"],
            "key": key
        }
        for key, data in WEATHER_DATA.items()
    ]

    return jsonify({
        "success": True,
        "data": {
            "cities": cities,
            "total": len(cities)
        }
    })


@app.route('/api/weather/batch', methods=['POST'])
def get_weather_batch():
    """
    批量获取多个城市的天气信息

    请求体:
        {
            "cities": ["beijing", "shanghai"]
        }

    返回:
        多个城市的天气数据
    """
    data = request.get_json()

    if not data or 'cities' not in data:
        return jsonify({
            "success": False,
            "error": "Missing 'cities' in request body"
        }), 400

    cities = data['cities']
    results = []

    for city in cities:
        city_lower = city.lower()
        if city_lower in WEATHER_DATA:
            results.append({
                "city": city,
                "success": True,
                "data": WEATHER_DATA[city_lower]
            })
        else:
            results.append({
                "city": city,
                "success": False,
                "error": "City not found"
            })

    return jsonify({
        "success": True,
        "data": {
            "results": results,
            "total": len(results)
        }
    })


if __name__ == '__main__':
    print("Starting Weather API on http://localhost:5000")
    print("Endpoints:")
    print("  GET  /health")
    print("  GET  /api/weather/<city>")
    print("  GET  /api/weather?city=<city>")
    print("  GET  /api/cities")
    print("  POST /api/weather/batch")

    app.run(host='0.0.0.0', port=5000, debug=True)
