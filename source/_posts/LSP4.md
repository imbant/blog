---
title: LSP 与 VS Code 插件开发（四）开发小技巧
date: 2025-3-21
tags: [LSP, VS Code, 语言服务器协议]
---

这是《LSP 与 VS Code 插件开发》系列文章的第四篇。
第一篇：[语言服务器架构](/blog/2024/08/24/LSP1/)
第二篇：[语义构建](/blog/2024/12/31/LSP2/)
第三篇：[语言服务器协议](/blog/2025/01/17/LSP3/)
第四篇：[开发小技巧](/blog/2025/03/21/LSP4/)

[上一章](/blog/2025/01/17/LSP3/)讲了很多实操处理各种 LSP 请求的经验，这一章再讲一些实际开发中其他的小技巧。

## 查找 VS Code 的 command id

LSP 支持客户端和服务器通过 [command 指令](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#command)通信。对于 VS Code 来说，同样支持 [command](https://code.visualstudio.com/api/extension-guides/command)，在 VS Code 按下 F1，随便输入些什么，就能看到支持的指令了。例如，输入 `restart ts server` 就执行了 TypeScript 语言服务器的重启指令。

VS Code 内置了很多强大的指令，可以在[官方文档](https://code.visualstudio.com/api/references/commands)中翻阅。可惜的是，文档中的指令只是 VS Code 真正支持的子集。有一些，也许是官方不愿意用户广泛使用，没有出现在文档中，但它对语言服务器来说能事半功倍，不可或缺。

例如，上一章提到对于代码补全 `completion` 选择函数，可以额外触发 `signature help`，做法就是 VS Code 有一个内置指令叫 `triggerParameterHints`，你可以在 VS Code 中，把光标移动到一个函数调用的括号里，按 F1 然后输入`triggerParameterHints`，确实能唤起签名提示。

问题是这种没有列在文档的指令，要怎么找呢？一个很好的方式是问 LLM，看看你想要的功能，VS Code 是不是已经封装成指令了。AI 在这方面还是挺厉害的，他给出的指令不一定是胡说八道，可以实际在 VS Code 里试一下。

另外，F1 里看到的指令，可以拿到它的 ID，语言服务器可以直接把这个 ID 发给 VS Code，也是生效的。如果你是用快捷键触发某个功能，并不知道它的指令，同样可以在 VS Code 的指令面板里通过快捷键搜索，看绑定到了哪个指令上。VS Code 里的右键菜单（context menu）中的很多选项，也绑定了指令，这也是 VS Code 架构的强大之处。

## 在不同的客户端定制语言服务器的行为

刚才提到，LSP 支持指令，而 VS Code 也有一个强大的指令系统，两者实际上是不相通的，例如在 VS Code 生效的指令，到其他代码编辑器几乎肯定是没意义的，毕竟，各个编辑器的设计不相通。

换句话说，语言服务器应当返回和客户端无关的信息。
如果想针对某个编辑器做特定的行为要怎么做？客户端在收到服务器返回后，可以二次加工，再真正渲染到代码编辑器里。例如 vscode-languageclinet 就有个 [middleware](https://github.com/microsoft/vscode-languageserver-node/blob/df05883f34b39255d40d68cef55caf2e93cff35f/client/src/common/client.ts#L364)。

Go 的 vscode 插件就是通过劫持 gopls 的信息，做一些针对 vscode 的处理后，才真正返回。例如代码补全 completion 中，选择函数或者方法后，触发 vscode 特有的 command，来[唤起 signature help](https://github.com/golang/vscode-go/blob/7a2c83556ae55ea1067e44c4569faae8b5d71712/extension/src/language/goLanguageServer.ts#L715)

## 卸载插件的回调

卸载插件时可以执行一段 Node.js 脚本，来做清理工作，官方文档中藏的很深，或许也是不想这个特效被滥用：https://code.visualstudio.com/updates/v1_21#_extension-uninstall-hook

```json
{
  "scripts": {
    "vscode:uninstall": "node ./out/src/lifecycle"
  }
}
```

## 编写 TS 代码时，VS Code 没有红色波浪线，但编译时有报错怎么办

[第二章中](/blog/2024/12/31/LSP2/#容错)提到，按理在命令行编译代码看到的报错，同样应该在 VS Code 中能看到，两者的行为应该是一致的。

简单来说，除了在命令行（例如，通过 webpack、vite 等工具），VS Code 同样需要编译你写的 TypeScript 代码，来实现高亮、红色波浪线和悬浮提示等智能编程功能，同样要用到 TypeScript 编译器（tsc）

> 如果你对智能编程并不熟悉，那可算来对了，看完这系列文章你就懂了（狗头）

tsc，或者说 TypeScript 升级迭代的过程中，主要的一项升级就是更智能、更强大的类型推进、类型检查。在旧版本中写了会报错的代码（即使人眼看上去没啥问题），可能在新版本就可以编译通过了（说明人眼看的是对的）。

[听说](https://2ality.com/2025/03/typescript-in-go.html#where-does-the-10%C3%97-speedup-come-from%3F:~:text=%E6%97%B6%E9%97%B4%E7%9A%84%E4%B8%89%E5%88%86%E4%B9%8B%E4%B8%80%E3%80%82-,Type%20checking%20makes%20up%20the%20remaining%20two%20thirds,-and%20is%20not) tsc 的类型检查耗时占了 2/3，可见其业务逻辑之复杂，这也能理解为什么时至今日还能推出各种细枝末节 case 下的检查优化了。

回过头来，造成 VS Code（ts 语言服务器）和编译器报错不一致的原因，就是两者的 TypeScript 版本不一致。

在 VS Code，有个指令叫 `TypeScript: Select TypeScript Version...`，用于设置当前语言服务器的版本。VS Code 每次更新，都会内置最新的 TypeScript，这意味着大部分时候 VS Code 用的 TypeScript 是比你的项目更新的。你可以设置为项目中的（通常，也就是 node_modules 中的），来规避这个问题。

![](https://code.visualstudio.com/assets/docs/typescript/compiling/select-ts-version-message.png)

对此，官网也有相应的解释：https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-newer-typescript-versions
