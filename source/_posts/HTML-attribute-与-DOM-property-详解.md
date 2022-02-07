---
title: "DOM property 与 attribute 详解"
date: 2022-1-26
tags: [HTML, DOM]
---

## 引入

最近在学 vue，看到 `v-bind` 有两个修饰符 `.prop` `.attr`，分别用于强制绑定 `DOM Property`、`DOM Attribute`
两者都被译为属性，学一下具体是怎么一回事

## 定义

attribute: 在 HTML 源码的标签里定义的「特性」
property: DOM 的属性，是面向对象概念里对象的属性

浏览器解析 HTMl 生成 DOM，根据源码的 `attribute`，给 DOM 对象定义对应的 `property`，同时把 `attribute` 写入 `property` 里的 `attributes` 属性。
浏览器把 `HTML attribute`「映射」为 `DOM property`

## 调试

对于一个 `<input>` 标签
```html
<input class="i" type="text" value="Name:" foo="bar" />
```

```js
const i = document.getElementsByClassName('i')[0] // 得到这个 DOM 对象，具体来说它是一个 HTMLInputElement 对象的实例
```

根据 `class` `type` `value` `foo` 这四个 `attribute`，DOM 对象 `i` 会有对应的属性

```js
i.className  // 'i'
i.type       // 'text'
i.value      // 'Name:'
i.foo        // 'bar'
i.attributes // 返回一个 NamedNodeMap 类型的对象，有 class type value foo 这些属性
```

可见直接访问 DOM 就能拿到对应的 `property`，而 `attribute` 被存在其中一个 property 里

- 想要读写 property 直接用 `=` 赋值即可
- 想要读写 attribute 则需要用 `Element.attributes`、`Element.getAttribute`、`Element.setAttribute`。`i` 是 `HTMLInputElement` 实例，也继承了 `Element` 的属性和方法

## 两者的对应关系

> `attribute` 和 `property` 的关系本质上是 HTML 和 DOM 之间的映射关系

结论：不是一一对应。`attribute` **初始化**了 `property`。`attribute` 定义初始值，而 `property` 才是当前值。

### 命名不同
例如和 JS 关键字重名

| attribute | property |
|---|---|
| class | className |
| for | htmlFor |

### 非标准属性
HTML attribute 只能映射标准属性到 DOM 对象中，自定义的 attribute 不会被映射
```html
<input foo="bar" />
```

```js
i.foo // undefined   foo 没有被映射进对象
i.getAttribute('foo') // 'bar' 
```

### HTML 改变不一定能同步到 DOM

由于 `property` 是 `attribute` 解析而来，`attribute` 改变可以同步到 `property`，这一点比较符合直觉
```js
i.setAttribute('id', 'the-input')
```
执行后 HTML 源码会直接改变
```html
<input /> => <input id="the-input"/>
```
自然也就能同步到 DOM 对象
```js
i.id // 'the-input'
```

**但是也有例外**
比如 `<input>` 的 `type`，作为 property 只能是一些有效值，比如 `textarea` `radio` `checkbox` 等
如果 `attribute` 是一个无效的值，`property` 就不会同步

```js
i.setAttribute('type', 'invalid')
i.type // 'text'
```
尽管此时 HTML 源码已经改变了
```html
<input type="invalid">
```

### DOM 改变不一定能同步到 HTML

少数 `id``class` 这样的值，改变 `property` 会同步到 `attribute`

```js
i.id = 'new-id'
i.getAttribute('id') // new-id
```
HTML 源码也会改变
```html
<input id="new-id" />
```

`<input>` 的 `value` 则不会
当用户在输入框里打字，`<input>` 的 value `property` 会和输入的内容同步，反过来直接改变 `property`，输入框内容也会同步
而 HTML 源码里 `attribute` 始终是保持初始值不会变化

```js
i.value = '输入'          // 输入框也会显示“输入”
i.getAttribute('value')  // 初始值 'Name:'
```

### 类型不同
HTML `attribute` 的值为字符串或者 `null`
DOM `property` 的值可以是任意 js 类型

```js
i.setAttribute('foo', 0) // setAttribute 会自动把第二个参数转为 string
i.getAttribute('foo') // '0' 

i.getAttribute('none') // null 不存在的 attribute 返回 null
```

```js
i.style     // Object
i.checked   // 对于 checkbox 来说，是 Boolean
```

