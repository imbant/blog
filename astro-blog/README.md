# imbAnt's Blog (Astro)

个人技术博客，已从 Hexo 迁移到 Astro 框架。

- 基于 [Astro](https://astro.build/) 构建的静态网站
- 使用 GitHub Action 持续集成服务
- 部署在 GitHub Pages 上
- 支持 RSS 订阅、SEO 优化、评论系统

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建网站
npm run build

# 预览构建结果
npm run preview
```

## 功能特性

- ✅ 路由兼容：保持与 Hexo 相同的 URL 结构 `/:year/:month/:day/:title/`
- ✅ SEO 优化：meta 标签、sitemap、robots.txt
- ✅ RSS 订阅：`/rss.xml`
- ✅ 评论系统：集成 giscus
- ✅ 归档页面：按年份分组的文章列表
- ✅ 响应式设计：支持移动端和桌面端
- ✅ 代码高亮：使用 Shiki
- ✅ 快速构建：Astro 的优化构建性能

## 文章创建

在 `src/content/blog/` 目录下创建新的 Markdown 文件：

```markdown
---
title: "文章标题"
date: "2025-01-01"
tags: ["标签1", "标签2"]
description: "文章描述"
---

文章内容...
```

## 部署

推送到 `main` 或 `master` 分支会自动触发 GitHub Actions 部署到 GitHub Pages。

## 迁移说明

已成功从 Hexo 迁移到 Astro，保持了：
- 所有文章的 URL 路径兼容性
- 评论系统（giscus）
- SEO 功能
- RSS 订阅
- 所有现有内容