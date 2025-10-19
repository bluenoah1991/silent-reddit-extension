# 项目研究报告

## 关联主题
specify/003-search-page-fix/discuss.md

## 技术栈现状

### 项目类型
- **Chrome浏览器扩展** - 基于Manifest V3标准的浏览器插件
- **Reddit内容修改器** - 通过Content Scripts实时修改Reddit页面DOM

### 核心技术
- **JavaScript (ES6+)** - 原生JavaScript，无框架依赖
- **DOM API** - 直接操作文档对象模型
- **Shadow DOM** - 处理Reddit使用的Web Components
- **MutationObserver API** - 监听DOM动态变化
- **Chrome Extension APIs** - chrome.runtime, chrome.storage

### 技术特点
- **模块化架构** - 功能分散在独立模块中（ads-blocker, media-blocker, icons-replacer等）
- **选择器驱动** - 使用CSS选择器识别和操作目标元素
- **状态管理** - 通过data属性标记已处理的元素
- **轻量级** - 无第三方运行时依赖

## 代码风格

### 架构模式
- **命名空间模式** - 所有模块挂载到全局`window.SilentReddit`对象
- **模块对象模式** - 每个模块是一个包含私有方法（_前缀）和公共方法的对象字面量
- **协调器模式** - `coordinator.js`统一协调各模块的启用/禁用
- **观察者模式** - `mutation-observer.js`监听DOM变化并触发相应模块处理新内容

### 代码组织
- **功能模块分离** - 每个功能独立文件（ads-blocker, media-blocker, icons-replacer, logo-replacer, banner-blocker）
- **常量集中管理** - `constants.js`定义所有选择器、数据属性和默认设置
- **顺序加载** - manifest.json中按依赖顺序声明js文件加载顺序

### 命名规范
- **文件命名** - kebab-case（例：icons-replacer.js）
- **模块命名** - camelCase（例：iconsReplacer）
- **私有方法** - 下划线前缀（例：_createLetterAvatar）
- **公共方法** - camelCase无前缀（例：hideAll, showAll）
- **常量** - SCREAMING_SNAKE_CASE（例：SELECTORS, DATA_ATTRS）
- **Data属性** - data-sr-前缀（sr = Silent Reddit）

### 注释风格
- **英文注释** - 符合项目宪法要求
- **功能说明** - 每个文件顶部有模块职责描述
- **方法说明** - 公共和私有方法都有简短注释

## 相关目录结构

### 当前项目结构
```
silent-reddit-extension/
├── manifest.json         # 扩展配置，定义content_scripts加载顺序
├── constants.js          # 全局常量：选择器、数据属性、默认设置
├── settings-manager.js   # 设置管理：加载、保存、监听变化
├── coordinator.js        # 协调器：管理各模块的启用/禁用
├── mutation-observer.js  # DOM观察器：监听动态内容变化
├── content.js           # 入口文件：初始化所有模块
├── ads-blocker.js       # 广告屏蔽模块
├── media-blocker.js     # 媒体内容屏蔽模块
├── icons-replacer.js    # 图标替换模块（社区图标、用户头像）
├── logo-replacer.js     # Logo替换模块
├── banner-blocker.js    # Banner屏蔽模块
├── styles.css           # 全局CSS样式
├── popup.html           # 扩展弹窗界面
├── popup.js             # 弹窗交互逻辑
└── icons/               # 扩展图标资源
```

### 加载顺序
根据manifest.json的content_scripts配置：
1. constants.js - 常量定义
2. settings-manager.js - 设置管理
3. ads-blocker.js - 广告屏蔽
4. media-blocker.js - 媒体屏蔽
5. banner-blocker.js - Banner屏蔽
6. logo-replacer.js - Logo替换
7. icons-replacer.js - 图标替换
8. coordinator.js - 协调器
9. mutation-observer.js - DOM观察器
10. content.js - 入口初始化

## 相关业务逻辑

### 搜索页面元素替换问题概述

Reddit搜索结果页面（/search路径）存在以下问题：
1. **部分元素未被替换** - 某些图标、头像或媒体内容未被正确识别和处理
2. **错误替换导致页面问题** - 可能将不该替换的元素进行了替换，破坏了页面布局或功能

### 当前元素处理逻辑

#### 1. 图标替换（icons-replacer.js）

**处理的元素类型：**
- **社区图标** - 使用`.shreddit-subreddit-icon__icon`选择器
- **用户头像** - 使用`[slot="commentAvatar"] img`和`a[href*="/user/"] img`选择器
- **Snoovatar头像** - 使用`.snoovatar`选择器
- **头像容器** - 使用`[slot="commentAvatar"] [rpl][avatar]`选择器
- **Shadow DOM图标** - 左侧导航栏（left-nav-communities-controller）和最近访问（reddit-recent-pages）

**名称提取逻辑：**
- `_getSubredditNameFromIcon()` - 从最近的`a[href^="/r/"]`链接或alt属性提取社区名
- `_getUsernameFromAvatar()` - 从最近的`a[href*="/user/"]`链接或alt属性提取用户名
- `_extractCommunityName()` - 从父链接`a[href*="/r/"]`提取社区名

**替换方式：**
- **DOM元素型** - 创建div元素作为字母头像，隐藏原图标，插入新元素
- **Data URL型** - 创建SVG Data URL替换img的src（用于Shadow DOM）

#### 2. 媒体屏蔽（media-blocker.js）

