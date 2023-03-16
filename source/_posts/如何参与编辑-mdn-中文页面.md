---
title: 如何参与编辑-mdn-中文页面
date: 2023-03-16 10:00:00
tags: [杂谈]
---

1. 拷贝 `yari` 的[仓库](https://github.com/mdn/yari)。`yari` 是 MDN 开发的用于构建 developer.mozilla.org 的库
2. 根据 `README` 分别拷贝 `conent` 和 `translated-content` 两个库。可以理解为分别是英文内容和本地化内容
3. 在 `yari` 仓库中启动项目，跑一个 mdn 的本地版
4. 改动 `translated-content` 这个库。具体改哪个文件，可以参考原文的 URL 结构，比如 `zh-CN/docs/Web/API/Server-sent_events` 位于类似的目录下
5. 提交代码，提 PR

注意 RP 礼仪等