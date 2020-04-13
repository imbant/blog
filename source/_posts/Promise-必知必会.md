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

但这样就有个问题：想在`createAudioFileAsync()`成功后执行的代码，都要放到第一个回调函数里。看上去没什么问题，只是代码缩进会深一层。
但如果后续代码里还有异步函数呢？再次用这种传入回调函数的方法，代码会陷入难以调试的回调地狱：

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

这种写法下后续还需要调用异步函数怎么办？链式调用就好了：

```js
createAudioFileAsync()
  .then((value) => syncFunc(value))
  .then((value) => doSomething(value))
  ...
  .catch((err) => {})
```

链式调用可以让代码更清爽，更可读和可调试。

### 约定

1. 回调函数需要等本轮事件循环完成后才会调用。Promise 具有异步特性。

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

2. 因为 1，即使 Promise 已经转到`fulfilled`或者`rejected`状态，在这之后添加的`then`也会被调用。

```js
console.log(1);
const pro = new Promise((res) => res(2));
console.log(3);
pro.then((value) => console.log(value));
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
});
console.log(3);
// 1
// 2
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
      .then((response) => response.json)
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
为什么有时候会调用 Promise.prototype.`catch` 方法呢？其实 `catch` 是 `then` 的一种简写。

## 语法

再重复一下概念，「promise 构造函数」指`new Promise()`括号中传入的函数。「then 回调」指`.then()`括号中传入的函数。

### 从 promise 构造函数到 then 回调

通常，两个异步函数要按顺序执行，肯定是后一个要用到前一个的返回值。
通过在 promise 构造函数中给`res`或者`rej`传参，就可以给 then 回调函数传值了。
`then` 接受两个函数作为参数，状态转为`fulfilled`就调用第一个，转为`rejected`就调用第二个。
所以 `catch(func)` 其实就是 `then(null, func)`——实际上，Promise.prototype.catch 内部也的确调用了 Promise.prototype.then。
catch 常常写在一个 promise 调用链的最后，作为兜底的错误处理。

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

同样的，想让上个异步给下个异步传值，需要在 then 回调中设定返回值。

首先区别一下「then 的返回值」、「then 回调函数的返回值」，前者指的是`.then()`，后者指的是括号内传入的函数的返回值。
then 的返回值为一个新的 Promise 对象，这使得`.then().then().then()`的语法成为可能。

如果 then 的回调函数：

- 返回一个值，那么 then 的返回值会作为接受状态（后一个 then）的回调函数的参数值。then 返回的 promise 为*fulfilled*状态。
- 没有返回值，undefined 会作为下一个 then 参数值。then 返回的 promise 为*fulfilled*状态。

```js
new Promise((res) => res(1))
  .then((value) => {
    return value; // 这种写法等价于 return Promise.resolve(value)，返回了一个 fulfilled 的 promise 对象。
  })
  .then((v) => console.log(v)) // 1
  .then((v) => console.log(v)); // undefined，console.log 没有返回值
```

- 抛出错误，抛出的错误会作为拒绝状态的回调函数（后一个 catch）的参数

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

- 如果在 then 回调中执行异步函数，需要返回一个 promise:
  - _pending_ 状态，then 返回的 promise 状态也未定，两者状态会同步。
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

## 其他 API

### promise.race

### promise.all

## async await 语法糖

Promise 解决了 两个异步函数同步调用的回调地狱问题；async/await 解决了在回调函数内写代码不优雅的问题
