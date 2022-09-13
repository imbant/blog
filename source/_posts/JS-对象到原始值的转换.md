---
title: JS 对象到原始值的转换
date: 2022-8-12
tags: [JS]
---

## 背景
工作中遇到一个 [Long.js](https://www.npmjs.com/package/long) 对象，它通过对象的方式存一个 `Long` 类型的数据。大致长这样：
```ts
interface Long {
    low: number,
    high: number,
    unsigned: boolean,
}
```

用对象去存数值，自然就涉及到怎么用基本数据类型表示它的问题，也就是说需要把对象转换为 `number` 或者 `string` 等类型

# ES6 的现代方案
### Symbol.toPrimitive
ES6 为对象新增了许多内置方法，`Symbol.toPrimitive` 是其中之一。当对象转为原始值时，会调用这个方法。

```js
const a = {
  [Symbol.toPrimitive]: function() {
    return this.b
  },
  b: 2
}

+a // 2
```

### 什么时候会被转为原始值
这里有个很模糊的概念，对象什么时候会被转为原始值？
没有找到特别明确的范围，只能归纳一些经典场景：

- 被算术运算符作用时，如 `+` `-`，需要转为 `number`
- `window.alert`、`String()`、模板字符串 `` `${obj}` `` ，需要转为 `string`
- `!` 需要转为 `boolean`，当然，对象转为 `boolean` 都为 `true`

剩下的基本数据类型中，`null`、`undefined`、`Symbol` 显然是没有转换的意义的

### hint
可见把对象转为基本数据类型，需要关注具体转为 `number` 还是 `string`。

`Symbol.toPrimitive` 这个方法会有一个入参，被称为 `hint`，具体值可以是 `'number'`、`'string'` 或者 `'default'`。

可以认为 `hint` 是语言内置的「提示」，在上述场景下调用 `Symbol.toPrimitive` 时，JS 会自动传入对应的 `hint`。

如果 JS 认为是字符串，就会传 `'string'`，如果认为是数值，就会传 `'number'`，如果有些场景既可能是字符串，有可能是数值，无法判断，就会传 `'default'`

开发者可以根据 `hint` 定制对象在特定的转换场景下的行为
```ts
const obj = {
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
        if(hint === 'string') {
            return 'abc'
        } else if(hint === 'number') {
            return 123
        } else if(hint === 'default') {
            return '5'
        }
    }
}

`${obj}`    // 'abc' 认为是 string
+obj        // 123   认为是 number
obj - 100   // 23    在减法里认为是 number
obj + 'c'   // '5c'  字符串和数值都有加法，认为是 default
obj == '5'  // true  字符串和数值都可以进行 == 比较，认为是 default
obj === '5' // false 不过 strict equality 不会做类型转换
```

## ES6 之前的方案
`Symbol.toPrimitive` 是 ES6 之后的解决方案。在此之前，已有的对象通过实现 `valueOf` 和 `toString` 方法，来转换成原始值。

值得注意的是，`hint` 的概念是一直存在的，`Symbol.toPrimitive` 只是一个显式的获取 `hint` 的途径。

注意，如果 `hint` 为 `'string'` 会调用对象的 `toString`，其它 `hint` 会调用 `valueof`，这里没有 `default` 的概念

### valueOf 与 toString
`Object` 的 `prototype` 里定义了 `valueOf` 和 `toString` 两个方法，可供后续覆写——由对象自定义转换为原始值时的行为。

对原型来说，`Object.prototype.valueOf` 会返回对象自身；`Object.prototype.toString` 会返回 `'[object type]'`，比如 `'[object Object]'`

## 实践：为什么 Date 对象可以做相减操作

JS 没有类似 C++ 那样的运算符重载的能力，对象之间相减，会尝试把它们转换为 number 后，再做计算。

`Date.prototyle.valueOf` 会返回自身的 Unix 时间戳，因此两者的减法，就是相对时间的长度了。

## 兜底与多次转换
通过 `Symbol.toPrimitive`、`valueOf`、`toString` 转换原始值，需要这些方法返回**原始值**，否则，就会尝试别的方法来转换。例如对象原生的 `valueOf` 返回自身，是一个对象，就不能用于原始值的转换，就会尝试 `toString`。

转换的算法是：

1. 如果 `Symbol.toPrimitive` 存在，调用它
2. 不存在或者返回值不是原始值：
    
    1. 如果 hint 是 'string'：尝试调用 `toString`，如果返回值不是原始值，尝试调用 `valueOf`
    2. 如果 hint 是 'number' 或者 'default'：尝试调用 `valueOf`，如果返回值不是原始值，尝试调用 `toString`


```js
const a = {
    toString() {
        return "123"
    }
}

+a // 123， number 而非 string
```
1. 没有 `Symbol.toPrimitive`，因为是一元加法，`hint` 为 `'number'`，兜底到 `valueOf`；
2. `valueOf` 默认返回 `a` 自身，不是原始值，兜底到 `toString`；
3. 返回 `string` 后，`+"123"` 表达式就是一个基本数据类型的转换了，得到 `number`

--------------
2022.9.13 补充

在测试中又碰到几个`对象字面量`在运算中的奇妙现象
```js
{} + 1       // 1
({}) + 1     // '[object Object]1'
{a: 1} + 1   // 1
({a: 1}) + 1 // '[object Object]1'

const a = 1
a + 1        // '[object Object]1'
```

这是由于引擎对 `{}` 这个词法的解析，有二义性：`Block` 和 `Object` 两种语法。

通过 `()` 或者变量引用的方式，引擎才能正确把它解析为对象，然后调用 `toString` 方法。

当然，这就涉及到经典的 `{} + {}`、`{} + []` 这类特色语法问题了，在此不提。


## 参考资料
https://zh.javascript.info/object-toprimitive