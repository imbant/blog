---
title: 在 VS Code 中调试和运行 Go 程序
date: 2024-11-12
tags: [Go, VS Code, 单元测试]
---

习惯了 VS Code，使用 GoLand 总是不顺手。这里总结一些在 VS Code 中调试和运行 Go 程序的方法。

## 准备工作

必不可少的是 [Go 插件](https://marketplace.visualstudio.com/items?itemName=golang.Go)。安装后可以做一些基础配置：

```json
{
  "go.goroot": "your\\go\\root",
  "go.gopath": "your\\go\\path",
  "[go]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": "never"
    }
  },
  // 这是 go 的语言服务器的配置
  "gopls": {
    "ui.semanticTokens": true // 开启语义高亮，不仅仅是关键字高亮
  }
}
```

GoLand 打开项目时会自动初始化 `go mod tidy`，VS Code 不会，需要手动执行一下。

## launch.json 文件配置

在工程根目录下新建这个文件：`.vscode\launch.json`，VS Code 读取此配置来运行和调试 Go 程序。文件的详细文档在[这里](https://go.microsoft.com/fwlink/?linkid=830387)，这里说一下详细的配置。

调试程序：

```json
// 注意，这份配置应该位于 launch.json 的 configurations 字段下
{
  "name": "Launch File", // 会显示在 VS Code 界面的人类可读的名字
  "type": "go", // 声明为 go 语言的配置
  "request": "launch",
  "mode": "debug", // 支持断点调试
  "program": "${workspaceFolder}\\cmd\\main.go", // 你的 main.go 的位置
  "env": {},
  "output": "${workspaceFolder}\\debug\\vscode_launch_file.exe", // 预期输出编译后可执行文件的位置
  "cwd": "", // 可执行文件的工作目录（working directory）
  "args": [] // 可执行文件的参数
}
```

单元测试，以 Go 语言内置的单元测试框架 `go test` 为例：

```json
{
  "name": "Unite Test",
  "type": "go",
  "request": "launch",
  "mode": "test",
  "program": "${workspaceFolder}\\unittest", // 你的单元测试目录的位置
  "cwd": "", // 可执行文件的工作目录（working directory）
  "output": "${workspaceFolder}\\unittest", // 编译出的单元测试可执行文件的位置
  "buildFlags": [], // 编译单元测试可执行文件时的参数，也就是 go test -c 的其他参数
  "args": [] // 执行单元测试可执行文件的参数
}
```

这里重点说一下，`"mode": "test"` 下，实测 VS Code 会这样做：

1. 执行 `go test -c`，并且加上 `buildFlags` 和 `program` 字段对应的参数
2. 调用上一步编译出的可执行文件，并且使用 `args` 字段对应的参数

假设你的目录结构为

```
根目录/
├── .vscode/
├── debug/
└── unittest/
```

其中可执行文件位于 debug 目录，而单元测试文件位于 unittest 目录。那么你可以将 launch 配置为

```json
{
  "program": "${workspaceFolder}\\unittest",
  "cwd": "${workspaceFolder}\\debug",
  "buildFlags": ["-tags", "test"],
  "args": ["-test.failfast", "-test.v"]
}
```

等价于 powershell 中

```powershell
cd ./debug
# 最后使用 ../unittest 是因为工作目录（cwd）在 debug，需要相对于它的单元测试文件的目录
go test -c -tags test -o ./unittest.exe ../unittest
./unittest.exe "-test.v" "-test.failfast"
```

## 报错 `flag provided but not defined: -test`

执行单元测试可执行文件时，有一些命令行参数可以用，例如 `-test.v` 将每个 case 的结果打印出来，而不只是 PASS 和 FAIL。在 powershell 中，执行 `./unittest.exe -test.v`，会有上边这个报错。原因是 flag 中的点号 `.` 需要额外的转义。因此用双引号包裹参数即可解决：

```powershell
./unittest.exe -test.v -test.failfast
# 改为
./unittest.exe "-test.v" "-test.failfast"
```