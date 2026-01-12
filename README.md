[zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)

[react-native](https://reactnative.dev/docs/flatlist)

### 侧滑手势 (Swipe Actions)：

- 当前痛点：用户必须仔细点击那个圆形的恢复按钮。
- 建议：引入 react-native-gesture-handler 和 Reanimated。实现左滑彻底删除，右滑恢复。这符合 iOS 邮件和原生备忘录的肌肉记忆。

eas build --platform android --profile preview

- 设置页面的【清理缓存】功能是否需要以及如何利用
