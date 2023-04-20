---
title: 首次尝试写 webpack loader
date: 2023-4-20 10:00
tags: [webpack]
---

## 背景

在 node 项目中有一个文本文件，想要通过模块化的写法，在 js 中拿到文本内容。

## 运行时读取

最初的想法是把这个文件放在打包后的 node 项目的目录内，通过 `fs` 去读文件。

```js
const fs = require("fs");

fs.readFileSync("./relative/path");
```

通过相对路径，去找这个文件。

可这是一个 vs code 插件，node 项目会被打包成 `.vsix` 文件。可以通过对应的打包工具 `vsce` 去配置需要打包的文件，以及调试路径的映射问题。

// TODO: 补全打包方案

## 编译时读取

这个插件是用 webpack 打包的，于是想到可以新写一个 `loader`，直接把文本打包进代码里，在 js 引用这个文件时，直接拿到对应的字符串。

预期是这样的：

plain.text：

```text
一段纯文本
```

node：

```js
import text from "./plain.text";

console.log(text); // 一段纯文本
```

### loader 的功能

loder 的工作，主要是把非 js 文件，编译为 js。
例如把 `import SomeComponent from 'SomeComponent.vue'`，通过 `vue-loader`，替换成一句 js 代码，里边有一个对象就是这个 Component。

// TODO: 举个编译好的例子，完成替换了的

可以认为 loader 的输入是某类文件（例如 .txt 后缀的文件），输出可以是一段 js 代码，最终这段代码会被替换到 js 文件里引用这个模块的那一行。 // TODO: 是直接替换这样吗？

loader 的输出也可以不是 js 代码，因为 loader 是可以链式调用的，只需要保证它的输出格式符合下一个 loader 的输入就好。

### loader 是什么

loader 就是一个 js 文件，一个 node 模块，它导出一个函数，函数的入参就是 loader 的输入，返回值就是 loader 的输出。

```js
module.exports = function fccLoader(content) {
  return "export default" + "`" + `${content}` + "`";
};
```

注意到这里的返回值，是一段 es module 格式的 js 代码。可以通过配置 loader 的 [type](https://webpack.js.org/configuration/module/#ruletype)，来确定这个 loader 的输出是什么模块类型(commonjs esm 等)

### webpack 的配置

loader 可以是字符串，也可以选本地的 js 文件
