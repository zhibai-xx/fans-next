'use client';

import React, { useState, useEffect } from 'react';
import { mediaService, type Tag } from '@/services/media.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>创建新标签</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入标签名称"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && createTag()}
            />
            <Button
              onClick={createTag}
              disabled={!newTagName.trim()}
            >
              创建标签
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 搜索标签 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>搜索标签</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入搜索关键词"
            className="mb-4"
          />
          {searchResults.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">搜索结果:</h3>
              <div className="flex flex-wrap gap-2">
                {searchResults.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 所有标签列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>所有标签 ({tags.length})</CardTitle>
            <Button
              onClick={fetchTags}
              disabled={loading}
              variant="secondary"
            >
              {loading ? <LoadingSpinner size="sm" /> : '刷新'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8">
              <LoadingSpinner className="justify-center" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <Card key={tag.id}>
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && tags.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无标签数据
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 