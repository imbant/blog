---
title: 我为 VS Code 贡献了代码
date: 2024-10-29
tags: [LSP, VS Code, 语言服务器]
---

今天发现我提给 VS Code 的 [PR](https://github.com/microsoft/vscode-languageserver-node/pull/1467) 被官方感谢了。深受鼓舞！

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/vscode-may-thankyou/vscodemaythankyou.png)

## 这个 PR 做了什么

这个 PR 在 `vscode-languageserver-node` 仓库下。它是一个 npm 项目，为 Node 应用提供了[语言服务器](https://microsoft.github.io/language-server-protocol/)封装，用于通过 Node 开发语言服务器应用。

在语言服务器协议（LSP）中，有一个 [Semantic Tokens](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_semanticTokens) 功能，用来实现基于语义的代码高亮。
它是这样工作的：代码编辑器向语言服务器请求 `Semantic Tokens`，语言服务器返回一个列表，里边是每个 `token` 的位置和语义类型。

例如以下的 TypeScript 代码：

```ts
class MyClass {
  myProperty: number = 1;
}
```

在词法分析中，`MyClass` 是一个 token，TypeScript 语言服务器标记它的语义是 `class`，而 `myProperty` 的语义是 `property`。

> 代码编辑器根据语义类型，给这个位置的 token 上色。例如 `class` 是红色，`property` 是蓝色。

`vscode-languageserver-node` 封装了代码编辑器（客户端）和语言服务器基于 LSP 通信的细节。它在收集语义列表时有个 bug：

语言服务器可能会提供和文档字符流顺序不一样的 `token` 列表。
例如 `myProperty` 在前，`MyClass` 在后。翻阅文档后我发现，LSP [并没有约束](https://github.com/microsoft/vscode-languageserver-node/issues/1451) `token` 的顺序一定要和字符流一致，乱序是可接受的。
但在实际表现中，使用这个包的语言服务器会过滤乱序的 `token`，剩下有序的 `token` 返回给客户端。

> 我建了一个[仓库](https://github.com/imbant/semantic_highlight_demo) 来验证 VS Code API 支持乱序 `token`，而使用这个包的语言服务器不支持

我的 PR 对此做了修复，微软的大佬回应也很快很积极。几番 review 后得到了合并。

## 它如何影响 VS Code

VS Code 通过插件机制，横向扩展它支持的编程语言。想在 VS Code 里编写你想要的语言，只需要下载对应的语言插件即可。

VS Code 内置了 TypeScript 插件，它基于 LSP 为 VS Code 内的 `.ts` 文件提供语言服务。
它的语言服务器（被称为 [tsserver](https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29)）就是 Node 应用，它使用 `vscode-languageserver-node` 这个包做封装。

也就是说在 VS Code 内写 TypeScript，就会用到这个包。很开心，这意味着 2024 年 5 月起 VS Code 用户会使用几行我写的代码 :)

## 语义和语法高亮

在 LSP 中定义了基于语义的高亮，也就是语言服务器编译代码，分析每个 token 具体的语义信息，告知客户端。

VS Code 还提供了一种更轻量的，基于语法的高亮。它无需编译，而是通过正则匹配来高亮。
还是这个例子：

```ts
class MyClass {
  myProperty: number = 1;
}
```

`class`、`number`、`1` 这样的关键字、字面量，都是有明确的语法规定的，可以通过正则匹配快速高亮。
渲染这段 markdown 代码块，应该也是基于语法的，更轻量的高亮。

详细内容，可以参考[官方文档](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)
