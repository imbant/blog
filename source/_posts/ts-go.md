---
title: 用 Go 移植 TypeScript 的重要影响
date: 2025-05-07
tags: [GitHub Copilot, Go, TypeScript, LSP, MCP]
---

三月有个大新闻，官方要[用 Go 重写 TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/)。号称是 10x 性能提升。

我想从语言服务器开发者的角度聊聊，这个计划的几个作用。

## TypeScript 用户：更流畅的编程体验和构建速度

社区有很多选择什么语言的争论，有人说微软应该选择自家的 C#，有人说应该选择更贴近前端新时代生态的 Rust。这之中有官方对移植和维护成本的考量，但不论具体选什么，只要是原生语言，性能都好过 JavaScript。

编译性能的提升自不必说，在构建 Web 前端应用、Node.js 应用时，都需要把 TypeScript 编译为 JavaScript。这也是官方博文最先提出的：编译 VS Code 源码的速度有了 10.4 倍的提升。

另外，在 VS Code、Cursor 这样的代码编辑器中编码时，TypeScript 也在工作，提供语言服务，具体来说是一个被称为 tsserver 的语言服务器。

> 如果你对语言服务不熟悉，可以参考我写的[语言服务器系列教程](/blog/2024/08/24/LSP1/)

在每次按键时的代码补全、跳转到定义、错误提示等等，都需要 tsserver 编译和分析，并提供实时反馈。

受限于 JavaScript 动态语言的性能，在巨石应用中，语言服务器会有性能瓶颈，这也就是在写代码时，有时补全要很慢才能出来的原因。而利用原生语言，加上 ts 自身的优秀架构和设计，这一点会有很大改善。

语言服务器的终极产品体验应该是流畅、无感、符合直觉的，性能提升会是重要一环。

## LSP 的实现

TypeScript 和 LSP 都是微软家的技术。事实上，作为一个语言服务器，tsserver 并没有严格兼容 LSP。原因是 tsserver 的出现早于 LSP，而 LSP 正是受到了 tsserver 的启发。

然而，官方提到，希望借助这次移植，完成 LSP 的兼容。这意味着，未来的 tsserver 将会是一个 LSP 语言服务器。

没能兼容 LSP，会是 TypeScript 的短板。也就意味着难以发挥 LSP 跨代码编辑器的优势。
另外，我想兼容 LSP 后，tsserver 还有一个重要的作用，就是与 *AI 辅助编程*结合。

## AI 辅助编程

## 另外：对 tsserver 插件开发者：如何适配

已有的 Node 代码，如何与原生构建的 ts 适配

## 另外：wasm 的可能性

ts 本质上是一个 Node 应用，也就意味着无法在浏览器运行。
Go 移植后也会支持 wasm，这意味着编译器、语言服务器都可以在浏览器中运行。有利于 playground 等应用

## 展望

26 年到 27 年起，借助原生移植、与 AI 结合，编写 TypeScript 的最佳编辑器会是 VS Code，不是 Cursor，也不是 WebStorm。

- 性能瓶颈：重点不在于选了 Go 还是别的语言，而是原生语言的巨大性能提升
- MCP 与 LSP 结合：已有的 MCP 语言服务器，将 function calling 和语言服务粘合起来
- AI 辅助编程产品：例如 Copilot，想要拿到 context，依然需要文本识别。这某种程度上只到编译的词法分析阶段。让 copilot 编译源码是不现实的。而语言服务器和 copilot 声明周期相近，并且有 copilot 最需要的，精准的语义信息
- tsserver 适配 LSP 的推进：官方一直以来的愿景，希望借这次移植完成
- 总体还在很早期的阶段，官方还在施工中。期待 26 年借助 copilot 编写 ts 的跃升体验
- 对于 tsserver API 用户，例如，volar、Angular、Svelte，如何适配也是个重要的问题
- mcp lsp:为什么要问 llm 一个变量的定义、引用，这是 lsp 更擅长的，ls 可以借助 mcp 封装 lsp 请求为 function calling 供 llm 调用，语义精准，而无需靠片段文本推测，这受限于 token、算力、工程结构等，也没有必要重复编译
- tsserver 与 AI 结合的几种方式
  - mcp
  - VS Code extension tools
