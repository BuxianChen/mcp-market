import React from 'react';
import type { McpServer } from '../types/mcp';

interface McpCardProps {
  mcp: McpServer;
  onTest: (id: number) => void;
  onEdit: (mcp: McpServer) => void;
  onDelete: (id: number) => void;
}

export const McpCard: React.FC<McpCardProps> = ({ mcp, onTest, onEdit, onDelete }) => {
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

      <div className="flex gap-2">
        <button
          onClick={() => onTest(mcp.id)}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
        >
          测试连接
        </button>
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
  );
};
