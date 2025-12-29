TODO：
前端加密:react-native-quick-crypto, 直接给后端发送加密内容进行存储
各个tab页布局
登录认证
...
[zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)

[react-native](https://reactnative.dev/docs/flatlist)

TODO:分类图标颜色：统一配色|调色板自定义配色

### 侧滑手势 (Swipe Actions)：

- 当前痛点：用户必须仔细点击那个圆形的恢复按钮。
- 建议：引入 react-native-gesture-handler 和 Reanimated。实现左滑彻底删除，右滑恢复。这符合 iOS 邮件和原生备忘录的肌肉记忆。

### 批量选择模式 (Batch Selection)：

- 长按某个 Item 进入“多选模式”，然后底部弹出“全部恢复”或“全部删除”的操作栏。

### 恢复滑出页面动画：
- 点击单独恢复按钮(请求后端接口)后，恢复的密码项向右/向左滑出页面

eas build --platform android --profile preview