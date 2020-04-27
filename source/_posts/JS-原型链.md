---
title: JS 原型链、this 与 class
date: 2020-04-20 17:13:43
tags: [JS]
categories: [面试基础]
---

# 原型链

## 目的

实现属性、方法共享

## 方法

为（构造）函数的 prototype 属性增加字段。
用 new 关键字 + 构造函数，实现创建一个对象。这个语句就会返回一个“含有”构造函数 prototype 里属性和方法的新对象。

```js
function Dog(name) {
  this.type = "doggy";
  this.name = name;
}
Dog.prototype.getName = function () {
  // 非严格模式
  return this.name;
};

const Alaska = new Dog("las");
```

这样`Alaska`这个对象就可以调用`getName`方法了，它由`Dog`函数共享。

```js
Alaska.getName(); // las
Alaska.type = "doggy";
```

### new 操作中究竟发生了什么？

```js
const Alaska = new Dog("las");

// 等效于
const Alaska = new Object(); // 新建对象
Alaska.__proto__ = Dog.prototype; // 原型引用
Dog.call(Alaska); // 调用构造函数，绑定 this
```

## 原型链

执行`Alaska.getName()`会首先在`Alaska`本身查找`getName`属性，找不到，则寻找原型。
想要获得其原型，可以通过`Object.getPrototypeOf`方法，或者更常见但已经被**弃用**的直接访问`__proto__`属性。

```js
Object.getPrototypeOf(Alaska);
// 或者
Alaska.__proto__;
```

它们指向同一个对象，也就是`Dog.prototype`。其中包含了`getName`属性，调用它。

这就是「链」的概念。自身找不到的属性/方法，就去原型上找；原型上找不到，就再在原型的原型上找。
原型本身就是对象，原型链的顶端指向`Object.prototype`，其中有`hasOwnProperty`、`toString`等方法。而`Object.prototype`的原型指向 null。

```js
Object.prototype.__proto__; // null
```

## 创建对象的方法

- 用语法结构创建

  ```js
  let o = { a: 1 };
  // o 继承了 Object.prototype 里的所有属性

  let a = ["N", "M", "$", "L"];
  // a 继承于 Array.prototype（indexOf，map）

  function f() {}
  // 函数也是一种对象，f 继承于 Function.prototype（call、bind）

  let r = /^[a-z|A-Z]&/;
  ```

- 用构造函数创建

  用`new`操作符作用的函数被称为构造函数。

  ```js
  function Graph() {
    this.x = 0;
  }

  Graph.prototype.move = function () {
    this.x += 1;
  };

  let g = new Graph();
  // g.__proto__ === Graph.prototype，g 的原型指向 Graph 的 prototype 属性
  // g.__proto__.__proto__ === Object.prototype
  // Graph.__proto__ === Function.prototype
  // Graph.__proto__.__proto__ === Object.prototype
  ```

  其中，构造函数不带括号`new Foo`和`new Foo()`的写法一样，相当于没有指定参数的情况下调用。

- 用 Object.create 创建

  ES5 引入的方法，返回值是一个对象，原型为第一个参数。

  ```js
  let a = { c: 1, d: 2 };

  let b = Object.create(a);

  // b.__proto__ === a

  let c = Object.create(b);

  // c.__proto__ === b
  ```

  *几乎*所有的 JS 对象都是原型链顶端`Object`的实例（共享它的属性和方法）,但也有例外：

  ```js
  let n = Object.create(null);
  // c.__proto__ === null

  n.hasOwnProperty();
  // error: n.hasOwnProperty is not a function
  // n 原型链上没有 hasOwnProperty，而 Object.prototype 中有。
  ```

- 用 class 关键字创建

  ES6 新特性，见后文。

### 总结一下

构造函数将想共享的属性和方法写入原型对象，其生成的实例就可以调用他们。
构造函数定义 prototype，而实例则访问`__proto__`或者`Object.getPrototypeOf`，查找原型链上的属性和方法。

在原型链中查找属性对性能有副作用；有两个方法**不会**遍历原型链：`Object.prototype.hasOwnProperty()`和`Object.map`

# this

`this`是一个大坑，在各个语境下的值都可能不同，在浏览器环境或者 Node 运行时中也不一样，因此会分情况讨论。
总的来说`this`大都出现在函数内部，

> 通常，在普通函数中指向被*调用*时的对象，在箭头函数中取决于被*定义*时的上下文

## 全局环境

this 指向全局对象`globalThis`，在浏览器环境中它就是`window`，它实现了 setTimeout 等函数。

## 函数内部

函数内部的 this 值取决于函数被调用的方式。

### 构造函数中的 this

构造函数通常是不写返回值的。这样在函数内 this 定义的属性/方法，就会被绑定到新构造出的对象上，this 自身指向这个对象。

```js
let F = function () {
  this.a = 1;
};

let f = new F();
f.a; // 1
```

