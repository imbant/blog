有用的技巧：

- vscode 中没有在[文档里](https://code.visualstudio.com/api/references/commands)列出来的 command，例如 补全时的触发 signature help。以及通过检查快捷键绑定的方式找到的 command

- 语言服务器应当返回和客户端无关的信息。如果想针对某个编辑器做特定的行为要怎么做？客户端在收到服务器返回后，可以二次加工，再真正渲染到代码编辑器里。例如 vscode-languageclinet 就有个 [middleware](https://github.com/microsoft/vscode-languageserver-node/blob/main/client/src/common/client.ts#L364)。Go 的 vscode 插件就是通过劫持 gopls 的信息，做一些针对 vscode 的处理后，才真正返回。例如代码补全 code completion 中，选择函数或者方法后，触发 vscode 特有的 command，来[唤起 signature help](https://github.com/golang/vscode-go/blob/master/extension/src/language/goLanguageServer.ts#L714)

- 卸载插件时可以执行一段脚本，来做清理工作，官方文档中藏的很深：https://code.visualstudio.com/updates/v1_21#_extension-uninstall-hook
