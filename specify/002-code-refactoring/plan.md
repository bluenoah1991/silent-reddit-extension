# 任务计划

> **重要说明：此文件仅用于维护任务清单，不要添加其他内容。**

## 关联主题
specify/002-code-refactoring/discuss.md

## 任务清单
<!--
每个任务项格式：
T01. [状态] 任务描述
T02. [状态] 任务描述
T03. [状态] 任务描述

编号格式: T01, T02, T03...（T = Task）
状态: ⏳待执行 / 🔄进行中 / ✅已完成
-->

T01. [✅已完成] 重构准备：重命名 content.js 为 content.js.backup，修改 build.js 排除 .backup 文件
T02. [✅已完成] 创建 constants.js 模块：定义 DATA_ATTRS、SELECTORS、DEFAULT_SETTINGS、AVATAR_COLORS 等常量
T03. [✅已完成] 创建 settings-manager.js 模块：实现 SettingsManager 类管理设置加载和监听
T04. [✅已完成] 创建 logo-replacer.js 模块：实现 replaceAll 和 restoreAll 方法处理 Stack Overflow Logo 替换
T05. [✅已完成] 创建 banner-blocker.js 模块：实现 hideAll 和 showAll 方法处理社区 banner 隐藏
T06. [✅已完成] 创建 ads-blocker.js 模块：实现 hideAll、showAll 和 hideNode 方法处理广告屏蔽
T07. [✅已完成] 创建 media-blocker.js 模块：实现 hideAll 和 showAll 方法处理媒体内容、缩略图和社区状态图标
T08. [✅已完成] 创建 icons-replacer.js 模块（第一部分）：实现 Letter Avatar 生成逻辑和颜色计算
T09. [✅已完成] 创建 icons-replacer.js 模块（第二部分）：实现社区图标替换功能（包括 Shadow DOM 处理）
T10. [✅已完成] 创建 icons-replacer.js 模块（第三部分）：实现用户头像替换功能和定时器管理
T11. [✅已完成] 创建 coordinator.js 模块：实现统一的协调器管理所有模块的 hide/show 调用
T12. [✅已完成] 创建 mutation-observer.js 模块：实现 MutationObserver 封装和新增节点处理逻辑
T13. [✅已完成] 创建 content.js 入口文件：精简为初始化代码，协调各模块完成页面扫描和监听设置
T14. [✅已完成] 更新 manifest.json：按依赖顺序添加所有拆分后的 js 文件到 content_scripts
T15. [✅已完成] 更新 build.js：修改自动扫描逻辑，将所有新模块文件拷贝到 out/ 目录
T16. [✅已完成] 功能测试：加载扩展到 Chrome，测试所有功能（广告屏蔽、媒体隐藏、图标替换、Logo 替换、设置切换）
T17. [✅已完成] 清理工作：删除 content.js.backup 文件，提交重构代码到 Git

---
*创建时间: 2025-10-18*
