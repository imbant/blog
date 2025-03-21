---
title: LSP 与 VS Code 插件开发（一）语言服务器架构
date: 2024-8-24
tags: [LSP, VS Code, 语言服务器协议]
---

这是《LSP 与 VS Code 插件开发》系列文章的第一篇。
第一篇：[语言服务器架构](/blog/2024/08/24/LSP1/)
第二篇：[语义构建](/blog/2024/12/31/LSP2/)
第三篇：[语言服务器协议](/blog/2025/01/17/LSP3/)
第四篇：[开发小技巧](/blog/2025/03/21/LSP4/)

## 背景

我是一名语言服务器开发者、VS Code 插件开发者。
我开发了这款[插件](https://marketplace.visualstudio.com/items?itemName=craftLandstudio.ffugclanguage)。它集成了一个基于 `LSP` 的语言服务器，可以为自研编程语言提供智能编程功能。

如果这些名词对你来说还很陌生，可以考虑这个问题：
当你在电脑上首次安装 VS Code，创建一个 `.vue` 文件，会发现在其中编写代码是非常困难的——体验几乎和面试时要求你白板写代码一样痛苦！

- 黑纸白字，变量都是一个颜色
- 想要打印日志，需要在键盘上按 `c`-`o`-`n`-`s`-`o`-`l`-`e`-`.`-`l`-`o`-`g` 一共 11 次，才能输入需要的函数名
- 单词拼错了，console 拼成 consol**a**，webpack 编译报错，但编辑器没有错误提示

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/plaintext.png)

这太痛苦了！单独写 HTML 或者 JS 都没问题，为什么 vue 文件就这么难写呢？

这时你搜索到一个插件：`Vue - Official`，安装后，这些问题都解决了：变量、标签都有了各自的颜色，输入 `con` 就能补全出 `console`，写错的 `consola` 也被红色波浪线标识了。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/installextension.png)

这些功能叫做

- 语法高亮
- 语义高亮
- 代码补全
- 错误提示

当你深入使用 VS Code 编码后，会发现更多智能编程功能，比如

- 跳转到定义
- 悬浮提示
- 查找引用/查找实现
- 函数签名提示
- 重命名
- ...

Vue 插件做了哪些事情，才让你的编程体验变得如此美好呢？为什么一定要安装插件才能有这些功能呢？为什么 `.ts`、`.html` 文件就不用安装插件？

这就引出了另一个问题：

假设你要发布一门全新的技术，引领新的技术潮流，用户需要在全新类型的文件中编码——就和 `.vue` 还有 `.astro` 做的事情一样，那你一定要解决这个问题：避免用户在全新文件中编码时，体验和白板写代码一样痛苦。

问题来了，你要怎么做？需要写一个 VS Code 插件吗？如何实现这些智能编程功能？那些喜欢用 Vim 写代码的人又怎么办？

## VS Code 插件 —— 能用 js 实现的，最终都会用 js 实现

> Any application that can be written in JavaScript, will eventually be written in JavaScript - Jeff Atwood

我们先从 VS Code 入手，看看它是如何设计，使得开发者能接入新语言的：它通过出色的插件系统，将内部代码封装成接口暴露出来，供插件调用。这些 API 就包括了高亮、代码补全、错误提示等等功能。这些功能都是数据驱动的，换句话说，这些智能编程功能，具体是由 VS Code 开发者一行一行代码实现的，将输入数据转化为 DOM 操作；而插件开发者无需关注细节，只需要提供符合格式的数据即可。

例如，你可以写一个简单的插件，让注释里的 `TODO` 高亮显示：逻辑非常简单，匹配文本中的 TODO 字符，记录它的行列号，给出高亮的颜色。事实上这个简单的插件已经[有人写了](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight)，并且有 400w+ 的下载量。

从技术栈来说，VS Code 是一个 Electron 应用，由 `HTML`、`CSS` 和 `JS` 构建。这意味着那些强大的智能编程功能，都可以由前端技术栈实现，只需要学习一些 VS Code API，你就能开发出自己语言的插件。

#### HTML、CSS、JS 的内置支持

