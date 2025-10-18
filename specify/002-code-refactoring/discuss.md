# 讨论主题: 代码重构

> **重要说明：此文件仅用于维护讨论记录，不要添加其他内容。**

## 概述
重构代码

## 讨论记录
<!--
每次讨论记录格式：
### D01 - YYYY-MM-DD HH:MM:SS
**问题**: [讨论的具体问题]
**结论**: [达成的结论或决策]

编号格式: D01, D02, D03...（D = Discussion）
-->

### D01 - 2025-10-18 14:30:00
**问题**: 重构时需要保持哪些关键功能和机制？如何确保不遗漏重要细节？

**结论**: 
1. **必须保持的核心机制**：
   - 页面加载时自动应用所有替换规则（通过 `scanFullPage()` 实现）
   - Reddit瀑布流动态内容处理（MutationObserver + `processNewNode(node)` 实现）
   - 设置开关双向控制（Chrome storage监听 + `applyOrRemoveBlocking()` 实现）
   - Shadow DOM定时器检查（2秒首次 + 3秒间隔轮询）

2. **关键设计决策**：
   - 模块协调：保持命令式调用风格（显式调用每个模块的 hide/show 方法）
   - 扫描函数拆分：`scanFullPage()` 用于初始化全页面扫描，`processNewNode(node)` 用于处理动态新增节点
   - Shadow DOM处理：保持定时器策略，间隔合理即可，不过度优化
   - 状态管理：创建 SettingsManager 类，模块通过依赖注入获取设置

3. **模块接口规范**：
   - 通用接口：`hideAll(targetNode = document)` 隐藏所有匹配元素，`showAll()` 显示所有已隐藏元素
   - 广告模块额外提供：`hideNode(node)` 用于快速处理单个节点
   - 图标模块额外提供：`startPeriodicCheck()` 和 `stopPeriodicCheck()` 管理定时器
   - 所有 hide/show 方法必须是幂等的（通过 data-silent-reddit-* 属性标记已处理元素）

4. **重构原则**：
   - 保持简单，避免过度优化（如不需要页面可见性检测等复杂逻辑）
   - Logo替换独立于 enabled 设置
   - 每个功能都有配对的 hide/show 方法保证可逆操作

### D02 - 2025-10-18 15:00:00
**问题**: 代码拆分的具体实现方案，包括文件组织、命名风格、注释规范和构建策略？

**结论**:
1. **文件组织方式**：
   - 采用根目录扁平化拆分（方案3）
   - 将 content.js 拆分为10个模块文件：content.js（入口）、constants.js、settings-manager.js、coordinator.js、mutation-observer.js、ads-blocker.js、media-blocker.js、icons-replacer.js、logo-replacer.js、banner-blocker.js
   - 不创建 dom-utils.js（DOM操作保持在各模块中，避免过度抽象）
   - 文件命名采用 kebab-case 风格，与现有命名保持一致

2. **注释风格**：
   - 在关键逻辑点添加简短英文注释（符合项目宪法）
   - 不使用 JSDoc 格式（避免过度复杂）
   - 注释应简练实用，说明"做什么"而非"怎么做"

3. **构建策略**：
   - 采用直接拷贝文件方式（无打包工具）
   - build.js 自动扫描根目录下所有 .js 文件（除 build.js 本身）
   - manifest.json 中明确指定 js 文件加载顺序

4. **模块通信方式**：
   - 使用 `SilentReddit` 全局命名空间（方案A）
   - 各模块作为命名空间的属性（如 SilentReddit.adsBlocker）
   - 避免全局变量污染，清晰的模块边界

5. **manifest.json 加载顺序**：
   按依赖关系排序：constants.js → settings-manager.js → ads-blocker.js → media-blocker.js → banner-blocker.js → logo-replacer.js → icons-replacer.js → coordinator.js → mutation-observer.js → content.js

6. **输出目录更新**：
   - build.js 自动拷贝所有拆分后的 js 文件到 out/ 目录
   - manifest.json 同步更新到 out/ 目录

### D03 - 2025-10-18 15:30:00
**问题**: 重构后如何统一管理元素的处理状态和原始数据？当前代码中 data-* 属性使用不一致，需要确定统一的标记策略。

**结论**:
1. **状态标记方案**：
   - 采用统一的命名空间前缀 `data-sr-*`（sr = Silent Reddit）
   - 状态标记模式：`data-sr-{模块}-{状态}` (如 `data-sr-ad-hidden`, `data-sr-icon-replaced`)
   - 原始数据保存模式：`data-sr-original-{属性}` (如 `data-sr-original-src`, `data-sr-original-style`)
   - 使用 dataset 而非 WeakMap（优先考虑开发体验和调试便利性）

2. **常量管理**：
   - 在 constants.js 中定义 `DATA_ATTRS` 对象存储所有数据属性名（用于设置）
   - 在 constants.js 中定义 `SELECTORS` 对象存储所有选择器字符串（用于查询）
   - 避免硬编码字符串，统一管理属性名和选择器

3. **向后兼容性**：
   - 不考虑与旧版本（`data-silent-reddit-*`）的兼容
   - 不需要清理旧属性，刷新页面后自然消失

4. **恢复逻辑**：
   - 不提取公共恢复函数，避免过度抽象
   - 各模块遵循统一的恢复模式自行实现
   - 统一模式：读取 `data-sr-original-*` → 恢复属性 → 删除 dataset → 删除状态标记

