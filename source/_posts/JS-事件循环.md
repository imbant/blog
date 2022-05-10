---
title: JS 事件循环
date: 2020-04-13 14:31:08
tags: [JS]
---

## 背景
JS 诞生时，为了简化多线程 DOM 操作带来的问题，设计成单线程。
单线程遇到**异步逻辑**（定时、网络请求）又会阻塞住，因此加入了调度逻辑——事件循环

## 事件循环(event loop)
JS 引擎会一直在休眠 - 执行任务 - 进入休眠状态等待新的任务这个几个状态间无限循环。
JS 代码被封装成一个一个任务，通过在任务队列（或者消息队列）中调度任务，来实现调度逻辑。

## 宏任务(MacroTask)
宏任务示例：
- `<script>` 标签加载完成时，任务就是执行它
- `XMLHttpRequest` `fetch` 
- `setTimeout` 时间到达时，任务是执行回调
- 浏览器事件触发（click、mousemove、resize），任务是执行回调
- requestAnimationFrame 见下文
定时器、网络请求等异步逻辑完成后，就在任务队列里放个任务，主线程来执行它

## 微任务(MicroTask)
现有的事件循环机制有个问题：缺少插队机制，只能按顺序执行任务，如果有高优任务没法优先执行。
为此有一个高优先级的任务队列——微任务的队列。
每执行过一个宏任务，就去执行*全部*的微任务（清空队列中的微任务），然后再执行新的宏任务，这样微任务就可以插队（当然，只是任务队列中的插队，正在执行的宏任务不会被中断，还是要等它完成）

可以认为任务队列里的任务都是宏任务，每个宏任务又回包含一个微任务队列。

### 微任务示例
#### Promise.then()
`Promise.then()` 的回调函数会被插进微任务队列，可以写 `Promise.resolve().then()` 去手动插队

#### queueMicrotask()
代替 `Promise.resolve().then()` 写法的新 API，看 polifill 就是写了一个 `Promise.resolve().then()`

#### MutationObserver

#### Object.observe （已废弃）

## 事件循环算法
1. 从宏任务队列出队（dequeue）最早的任务并执行
2. 执行所有微任务（同样是队列，有顺序）
3. 如果有变更，渲染出来
4. 如果宏任务队列为空，休眠直到出现宏任务
5. 转到1

![Performance 中灰色的任务就是队列里的每个任务](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/7/%E6%88%AA%E5%B1%8F2022-05-10%20%E4%B8%8B%E5%8D%884.59.38.png)
Performance 中灰色的任务就是主线程消息队列里的每个任务

## setTimeout
在事件循环中，消息队列是立即执行其中的任务的。但 `setTimeout` 要求延迟到特定时间执行，因此 `setTimeout` 实际上是维护了一个 `hashmap` 去储存延时任务。在消息队列中，每执行完一个任务后都会检查 `hashmap`，根据发起时间和延迟时间算出到期的任务，然后执行它们。
`clearTimeout` 就是删除其中对应 id 的任务。

### requestAnimationFrame
嵌套调用 `setTimeout` 时，后续每次调用的时间最小间隔是 4ms，因此高时效性的场景不适用，比如动画；`requestAnimationFrame` 会根据浏览器刷新率决定执行时机和次数，如1秒内执行144次或者60次，更适用于动画；但是 `requestAnimationFrame` 同样有宏任务的缺点：前一个任务执行太久，新的任务就会阻塞

