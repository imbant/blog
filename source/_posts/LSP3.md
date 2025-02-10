---
title: LSP 与 VS Code 插件开发（三）语言服务器协议
date: 2025-1-17
tags: [LSP, VS Code, 语言服务器]
---

这是《LSP 与 VS Code 插件开发》系列文章的第三篇。
第一篇：[语言服务器架构](/blog/2024/08/24/LSP1/)
第二篇：[语义构建](/blog/2024/12/31/LSP2/)

现在我们知道，语言服务器是一个独立的进程，它接收源码，输出结构化数据，为代码编辑器提供智能编程服务。那么，这个结构化数据是什么样的呢？它是怎么和代码编辑器通信的呢？这些都由 LSP 规定。

## 自己动手？

### 快速开始

介绍协议本身还是太枯燥了。官方有非常好的[实践教程](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide#lsp-sample-a-simple-language-server-for-plain-text-files)，可以先跑一遍。
也可以直接进到教程里的[仓库](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample)，直接 vs code 启动，断点看看代码是怎么工作的。这个教程好就好在启动成本很低，能非常顺利的搭建一个实例插件，启动插件和语言服务器。

### 持续深入

跑完这个教程，你就可以在样例工程里改改写写，尝试 LSP 的各种功能了。想知道有哪些能力，查[官方文档](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/)是必不可少的。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/lspms.png)

但是语言服务非常重交互，而协议本身数据驱动，只靠文字是很单薄的，难以描述出提供的用户交互体验，初学者只看干巴巴的接口定义肯定会头晕，不知道这些接口都能干什么。不过也不怪 LSP 官方，毕竟只负责设计协议，具体的实现还得靠客户端（各大代码编辑器）。

这时候就推荐曲线救国了：先去看看 VS Code 内置 API 教程。作为来自客户端编写的教程，文档全面，内容生动。可以很轻量的快速实现小功能，验证想法。
也就是说，在 VS Code 内实现智能编程，有两种方式，一种是通过内置 API，基于编辑器原生能力实现；另一种是通过语言服务器，基于 LSP 通信，数据驱动实现。前者的优势是架构简单，快速验证，不过只能在插件进程工作，只能用 Node.js 编程，并且在复杂场景会有性能问题。（可以参考[系列第一章](/blog/2024/08/24/LSP1/)了解语言服务器架构如何解决这些问题）

可以先看[语义高亮](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)教程，了解如何通过原生 API 给每个变量上色。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/semantichighlight.png)