回答刚才的问题，为什么 VS Code 认识 HTML 文件？同样是前端技术构建的应用，VS Code 已经对常见的代码文件有了内置的支持——内置了 [`ts`](https://github.com/microsoft/vscode/tree/main/extensions/typescript-language-features)、[`css`](https://github.com/microsoft/vscode/tree/main/extensions/css-language-features)、[`html`](https://github.com/microsoft/vscode/tree/main/extensions/html-language-features) 的插件，天然支持这些语言的智能编程功能。你可以在 VS Code 内按 `F1`，输入`Show Built-in Extensions`，查看全部内置插件。

#### 插件架构

![](https://code.visualstudio.com/assets/api/language-extensions/language-server-extension-guide/lsp-illustration.png)

先看这张图的左边：Electron 应用有主进程和渲染进程之分；我们看到的编辑器窗口，就是一个渲染进程。渲染进程又新开了一个插件专用的子进程，叫做 `Extension Host`，你用 Node.js 编写的插件就在这个子进程中运行。

打开你的 VS Code，看看你现在有多少个插件？我有 73 个。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/extensionCount.png)

事实上，这 73 个插件都运行在**同一个**进程，也就是 `Extension Host` 里。这意味着

1. 插件行为与渲染进程独立，插件通过 IPC 影响页面表现，插件 crash 不会影响到用户正常编码（只是智能编程功能可能就挂了，例如写 TS 时偶尔会遇到悬浮提示、代码补全都一直 loading）。
2. 各个插件之间共享上下文。碰到过很有意思的情况是，我在自己的插件中部署了 Sentry，而它捕获到了 json 插件的报错。
3. 运行缓慢的插件，虽然不会拖慢渲染进行的速度，但由于提高了整体插件进程的开销，会拖累其他插件的速度。
4. 同样由于共享资源，单个插件处理 CPU 密集型任务时性能不好。

分享几个插件管理小技巧：

- 查看启动性能：VS Code 指令 `Show Running Extensions` 可以列出插件的启动时间，也有 Profile 能力，用来查看运行缓慢的插件。
- 二分法检查问题：当 VS Code 用起来总是有问题，还有个[二分查找法](https://code.visualstudio.com/blogs/2021/02/16/extension-bisect)功能，用来关闭一半的插件，看看问题是否解决。持续二分，直到找到问题插件。

<!-- #### 相关文档

这里就不堆砌官方的文档教程了。我只是想告诉你 Why and How。如果想尝试写一个使用 VS Code API 的插件，可以从[这个教程](https://code.visualstudio.com/api/get-started/your-first-extension)看起。相信等你看完全部教程，已经能成为插件高手，可以尝试动手解决一些日常开发中碰到的痛点了。 -->

## 语言服务器 —— 服务任何代码编辑器

前边提到了 VS Code 插件的一个痛点：处理 CPU 密集型任务时性能不好。而 VS Code 要求插件不能影响 UI 响应速度。
还有另一个问题，我们一直在讨论 VS Code 内的开发，又如何应对其他代码编辑器的用户？那些使用 Vim、Atom 的用户，难道要强制他们安装 VS Code 吗？这似乎也不是个优雅的方案。
此外还有更致命的问题，插件只能使用 JS 编写，可如果新技术并非使用相关的技术栈呢？
如何让 VS Code 支持 `Python`、`Java`、`Go` 等语言？Google 推广 `Go` 时，又该如何让多个编辑器支持这门语言？

微软想出一个方案来解决这三个问题：[Language Server Protocol（语言服务器协议）](https://microsoft.github.io/language-server-protocol/)。

![lsp](https://code.visualstudio.com/assets/api/language-extensions/language-server-extension-guide/lsp-languages-editors.png)

首先，创建一个独立进程：在独立进程中计算，来获取更多的 CPU 和内存资源，以提供语言服务。这个进程，我们叫做 `Language Server（语言服务器）`。由于是脱离了 VS Code 的独立进程，到底由什么编程语言编写就没有限制了。

那么编辑器（语言客户端）和语言服务器之间，就需要进程间的通信。如果你已经读过 VS Code 的官方教程就会发现，“用数据描述智能编程功能”是一件相当复杂的事情，双方需要相互告知大量且丰富的数据。

例如跳转到定义，客户端会告知当前光标的行列号、当前的文本内容；服务器需要返回定义的行列号。

![go to definition](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/gotodefinition.png)

这就需要一个协议，规定客户端和服务器之间通信的数据格式，这就是 `LSP` 了。它和 `HTTP` 协议有点类似，但更轻量，仅用于智能编程功能的通信。

#### 挟 LSP 以令编辑器

接下来就需要客户端，也就是代码编辑器们需要适配此协议了。LSP 是微软推出的标准，旗下的 VS Code 自然是首先支持的编辑器。Vim、Atom 等编辑器也有了很好的支持。

但推行这个标准不是一帆风顺的。BetBrains 家的付费编辑器，例如 WebStrom，对 LSP 的支持就[不太积极](https://plugins.jetbrains.com/docs/intellij/language-server-protocol.html)，从 2023 年，才开始支持部分 LSP 功能。

## 总结

![](https://code.visualstudio.com/assets/api/language-extensions/language-server-extension-guide/lsp-illustration.png)

现在，我们的 VS Code 语言插件的架构比较明了，重新看这张图：

- 左边是 VS Code，它的渲染进程起了子进程 `Extension Host`，运行多个插件
- 插件作为语言客户端，其业务逻辑非常薄，功能就是启动语言服务器，并基于 LSP 与语言服务器通信
- 语言服务器是一个独立进程，实现了最核心的业务逻辑，可以用任何编程语言编写，利用独立进程的算力，计算出客户端所需的数据，返回给客户端

说了这么多，其实还有一个核心问题没有解决：语言服务器做了什么事情？考虑刚才的跳转到定义的协议，客户端仅仅输入了当前光标的行列号和文本内容——甚至没有说明选中的是哪个函数、变量或是空白处，服务器就返回了其定义的行列号。

这种分析文本，返回结构化数据的过程，就是编译。语言服务器需要内置编译器吗？编译又是怎样的过程？我们下一章继续。

## 更多资料

我在播客 [`Web Worker`](https://www.xiaoyuzhoufm.com/episode/66a1197533ddcbb53cd7a063) 上和几位 Vue 生态的大佬、团队成员们聊过 Vue 插件，欢迎收听。

我也会在[即刻](https://okjk.co/OUqto1)分享语言服务器相关的开发心得，计划将它们整理成系列文章，欢迎关注。
