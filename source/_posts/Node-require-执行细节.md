---
title: Node require 执行细节
date: 2019-08-09 18:13:35
tags: [Node]
---

## 当 Node 遇到 require(X) 时，按如下顺序处理

1. X 为内置模块（比如 require('http')）
   直接执行
2. X 以 ./ 或 / 或 ../ 开头
  - 根据 X 所在的父模块，补全绝对路径
  - 将 X 视为文件，依次查找如下的文件，找到就返回该文件。
    - X
    - X.js （这样就可以在 require 中只写 js 文件的名字，不写后缀名了）
    - X.json
    - X.node
  - 将 X 视为目录，依次查找如下文件，找到就返回该文件。
    - X/package.json（main 字段）
    - X/index.js
    - X/index.json
    - X/index.node
3. 如果 X 不带路径
   - 根据 X 所在的父模块，确定 X 可能的安装路径
   - 依次在每个目录中，将 X 当成文件名或目录名加载
4. 抛出 "not found"