### hrf 不同
```js
el.getAttribute('href')
el.href
```
TODO: 看到一些文章说 `href` 的行为不同，但还没测试出来 

## 非标准（自定义） attribute 的应用
通常自定义的 `attribute` 用于从 HTML 传递自定义数据，到 JS 或者 CSS
JS 可以通过 `getAttribute` 或者 `dataset` 拿到数据，CSS 可以通过 `attr` 或选择器

### HTML5 dataset

之前提到自定义的 `attribute` 不会映射到 `property` 中
```html
<input foo="bar" />
```
```js
i.foo // undefined
```

HTML5 提供了一种可扩展的设计，使得自定义 `attribute` 和 `property` 可以关联起来，这就是 dataset

用 `data-` 作为前缀的 `attribute`，会被写入 DOM 的 `dataset` `property`
```html
<input data-foo="bar" />
``` 
```js
i.dataset.foo // 'bar'
```

在语法层面提供了自定义属性在 `attribute` 和 `property` 之间的映射能力

作为 `property`，可以通过 `getAttribute` 或者 `Element.dataset` 访问到 `attribute`

在命名上，`attribute` 由连字符 `-` 和小写字母等组成，在 `property` 里会自动转为驼峰格式
```html
<input data-some_new-attribute="1" />
```
```js
i.dataset.some_newAttribute // '1'
```

`dataset` 的 `attribute` 和 `property` 基本是一一对应关系，暂时没有找到反例


改变 `attribute` 会同步到 `property`
```js
i.setAttribute('data-foo', 'new')
i.dataset.foo // 'new'
```
改变 `property` 会同步到 `attribute`，即使是在 dataset 中新增或者 delete 属性，HTML 也会同步改变
```js
i.dataset.newItem = 'bar'
```
```html
<input data-new-item="bar" />
```

> 值得注意的是，dataset 的值类型是 String，dataset 本身是 `DOMStringMap` 对象

### CSS attr

css 的 `attr()` 可以获取 attribute，但在2022年1月大部分特性仍然是实验性质的，浏览器支持很差

```html
<div data-text="hello">
  world
</div>
```
```css
div::before {
  content: attr(data-text) ""; // 屏幕中会显示 hello world
}
```

### CSS 属性选择器 (Attribute selectors)

属性选择器通过 `attribute` 匹配元素
匹配有 `title` 的 `div`
```css
div[title]
```

匹配*子*元素有 `title` 的 `div`
```css
div [title]
```

匹配 `title` 内容为 `dna`
```css
div[title="dna"]
```

匹配单词 `dna`，由空格分割的字符
```css
div[title~="dna"]
``` 

以 `dna` 结尾
```css
div[title$="dna"]
```

以 `dna` 开头
```css
div[title^="dna"]
```

包含 `dna`
```css
div[title*="dna"]
```

有 title 并且 class 由 gens 结尾。注意属性选择器可以*叠加*
```css
div[title][class$="gens"]
```


见到一个有意思的实现：
一些特殊符号比如`「` `【`这类左边有比较大的空白，导致排版时看上去没有顶格
可以把文本同步写进 attribute 里，选择器发现首字符是这类字符，就来特殊样式
```html
<!-- vue -->
<p :title="title" >{{ title }}</p>
```
```css
p[title^="「"] {
  text-indent: -10px;
}
```

## 回到引入

在元素上使用 `v-bind:key` 时，vue 会用 `in` 操作符检查被绑定的 `key` 是否存在于元素的 property 中，如果这个 `key` 存在，vue 会将这个值设置为 property 而不是 attribute

通过 `.prop` `.attr` 可以显式地覆写这个行为，强制绑定到 property 或者 attribute 上


## 参考资料
[Angular - HTML attributes and DOM properties](https://angular.io/guide/binding-syntax#html-attribute-vs-dom-property)
[掘金 - 详解 HTML attribute 和 DOM property](https://juejin.cn/post/6844903874143191047)
[dom-attributes-and-properties](https://javascript.info/dom-attributes-and-properties)
[张鑫旭 - HTML5自定义属性对象Dataset简介](https://www.zhangxinxu.com/wordpress/2011/06/html5%E8%87%AA%E5%AE%9A%E4%B9%89%E5%B1%9E%E6%80%A7%E5%AF%B9%E8%B1%A1dataset%E7%AE%80%E4%BB%8B/)