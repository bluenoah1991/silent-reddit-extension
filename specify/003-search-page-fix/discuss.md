# 讨论主题: Reddit搜索结果页面元素替换修复

> **重要说明：此文件仅用于维护讨论记录，不要添加其他内容。**

## 概述
reddit搜索结果页面还没处理好，有些元素没有替换，有些做了错误替换导致页面问题。

## 讨论记录
<!--
每次讨论记录格式：
### D01 - YYYY-MM-DD HH:MM:SS
**问题**: [讨论的具体问题]
**结论**: [达成的结论或决策]

编号格式: D01, D02, D03...（D = Discussion）
-->

### D01 - 2025-10-19 00:00:00
**问题**: 搜索结果页面中哪些元素未被替换？如何定位和过滤这些元素？

**结论**: 通过分析page1.html发现以下三类未被替换的元素：

1. **搜索结果中的社区头像** (Communities in search results)
   - 位置：搜索结果"社区"区域
   - 选择器：`[data-testid="search-community"] img.shreddit-subreddit-icon__icon`
   - DOM结构：
     ```html
     <div data-testid="search-community">
       <span rpl="" avatar="">
         <img src="..." alt="r/fuckamazon 图标" 
              class="mb-0 shreddit-subreddit-icon__icon rounded-full ...">
       </span>
     </div>
     ```
   - 特征：带有`data-testid="search-community"`的容器内的img元素
   - 社区名提取：从同级`a[href^="/r/"]`链接或img的alt属性提取

2. **搜索结果中的用户头像** (Users in search results)
   - 位置：搜索结果"用户"区域
   - 选择器：`[data-testid="search-author"] svg image[href*="snoovatar"]`
   - DOM结构：
     ```html
     <div data-testid="search-author">
       <span rpl="" avatar="">
         <span class="inline-flex snoovatar ...">
           <svg>
             <image href="https://i.redd.it/snoovatar/avatars/..." 
                    alt="User Avatar">
           </svg>
         </span>
       </span>
     </div>
     ```
   - 特征：SVG内的`<image>`元素，href指向snoovatar链接
   - 用户名提取：从同级`a[href*="/user/"]`链接提取

3. **右侧侧边栏的帖子缩略图和游戏图标** (Post thumbnails and game icons in sidebar)
   - 位置：右侧边栏
   - 选择器：`img[src*="redd.it"]`（需排除snoovatar）
   - DOM结构：
     ```html
     <!-- 背景图 -->
     <div style="background-image: url('https://preview.redd.it/...')">
     
     <!-- 游戏图标 -->
     <img src="https://i.redd.it/syl7pyy83rqf1.png" alt="" width="32" height="32">
     ```
   - 特征：
     - 背景图：style属性中的`background-image: url(...)`
     - 图标：`img[src*="i.redd.it"]`或`img[src*="preview.redd.it"]`
   - 注意：这些是媒体内容，应被media-blocker处理而非icons-replacer

**过滤方法总结**：
- 搜索结果社区头像：使用`data-testid="search-community"`容器 + `.shreddit-subreddit-icon__icon`类
- 搜索结果用户头像：使用`data-testid="search-author"`容器 + SVG `image`元素
- 帖子缩略图：使用`img[src*="redd.it"]`但需排除snoovatar（`img[src*="snoovatar"]`）

### D02 - 2025-10-19 00:00:00
**问题**: page2.html搜索结果页面评论列表中，板块头像被替换后变成压扁的椭圆，用户头像没有被替换。具体原因是什么？

**结论**: 通过分析page2.html的DOM结构，发现以下两个问题：

**问题1：板块头像变成椭圆的原因**
- 悬浮卡片(hovercard)中的头像容器设置为`w-[3rem] h-[3rem]`（48px x 48px）
- 但原始img元素带有`width="48"`属性和`style="width: 48px;"`
- 字母头像的CSS设置为`width: 100%; height: 100%;`能正确继承容器尺寸
- 但某些情况下可能存在CSS优先级或布局冲突导致圆形被压扁
- 需要在字母头像CSS中添加`aspect-ratio: 1/1`确保圆形不变形

