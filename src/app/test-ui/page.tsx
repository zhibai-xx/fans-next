'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function TestUIPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const { toast } = useToast();

  const showToast = (variant: 'default' | 'destructive') => {
    toast({
      title: variant === 'default' ? '成功' : '错误',
      description: variant === 'default' ? '这是一个成功消息！' : '这是一个错误消息！',
      variant,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">shadcn/ui 组件展示</h1>

      {/* 按钮组件 */}
      <Card>
        <CardHeader>
          <CardTitle>按钮组件</CardTitle>
          <CardDescription>各种样式的按钮展示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>默认按钮</Button>
            <Button variant="outline">轮廓按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="destructive">危险按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
            <Button variant="link">链接按钮</Button>
            <Button size="sm">小按钮</Button>
            <Button size="lg">大按钮</Button>
            <Button disabled>禁用按钮</Button>
          </div>
        </CardContent>
      </Card>

      {/* 表单组件 */}
      <Card>
        <CardHeader>
          <CardTitle>表单组件</CardTitle>
          <CardDescription>输入框、标签和文本区域</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="test-input">测试输入框</Label>
              <Input
                id="test-input"
                placeholder="请输入内容"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-textarea">文本区域</Label>
              <Textarea
                id="test-textarea"
                placeholder="请输入多行文本"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>选择器</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择一个选项" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">选项 1</SelectItem>
                  <SelectItem value="option2">选项 2</SelectItem>
                  <SelectItem value="option3">选项 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 标签组件 */}
      <Card>
        <CardHeader>
          <CardTitle>标签组件</CardTitle>
          <CardDescription>各种样式的标签</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>默认标签</Badge>
            <Badge variant="secondary">次要标签</Badge>
            <Badge variant="destructive">危险标签</Badge>
            <Badge variant="outline">轮廓标签</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 选项卡组件 */}
      <Card>
        <CardHeader>
          <CardTitle>选项卡组件</CardTitle>
          <CardDescription>标签页切换展示</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tab1">标签 1</TabsTrigger>
              <TabsTrigger value="tab2">标签 2</TabsTrigger>
              <TabsTrigger value="tab3">标签 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <p>这是标签 1 的内容。展示了 shadcn/ui Tabs 组件的基本用法。</p>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <p>这是标签 2 的内容。可以放置任何 React 组件。</p>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <p>这是标签 3 的内容。支持响应式设计。</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Toast 和 Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>交互组件</CardTitle>
          <CardDescription>Toast 消息和对话框</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => showToast('default')}>
              显示成功消息
            </Button>
            <Button
              variant="destructive"
              onClick={() => showToast('destructive')}
            >
              显示错误消息
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">打开对话框</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>示例对话框</DialogTitle>
                  <DialogDescription>
                    这是一个使用 shadcn/ui Dialog 组件的示例对话框。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-input">对话框输入</Label>
                    <Input id="dialog-input" placeholder="在对话框中输入" />
                  </div>
                  <Button className="w-full">确认</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* 使用情况总结 */}
      <Card>
        <CardHeader>
          <CardTitle>集成状态</CardTitle>
          <CardDescription>shadcn/ui 在项目中的使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅ 已集成</Badge>
              <span>图片页面 - Select 和 Toast 组件</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅ 已集成</Badge>
              <span>上传组件 - Button 组件</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅ 已集成</Badge>
              <span>个人页面 - Tabs 组件</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅ 已集成</Badge>
              <span>登录页面 - Input、Label、Button 组件</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✅ 已集成</Badge>
              <span>全局 - Toaster 组件</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 