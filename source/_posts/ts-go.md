---
title: 用 Go 移植 TypeScript 的重要影响
date: 2025-05-07
tags: [GitHub Copilot, Go, TypeScript, LSP, MCP, tsc]
toc: true
---

三月有个大新闻，官方要[用 Go 移植 TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/)，号称性能提升 10 倍。

我想从语言服务器开发者的角度聊聊，这个项目的重要影响，以及它将如何影响 AI 辅助编程。

## TypeScript 用户：更流畅的编程体验和构建速度

社区有很多选择什么语言的争论，有人说微软应该选择自家的 C#，有人说应该选择更贴近前端新时代生态的 Rust。这之中有官方对移植和维护成本的考量，但不论具体选什么，只要是原生语言，性能都好过 JavaScript。

tsc 编译性能的提升自不必说，在构建 Web 前端应用、Node.js 应用时，都需要把 TypeScript 编译为 JavaScript。这也是官方博文中最先提出的：编译 VS Code 源码的速度提升了 10.4 倍。

![10 faster ts](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/ts-go/10xts.png)

另外，在 VS Code、Cursor 这样的代码编辑器中编码时，TypeScript 也在基于 LSP 提供语言服务，具体来说是通过一个被称为 tsserver 的语言服务器实现的。

> 如果你对 LSP、智能编程不熟悉，可以参考我写的[语言服务器系列教程](/blog/2024/08/24/LSP1/)

在每次按键时的代码补全、跳转到定义、错误提示等等，都需要 tsserver 编译和分析，并提供实时反馈。

受限于 JavaScript 动态语言的性能，在大型应用中，语言服务器会有性能瓶颈，这也是在写代码时，有时补全很慢才能出来的原因。而利用原生语言，加上 ts 自身的优秀架构和设计，这一点会有很大改善。

语言服务器追求流畅、自然、符合直觉的产品体验，性能提升会是重要一环。

## TypeScript 到 LSP 的标准化

TypeScript 和 LSP 都是微软家的技术。事实上，作为一个语言服务器，tsserver 并没有严格兼容 LSP。原因是 tsserver 的出现早于 LSP，而 LSP 正是受到了 tsserver 的启发：与编辑器的 UI 进程分离，在独立的进程中提供智能编程服务。

然而，官方提到，希望借助这次移植，完成兼容 LSP 的愿景。这意味着，未来的 tsserver 将会是一个标准的 LSP 语言服务器。

没能兼容 LSP，是 TypeScript 的短板。也就意味着难以发挥 LSP 跨客户端（代码编辑器）的优势。
另外，我认为兼容 LSP 后，tsserver 还有一个重要的作用，就是与 _AI 辅助编程_ 结合。

## 强化 AI 辅助编程

以 GitHub Copilot 为例，看看现在（2025 年 5 月）AI 辅助编程的功能：

1. 内联代码补全(inline completion)
2. 聊天(chat)/编辑(edit)
3. 代理(agent)

其中，内联补全是最早惊艳到用户的功能。本质上，它的原理是利用 LLM 生成建议的代码。
核心在于构建 prompt，让 LLM 生成用户真正想要的补全。

![life of a completion](<https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/ts-go/Life%20of%20a%20(inline)%20Completion.png>)

Copilot 做了很多努力来让 prompt 更精准。所谓的更精准，一个方面就是要贴近用户正在输入的代码的**语义**。例如，收集光标附近的代码、引用的依赖、打开过的文件、相关函数的签名、注释等等信息，将最有效的信息提炼出来，生成 prompt。

我有一个想法，其实语言服务器非常擅长为 prompt builder 提供这些语义信息：

### 收集全量的语义信息

由于 token 数量、性能等的限制，Copilot 难以全量的分析本地的巨型应用（build local workspace index），即使有 remote index，也有各种各样的限制，例如要上传到 GitHub 等；
而和编译器一样，语言服务器需要编译工程，天然会解析*整个*工程的语义信息，来提供智能编程服务。