**问题2：用户头像未被替换的原因**
- **缺少slot属性**：搜索结果页面的用户头像没有`slot="commentAvatar"`属性，不会被选择器`[slot="commentAvatar"] img`匹配
- **链接格式异常**：用户链接使用`href="#"`而非真实用户路径`/user/xxx`，导致`a[href*="/user/"]`选择器失效
- **SVG snoovatar结构**：头像在`<span class="snoovatar"><svg><image href="..."></svg></span>`结构中，需要选择`svg image`元素而非img元素
- **NSFW头像特殊处理**：使用`data-testid="nsfw-subreddit-icon"`的特殊图标，需要额外选择器
- **用户名提取困难**：由于链接是`#`，无法从href提取，需要从同级文本节点或祖先元素的data属性提取

**元素定位方法记录**：

1. **搜索结果评论列表板块头像**
   - 外层容器：`span.shreddit-subreddit-icon__icon[rpl][avatar]`
   - 内层img：`.shreddit-subreddit-icon__icon.rounded-full`
   - 社区名提取：从祖先`a[href^="/r/"]`的href属性通过正则`/\/r\/([^/?]+)/`提取
   - 特征：外层span有固定尺寸类如`w-[1.5rem] h-[1.5rem]`

2. **搜索结果评论列表用户头像(SVG snoovatar)**
   - 容器：`span.snoovatar.fp-avatar-container`
   - SVG image元素：`span.snoovatar svg image[href*="snoovatar"]`
   - 用户名提取：从相邻的文本节点提取（紧跟在avatar span后的文本）
   - 特征：SVG viewBox固定，image使用clip-path剪裁

3. **搜索结果评论列表用户头像(NSFW图标)**
   - 选择器：`img[data-testid="nsfw-subreddit-icon"]`
   - 用户名提取：从相邻的文本节点提取
   - src：`https://www.redditstatic.com/shreddit/assets/avatar_over18.png`

4. **通用用户头像容器定位**
   - 父容器：`span[rpl][avatar]`（不限定slot属性）
   - 用户名提取策略：
     1. 尝试从`closest('a[href*="/user/"]')`提取
     2. 如果失败，从avatar容器的nextSibling文本节点提取
     3. 如果失败，从祖先元素的data-faceplate-tracking-context JSON中提取

### D03 - 2025-10-19 00:00:00
**问题**: page3.html搜索结果页面中，用户列表的用户头像也没有被替换。这些头像的DOM结构是什么？如何定位和替换？

**结论**: 通过分析page3.html发现用户列表头像未被替换的原因和解决方案：

**DOM结构分析**：
```html
<div data-testid="search-author">
    <a href="/user/Amazon_Official/">...</a>
    <span class="block mt-2xs shrink-0">
        <span class="inline-flex items-center justify-center w-[3rem] h-[3rem]" rpl="" avatar="">
            <span class="inline-flex snoovatar relative fp-avatar-container rounded-full ...">
                <span class="rounded-full absolute h-full w-full inline-flex justify-center">
                    <span class="relative rounded-full overflow-hidden inline-flex w-full h-full box-border">
                        <img src="https://styles.redditmedia.com/t5_7ibap/styles/profileIcon_959m2ahnrgk11.png"
                             alt="Amazon_Official u/Amazon_Official 头像">
                    </span>
                </span>
            </span>
        </span>
    </span>
</div>
```

**未被替换的原因**：
1. **缺少slot属性**：没有`slot="commentAvatar"`属性，导致选择器`[slot="commentAvatar"] img`无法匹配
2. **链接和头像不在同一层级**：外层有`<a href="/user/Amazon_Official/">`链接，但img在深层嵌套的span中，不是直接父子关系，所以`a[href*="/user/"] img`无法匹配（CSS选择器不支持跨级匹配）
3. **snoovatar容器存在但选择器不匹配**：虽然有`.snoovatar`类，但当前选择器`[slot="commentAvatar"] .snoovatar`也因缺少slot而失效

