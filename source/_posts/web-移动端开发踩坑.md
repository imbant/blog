---
title: web 移动端开发踩坑
date: 2020-04-07 18:47:40
tags: [移动 Web 开发]
---

## 浏览器内核

所谓内核指*渲染引擎*，要和 *js 引擎*区分开来。*js 引擎*有 Chrome 用的大名鼎鼎的 `V8` 等，其他浏览器不尽相同。

### iOS

由于苹果规定，iOS App 必须使用`WebKit`引擎，可以说 iPhone 上各个浏览器的行为都差不多，因为其本质都是 Safari 的封装

### 其他

有三个分支：

- `Webkit`（Safari），Google（Chrome） 后来 Fork 它做出了 `Blink`，Opera 也在用这个引擎。
- `Gecko`（Firefox），Netscape 做的，现在由 Mozilla 维护。
- `Trident`（or whatever），微软做的，IE 在用，360安全浏览器也在用。微软新推出的 Edge 已经在用 Chromium（Chrome 的开源先行版）开发啦！

根据360浏览器的[一份文档](https://browser.360.cn/se/help/kernel.html)，国产的主流浏览器都是双核浏览器：基于`Webkit`的内核用于常用网站的高速浏览，基于`IE`的内核主要用于部分网银、政府、办公系统等网站的正常使用。

因此，移动端进行兼容性测试时可以这样分类浏览器了：
iOS 随便哪个浏览器，问题都不大；
安卓要测好 Chrome、Firefox，以及其他诡异的浏览器。个人遇到的较具代表性的是红米自带浏览器和 UC 浏览器。

### 微信

在2022年的今天，微信已经成为国内用户事实上的移动浏览器 💩。

iOS 下虽然也是 `WebKit` 内核，但还是会出一些小坑，需要单独拎出来兼容性测试。
安卓下腾讯出了一个 X5 内核，作为应对千变万化的安卓设备与特性的兼容性解决方案。似乎是基于 Chromium 做的。总之也需要单独拎出来测一下。

## 通用样式解决方案

### rem

rem 单位的原理是读取`HTML`元素的`font-size`属性，与其值相乘得到一个 px 为单位的值。

rem 可以实现根据设备屏幕宽度不同，呈现比例相同、实际宽度不同的样式。

原理：根据设计稿宽度与实际设备宽度，等比例缩放样式。其比例就是`HTML`的`font-size`值。

例如，设计稿宽度为 375px，其中有个色块宽 20px。比如用户手机是 iPhone 某个 PLUS 系列，屏幕宽 414px，那么色块的宽度就要缩放 414/375 ≈ 1.1 倍。

我们假设设计稿宽度下，HTML 的 font-size 为 `100px`，这时我们把色块的 width 从 20px 改为 20px/100 = `0.2rem`。当这位 PLUS 用户访问网站，将其 HTML font-size 改为 100 \* 1.1 = 110px。

一切就绪，色块宽度为 0.2rem，浏览器会自动换算成 0.2 \* 110 = `22px`，实现了根据设备宽度缩放 UI。

想一下要做 rem 适配，需要哪些工作？

- 加载网页时根据 vw 算出 HTML font-size
  获取页面宽度好做，需要将设计稿宽度设定为常量，做一个除法。
- 用 rem 为单位写 css，或者对于已有项目，可以通过一些工具将 px 编译为 rem
  例如用 webpack 打包的项目，可以用插件处理 .css 文件，比如文末提到的 postcss-pxtorem

### 图片分辨率

苹果的[用户界面设计技巧](https://developer.apple.com/cn/design/tips/)中提到，应该提供所有图像的高分辨率版本。
例如有一张切图的标准分辨率（@1x）为 100px\*100px，可以理解为在标准分辨率下的显示器，一个像素点就显示图片里的一个 1px\*1px 色块。
但高分辨率显示器具有更高的像素密度（@2x、@3x），因此需要有更多像素的图片。

所有苹果设备都具有至少 @2x 的屏幕素质。在 iPhone Xs Max 和 6/7/8 Plus 中甚至达到 @3x。

因此，即使是 100px\*100px 的 img，也应该填入至少 200px\*200px 尺寸的图片。 pc 端同样适用哦。

![](https://developer.apple.com/design/tips/images/imagery-high-resolution_2x.png)
![](https://developer.apple.com/design/human-interface-guidelines/ios/images/ImageResolution-Graphic_2x.png)

## 微信的坑

### iOS 微信

#### position: fixed

见[这里](/blog/2019/12/20/CSS-方式解决-iOS-微信橡皮筋效果与-position-fixed-联动的坑/)

#### click 事件

在 iOS 的微信/企业微信，以及 Safari 内，给 `window` 绑定点击事件会有不能正常触发回调的问题
```js
window.addEventListener('click', fn)  // 页面内的点击事件不会调用 `fn`
window.onclick = fn                   // 同上
```

解决方案是给根部的 `<html>` 标签加一个 `onclick` 事件，或者绑定一个 `eventListener`，绑定空的函数就行
```js
const htmlElement = document.getElementsByTagName('html')[0];
const temp = htmlElement.onclick; // 或者 addEventListener('click', _ => {})
htmlElement.onclick = function (...args) {
  try {
    if (temp) {
      temp.apply(this, args);
    }
  } catch (error) {
    //
  }
};
```

这个问题在 iOS Chrome 内表现正常，无需对 `<html>` 有额外操作。

同时，这个问题**只有**给 `window` 绑定 `click` 事件时存在。
- `window` 内部的普通 DOM 元素，绑定 `click` 事件，可以正常触发回调
- 给 `window` 绑定 `touchstart` 事件，可以正常触发回调

> 顺带一提，由于移动端有双击屏幕放大的逻辑，所以 `click` 事件会比 `touchstart` 晚一些触发

### 安卓微信

#### 同层播放问题

见[这里](/blog/2019/12/11/安卓微信-视频播放-相关踩坑/)

不要做视频位置移动、视频被 DOM 遮挡的设计

#### 奇数 font-size 不对齐问题

不确定的信息来源：安卓 webview 中的浏览器为了避免奇数 font-size 带来的偏差，自动设置成了偶数。
可以通过设置 2 倍 font-size 再做 0.5 倍缩放，或者干脆改为偶数 font-size 来规避问题。
<https://imweb.io/topic/5848d0fc9be501ba17b10a94>

## 其他

### 横屏事件

浏览器自身随着浏览器横屏事件改动，会影响 vw、vh 单位。由于这个事件无法避免，需要提前设计容错方案。
个人遇到的情况是一个转码 PDF to HTML 的库（用 canvas 实现的），需要获取页面宽度且不可动态调整。
如果是横屏打开的页面，要选择屏幕尺寸中小的那个值作为宽度。

### 实用库推荐

- [clipboard.js](https://clipboardjs.com/)，用于自动复制文字
- [React Helmet](https://www.npmjs.com/package/react-helmet)，用于动态改变 head 中的 title、meta 标签。
- [postcss-pxtorem](https://www.npmjs.com/package/postcss-pxtorem)，一个插件，可以在 webpack 项目中将全部 px 单位的样式编译为 rem，需要指定 rootValue
- [Ant Design Mobile](https://mobile.ant.design/docs/react/introduce-cn)，移动端组件库
