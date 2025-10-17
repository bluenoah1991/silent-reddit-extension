# 项目研究报告

## 关联主题
specify/001-silent-reddit/discuss.md

## 技术栈现状

### 项目类型
- **Chrome浏览器扩展** - 基于Manifest V3标准的浏览器插件

### 核心技术
- **HTML5** - 扩展界面结构
- **CSS3** - 样式和视觉屏蔽实现
- **JavaScript (原生)** - 内容脚本和DOM操作
- **Chrome Extension APIs** - 浏览器扩展核心能力

### 开发工具
- **Git** - 版本控制
- **npm** - 包管理和脚本任务
- **web-ext** (可选) - Chrome扩展开发和测试工具

### 技术特点
- **零构建工具** - 无需Webpack/Rollup等打包工具
- **零运行时依赖** - 纯原生JavaScript实现
- **轻量化设计** - 适合办公环境快速部署

## 代码风格

### 架构模式
- **内容脚本注入模式** - 使用Content Scripts在Reddit页面中注入代码
- **声明式配置** - 通过manifest.json配置扩展权限和行为
- **DOM观察者模式** - 使用MutationObserver监听动态内容变化

### 代码组织
- **扁平化结构** - 扩展源码放在项目根目录
- **功能分离** - CSS样式与JavaScript逻辑分离
- **配置驱动** - manifest.json作为单一配置入口

### 命名规范（预期）
- 文件命名：小写字母，使用连字符分隔（kebab-case）
- 代码注释：中英文混合，根据目标受众选择

### 开发原则
- **简洁实用** - 避免过度工程化
- **快速迭代** - 支持本地热重载（通过Chrome扩展刷新）
- **跨语言支持** - 选择器策略完全避免文本依赖

## 相关目录结构

### 计划中的项目结构
```
silent-reddit-extension/
├── .github/              # GitHub配置和Senatus提示词
│   └── prompts/
├── .specify/             # Senatus模板文件
├── specify/              # Senatus主题管理
│   └── 001-silent-reddit/
│       ├── discuss.md    # 讨论记录
│       └── research.md   # 本文件
├── manifest.json         # Chrome扩展配置文件（待创建）
├── content.js            # 内容脚本（待创建）
├── styles.css            # CSS注入样式（待创建）
├── package.json          # npm配置（待创建）
├── .gitignore            # Git忽略配置（待创建）
└── out/                  # 构建输出目录（待创建）
```

### 关键文件说明
- **manifest.json** - 扩展元数据、权限声明、内容脚本配置
- **content.js** - 核心逻辑，包含DOM选择器和MutationObserver实现
- **styles.css** - 图片和广告屏蔽的CSS规则
- **out/** - npm build任务的输出目录，用于Chrome加载

## 相关业务逻辑

### 核心功能流程

#### 1. 广告屏蔽流程
```
页面加载 → Content Script注入 → 识别广告元素 → CSS隐藏
         ↓
    MutationObserver监听 → 动态内容加载 → 重新识别 → 隐藏新广告
```

**广告识别策略**：
- 使用`shreddit-ad-post`自定义元素标签（语言无关）
- 完全基于DOM结构特征，不依赖文本内容
- 支持Reddit的多语言界面

#### 2. 图片屏蔽流程
```
页面加载 → Content Script注入 → 分类识别图片类型
         ↓
    ├─ 帖子图片/缩略图 → display: none隐藏
    ├─ 用户头像 → 保留显示
    ├─ 社区图标 → 保留显示
    └─ UI元素/表情 → 保留显示
         ↓
    MutationObserver监听 → 动态图片 → 重新分类处理
```

**图片分类策略**：
- **屏蔽目标**：`article img`（帖子中的图片）
- **保留目标**：
  - `.shreddit-subreddit-icon__icon` - 社区图标
  - `a[href*="/user/"] img` - 用户头像
  - UI装饰性图片和表情符号

#### 3. 动态内容处理
- **问题**：Reddit使用单页应用架构，内容动态加载
- **解决方案**：MutationObserver API实时监听DOM变化
- **触发条件**：新元素插入、现有元素修改、子树变化
- **处理策略**：重新执行广告和图片识别逻辑

### 数据流
```
用户浏览Reddit → Chrome加载扩展 → manifest.json配置生效
                              ↓
                    content.js注入到页面上下文
                              ↓
                    styles.css应用基础隐藏规则
                              ↓
                    JavaScript增强处理（MutationObserver）
                              ↓
                    持续监听并处理新内容
```

## 相关技术实现

### 1. CSS注入方案

#### 基础选择器（D02决策）
```css
/* 广告屏蔽 - 使用自定义元素标签 */
shreddit-ad-post {
    display: none !important;
}

