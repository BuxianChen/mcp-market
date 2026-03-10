import React, { useState } from 'react';
import type { CreateMcpServerInput, ConnectionType, McpServer } from '../types/mcp';

interface AddMcpFormProps {
  onSubmit: (input: CreateMcpServerInput) => void;
  onCancel: () => void;
  editingMcp?: McpServer | null;
}

export const AddMcpForm: React.FC<AddMcpFormProps> = ({ onSubmit, onCancel, editingMcp }) => {
  const [name, setName] = useState(editingMcp?.name || '');
  const [description, setDescription] = useState(editingMcp?.description || '');
  const [connectionType, setConnectionType] = useState<ConnectionType>(editingMcp?.connection_type || 'http');
  const [url, setUrl] = useState(
    editingMcp?.connection_config.type !== 'stdio' ? editingMcp?.connection_config.url || '' : ''
  );
  const [command, setCommand] = useState(
    editingMcp?.connection_config.type === 'stdio' ? editingMcp?.connection_config.command || '' : ''
  );
  const [args, setArgs] = useState(
    editingMcp?.connection_config.type === 'stdio' ? editingMcp?.connection_config.args?.join(' ') || '' : ''
  );
  const [pathPrefix, setPathPrefix] = useState(editingMcp?.path_prefix || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let connection_config;
    if (connectionType === 'stdio') {
      connection_config = {
        type: 'stdio' as const,
        command,
        args: args ? args.split(' ').filter(Boolean) : undefined
      };
    } else {
      connection_config = {
        type: connectionType,
        url,
        timeout: 10000
      };
    }

    onSubmit({
      name,
      description: description || undefined,
      connection_type: connectionType,
      connection_config,
      path_prefix: pathPrefix || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {editingMcp ? '编辑 MCP Server' : '添加 MCP Server'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  连接类型 *
                </label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value as ConnectionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                  <option value="stdio">STDIO</option>
                </select>
              </div>

              {connectionType !== 'stdio' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="http://localhost:3001/mcp"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      路径前缀（可选）
                    </label>
                    <input
                      type="text"
                      value={pathPrefix}
                      onChange={(e) => setPathPrefix(e.target.value.toLowerCase())}
                      placeholder="weather"
                      pattern="^[a-z0-9-]*$"
                      minLength={3}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      用于生成代理地址，如：http://your-server:4000/{pathPrefix || 'prefix'}/mcp
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      仅支持小写字母、数字和连字符���长度 3-50 字符
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      命令 *
                    </label>
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="node"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      参数（空格分隔）
                    </label>
                    <input
                      type="text"
                      value={args}
                      onChange={(e) => setArgs(e.target.value)}
                      placeholder="server.js --port 3001"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                {editingMcp ? '更新' : '添加'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