**用户名提取方案**：
- img的alt属性格式：`"Amazon_Official u/Amazon_Official 头像"`
- 当前正则`/u\/([^\s]+)/`可以正确匹配并提取出`Amazon_Official`
- 作为备选，也可以从外层`<a href="/user/Amazon_Official/">`链接提取

**推荐解决方案（方案3）**：
同时扩展img选择器和snoovatar选择器，确保覆盖所有情况：

1. **扩展USER_AVATAR_IMG选择器**：
   ```javascript
   USER_AVATAR_IMG: '[slot="commentAvatar"] img, a[href*="/user/"] img, [data-testid="search-author"] img'
   ```

2. **扩展SNOOVATAR选择器**：
   ```javascript
   SNOOVATAR: '[slot="commentAvatar"] .snoovatar, a[href*="/user/"] .snoovatar, [data-testid="search-author"] .snoovatar'
   ```

**选择该方案的理由**：
- **双重保障**：img选择器直接找到img元素，snoovatar选择器隐藏整个容器
- **互补性强**：两个选择器可以应对不同的DOM结构变化
- **精确定位**：使用`[data-testid="search-author"]`作为父容器选择器，避免误匹配其他页面元素
- **保持一致性**：与现有选择器风格保持一致，使用逗号分隔多个选择器

**元素定位方法记录**：

**搜索结果用户列表头像**
- 外层容器：`[data-testid="search-author"]`
- 头像容器：`span[rpl][avatar] > .snoovatar.fp-avatar-container`
- img元素：`[data-testid="search-author"] img`
- 用户名提取：
  1. 优先从外层`<a href="/user/xxx/">`链接通过正则`/\/user\/([^/?]+)/`提取
  2. 备选从img的alt属性通过正则`/u\/([^\s]+)/`提取
- 容器尺寸：`w-[3rem] h-[3rem]`（48px x 48px）
- 特征：外层有`data-testid="search-author"`且有真实的用户链接（非`#`）

### D04 - 2025-10-19 15:30:00
**问题**: 帖子列表中`post-credit-row`区域的社区头像（24px小头像）没有被替换。

**结论**: 发现问题原因并成功修复：

**问题原因**：
- 在搜索结果的帖子列表中，`post-credit-row`内显示的社区小头像（24px）位于`<span rpl avatar>`容器内
- 这些外层的`<img>`元素**没有**`.shreddit-subreddit-icon__icon`类
- 只有悬浮卡片(hovercard)内的大头像（48px）才带有`.shreddit-subreddit-icon__icon`类
- 所以原选择器只能替换悬浮卡片内的头像，无法替换外层显示的小头像

**DOM结构对比**：
```html
<!-- 外层小头像（24px）- 未被替换 -->
<div class="post-credit-row">
    <span class="inline-flex w-[1.5rem] h-[1.5rem]" rpl="" avatar="">
        <span rpl="" class="inline-block rounded-full ...">
            <img src="..." alt="r/amazonemployees 图标" 
                 class="mb-0 w-full h-full" width="24">
            <!-- 注意：没有 .shreddit-subreddit-icon__icon 类 -->
        </span>
    </span>
    <span class="truncate">r/amazonemployees</span>
</div>

<!-- 悬浮卡片内大头像（48px）- 能被替换 -->
<div slot="content" hidden="">
    <span class="inline-flex w-[3rem] h-[3rem]" rpl="" avatar="">
        <img src="..." alt="r/amazonemployees 图标" 
             class="mb-0 shreddit-subreddit-icon__icon ..." width="48">
        <!-- 有 .shreddit-subreddit-icon__icon 类 -->
    </span>
</div>
```

**修复方案**：
扩展`constants.js`中的`SUBREDDIT_ICON`选择器，添加针对`post-credit-row`结构的选择器：
```javascript
SUBREDDIT_ICON: '.shreddit-subreddit-icon__icon, .post-credit-row span[rpl][avatar] img[alt*="r/"]'
```

新增选择器说明：
- `.post-credit-row` - 限定在帖子credit row容器内
- `span[rpl][avatar]` - 头像容器标识
- `img[alt*="r/"]` - alt属性包含"r/"的图片（社区图标特征）

