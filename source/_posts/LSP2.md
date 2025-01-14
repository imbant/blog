---
title: LSP 与 VS Code 插件开发 第二章
date: 2024-12-31
tags: [LSP, VS Code, 语言服务器]
---

上一章我们讲到，语言服务器的输入是源码，而输出是结构化的数据。代码编辑器（客户端）某个位置显示什么颜色，鼠标悬浮到某个位置提示什么信息，都由客户端向语言服务器请求，获取数据后，渲染到用户界面。

因此语言服务器需要编译源码，构建语义模型，以为客户端提供*智能编程服务*。

所谓的 `编译` 是怎么回事？它和更常见的编译器是什么关系？本章会和大学里的编译原理知识有些关系，但保证比课本上的更有趣、更好玩！

## 语言服务器与编译器的关系

先回顾一下编译原理的基本流程：
`词法分析` -> `语法分析` -> `语义分析` -> `中间代码生成` -> `代码优化` -> `目标代码生成` -> `...`

### 前端相似

具体各流程的作用就不赘述了，大学课本里那些长篇大论介绍 LL(1) 文法过于乏味。
我们基本可以把编译器的工作分为`前端`、（`中端`）、`后端`几个流程，先说结论，编译器和语言服务器在编译的过程中，`前端`的过程是非常相似的。也就是 `词法分析`、`语法分析`、`语义分析` 几个阶段。

通过这三个阶段，从源码中获取语义信息后，语言服务器等待客户端请求，为编程体验服务，而编译器则是继续中端、后端，为生成目标代码服务。在这之后，两种做的事情就大相径庭了。

换句话说，对于 `console.log` 这一行代码，两者都经历了这样的阶段：

| 阶段     | 进度                                               |
| -------- | -------------------------------------------------- |
| 源码     | console.log                                        |
| 词法分析 | `IDENTIFIER` `DOT` `IDENTIFIER`                    |
| 语法分析 | 规约为 `DomainDotAccess`，是通过点号访问域的语法   |
| 语义分析 | `console` 符号是一个接口，`log` 符号是其中一个方法 |

这里的 `DomainDotAccess` 是个示意，实际上可能是 `MemberExpression` 或者 `PropertyAccessExpression` 之类的，只是一个命名问题。

接下来，有了语义信息后，语言服务器就可以：

1. 前 7 个字母涂成红色；后三个字母涂成蓝色 `console.log` -> <font color="red">console</font>.<font color="blue">log</font>
2. 鼠标悬停到后三个字母的位置，提示 `Prints to stdout with newline. `
3. 调用此函数时，校验实际参数的数量、类型是否与函数签名相符、返回值类型是否正确
4. ...

而这些都是编译器无法做到的事情。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/consolelog.png)

### 容错

