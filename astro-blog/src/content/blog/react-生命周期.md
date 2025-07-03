---
title: "React 生命周期"
date: "2020-03-09"
tags: ["React"]
description: "分三个阶段，mount、update 和 unmount"
---


## React 16.3 之前（不包括 16.3）已弃用

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/9/React-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F1.png)

## React ^16.4

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/9/React-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F2.png)
分三个阶段，mount、update 和 unmount
注意点：

- 每次 render 前都要调用 getDerivedStateFromProps，该函数用于根据旧的 state 和 props 返回新 state，函数返回值会作为 setState 的参数被调用
- 由于传入新的 props 或者更新了 state 导致的组件更新，其触发的生命周期函数一模一样
- 16.3 之前 带 will 的函数：componentWillReceiveProps、componentWillMount 和 componentWillUpdate 都被**弃用**了，会在 React 17 版本完全不支持使用。
  约束：
- **不要**在 render 前使用含副作用（网络请求，订阅比如 setInterval 等）的操作。
- 在启用 React Fiber 后，render 前的函数（比如各个被弃用的 带 Will 的函数 ）都有可能被多次执行，因此导致预期之外的多次执行 Ajax 请求等操作。

## with hooks

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/9/React-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F3.png)
注意点：

- **每次**重新渲染，前一个 Effect 都要被清除（cleanup），return 的函数都要被执行。但由于 useEffect 第二个参数的存在，我们可以在第二个参数不变的情况下**跳过** Effect，Effect 不被执行，其 return 返回的函数也就不会被执行了。
  例如
  - 在组件重新渲染前 cleanup 的例子
    每当 props 的 id 变化，这个 Effect 都会执行，**包括 return 的函数**。也就是说，每次 props.id 变化，组件都会有“取消上一个 id 的订阅（旧 Effect 的 cleanup） -> 新 id 的订阅”的过程。
  ```javascript
  useEffect(() => {
    ChatAPI.subscribe(props.id);
    return () => ChatAPI.unsubscribe(props.id);
  }, [props.id]);
  ```
  - 与重新渲染无关的例子
  ```javascript
  useEffect(() => {
    window.addEventListener("resize", doSomething);
    return () => window.removeEventListener("resize", doSomething);
  }, []);
  ```
  对这个 Effect 的 cleanup 就是取消 resize 的事件监听器。由于第二个参数为空数组[]，这个 Effect 只会在首次渲染完成时调用（componentDidMount）。接下来每次组件重新渲染，都**不会**再执行这个 Effect，因此重新渲染前，都不会执行 cleanup 的操作，也就不会有“每次渲染都要解绑之前的监听器，再绑定新的监听器”这种问题了。
- useLayoutEffect 的调用时机，和 class component 中的 componentDidMount、componentDidUpdate、componentWillUnmount 一致。 它会在 DOM 变更后、浏览器绘制前**同步（导致阻塞）**调用 Effect。可以用它读取 DOM 布局，并触发重渲染。