**验证结果**：
- ✅ 修改后帖子列表中的社区头像能正确替换
- ✅ 构建成功，无错误
- ✅ 不会误匹配其他类型的图标

### D05 - 2025-10-19 16:00:00
**问题**: 评论列表中板块头像替换后尺寸变大，挤压右侧文字，导致布局错误。

**结论**: 定位并修复了头像插入位置错误的问题：

**问题原因**：
- 当选择器`.shreddit-subreddit-icon__icon`匹配到的是外层容器span元素（带有尺寸约束类如`w-[1.5rem] h-[1.5rem]`）时
- 原代码使用`icon.parentNode?.insertBefore(letterAvatar, icon)`将字母头像插入到容器的**外部**（作为`<a>`标签的直接子元素）
- 字母头像的CSS设置为`width: 100%; height: 100%`，会尝试填充整个`<a>`标签容器
- 结果导致头像变得很大，挤压右侧的板块名称文字

**DOM结构分析**：
```html
<!-- 错误情况 - 字母头像插入到外层 -->
<a href="/r/soccer/">
    <div class="silent-reddit-letter-avatar" style="width: 100%; height: 100%;">S</div>
    <span class="w-[1.5rem] h-[1.5rem] shreddit-subreddit-icon__icon" style="display: none;">
        <img src="..." alt="r/soccer 图标">
    </span>
    r/soccer  <!-- 文字被挤压 -->
</a>

<!-- 正确情况 - 字母头像插入到容器内部 -->
<a href="/r/soccer/">
    <span class="w-[1.5rem] h-[1.5rem] shreddit-subreddit-icon__icon">
        <div class="silent-reddit-letter-avatar" style="width: 100%; height: 100%;">S</div>
        <img src="..." style="display: none;" alt="r/soccer 图标">
    </span>
    r/soccer  <!-- 文字正常显示 -->
</a>
```

**修复方案**：
修改`icons-replacer.js`的`_replacePostSubredditIcons`方法，增加元素类型判断：
- 如果匹配到的是`<img>`元素：保持原有逻辑（隐藏img，在其前面插入字母头像）
- 如果匹配到的是容器元素（如`<span>`）：隐藏容器内的所有子元素，将字母头像**插入到容器内部**（使用`appendChild`）

相应地更新`showAll`方法，确保能正确恢复两种情况下的元素状态。

**验证结果**：
- ✅ 评论列表中的板块头像尺寸正常（24px × 24px）
- ✅ 右侧板块名称文字不再被挤压
- ✅ 构建成功，无错误
- ✅ 页面布局恢复正常

### D06 - 2025-10-19 16:15:00
**问题**: 滚动页面时板块头像会重复出现，同一个位置出现多个相同的字母头像。

**结论**: 发现并修复了字母头像重复插入的问题：

**问题原因**：
- 当页面滚动时，MutationObserver不断检测到新的DOM节点并触发替换逻辑
- 在`_replacePostSubredditIcons`方法中，虽然img元素已经标记了`data-sr-icon-replaced="true"`
- 但代码在插入字母头像前**没有检查容器内是否已经存在字母头像**
- 特别是在容器元素分支（非img元素）中，每次执行`icon.appendChild(letterAvatar)`都会创建新的头像
- 即使选择器使用了`:not([data-sr-icon-replaced])`，在某些DOM结构下仍可能因为属性丢失或DOM重建而重复匹配

**DOM结构分析**：
```html
<!-- 问题结构 - 多次appendChild导致重复 -->
<span class="inline-flex w-[1.5rem] h-[1.5rem]" rpl="" avatar="">
    <span class="inline-block rounded-full">
        <div class="silent-reddit-letter-avatar">F</div>
        <div class="silent-reddit-letter-avatar">F</div>  <!-- 重复！ -->
        <div class="silent-reddit-letter-avatar">F</div>  <!-- 重复！ -->
        <img class="shreddit-subreddit-icon__icon" 
             data-sr-icon-replaced="true" style="display: none;">
    </span>
</span>
```

