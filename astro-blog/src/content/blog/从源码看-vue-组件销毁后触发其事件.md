---
title: "从源码看 Vue 组件销毁后触发其事件"
date: "2023-07-25"
tags: ["Vue"]
description: "记录一个 Vue 组件事件的边界情况。项目中有一个组件，是一个面板，可以通过拖拽改变自身尺寸，也可以被关闭。"
---


## 从一个 bug 说起

记录一个 Vue 组件事件的边界情况。项目中有一个组件，是一个面板，可以通过拖拽改变自身尺寸，也可以被关闭。

面板尺寸有变化后，需要通知父组件 `resize` 事件。例如，其他非响应式的 DOM 利用这个事件更新尺寸
而点击关闭按钮后，需要通知父组件 `close` 事件。同时，这也是一个 `resize` 事件。

面板：

```vue
<!-- ChildComponent.vue -->
<template>
  <button @click="handleClick">close</button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit("close");

      // ... 一大段其他逻辑后

      this.$nextTick(() => {
        this.$emit("resize");
      });
    },
    // ... 其他触发 resize 事件的函数
  },
};
</script>
```

由于 `resize` 事件和 DOM 变化相关，因此潜意识里使用了 `$nextTick`。这为 bug 埋下了伏笔。

父组件收到 `close` 事件后，会销毁这个组件：

```vue
<!-- App.vue -->
<template>
  <ChildComponent
    v-if="showChild"
    @close="handleClose"
    @resize="handleResize"
  />
</template>

<script>
export default {
  components: {
    ChildComponent,
  },
  data() {
    return {
      showChild: true,
    };
  },
  methods: {
    handleClose() {
      this.showChild = false;
    },
    handleResize() {
      // ...
    },
  },
};
</script>
```

现象是，`close` 事件触发后，`resize` 事件**没有触发**。父组件没有执行 `handleResize`

原因就在于子组件内，先触发了 `close` 事件，导致自身销毁，然后在 `nextTick` 才触发 `resize`。从逻辑上，已经销毁的组件无法再触发事件了，所以父组件没有收到这个事件。

## 看看源码

bug 的直接原因找到了。这次从 Vue 源码的角度，看看为什么会有这个问题。

由于现在（2023 年）Vue2 快要不维护了，[仓库](https://github.com/vuejs/vue)改动会小一些，因此用 2 版本，直接贴源码看看：

```typescript
// https://github.com/vuejs/vue/blob/d6bdff890322bc87792094a1690bcd16373cf82d/src/core/instance/events.ts

Vue.prototype.$emit = function (event: string): Component {
  const vm: Component = this;
  if (__DEV__) {
    // 开发环境检查
  }
  let cbs = vm._events[event];
  if (cbs) {
    // ... 调用 cbs
  }
  return vm;
};
```

能看到，调用 `$emit` 实际上是在组件的实例 `vm` 上，从 `_events` 属性里找回调函数，然后调用的。

在 webpack 项目中，打开 sourcemap，就能在浏览器里给 js 版本的 Vue 源码断点了。
利用断点看看 `close` 和 `resize` 时有什么不同

`close` 事件：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/vue-emit-sourcecode/emit-close.png)

点击立即触发 `close` 事件时，实例中有 `close` 和 `resize` 两个回调。

`resize` 事件：
![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/vue-emit-sourcecode/emit-resize.png)

经过一个 tick，实例已经销毁（`_isDestroyed: true`），`_events` 回调也清空了，因此不会调用到父组件的函数。

一句话来说，就是 `nextTick` 的时机，如果在组件销毁之后，组件实例的事件回调已经清空了，因此 `$emit` 不会生效。

## 验证结论

我们加一些 log，用 `setTimeout` 验证这个结论：

```js
//  ChildComponent.vue
export default {
  methods: {
    handleClick() {
      this.$emit("close");
      this.$nextTick(() => {
        console.log("nextTick");
        this.$emit("resize");
      });
      setTimeout(() => {
        console.log("timeout");
        this.$emit("resize");
      });
    },
  },
  destroyed() {
    console.log("destroyed");
  },
};
```

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/vue-emit-sourcecode/settimeout.gif)

可见，触发父组件的 `handleClose` 后，子组件会率先销毁，而 `nextTick` 和前边的回调都在一个事件循环内，执行完了，才执行 `setTimeout` 的宏任务。

## Vue 什么时候清理 event 回调？

通过 performance 录制，我发现点击按钮时，会调用 `$destroy`，这个时机应该是父组件更新 virtual DOM 后发现子组件可以销毁时。

![img](https://imbant-blog.oss-cn-shanghai.aliyuncs.com/blog-img/vue-emit-sourcecode/vuedestroy.png)

```typescript
// https://github.com/vuejs/vue/blob/74ca5a13ba12a31580f1567e7c6d789e96730e46/src/core/instance/lifecycle.ts
Vue.prototype.$destroy = function () {
  const vm: Component = this;

  // ...

  // turn off all instance listeners.
  vm.$off();

  // ...
};
```

重点是 `vm.$off();`，它是组件实例的方法，用于手动移除自定义事件监听器。

## 总结一下

首先，调用 `$emit` 可能不会正确触发父组件的回调，例如通过 `nextTick` 延迟调用，而此时组件已经销毁时。

其次，验证了 `destroy` 生命周期回调会早于 `nextTick`，他们都在一个宏任务中，早于 `setTimout` 的下个任务。所以 `setTimeout` 里的 `$emit` 也是无效的。

最后，通过给 webpack 设置 sourcemap 的方式，在浏览器中给 Vue 源码设置断点，并且利用浏览器的 Performance 工具，发现 `$destroy` 中会调用 `$off` 来清除事件监听，所以在这之后的 `$emit` 已经没有回调了。

不过这里没有任何 debug 消息，也许这里可以优化为，`$emit` 触发不存在的事件时，抛出一个 warning 告知开发者。

## 测试代码

App.vue

```vue
<template>
  <ChildComponent
    v-if="showChild"
    @close="handleClose"
    @resize="handleResize"
  />
</template>

<script>
import ChildComponent from "./components/ChildComponent.vue";

export default {
  components: {
    ChildComponent,
  },
  data() {
    return {
      showChild: true,
    };
  },
  methods: {
    handleClose() {
      console.log("parent: handleClose");
      this.showChild = false;
    },
    handleResize() {
      console.log("parent: handleResize");
    },
  },
};
</script>
```

ChildComponent.vue

```vue
<template>
  <button @click="handleClick">close</button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit("close");
      setTimeout(() => {
        console.log("child: timeout");
        this.$emit("resize");
      });
      this.$nextTick(() => {
        console.log("child: nextTick");
        this.$emit("resize");
      });
    },
  },
  destroyed() {
    console.log("child: destroyed");
  },
};
</script>
```
