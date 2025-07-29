'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaService } from '@/services/media.service';

export default function TestApiPage() {
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string>('');

  const testApi = async () => {
    setApiStatus('testing');
    setError('');
    setResults({});

    const tests = [
      {
        name: '获取媒体列表',
        test: () => MediaService.getMediaList({ take: 5 })
      },
      {
        name: '获取标签列表',
        test: () => MediaService.getAllTags()
      },
      {
        name: '获取分类列表',
        test: () => MediaService.getAllCategories()
      }
    ];

    const testResults: any = {};

    for (const test of tests) {
      try {
        console.log(`开始测试: ${test.name}`);
        const result = await test.test();
        testResults[test.name] = { status: 'success', data: result };
        console.log(`${test.name} 成功:`, result);
      } catch (error) {
        console.error(`${test.name} 失败:`, error);
        testResults[test.name] = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    setResults(testResults);

    // 检查是否有任何测试失败
    const hasErrors = Object.values(testResults).some((result: any) => result.status === 'error');
    setApiStatus(hasErrors ? 'error' : 'success');
  };

  useEffect(() => {
    // 页面加载时自动测试
    testApi();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔌 API 连接测试
          </h1>
          <p className="text-gray-600">
            测试前端与后端API的连接状态
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 连接状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {apiStatus === 'idle' && '⏳'}
                {apiStatus === 'testing' && '🔄'}
                {apiStatus === 'success' && '✅'}
                {apiStatus === 'error' && '❌'}
                连接状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>后端地址:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    http://localhost:3000/api
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>状态:</span>
                  <span className={`font-semibold ${apiStatus === 'success' ? 'text-green-600' :
                      apiStatus === 'error' ? 'text-red-600' :
                        apiStatus === 'testing' ? 'text-blue-600' :
                          'text-gray-600'
                    }`}>
                    {apiStatus === 'idle' && '待测试'}
                    {apiStatus === 'testing' && '测试中...'}
                    {apiStatus === 'success' && '连接正常'}
                    {apiStatus === 'error' && '连接失败'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testApi}
                disabled={apiStatus === 'testing'}
                className="w-full"
              >
                {apiStatus === 'testing' ? '测试中...' : '重新测试'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 测试结果 */}
        <div className="space-y-4">
          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <Card key={testName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {result.status === 'success' ? '✅' : '❌'}
                  {testName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.status === 'success' ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">响应数据:</div>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="text-sm font-medium mb-1">错误信息:</div>
                    <div className="text-sm">{result.error}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">错误详情</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-red-600 whitespace-pre-wrap">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 测试说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• 确保后端服务正在运行 (http://localhost:3000)</p>
            <p>• 确保数据库连接正常</p>
            <p>• 检查CORS设置是否允许前端访问</p>
            <p>• 如果测试失败，请检查控制台错误信息</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 