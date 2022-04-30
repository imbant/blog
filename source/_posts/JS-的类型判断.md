---
title: JS 的类型判断
date: 2022-4-30
tags: [JS]
---


## typeof
结论：`null`、`Function` 不符合直觉，无法识别 `NaN`、`Infinity` 和`Array`。浏览器实现的对象因浏览器而异


### 语法：
```js
typeof variable
typeof(variable) // 两者没有区别，带括号能明确表达式的范围
```

### 对基本数据类型：
- `typeof null === 'object'`，JavaScript 诞生以来便如此
- 其他基本数据类型，返回其对应字符串

注意`NaN`和 `Infinity` 的返回值，尽管语意上和数字有所区别
`typeof NaN === 'number'`
`typeof Infinity === 'number'`

### 对引用类型：
- `typeof someFunction === 'function'`
- 其他对象，返回 `'object'`

注意数组也是 `'object'`

### 浏览器实现的非原生对象（host objects）
浏览器环境下的对象，typeof 的实现可能有差异
例如一些 IE 下 `typeof alert === 'object'`，尽管它是个 `function`

### toLowerCase()
在搜索判断类型的代码时，经常看到对 `typeof` 的返回值做 `toLowerCase()`，我简单查了一些资料，大部分浏览器对原生的数据类型都会符合预期地返回小写字母，也许这样做是为了处理上文说到的浏览器实现的对象，它们的 `typeof` 实现千奇百怪，加一个 `toLowerCase()` 至少不会出错


## instanceof
### 结论
用于判断原型链关系，不能直接判断类型


### 语法
```js
d instanceof D
```
检查 `D.prototype` 是否在 `d` 的**原型链**上
可以粗暴的理解为 `d.__proto__.__proto__.__proto__...` 这个链中是否有一个节点等于（指向） `D.prototype`
```js
[].__proto__ === Array.prototype
[].__proto__.__proto__ === Object.prototype
[].__proto__.__proto__.__proto__ === null
```

### 用途
用于检查引用类型
```js
const a = new A()

a instanceof A // true

document.getElementsByTagName('body')[0] instance of Element // true

undefined instanceof A // false，基本数据类型都返回 false
```

### Object 与 Function 的奇妙关系

```js
Object.__proto__ === Function.prototype
Object instanceof Function // true

Function.__proto__.__proto__ === Object.prototype
Function instanceof Object // true

Function.__proto__ === Function.prototype
Function instanceof Function // true
```
参见[另一片文章](/blog/2020/04/20/JS-原型链/)

Object 与 Function 互为实例的关系，一定程度上也解释了 typeof 上对两者的区分

## Object.prototype.toString

`toString` 会返回一个表示这个对象的字符串，具体格式是

```js
`[object ${type}]`
```

个人理解是方括号、第一个 object 都是固定的，根据后边的 `type` 得到类型

### 方法的覆盖

很多对象都覆盖了 Object 原有的 toString 方法
```js
(10).toString(2) // '1010'，把 number 转换为 string，且是二进制表示

[1,2,'a'].toString() // '1,2,a'，返回数组元素

new Date.toString() // 'Sat Apr 30 2022 23:04:47 GMT+0800 (中国标准时间)'

({toString() {return 1}}).toString() // 1，开发者自定义的函数
```

因此，需要用 `call` 或者 `apply` 的方式，调用 `Object` 自己的 `toString`，具体是 `call` 还是 `apply` 无所谓，因为 `toString` 没有入参
```js
Object.prototype.toString.call([])        // [object Array]
Object.prototype.toString.call(new Date)  // [object Date]
Object.prototype.toString.call('abc')     // [object String]
Object.prototype.toString.call(123)       // [object Number]
Object.prototype.toString.call(null)      // [object Null]
Object.prototype.toString.call(undefined) // [object Undefined]
```

> 顺带一提，有这样的写法 `Function.prototype.apply.call(fn, this, args)`，而不是直接执行 `fn.apply(this, args)`，目的就是避免 fn 的 apply 方法已经被重写覆盖过

## 实践

### 判断数组
```js
// 1
Object.prototype.toString.call(input) === '[object Array]'

// 2
Array.isArray(input)
```

### 判断 NaN
`isNaN` 不够准确，它会把入参尝试转为 Number 之后再判断
```js
isNaN(undefined) // true
isNaN() // true
```


### 万能函数
```ts
const type = (input: any) => {
    // 先处理基本数据类型
    if(input === null) {
        return 'null'
    }
    if((typeof input).match(/^(number|string|boolean|symbol|undefined)$/)) {
        return typeof input
    }
    // 注意 不能用 typeof input !== 'object' || 'function' 来安全的判断 input 为基本数据类型，因为在一些浏览器（IE），某个对象的值可能为 'unknown' 等

    // 再处理引用类型
    return Object.prototype.toString.call(input)
}
```

## 参考
[掘金](https://juejin.cn/post/7017697306652704798)
[掘金](https://juejin.cn/post/7029111905956397070)
