---
title: "Antlr 文法设计中的尖括号问题"
date: "2025-06-07"
tags: ["antlr4", "antlr", "VS Code"]
description: "聊一聊使用 [Antlr](https://www.antlr.org/) 设计编程语言文法时，`>` 符号作为大于号( `a > 0` )、泛型尖括号( `List<int>` )、按位右移运算符( `a >> 1` )这些语义时碰到的问题。"
---


聊一聊使用 [Antlr](https://www.antlr.org/) 设计编程语言文法时，`>` 符号作为大于号( `a > 0` )、泛型尖括号( `List<int>` )、按位右移运算符( `a >> 1` )这些语义时碰到的问题。

## 文法设计

首先在词法上，一般会分开，把 `<` `>` 视为一个独立的 token，比如：

```g4
// Lexer grammar
GREATER  : '>' ;
LESS     : '<' ;
```

接着是定义语法，一个一个来，先定义比较大小的语法：

```g4
// Parser grammar
relation_expr: expression LESS expression
              | expression GREATER expression
              ;
```

为了避免引入与本文无关的复杂性，这里先忽略其他操作符的优先级和结合性，以及引起左递归等问题，认为左值和右值都是表达式。

然后定义按位左移、右移的语法。这通常是两个大于号、小于号的组合。
可以参考按位与 `&`、逻辑且 `&&` 的做法，把 `>>` `<<` 视为两个独立的 token：

```g4
// Lexer grammar
SHIFT_LEFT  : '<<' ;
SHIFT_RIGHT : '>>' ;
```

对应的语法就是：

```g4
// Parser grammar
shift_expr: expression SHIFT_LEFT expression
           | expression SHIFT_RIGHT expression
           ;
```

看上去非常顺利，语法设计完成了。

但是，如果还要引入泛型语法，使用尖括号 `<` `>` 来表示类型参数，像这样：

```g4
// Parser grammar
generic_expr: expression LESS type_parameters GREATER;
```

我们不关注 `type_parameters` 语法的具体定义，假设它可以*递归地*表达这个泛型类型的语法。

`generic_expr` 已经能表达类似 `List<int>` 的泛型类型了。但通常，泛型的参数本身，还可以嵌套泛型，比如 `List<List<int>>`。这就导致了一些冲突：

词法分析结果：

`List<int>` 被解释为下面几个 token：

```
List     <     int    >
LIST | LESS | INT | GREATER
```

而 `List<List<int>>` 被解释为

```
List     <    List    <     int       >       >
LIST | LESS | LIST | LESS | INT | GREATER | GREATER
```

...吗？还记得 `SHIFT_RIGHT` 吗？它也是两个 `>` 组成的 token。事实上，由于 Antlr 的词法分析是贪婪的，最后两个 token 会被合并为一个 `SHIFT_RIGHT`，导致词法分析结果变成了：

```diff
-  LIST | LESS | LIST | LESS | INT | GREATER | GREATER
+  LIST | LESS | LIST | LESS | INT | SHIFT_RIGHT
```

词法分析的意外会进一步导致语法分析的崩溃：泛型语法应该以 `GREATER` 结尾，但现在是 `SHIFT_RIGHT` 结尾，这就造成了语法错误。

## 尖括号的二义性

有办法在词法分析时避免这种情况吗？答案是否定的——词法分析阶段，还没有完整 b 的分析出语法结构，更别说语义了。仅根据词法，难以区分 `>` 是大于号还是泛型的结束。也就是说，与 `&` 符号不同的是，`>` 符号在语法上有多种意义，难以在词法上提前区分。

那么，问题出在右移的词法上。不应该声明两个大于号为一个 token，而是，在语法上，通过两个 `GREATER` 来表示右移。

```g4
// Parser grammar
shift_expr: expression GREATER GREATER expression
           | expression SHIFT_RIGHT expression
           ;
```

不过左移的词法，如果从设计上不会出现其他的两个 `<` 连续的情况，那就可以保留。

## 从 js 到 ts 的做法

我们知道 JavaScript 是没有类型语法的，更没有泛型。

在 JavaScript 的 [antlr 词法文件](https://github.com/antlr/grammars-v4/blob/bdf2e9a5e618f54e7a2ad95610e314a199f10f77/javascript/javascript/JavaScriptLexer.g4#L83)中，确实有 `>>` 作为独立 token 的定义：

```g4
LeftShiftArithmetic        : '<<';
RightShiftArithmetic       : '>>';
```

而在这门语言中扩展类型，升级到 TypeScript，就会碰到泛型问题，所以 TypeScript 的 [antlr 词法文件](https://github.com/antlr/grammars-v4/blob/bdf2e9a5e618f54e7a2ad95610e314a199f10f77/javascript/typescript/TypeScriptLexer.g4#L83)中，去掉了 `>>` 的定义：

```g4
LeftShiftArithmetic        : '<<';
// We can't match these in the lexer because it would cause issues when parsing
// types like Map<string, Map<string, string>>
// RightShiftArithmetic       : '>>';
```

## C++ 的做法

C++ 同样有泛型，也没有定义 `>>` 的 token，甚至连 `<<` 的 token 都没有。

https://github.com/antlr/grammars-v4/blob/bdf2e9a5e618f54e7a2ad95610e314a199f10f77/cpp/CPP14Lexer.g4#L228

## 不用尖括号的泛型语法

go 和 python 的泛型语法使用方括号 `[]`，避免了 `>` 的歧义。因此，词法文件中声明了 `>>` 的 token

https://github.com/antlr/grammars-v4/blob/bdf2e9a5e618f54e7a2ad95610e314a199f10f77/python/python3/Python3Lexer.g4

https://github.com/antlr/grammars-v4/blob/bdf2e9a5e618f54e7a2ad95610e314a199f10f77/golang/GoLexer.g4

## 左移赋值语法的 token 设计

和尖括号有关的文法，还有两种，大于等于 `>=`，和右移赋值 `>>=`。

假设我们现在有这些词法 token：

```g4
// Lexer grammar
GREATER  : '>' ;
LESS     : '<' ;
GREATER_EQUAL : '>=' ;
```

那么，右移赋值的应该在词法上设计为完整的 token，还是在语法上拼接 GREATER 和 GREATER_EQUAL 呢？

后者有点奇怪，毕竟大于等于在语义上和前一个大于号没有什么关联。假设采用前者：

```g4
RIGHT_SHIFT_ASSIGN : '>>=' ;
```

这就有个问题，输入 `a >>= 1` 时，中间的部分，在词法分析阶段，是会被识别为 `GREATER GREATER_EQUAL`（大于号和大于等于号），还是 `RIGHT_SHIFT_ASSIGN`（右移赋值号）？在 antlr 中，答案是后者，antlr 会尝试匹配字符最长的 token。