**修复方案**：
在`_replacePostSubredditIcons`方法的两个分支中，都添加了**字母头像存在性检查**：

1. **img元素分支**：
   ```javascript
   // Skip if letter avatar already exists in parent
   if (parent.querySelector('.' + SilentReddit.CSS_CLASSES.LETTER_AVATAR)) return;
   ```

2. **容器元素分支**：
   ```javascript
   // Skip if letter avatar already exists inside
   if (icon.querySelector('.' + SilentReddit.CSS_CLASSES.LETTER_AVATAR)) return;
   ```

这样确保：
- 在插入字母头像前先检查DOM中是否已经存在
- 如果已存在则跳过插入操作
- 即使属性标记丢失，也能通过DOM结构检查防止重复

**验证结果**：
- ✅ 滚动页面时不再出现重复头像
- ✅ 每个位置只显示一个字母头像
- ✅ 构建成功，无错误
- ✅ 页面性能正常

### D07 - 2025-10-19 16:30:00
**问题**: 搜索结果页面帖子列表中右侧的缩略图需要隐藏。

**结论**: 发现并修复了搜索结果页面缩略图未被隐藏的问题：

**问题原因**：
- 搜索结果页面的帖子缩略图使用 `data-testid="search_post_thumbnail"` 属性
- 原有的 `THUMBNAIL` 选择器只包含 `[data-testid="post-thumbnail"]`（没有 `search_` 前缀）
- 因此 `media-blocker.js` 无法识别和隐藏这些缩略图

**DOM结构**：
```html
<search-telemetry-tracker data-testid="search-sdui-post">
  <div class="flex justify-between items-center">
    <div class="w-full flex flex-col">
      <!-- 帖子标题和信息 -->
    </div>
    <search-telemetry-tracker>
      <a href="/r/amazonprime/comments/...">
        <div class="inline rounded-1 overflow-hidden">
          <faceplate-img data-testid="search_post_thumbnail" 
                         class="rounded-1 object-cover h-[60px] w-[80px]"
                         src="https://b.thumbs.redditmedia.com/...">
          </faceplate-img>
        </div>
      </a>
    </search-telemetry-tracker>
  </div>
</search-telemetry-tracker>
```

**修复方案**：
扩展 `constants.js` 中的选择器以支持搜索页面缩略图：

1. **THUMBNAIL选择器** - 添加 `[data-testid="search_post_thumbnail"]`：
   ```javascript
   THUMBNAIL: '[slot="thumbnail"], [data-testid="post-thumbnail"], [data-testid="search_post_thumbnail"]'
   ```

2. **THUMBNAIL_HIDDEN选择器** - 同步添加恢复选择器：
   ```javascript
   THUMBNAIL_HIDDEN: '[slot="thumbnail"][data-sr-media-hidden], [data-testid="post-thumbnail"][data-sr-media-hidden], [data-testid="search_post_thumbnail"][data-sr-media-hidden]'
   ```

**验证结果**：
- ✅ 选择器能正确匹配搜索结果页面的缩略图
- ✅ 构建成功，无错误
- ✅ 不会误匹配其他元素

### D08 - 2025-10-19 17:00:00
**问题**: 搜索结果社区列表中的默认SVG图标被隐藏了，但这些默认图标应该保持原样不做处理。

**结论**: 发现并修复了选择器误匹配SVG默认图标的问题：

**问题原因**：
- `SUBREDDIT_ICON` 选择器 `.shreddit-subreddit-icon__icon` 会匹配所有带有这个类的元素
- 搜索结果社区列表中的默认SVG图标也带有这个类
- 导致SVG被 `icons-replacer.js` 处理并隐藏（尝试替换但失败）
- 而这些默认SVG图标应该保持原样显示，不需要替换成字母头像

**DOM结构**：
```html
<div data-testid="search-community">
  <span class="inline-block rounded-full">
    <svg rpl="" class="... shreddit-subreddit-icon__icon ..." 
         fill="currentColor" icon-name="community-fill">
      <path d="..."></path>
    </svg>
  </span>
</div>
```

