# Typst Math Suite ・ Typst 数学套件

**[简体中文](README.md) · [English](README.en.md)**

在 Typst 数学环境（`$ … $`）里输入触发词，立即展开成符号或结构 —— 记笔记不打断思路。

## 功能

- **环境门控**　只在 `$ … $` 内触发。
- **即时展开**　打完触发词当场替换，无候选栏、无延迟。
- **停靠点**　展开后光标停在待填参数处，`Tab` 依次跳转。
- **可嵌套**　展开出来的片段里继续打触发词，能接着展开。
- **后缀触发**　`xhat` → `hat(x)`，先写字母再加修饰。
- **规则可改**　内置规则放在扩展目录的 `rules.jsonc` 里，可直接编辑（支持注释）；也可以在设置里覆盖或新增。

## 特色

- **补上原生片段的三个缺口**　原生片段无法判断数学环境、只能从字母开头匹配、后缀型触发词进不了候选栏 —— 本插件把三件事都解决了。
- **内置 111 条词尾规则 + 11 条正则规则**　覆盖希腊字母、幂/根/分式、集合关系、导数积分、极限求和、括号范数……（清单见文末「内置规则一览」）
- **两处可改，互不冲突**　`rules.jsonc` 管内置规则，设置管你自己的规则；同名键以设置里的为准。

## 规则放在哪

|  | 位置 | 适合 |
| --- | --- | --- |
| 内置规则 | 扩展目录的 `rules.jsonc` | 成批整理、写注释、删掉不要的 |
| 你自己的规则 | 设置里的 `typstMathSuite.*` | 随手加一两条 |

两者会合并：**同名键用设置里的值，新键就是一条新规则。**

- `rules.jsonc` 支持 `//`、`/* */` 注释和尾随逗号。
- 改 `rules.jsonc` 后要**重新加载窗口**（命令面板 → `Developer: Reload Window`）才生效。
- 改设置则是即时生效，不用重载。

## 自定义

### 方式一：`rules.jsonc`（改内置规则）

```jsonc
{
  "inMath": {
    "sr": "^2",             // 输入 sr → ^2
    "sq": "sqrt($1)$0",     // $1 $0 是光标停靠点
    "//": "frac($1, $2)$0"  // 输入 // → frac(_, _)
  },
  "outMath": {
    "mk": "\\$$1\\$$0"      // 输入 mk → $…$
  },
  "inMathRegex": {
    "([A-Za-z0-9]+)hat$": "hat({1})"   // 输入 xhat → hat(x)
  },
  "outMathRegex": {}
}
```

### 方式二：设置（加自己的规则）

打开设置（`Ctrl + ,`），搜索 `typstMathSuite`：

| 设置项 | 说明 |
| --- | --- |
| `typstMathSuite.inMathRules` | 数学**内**规则：`触发词 → 替换` |
| `typstMathSuite.outMathRules` | 数学**外**规则 |
| `typstMathSuite.inMathRegexRules` | 数学内**正则**规则（后缀型，`{1}` 引用捕获组） |
| `typstMathSuite.outMathRegexRules` | 数学外**正则**规则 |

```jsonc
"typstMathSuite.inMathRules": {
  "sr": "^2",            // 输入 sr → ^2
  "sq": "sqrt($1)$0",    // $1 $0 是光标停靠点
  "//": "frac($1, $2)$0" // 输入 // → frac(_, _)
}
```

**替换内容里的三种标记**：

- `$1` `$0` —— 停靠点（光标位置）
- `\$` —— 字面美元符
- `{1}` `{2}` —— 正则捕获组（仅正则规则）

## 内置规则一览

**希腊字母**（26）：`@a` `@b` `@g` `@G` `@d` `@D` `@e` `:e` `@z` `@t` `@T` `:t` `@i` `@k` `@l` `@L` `@s` `@S` `@u` `@U` `@o` `@O` `@p` `@m` `@f` `@y`

**幂 / 根 / 分式 / 角标**（10）：`sr` `cb` `rd` `_` `sts` `sq` `//` `ee` `invs` `conj`

**算子名**（5）：`Re` `Im` `bf` `rm` `trace`

**常用符号**（14）：`+-` `-+` `|...` `/...` `del` `xx` `**` `para` `simm` `sim=` `===` `prop` `!>` `=<`

**集合 / 关系 / 数集**（17）：`and` `orr` `inn` `notin` `setm` `sub=` `sup=` `eset` `set` `ext` `LL` `HH` `CC` `RR` `ZZ` `NN` `QQ`

**代数符号**（2）：`o+` `ox`

**重音 / 装饰**（8）：`ddot` `cdot` `dot` `hat` `bar` `tilde` `und` `vec`

**导数 / 积分**（9）：`par` `ddt` `iiint` `iint` `oint` `oinf` `infi` `dint` `int`

**括号 / 范数 / 矩阵**（14）：`brk` `pmat` `bmat` `matrix` `cases` `Norm` `norm` `ceil` `floor` `lra` `lr(` `lr{` `lr[` `lr|`

**极限 / 求和 / 泰勒**（6）：`tayl` `lsup` `linf` `lim` `sum` `prod`

## 许可

MIT
