# MCP Server 示例

这是一个简单的 MCP Server 实现，提供计算器、天气查询和文本处理工具。

## 环境要求

- Python 3.10+
- pip

## 安装

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

## 运行

```bash
python -m src.server
```

服务器将在 http://localhost:3001 启动。

## 可用工具

### 计算器工具
- `add(a, b)` - 加法
- `subtract(a, b)` - 减法
- `multiply(a, b)` - 乘法
- `divide(a, b)` - 除法

### 天气工具
- `get_weather(city)` - 获取城市天气（模拟数据）

### 文本工具
- `to_upper_case(text)` - 转大写
- `to_lower_case(text)` - 转小写
- `reverse_text(text)` - 反转字符串
- `word_count(text)` - 统计字数

## 在 MCP 市场中使用

1. 启动此 MCP Server
2. 在 MCP 市场 Web 界面中添加：
   - 名称: Example MCP Server
   - 类型: SSE
   - URL: http://localhost:3001/mcp
3. 点击"测试连接"查看可用工具
