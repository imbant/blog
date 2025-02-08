---
title: 提高 Antlr 的编译性能
date: 2025-2-8
tags: [antlr4, antlr, compiler]
---

总结一些提高 antlr 词法和语法分析性能的方法。

### 缓存

如果你构建的是编译器，通常要预处理、预编译、编译文件，使得同一个文件的语法信息（也就是解析树或者 AST）需要用三次。
对于同样的源文件，antlr 生成的解析树（parse trees）是一样的。因此可以复用第一次的语法信息，省去两次的开销。

首先，可以在内存中缓存它的性能，这还是很容易实现的，并且效果很好，能显著提升一次编译执行的效率。
其次，可以考虑如何持久化储存解析树或者 AST，使得那些每次编译时持久不变的文件（例如库、头文件）仅仅被编译一次，后续都无需编译。当然，存盘就意味着 I/O 和编码、解码开销，当心这些开销超过缓存节省的开销。缓存文件使用二进制格式（例如使用一些 proto）会比 json 快得多，将零碎的小文件聚合在一个文件也是个好选择。

### 对简单、轻量的文件使用 SLL 模式

antlr 的预测模式有 SLL 和 LL。其中 SLL 最快，但难以容错，适合没什么二义性、轻量的文件。LL 模式则更慢，但更准确，适合复杂文件。

以下代码来自[这篇文章](https://tomassetti.me/improving-the-performance-of-an-antlr-parser/)。
行为是先用 SLL 模式解析，如果解析失败，再用 LL 模式解析。但要注意，如果 SLL 频繁失败，反而会降低性能。

在 antlr 的 vs code 插件中，也有类似的 [Node.js 代码](https://github.com/mike-lischke/vscode-antlr4/blob/d2a673818518de6cabfd26760ea593b09a8fd096/src/backend/SourceContext.ts#L783)

```java
// this code comes from The Definitive ANTLR 4 Reference by Terence Parr, main author of ANTLR
// try with simpler/faster SLL(*)
parser.getInterpreter().setPredictionMode(PredictionMode.SLL);
// we don't want error messages or recovery during first try
parser.removeErrorListeners();
parser.setErrorHandler(new BailErrorStrategy());
try {
  parser.startRule();
  // if we get here, there was no syntax error and SLL(*) was enough;
  // there is no need to try full LL(*)
}
catch (ParseCancellationException ex) {
  // thrown by BailErrorStrategy
  tokens.reset();
  // rewind input stream
  parser.reset();
  // back to standard listeners/handlers
  parser.addErrorListener(ConsoleErrorListener.INSTANCE);
  parser.setErrorHandler(new DefaultErrorStrategy());
  // full now with full LL(*)
  parser.getInterpreter().setPredictionMode(PredictionMode.LL);
  parser.startRule();
}
```

### 减少语法分支

例如

```antlr
indexTypeClause:
    USING_SYMBOL indexType
    | TYPE_SYMBOL indexType
;

indexTypeClauseOpt:
    (USING_SYMBOL | TYPE_SYMBOL) indexType
;
```

在大部分场景下，可选值 `?` 性能比分支 `|` 更好。例如，假设一门语言的 if 语句的条件可以带括号，也可以不带

```antlr
ifStatement:
    'if' '(' expression ')'
    | 'if' expression
```

就可以优化为

```antlr
ifStatement:
    'if' ('(')? expression (')')?
```

### 谓词

谓词是值 .g4 文件中用 `{}` 花括号包括起来的部分。这些部分需要 antlr 生成目标代码后自行编写函数实现逻辑。
语法分析文件中（parser.g4）谓词放到最前
词法分析文件中（lexer.g4）谓词放到最后

### 使用最新的 antlr 来生成目标代码

antlr 是个比较活跃的项目，更新还是比较频繁的。

- 4.10：2022 年 4 月 11 日
- 4.11：2022 年 9 月 5 日
- 4.12：2023 年 2 月 20 日
- 4.13：2023 年 5 月 21 日

例如以前只有 JavaScript 版本目标代码，现在 TypeScript 也有了。另外新版本通常会有性能优化。

## 重要参考资料

https://tomassetti.me/improving-the-performance-of-an-antlr-parser/
https://groups.google.com/g/antlr-discussion/c/PpgPQU5jA3Q/m/P4K6Y0BXBQAJ