此外，两者的容错处理也是不一样的。当源码中出现了错误：
编译器会停止编译，通过标准输出等方式抛出`编译错误`，自然也没有目标产物的输出了，当然，一行代码的改动可能引起数个文件的错误，如果只遇到一个错误就停止编译，也不利于 debug，往往会尝试尽可能多的抛出错误；
而用户会持续不断的编码，你可以想一下，输入编写一行代码时，可能只有输入了最后一个分号 `;` 后，编译才会通过，而这期间语言服务器则会持续工作，进程不会停止，而是收集 [`Diagnostic`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#diagnostic)，也就是诊断信息，客户端根据这些信息，在代码编辑器上显示<font color="red">红色</font>或者<font color="orange">橙色</font>的波浪线。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/errorinlsandterminal.png)

通常来说，编译器能顺利编译通过的工程，语言服务器也不应出现诊断\。反过来，代码编辑器中没有波浪线，理论上编译也是能过的。
碰到代码编辑器中标红，但能编译通过的情况倒是还好，如果代码编辑器没问题，但编译时报错，那就痛苦了。这种一般都是由于编译器和语言服务器没有统一编译标准导致的，例如两种的编译配置不同，同样一段代码，语言服务器认为是 warning，但编译器认为是 error，甚至是两者的语言版本不同（比如 python2 和 python3）。
另外，像 VS Code 这样的编辑器都支持插件，可能除了语言官方的语言服务器，还有别的（例如 lint 工具）在同时工作，这也会导致代码编辑器里看到的诊断比编译输出的多。从这个角度上，编译器和语言服务器的一致性也是工程化的一个重要问题。

总的来说，编译器面向运行时一次性执行，要求最终正确性和可执行性，而语言服务器在用户编码时持续服务，要求及时性和友好性。

### 使用同一种语言构建

上一章提到，语言服务器与编译器往往是同一种编程语言构建的程序。现在你应该更理解了，在编译原理前端，两者的逻辑高度相似，往后才开始异化。使用同一种语言，甚至在同一个工程中，能最大的复用代码，减少维护成本。这也是促成语言服务器架构的原因之一。
事实上很多语言或是编译器内置语言服务器，例如 [Deno](https://docs.deno.com/runtime/reference/lsp_integration/)、[TypeScript](https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) ，或是在内置工具链中就有语言服务器，例如 Go 和 Gopls、Rust 和 RLS。

当然，语言服务器的实现也并不仅是官方一种，VS Code 就[受不了](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide#error-tolerant-parser-for-language-server) PHP 解析器不能容错，直接新写了一个语言服务器

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/lsp-vscode/vscode-php.png)

## 语法错误与语义错误

刚才提到了语法分析和语义分析，这里从诊断的角度再详细说明下。

### 十六进制颜色字面量

假设我们要设计一门新的编程语言，支持十六进制的颜色字面量值。方案如下：
语法：定义为井号 `#` 后跟多个十六进制字符（`0-9`, `a-f`, `A-F`）。
语义：仅长度为 3 (<font color="red">r</font><font color="green">g</font><font color="blue">b</font>)、4（<font color="red">r</font><font color="green">g</font><font color="blue">b</font><font color="gray">a</font>）、6（<font color="red">rr</font><font color="green">gg</font><font color="blue">bb</font>）或者 8（<font color="red">rr</font><font color="green">gg</font><font color="blue">bb</font><font color="gray">aa</font>）的十六进制序列视为合法颜色值。

从语法上没有约束十六进制字符数量的好处在于，语法规则宽松，便于解析和扩展，并且容错性友好。
一套语法描述可能复用于编译器、语言服务器、lint 工具等多个软件，而语义实现则各不相同。因此语法设计应该更宽松和易扩展。

```css
合法，白色
#fff

语法错误，z不是十六进制字符，
#zzz

语义错误，长度不对
#ff
#fffff
#ffffffffffffffffff
```

### 语法错误更为严重

语法错误的影响更严重，例如少了半个括号，会影响后续也许是整个文件的代码的作用域。相比来说，语义错误更易于容错，蝴蝶效应较小。

<!-- TODO: 补后括号没写的语法错误，和 int 赋值给 bool 的语法错误 -->

### 语法错误更快出现

语义错误通常比语法错误更晚出现，因为语法错误出现在语法分析阶段，而语义错误在后一个语义分析阶段。

通常编译单个文件，已经能得到完整的语法错误信息，而语义错误可能需要等整个工程的编译才能完全收集到。

例如，有些编程语言里支持“严格模式”，用来增强类型检查、避免隐式错误等。它在语法上可能就是一行字符串字面量或者魔法注释，例如 `"use strict"` 或者 `// @ts-check`。它们自身没有语法错误，但是会影响后续成千上万行代码的语义分析，带来数个语义错误。

---

草稿

## Volar、Vue 和 Astro

## 如何调试 ts 语言服务器

- 打开 log
- TODO: 见语雀

## 编译：从文本到结构化数据

- 词法分析、语法分析工具
- 语义分析
- 从语义转为智能编程

## LSP 实践

- 如何读 LSP 文档
- 具体的智能编程功能的实现和踩坑
