---
title: "BrowserRouter vs HashRouter"
date: "2020-02-25"
tags: ["React Router"]
description: "使用 React-Router 的应用一定是单页应用（SPA）。与多页应用相比，SAP 可以在前端自定义和控制路由。但后端也有一套路由处理的能力，此时前后端在控制路由层面如何权衡呢？"
---


使用 React-Router 的应用一定是单页应用（SPA）。与多页应用相比，SAP 可以在前端自定义和控制路由。但后端也有一套路由处理的能力，此时前后端在控制路由层面如何权衡呢？

## BrowserRouter ：

普通的 url 路径，网络请求中会把 url 完整地发送给服务器，相应的，服务器要对前端定义的每个 pathname(window.location.pathname 这个东西) 都做相应的处理。
例如一个页面有 根、user 和 about 三个路径：
https://example.com/
https://example.com/user
https://example.com/about
后端需要分别写三个不同 GET 请求的方法（express 为例）：
`app.get('/')`、`app.get('/user')` 和 `app.get('/about')`
目前有两个问题：

1. 如果后端不作处理，会怎么样？
   举个例子，如果后端只定义了 `app.get('/')`，那访问根域名是正常的。此时前端做页面跳转 `history.push('/user')`，这样是能正常看到 `/user` 下对应的组件的。但如果刷新页面，或者重新访问 https://example.com/user ，页面会白屏，原因是服务器没有定义 `/user` 下要返回什么 HTML，因此前端没有拿到 HTML。
2. 难道前端每新定义一个路由，后端都需要去手动适配吗？
   不需要，后端可以设定任何路由都返回访问根路由时同样的 HTML，让前端 Router 自己去解析 url，判断如何渲染组件。
   有一个 create-react-app 上的例子，所有请求都返回 index.html：

```js
app.get("/*", function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
```

## HashRouter：

url 看起来像这样：
https://example.com/#/user
https://example.com/#/about
\# 后的部分称为 hash，这一部分是不会发送到后端的，因此后端也无需对每个特定的 path 都做处理。
根据 React Router 文档的说明，# 后边有三种不同格式：

- "slash" - Creates hashes like #/ and #/sunshine/lollipops
- "noslash" - Creates hashes like # and #sunshine/lollipops
- "hashbang" - Creates “ajax crawlable” (deprecated by Google) hashes like #!/ and #!/sunshine/lollipops

看起来简单些。不过 React Router 文档中有一条：HashRouter 不支持 `location.key` 和 `location.state`；另外，BrowserRouter 也支持 HTML5 history API（其中包括了 pushState、replaceState 方法和 popstate 事件），因此更鼓励使用 BrowserRouter。
两者的差别很简单：发送请求时服务端是否能接收到 path。相应的涉及到后端是否要针对单独的路由进行配置。

## 回到最初的问题：

一个 SPA 的路由控制方面，前后端如何权衡？显然，前端控制路由是 SPA 的特点，也因此才有了切换路由无需刷新页面的优势（相比于多页应用）。在 BrowserRouter 模式下，后端应用需要做额外配置，来适配不同 url 的请求。

## 一个 React Router + Redux 应用在浏览器刷新、返回操作时的行为分析

- 返回操作：
  redux 中的 state 不变
  全局 layout 中的变量不变
  待证实：用 react-router 管理路由的 SPA 中浏览器做返回操作，具体行为由 router 自己接管（比如 prevent default？）；返回操作不影响的内存（比如全局 layout、redux 中的 global modal），也不变。（如果是 a 页面内的 a.1 返回到 a.2，page modal 是不是也不变呢）
- 刷新操作：
  上述变量被释放，应用重新启动，从 layout 开始初始化，一步一步到路由对应的组件
