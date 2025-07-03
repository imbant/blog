// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: "imbAnt's blog",
    description: '技术博客，记录语言服务器(LSP)开发、VS Code/Cursor 插件开发、生成式 AI 与 Agent 技术、前端开发和 golang',
    site: context.site,
    items: posts.map((post) => {
      const date = new Date(post.data.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return {
        ...post.data,
        link: `/blog/${year}/${month}/${day}/${post.slug}/`,
      };
    }),
  });
}