## 参考
[JSConf EU 2014（视频版）](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
[JSConf EU 2014（文字版）](https://2014.jsconf.eu/speakers/philip-roberts-what-the-heck-is-the-event-loop-anyway.html)
<!-- 
摘自 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop#%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF)

JS 有一个基于**事件循环**的并发模型。事件循环负责执行代码、收集和处理事件，以及执行队列中的子任务。

## 运行时（Runtime）概念

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/7/JS-%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF.svg)

### 栈

函数调用形成了一个由若干帧组成的栈。

```js
function foo(b) {
  let c = b * 3;
  return c;
}

function bar(a) {
  let y = a + 1;
  return foo(y);
}

console.log(bar(3));
```

调用`bar`时，创建第一个帧，包含了`bar`的参数和本地变量（a、y），这个帧被 push 入栈。在`bar`调用`foo`时，创建第二个帧，包含了`foo`的参数和本地变量(b,c)，这个帧也被 push 入栈（且在第一个帧的上边）。`foo`执行完毕后，第二帧被 pop 出栈，同理`bar`执行完毕第一帧也被 pop 出栈。

### 堆

对象被分配在*堆*中，*堆*是一个用来表示一大块（通常是非结构化的）**内存区域**的术语。

### 消息队列

运行时包含了一个待处理消息的消息队列。其中每个`消息`都关联一个用以处理这个消息的回调`函数`。

事件循环期间的某个时刻，运行时会按照队列顺序，从最先进入的开始处理队列中的`消息`。被处理的消息会被移除队列，并作为输入参数来调用与之关联的`函数`。调用一个函数总是会为其创造一个新的`栈`帧。

函数处理会一直进行到执行栈空再次为空为止。然后事件循环就开始处理队列中的下一个消息。

## 事件循环

之所以称之为**事件循环**，是因为它经常以下面的方式被实现：

```js
while (queue.waitForMessage()) {
  queue.processNextMessage();
}
```

一种死循环一样的机制。`queue.waitForMessage()`会*同步*等待消息到达。所谓消息应该可以理解为代码段或函数。

### “执行至完成”

每个消息完整执行后，其他消息才会被执行。这位程序分析提供了优秀的特性，包括：当一个函数执行时，它不会被抢占，只有它运行完毕后才会去运行其他代码，才能修改这个函数操作的数据。这与 C 不同，函数在线程中运行，它可能在任何位置被终止，然后在另一个线程中运行其他代码。

这个模型的缺点在于当一个消息需要太长时间才能处理完毕时，应用就无法处理用户交互，例如点击、滚动事件。为了缓解这个问题，应该缩短单个消息处理时间，并在可能的情况下将一个消息剪裁成多个消息。

### 添加消息

在浏览器中，如果一个事件发生，并且这个事件绑定了监听器（`addEventListener`），就会在消息队列中添加一个消息。

对于`setTimeout`这个函数，它接收两个参数：待加入消息队列的消息（函数）和一个时间值。这个事件代表被加入到消息队列的*最小延迟时间*。如果消息队列中没有其他消息且栈为空，在这段延迟过去后消息就会被马上处理。但是如果队列中还有其他消息，`setTimeout`的消息必须等其他消息处理完。
因此第二个参数仅仅表示最小延迟，而非*确切*的等待时间。
注意，`setTimeout`函数本身会比其参数函数优先执行，也就是优先进入消息队列；同时`setTimeout`本身也是异步的，所以也得等消息队列没有其他消息才会执行这个函数。

下面的例子演示了最小延迟时间的概念：

```js
const now = new Date().getSeconds();

const getTimeGap = () => new Date().getSeconds() - now;

setTimeout(() => {
  console.log(getTimeGap());
}, 500);

setTimeout(() => {
  console.log(getTimeGap());
}, 3000);

while (true) {
  if (getTimeGap() >= 2) {
    console.log("时间间隔大于 2s");
    break;
  }
}
```

输出如下：

```text
// 2秒后
时间间隔大于 2s
2 // 来自第一个 setTimeout

// 3秒后
3 // 来自第二个 setTimeout
```

在这个作用域中，消息队列一直被 while 死循环产生的消息占满，直到时间间隔超过 2 秒，循环结束，消息队列才能处理第一个`setTimeout`发来的消息，由于时间已经超过其最小延迟（500ms），消息被立即执行。接着处理第二个`setTimeout`，1 秒后达到它的最小延迟（3000ms）,执行它的消息。

### 零延迟

`setTimeout`的延迟设置为 0 并不表示消息会立即执行。

其等待时间仍然由队列里待处理消息的数量决定，即使轮到这个消息执行时，时间已经超过了最小延迟。

```js
console.log(1);
setTimeout(() => console.log(2));
console.log(3);
setTimeout(() => console.log(4));
console.log(5);

// 1
// 3
// 5
// 2
// 4
``` -->
