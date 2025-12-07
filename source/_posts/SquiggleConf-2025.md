---
title: SquiggleConf 2025：ts-go 的新进展
date: 2025-12-6
tags: [GitHub Copilot, Go, TypeScript, LSP, MCP, tsc]
toc: true
---

12 月，TypeScript 团队更新了 ts-go 项目的[最新进展](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/)。总的来说，原生版本的语言服务已经比较成熟可用了，并且完全支持标准 LSP 协议。（不过我试用原生版本的第一天就发现个 [bug](https://github.com/microsoft/typescript-go/issues/2209) 哈哈哈，无伤大雅）

编译器本体也非常完善、健壮了，不过编译器 api 依然在开发中，因此第三方工具，如 vue 语言服务器、tsloader 等还用不了原生版本。

最近看了 TS 团队成员 Jake Bailey 在 SquiggleConf 2025 分享的[Why and How We Ported TypeScript to Go](https://www.youtube.com/watch?v=C_ePbVZqXrw&t=6820s)，还有一个[播客](https://www.youtube.com/watch?v=rAMdPw_1ELQ)，我的 takeaway 是：

## 并发

Go 有语言级并发，这是比起 js 最大的优势之一，并行化是能达到 10 倍性能提升的关键。

这在编译时和语言服务上都有体现：

### 编译时

ts 的编译分为 parse、bind、check、emit 四个阶段。其中 parse、bind、emit 都比较容易并行化，并且得益于持久不变的 AST 设计，移植过程中由并发引起的问题非常的少。

- parse 阶段，预处理、词法分析和语法分析是可以并行的，因为不涉及具体的语义，多个文件之间谁先谁后不影响 AST 的产出结果，并且这个阶段最多只会有语法错误。
- bind 阶段，这个属于知识范围之外了，我理解主要是构建符号表的过程，依然不知道具体的类型，只会产生 undefined 之类的错误，因此也可以并行。
- emit 阶段，生成 js 代码，只是遍历和打印，可以并行。

特殊的就是 check 阶段，语义检查是一个非常复杂的过程，check 是 ts 源码中代码量非常大、在一次编译中非常耗时的部份。
通常遍历一次 AST 是不够的，并且文件之间依赖关系错综复杂，a.ts 的类型检查可能依赖 b.ts 的结果，b.ts 又依赖 c.ts 的结果，这意味着检查的顺序非常重要。这里，官方的说法是分组并发。

这里建议详细看看原文 [PPT](https://jakebailey.dev/talk-squiggleconf-2025/68)，能有很直观的理解。

不过顺序完全随机的并发还是带来了一些问题，比如类型 id 的分配顺序会不一致（漂移）。解法就是一些场景依然需要用不变的数据来做排序，比如文件系统的文件顺序。

### LSP

对语言服务器来说，客户端的请求是随机的——很有可能请求 `diagnostic` 的同时又需要 `hover`。js 实现必须排队处理请求，先完成 `diagnostic`，再响应 `hover`，而 Go 版本可以并发处理多个请求。用户可以在编码时更快的得到来自多个请求的反馈。

另外，这样的提速对 AI Coding 也有意义：agent 通常会在生成一段代码后，看下当前客户端的 lint 状态，或者说有哪些 `diagnostic`，读取这些报错信息，尝试修复，好及时纠正方向，继续生成下一段代码。
但 agent 是有超时限制的，没人希望他们一次干个 4 小时。语言服务器更快的响应意味着 agent 能在有限的时间内，完成更多的交互轮次，减少超时带来的阻断。

## Go 移植过程中的改造

### 对象池

JS 天然会构造大量的小对象，随手写一个 `{}` 就会分配内存。而同样的代码移植到到 Go 就很痛了。因此针对热点函数，例如 NewIdentifier，做了内存池复用对象。例如 checker.ts 这个文件，内存开销减少了 96%。

构造小对象的 ts 版本：

```ts
function NewIdentifier(name: string): Identifier {
  return {
    kind: SyntaxKind.Identifier,
    name, // ...
  };
}
```

Go 的内存池版本：

```go
func NewIdentifier(name string) *Identifier {
    id := identifierPool.Get().(*Identifier)
    id.Kind = SyntaxKindIdentifier
    id.Name = name
    // ...
    return id
}
```

### 字符串拼接

V8 针对字符串拼接做了底层优化，因此 js 可以频繁的使用 `+=` 来拼接字符串。
实际上会用一棵树来表示这种连续拼接的字符串，并在必须要使用字符串时，再把树拍平。

```ts
let result = "";
for (const part of parts) {
  result += part;
}
```

但移植到 Go 则千万不能这么做，因为 Go 的字符串是不可变的，每次拼接都会分配新的内存，性能会非常差。Go 要替换为 `strings.Builder` 高效拼接字符串。

```go
var builder strings.Builder
for _, part := range parts {
    builder.WriteString(part)
}
result := builder.String()
```

### 复合类型做 map key

js 的 map，如果是对象作为 key，实际上会根据对象指针来区分不同的 key。而 Go 则不同，结构体作为 key，那么只要结构体的字段值相同，就会被认为是同一个 key——内容一样就是一样。

当然，使用指针作为 key，就能模拟 js 的行为了。

### 其他

移植过程中也遇到了 nil 指针的值判等、[变量的 shadow 问题](https://jakebailey.dev/posts/go-shadowing/)等，Go 的常见语法特性带来的问题。

## Go 语言的选型

- ts 的源码没有特别多面向对象设计，更多的是数据、函数和接口。这和 Go 的思想不谋而合。因此移植起来相对容易。
- ts 有 GC，因此不太容易移植到 C/C++ 这种需要手动管理内存的语言。Go 的 GC 很合适。
- Go 容易上手，学习成本不高。
- Go 社区反响很好，在微软官宣 Go 版本的*当天*，Go 社区就发现[用 Go 编译 ts-go 比预期的慢](https://github.com/golang/go/issues/72815)。随后 Go 1.25 修复了这个问题，并把 ts-go 加入 Go 编译器的 benchmark 测试中。
- 对实际代码文本，ts 源码只需要非常少的改动就能变成 go 代码。项目初期是 Jake Bailey 写了一个生成工具，把数万行 ts 的 AST 转为 Go 代码，然后简单测试就做到 5 倍编译速度的提升。ai 在初步移植过程中实际上没帮上什么大忙，Jake 说可能是用 Go 实现的编译器太少了，缺乏语料。
- 在工程里有非常庞大的 package 时，Go 的语言服务器 gopls 有性能问题，移植过程中也碰到了这个问题，解法是分包，把大 package 拆成更小的 package。但不得不说，这个问题真的非常影响体验——同样不分包的代码库，GoLand 里会明显比 gopls 更流畅。 
