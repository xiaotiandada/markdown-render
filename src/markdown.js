// import hljsLangs from '../core/hljs/lang.hljs.js'
import { md } from './extra'
import injectLineNumber from './injectLineNumber'

let markdown = md

// let mihe = require('markdown-it-highlightjs-external');
// let missLangs = {};
// let needLangs = [];
// let hljs_opts = {
//     hljs: 'auto',
//     highlighted: true,
//     langCheck: function(lang) {
//         if (lang && hljsLangs[lang] && !missLangs[lang]) {
//             missLangs[lang] = 1;
//             needLangs.push(hljsLangs[lang])
//         }
//     }
// };

// 表情
let emoji = require('markdown-it-emoji');
// 下标
let sub = require('markdown-it-sub')
// 上标
let sup = require('markdown-it-sup')
// container
let container = require('markdown-it-container')
// <dl/>
let deflist = require('markdown-it-deflist')
// <abbr/>
let abbr = require('markdown-it-abbr')
// footnote
let footnote = require('markdown-it-footnote')
// insert 带有下划线 样式 ++ ++
let insert = require('markdown-it-ins')
// mark
let mark = require('markdown-it-mark')
// taskLists
let taskLists = require('markdown-it-task-lists')

// 注释原因: 因为和markdown-it-anchor的功能冲突了(他们的实现方法不一样)
// let toc = require('markdown-it-toc')
// anchor
// error: plugin.apply is not a function
// fix: https://github.com/tylingsoft/markdown-it-mermaid/issues/4
let anchor = require('markdown-it-anchor').default
// toc 替换原来的
let tableOfContents = require('markdown-it-table-of-contents')

// math katex
// let katex = require('markdown-it-katex-external');
let miip = require('markdown-it-images-preview');

// add target="_blank" to all link
let defaultRender = markdown.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  let hIndex = tokens[idx].attrIndex('href');
  if (tokens[idx].attrs[hIndex][1].startsWith('#')) return defaultRender(tokens, idx, options, env, self);
  // If you are sure other plugins can't add `target` - drop check below
  let aIndex = tokens[idx].attrIndex('target');

  if (aIndex < 0) {
      tokens[idx].attrPush(['target', '_blank']); // add new attribute
  } else {
      tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
  }

  // rel 参考了 hackmd 的 a link 处理方式
  let relIndex = tokens[idx].attrIndex('rel');

  if (relIndex < 0) {
      tokens[idx].attrPush(['rel', 'noopener']); // add new attribute
  } else {
      tokens[idx].attrs[relIndex][1] = 'noopener';    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

// use(mihe, hljs_opts)
markdown
  .use(emoji)
  .use(sup)
  .use(sub)
  .use(container)
  // 下面三个和原来库保持一致
  .use(deflist)
  .use(abbr)
  .use(footnote)
  .use(insert)
  .use(mark)
  .use(miip)
  .use(require('markdown-it-mathjax')({
    beforeMath: '<span class="mathjax raw">',
    afterMath: '</span>',
    beforeInlineMath: '<span class="mathjax raw">\\(',
    afterInlineMath: '\\)</span>',
    beforeDisplayMath: '<span class="mathjax raw">\\[',
    afterDisplayMath: '\\]</span>'
  }))
  .use(taskLists)
  .use(anchor)
  .use(tableOfContents, {
    includeLevel: [1,2,3], // hackmd 也只支持到了h3
    markerPattern: /^\[toc\]|^\[\[toc\]\]/im // 如果想 支持 [[toc]] [toc] 的话不能添加 $
  })

injectLineNumber(markdown)

export default markdown