接着，非常推荐[这篇文档](https://code.visualstudio.com/api/language-extensions/programmatic-language-features)，它列出了原生 API 和 LSP 的对应关系。毕竟 VS Code 和 LSP 一样都是微软家的，同根同源，深度集成，很多概念和术语都相通。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/colordecorator.png)

文档里详细讲解了 VS Code 支持的语言特性，并且都配上了动图和聊胜于无的文字说明。要说为什么是聊胜于无，还是因为交互太重了，各个功能需要多写 demo 去体验，意会。

从学习和方便调试的角度，可以尝试先用 VS Code API 实现一些功能，翻翻 API 的文档，然后再换成 LSP 实现，两者的文档交叉比对，能更好的体会“设计”和“实现”的差异，更好的理解 LSP。

最后，一定要克隆[这个仓库](https://github.com/microsoft/vscode-extension-samples)，它覆盖了大部分使用原生 API 实现智能编程的例子。当你的代码没有正常工作，一定要来看看示例怎么写的。

## 介绍协议

再次正式介绍一下，LSP 是指 Language Server Protocol，语言服务器协议。

所谓协议，是规定了两端通信的数据格式、交互方式。
其核心是 LSP 消息。客户端向服务器请求代码补全列表时的消息大概长这样：

```
Content-Length: ...\r\n
\r\n
{
	"jsonrpc": "2.0",
	"id": 1,
	"method": "textDocument/completion",
	"params": {
		...
	}
}
```

与 HTTP 类似，LSP 消息也分 `Header` 和 `Body` 两部分。

### LSP Header

`Content-Length` 是 Header 其中一个字段，和 HTTP 一样，代表 `Body` 的长度。

### LSP Body

LSP 使用 `JSON-RPC` 格式描述消息内容，包括请求和相应。简单来说就是一段 `utf-8` 编码的 JSON 字符串。

### 生命周期

本质上，LSP 通信就是两个进程之间的通信。一个进程是语言客户端，对应到 VS Code 里，就是插件的进程（Extension Host），然后由它启动语言服务器进程。
接着，两者会初始化，交换一些信息，主要是两端支持哪些能力。换句话说，不同的代码编辑器，对 LSP 能力的支持是不同的。我们在[语言服务器架构](/blog/2024/08/24/LSP1/)就讲过，BetBrains 仅支持部分功能。例如一个语言服务器提供了全量的语义高亮功能，以及（出于性能原因）按行号范围高亮的功能，后者对于成千上万行的用户源码非常重要，但一些代码编辑器就是不支持后者的，只支持语言服务器提供整个文件范围的高亮。

<!-- TODO: 提供一些插图 -->

这里会有一个**坑点**：协议规定了客户端如果收到服务器发来的，自己不理解的功能，可以[忽略它](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#messageDocumentation)。这本身没有问题，是为了客户端更健壮，至少此时不应该有 exception，但会增加开发者的调试难度。
我碰到的情况是，客户端仅支持 3.16，而服务器使用了 3.17 新增的 `Inlay Hints` 能力，两端都能非常顺利的启动、运行，但代码编辑器中就是不渲染服务器发过来的 hits。原因就是客户端静默处理了自己不认识的 `Inlay Hints` 能力，服务器哼哧哼哧编译好算出数据发给客户端，客户端直接丢掉不用了。解决方法就是升级客户端代码，让它支持更新的协议版本。

在这之后初始化已完成，就可以交换数据了。客户端会有几个关键的事件，来推进整个通信流程，比如打开、编辑、关闭、删除、新增、重命名文档等等。
虽然初始化已完成，但服务器还有更多事情要做：通常要先从工程范围编译或者预编译（仅编译一个文件中的签名信息，不编译实现）所有代码文件，记录好基础的语义信息、工程结构等（这通常是在内存中，当然从性能角度也可以在磁盘中加一些缓存）。接着，客户端打开一个文件，语言服务器会返回这个文件的[高亮](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_semanticTokens)、[诊断](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#diagnostic)、[悬浮提示](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_hover)信息等等，这样编辑器里就从白纸黑字升级了。接下来，用户按下键盘输入代码，在编辑过程中服务器会提供[代码补全](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_completion)、[签名提示](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_signatureHelp)等服务，用户输入完成后，防抖式的重新编译当前文件，更新高亮、诊断等。
随着用户不断编码，语言服务器不断编译，更新语义模型，持续提供语言服务。这也是语言服务器和编译器工作方式的不同之处。

语言服务器是不是可以仅完整编译打开了的文件，而只预编译其他没打开的文件呢？答案是否定的。
有几个高级功能，依赖工程的完整编译：重命名符号、查找引用，这都依赖到完整编译代码实现。另外，在 A 文件有改动后，引起 B 文件的编译错误，这样是常见的情况，这也需要完整编译。

预编译主要解决了循环引用的问题：在 X 代码块中引用了 Y，在 Y 代码块中由又引用了 X，只要仅编译签名，可以绕过编译代码块，理清依赖关系。这又是语言服务器和编译器工作方式的相似之处。

### 处理用户输入

处理频繁的、无征兆的用户输入是实现语言服务器的一大难点。在用户按键输入的时候，一方面，用户希望立即得到代码补全提示，其中可能包括当前作用域的变量、函数、类等；另一方面，一行代码也许得等到用户输入到最后一个分号 `;` 时才是没有语法错误的。前者需要快速响应，后者需要容错，这往往是矛盾的。

为了性能，语言服务器往往通过防抖的方式，在用户输入完一段时间（例如 200ms）后再编译，更新语义模型。这些智能编程功能中，用户对延迟的敏感度是不一样的。想象一下，你在输入一行代码时，高亮更新慢一些、报错信息晚一点出现，似乎都还可以接受。但如果代码补全的列表迟迟不出现，那就非常痛苦了。没有人想一个一个字母的输入一个冗长的变量名对吧，你想手动打出 `This_Is_A_Very_Looong_Variable_Name` 吗？更多的时候是希望输入 `This` 之后一个 `Tab` 就把剩下的 **31** 个字母都补全了对吧。这是代码补全功能的最大挑战：如何在容错的前提下快速响应用户输入。后边会在具体的功能中详细说明。

另外，为了加速编译，语言服务器可以实现一个高级特性，就是“增量编译”，只更新用户输入改变了的语义模型。可能的实现方式是，如果用户输入只改了一个代码块里的代码，就只更新这一部分的语义模型，而不是完全重新编译。

## 具体的请求

好了，接下来会聊聊生动有趣的部分，也是最干的部分：具体的请求和我踩过的坑。

### 代码补全 `textDocument/completion`

编码时


容错和快速响应的矛盾：基于语法的补全、基于语义的补全
用户代码还没写完整，解析不出语义怎么办？
用户要求最小延迟看到补全列表，但由于防抖语义模型还没更新怎么办？
TODO:

客户端可能已经做了排序，例如 vs code，因此语言服务器也许不需要返回字典序的补全项

### 高亮

### 内联提示

### 签名提示

### Color

### 诊断

TODO: vscode 中没有在[文档里](https://code.visualstudio.com/api/references/commands)列出来的 command，例如 补全时的触发 signature help。以及通过检查快捷键绑定的方式找到的 command

---

插件进程主要的功能应该是和 VS Code 主体通信。就像 Electron 主进程一样，应该避免执行很重的任务。VS Code 通知插件，现在需要一个代码补全的列表，虽然插件可以返回一个 promise 异步处理，但如果等太久，VS Code 就不要这个结果了（不提供补全）。这也是 VS Code 的用户交互指南之一，插件不能影响 UI 响应速度

---

插件本体、语言服务器、代码编辑器这三者分别是什么关系？
插件本体就是个转发层，代码编辑器是真正发请求的，语言服务器是真正处理请求的。
他们在三个进程，分别是 VS Code 的 extension host 进程、VS Code 的渲染进程、语言服务器进程。后两者通过 LSP 通信，前两者通过 Electron IPC 通信（TODO: 存疑）。

---

拿代码补全举例，在 console 后输入一个点，这时候语法结构是不完整的，有错的，怎么根据不完整的语法结构和当前光标的位置，推断出当前上下文适用哪些补全，是很难的。
现在理解尤雨溪为什么资助 Volar 作者全职开发这个插件了，它就是 DX 的基础之一，没有这种插件，开发者写 .vue 文件就和白纸写代码一样，是完全写不了的
