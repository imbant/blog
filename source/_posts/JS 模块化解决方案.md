---
title: JS 模块化解决方案
date: 2020-10-01 10:48:24
tags: [模块化]
---

## 大纲
浏览器环境的 JS——script 加载时机问题
Node.js
非官方的模块化方案——运行时加载
ES6的官方方案————构建时模块合并

## 参考资料
[require，import区别？ - 寸志的回答 - 知乎](https://www.zhihu.com/question/56820346/answer/150724784)
[Node.js 如何处理 ES6 模块 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2020/08/how-nodejs-use-es6-module.html)

## 模块化问题的由来
JS 的诞生只是为了在浏览器里处理 HTML 文件简单的交互事件，但2020年的今天，JS 已经可以构建复杂的大型应用程序，并且可以脱离浏览器环境运行。
因此，需要有一种将 JS 代码拆分为可以按需引用模块的机制。模块化问题是 JS 诞生的年代遗留的历史问题，目前有两种主流的方案来解决：CommonJS 与 AMD。


## 浏览器环境、服务器环境的选择


## CommonJS
这个项目由 Mozilla 工程师 Kevin Dangoor 于2009年1月发起。

### 规范与实现
CommonJS 只是一种针对 JS 模块化的规范或者说规则。Node.js 实现了这一规范。下文会讨论的更多是 CommonJS 在 Node.js 中的**实现**，而不会过多关注规范本身。从实用角度出发，模糊实现和规范的边界。

### 语法
```js
// constant.js
const COUNT = 1
exports.COUNT = COUNT

// main.js
const COUNT = require('/.constant')

console.log(COUNT) // 1
```
模块化自然离不开两个行为：**导入**和**导出**。通过 `require` 方法和 `exports` 对象，常量 `COUNT` 从 `constat.js` 导出，在 `main.js` 中导入。看一下 Node 提供的内部能力：

#### Module 类
Node 内部提供一个 `Module` 构建函数，所有模块（一个文件就是一个模块）都是 `Module` 的实例。
```js
function Module(id, parent) {
  this.id = id;
  this.exports = {};
  this.parent = parent;
  // …
```

#### 模块内部
- 每个模块内部都会有一个 `module` 对象。
- `exports` 是一个对象，是 `module.exports` 的一个引用。
- `require(id)` 是一个方法，用于接收路径或者模块名称作为 `id` 做导入操作。
- `module.require(id)` 也是存在的方法，同样用于引入模块。关于 `require` 和 `module.require` 的区别，[文档](https://nodejs.org/docs/latest/api/modules.html#modules_module_require_id)里说的比较晦涩，暂时没有理解。

#### 导出模块
可以为 `exports` 添加属性，来导出模块内的变量与函数。
```js
exports.hello = function() {
  return 'hello';
};
```
由于它是 `module.exports` 的一个引用，这里可以改写为 
```js
module.exports = {
	hello: function() {
		return 'hello'
	}
}
```

可见这种写法有局限性：如果不想导出对象，只想导出单一的值，`exports` 本身是做不到的，因为它是**对象**的引用。这一定程度上也说明模块化的核心关注点在对象而不是单一的基本数据类型，例如 `require(id)` 可以导入 JSON 文件，将其中的内容视为对象。

```js
// 错误的写法！这样破坏了 exports 的引用，module.exports 没被赋值
exports = function() {
  return 'hello';
};

// 正确的写法
module.exports = function() {
  return 'hello';
};
```

可见这种简洁的写法会引起概念的混淆。简单处理可以弃用 `exports`，用 `module.exports` 一把梭。

#### 导入模块
`require(id)` 语句会读入并**执行**一个 JS 文件，**然后**返回该模块的 `exports` 对象。可见这里是有一定先后顺序的。

##### 缓存机制
模块有「缓存」机制：第一次导入模块后，Node 会执行并缓存这个模块，以后再导入同一个模块，就直接从缓存读取 `module.exports` 值，而**不再执行**。

「缓存」是一个难以感知的机制，在查阅文档前我的确没意识到缓存机制的存在。这里多举几个例子品一下：
```js
// a.js
const time = new Date().getTime()

exports.time = time

// main.js
console.log(require('./a.js').date)

setTimeout(() => {
	console.log(require('./a.js').date)
}, 1000)
```

第一次导入 `a.js` 时执行了模块，`time` 作为常量存下了第一次执行时的时间戳；延时一秒后再次导入，取到的是 `time` 的缓存，因此其不会更新，输出都是一样的时间戳：
```js
1601563155181
1601563155181 // 1秒后输出
```

再举一个从身边大佬手里写出的例子：
```js
// a.js
let control // 单例模式，对象本身存在模块内，不直接导出

export const initControl = (config) => {
	if(control) {
		control.config = config
	} else {
		control = {
			config
		}
	}
}

export const getControl = (callback) => {
	callback(control) // 用回调的方式传出单例
}
// 
```
这里的 `control` 没有被导出，但在首次加载后就一直被缓存了。这作为单例模式的实现非常巧妙，在项目的任何文件里想要使用 `control`，只需要引入 `getControl`，通过传入回调函数的方式就可以得到，而没有「会不会有重复调用导致性能问题或者之前的数据都被抹掉」这种心智负担。

这份例子中可以深究的还有很多，`control` 出于什么机制被缓存（可能是被引用？），又在什么时候被释放（可能不会被释放？）？用回调获取单例对象的写法也非常精妙，值得学习。

缓存都存在 `require.cache` 中，可以显式的获取。可以手动清除导入模块的缓存：
```js
delete require.cache[moduleName]
```

##### 加载规则
`require(id)` 方法需要传入一个 `id`，它可以是模块名称或者路径。
- 传入路径：根据绝对或者相对路径寻找模块
- 传入模块名：导入一个 Node 自带模块，或者是 `node_modules` 目录内的模块
```js
// Importing a local module with a path relative to the `__dirname` or current working directory. (On Windows, this would resolve to .\path\myLocalModule.)
const myLocalModule = require('./path/myLocalModule');

// Importing a JSON file:
const jsonData = require('./path/filename.json');

// Importing a module from node_modules or Node.js built-in module:
const crypto = require('crypto');
```

后缀名问题：`require('react')` 语句中没有写明文件的后缀名，会尝试依次添加 `.js` `.json` `.node` 格式之后再去搜索。

以上设计是为了保证不同模块可以将所依赖的模块声明本地化，而无需关注模块被导入时的路径问题。

Node 还会关注 `package.json` 文件里的 `main` 字段。这个字段语义是程序的入口：
> The main field is a module ID that is the primary entry point to your program.   

这里说的 `module ID` 就很容易理解了，和 `require(id)` 的参数语义一致。定义好主入口后，`require` 在寻找模块时也会从主入口里查找。

具体的查找顺序可以参考[另一篇文章](/2019/08/09/Node-require-执行细节/)

##### 循环引用
模块导入一定会碰到循环引用问题，循环引用指两个模块互相引用。
```js
// a.js
exports.x = 'a1'
console.log('a.js', require('b.js').x)
exports.x = 'a2'

// b.js
exports.x = 'b1'
console.log('b.js', require('a.js').x)
exports.x = 'b2'

// main.js
console.log('main.js', require('a.js').x)
console.log('main.js', require('b.js').x)
```

输出：
```
$ node main.js
b.js a1 // b.js 加载 a.js 时造成循环引用，Node 会返回 a.js 的不完整版本
a.js b2
main.js a2
main.js b2
```
在 `main.js` 里输出的是 2 而不是 1，是缓存的体现。具体 Node 是怎么处理循环引用的，需要再深究一下。


### 弃用
在2013年5月，  npm 的作者 Isaac Z. Schlueter，宣布 Node.js 已经废弃了 CommonJS，Node.js 核心开发者应避免使用它。



## AMD
### 基于 AMD 的 RequireJS

## webpack 与 babel

## Deno 的模块机制


## 参考资料
[CommonJS规范 — JavaScript 标准参考教程（alpha）](https://javascript.ruanyifeng.com/nodejs/module.html)