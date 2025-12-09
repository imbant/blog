---
title: "ES6 合集"
date: "2021-10-02"
tags: ["JS"]
toc: true
description: "从语言层面提供一种不会重复的唯一性的值，而不关心具体的值是什么。"
---


## Symbol

### 目的
从语言层面提供一种不会重复的唯一性的值，而不关心具体的值是什么。

`Symbol` 函数可以创建 Symbol 值，调用两次函数，会得到两个不同的值。
入参可以为字符串，用以在调试时控制台输出时更*可读*。但即使用同一个字符串创建两个 Symbol，其值也是**不同**的。

```js
const a = Symbol()      // Symbol()
const b = Symbol()      // Symbol()
a === b // false
```
```js
const c = Symbol('x')   // Symbol(x)
const d = Symbol('x')   // Symbol(x)
c === d // false，x 只是对值的描述，而非真的值
```

Symbol 值是基本数据类型而非对象，创建时也不应该用 `new` 关键字
```js
typeof Symbol() // 'symbol'
```
```js
new Symbol() // TypeError，Symbol 不是构造函数
```

Symbol 可以转为 string 和 boolean
```js
const sb = Symbol('s')
String(sb)     // 'Symbol(s)'
sb.toString()  // 'Symbol(s)'
```
```js
!sb   // false
!!sb  // true
```

### 唯一的 key
对象的 key 使用 Symbol 命名，可以保证唯一性，避免被不小心覆盖

```js
const symbolKey = Symbol() // 以下三种方法等价
```
```js
const obj = {}
obj[symbolKey] = 'hello'
```
```js
const obj = {
    [symbolKey]: 'hello'
}
```
```js
let obj = {}
Object.defineProperty(obj, symbolKey, {value: 'hello'})
```

取值时需要用方括号，否则会被当作一个 string 的 key
```js
obj[symbolKey] // 'hello'
```

### 遍历对象中的 Symbol 属性
Symbol 作为对象的 key 时，**不会**被 `for in` `for of` `Object.keys()` `Object.getOwnPropertyNames()` `JSON.stringify` 遍历到。

`Object.getOwnPropertySymbols` 可以得到对象中所有用作 key 的 Symbol

```js
const a = {}
const s = Symbol('key')
a[s] = 1

for(let key in a) {
    console.log(key) // 无输出
}

Object.getOwnPropertyNames(a) // []
Object.getOwnPropertySymbols(a) // [Symbol(key)]
```

### 唯一的 value
例如要维护一个 local storage 的 key，保证唯一性：
```js
const localStorageKey = {
    key1: 'key1', // 这个 value 值本身其实是无意义的，只会用来判断唯一性，而且编码时需要人工确认 value 唯一
    key2: 'key2',
}
```

此时 value 就可以换为 Symbol，来移除这些无意义的字符串
```js
const localStorageKey = {
    key1: Symbol(),
    key2: Symbol(),
}
```

### 获取同一个 Symbol 值

Symbol 提供了一个全局的登记机制，来实现重新使用同一个 Symbol 值
```js
Symbol.for('key1') === Symbol.for('key1')  // true
Symbol('key2') === Symbol('key2')          // false
```

`Symbol.for()` 与 `Symbol()` 的不同在于，`Symbol()` 无论入参是什么都会返回一个全新的 Symbol，而 `Symbol.for()` 会检查对应的 key 是否已经被登记，登记了就返回同一个 Symbol，否则新建一个 Symbol。

`Symbol.keyFor()` 返回一个已经登记过的 Symbol 的 key
```js
const s = Symbol.for('key')
Symbol.keyFor(s) // 'key'
```

由于这个全局机制，在不同作用域下登记过的 key，都会被全局记录下来，不分作用域，可以用在不同的 iframe 或者 service worker 中取同一个 Symbol。


## Map 与 Set
`Object` 是一种键值对的结构，但 key 只能是 `String` 或者 `Symbol`。作为扩展，出现了可以用任何数据类型作为 key 的键值对结构：Map

### Map
通过 set、get、has 来读写值，通过 clear 清空，通过 size 得到大小，array-like
```js
const a = new Map()
const obj = {}

a.set(obj, 1)
a.get(obj)      // 1
a.has(obj)      // true
a.size          // 1

a.set(obj, 2)
a.get(obj)      // 2，会被覆盖，key 是唯一的
```

与 Object 的区别：

1. Map 的 key 可以是任意数据类型
2. Map 实现了可迭代协议，可以被 `for..of` 这样的语法迭代
3. Map 是**有序**的，迭代时会按照 set 的顺序遍历元素