**处理的元素类型：**
- **媒体容器** - `[slot="post-media-container"]`
- **缩略图** - `[slot="thumbnail"]`和`[data-testid="post-thumbnail"]`
- **社区状态图标** - `community-status-tooltip`和`community-status`
- **评论媒体** - `shreddit-player-2`和`figure.rte-media`

**处理方式：**
- 隐藏元素（display: none）
- 添加占位符（🖼️或🎬图标）
- 使用data属性标记已处理元素

#### 3. 协调器处理（coordinator.js）

**applyToNode(targetNode)方法：**
- 当DOM新增节点时被mutation-observer调用
- 仅当settings.enabled为true时处理
- 根据设置调用各模块的hideAll方法
- **传递targetNode参数以仅处理新增内容**

**问题可能来源：**
- Shadow DOM元素不会触发MutationObserver
- 某些动态加载的搜索结果可能使用不同的选择器
- 名称提取逻辑可能在搜索页面结构下失效

### 搜索页面特殊性分析

#### 可能的DOM结构差异

搜索结果页面与普通信息流页面的潜在差异：
1. **不同的容器结构** - 搜索结果可能使用不同的父元素或自定义标签
2. **延迟加载方式** - 搜索结果的渲染时机可能与首页不同
3. **链接格式变化** - 搜索结果中的链接可能包含额外参数或使用相对路径
4. **Shadow DOM嵌套** - 可能使用更深层次的Web Components
5. **图标类型混合** - 可能同时显示多种类型的图标（社区、用户、主题标签等）

#### 需要验证的场景

1. **社区图标识别**
   - 搜索结果中的社区图标是否使用`.shreddit-subreddit-icon__icon`类
   - 链接格式是否为`/r/[name]`还是包含搜索参数

2. **用户头像识别**
   - 用户头像是否在`[slot="commentAvatar"]`内
   - 用户链接格式是否一致

3. **缩略图处理**
   - 搜索结果中的缩略图是否使用`[slot="thumbnail"]`
   - 是否有额外的媒体容器标签

4. **名称提取**
   - `_getSubredditNameFromIcon()`在搜索页面是否能正确找到父链接
   - `_getUsernameFromAvatar()`是否能识别搜索结果中的用户头像结构

#### 错误替换可能性

可能导致错误替换的情况：
1. **过度匹配选择器** - 如`a[href*="/user/"] img`可能匹配到搜索相关UI
2. **名称提取失败** - 无法提取名称但仍创建了空白头像
3. **Shadow DOM处理冲突** - 定期检查可能重复处理同一元素
4. **状态标记不准确** - data-sr-icon-replaced标记逻辑在搜索页面失效

## 相关技术实现

### 当前选择器清单

#### 常量定义（constants.js）
```javascript
SELECTORS: {
    // 图标选择器
    SUBREDDIT_ICON: '.shreddit-subreddit-icon__icon',
    USER_AVATAR_IMG: '[slot="commentAvatar"] img, a[href*="/user/"] img',
    SNOOVATAR: '[slot="commentAvatar"] .snoovatar, a[href*="/user/"] .snoovatar',
    AVATAR_CONTAINER: '[slot="commentAvatar"] [rpl][avatar]',
    
    // 媒体选择器
    MEDIA_CONTAINER: '[slot="post-media-container"]',
    THUMBNAIL: '[slot="thumbnail"], [data-testid="post-thumbnail"]',
    
    // Shadow DOM选择器
    NAV_COMMUNITIES_CONTROLLER: 'left-nav-communities-controller',
    NAV_COMMUNITY_ITEM: 'left-nav-community-item',
    RECENT_PAGES: 'reddit-recent-pages'
}
```

### 元素标记机制

#### Data属性状态管理
```javascript
DATA_ATTRS: {
    ICON_REPLACED: 'data-sr-icon-replaced',      // 图标已替换标记
    MEDIA_PLACEHOLDER: 'data-sr-media-placeholder', // 媒体占位符标记
    MEDIA_HIDDEN: 'data-sr-media-hidden',        // 媒体已隐藏标记
    ORIGINAL_SRC: 'data-sr-original-src',        // 原始src保存
    ORIGINAL_STYLE: 'data-sr-original-style'     // 原始style保存
}
```

**作用：**
- 防止重复处理同一元素
- 保存原始状态用于恢复
- 快速查询已处理元素

### Shadow DOM处理策略

#### 定期检查机制
```javascript
// icons-replacer.js
startPeriodicCheck() {
    this._timeoutId = setTimeout(checkShadowDOM, 2000);
    this._intervalId = setInterval(checkShadowDOM, 3000);
}
```

**原因：**
- Shadow DOM不会触发外部MutationObserver
- 需要定期轮询检查Shadow Root内的变化
- 首次2秒后检查，之后每3秒检查一次

### 名称提取正则表达式

#### 社区名提取
```javascript
// 从URL提取
link.href.match(/\/r\/([^/?]+)/)  // 匹配 /r/python
link.href.match(/\/r\/([^\/\?]+)/) // 更严格的匹配

// 从alt属性提取
alt.match(/r\/([^\s]+)/)          // 匹配 "r/python"
```

#### 用户名提取
```javascript
// 从URL提取
link.href.match(/\/user\/([^/?]+)/)  // 匹配 /user/john

// 从alt属性提取
alt.match(/u\/([^\s]+)/)             // 匹配 "u/john"
```

### 字母头像生成

#### 颜色哈希算法
```javascript
_getColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
```

**特点：**
- 确定性：相同名称总是得到相同颜色
- 分布均匀：使用10种预定义颜色
- 简单高效：简单的哈希计算

---
*创建时间: 2025-10-18*
