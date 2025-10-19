# 任务计划

> **重要说明：此文件仅用于维护任务清单，不要添加其他内容。**

## 关联主题
specify/003-search-page-fix/discuss.md

## 任务清单
<!--
每个任务项格式：
T01. [状态] 任务描述
T02. [状态] 任务描述
T03. [状态] 任务描述

编号格式: T01, T02, T03...（T = Task）
状态: ⏳待执行 / 🔄进行中 / ✅已完成
-->

T01. [✅已完成] 扩展constants.js中的USER_AVATAR_IMG选择器，添加`[data-testid="search-author"] img`以覆盖搜索结果用户列表头像
T02. [✅已完成] 扩展constants.js中的SNOOVATAR选择器，添加`[data-testid="search-author"] .snoovatar`以覆盖搜索结果用户列表的snoovatar头像
T03. [✅已完成] 扩展constants.js中的USER_AVATAR_IMG选择器，添加`[data-testid="search-community"] img`以覆盖搜索结果社区列表头像
T04. [✅已完成] 在icons-replacer.js的_getUsernameFromAvatar方法中增强用户名提取逻辑，支持从相邻文本节点和data-faceplate-tracking-context JSON提取用户名
T05. [✅已完成] 在icons-replacer.js的_createLetterAvatar方法中添加`aspect-ratio: 1/1`CSS属性，防止字母头像在某些容器中变形成椭圆
T06. [✅已完成] 在icons-replacer.js中新增_getSubredditNameFromSearchResult方法，专门处理搜索结果页面社区头像的社区名提取（使用data-testid="search-community"容器定位）
T07. [✅已完成] 在icons-replacer.js的_replacePostSubredditIcons方法中调用新的_getSubredditNameFromSearchResult方法作为备选方案
T08. [✅已完成] 扩展constants.js中的SUBREDDIT_ICON选择器，添加`.post-credit-row span[rpl][avatar] img[alt*="r/"]`以覆盖帖子列表中的社区小头像
T09. [✅已完成] 修复icons-replacer.js中_replacePostSubredditIcons方法的头像插入位置，确保字母头像插入到容器内部而非外部，防止尺寸变大和布局错乱
T10. [✅已完成] 在icons-replacer.js的_replacePostSubredditIcons方法中添加字母头像存在性检查，防止滚动时重复插入头像
T11. [✅已完成] 扩展constants.js中的THUMBNAIL和THUMBNAIL_HIDDEN选择器，添加`[data-testid="search_post_thumbnail"]`以支持搜索结果页面的帖子缩略图隐藏
T12. [✅已完成] 修改constants.js中的SUBREDDIT_ICON选择器，添加`:not(svg)`伪类排除SVG默认图标，确保默认图标保持原样显示
T13. [✅已完成] 修复icons-replacer.js的_getUsernameFromAvatar方法，增加在[data-testid="search-author"]容器内查找用户链接的逻辑，支持搜索结果用户列表头像替换
T14. [✅已完成] 修复icons-replacer.js的showAll方法，改为基于USER_AVATAR_IMG和SNOOVATAR选择器动态生成恢复选择器，确保所有被隐藏的头像都能正确恢复显示
T15. [✅已完成] 扩展constants.js中的USER_AVATAR_IMG选择器，添加`[data-testid="search-comment-content"] img[data-testid="nsfw-subreddit-icon"]`以覆盖搜索评论列表中的NSFW用户头像
T16. [✅已完成] 扩展constants.js中的SNOOVATAR选择器，添加`[data-testid="search-comment-content"] .snoovatar`以覆盖搜索评论列表中的Snoovatar头像
T17. [✅已完成] 在icons-replacer.js的_getUsernameFromAvatar方法中添加对href="#"链接的处理，支持从链接文本节点提取用户名（针对搜索评论列表）
T18. [✅已完成] 在constants.js中添加MODERATOR_LIST_ITEM选择器，定义为`faceplate-tracker[source="moderator_list"]`以识别版主列表项
T19. [✅已完成] 在icons-replacer.js中新增_replaceModeratorListAvatars方法，专门处理版主列表头像替换（支持普通头像、Snoovatar和默认头像）
T20. [✅已完成] 在icons-replacer.js的hideAll方法中调用_replaceModeratorListAvatars方法，确保版主列表头像能被替换
T21. [✅已完成] 在icons-replacer.js的showAll方法中添加版主列表头像的恢复逻辑，确保切换设置时能正确恢复显示
T22. [✅已完成] 添加对faceplate-gif元素的隐藏支持，在constants.js中添加FACEPLATE_GIF和FACEPLATE_GIF_HIDDEN选择器
T23. [✅已完成] 在media-blocker.js的hideAll方法中添加查找并隐藏faceplate-gif元素的逻辑
T24. [✅已完成] 在media-blocker.js的showAll方法中添加恢复显示faceplate-gif元素的逻辑

---
*创建时间: 2025-10-19*
