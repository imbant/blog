---
title: ChatGPT 的流式对话是怎么实现的
date: 2023-3-20 10:00
tags: [HTTP]
---

网页里 ChatGPT 是逐字输出文字的，很像人类在一个一个打字：
![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/sse-chatgpt/sse2.gif)

API 文档里这种方式称为“流式” `stream`，实现方法是 `server-sent events`(SSE)。本质上它是 HTTP 请求，可以实现服务端向客户端一段一段地推送消息。

与 `WebSocket` 不同的是，`SEE` 依然用 HTTP 协议，而客户端不能向服务端发消息，数据流是**单向**的，更加轻量。

用 ChatGPT 分别实现服务端和客户端的 `SSE`：

node:

```js
const express = require("express");
const app = express();

// 设置允许跨域请求
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/events", function (req, res) {
  // 设置响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let count = 0;
  const maxCount = 5;

  const intervalId = setInterval(() => {
    if (count < maxCount) {
      const date = new Date().toISOString();
      res.write(`data: ${date}\n\n`);
      count++;
    } else {
      clearInterval(intervalId);
      res.end();
    }
  }, 5000);

  // 当客户端断开连接时，停止发送数据
  req.on("close", function () {
    clearInterval(intervalId);
  });
});

const server = app.listen(3000, function () {
  console.log("Listening on port 3000");
});
```

浏览器:

```js
const source = new EventSource("http://localhost:3000/events");

source.addEventListener("message", function (event) {
  console.log(event.data);
});
```

可见 `SSE` 请求有这些特征：
- 数据是纯文本（`text/event-stream`），具体是 utf-8 编码的文本，比起二进制效率要低
- 使用长连接（`keep-alive`），复用一个 TCP 连接
- 数据不被缓存（`no-cache`），保证拿到数据的实时性

<!-- https://zhuanlan.zhihu.com/p/21308648 -->