构造函数如果有了返回值，那对 this 设置的属性/方法都没意义了。

### 对象内方法中的 this

形如`a.b()`，this 指向这个方法的对象。

```js
let a = {
  b: function () {
    // 这里用箭头函数 this 就为全局对象了
    return this.c;
  },
  c: 3,
};

a.b(); // 3
```

### 非箭头函数的简单调用

**严格模式**下保持进入执行环境（execution context）时的值，如果执行环境未定义，则为 undefined

```js
"use strict";
function a() {
  console.log(this);
}

a(); // undefined
```

**非严格模式**下指向调用函数的对象

```js
// "use strict";
function a() {
  console.log(this);
}

a(); // 浏览器中为 window
```

- 可以通过 call、apply 来传递不同环境下的 this 值。常用于调用对象内部方法之外的情况

  ```js
  function logA() {
    console.log(this.a); // this 的值取决于函数的调用方式（非严格模式）
  }

  let x = { a: 1 };
  let y = { a: 2 };

  logA.call(x);
  logA.call(y);
  ```

  call、apply 的区别在于第一个参数后边的写法，是传一个参数数组，还是一个一个把参数写明。

- 也可以用 bind 创建一个 this 被*永久*绑定的函数。
  这一点在 React 的 class component 里非常常见

  ```js
  function logA() {
    console.log(this.a);
  }

  let binded1 = logA.bind({ a: 2 });
  binded1(); // 2

  let binded2 = logA.bind({ a: 3 });
  binded2(); // 3

  let binded3 = binded2.bind({ a: 4 });
  binded3(); // 3 ，bind 只会生效一次，this 已经被永久绑定到 { a: 3 } 了
  ```

### 箭头函数和其中的 this

箭头函数*不会*创建 this，而是从作用域链上层继承 this。箭头函数和普通的声明`function`的函数区别之一是，箭头函数的 this 在其被**定义**时就确定了。

```js
let that = this;
let a = {
  b: 10,
  logB: () => console.log(this.b, this === that),
  logB2: function () {
    console.log(this.b, this);
  },
};

a.logB(); // undefined, true
a.logB2(); // 10, a 自己
```

`logB`是一个箭头函数，由于对象*字面量*内部不会开辟新的作用域，所以`logB`所在作用域就是全局作用域，箭头函数里的 this 指向全局对象。
`logB2`是一个普通函数，在调用时才会决定 this 值，所以执行`a.logB2()`时，`logB2()`里的 this 指向 a

可见，在对象*字面量*里用箭头函数定义方法，可能会有预期之外的错误。如果是在构造函数里用箭头函数定义方法，则不会有这个问题：

```js
function F(name) {
  this.name = name;
  this.logName = () => {
    console.log(this.name);
  };
}

let f = new F("lbw");
f.logName(); // lbw
```

构造函数还是函数，会开辟自己的作用域，在里边 this 指向被新构造的对象，因此用箭头函数内的 this 也会指向这个新对象。

#### 箭头函数不可以作为构造函数

和`new`一起用会报错

#### 箭头函数没有 prototype 属性

```js
let F = () => {};

F.prototype; // undefined

F.prototype.a = 1; // TypeError: Cannot set property 'a' of undefined
```

```js
let F = () => {};
new F(); // TypeError: F is not a constructor
```

### DOM 事件处理函数、HTML 内联事件处理函数

非箭头函数下 this 都指向 DOM 元素本身。

```js
let root = document.getElementById("root");

root.onclick = function (e) {
  console.log(e.currentTarget === this); // true
};
```

```HTML
<div onclick="console.log(this)">点击</div>
<!-- this 为 DOM 元素本身 -->
```

箭头函数下为 window

```js
let root = document.getElementById("root");

root.onclick = (e) => {
  console.log(e.currentTarget === this); // false，this === window
};
```

### 面试题解析

```js
let obj = {
  bar: function () {
    let x = () => this;
    return x;
  },
};

let fn = obj.bar();

console.log(fn());

let fn2 = obj.bar;

console.log(fn2()());
```

用字面量创建一个对象，其中 bar 方法是用 function 关键字定义的普通函数，所以 bar 内部的 this 会在其被调用时决定。

fn 是 obj.bar() 的返回值，也就是说调用 bar 的是 obj，this 指向 obj
而 bar() 本身返回一个箭头函数，箭头函数内的 this 是继承自外部作用域的，所以指向 bar 内部的 this，根据前边的分析，指向 obj

fn2 则是单纯的做了一个引用赋值操作，将 fn2 指向一个函数对象所在的内存。上边的写法和直接定义 fn2 为函数没区别。

```js
// 另一种写法
let fn2 = function () {
  let x = () => this;
  return x;
};
```

所以 fn2()() 指向全局对象。

## 额外阅读

<https://github.com/mqyqingfeng/Blog/issues/4>