### Set
与 `Map` 相比，`Set` 是值的集合，没有 `key` 的概念。但 `Set` 会保证集合里的值都是唯一的，不会重复

```js
const a = new Set()

a.add(1)
a.has(1)  // true
a.add(3)
a.size    //  2
a.add(1)
a.size    //  2
```

`Set` 同样可以迭代，迭代时**有序**

通过构造函数，`Set` 可以用于数组去重：
```js
const a = [1, 2, 5, 3, 1, 2]
const b = [...new Set(a)]
```

## Iterator 与 for of 循环

JS 表示「集合」概念的数据结构，有 `Array` `Object` `Map` `Set`。以下的迭代（iterate）协议定义了他们的迭代行为，可以理解为如何「遍历」这些集合。

### 迭代器(Iterator)协议

考虑对数组的遍历，需要两个状态：1. 当前迭代的值，2.迭代是否结束。
一个对象需要实现一个 `next()` 属性，才能成为迭代器：
```js
const iterator = {
    next() {
        //...
        return {
            value: 1,    // 当前迭代的值
            done: false  // 迭代是否结束
        }
    }
}
```
这样就可以通过调用 `iterator.next()` 的方式来遍历，直到 done 为 `true`（也可以永远是 `false`，无限长）

### 可迭代协议

一些语法和 API 需要可迭代对象： 
- `for...of` `...展开语法` `yield*` `解构赋值`
- `new Map([iterable])` `new Set([iterable])` `Promise.all(iterable)` `Promise.race(iterable)` `Array.from(iterable)`

可迭代对象需要实现 `[Symbol.iterator]` 函数，这个函数无参数，返回一个迭代器。其中 `Symbol.iterator` 是 Symbol 内置的11个值之一，这些内置值都指向语言内部使用的方法
可以用 TS 来描述这三种类型
```ts
// 可迭代对象
interface Iteratorable {
    [Symbol.iterator](): Iterator
}

// 迭代器
interface Iterator {
    next(): IterationResult
}

// 迭代结果
interface IterationResult {
    value: any,
    done: boolean
}
```

### 迭代协议的应用

原生可迭代对象如下，这些对象都可迭代，比如放入 `for...of` 语句中
- Array
- Map
- Set
- String **可以特别注意下，字符串是可迭代的**
- TypedArray
- 函数的 arguments 对象
- NodeList 对象

调用 Array 的 `[Symbol.iterator]` 函数：
```js
const arrIterator = [1, 2, 3][Symbol.iterator]()
arrIterator.next() // { value: 1, done: false }
arrIterator.next() // { value: 2, done: false }
arrIterator.next() // { value: 3, done: false }
arrIterator.next() // { value: undefined , done: true }
```

原生的 Object 是不可迭代的，需要开发者手动定义对象被遍历时的行为。
可以自定义一个类似 Array 的对象，用 Array 的 `[Symbol.iterator]` 函数，在 `for..of` 中表现出 Array 的特性
```js
const obj = {
    0: 'a',
    1: 'b',
    2: 'c',
    length: 3,
    [Symbol.iterator]: Array.prototype[Symbol.iterator]
}

for (const i of obj) {
    console.log(i) // 'a', 'b', 'c'
}
```

## for...of、for...in、Array.prototype.forEach、for await...of
### for...in
为遍历对象的属性而构建。会遍历对象**和原型链**上的可枚举属性。相应的 `Object.keys` `Object.getOwnPropertyNames` 只会遍历对象自身的可枚举属性，不管原型链。
因此**不应该**用于遍历 Array ：
- 会遍历到数组上手动添加的属性，而不只是 index；
- 不能保证遍历顺序；
- 只能得到 index，还需要手动取 value
```js
const arr = [1,2,3]
arr.foo = 'f'
Array.prototype.newName = 'f'

for(const i in arr) {
    // 0, 1, 2, 'foo', 'newName'
}
```

### Array.prototype.forEach 
是数组内部提供的遍历函数。缺点在于无法 `break` 和 `continue`

### for...of
比起 `for...in`，基于可扩展的协议，扩展性更好

对象必须定义了迭代方式 `[Symbol.iterator]` 才能迭代

Array 的迭代协议：针对 `for...in` 的缺点，Array 的迭代协议：
- 不会迭代到手动添加的属性
- 会遍历 value 而不是 index
```js
const arr = ['a', 'b', 'c']
arr.foo = 'f'

for(const i of arr) {
    // 'a', 'b', 'c'
}

for(const i in arr) {
    // 0, 1, 2, 'foo'
}

```

## Proxy

## class

## es module

## Generator 函数