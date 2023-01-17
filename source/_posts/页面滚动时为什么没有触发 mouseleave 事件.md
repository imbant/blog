---
title: 页面滚动时为什么没有触发 mouseleave 事件
date: 2023-01-17 14:00:00
tags: [浏览器, js, DOM]
---

## 背景

工作中碰到一个带有 tooltips 的按钮。预期是鼠标放在按钮上，显示 tooltips，鼠标移开时不显示。利用 mouseenter 和 mouseleave 实现了这个鼠标交互。

但是这个按钮，位于可以滚动的列表上。显示 tooltips 后，滚动列表，滚动期间鼠标已经离开元素，但 tooltips 不会消失；当滚动结束，tooltips 才（可能）消失。
最终发现是 mouseleave 事件，没有在滚动到鼠标离开按钮时，而是滚动结束后才触发。

![](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/14/scroll-mouseleave.gif)

## 是什么

根据 Chrome 的 [feature](https://chromestatus.com/feature/5697181675683840) 和 Blink 的[讨论](https://groups.google.com/a/chromium.org/g/blink-dev/c/KIoVljZw5fc/m/EKGAoTeX8CQJ)，在 Chrome、Safari、Firefox 中，都限制了滚动时*鼠标事件*的触发。原则是滚动期间不触发滚动事件，直到滚动结束后 100ms，才会正常触发。

这里的鼠标事件，包括 :hover 伪类样式的更新，以及触发 mousemove、moveover/mouseenter、mouseleave/mouseout 事件。

> 提一下 moveover/mouseenter、mouseout/mouseleave 两组事件的区别：enter、leave 事件不会冒泡，不关注元素内部的鼠标移动，over、out 事件会冒泡。
> 说人话就是有两个嵌套的元素，鼠标从父元素移动到子元素，父元素的 enter 不会触发，over（因为冒泡）触发，leave 不会触发，out（因为物理移动进别的元素）触发。
> 因此 mouseenter 在有元素嵌套的场景下效果更好。

> Chrome 原本在滚动时每 100ms 更新一次鼠标事件，Safari、Firefox 都做了相关限制后，在15年（Chrome 45）才同步了这一改动

## 为什么

在浏览器上下滚动时，鼠标很可能在不经意间和一些监听鼠标事件的元素交互，导致大量的回调。考虑滚动大表格的场景，滚动时根本不关注鼠标具体在哪个 cell 里，和它们有什么交互。

:hover 的样式可能导致重绘，甚至是重排；而 mouseleave 等事件可能调用开销巨大的 JS 代码。所以鼠标事件加上滚动行为，可能有很大的开销。在这之前，已经有大量的防抖、禁用 hover（比如滚动时移除 hover class）等 hack 代码存在了。

总的来说，在滚动时触发鼠标事件，难免会有性能问题，因此为了性能，各大浏览器选择干脆不触发事件了。

## 怎么做

回到最初的问题，现在知道了滚动时 mouseleave 不会触发，那有没有其他方案解决这个问题？

这个问题在11年前（时光飞逝啊）就在 webkit 中有所[讨论](https://bugs.webkit.org/show_bug.cgi?id=99940)，其中反馈了 Facebook 的 tooltips 有类似的问题。

这里提供一些思路，可以按实际情况试试：

1. `element(s)FromPoint` API，可以根据给定坐标选到最上层的元素（或层级列表），不过怎么拿到鼠标的坐标又是个问题了
2. 一旦滚动就让 tooltips 消失：从 tooltips 出发，遍历它的父元素，用 `getComputedStyle` 找到 `overflow` 不为 `visible` 的全部可滚动的父元素，监听它们的 scroll 事件。要注意在适当的时机取消监听，避免额外的开销。

> 在查资料中看到一个 `document.scrollingElement` 属性，不过它的功能和本文的场景没有关系，详见张鑫旭大佬的[博客](https://www.zhangxinxu.com/wordpress/2019/02/document-scrollingelement/)

## 参考文章
[Avoiding unnecessary paints - web.dev](https://web.dev/speed-unnecessary-paints/#toc-scrolling)