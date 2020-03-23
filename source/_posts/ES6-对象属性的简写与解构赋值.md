---
title: ES6 对象属性的简写与解构赋值
date: 2019-08-13 15:40:41
tags: [ES6, JS]
---

# 允许在对象中直接写变量而不写属性值，这样属性名就是变量名

以下写法是等效的

```JavaScript
let a = {
  func: function() {return 1}
}
```

和

```JavaScript
let a = {
  func() {return 1}
}
```

func 为一个变量，为其赋值一个函数对象

# 一个关于属性简写的例子解析：
例子：

```JavaScript
({count}) => ({count})
```

解析： 
1. 这是一个匿名函数，参数为一个对象，返回值也是一个对象。 

2. 箭头函数的语法：

  1. 若写为 () => 1，则表示该函数返回值为 1

  2. 若写为 () => {1}，则表示该函数执行内容为一个表达式，值为 1，由于没有显式 return，返回值为 undefined

  3. 若想让箭头函数返回一个对象（由大括号包围），则需要在对象外边套一层圆括号，表示圆括号内是一个表达式。写为 () => ({a: 1})，表示返回一个对象，字段 a 的值为 1  

3. 例子的参数：
  
  1. 参数类型为对象
  
  2. ES6 解构赋值语法，相当于
    ```JavaScript
      let obj1 = {x: 1, y:2, z:3}
      let {x, y, z} = obj1
      // x=1, y=2, z=3
      let obj2 = {count: 400}
      let {count} = obj2
      // count = 400
    ```
  
  3. 因此
    ```JavaScript
    function({count}) {}
    // 等效于
    function(obj) {let count = obj.count}
    ```
  
  4. 因此，参数写法的意义是：显式获取参数对象的 count 字段，并新建一个同名变量，其他字段一概不要 

4. 例子的返回值：

  1. 构造一个全新的对象并返回

  2. 这个对象中有一个字段也叫 count（也可以叫任何其他名字，只是正好和参数的字段重名了），值与参数中的 count 一样

  3. 由于字段重名，因此简写为 { count } 

5. 除去所有简写后，语法最简单（但是代码最多）的等效版本
    ```JavaScript
    function func(obj) {
      let count = obj.count
      return {
        count: count // 冒号右边的 count 和上边 let 声明的是同一个变量
      }
    ```

# 解构赋值相关
## 对数组的解构
```JavaScript
  [a, b] = [3, 4]
  // a = 3, b = 4
```
	
## 对对象的解构
```JavaScript
  ({a, b} = {10, 20})  // 不是在声明 a b 变量的时候解构赋值，则需要在表达式外边加括号
  // a = 10, b = 20
```
这里默认了左边变量的顺序需要和右边期望赋值的属性名顺序要一样。
如果右边的对象来自函数返回值，里边各个字段的顺序就不一定明确了。
例如
```JavaScript
{a, b} = example()
```
example 的返回值在这里是不清楚顺序的。但是我们很容易可以知道其中某些字段的名字。
例如，我们知道 example 函数返回的对象里有两个字段：foo 和 func。

可以这样用：
```JavaScript
  {func: a, foo:b} = example() 
```
这样就无须知道返回值字段的顺序了。

解构赋值还支持默认值：
```JavaScript
  {func: a, foo: b = 30} = example()
```
这样即使右边没有 foo 这个字段，b 也有默认值 30


完整的例子：
```JavaScript

  function ex() { 
    return {foo: 30, func: 10} 
  }
  let a, b
  ({func: a, foo: b = 40} = ex())
  
// a = 10, b = 30
```