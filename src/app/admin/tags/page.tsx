'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Plus,
  Edit,
  Trash2,
  Tag as TagIcon,
  Folder,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 导入TanStack Query hooks
import {
  useTags,
  useCategories,
  useTagsCategoriesStats,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useBatchDeleteTagsMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useBatchDeleteCategoriesMutation
} from '@/hooks/queries/useTags';

// 数据类型定义
interface Tag {
  id: string;
  name: string;
  created_at: string;
  _count?: {
    media_tags: number;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  _count?: {
    media: number;
  };
}

// 标签管理组件
function TagManagement({ isActive }: { isActive: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch', data: Tag | null }>({ type: 'single', data: null });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // TanStack Query hooks
  const { data: tags = [], isLoading, error, refetch } = useTags(searchTerm);
  const createTagMutation = useCreateTagMutation();
  const updateTagMutation = useUpdateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();
  const batchDeleteTagsMutation = useBatchDeleteTagsMutation();

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingTag) {
        await updateTagMutation.mutateAsync({
          id: editingTag.id,
          name: formData.name.trim()
        });
      } else {
        await createTagMutation.mutateAsync(formData.name.trim());
      }

      setIsCreateDialogOpen(false);
      setEditingTag(null);
      setFormData({ name: '' });
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  // 删除标签
  const handleDelete = (tag: Tag) => {
    setDeleteTarget({ type: 'single', data: tag });
    setIsDeleteDialogOpen(true);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedTags.length === 0) return;
    setDeleteTarget({ type: 'batch', data: null });
    setIsDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'single' && deleteTarget.data) {
        await deleteTagMutation.mutateAsync(deleteTarget.data.id);
      } else if (deleteTarget.type === 'batch') {
        await batchDeleteTagsMutation.mutateAsync(selectedTags);
        setSelectedTags([]);
      }

      setIsDeleteDialogOpen(false);
      setDeleteTarget({ type: 'single', data: null });
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  // 切换标签选择
  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    setSelectedTags(selectedTags.length === tags.length ? [] : tags.map(tag => tag.id));
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">加载标签数据失败，请稍后重试</p>
          <Button onClick={() => refetch()} className="mt-2">
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {selectedTags.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={batchDeleteTagsMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除选中 ({selectedTags.length})
            </Button>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <Button onClick={() => {
            setEditingTag(null);
            setFormData({ name: '' });
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            创建标签
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? '编辑标签' : '创建标签'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">标签名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="请输入标签名称"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingTag(null);
                    setFormData({ name: '' });
                  }}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={createTagMutation.isPending || updateTagMutation.isPending}
                >
                  {(createTagMutation.isPending || updateTagMutation.isPending) && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  {editingTag ? '更新' : '创建'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 标签列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            标签管理
          </CardTitle>

          {tags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedTags.length === tags.length ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              全选
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TagIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无标签数据</p>
              <p className="text-sm">点击"创建标签"按钮开始添加标签</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => toggleTagSelection(tag.id)}
                    >
                      {selectedTags.includes(tag.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>

                    <div>
                      <h3 className="font-medium">{tag.name}</h3>
                      <p className="text-sm text-gray-500">
                        使用次数: {tag._count?.media_tags || 0} •
                        创建时间: {new Date(tag.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTag(tag);
                        setFormData({ name: tag.name });
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                      disabled={deleteTagMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget.type === 'single' && deleteTarget.data
                ? `确定要删除标签"${deleteTarget.data.name}"吗？此操作无法撤销。`
                : `确定要删除选中的 ${selectedTags.length} 个标签吗？此操作无法撤销。`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTagMutation.isPending || batchDeleteTagsMutation.isPending}
            >
              {(deleteTagMutation.isPending || batchDeleteTagsMutation.isPending) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 分类管理组件
function CategoryManagement({ isActive }: { isActive: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch', data: Category | null }>({ type: 'single', data: null });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // TanStack Query hooks
  const { data: categories = [], isLoading, error, refetch } = useCategories(searchTerm);
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const batchDeleteCategoriesMutation = useBatchDeleteCategoriesMutation();

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        });
      }

      setIsCreateDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  // 删除分类
  const handleDelete = (category: Category) => {
    setDeleteTarget({ type: 'single', data: category });
    setIsDeleteDialogOpen(true);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedCategories.length === 0) return;
    setDeleteTarget({ type: 'batch', data: null });
    setIsDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'single' && deleteTarget.data) {
        await deleteCategoryMutation.mutateAsync(deleteTarget.data.id);
      } else if (deleteTarget.type === 'batch') {
        await batchDeleteCategoriesMutation.mutateAsync(selectedCategories);
        setSelectedCategories([]);
      }

      setIsDeleteDialogOpen(false);
      setDeleteTarget({ type: 'single', data: null });
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  // 切换分类选择
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    setSelectedCategories(selectedCategories.length === categories.length ? [] : categories.map(category => category.id));
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">加载分类数据失败，请稍后重试</p>
          <Button onClick={() => refetch()} className="mt-2">
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {selectedCategories.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={batchDeleteCategoriesMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除选中 ({selectedCategories.length})
            </Button>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <Button onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            创建分类
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? '编辑分类' : '创建分类'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">分类名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入分类名称"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">分类描述（可选）</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入分类描述"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '' });
                  }}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  {editingCategory ? '更新' : '创建'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 分类列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            分类管理
          </CardTitle>

          {categories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedCategories.length === categories.length ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              全选
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无分类数据</p>
              <p className="text-sm">点击"创建分类"按钮开始添加分类</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => toggleCategorySelection(category.id)}
                    >
                      {selectedCategories.includes(category.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>

                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        使用次数: {category._count?.media || 0} •
                        创建时间: {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
                        setFormData({
                          name: category.name,
                          description: category.description || ''
                        });
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget.type === 'single' && deleteTarget.data
                ? `确定要删除分类"${deleteTarget.data.name}"吗？此操作无法撤销。`
                : `确定要删除选中的 ${selectedCategories.length} 个分类吗？此操作无法撤销。`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategoryMutation.isPending || batchDeleteCategoriesMutation.isPending}
            >
              {(deleteCategoryMutation.isPending || batchDeleteCategoriesMutation.isPending) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 主页面组件
export default function TagsCategoriesPage() {
  const [activeTab, setActiveTab] = useState('tags');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">标签与分类管理</h1>
        <p className="text-gray-600">管理系统中的标签和分类，用于内容分类和组织</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            标签管理
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            分类管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags">
          <TagManagement isActive={activeTab === 'tags'} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement isActive={activeTab === 'categories'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}