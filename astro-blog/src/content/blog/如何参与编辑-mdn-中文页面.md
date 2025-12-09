---
title: "如何参与编辑 mdn 中文页面"
date: "2023-03-16"
tags: ["杂谈"]
description: "1. 拷贝 `yari` 的[仓库](https://github.com/mdn/yari)。`yari` 是用于构建 MDN Web Docs 的库"
---


1. 拷贝 `yari` 的[仓库](https://github.com/mdn/yari)。`yari` 是用于构建 MDN Web Docs 的库
2. 根据 `README` 分别拷贝 `conent` 和 `translated-content` 两个库。可以理解为分别是原文和译文
3. 在 `yari` 仓库中启动项目，它会链接 `conent` 和 `translated-content` 的内容，跑一个 mdn 的本地版
4. 改动 `translated-content` 这个库。具体改哪个文件，可以参考原文的 URL 结构，比如网站中 `zh-CN/docs/Web/API/Server-sent_events` 位于仓库的 `/files/zh-cn/web/api/server-sent_events/` 目录下
5. 提交代码，提 PR

## 参考资料：

[zh-ch 本地化指南](https://github.com/mdn/translated-content/blob/main/docs/zh-cn/translation-guide.md)

[如何预览编辑](https://github.com/mdn/translated-content#setting-up-to-edit)

[如何使用宏](https://developer.mozilla.org/zh-CN/docs/MDN/Writing_guidelines/Page_structures/Macros)