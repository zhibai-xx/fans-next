'use client';

import React, { useState, useEffect } from 'react';
import { mediaService, type Tag } from '@/services/media.service';
import { handleApiError } from '@/lib/utils/error-handler';

export default function TestTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);

  // 获取所有标签
  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mediaService.getTags();
      setTags(response.tags || []);
    } catch (err) {
      setError(handleApiError(err, '获取标签失败'));
    } finally {
      setLoading(false);
    }
  };

  // 创建新标签
  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await mediaService.createTag(newTagName.trim());
      setTags([...tags, response.tag]);
      setNewTagName('');
    } catch (err) {
      setError(handleApiError(err, '创建标签失败'));
    }
  };

  // 搜索标签
  const searchTags = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await mediaService.searchTags(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setError(handleApiError(err, '搜索标签失败'));
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTags();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">标签管理测试页面</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 创建新标签 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">创建新标签</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="输入标签名称"
            className="flex-1 px-3 py-2 border rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && createTag()}
          />
          <button
            onClick={createTag}
            disabled={!newTagName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300"
          >
            创建标签
          </button>
        </div>
      </div>

      {/* 搜索标签 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">搜索标签</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="输入搜索关键词"
          className="w-full px-3 py-2 border rounded-lg mb-4"
        />
        {searchResults.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">搜索结果:</h3>
            <div className="flex flex-wrap gap-2">
              {searchResults.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 所有标签列表 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">所有标签 ({tags.length})</h2>
          <button
            onClick={fetchTags}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:bg-gray-300"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div key={tag.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-lg">{tag.name}</h3>
                <p className="text-sm text-gray-500">ID: {tag.id}</p>
                {tag.created_at && (
                  <p className="text-sm text-gray-500">
                    创建时间: {new Date(tag.created_at).toLocaleString()}
                  </p>
                )}
                {tag.usage_count !== undefined && (
                  <p className="text-sm text-gray-500">使用次数: {tag.usage_count}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && tags.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无标签数据
          </div>
        )}
      </div>
    </div>
  );
} 