// https://github.com/hackmdio/codimd/blob/f0fbd09fa0a37672ced98576612d6eb472a51e31/public/js/lib/syncscroll.js

import markdownitContainer from 'markdown-it-container'

// Inject line numbers for sync scroll.
export default function injectLineNumber(md) {
  function addPart (tokens, idx) {
    if (tokens[idx].map && tokens[idx].level === 0) {
      const startline = tokens[idx].map[0] + 1
      const endline = tokens[idx].map[1]
      tokens[idx].attrJoin('class', 'part')
      tokens[idx].attrJoin('data-startline', startline)
      tokens[idx].attrJoin('data-endline', endline)
    }
  }

  md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw')
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.bullet_list_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.list_item_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw')
    if (tokens[idx].map) {
      const startline = tokens[idx].map[0] + 1
      const endline = tokens[idx].map[1]
      tokens[idx].attrJoin('data-startline', startline)
      tokens[idx].attrJoin('data-endline', endline)
    }
    return self.renderToken(...arguments)
  }
  md.renderer.rules.ordered_list_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('class', 'raw')
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
    let langName = ''
    let highlighted

    if (info) {
      langName = info.split(/\s+/g)[0]
      if (/!$/.test(info)) token.attrJoin('class', 'wrap')
      token.attrJoin('class', options.langPrefix + langName.replace(/=$|=\d+$|=\+$|!$|=!/, ''))
      token.attrJoin('class', 'hljs')
      token.attrJoin('class', 'raw')
    }

    if (options.highlight) {
      highlighted = options.highlight(token.content, info) || md.utils.escapeHtml(token.content)
    } else {
      highlighted = md.utils.escapeHtml(token.content)
    }

    if (highlighted.indexOf('<pre') === 0) {
      return `${highlighted}\n`
    }

    if (tokens[idx].map && tokens[idx].level === 0) {
      const startline = tokens[idx].map[0] + 1
      const endline = tokens[idx].map[1]
      return `<pre class="part" data-startline="${startline}" data-endline="${endline}"><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`
    }

    return `<pre><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`
  }
  md.renderer.rules.code_block = (tokens, idx, options, env, self) => {
    if (tokens[idx].map && tokens[idx].level === 0) {
      const startline = tokens[idx].map[0] + 1
      const endline = tokens[idx].map[1]
      return `<pre class="part" data-startline="${startline}" data-endline="${endline}"><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>\n`
    }
    return `<pre><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>\n`
  }
  function renderContainer (tokens, idx, options, env, self) {
    tokens[idx].attrJoin('role', 'alert')
    tokens[idx].attrJoin('class', 'alert')
    tokens[idx].attrJoin('class', `alert-${tokens[idx].info.trim()}`)
    addPart(tokens, idx)
    return self.renderToken(...arguments)
  }

  md.use(markdownitContainer, 'success', { render: renderContainer })
  md.use(markdownitContainer, 'info', { render: renderContainer })
  md.use(markdownitContainer, 'warning', { render: renderContainer })
  md.use(markdownitContainer, 'danger', { render: renderContainer })
  md.use(markdownitContainer, 'spoiler', {
    validate: function (params) {
      return params.trim().match(/^spoiler(\s+.*)?$/)
    },
    render: function (tokens, idx) {
      const m = tokens[idx].info.trim().match(/^spoiler(\s+.*)?$/)

      if (tokens[idx].nesting === 1) {
        // opening tag
        const startline = tokens[idx].map[0] + 1
        const endline = tokens[idx].map[1]

        const partClass = `class="part raw" data-startline="${startline}" data-endline="${endline}"`
        const summary = m[1] && m[1].trim()
        if (summary) {
          return `<details ${partClass}><summary>${md.renderInline(summary)}</summary>\n`
        } else {
          return `<details ${partClass}>\n`
        }
      } else {
        // closing tag
        return '</details>\n'
      }
    }
  })
}