function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlight(code, tokenPattern) {
  let output = "";
  let cursor = 0;
  for (const match of code.matchAll(tokenPattern)) {
    output += escapeHtml(code.slice(cursor, match.index));
    const [token, comment, stringLiteral, numberLiteral, keyword, builtinType, namedType, fnName] = match;
    const className = comment ? "tok-comment"
      : stringLiteral ? "tok-str"
        : numberLiteral ? "tok-num"
          : keyword ? "tok-kw"
            : builtinType || namedType ? "tok-type"
              : fnName ? "tok-fn"
                : "";
    output += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
    cursor = match.index + token.length;
  }
  return output + escapeHtml(code.slice(cursor));
}

export function isRustScriptFence(language) {
  return /^(rss|rustscript)$/i.test(language.trim());
}

export function isRustFence(language) {
  return /^(rs|rust)$/i.test(language.trim());
}

export function isTomlFence(language) {
  return /^toml$/i.test(language.trim());
}

export function highlightRustScript(code) {
  return highlight(code, /(\/\/.*)|("(?:\\.|[^"\\])*")|(\b\d(?:[\d_]*\d)?\b)|(\b(?:fn|pub|let|mut|if|else|match|for|while|use|struct|return|true|false|None|Some|=>)\b)|(\b(?:int|string|bool|float|bytes|map|array)\b)|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_][A-Za-z0-9_]*(?=\s*(?:<|::\s*<)?\())/g);
}

export function highlightRust(code) {
  return highlight(code, /(\/\/.*|\/\*[\s\S]*?\*\/)|((?:r#*)?"(?:\\.|[^"\\])*")|(\b\d(?:[\d_]*\d)?(?:\.\d(?:[\d_]*\d)?)?\b)|(\b(?:as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|yield)\b)|(\b(?:bool|char|str|i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|String|Vec|Option|Result|Box)\b)|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_][A-Za-z0-9_]*(?=\s*(?:<|::\s*<)?\())/g);
}

export function highlightToml(code) {
  let output = "";
  let cursor = 0;
  const tokenPattern = /(#.*)|("(?:\\.|[^"\\])*"|'[^']*')|(\b\d(?:[\d_]*\d)?(?:\.\d(?:[\d_]*\d)?)?\b)|(\b(?:true|false)\b)|(^\s*\[\[?[^\]\n]+\]\]?\s*$)|(^\s*[A-Za-z0-9_.-]+(?=\s*=))/gm;
  for (const match of code.matchAll(tokenPattern)) {
    output += escapeHtml(code.slice(cursor, match.index));
    const [token, comment, stringLiteral, numberLiteral, booleanLiteral, table, key] = match;
    const className = comment ? "tok-comment"
      : stringLiteral ? "tok-str"
        : numberLiteral ? "tok-num"
          : booleanLiteral ? "tok-kw"
            : table ? "tok-type"
              : key ? "tok-fn"
                : "";
    output += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
    cursor = match.index + token.length;
  }
  return output + escapeHtml(code.slice(cursor));
}
