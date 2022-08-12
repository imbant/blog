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

可以认为是 `hint` 一种语言内置的「提示」，在上述场景下调用 `Symbol.toPrimitive` 时，JS 会自动传入对应的 `hint`。

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
`Symbol.toPrimitive` 是 ES6 之后的解决方案。在此之前，“老派”的做法是实现 `valueOf` 和 `toString` 方法。

值得注意的是，`hint` 的概念是一直存在的，`Symbol.toPrimitive` 只是一个显式的获取 `hint` 的途径。在 ES6 之前，如果 hint 为 `string` 会调用 'toString '，其它 hint 会调用 valueof

### valueOf 与 toString


## 为什么 Date 对象可以做相减操作

JS 没有类似 C++ 那样的运算符重载的能力，对象之间相减，会遵循二元减法运算符的语法（TODO: 这个语法待补充），应该是把两个对象转为 number 之后再做减法

## 兜底与多次转换
Symbol.toPrimitive、valueOf、toString 优先级关系、注意当返回值不是基本数据类型，会调用另一者，然后尝试再做转换

```js
const a = {
    toString() {
        return "123"
    }
}

+a // 123， number 而非 string
```
没有 Symbol.toPrimitive，兜底到 valueOf，没有 valueOf，兜底到 toString，返回 string 后，再把它从 "123" 转为 123，得到 number


## 参考资料
https://zh.javascript.info/object-toprimitive