import React, { useState, useEffect } from 'react';
import { mcpApi } from '../api/mcp';
import type { McpServer } from '../types/mcp';

interface HttpMappingConfigProps {
  server: McpServer;
  onClose: () => void;
}

interface HttpMapping {
  id: number;
  server_id: number;
  tool_name: string;
  tool_description: string | null;
  http_method: string;
  http_url: string;
  http_headers: string | null;
  input_schema: string;
  response_mapping: string | null;
  created_at: string;
  updated_at: string;
}

export const HttpMappingConfig: React.FC<HttpMappingConfigProps> = ({ server, onClose }) => {
  const [mappings, setMappings] = useState<HttpMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<HttpMapping | null>(null);

  // Form state
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpUrl, setHttpUrl] = useState('');
  const [httpHeaders, setHttpHeaders] = useState('{}');
  const [inputSchema, setInputSchema] = useState('{"type": "object", "properties": {}}');
  const [responseMapping, setResponseMapping] = useState('{}');

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await mcpApi.listHttpMappings(server.id);
      setMappings(data.mappings || []);
    } catch (error) {
      console.error('Failed to load mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMapping(null);
    setToolName('');
    setToolDescription('');
    setHttpMethod('GET');
    setHttpUrl('');
    setHttpHeaders('{}');
    setInputSchema('{"type": "object", "properties": {}}');
    setResponseMapping('{}');
    setShowForm(true);
  };

  const handleEdit = (mapping: HttpMapping) => {
    setEditingMapping(mapping);
    setToolName(mapping.tool_name);
    setToolDescription(mapping.tool_description || '');
    setHttpMethod(mapping.http_method);
    setHttpUrl(mapping.http_url);
    setHttpHeaders(mapping.http_headers || '{}');
    setInputSchema(mapping.input_schema);
    setResponseMapping(mapping.response_mapping || '{}');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      // Validate JSON fields
      JSON.parse(httpHeaders);
      JSON.parse(inputSchema);
      JSON.parse(responseMapping);

      const data = {
        toolName,
        toolDescription: toolDescription || undefined,
        httpMethod,
        httpUrl,
        httpHeaders: JSON.parse(httpHeaders),
        inputSchema: JSON.parse(inputSchema),
        responseMapping: JSON.parse(responseMapping),
      };

      if (editingMapping) {
        await mcpApi.updateHttpMapping(server.id, editingMapping.id, data);
      } else {
        await mcpApi.createHttpMapping(server.id, data);
      }

      setShowForm(false);
      await loadMappings();
    } catch (error) {
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDelete = async (mappingId: number) => {
    if (!confirm('确定要删除这个映射吗？')) return;

    try {
      await mcpApi.deleteHttpMapping(server.id, mappingId);
      await loadMappings();
    } catch (error) {
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{server.name} - HTTP 映射配置</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!showForm && (
            <button
              onClick={handleCreate}
              className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              创建新映射
            </button>
          )}

          {showForm && (
            <div className="mb-4 p-4 bg-gray-50 border rounded">
              <h3 className="font-bold mb-3">{editingMapping ? '编辑映射' : '创建新映射'}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">工具名称</label>
                  <input
                    type="text"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="例如：get_weather"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">HTTP 方法</label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">工具描述</label>
                  <input
                    type="text"
                    value={toolDescription}
                    onChange={(e) => setToolDescription(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="例如：获取指定城市的天气信息"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">HTTP URL</label>
                  <input
                    type="text"
                    value={httpUrl}
                    onChange={(e) => setHttpUrl(e.target.value)}
                    className="w-full p-2 border rounded font-mono text-sm"
                    placeholder="例如：https://api.example.com/weather?city=${arg.city}"
                  />
                  <p className="text-xs text-gray-500 mt-1">使用 $&#123;arg.参数名&#125; 引用输入参数</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">HTTP Headers (JSON)</label>
                  <textarea
                    value={httpHeaders}
                    onChange={(e) => setHttpHeaders(e.target.value)}
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={3}
                    placeholder='{"Authorization": "Bearer ${arg.token}"}'
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Input Schema (JSON Schema)</label>
                  <textarea
                    value={inputSchema}
                    onChange={(e) => setInputSchema(e.target.value)}
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={5}
                    placeholder='{"type": "object", "properties": {"city": {"type": "string"}}}'
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Response Mapping (JSONPath, 可选)</label>
                  <textarea
                    value={responseMapping}
                    onChange={(e) => setResponseMapping(e.target.value)}
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={3}
                    placeholder='{"temperature": "$.data.temp", "description": "$.data.weather[0].description"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">使用 JSONPath 提取响应中的字段</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Mappings List */}
          {!showForm && (
            loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : mappings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">还没有创建任何映射</div>
            ) : (
              <div className="space-y-3">
                {mappings.map((mapping) => (
                  <div key={mapping.id} className="p-4 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-lg">{mapping.tool_name}</h4>
                        <p className="text-sm text-gray-600">{mapping.tool_description || '无描述'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium">方法: </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {mapping.http_method}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">URL: </span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{mapping.http_url}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
