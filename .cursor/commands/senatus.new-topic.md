---
description: 创建一个新的讨论主题
---

**用户输入**: $ARGUMENTS

## 执行流程

1. **检查用户输入**:
   - 如用户未提供内容则提示"请提供主题描述"并结束命令

2. **检查项目宪法**:
   - 读取宪法文件 `specify/constitution.md`（如存在）
   - 确保后续操作符合宪法约束

3. **创建主题目录**:
   - 根据用户输入生成kebab-case格式的目录名
   - 扫描 `specify/` 目录现有主题
   - 分配下一个三位数序号（001, 002, 003...）
   - 创建主题目录 `specify/{序号}-{目录名}/`

4. **创建讨论文件**:
   - 从用户输入中提取主题名和主题描述
   - 读取模板文件 `.specify/discuss-template.md`
   - 替换模板占位符：
     * `{{TOPIC_NAME}}` → 主题名
     * `{{TOPIC_DESCRIPTION}}` → 主题描述
     * `{{CURRENT_DATE}}` → 当前日期（YYYY-MM-DD）
   - 生成目标文件 `specify/{当前主题目录}/discuss.md`（如文件已存在则覆盖）

## 输出结果
- 创建的主题目录路径
- 建议运行 `/senatus.research` 进行项目研究