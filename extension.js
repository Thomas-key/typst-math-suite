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

// ── 门控：光标是否在数学模式内 ──
function inMath(doc, pos) {
  const before = doc.getText(new vscode.Range(new vscode.Position(0, 0), pos));
  let parity = 0;
  for (let i = 0; i < before.length; i++) {
    if (before[i] === '$' && before[i - 1] !== '\\') parity ^= 1;   // 未转义的 $ 翻转奇偶
  }
  return parity === 1;   // 奇数 = 在数学里
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
