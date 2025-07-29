'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { UploadRecord, ResubmitData } from '@/types/upload-record';
import { UploadRecordService } from '@/services/upload-record.service';
import { ReviewService } from '@/services/review.service';

interface ResubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: UploadRecord | null;
  onSuccess: () => void;
}

export const ResubmitModal: React.FC<ResubmitModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ResubmitData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 初始化表单数据
  useEffect(() => {
    if (record && isOpen) {
      setFormData({
        title: record.title,
        description: record.description || '',
        category_id: record.category?.id || '',
        tag_ids: record.tags.map(tag => tag.id)
      });
      setSelectedTags(record.tags.map(tag => tag.id));
    }
  }, [record, isOpen]);

  // 加载分类和标签
  useEffect(() => {
    if (isOpen) {
      loadCategoriesAndTags();
    }
  }, [isOpen]);

  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        ReviewService.getAllCategories(),
        ReviewService.getAllTags()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('加载分类和标签失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setIsLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        tag_ids: selectedTags
      };

      await UploadRecordService.resubmitRecord(record.id, submitData);
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || '重新提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClose = () => {
    setFormData({});
    setSelectedTags([]);
    setError(null);
    onClose();
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            重新提交内容
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 审核备注回顾 */}
          {record.review_comment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">审核备注</h4>
              <p className="text-sm text-yellow-700">{record.review_comment}</p>
              {record.reviewer && (
                <p className="text-xs text-yellow-600 mt-2">
                  审核员：{record.reviewer.nickname || record.reviewer.username}
                </p>
              )}
            </div>
          )}

          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入内容标题"
              required
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入内容描述"
              rows={3}
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label>分类</Label>
            <Select
              value={formData.category_id || 'none'}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  category_id: value === 'none' ? '' : value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer ${isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100'
                        }`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                      {isSelected && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              点击标签进行选择/取消，已选择 {selectedTags.length} 个标签
            </p>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title?.trim()}
            >
              {isLoading ? '提交中...' : '重新提交'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 