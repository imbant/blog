---
title: flex box 下的宽度问题
date: 2019-11-19 18:09:55
tags: [CSS]
---

## 参考文章

https://www.jianshu.com/p/17b1b445ecd4

## flex box 下影响子元素宽度的因素

首先，在 flex box 容器内，元素的 width 设置后是可以生效的，无需关注 display 属性。
即使 display 属性设置为 inline，也一样可以设置 width

有 4 个属性会影响元素宽度：

1. width
2. flex-basis
3. flex-grow
4. flex-shrink

因此，**在 flex box 下，元素真实宽度可能与 width 值不同**。解决方案如下：

### 1. width 与 flex-basis

在定义元素宽度时，flex-basis 值比 width 优先级更高。
当然这种说法是有局限性的，flex-basis 值决定的其实是元素在主轴方向上的长度，默认情况下就是横向，也就和 width 值起同一个作用，但优先级比 width 高。
![](/images/flex-box-下的宽度问题1.png)

### 2. flex-grow

flex-grow 规定元素如何分配容器的剩余空间。如果容器内元素的宽度之和小于容器宽度，这个属性就会生效，给子元素按比例分配宽度：
a、b、c 三个元素 width 之和为 10 + 20 + 40 = 70 px。容器宽度为 150px，剩余空间为 150 - 70 = 80 px。
这 80px 就是要分配给有 flex-grow 属性的元素：a 和 b，c 没设定这个值，不给它分配。分配规则是按值作为比例，a 分配 2 份，b 分配 1 份。
a 的最终宽度：10 + (80 \* 2/3) = 63.3333px
b 的最终宽度：20 + (80 \* 1/3) = 46.6667px
**可见虽然设置了 width，元素的真实宽度却与其值不同**
![](/images/flex-box-下的宽度问题2.png)

### 3. flex-shrink

flex-shrink 规定元素如何吸收超出容器的空间。与 flex-grow 相反，如果子元素加起来的宽度超过了容器元素，超出的部分将在设置了 flex-shrink 值的元素中减去，达到所有元素填满容器，却不超出的效果
a、b、c 三个元素的 width 之和为 70 + 90 + 40 = 200px，与容器 width 之差为 200 - 150 = 50px。
这 50px 需要在 a、b 子元素中减去，c 没设置这个值，不用减。
同样按比例分配要减去的值：a 分配 2/7，b 分配 5/7
a 最终宽度：70 - (50 \* 2/7) = 55.7143px
b 最终宽度：90 - (50 \* 5/7) = 54.2857px

可见虽然设置了 width，元素的真实宽度却与其值不同

![](/images/flex-box-下的宽度问题3.png)

### 4. 解决 flex box 中元素宽度与 width 不同

将 flex-grow 和 flex-shrink 属性设置为 0，保证真实宽度不会随其他元素变化。

### 5. css 语法中的 flex 属性

flex 是 flex-basis、flex-grow、flex-shrink 三个属性的简写
