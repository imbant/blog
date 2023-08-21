---
title: RubyConf China 2023 笔记
date: 2023-08-21
tags: [Ruby]
---

周末参加了 RubyConf China 2023，很奇妙的一段体验！作为一个前端，在同样是脚本语言的 Ruby 会议上听到了 React18，WebAssembly，Rust，Rails，LSP 这些概念，也会有些内容对比到 ts 或者 js，会有“原来 Ruby 程序员是这样思考的”的想法。虽然 Ruby 代码看不懂，拓宽视野还是让我耳目一新。

在大学时期就了解到 Ruby 的让开发者快乐的思想。而 Rails 的 MVC 思想更是影响到了 React、Vue 这些现代前端技术。

## 玩转 AST，构建自己的代码分析和代码重写工具

讲了 Ruby 做词法、语法分析，以及实现 lint 工具的方法。

作者实现了一个 [DSL](https://github.com/xinminlabs/node-query-ruby)，作为在 AST 中查找节点的查询语句，类似 SQL。在树结构中按照一定条件查询节点确实是一个难题。能想到的场景是，在 language server 中，自动补全或者悬浮提示功能，就需要根据鼠标或者光标的位置，查询 AST 中具体对应哪个节点。

## Rails 应用安全与 rack - security

了解了一些常见安全问题和防御对策。

除了前端常见的 XSS 和 CSRF，最近有一种新的攻击手段，称为 SSRF(Server-Side Request Forgery)，服务端请求伪造。

## Ruby 十年 @华为

讲了华为内部 Ruby 的使用情况。作者用 Ruby 构建了内部的代码管理仓库。特点是会写 Ruby 的人不多，难招聘，内部人员也不愿意学，造成项目难以维护的问题。

国内大厂用 Ruby 的很少，而且好多都是 toB 场景在用，很少 toC

## Rust 重铸 Ruby

一个用 Rust 重写 Ruby 运行时的案例。重写后，Ruby 性能有一定提升。这让我想到 Turbopack 和 Deno，也都是用 Ruby 重铸前端生态的例子。Rust 真的那么难学吗？

## Toggle Everything in Ruby

讲了应对需要灰度、开关、ab test 场景的 Ruby 解决方案。结论是自研很痛苦，还是用第三方的好。

拼多多 c 端还是用了很多这种 Toggle 功能的，通过不改变代码的方式，改变应用的功能。

## 用 Solargraph 和 DAP 提升 Rails 开发信心

Solargraph 是 Ruby 的 Language Server。
讲到了 Language Server 的常用功能。重点讲了 Ruby 的类型提示。通过类型推导、注释标注等方式，为 Ruby 代码推断类型。Ruby 可以通过 .rbs 文件声明类型签名。果然脚本语言最终还是要和类型系统打交道，而 Matz 认为未来的编程语言是没有类型的。

另外还介绍了在 vs code 中断点调试。让我意外的是 Ruby 程序员更多是靠 log 调试，使用断点的比例很少。

还看到一个奇技淫巧，断点时在 debug console 面板可以输入代码执行，没想到还可以直接输入 `return []` 中断一个函数，让它直接返回。不过在 js 中没复现出来，会报一个 SyntaxError，哈哈。

## 其他

Ruby 是一门元编程友好，DSL 友好的语言。
CoC(Convention over Configuration) 是值得学习的思想。有一种开箱即用的感觉。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/RubyConf2023/1.jpg)

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/RubyConf2023/2.jpg)