**修复方案**：
在选择器级别排除SVG元素，使用CSS `:not(svg)` 伪类：

修改 `constants.js` 中的 `SUBREDDIT_ICON` 选择器：
```javascript
// Before:
SUBREDDIT_ICON: '.shreddit-subreddit-icon__icon, .post-credit-row span[rpl][avatar] img[alt*="r/"]'

// After:
SUBREDDIT_ICON: '.shreddit-subreddit-icon__icon:not(svg), .post-credit-row span[rpl][avatar] img[alt*="r/"]'
```

**技术说明**：
- `:not(svg)` 伪类确保选择器不会匹配SVG元素
- 只匹配IMG元素和其他容器元素（如span）
- SVG默认图标完全不会被 `icons-replacer.js` 处理
- 保持了原有的图片头像替换功能

**验证结果**：
- ✅ SVG默认图标正常显示，不被隐藏
- ✅ IMG类型的社区头像仍能正确替换为字母头像
- ✅ 构建成功，无错误

### D09 - 2025-10-19 17:30:00
**问题**: 搜索结果用户列表中部分用户头像未被替换，且切换设置恢复显示时，部分头像被隐藏而不是显示。

**结论**: 发现并修复了两个问题：

**问题1：用户列表头像未被替换**
- **原因**：在搜索结果用户列表中，用户链接 `<a href="/user/xxx/">` 和头像容器是兄弟节点关系，不是父子关系
- **DOM结构**：
  ```html
  <div data-testid="search-author">
      <search-telemetry-tracker>
          <a href="/user/Amazon_Official/">...</a>
      </search-telemetry-tracker>
      <div class="flex justify-start gap-x-md">
          <span class="block mt-2xs shrink-0">
              <span rpl="" avatar="">
                  <span class="snoovatar fp-avatar-container">
                      <img src="..." alt="Amazon_Official u/Amazon_Official 头像">
                  </span>
              </span>
          </span>
      </div>
  </div>
  ```
- **失败原因**：`_getUsernameFromAvatar` 方法使用 `.closest('a[href*="/user/"]')` 只能查找祖先元素，无法找到兄弟节点中的链接
- **修复方案**：在 `_getUsernameFromAvatar` 方法中增加针对搜索结果的特殊处理，检查是否在 `[data-testid="search-author"]` 容器内，如果是则使用 `querySelector` 在容器内查找用户链接

**问题2：恢复显示时部分头像被隐藏**
- **原因**：`showAll` 方法中的恢复选择器不完整，缺少搜索结果页面的选择器部分
- **旧的恢复选择器**：
  ```javascript
  '[slot="commentAvatar"] img[data-sr-icon-replaced], a[href*="/user/"] img[data-sr-icon-replaced]'
  ```
- **实际需要的选择器**：应包含所有 `USER_AVATAR_IMG` 和 `SNOOVATAR` 定义的选择器
- **问题表现**：搜索结果页面的 `[data-testid="search-author"] img` 和 `[data-testid="search-community"] img` 被隐藏后无法被恢复选择器找到，导致显示为隐藏状态
- **修复方案**：让恢复选择器动态生成，基于 `constants.js` 中的完整选择器定义
  ```javascript
  // 用户头像恢复
  const userAvatarSelectors = SilentReddit.SELECTORS.USER_AVATAR_IMG.split(',')
      .map(s => s.trim() + '[data-sr-icon-replaced]');
  
  // Snoovatar恢复
  const snoovatarSelectors = SilentReddit.SELECTORS.SNOOVATAR.split(',')
      .map(s => s.trim() + '[data-sr-icon-replaced]');
  ```

**修改文件**：
- `icons-replacer.js` - `_getUsernameFromAvatar` 方法增加搜索容器内链接查找
- `icons-replacer.js` - `showAll` 方法改为动态生成恢复选择器

**验证结果**：
- ✅ 搜索结果用户列表头像能正确替换
- ✅ 切换设置时所有头像能正确恢复显示
- ✅ 构建成功，无错误
- ✅ 恢复选择器与隐藏选择器保持一致，未来添加新选择器时自动适配