/* 帖子图片屏蔽 */
article img:not(.shreddit-subreddit-icon__icon) {
    display: none !important;
}

/* 或使用slot属性（更精确） */
article img[slot="thumbnail"],
article img[slot="image-gallery"] {
    display: none !important;
}
```

#### 保留策略
```css
/* 不屏蔽用户头像 */
a[href*="/user/"] img {
    display: block !important; /* 或不设置规则 */
}

/* 不屏蔽社区图标 */
.shreddit-subreddit-icon__icon {
    display: block !important; /* 或不设置规则 */
}
```

### 2. JavaScript增强方案

#### MutationObserver实现模式
```javascript
// 监听配置
const observerConfig = {
    childList: true,      // 监听子节点变化
    subtree: true,        // 监听整个子树
    attributes: false     // 不需要监听属性变化
};

// 回调函数
function handleMutations(mutations) {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                // 重新应用屏蔽规则
                applyAdBlocking(node);
                applyImageBlocking(node);
            });
        }
    });
}

// 启动观察
const observer = new MutationObserver(handleMutations);
observer.observe(document.body, observerConfig);
```

### 3. Manifest V3配置

#### 关键配置项
```json
{
  "manifest_version": 3,
  "name": "Silent Reddit",
  "version": "1.0.0",
  "content_scripts": [
    {
      "matches": ["*://*.reddit.com/*"],
      "css": ["styles.css"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "permissions": []
}
```

**配置说明**：
- `manifest_version: 3` - 使用最新Manifest V3标准
- `matches` - 仅在Reddit域名下生效
- `run_at: "document_start"` - 尽早注入，减少闪烁
- `permissions: []` - 无需特殊权限，提升安全性

### 4. 开发部署流程（D04决策）

#### npm构建任务
```json
{
  "scripts": {
    "build": "构建到out/目录",
    "watch": "监听文件变化自动构建"
  }
}
```

#### 部署步骤
1. **首次安装**：
   - 运行`npm run build`生成out/目录
   - Chrome浏览器打开`chrome://extensions/`
   - 启用开发者模式
   - 点击"加载已解压的扩展程序"
   - 选择out/目录

2. **后续更新**：
   - 修改源代码
   - 运行`npm run build`
   - 在扩展管理页面点击刷新按钮

3. **自动化开发**（可选）：
   - 使用`npm run watch`自动监听文件变化
   - 仍需手动点击Chrome扩展刷新按钮

### 5. 跨语言支持策略（D02决策）

#### 避免的方案
- ❌ 文本匹配："已推广"、"Promoted"、"Sponsorisé"
- ❌ aria-label依赖："Advertisement"、"头像"
- ❌ alt属性匹配：不同语言的图片描述

#### 采用的方案
- ✅ DOM结构特征：自定义元素标签`shreddit-ad-post`
- ✅ CSS类名：`.shreddit-subreddit-icon__icon`
- ✅ HTML属性：`slot="thumbnail"`、`href*="/user/"`
- ✅ 元素层级关系：`article img`、`a[href] img`

**优势**：
- 完全语言无关
- Reddit UI重构时需要调整，但更稳定
- 避免国际化维护成本

### 6. 技术约束与限制

#### Chrome扩展限制（D04发现）
- Chrome 33+版本禁止从本地CRX文件直接安装
- 必须通过开发者模式加载解压扩展
- 或通过Chrome Web Store发布（需要开发者账号）

#### 性能考虑
- MutationObserver可能带来性能开销
- 需要在回调函数中优化选择器查询
- 考虑防抖/节流策略处理高频DOM变化

#### 兼容性考虑
- Reddit UI可能更新，选择器需要维护
- Manifest V3是新标准，旧版Chrome可能不支持
- 需要测试不同Reddit视图（旧版、新版、移动Web）

---
*创建时间: 2025-10-17*
