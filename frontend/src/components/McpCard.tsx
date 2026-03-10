import React from 'react';
import type { McpServer } from '../types/mcp';

interface McpCardProps {
  mcp: McpServer;
  onTest: (id: number) => void;
  onInteractiveTest: (mcp: McpServer) => void;
  onTokenManagement: (mcp: McpServer) => void;
  onAccessLogs: (mcp: McpServer) => void;
  onHttpMapping: (mcp: McpServer) => void;
  onEdit: (mcp: McpServer) => void;
  onDelete: (id: number) => void;
}

export const McpCard: React.FC<McpCardProps> = ({ mcp, onTest, onInteractiveTest, onTokenManagement, onAccessLogs, onHttpMapping, onEdit, onDelete }) => {
  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'http': return 'bg-blue-100 text-blue-800';
      case 'sse': return 'bg-green-100 text-green-800';
      case 'stdio': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{mcp.name}</h3>
          <p className="text-gray-600 text-sm mb-3">
            {mcp.description || '暂无描述'}
          </p>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getConnectionTypeColor(mcp.connection_type)}`}>
              {mcp.connection_type.toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(mcp.status)}`}>
              {mcp.status === 'active' ? '活跃' : '未激活'}
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        创建时间: {new Date(mcp.created_at).toLocaleString('zh-CN')}
      </div>

      {(mcp.connection_type === 'http' || mcp.connection_type === 'sse') && (
        <div className="mb-4 space-y-2">
          {/* 原始地址 */}
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-1 font-medium">原始地址：</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-gray-700 break-all flex-1">
                {(mcp.connection_config as { url: string }).url}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText((mcp.connection_config as { url: string }).url);
                  alert('已复制到剪贴板');
                }}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 bg-white rounded border border-gray-300 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                复制
              </button>
            </div>
          </div>

          {/* 代理地址 */}
          {mcp.path_prefix && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-gray-600 mb-1 font-medium">代理地址：</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-blue-700 break-all flex-1">
                  http://localhost:3000/{mcp.path_prefix}/mcp
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/${mcp.path_prefix}/mcp`);
                    alert('已复制到剪贴板');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-white rounded border border-blue-300 hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  复制
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                路径前缀: <span className="font-mono text-blue-600">{mcp.path_prefix}</span>
              </p>
            </div>
          )}

          {/* 未设置代理提示 */}
          {!mcp.path_prefix && (
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-700">
                未设置路径前缀，点击"编辑"可添加代理地址
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onTest(mcp.id)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
          >
            测试连接
          </button>
          <button
            onClick={() => onInteractiveTest(mcp)}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
          >
            交互式测试
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onTokenManagement(mcp)}
            className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors text-sm"
          >
            Token 管理
          </button>
          <button
            onClick={() => onAccessLogs(mcp)}
            className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors text-sm"
          >
            访问日志
          </button>
        </div>
        {mcp.connection_type === 'http' && (
          <div className="flex gap-2">
            <button
              onClick={() => onHttpMapping(mcp)}
              className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors text-sm"
            >
              配置映射
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(mcp)}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            编辑
          </button>
          <button
            onClick={() => onDelete(mcp.id)}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
};
