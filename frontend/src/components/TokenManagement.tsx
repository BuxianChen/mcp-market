import React, { useState, useEffect } from 'react';
import { mcpApi } from '../api/mcp';
import type { McpServer } from '../types/mcp';

interface TokenManagementProps {
  server: McpServer;
  onClose: () => void;
}

interface Token {
  id: number;
  token: string;
  server_id: number;
  name: string | null;
  permissions: string[];
  expires_at: string | null;
  created_at: string;
}

export const TokenManagement: React.FC<TokenManagementProps> = ({ server, onClose }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPermissions, setNewTokenPermissions] = useState<string[]>(['tools', 'resources', 'prompts']);
  const [createdToken, setCreatedToken] = useState<Token | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const data = await mcpApi.listTokens(server.id);
      setTokens(data);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      const token = await mcpApi.createToken(server.id, {
        name: newTokenName || undefined,
        permissions: newTokenPermissions,
      });
      setCreatedToken(token);
      setNewTokenName('');
      setNewTokenPermissions(['tools', 'resources', 'prompts']);
      setShowCreateForm(false);
      await loadTokens();
    } catch (error) {
      alert('创建 Token 失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDeleteToken = async (tokenId: number) => {
    if (!confirm('确定要删除这个 Token 吗？')) return;

    try {
      await mcpApi.deleteToken(server.id, tokenId);
      await loadTokens();
    } catch (error) {
      alert('删除 Token 失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const togglePermission = (permission: string) => {
    if (newTokenPermissions.includes(permission)) {
      setNewTokenPermissions(newTokenPermissions.filter((p) => p !== permission));
    } else {
      setNewTokenPermissions([...newTokenPermissions, permission]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{server.name} - Token 管理</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Created Token Display */}
          {createdToken && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-bold text-green-800 mb-2">Token 创建成功！</h3>
              <p className="text-sm text-green-700 mb-2">
                请立即复制并保存此 Token，关闭后将无法再次查看完整 Token。
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createdToken.token}
                  readOnly
                  className="flex-1 p-2 border rounded font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(createdToken.token)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  复制
                </button>
              </div>
              <button
                onClick={() => setCreatedToken(null)}
                className="mt-2 text-sm text-green-700 hover:text-green-900"
              >
                关闭提示
              </button>
            </div>
          )}

          {/* Create Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              创建新 Token
            </button>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-4 p-4 bg-gray-50 border rounded">
              <h3 className="font-bold mb-3">创建新 Token</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">名称（可选）</label>
                <input
                  type="text"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="例如：生产环境 Token"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">权限</label>
                <div className="space-y-2">
                  {['tools', 'resources', 'prompts'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTokenPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="mr-2"
                      />
                      <span className="capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateToken}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Tokens List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">还没有创建任何 Token</div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.id} className="p-4 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{token.name || '未命名 Token'}</h4>
                      <p className="text-sm text-gray-500">
                        创建于: {new Date(token.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteToken(token.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Token: </span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {token.token.substring(0, 16)}...
                    </code>
                  </div>
                  <div className="flex gap-2">
                    {token.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
