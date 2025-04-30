---
title: 关于 js 文件上传
date: 2019-10-10 15:06:43
tags: JS
---

梳理一下最近学到的 js 读取文件的相关知识，如有疏漏，请不吝赐教！  
源码请见 index.js 与 index.html

## 参考资料

- [MDN-在 web 应用程序中使用文件](https://developer.mozilla.org/zh-CN/docs/Web/API/File/Using_files_from_web_applications)
- [廖雪峰-JavaScript 教程-操作文件](https://www.liaoxuefeng.com/wiki/1022910821149312/1023022494381696)
- [JS 文件：读取与拖拽、转换 bsae64、预览、FormData 上传、七牛上传、分割文件](https://github.com/amandakelake/blog/issues/40)
- [知乎专栏-踩坑篇--使用 fetch 上传文件](https://zhuanlan.zhihu.com/p/34291688)（content-type 为 multipart/form-data 时的坑）

## 相关概念：

- base64 格式
- MIME 类型
- HTTP 头部的 Content-Type
- FormData 方法
- Data URLs
- Blob 与 File 对象
- FileReader 对象
- input 标签： type=file

## 流程概述：

基本流程会与相关概念的顺序相反，自顶向下介绍流程。

### 本地获取文件信息：

首先，HTML 里的文件读写需要通过 `input` 标签实现。我们新建一个：

```html
<input type="file" id="test-file-upload" />
```

这样 UI 上用户就可以点击上传按钮选择文件了。我们可以获取这个文件的文件名：

```js
let fileInput = document.getElementById("test-file-upload");
console.log(fileInput.value); // 文件名
```

HTML5 开始，新的 File API 允许 js 读取文件内容，获得更多文件信息：

```js
  fileInput.addEventListener('change', (e) => {
    let file = fileInput.files[0]
    console.log(file) // file: File
  }
})
```

上边的代码可以拿到文件对应的 `File` 对象。要想读取其中的信息，需要用到 `FileReader` 对象:

```js
fileInput.addEventListener("change", e => {
  let file = fileInput.files[0];
  console.log(file); // file: File

  // 创建对象
  let reader = new FileReader();

  // reader 读取 File 对象是一种请求。当读取完成，会触发 load 事件，
  // 并把 reader.result 设定为读取到的值
  reader.addEventListener("load", () => {
    console.log(reader.result);
  });

  // 规定一个读取 File 对象的方法并执行，这里将其解析为 DataURL
  reader.readAsDataURL(file);
});
```

这样，我们就把 `File` 对象解析成 `DataURL` 格式的**字符串**了。由于文件是图片，自动将其转码为 base64 格式。`DataURL` 基本的格式如下：

> data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
> （后边全是 bse64 编码）

有了 `DataURL`，就可以实现上传文件之后的预览功能：这个字符串是可以写入 `img` 标签的 src 被解析的。

```html
<img id="preview-img"></img>
```

```js
let previewImg = document.getElementById('preview-img');

...

reader.addEventListener("load", () => {
  console.log(reader.result);
  previewImg.src = reader.result;
});
```

根据 `DataURL` 的定义，在 `'base64,'` 后边的字符串就是图片的编码了。将它们发送给服务器，再用 base64 解码即可得到原始文件的二进制内容。
具体到代码，就是在读取完毕文件（load）后，就可以发送结果了

```js
// reader 读取 File 对象是一种请求。当读取完成，会触发 load 事件，并把 reader.result 设定为读取到的值
reader.addEventListener("load", () => {
  console.log(reader.result);
  previewImg.src = reader.result;

  fetch("example.com", {
    body: reader.result, // TODO: 这里还是 DataURL，需要视接口进行格式转换
    method: "POST"
  })
    .then(data => console.log("成功发送请求:", data))
    .catch(err => console.error(err));
});
```

以上就是基本的本地获取用户上传文件内容的相关代码了。

下一步，考虑如何将 Base64 转码，并向服务器正确发送请求。

### 向服务器发送请求

假设后端接口如下：

#### Headers:

| 参数名称     | 参数值              |
| ------------ | ------------------- |
| Content-Type | multipart/form-data |

### Body:

| 参数名称 | 参数类型 |
| -------- | -------- |
| file     | 文件     |

先解释一下 `multipart/form-data` 这个 `Content-Type`：
在原生 HTML - js 体系中，上传文件是在 `form` 标签中实现的：

```html
<form>
  <input type='file'></input>
</form>
```

当一个表单包含`<input type="file">`时，表单的 `enctype` 必须指定为 `multipart/form-data`，`method` 必须指定为 `post`，浏览器才能正确编码并以 `multipart/form-data` 格式发送表单的数据。

在现代前端框架中，为了实现文件上传，必须模拟这个效果，因此引入 `FormData` 对象。
`FormData` 接口提供了一种表示表单数据的键值对的构造方式,模拟一份要发给服务器的表单。

```js
  fileInput.addEventListener('change', (e) => {
    ...
    reader.readAsDataURL(file);

    let formData = new FormData();
    // 为 formData 对象添加一个 key-value 对。
    // 'file' 为表单名称，与接口中 Body 的参数 file 对应
    // 注意 append 第三个参数，可参考 mdn 文档。
    formData.append('file', file);
    fetch('https://example.com', {
      // 注意这里不用写 content-tpye，原因见下文
      // headers:{'Content-Type': 'multipart/form-data'},
      body: formData,
      method: 'POST'
    })
      .then(data => console.log('成功发送请求:', data))
      .catch(err => console.error(err));
  })
```

这里有一个坑：`fetch` 方法里没有配置 `content-type`，这里的原因是：`FormData()` 模拟了一份数据表单，会自动设置 `content-type`，事实上，自动设置的 `content-type` 里不只有 `multipart/form-data` 这个值，还设置了一个 `Boundary`。找了一张知乎[柳兮](https://zhuanlan.zhihu.com/p/34291688)小姐姐的截图：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/3/%E5%85%B3%E4%BA%8E-js-%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A01.jpg)

可以看到，Headers 中已经有一个 `content-type` 了（第一行）。`multipart/form-data` 后边多了一个 `Boundary`。这个值是一个标示分界线的作用，可以看到 `Request Payload` 源码里有几个相同的字符串，这些的作用就和写文章的分割线一样，把 Body 分成好几个部分，每个部分对应一个 `form` 表单的字段。值得注意的是，在每个部分中都有新定义的 `content-disposition` 和 `content-type` 这些「本该」出现在 Headers 里的字段，这些都是服务器用于分段解析 Body 的。

再回头看 `fetch`，如果在里边手动写上 `content-type`，就会用空白覆盖掉自动设置的 `Boundary`，服务器是要抛出 500 并报错的：

> Error: Multipart: Boundary not found

#### 有几句后话：

由于后端接口接受一个 File 对象，前边用 FileReader 将 File 转为 DataURL 似乎没啥卵用（除了能预览文件），但却并没有用到当时写好的 fetch 请求。事实上，前边转码还是有意义的：读取到代表文件内容的信息，就可以做一些相关操作，例如给用户上传的图片加上水印后，才发送给后端储存。这种需求就需要对 DataURL 做操作（借助 canvas 等），以得到一份加了水印的文件。当然，如果后端接口仍然是接收一个 File 对象，则需要将加好水印的 DataURL 再转换为 File 对象，然后发送上传图片请求。
在将 DataURL 转换为 File 对象时也有个坑：
可以使用 fetch 访问 DataURL（从语义上，这就是 URL 的功能了：可以直接写在 img 的 src 里，也可以被 fetch）。但这种做法会有些数据损失：

```js
  reader.addEventListener('load', () => {
    fetch(reader.result as string)
      .then(res => res.blob())
      .then(blob => {
      // 这里 fetch 到的结果是 Blob 对象，而不是 File 对象
      // 两者很相似，File 比 Blob 多两个字段：name 和 lastModifiedDate
      // 也就是说，在 File -> DataURL -> Blob 的过程中，文件数据有两个字段的损失
      })
  )
```
