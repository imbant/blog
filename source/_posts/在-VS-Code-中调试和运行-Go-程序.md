---
title: 在 VS Code/Cursor 中调试和运行 Go 程序
date: 2024-11-12
tags: [Go, VS Code, 单元测试]
---

这里总结一些在 VS Code 中调试和运行 Go 程序的方法，对 Cursor 同样适用。

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
  "name": "Launch File", // 会显示在 VS Code debug 界面的人类可读的名字
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

那么这个 `"mode": "test"`，也就是 test 模式，是怎么来的呢？Go 插件[贡献了 debugger 功能](https://code.visualstudio.com/api/references/contribution-points#contributes.debuggers)，向 VS Code 声明了[test 模式](https://github.com/golang/vscode-go/blob/5e506ea7347210ea5003a87f929394b299102962/extension/package.json#L632)

## 报错 `flag provided but not defined: -test`

执行单元测试可执行文件时，有一些命令行参数可以用，例如 `-test.v` 将每个 case 的结果打印出来，而不只是 PASS 和 FAIL。在 powershell 中，执行 `./unittest.exe -test.v`，会有上边这个报错。原因是 flag 中的点号 `.` 需要额外的转义。因此用双引号包裹参数即可解决：

```powershell
./unittest.exe -test.v -test.failfast
# 改为
./unittest.exe "-test.v" "-test.failfast"
```

## 测试单个用例？

可以为编译好的可执行文件传入 `-test.run` 参数，也就是加到 args 中：

```diff
{
  "args": [
    "-test.failfast",
    "-test.v",
++  "-test.run",
++  "YourTestCaseName"
  ]
}
```

## 需要标准输入？

如果你需要执行这样的代码

```go
bufio.NewReader(os.Stdin)
```

比如需要用户手动在命令行输入一些内容，在调试时，可以在 launch.json 中加入 `"console": "internalConsole"` 或者 `"integratedTerminal"`，这样 VS Code 会在内部打开一个控制台，可以手动输入标准输入。

```diff
{
  "type": "go",
  "request": "launch",
  "mode": "debug",
++"console": "integratedTerminal"
}
```

参考 [Stack Overflow](https://stackoverflow.com/questions/64786161/use-input-stdin-in-debug-console-vscode)，也可以在 args 中配置标准输入重定向。

## Benchmark

**千万不要**在 VS Code 自带的 debug 功能（按 F5）里跑 benchmark，会变得不幸！

VS Code 的 debug，实际上会启动一个 debugger，然后插件通过 DA（debug adapter），和 debugger 基于 DAP（debug adapter protocol）通信。

而 debugger 的存在一定会污染性能敏感的 benchmark 的测算结果。
我踩到的坑是，同样一段代码，在 VS Code 中 debug benchmark，比起正经在命令行 go test -bench，耗时增加了 100%。

其实 VS Code 有一个指令叫 `Debug: Start Without Debugging`，或者 Ctrl + F5 触发。我粗略看了下，go 的 debugger `Delve` 支持一个 `noDebug` 参数，可以让程序运行，但不触发断点。

这种方式可以避免 debugger 对 benchmark 性能的影响吗？答案是不行，[这个 issue](https://github.com/golang/vscode-go/issues/1111)提到：

> The "noDebug" feature is an optional hint to the debugger to run the program without hitting breakpoints and breaking on exceptions. It is not necessarily meant to run the program "outside of the debugger" with "full speed".

也就是说，只要通过 debugger，一定影响性能，benchmark 坚决不应该在 VS Code 内执行。
