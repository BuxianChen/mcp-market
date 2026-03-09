import React, { useState } from 'react';
import { mcpApi } from '../api/mcp';
import type { Tool } from '../types/mcp';

interface ToolCallPanelProps {
  tool: Tool;
  serverId: number;
  sessionId: string;
}

interface CallHistory {
  timestamp: Date;
  toolName: string;
  arguments: Record<string, any>;
  result: any;
  success: boolean;
  error?: string;
}

export const ToolCallPanel: React.FC<ToolCallPanelProps> = ({ tool, serverId, sessionId }) => {
  const [args, setArgs] = useState<string>('{}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CallHistory[]>([]);

  const handleCall = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse arguments
      let parsedArgs: Record<string, any>;
      try {
        parsedArgs = JSON.parse(args);
      } catch (err) {
        setError('参数格式错误，请输入有效的 JSON');
        return;
      }

      // Call tool
      const callResult = await mcpApi.callTool(serverId, sessionId, {
        toolName: tool.name,
        arguments: parsedArgs,
      });

      setResult(callResult);

      // Add to history
      setHistory((prev) => [
        {
          timestamp: new Date(),
          toolName: tool.name,
          arguments: parsedArgs,
          result: callResult.content,
          success: callResult.success,
          error: callResult.error,
        },
        ...prev.slice(0, 9), // Keep last 10
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '调用失败');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultArgs = () => {
    if (!tool.inputSchema || !tool.inputSchema.properties) {
      return '{}';
    }

    const defaultArgs: Record<string, any> = {};
    const properties = tool.inputSchema.properties;

    for (const [key, schema] of Object.entries(properties)) {
      const propSchema = schema as any;
      if (propSchema.type === 'string') {
        defaultArgs[key] = propSchema.default || '';
      } else if (propSchema.type === 'number') {
        defaultArgs[key] = propSchema.default || 0;
      } else if (propSchema.type === 'boolean') {
        defaultArgs[key] = propSchema.default || false;
      } else if (propSchema.type === 'array') {
        defaultArgs[key] = propSchema.default || [];
      } else if (propSchema.type === 'object') {
        defaultArgs[key] = propSchema.default || {};
      }
    }

    return JSON.stringify(defaultArgs, null, 2);
  };

  const handleGenerateDefault = () => {
    setArgs(generateDefaultArgs());
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Tool Info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold">{tool.name}</h3>
        {tool.description && <p className="text-sm text-gray-600 mt-1">{tool.description}</p>}
      </div>

      {/* Input Schema */}
      {tool.inputSchema && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">参数 Schema</label>
            <button
              onClick={handleGenerateDefault}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              生成默认参数
            </button>
          </div>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto border">
            {JSON.stringify(tool.inputSchema, null, 2)}
          </pre>
        </div>
      )}

      {/* Arguments Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">参数 (JSON)</label>
        <textarea
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          className="w-full h-32 p-2 border rounded font-mono text-sm"
          placeholder='{"key": "value"}'
        />
      </div>

      {/* Call Button */}
      <div className="mb-4">
        <button
          onClick={handleCall}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '调用中...' : '执行工具'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">执行结果</label>
          <div
            className={`p-3 rounded border ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-sm font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success ? '✓ 成功' : '✗ 失败'}
              </span>
            </div>
            {result.error && (
              <p className="text-sm text-red-700 mb-2">{result.error}</p>
            )}
            {result.content && (
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto border">
                {JSON.stringify(result.content, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">历史记录</label>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              清空
            </button>
          </div>
          <div className="space-y-2">
            {history.map((item, index) => (
              <div key={index} className="bg-gray-50 p-2 rounded border text-xs">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{item.toolName}</span>
                  <span className="text-gray-500">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="mb-1">
                  <span className="text-gray-600">参数: </span>
                  <code className="bg-white px-1 rounded">
                    {JSON.stringify(item.arguments)}
                  </code>
                </div>
                <div
                  className={`${
                    item.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {item.success ? '✓ 成功' : `✗ ${item.error}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