### D10 - 2025-10-19 18:00:00
**问题**: 搜索界面评论列表中，用户的头像没有被替换，包括NSFW头像和Snoovatar头像。

**结论**: 发现并修复了搜索评论列表中用户头像未被替换的问题：

**问题原因**：
1. **选择器不匹配NSFW头像**：评论列表中使用 `<img data-testid="nsfw-subreddit-icon">` 作为NSFW用户头像，原选择器无法匹配
2. **Snoovatar缺少slot属性**：评论列表中的 `.snoovatar` 容器没有 `slot="commentAvatar"` 属性，原选择器 `[slot="commentAvatar"] .snoovatar` 无法匹配
3. **用户链接格式异常**：评论列表中的用户链接使用 `href="#"` 而非真实的 `/user/xxx` 路径，导致 `a[href*="/user/"]` 选择器失效
4. **用户名在文本节点**：用户名作为链接的文本内容（如 "Ferrisuk", "ZealousidealSundae33"），需要从文本节点提取而非从href属性

**DOM结构分析**：
```html
<!-- NSFW头像 -->
<faceplate-hovercard>
    <a href="#" rpl="">
        <span class="inline-flex w-[1.5rem] h-[1.5rem]" rpl="" avatar="">
            <span rpl="" class="inline-block rounded-full">
                <img alt="" data-testid="nsfw-subreddit-icon" 
                     src="https://www.redditstatic.com/shreddit/assets/avatar_over18.png">
            </span>
        </span>
        Ferrisuk
    </a>
</faceplate-hovercard>

<!-- Snoovatar头像 -->
<faceplate-hovercard>
    <a href="#" rpl="">
        <span class="inline-flex w-[1.5rem] h-[1.5rem]" rpl="" avatar="">
            <span class="inline-flex snoovatar fp-avatar-container ...">
                <svg viewBox="0 0 121 122">
                    <image href="https://i.redd.it/snoovatar/avatars/..." 
                           alt="User Avatar" ...>
                    </image>
                </svg>
            </span>
        </span>
        ZealousidealSundae33
    </a>
</faceplate-hovercard>
```

**修复方案**：
1. **扩展USER_AVATAR_IMG选择器**：
   ```javascript
   USER_AVATAR_IMG: '..., [data-testid="search-comment-content"] img[data-testid="nsfw-subreddit-icon"]'
   ```

2. **扩展SNOOVATAR选择器**：
   ```javascript
   SNOOVATAR: '..., [data-testid="search-comment-content"] .snoovatar'
   ```

3. **增强用户名提取逻辑**：
   在 `_getUsernameFromAvatar` 方法中添加针对 `href="#"` 链接的处理：
   - 使用 `avatar.closest('a[href="#"]')` 定位父级链接
   - 从链接的文本节点中提取用户名
   - 使用正则 `/^u\/([^\s]+)|^([A-Za-z0-9_-]+)$/` 匹配用户名格式

**验证结果**：
- ✅ NSFW头像能被正确识别和替换
- ✅ Snoovatar头像能被正确识别和替换
- ✅ 用户名能从链接文本内容正确提取（Ferrisuk, ZealousidealSundae33等）
- ✅ 构建成功，无错误
- ✅ 用户确认修复结果符合预期

### D11 - 2025-10-19 19:30:00
**问题**: 社区板块中版主列表的版主头像没有被替换，包括普通头像、Snoovatar头像和默认头像。

**结论**: 发现并修复了版主列表头像未被替换的问题：

**问题原因**：
版主列表使用了特殊的DOM结构，头像和用户链接是兄弟节点而非父子关系，导致现有选择器无法匹配。

