const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let expanding = false;

// ── 内置规则表：同目录的 rules.jsonc（支持注释和尾随逗号）──
const RULES_FILE = path.join(__dirname, 'rules.jsonc');
let builtinRules = { inMath: {}, outMath: {}, inMathRegex: {}, outMathRegex: {} };

function parseJsonc(text) {
  let out = '', i = 0, inStr = false;
  while (i < text.length) {
    const c = text[i];
    if (inStr) {                                  // 字符串内部：原样拷贝，处理 \" 转义
      out += c; i++;
      if (c === '\\') { out += text[i] || ''; i++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && text[i + 1] === '/') {        // // 行注释
      i += 2; while (i < text.length && text[i] !== '\n') i++; continue;
    }
    if (c === '/' && text[i + 1] === '*') {        // /* */ 块注释
      i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue;
    }
    if (c === ',') {                               // 尾随逗号：后面只剩 } 或 ] 就丢掉
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === '}' || text[j] === ']') { i++; continue; }
    }
    out += c; i++;
  }
  return JSON.parse(out);
}

function loadBuiltinRules() {
  try {
    const r = parseJsonc(fs.readFileSync(RULES_FILE, 'utf8'));
    builtinRules = {
      inMath: r.inMath || {},
      outMath: r.outMath || {},
      inMathRegex: r.inMathRegex || {},
      outMathRegex: r.outMathRegex || {},
    };
  } catch (e) {
    vscode.window.showErrorMessage('Typst Math Suite: rules.jsonc 读取失败 — ' + e.message);
  }
}

// ── 数学模式缓存 ──
// mcache：文档开头到 offset 之间，「未转义的 $」有奇数个(parity=1)还是偶数个(0)
let mcache = null;

// 从 startOffset（此处奇偶 = parity）数到 endOffset
// 起点必须是行首：行首前一个字符是换行符，不是反斜杠，所以不用单独看它
function scanParity(doc, startOffset, parity, endOffset) {
  if (endOffset <= startOffset) return parity;
  const text = doc.getText(new vscode.Range(doc.positionAt(startOffset), doc.positionAt(endOffset)));
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '$' && text[i - 1] !== '\\') parity ^= 1;   // 未转义的 $ 翻转奇偶
  }
  return parity;
}

// ── 门控：光标是否在数学模式内 ──
function inMath(doc, pos) {
  const lineStart = doc.offsetAt(new vscode.Position(pos.line, 0));
  if (!mcache || mcache.doc !== doc || mcache.offset > lineStart) {
    mcache = { doc, offset: 0, parity: 0 };                   // 换了文档 / 光标回到更早的行 → 从头数
  }
  mcache.parity = scanParity(doc, mcache.offset, mcache.parity, lineStart);   // 补数到当前行行首
  mcache.offset = lineStart;                                                  // 记到行首：展开 snippet 的删除点在行内，缓存不会作废
  return scanParity(doc, lineStart, mcache.parity, doc.offsetAt(pos)) === 1;  // 奇数 = 在数学里
}

// ── 判断函数(词尾匹配) ──
function matchRule(line, rules) {
  let best = null;
  for (const [trigger, replacement] of Object.entries(rules)) {
    if (line.endsWith(trigger) && (!best || trigger.length > best.trigger.length)) {
      best = { trigger, replacement };
    }
  }
  return best;
}

function matchRegexRule(line, rules) {
  let best = null;
  for (const [pattern, template] of Object.entries(rules)) {
    const m = line.match(pattern);
    if (m && (!best || m[0].length > best.trigger.length)) {
      best = {
        trigger: m[0],
        replacement: template.replace(/\{(\d+)\}/g, (_, n) => m[+n] || ''),
      };
    }
  }
  return best;
}

// ── 替换函数 ──
function applyReplacement(editor, pos, trigger, replacement) {
  const range = new vscode.Range(pos.translate(0, -trigger.length), pos);
  return editor
    .edit((eb) => eb.delete(range), { undoStopBefore: false, undoStopAfter: false })
    .then(() =>
      vscode.commands.executeCommand('editor.action.insertSnippet', {
        snippet: replacement,
      })
    );
}

function activate(context) {
  loadBuiltinRules();

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      // 任何改动都可能让缓存作废，所以放在所有提前 return 之前
      if (mcache && mcache.doc === e.document) {
        const cs = e.contentChanges;
        if (cs.length !== 1) {
          mcache.offset = 0; mcache.parity = 0;      // 多光标 / 批量改动：位置不好算，直接报废
        } else if (e.document.offsetAt(cs[0].range.start) < mcache.offset) {
          mcache.offset = 0; mcache.parity = 0;      // 改在缓存位置之前 → 前面那段变了 → 报废
        }
      }
      if (e.document.languageId !== 'typst') return;
      const c = e.contentChanges[0];
      if (!c || c.text.length !== 1) return;

      const pos = c.range.start.translate(0, c.text.length);
      const line = e.document.lineAt(pos.line).text.slice(0, pos.character);

      if (expanding) return;

      const cfg = vscode.workspace.getConfiguration('typstMathSuite');
      const inRules = { ...builtinRules.inMath, ...cfg.get('inMathRules', {}) };
      const outRules = { ...builtinRules.outMath, ...cfg.get('outMathRules', {}) };
      const reIn = { ...builtinRules.inMathRegex, ...cfg.get('inMathRegexRules', {}) };
      const reOut = { ...builtinRules.outMathRegex, ...cfg.get('outMathRegexRules', {}) };

      const reInHit = matchRegexRule(line, reIn);
      const reOutHit = matchRegexRule(line, reOut);
      const inHit = matchRule(line, inRules);
      const outHit = matchRule(line, outRules);
      if (!reInHit && !reOutHit && !inHit && !outHit) return;

      const isMath = inMath(e.document, pos);
      const hit = isMath ? (reInHit || inHit) : (reOutHit || outHit);          // ← 判断
      if (!hit) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor || e.document !== editor.document) return;

      expanding = true;
      applyReplacement(editor, pos, hit.trigger, hit.replacement)   // ← 替换
        .finally(() => { expanding = false; });
    })
  );
}
function deactivate() { }
module.exports = { activate, deactivate };
