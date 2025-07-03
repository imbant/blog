---
title: "JS defineProperty"
date: "2022-05-03"
tags: ["JS"]
toc: true
description: "`Object.defineProperty`，这个方法用于在对象上定义属性，语法是"
---


## 背景
`Object.defineProperty`，这个方法用于在对象上定义属性，语法是
```js
const a = {}
Object.defineProperty(a, 'b', {
  value: 1
})

a.b // 1
```

对象里的属性有两种
1. 数据属性（data properties），常见的大多属性
2. 访问器属性（accessor properties），指 `getter` 和 `setter`

`defineProperty` 第三个参数是对象，通过配置不同的 key（被称为 descriptor，描述符），来定义一个属性是数据属性还是访问器属性

其中有两个 key 是两种属性都有的
1. `configurable` 定义这个属性是否「可配置」，为 `false` 时不能再次改变这些 key，也无法删除这个属性
2. `enumerable` 定义这个属性是否「可枚举」，为 `false` 时在 `for .. in`、`Object.keys()` 里不会被遍历到

还有四个 key：`value` `writable`（数据属性特有） `get` `set`（访问器属性特有）。
值得注意的是，`configurable` `enumerable` `writable` 默认是 `false`；`value` `get` `set` 默认是 `undefined`

`Object.getOwnPropertyDescriptors` 这个 API 可以查看对象属性上的描述符，比如 `Object.prototype.hasOwnProperty` 是不可枚举，可写可配置的

## 数据属性
数据属性特有的 key：
1. `value` 属性的值
2. `writable` 定义这个属性是否「可写」，为 `false` 是不可写

```js
const a = {}
Object.defineProperty(a, 'b', { writable: false, value: 1 })
a.b = 2 // 严格模式下会报错，非严格模式下不会报错，但值不会改变仍然是1

console.log(a.b) // 1
```
联想到 `Vue` 的 `readonly` 语法，也是只读


## 访问器属性
总的来说，`getter` 和 `setter` 是通过*编程能力*去读写属性的语法

### 访问器属性特有的 key
1. `get` 函数，在读取这个属性时执行
2. `set` 函数，在属性被设置时执行

这就是所谓的 getter 和 setter 了
```js
const person = {
  name: 'lu',
  surname: 'benwei'
}
Object.defineProperty(person, fullName, {
  get() {
    return this.name + this.surname
  }
  set([name, surname]) {
    this.name = name
    this.surname = surname
  }
})
person.fullName // 'lubenwei'
person.fullName = ['sun', 'xiaochuan']
person.fullName // 'sunxiaochuan'
```

可见，`getter` 是一个没有入参的函数，其返回值是外部访问属性时拿到的值，`setter` 是只接收一个参数的函数，其内部决定属性被设置时的行为

> 与数据属性相比，可以理解为 getter 与 value 对应，setter 与 writable 对应

### class 内的 getter 和 setter
在 `class` 语法内也可以直接定义 `getter` 和 `setter`

```js
class A {
    name = 'lu'
    surname = 'benwei'
    get fullName() {
        return this.name + this.surname
    }
    set fullName([name, surname]) {
        this.name = name
        this.surname = surname
    }
}

const a = new A()
a.fullName // 'lubenwei'
a.fullName = ['sun', 'xiaochuan']
a.fullName // 'sunxiaochuan'
```

### 删除 getter、setter
可以通过 `delete` 删除这个访问器属性，语法上和删除普通的数据属性一样。
当前，前提是 `configurable` 为 `true`，是可配置的

```js
delete a.fullName // true
a.fullName // undefined
```

## 可枚举属性

上文说过，`Object.defineProperty` 里设置 `enumerable` 为 `true` 的属性，是可枚举属性，它在遍历对象的属性时发挥作用。
考虑这样的场景：大部分对象的原型最终都指向 `Object.prototype`，对于 `for..in` 这样会顺着原型链遍历属性的语法来说，把 `hasOwnProperty` `toString` `isPrototypeOf` 这些属性都遍历到，大多情况下是不是冗余的？可枚举属性就解决了这个问题，这些属性都是不可枚举的，不会被遍历到，让开发者更关注需要的属性。

### 关注可枚举性的语法
`for..in` 迭代对象上除 `Symbol` 外的可枚举属性，包括原型链
`Object.keys` 迭代对象上除 `Symbol` 外的可枚举属性，*不*包括原型链
`Object.prototype.hasOwnProperty()` 检查对象自身有没有指定属性（*不*包括原型链），只关注可枚举属性

### 不关注可枚举性的语法
`in` 如果指定的属性在指定的对象或其原型链上，表达式返回 `true`，不可枚举属性也适用

### 可迭代对象
这里顺便说一嘴，「可迭代」和「可枚举」有一点容易混淆，可迭代是指对象的属性 `enumerable` 为 `true`；可枚举是指对象实现了 `[Symbol.iterator]` 方法。两者没什么关联，只是在 `for..in` `for..of` 区分时都会涉及到