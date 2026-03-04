import React from 'react';
import type { McpTestResult } from '../types/mcp';

interface TestMcpModalProps {
  result: McpTestResult | null;
  onClose: () => void;
}

export const TestMcpModal: React.FC<TestMcpModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">测试结果</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className={`p-4 rounded mb-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✓ 连接成功' : '✗ 连接失败'}
              </span>
            </div>
            <p className={`mt-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>
            {result.error && (
              <p className="mt-2 text-red-600 text-sm font-mono bg-red-100 p-2 rounded">
                {result.error}
              </p>
            )}
          </div>

          {result.success && result.serverInfo && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">服务器信息</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">名称:</span>
                    <span className="ml-2 font-medium">{result.serverInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">版本:</span>
                    <span className="ml-2 font-medium">{result.serverInfo.version}</span>
                  </div>
                  {result.serverInfo.protocolVersion && (
                    <div>
                      <span className="text-gray-600">协议版本:</span>
                      <span className="ml-2 font-medium">{result.serverInfo.protocolVersion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {result.capabilities && (
            <div className="space-y-4">
              {result.capabilities.tools && result.capabilities.tools.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    可用工具 ({result.capabilities.tools.length})
                  </h3>
                  <div className="space-y-2">
                    {result.capabilities.tools.map((tool, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded">
                        <div className="font-medium text-blue-900">{tool.name}</div>
                        {tool.description && (
                          <div className="text-sm text-blue-700 mt-1">{tool.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.capabilities.resources && result.capabilities.resources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    可用资源 ({result.capabilities.resources.length})
                  </h3>
                  <div className="space-y-2">
                    {result.capabilities.resources.map((resource, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded">
                        <div className="font-medium text-green-900">{resource.name || resource.uri}</div>
                        <div className="text-sm text-green-700 mt-1 font-mono">{resource.uri}</div>
                        {resource.description && (
                          <div className="text-sm text-green-700 mt-1">{resource.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.capabilities.prompts && result.capabilities.prompts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    可用提示 ({result.capabilities.prompts.length})
                  </h3>
                  <div className="space-y-2">
                    {result.capabilities.prompts.map((prompt, index) => (
                      <div key={index} className="bg-purple-50 p-3 rounded">
                        <div className="font-medium text-purple-900">{prompt.name}</div>
                        {prompt.description && (
                          <div className="text-sm text-purple-700 mt-1">{prompt.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
