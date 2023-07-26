---
title: ChatGPT 的流式对话是怎么实现的
date: 2023-3-20 10:00
tags: [HTTP]
---

## 背景

网页里 ChatGPT 是逐字输出文字的，很像人类在一个一个打字：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/sse-chatgpt/sse2.gif)

API 文档里这种方式称为“流式” `stream`，实现方法是 `server-sent events`(SSE)。本质上它是 HTTP 请求，可以实现服务端向客户端一段一段地推送消息。

与 `WebSocket` 不同的是，`SEE` 依然用 HTTP 协议，而客户端不能向服务端发消息，数据流是**单向**的，更加轻量。

## SSE

让 ChatGPT 分别实现服务端和客户端的 `SSE` 实例：

服务端用 node:

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

客户端:

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

devtool 中以 `EventStream` 的形式显示数据

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/sse-chatgpt/EventStream.png)

值得一提的是，在 ChatGPT 网站里开 devtool，SSE 请求是看不到 `EventStream` 的，似乎是[本地调试](https://github.com/Azure/fetch-event-source/issues/3)才能看到数据。

## 数据格式

服务端每次发送 `SSE` **消息**（一次消息指客户端 `EventSource` 通过 `EventListener` 收到一次事件），由一个或者多个 `message` 组成，每个 `message` 都能传递 `Id`、`Type`、`Data` 这三项数据，`message` 的格式如下：

```shell
[field]: value\n
```

其中 field 可以是 `id`、`event` 、 `data`，对应 devtool 中的三个表头，还可以是 `retry`。可见一条 `message` 以 `\n` 结尾

## data

`data` 代表数据内容，每条数据以 `\n` 结尾。前边说一次消息可能对应一个或者多个 `message`，比如传递一行数据，就是：

```shell
data: message\n\n
```

这里是**两个** `\n`，其实是和前边说 `message` 也以 `\n` 结尾，是相通的，传递多行数据时就能看出区别了：比如传一个 `JSON`

```shell
data: {\n
data: "a": 2,\n
data: "b": true\n
data: }\n\n
```

这一次消息里有四条 message，其中前边都是*一个* `\n`，最后是*两个* `\n` 结尾。可以理解为多出来的 `\n` 代表这次消息结束了。客户端收到的，是一条完整的 `JSON` 字符串

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/sse-chatgpt/EventStream-data.png)

## type

`type` 定义事件类型，在客户端 `EventSource` 除了监听默认的 `message` 事件，还可以监听自定义类型的事件，是一种分发消息的机制。

服务器在前边的例子后再发一段自定义事件 `someEvent`：

```shell
event: someEvent\n           # 和前一个例子一样，一个 \n 代表消息没结束，message 结束了
data: custom event\n\n       # 两个 \n 代表一次消息结束
```

客户端监听事件：

```js
source.addEventListener("message", function (event) {
  console.log("message:" + event.data);
});
source.addEventListener("someEvent", function (event) {
  console.log("someEvent" + event.data);
});
```

结果如下：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/sse-chatgpt/EventStream-type.png)

在客户端，`EventSource` 只能监听一个类型的消息，需要自己选择是默认的 `message`，还是自定义的事件名字，这个和 `DOM` 的 `addEventListener` 很像。

## id

`SSE` 自带了断线重连功能，这也是比起 `WebSocket` 需要自建断线重连功能的优势。方法就是每个消息都传一个 `id`，客户端记录在实例的 `eventSource.lastEventId` 里。重新连接时，客户端请求头（`header`）会传一个 `Last-Event-ID`，告知服务器收到了哪些消息。

[现代 JavaScript 教程](https://zh.javascript.info/server-sent-events)中推荐服务端把 `id` 附加到 `data` 后，确保 `data` 全部收到后再更新 `lastEventId`。我理解原因是先收到 `id`，如果在接收 `data` 时断网，没有收到完整的数据，但已经改变过 `lastEventId`，重连时这段 `data` 就丢了。

> 我理解这段逻辑和 TCP 发送报文是异曲同工的，但是更轻量。
> `id` 应该是有规律的值，这样消息才是有序的，服务端也能用一个 `lastEventId` 就知道后续发哪些消息。

> 不过 `SSE` 是单向通信，不用担心被猜到滑动窗口范围内的 ISN，用 RST 报文恶意攻击，所以不需要三次握手交换 ISN。

```shell
event: otherEvent \n
data: custom message \n
id: 1\n\n

data: object: \n
id: 2\n\n
```

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/sse-chatgpt/EventStream-id.png)

## retry

`retry` 可以让服务端设置每次客户端断线后，每次重连之间的延迟响应时间。

## 完整代码

服务端：

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

  const data = [
    "event: otherEvent \n",
    "data: custom message \n",
    "id: 1\n\n",

    "data: object: \n",
    "id: 2\n\n",

    "data: { \n",
    `data: "a": 2,\n`,
    `data: "b": true\n`,
    "data: } \n",
    "id: 3\n\n",

    "event: someEvent\n",
    "data: custom event\n",
    "id: 4\n\n",
  ];

  const intervalId = setInterval(() => {
    if (count < data.length) {
      res.write(data[count]);
      // res.write(`event: bye\ndata: bye-bye\n\n`)
      count++;
    } else {
      clearInterval(intervalId);
      res.end();
    }
  }, 300);

  // 当客户端断开连接时，停止发送数据
  req.on("close", function () {
    clearInterval(intervalId);
  });
});

const server = app.listen(3000, function () {
  console.log("Listening on port 3000");
});
```

客户端：

```html
<script>
  const source = new EventSource("http://localhost:3000/events");

  source.addEventListener("message", function (event) {
    console.log("message: " + event.data);
  });
  source.addEventListener("someEvent", function (event) {
    console.log("someEvent: " + event.data);
  });
</script>
```

使用 node 启动服务器，就可以在浏览器里看到 `SSE` 请求了。

## 参考资料

[现代 JavaScript 教程](https://zh.javascript.info/server-sent-events)

[MDN-使用服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events)
