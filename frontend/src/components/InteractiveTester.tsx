import React, { useState, useEffect } from 'react';
import { mcpApi } from '../api/mcp';
import type { McpServer, Tool, Resource, Prompt, SessionInfo } from '../types/mcp';
import { ToolCallPanel } from './ToolCallPanel';
import { ResourceBrowser } from './ResourceBrowser';
import { PromptTester } from './PromptTester';

interface InteractiveTesterProps {
  server: McpServer;
  onClose: () => void;
}

type TabType = 'tools' | 'resources' | 'prompts';

export const InteractiveTester: React.FC<InteractiveTesterProps> = ({ server, onClose }) => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('tools');

  const [tools, setTools] = useState<Tool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    initSession();
    return () => {
      if (session) {
        mcpApi.closeSession(server.id, session.id).catch(console.error);
      }
    };
  }, []);

  const initSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create session
      const sessionInfo = await mcpApi.createSession(server.id);
      setSession(sessionInfo);

      // Load capabilities
      await loadCapabilities(sessionInfo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const loadCapabilities = async (sessionId: string) => {
    try {
      // Load tools
      const testResult = await mcpApi.testMcp(server.id);
      if (testResult.capabilities?.tools) {
        setTools(testResult.capabilities.tools);
        if (testResult.capabilities.tools.length > 0) {
          setSelectedTool(testResult.capabilities.tools[0]);
        }
      }

      // Load resources
      try {
        const resourceList = await mcpApi.listResources(server.id, sessionId);
        setResources(resourceList);
        if (resourceList.length > 0) {
          setSelectedResource(resourceList[0]);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      }

      // Load prompts
      try {
        const promptList = await mcpApi.listPrompts(server.id, sessionId);
        setPrompts(promptList);
        if (promptList.length > 0) {
          setSelectedPrompt(promptList[0]);
        }
      } catch (err) {
        console.error('Failed to load prompts:', err);
      }
    } catch (err) {
      console.error('Failed to load capabilities:', err);
    }
  };

  const handleClose = async () => {
    if (session) {
      try {
        await mcpApi.closeSession(server.id, session.id);
      } catch (err) {
        console.error('Failed to close session:', err);
      }
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">正在建立连接...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">连接失败</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{server.name} - 交互式测试</h2>
            {session && (
              <p className="text-sm text-gray-500">
                会话 ID: {session.id.substring(0, 8)}...
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - List */}
          <div className="w-64 border-r flex flex-col">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'tools'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                工具 ({tools.length})
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'resources'
                    ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                资源 ({resources.length})
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'prompts'
                    ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                提示 ({prompts.length})
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'tools' && (
                <div className="p-2">
                  {tools.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">无可用工具</p>
                  ) : (
                    tools.map((tool) => (
                      <button
                        key={tool.name}
                        onClick={() => setSelectedTool(tool)}
                        className={`w-full text-left p-2 rounded mb-1 ${
                          selectedTool?.name === tool.name
                            ? 'bg-blue-100 border border-blue-300'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-sm">{tool.name}</div>
                        {tool.description && (
                          <div className="text-xs text-gray-600 truncate">{tool.description}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="p-2">
                  {resources.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">无可用资源</p>
                  ) : (
                    resources.map((resource) => (
                      <button
                        key={resource.uri}
                        onClick={() => setSelectedResource(resource)}
                        className={`w-full text-left p-2 rounded mb-1 ${
                          selectedResource?.uri === resource.uri
                            ? 'bg-green-100 border border-green-300'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-sm">{resource.name || resource.uri}</div>
                        <div className="text-xs text-gray-600 truncate">{resource.uri}</div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prompts' && (
                <div className="p-2">
                  {prompts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">无可用提示</p>
                  ) : (
                    prompts.map((prompt) => (
                      <button
                        key={prompt.name}
                        onClick={() => setSelectedPrompt(prompt)}
                        className={`w-full text-left p-2 rounded mb-1 ${
                          selectedPrompt?.name === prompt.name
                            ? 'bg-purple-100 border border-purple-300'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-sm">{prompt.name}</div>
                        {prompt.description && (
                          <div className="text-xs text-gray-600 truncate">{prompt.description}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'tools' && selectedTool && session && (
              <ToolCallPanel
                tool={selectedTool}
                serverId={server.id}
                sessionId={session.id}
              />
            )}

            {activeTab === 'resources' && selectedResource && session && (
              <ResourceBrowser
                resource={selectedResource}
                serverId={server.id}
                sessionId={session.id}
              />
            )}

            {activeTab === 'prompts' && selectedPrompt && session && (
              <PromptTester
                prompt={selectedPrompt}
                serverId={server.id}
                sessionId={session.id}
              />
            )}

            {((activeTab === 'tools' && !selectedTool) ||
              (activeTab === 'resources' && !selectedResource) ||
              (activeTab === 'prompts' && !selectedPrompt)) && (
              <div className="flex items-center justify-center h-full text-gray-500">
                请从左侧选择一个项目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
