import React, { useState } from 'react';
import { mcpApi } from '../api/mcp';
import type { Resource } from '../types/mcp';

interface ResourceBrowserProps {
  resource: Resource;
  serverId: number;
  sessionId: string;
}

export const ResourceBrowser: React.FC<ResourceBrowserProps> = ({
  resource,
  serverId,
  sessionId,
}) => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRead = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await mcpApi.readResource(serverId, sessionId, resource.uri);

      if (result.success) {
        setContent(result.contents);
      } else {
        setError(result.error || '读取失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取失败');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (contents: any[]) => {
    if (!contents || contents.length === 0) {
      return <p className="text-gray-500">无内容</p>;
    }

    return contents.map((item, index) => {
      if (item.text) {
        return (
          <div key={index} className="mb-4">
            <div className="text-xs text-gray-500 mb-1">文本内容</div>
            <pre className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
              {item.text}
            </pre>
          </div>
        );
      }

      if (item.blob) {
        return (
          <div key={index} className="mb-4">
            <div className="text-xs text-gray-500 mb-1">
              二进制内容 ({item.mimeType || 'unknown'})
            </div>
            <div className="bg-white p-3 rounded border text-sm text-gray-600">
              Base64: {item.blob.substring(0, 100)}...
            </div>
          </div>
        );
      }

      return (
        <div key={index} className="mb-4">
          <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      );
    });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Resource Info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold">{resource.name || resource.uri}</h3>
        <p className="text-sm text-gray-600 mt-1 font-mono">{resource.uri}</p>
        {resource.description && (
          <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
        )}
      </div>

      {/* Read Button */}
      <div className="mb-4">
        <button
          onClick={handleRead}
          disabled={loading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '读取中...' : '读取资源'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Content */}
      {content && (
        <div className="flex-1 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
          <div className="bg-gray-50 p-3 rounded border">
            {renderContent(content)}
          </div>
        </div>
      )}
    </div>
  );
};