5. **元素隐藏方式**：
   - 继续使用 JavaScript 设置 `element.style.display`
   - 不使用 CSS 选择器隐藏（更灵活，便于调试）

6. **性能考虑**：
   - 当前项目规模下，性能不是关键因素
   - 优先考虑代码可读性和开发体验

### D04 - 2025-10-18 16:00:00
**问题**: 如何安全地进行渐进式重构？需要什么样的实施策略来降低风险？

**结论**:
1. **重构方案**：
   - 采用"重命名原文件 + 逐步替换"方案
   - 将 content.js 重命名为 content.js.backup 作为参考
   - 逐步创建新的模块文件
   - 全部完成并测试通过后删除 .backup 文件

2. **备份策略**：
   - .backup 文件手工备份到安全位置
   - 不提交到 Git（不需要修改 .gitignore）
   - 仅作为重构期间的参考

3. **build.js 更新**：
   - 修改自动扫描逻辑，排除 .backup 文件
   - 使用 `!file.endsWith('.backup')` 过滤条件

4. **重构步骤顺序**：
   - 阶段1：准备工作（重命名、更新 build.js）
   - 阶段2：基础设施（constants.js）
   - 阶段3：设置管理（settings-manager.js）
   - 阶段4：简单模块（logo-replacer.js, banner-blocker.js）
   - 阶段5：核心模块（ads-blocker.js, media-blocker.js）
   - 阶段6：复杂模块（icons-replacer.js）
   - 阶段7：协调层（coordinator.js, mutation-observer.js）
   - 阶段8：入口文件（content.js 精简为初始化代码）
   - 阶段9：测试和清理

5. **manifest.json 更新**：
   - 采用逐步添加策略
   - 每创建一个模块就添加到 js 数组
   - 接受中间状态不可用的情况（直到全部完成）

6. **代码迁移方式**：
   - 重新编写（不是简单复制粘贴）
   - 参考 .backup 中的逻辑
   - 优化代码结构、变量命名、注释
   - 统一使用新的命名空间和 data-sr-* 属性

7. **测试策略**：
   - 重构过程中不测试
   - 全部模块完成后进行完整功能测试
   - 由项目维护者自行测试所有功能

8. **Git 提交策略**：
   - 重构过程中不提交
   - 全部完成并测试通过后一次性提交
   - 提交信息：描述整体重构工作

### D05 - 2025-10-18 16:30:00
**问题**: 重构后如何处理错误和日志？当前代码的错误处理和日志记录不统一且不完整，需要确定统一的策略。

**结论**:
1. **日志策略**：
   - 统一使用原生 console（不封装 logger 对象）
   - 保持简单，不添加 DEBUG 常量
   - 控制日志数量，只在关键节点记录
   - 统一使用 `[SR]` 前缀标识（Silent Reddit 简称）
   - 关键节点示例：初始化、设置加载、严重错误

2. **日志级别使用**：
   - `console.log('[SR] ...')` - 关键信息（初始化完成、设置更新等）
   - `console.error('[SR] ...')` - 错误信息（加载失败、操作异常等）
   - 避免过多的调试日志（如每次 hideMedia 调用）

3. **错误处理策略**：
   - 采用乐观式编程
   - 假设操作都会成功，代码保持简洁
   - 只在关键异步操作（Chrome API、storage）处使用 try-catch
   - DOM 操作不额外包裹错误处理（浏览器会处理）

4. **错误恢复策略**：
   - 采用静默失败方式
   - 错误时记录日志但继续执行
   - 不使用 alert 等方式打扰用户
   - 每个模块独立失败，不影响其他功能

5. **MutationObserver 错误处理**：
   - 不做特殊处理
   - 依赖浏览器的全局错误处理机制
   - 保持代码简洁

6. **实施原则**：
   - 不过度防御，信任浏览器环境
   - 优先代码简洁性而非极致健壮性
   - 只在真正需要错误处理的地方添加（异步操作）
   - 符合"保持简单"的重构原则

### D06 - 2025-10-18 17:30:00
**问题**: Shadow DOM检测机制是否需要在重构时优化？研究报告提出了MutationObserver等替代方案，但D01决策倾向于保持简单。

**结论**:
1. **最终决策**：
   - 保持当前的定时器轮询策略（3秒间隔）
   - 不采用MutationObserver或IntersectionObserver优化方案
   - 优先考虑可靠性而非性能优化

2. **决策依据**：
   - 边缘情况分析：Shadow DOM创建时序问题、异步渲染延迟、动态内容更新、SPA路由切换等
   - 定时器方案优势：容错性强、幂等性好、全覆盖无遗漏
   - 符合项目"保持简单"的原则

3. **实施的微优化**：
   - 优化点A：通过 `data-sr-icon-replaced` 标记避免重复处理已替换的图标
   - 跳过优化点B：不实施智能启停机制，保持定时器持续运行（Shadow DOM必然存在）

4. **模块职责确定**：
   - icons-replacer.js 模块管理自己的定时器（startPeriodicCheck/stopPeriodicCheck）
   - 内部处理Shadow DOM的存在性检查和幂等性保证
   - 错误处理采用静默失败 + 日志记录策略

5. **重构影响**：
   - 不影响D04确定的实施顺序
   - 专注于模块拆分和代码清理，不进行架构性能优化
   - 保持现有逻辑的可靠性和稳定性

---
*创建时间: 2025-10-18*
