import React, { useState, useEffect } from 'react';
import { McpCard } from './McpCard';
import { AddMcpForm } from './AddMcpForm';
import { TestMcpModal } from './TestMcpModal';
import { mcpApi } from '../api/mcp';
import type { McpServer, CreateMcpServerInput, McpTestResult } from '../types/mcp';

export const McpList: React.FC = () => {
  const [mcps, setMcps] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMcp, setEditingMcp] = useState<McpServer | null>(null);
  const [testResult, setTestResult] = useState<McpTestResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadMcps = async () => {
    try {
      setLoading(true);
      const data = await mcpApi.getAllMcps();
      setMcps(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMcps();
  }, []);

  const handleAdd = async (input: CreateMcpServerInput) => {
    try {
      if (editingMcp) {
        await mcpApi.updateMcp(editingMcp.id, input);
      } else {
        await mcpApi.createMcp(input);
      }
      setShowAddForm(false);
      setEditingMcp(null);
      await loadMcps();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleEdit = (mcp: McpServer) => {
    setEditingMcp(mcp);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个 MCP Server 吗？')) return;

    try {
      await mcpApi.deleteMcp(id);
      await loadMcps();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleTest = async (id: number) => {
    try {
      const result = await mcpApi.testMcp(id);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: '测试失败',
        error: err instanceof Error ? err.message : '未知错误'
      });
    }
  };

  const filteredMcps = mcps.filter(mcp =>
    mcp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mcp.description && mcp.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">MCP 市场平台</h1>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="搜索 MCP Server..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                setEditingMcp(null);
                setShowAddForm(true);
              }}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              添加 MCP Server
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredMcps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm ? '没有找到匹配的 MCP Server' : '还没有添加任何 MCP Server'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMcps.map(mcp => (
              <McpCard
                key={mcp.id}
                mcp={mcp}
                onTest={handleTest}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <AddMcpForm
          onSubmit={handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setEditingMcp(null);
          }}
          editingMcp={editingMcp}
        />
      )}

      {testResult && (
        <TestMcpModal
          result={testResult}
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
};
