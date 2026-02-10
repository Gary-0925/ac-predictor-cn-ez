# ac-predictor-cn-ez <sub><sub><sub>v2.0.12.4</sub></sub></sub>

ac-predictor最新完美汉化版，在 AtCoder 比赛进行中进行rating变化预测。

移除了准确性低下的侧栏，并对 rating 变化箭头进行了美化，优化了错误处理，几乎对所有内容进行了汉化。

[Github项目](https://github.com/Gary-0925/ac-predictor-cn-ez/)，如果感觉不错就给个 star 吧 QwQ

感谢 [@key-moon](https://github.com/key-moon)提供[原版脚本](https://github.com/key-moon/ac-predictor)。

---
## 说明

插件完全经过人工翻译，几乎插件中翻译了所有文字。**欢迎 PR 改进翻译或者[反馈](https://github.com/Gary-0925/ac-predictor-cn-ez/issues)**。

个人感觉侧栏不准，而且用处不大，所以删除了侧栏。如果需要侧栏，可以移步[ac-predictor-zh](https://github.com/zyx201207/ac-predictor-zh)。

---

## 使用方法

### 1. 安装篡改猴浏览器插件

> 已经安装过篡改猴的可以跳过此步。

打开[官网](https://www.tampermonkey.net/)，按提示操作即可。

注意如果是 chorme 内核的浏览器，比如 Google Chorme 或 Edge，需要选中 管理扩展 > 篡改猴 > 详细信息 > 允许用户脚本 。

### 2. 将脚本添加到篡改猴

> 如果已经安装了原版插件请先禁用或卸载，否则会冲突导致无法正常使用！

#### 方法1：使用 GreasyFork 安装脚本（推荐）

打开[链接]([https://greasyfork.org/zh-CN/scripts/458528-ac-predictor-cn](https://greasyfork.org/zh-CN/scripts/565788-ac-predictor-cn-ez))或[镜像站链接](https://home.greasyfork.org.cn/zh-hans/info/#/zh-CN/scripts/565788/detail)，按提示操作即可。

#### 方法2：使用 Github 上的源码添加脚本

打开[ac-predictor.js](https://github.com/Gary-0925/ac-predictor-cn-ez/ac-predictor-cn-ez.js)并复制。

打开篡改猴管理面板，选择“+”，用刚复制的代码将默认的替换掉，保存即可。

### 3. 测试是否添加成功

打开 [AtCoder](https://atcoder.jp/)，导航栏用户名下拉栏里应该出现了设置，此时随便打开一场已经结束或进行中的比赛的排行榜，稍等几秒。

如果你发现表格右侧多出来了两列，那么恭喜，你的 ac-predictor-cn 插件已经生效。
