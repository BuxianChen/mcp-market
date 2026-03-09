import React, { useState } from 'react';
import { mcpApi } from '../api/mcp';
import type { Prompt } from '../types/mcp';

interface PromptTesterProps {
  prompt: Prompt;
  serverId: number;
  sessionId: string;
}

export const PromptTester: React.FC<PromptTesterProps> = ({
  prompt,
  serverId,
  sessionId,
}) => {
  const [args, setArgs] = useState<string>('{}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetPrompt = async () => {
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

      // Get prompt
      const promptResult = await mcpApi.getPrompt(serverId, sessionId, {
        promptName: prompt.name,
        arguments: parsedArgs,
      });

      setResult(promptResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultArgs = () => {
    if (!prompt.arguments || prompt.arguments.length === 0) {
      return '{}';
    }

    const defaultArgs: Record<string, any> = {};
    for (const arg of prompt.arguments) {
      if (arg.name) {
        defaultArgs[arg.name] = '';
      }
    }

    return JSON.stringify(defaultArgs, null, 2);
  };

  const handleGenerateDefault = () => {
    setArgs(generateDefaultArgs());
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Prompt Info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold">{prompt.name}</h3>
        {prompt.description && <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>}
      </div>

      {/* Arguments Info */}
      {prompt.arguments && prompt.arguments.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">参数定义</label>
            <button
              onClick={handleGenerateDefault}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              生成默认参数
            </button>
          </div>
          <div className="bg-gray-50 p-2 rounded border">
            {prompt.arguments.map((arg: any, index: number) => (
              <div key={index} className="text-sm mb-2">
                <span className="font-medium">{arg.name}</span>
                {arg.description && (
                  <span className="text-gray-600"> - {arg.description}</span>
                )}
                {arg.required && <span className="text-red-500 ml-1">*</span>}
              </div>
            ))}
          </div>
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

      {/* Get Button */}
      <div className="mb-4">
        <button
          onClick={handleGetPrompt}
          disabled={loading}
          className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '获取中...' : '获取提示'}
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
        <div className="flex-1 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">生成结果</label>
          <div
            className={`p-3 rounded border ${
              result.success ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-sm font-semibold ${
                  result.success ? 'text-purple-800' : 'text-red-800'
                }`}
              >
                {result.success ? '✓ 成功' : '✗ 失败'}
              </span>
            </div>
            {result.error && (
              <p className="text-sm text-red-700 mb-2">{result.error}</p>
            )}
            {result.messages && (
              <div className="space-y-2">
                {result.messages.map((message: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="text-xs text-gray-500 mb-1">
                      {message.role || 'message'}
                    </div>
                    {message.content && (
                      <div className="text-sm">
                        {typeof message.content === 'string' ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(message.content, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
