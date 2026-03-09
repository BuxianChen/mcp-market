import React, { useState, useEffect } from 'react';
import { mcpApi } from '../api/mcp';
import type { McpServer } from '../types/mcp';

interface AccessLogsProps {
  server: McpServer;
  onClose: () => void;
}

interface AccessLog {
  id: number;
  server_id: number;
  token_id: number | null;
  action: string;
  tool_name: string | null;
  resource_uri: string | null;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  timestamp: string;
}

export const AccessLogs: React.FC<AccessLogsProps> = ({ server, onClose }) => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [offset]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await mcpApi.getAccessLogs(server.id, limit, offset);
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      call_tool: '调用工具',
      read_resource: '读取资源',
      get_prompt: '获取提示',
    };
    return labels[action] || action;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{server.name} - 访问日志</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无访问日志</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">时间</th>
                    <th className="px-4 py-2 text-left">操作</th>
                    <th className="px-4 py-2 text-left">详情</th>
                    <th className="px-4 py-2 text-left">状态</th>
                    <th className="px-4 py-2 text-left">耗时</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-2">{getActionLabel(log.action)}</td>
                      <td className="px-4 py-2">
                        {log.tool_name && (
                          <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                            {log.tool_name}
                          </span>
                        )}
                        {log.resource_uri && (
                          <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded">
                            {log.resource_uri}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-2 font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? '✓ 成功' : '✗ 失败'}
                        {log.error_message && (
                          <div className="text-xs text-red-600 mt-1">{log.error_message}</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {log.duration_ms !== null ? `${log.duration_ms}ms` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">
                显示 {offset + 1} - {offset + logs.length}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={logs.length < limit}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
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