**DOM结构分析**：
```html
<li rpl="" class="relative list-none mt-0 group">
  <div class="flex justify-between relative">
    <span class="flex items-center gap-xs">
      <!-- 头像容器 -->
      <span class="flex shrink-0 items-center justify-center h-xl w-xl">
        <span rpl="" avatar="">
          <span class="inline-block rounded-full">
            <img src="..." alt="u/PopMechanic 头像" width="32" height="32">
          </span>
        </span>
      </span>
      <!-- 用户名容器（兄弟节点） -->
      <span class="flex flex-col justify-center">
        <span class="text-14">
          <faceplate-tracker source="moderator_list" action="click" noun="user">
            <a href="/user/PopMechanic/">u/PopMechanic</a>
          </faceplate-tracker>
        </span>
      </span>
    </span>
  </div>
</li>
```

**修复方案**：

1. **添加新选择器**（constants.js）：
   ```javascript
   MODERATOR_LIST_ITEM: 'faceplate-tracker[source="moderator_list"]'
   ```

2. **新增专门处理方法**（icons-replacer.js）：
   - 创建 `_replaceModeratorListAvatars(targetNode)` 方法
   - 工作流程：
     1. 查找所有 `faceplate-tracker[source="moderator_list"]` 元素
     2. 向上查找包含它的 `<li>` 元素
     3. 在 `<li>` 内查找所有头像（img 和 .snoovatar）
     4. 从 tracker 内的链接提取用户名
     5. 为所有头像创建并插入字母头像

3. **在hideAll方法中调用**：
   ```javascript
   this._replaceModeratorListAvatars(targetNode);
   ```

4. **添加恢复逻辑**（showAll方法）：
   - 查找所有版主列表项
   - 恢复列表项内所有被替换的头像（img 和 snoovatar）
   - 移除字母头像元素

**修改文件**：
- `constants.js` - 添加 MODERATOR_LIST_ITEM 选择器
- `icons-replacer.js` - 新增 _replaceModeratorListAvatars 方法和恢复逻辑

**验证结果**：
- ✅ 版主列表中的普通头像能正确替换
- ✅ 版主列表中的Snoovatar头像能正确替换
- ✅ 版主列表中的默认头像能正确替换
- ✅ 切换设置时能正确恢复和重新隐藏头像
- ✅ 构建成功，无错误
- ✅ 用户确认修复结果符合预期

### D12 - 2025-10-19 20:00:00
**问题**: 板块右侧有时会出现 `faceplate-gif` 元素的GIF图片，希望能隐藏掉。

**结论**: 成功添加了对 `faceplate-gif` 元素的隐藏支持，该元素属于媒体内容，通过媒体屏蔽器处理。

**修复操作**：

1. **扩展constants.js中的选择器**：
   - 在 `SELECTORS` 中添加 `FACEPLATE_GIF: 'faceplate-gif'`
   - 在恢复选择器中添加 `FACEPLATE_GIF_HIDDEN: 'faceplate-gif[data-sr-media-hidden]'`

2. **在media-blocker.js的hideAll方法中添加隐藏逻辑**：
   ```javascript
   // Hide faceplate-gif elements (GIF images in sidebar)
   targetNode.querySelectorAll(SilentReddit.SELECTORS.FACEPLATE_GIF).forEach(gif => {
       if (!gif.hasAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN)) {
           gif.setAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN, 'true');
           gif.style.setProperty('display', 'none', 'important');
       }
   });
   ```

3. **在media-blocker.js的showAll方法中添加恢复逻辑**：
   ```javascript
   // Restore faceplate-gif elements
   document.querySelectorAll(SilentReddit.SELECTORS.FACEPLATE_GIF_HIDDEN).forEach(gif => {
       gif.style.removeProperty('display');
       gif.removeAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN);
   });
   ```

**工作原理**：
- 当启用媒体屏蔽功能时，自动查找并隐藏所有 `faceplate-gif` 元素
- 使用 `data-sr-media-hidden` 属性标记已处理元素，防止重复处理
- 禁用媒体屏蔽时，能正确恢复显示这些GIF元素

**修改文件**：
- `constants.js` - 添加 FACEPLATE_GIF 和 FACEPLATE_GIF_HIDDEN 选择器
- `media-blocker.js` - 在 hideAll 和 showAll 方法中添加处理逻辑

**验证结果**：
- ✅ 构建成功，无错误
- ✅ 用户确认修复结果符合预期

---
*创建时间: 2025-10-18*