> 当然，语言服务器要解析整个工程，并不意味着一定会全量编译工程里的每个文件，例如可以先*预编译*一个文件，得知导出的签名信息（变量类型、函数签名等），后续按需（例如用户打开这个文件时）完整编译

### 处理用户交互

语言服务器比起编译器的一大区别就是擅长处理用户持续不断的编码。借助增量更新技术（Incremental build），语言服务器可以按需编译，仅计算有变化的数据，高效地动态构建语义信息，确保及时更新。例如 tsserver 就支持[增量编译](https://github.com/microsoft/Typescript/wiki/Performance#incremental-project-emit)。

举个简单的例子，当用户删除了某个函数中的一行，这个函数本身的签名并没有变化，那么，只需要更新这个函数内部的语义信息即可。

这个能力对于 Copilot 来说也是非常重要的：随着用户编码，prompt 中的上下文也要及时更新。

### function calling 和 MCP 支持

除了内联补全，Agent 模式也是最近的热点，借助 function calling，LLM 能更精准的获取上下文信息。

![tool-calling](https://code.visualstudio.com/assets/api/extension-guides/tools/copilot-tool-calling-flow.png)

例如，VS Code 自带一个 `Find Usages`（tool、function calling...随便怎么叫），可以是让 LLM 查找某个符号的定义、引用等等位置。

这听着是不是非常耳熟？这不就是 LSP 中的跳转到定义(`textDocument/definition`)和查找引用(`textDocument/reference`)吗？
语言服务器的工作，就是要服务客户端，随着用户不断编码，持续提供语义查询等功能，进而实现智能编程能力的。将这些能力封装为 function calling，供 LLM 查询语义信息，也就是一件非常自然的事情。
事实上，社区已经有一些这样的尝试，例如 [mcp-language-server](https://github.com/isaacphi/mcp-language-server)，借助 MCP 标准化语言服务器和 LLM 的通信方式，让语言服务器也同样成为 MCP 服务器。

当然，除了借助 MCP 的通用方式，在 VS Code 内也有个轻量的方法，来提供 function calling 能力，也就是由 VS Code 插件[自行实现](https://code.visualstudio.com/api/extension-guides/tools)，插件直接通过配置文件（json）描述能提供哪些 tool。

不过考虑到 tsserver 要兼容 LSP 的雄心壮志，我觉得官方会更倾向实现 MCP 服务器的方式，让更多编辑器都可以使用这个能力，而不仅是 VS Code，当然，作为微软的产品，VS Code 的适配还会是首选。

不论是 MCP，还是 Go 移植，都还在非常早期的阶段。我非常看好这个项目，我认为到 2026 年，借助原生移植、与 AI 结合，编写 TypeScript 的最佳方案是 VS Code + GitHub Copilot，不是 Cursor，更不是 WebStorm。

## 其他方面

还有两点值得一提，不过由于整体还在早期阶段，未来也许会有更多变化：

### wasm 的可能性

TypeScript 编译器本质上是一个 Node 应用，也就意味着无法在浏览器运行。这意味着在浏览器里的游乐场（playground）、在线预览编译等应用无法*直接*调用 TypeScript。而 Go 移植后也会 [支持 wasm](https://github.com/microsoft/typescript-go/discussions/458)，在浏览器里运行 TypeScript 会有一些发挥的空间。

### 对下游的 tsserver 插件开发者：如何适配

tsserver 实现了[插件系统](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin)，使得第三方开发者可以编写 Node 代码，扩展 TypeScript 的语言服务。
例如，Vue、Astro、Svelte 语言服务器就是这么做的，它们都需要在 `.ts` 之外的文件里编写 ts 代码。这就需要借助这个插件系统，在自己的文件里为 ts 代码提供语言服务。

这些插件已有的 Node 代码，如何与原生构建的 tsserver 交互，这会是一个问题。不过考虑到官方说 Node 版本的 tsserver 会和 Go 版本的长期共存，也许并不是一个完全无法解决的问题。
