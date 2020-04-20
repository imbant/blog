---
title: Promise 必知必会
date: 2020-04-10 15:22:06
tags: [ES6]
---

本文先讲讲现成的 Promise 对象怎么用，再讲怎么构造一个 Promise 对象。

## 怎么用

通过[事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop#%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF)来异步执行的函数都有一个问题：如何优雅的调用函数，类似同步函数那样？

假设有一个`createAudioFileAsync()`函数，它接收一些`config`，然后异步的生成音频文件。

```js
createAudioFileAsync();
doSometingSync();
// 作用域里这个同步函数执行完后，createAudioFileAsync 才会被放到消息队列里
// 所以执行顺序是先后者再前者
```

为了解决这个问题，可以给异步函数传两个回调函数，等生成音频成功或失败时调用。

```js
createAudioFileAsync(
  () => {
    /* success */
  },
  () => {
    /* failure */
  }
);
```

但这样就有个问题：想在`createAudioFileAsync()`成功后执行的代码，都要放到第一个回调函数里。回调函数本身没什么问题（只是缩进会多一层，作用域多一层），但如果后续代码里还有异步函数呢？再次用这种传入回调函数的方法，代码会横向扩展，陷入难以调试的回调地狱：

```js
async1((value) => {
  async2((value) => {
    async3((value) => {
      async4(...);
    });
  });
});
```

为了解决这个问题，可以让`createAudioFileAsync()`返回一个 Promise 对象，这样后续的回调就可以*绑定*在该 Promise 上。

用 Promise 重写这个函数后，可以用下面的方式调用它：

```js
createAudioFileAsync().then(
  (res) => {
    /* success */
  },
  (err) => {
    /* failure */
  }
);

// 或者更常见的
createAudioFileAsync()
  .then((res) => {
    /* success */
  })
  .catch((err) => {
    /* failure */
  });
```

这种写法下后续还需要调用异步函数怎么办？用 promise 重写每个异步函数（例如`syncFunc = () => new Promise(/* 异步操作 */)`），然后链式调用就好了：

```js
createAudioFileAsync()
  .then((value) => syncFunc(value))
  .then((value) => doSomething(value))
  ...
  .catch((err) => {})
```

链式调用可以让代码更清爽，更可读和可调试。

### 约定

1. 回调函数需要等本轮事件循环完成后才会调用（异步调用）。

```js
console.log(1);
new Promise((res) => {
  res(2);
}).then((value) => console.log(value));
console.log(3);
// 1
// 3
// 2
```

2. 因为 1，即使 Promise 已经转到`fulfilled`或者`rejected`状态，在这之后添加的`then`也会被异步调用。

```js
console.log(1);
const pro = new Promise((res) => res(2));
pro.then((value) => console.log(value));
console.log(3);
// 1
// 3
// 2
// then 内的函数会被发送到消息队列的队尾，因此一定是最后执行的
```

3. 多次调用`then()`可以绑定多个回调函数，它们会按顺序执行。

## 是什么

从代码的角度，是一个 JavaScript 对象。
从数学模型的角度，是一个有限状态机。

### promise 是对象

其构造函数接受一个函数当参数，调用构造函数会**立即执行**这个函数

```js
console.log(1);
new Promise((res, rej) => {
  console.log(2);
  res(3);
}).then((val) => console.log(val));
console.log(4);
// 1
// 2
// 4
// 3
```

这个函数叫做`executor`，接受 `res`、`rej` 两个函数作为参数。
如果`executor`内 `res` 被调动了，promise 转为 _fulfilled_ 状态；
如果 `rej` 被调用了，就转为 _rejected_ 状态
通常是在`executor`中执行一个异步函数，这个函数根据执行结果来决定调用 `res` 或者 `rej`
如果`executor`执行过程中抛出错误了，promise 直接转为 _rejected_ 状态

```js
new Promise((res, rej) => {
  try {
    fetch("...")
      .then((response) => response.json())
      .then((value) => res(value)); // fetch 也返回一个 promise 对象哦
  } catch (err) {
    rej(err);
  }
});
```

promise 还有一种 _pending_ 状态，作为其初始状态。

### promise 对象是一个状态机

从 _pending_ 状态单项转换为 _fulfilled_ 或者 _rejected_ 状态。
**只要**发生了状态转变，**就**会调用 Promise.prototype.`then` 方法。
为什么有时候会调用 Promise.prototype.`catch`方法呢？其实`catch`是`then`的一种简写。

## 传值

通常，两个异步函数要按顺序执行，肯定是后一个要用到前一个处理过的值。

再重复一下概念，「promise 构造函数」指`new Promise()`括号中传入的函数。「then 回调」指`.then()`括号中传入的函数。

### 从 promise 构造函数到 then 回调

通过在 promise 构造函数中给`res`或者`rej`传参，就可以给 then 回调函数传值了。`res(1) ---> then((x) => x), x = 1`
`then`接受两个函数作为参数，状态转为`fulfilled`就调用第一个，转为`rejected`就调用第二个。常见的`then`只写第一个参数，`catch`常常写在一个 promise 调用链的最后，作为兜底的错误处理。
`catch(func)`其实就是 `then(null, func)`——实际上，`catch`内部就是这么调用`then`的。

```js
new Promise((res, rej) => {
  setTimeout(() => {
    // 立即执行，1秒之后调用 res()
    res(1); // 给 then 传值 1
  }, 1000);
}).then((value) => console.log(value));
// 1秒后打印 1
```

### 从 then 回调到 then 回调（链式调用）

同样的，需要在 then 回调中设定返回值，传给下个 then。

首先区别一下「then 的返回值」、「then 回调的返回值」，前者指的是`.then()`，后者指的是括号内传入的函数的返回值。

then 的返回值为一个新的 Promise 对象，这使得`.then().then().then()`的语法成为可能。

如果 then 的回调函数：

- 想在 then 回调中执行异步函数，需要返回一个 promise:
  - _pending_ 状态，then 返回的 promise 状态也未定，两者状态会同步（注意，只是状态同步，两个 promise 依然不是同一个对象）。
  - _fulfilled_ 状态，执行后一个 then 回调。
  - _rejected_ 状态，执行后一个 catch 回调。

```js
new Promise((res) => res(1))
  .then((value) => {
    return fetch("..."); // 重复一遍，fetch 返回一个 promise 对象
  })
  .then((res) => {
    return res.json();
  })
  .then((value) => {
    console.log(value);
  })
  .catch((err) => {
    console.error(err);
  });
```

```js
new Promise((res) => res(1))
  .then((value) => {
    return new Promise((res) => {
      // 想要在 then 回调中执行异步函数，需要把异步函数包裹在 promise 中并返回。
      setTimeout(() => {
        res(value + 2);
      });
    });
  })
  .then((v) => console.log(v)); // 3
```

- 返回一个值，那么 then 的返回值会作为`fulfilled`状态的回调函数（后一个 then）的参数值。`return value`等价于`return Promise.resolve(value)`，返回了一个 fulfilled 的 promise 对象。
- 没有返回值，undefined 会作为下一个 then 参数值。then 返回的 promise 为*fulfilled*状态。

```js
new Promise((res) => res(1))
  .then((value) => {
    return value; // 等价于 return Promise.resolve(value)
  })
  .then((v) => console.log(v)) // 1
  .then((v) => console.log(v)); // undefined，console.log 没有返回值
```

- 抛出错误，抛出的错误会作为拒绝状态的回调函数（后一个 catch）的参数值。then 返回的 promise 为*rejected*状态。

```js
new Promise((res) => res(1))
  .then((value) => {
    const a = 1;
    a = 2; // 执行到这里运行时会自动抛出错误
    return a;
  })
  .then((value) => console.log(value)) // 不会被调用
  .catch((err) => console.error(err)); // TypeError: Assignment to constant variable.
```

### then 的参数不为函数

then 的第一个参数会在 promise 变为`fulfilled`时调用，如果这个参数不是函数，它会在内部被替换为`x => x`，也就是一个原样返回 promise 最终结果的函数。这种行为称为参数穿透。

```js
new Promise.resolve(3).then(4).then(console.log);
// 3，中间的 then(4) 被内部替换为 then(x => x)
// 3 从 promise 穿透第一个 then，直接传给了第二个 then
```

### Promise.prototype.finally

想要在 Promise 执行完毕后无论结果怎么样都做一些处理，可以用`finally`。
虽然与`then`类似，但用`finally`更适用于那些用`then`时两个参数有相同代码的情况，避免写冗余的代码。
`finally`同样为 Promise 对象绑定一个事件回调，待 Promise 状态转换后调用，不论结果是`fulfilled`或者`rejected`，然后返回一个 Promise 对象。
`finally`内必定发生参数穿透，回调本身的返回值不会作为 promise 链的一环，而是把上个 promise 的值原样传递下来。

由于不知道 Promise 状态，所以`finally`的回调是没有参数的。

```js
Promise.resolve(1)
  .finally(() => 2)
  .then(console.log);
// 1，从 resolve 穿透 finally 传递给了 then
```

如果`finally`回调也返回一个 Promise，则等其状态转换后，`finally`返回的 Promise 才会改变状态，但回调返回的 Promise 状态不影响后续的调用链。后续的调用链依然由`finally`前的 Promise 决定。

```js
Promise.reject(2)
  .finally(() => new Promise((res) => setTimeout(() => res(1), 1000)))
  .then((v) => console.log(v))
  // 不会被调用，和 finally 回调的 promise 无关，和 finally 前一个 promise 有关
  .catch((err) => console.log(err)); // 一秒后输出2

Promise.reject(3)
  .finally(() => 2)
  .then(console.log) // 不会被调用
  .catch(console.log); // 3
```

一句话，用了`finally`一定会值穿透，前一个 Promise 的状态和值，会原封不动的传给`finally`返回的 Promise。

### 面试题分析

```js
new Promise((resolve) => setTimeout(resolve)).then(() => console.log(4));
Promise.resolve()
  .then(() => console.log(2))
  .then(() => console.log(3));
console.log(1);
new Promise((res) => res())
  .then(() => console.log(5))
  .then(() => console.log(6));
```

**注意**，`setTimeout`函数本身会比其参数函数优先执行，也就是优先进入消息队列；同时`setTimeout`本身也是异步的，所以也得等消息队列没有其他消息才会执行这个函数。

解析：

![](/blog/images/Promise-必知必会1.png)

## 写 Promise 的最佳实践

- 总是返回或者终止 Promise 链
- 一旦得到一个新的 Promise，返回它，而不是嵌套调用。

```js
// 错误示例，包含 3 个问题！
doSomething()
  .then(function (result) {
    doSomethingElse(result) // 没有返回 Promise 以及没有必要的嵌套 Promise
      .then((newResult) => doThirdThing(newResult));
  })
  .then(() => doFourthThing());
// 最后，是没有使用 catch 终止 Promise 调用链，可能导致没有捕获的异常
```

```js
// 最佳实践
doSomething()
  .then(function(result) {
    return doSomethingElse(result);
  })
  .then(newResult => doThirdThing(newResult))
  .then(() => doFourthThing());
  .catch(error => console.log(error));
```

## 其他 API

### Promise.race

接受一个可迭代对象（比如数组），返回一个 Promise 对象。
可迭代对象内任何一个 Promise 转移状态后，返回的 Promise 对象也转移到同一个状态。
当可迭代对象为空，Promise 对象始终保持*pending*

```js
Promise.race([
  fetch("url"),
  new Promise((res, rej) =>
    setTimeout(() => {
      rej("超时！");
    }, 3000)
  ),
])
  .then((value) => value.json())
  .then(console.log(value))
  .catch((err) => console.log(err));
// fetch 在 3秒内没能返回数据的话，会直接 log 超时
// 此后就算 fetch 返回了数据，也不会改变返回的 promise 状态
```

### Promise.all

接受一个可迭代对象，返回一个 Promise 对象。
当可迭代对象内全部 Promise 都转为*fulfilled*，返回的 Promise 转为*fulfilled*；每个 Promise 的值都会传入新 promise 的参数数组
当可迭代对象内有一个 Promise 转为*rejected*，返回的 Promise 立刻转为*rejected*，不论另外的会怎样。
当可迭代对象为空，返回 Promise 对象会**同步**的直接转为*fulfilled*。

```js
Promise.all([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3),
]).then((value) => console.log(value));
// [1,2,3]

Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.reject(3)])
  .then((value) => console.log(value))
  .catch((err) => console.log(err));
// 3，不是数组了

const promise1 = Promise.all([]);
console.log(promise1);
// Promise: { <state>: 'fulfilled' }

const promise2 = Promise.all([Promise.resolve()]);
console.log(promise2);
// Promise: { <state>: 'pending' }
setTimeout(() => console.log(promise2));
// Promise: { <state>: 'fulfilled' }
```

## async await 语法糖

不得不说，为了解决异步操作，Promise 依然有额外的复杂性。

async 函数诞生于 ES2017，有人认为是异步操作的终极解决方案。看看从 promise().then() 的代码如何用 async 函数重写：

```js
const demo1 = async () => {
  const result1 = await fetch("...");
  const result2 = await fetch(result1);
  console.log(result2);
};

const demo2 = () => {
  fetch("...")
    .then((result1) => fetch(result1))
    .then((result2) => console.log(result2));
};
```

抛开 async 和 await 关键字，写起来简直和同步函数一样！
不过底层机制依然是利用了 Promise，`await`关键字后边需要跟一个 Promise 对象，其返回值就是 Promise 构造函数里 resolve 传入的值。
async 函数本质上是 Generator 函数的语法糖，其中 Generator 函数是协程在 ES6 中的实现。它可以交出函数的执行权，即暂停执行，来实现像是同步写法那样的异步操作。

Promise 解决了多个异步函数同步调用造成的回调地狱问题；async 函数则让异步函数写起来更加优雅了。

### 用 async 函数重写 promise 链

假如 promise 链的一部分执行了如下代码

```js
const getProgressData = (url) => {
  return downloadData(url) // 返回一个 Promise 对象
    .catch((error) => {
      return downloadFallbackData(url); // 返回一个 Promise 对象
    })
    .then((result) => {
      return progresDataInWorker(result); // 返回一个 Promise 对象
    });
};
```

用 async 函数重写：

```js
const getProgressData = async (url) => {
  let result;
  try {
    result = await downloadData(url);
  } catch (err) {
    result = await downloadFallbackData(url);
  }
  return result;
};
```

注意 async 函数的返回值没有显式的被 promise 包裹，因为 async 函数会隐式地将它传递给 Promise.resolve，这样非原生 Promise 也能正常用了。
当 await 某个 Promise 时，函数*暂停*执行，直至该 Promise 产生结果，并且暂停并不会阻塞主线程，这涉及到协程的概念。
有关 async 函数、协程、Generator 函数，有空再聊。

## 扩展阅读
[异步函数 - 提高 Promise 的易用性](https://developers.google.com/web/fundamentals/primers/async-functions)