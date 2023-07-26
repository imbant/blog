---
title: Token Session Cookie
date: 2019-09-11 16:05:30
tags: HTTP
---

先说 cookie，cookie 是浏览器本地储存数据的一种工具。

# 背景

token、session 两者经常出现在同样的场景下。他们都是为了解决用户自动登录的问题。让用户在一定场景下可以不登录而一直访问服务器。

# 方案

前提：用户已经用账号密码登录过一次。
两种方案：

1. session 式：首次登录时，服务器针对这个会话（session）创建一条数据（比如用户角色、登陆时间等等），并将这条数据的 id（session id，一串随机字符串）发给浏览器，浏览器存在本地 Cookie 中。以后的登录的场景，都把这个 id 传给服务器，服务器在数据库中查询验证后免登录。
2. token 式：首次登录时，服务器将一个用户凭证（token）返回给用户，**本地不做储存**。具体生成一个 token 的方式是：把一些用户信息（类似 session 中提到的用户角色、登录时间）做一个「基于本地密钥的 hash 处理」（注意，hash 加密也是需要一个密钥的），生成 token，浏览器把这个 token 存在本地 Cookie 中。这个 hash 过程是一个对称加密的过程，以后的登录场景，每次把 token 和**用户数据**传给服务器，服务器再根据本地密钥（与 hash 时是同一个密钥）做一次解密，判断和用户数据中的是否一致，一致则验证通过，免登录。

# 对比

都是服务器端本地生成某种格式的凭证，传给浏览器。浏览器都要存在本地 Cookie 中。
区别是 session 需要服务器本地持久化储存；token 无需存在服务器中。session 是服务器数据库随机生成一个 id，而 token 是对数据用本地密钥做了 hash 的结果。

# 优劣势

session 需要储存在服务器数据库中。这一点在单个服务器场景中 session 或许并无缺陷，但是在集群服务器中，则涉及到 session 同步的问题：如果用户通过机器 A 登录，A 中有了 session id，但下次登录请求被转发到机器 B 上，B 上没有 session id，因此需要做 session 的集群管理：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/11/Token-Session-Cookie1.jpg)
麻烦的一批。这样限制了集群的可扩展性，限制了机器的横向（数量）扩展。
而 token 式避免了在服务器数据库中储存 session 的问题。实现了无状态，规避了服务器端 session 管理的问题。

token 的**缺点**： 服务器不管理和维护 token，无法宣布一个 token 是「无效」的，因此无法「禁止」一个账户的登录——除非换掉本地的密钥，但这样会导致所有发出去的 token 都失效。因此，如果坏人「盗用」用户的 token，是无法禁止这个账号自动登录的（比如家里电脑被盗了，用户要求公司冻结自己的账号）。而对 session 来说，只要在数据库中删除一条记录，就能实现这一点了。也因此，token 的有效时间应该设置的短一点。

# JWT

生成 token 的一种方案： Json Web Token
在用户登录，服务器验证通过后，会生成一个 JSON 对象：
{
"name": "卢本伟",
"role": "赌怪",
"signTime": "2019-9-11 17:33"
}
这个明文的 JSON 对象（被称为 **Payload**）就是用户登录的凭据了。为了防止用户篡改这个数据，要给它加个签名：先对 JSON 对象做个「基于本地密钥的 hash 处理」，生成的摘要放在原来的 JSON 对象后边，作为它的签名。
现在 JWT 的数据结构是这样的：
**Payload**.Signature，JSON 和签名中间加一个 '.'
然后再在这个结构前加一个 Header，也是一个 JSON 对象，里边写好采用的加密算法等内容。
整体格式如下：
Header.Payload.Signature。将 Header Payload 做一个 base64 编码，将其从 JSON 字符串转换为 base64 格式的字符串。最后就得到如下格式的一串字符：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/11/Token-Session-Cookie2.jpg)
前两者都是 base64 的字符串，最后的蓝色字符串则是 hash 后的摘要（签名）。

# 误区

区分「伪造」和「盗用」，伪造是说凭空造出一个能通过服务器验证的凭据；盗用是说把已有的通过验证的凭据偷过来自己用。
上文讨论的场景中，session 或者 token 能避免的是「伪造」，必须有正确的账号密码才能自动登录。
HTTPS 和操作系统等才能解决「盗用」的问题——防止浏览器和服务器之间的通信（包括 session 或者 token 的发送）被监听窃取，防止本地 cookie 中的数据（包括 token）被窃取。本质上，token 或者 session 被盗，和账号密码被盗，是等同的情况。

参考资料
https://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html
https://zhuanlan.zhihu.com/p/63061864
