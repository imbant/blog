---
title: "CSS 方式解决 iOS 微信橡皮筋效果与 position: fixed 联动的坑"
date: 2019-12-20 11:08:17
tags: [CSS, 移动 Web 开发, 微信]
---

## iOS 的坑

为了解决 iOS 微信内，触发橡皮筋效果时 fixed 的元素依然位于窗口顶部（而整个页面已经下滑，漏出‘此网页由 xx 提供’字样，截图中是返回所在的行遮住了这句话）的问题，给 body 加一个子元素，同样设置成 fixed，占满全屏，背景设为白色。这样再触发橡皮筋效果时，这个元素实际上也位于窗口顶部（可以改背景颜色验证），但会把‘此网页由 xx 提供’字样遮住，且占满全屏的尺寸和白色背景也符合用户的正常期望，不会意识到实际的 body 已经被拉下去了。

```css
body:before {
  width: 100%;
  height: 100%;
  content: " ";
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  background: #fff;
}
```

| <img src='https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/5/CSS-%E6%96%B9%E5%BC%8F%E8%A7%A3%E5%86%B3-iOS-%E5%BE%AE%E4%BF%A1%E6%A9%A1%E7%9A%AE%E7%AD%8B%E6%95%88%E6%9E%9C%E4%B8%8E-position-fixed-%E8%81%94%E5%8A%A8%E7%9A%84%E5%9D%911_meitu_1.jpg' style='width: 70%'/> | 加上 body::before 后 -> | <img src='https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/5/CSS-%E6%96%B9%E5%BC%8F%E8%A7%A3%E5%86%B3-iOS-%E5%BE%AE%E4%BF%A1%E6%A9%A1%E7%9A%AE%E7%AD%8B%E6%95%88%E6%9E%9C%E4%B8%8E-position-fixed-%E8%81%94%E5%8A%A8%E7%9A%84%E5%9D%912_meitu_2.jpg' style='width: 76%'/> |
| -------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |


## Android 中的表现

<img src="https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/5/CSS-%E6%96%B9%E5%BC%8F%E8%A7%A3%E5%86%B3-iOS-%E5%BE%AE%E4%BF%A1%E6%A9%A1%E7%9A%AE%E7%AD%8B%E6%95%88%E6%9E%9C%E4%B8%8E-position-fixed-%E8%81%94%E5%8A%A8%E7%9A%84%E5%9D%913_meitu_3.jpg" style="width: 50%"/>

Android 微信中 fixed 的元素表现正常，**出乎意料，出乎意料**。

## 题外话：伪元素

首先区分伪元素与伪类——伪元素前有两个冒号「::」，而伪类只有一个「:」
**伪元素**用于描述选择器的特定「部分」样式，而**伪类**用于描述选择器在特定「状态」的样式

### 伪元素

::first-line 是描述选择器中的第一行样式，注意这里只有第一行，但选择器的内容可能不止一行，伪元素只描述**其中一部分**：

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/5/CSS-%E6%96%B9%E5%BC%8F%E8%A7%A3%E5%86%B3-iOS-%E5%BE%AE%E4%BF%A1%E6%A9%A1%E7%9A%AE%E7%AD%8B%E6%95%88%E6%9E%9C%E4%B8%8E-position-fixed-%E8%81%94%E5%8A%A8%E7%9A%84%E5%9D%914.png)

### 伪类

:hover 伪类描述了鼠标移到选择器上方时的样式，注意这里是**整体**样式。

### ::before 和 ::after
https://www.w3.org/TR/CSS2/generate.html#before-after-content
::before 与 ::after 两个伪元素会给选择器加一个“子元素”，区别在于这个子元素位于第一个或最后一个的位置。
如果写了 content 属性，伪元素会被渲染，其属性会继承一切可继承的属性，非集成的属性则保持默认值。出于这个原因，content 的 display 属性默认是 inline，所以一下两段代码 在渲染上是一样的效果，content 被当做 span 渲染了：
```html
<p> Text </p>                   p:before { display: block; content: 'Some'; }
<p><span>Some</span> Text </p>  span { display: block }
```

注意，这里只是说渲染的效果一样，但实际在 dom 树(dom 从数据结构角度讲就是棵树嘛)中，伪元素和 span 依然是两个属性不同的节点
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/5/CSS-%E6%96%B9%E5%BC%8F%E8%A7%A3%E5%86%B3-iOS-%E5%BE%AE%E4%BF%A1%E6%A9%A1%E7%9A%AE%E7%AD%8B%E6%95%88%E6%9E%9C%E4%B8%8E-position-fixed-%E8%81%94%E5%8A%A8%E7%9A%84%E5%9D%915.png)