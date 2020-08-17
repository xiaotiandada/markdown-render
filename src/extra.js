import hljs from 'highlight.js'
import unescapeHTML from 'lodash/unescape'
import Prism from 'prismjs'
import escapeHTML from 'lodash/escape'
import PDFObject from 'pdfobject'
import isURL from 'validator/lib/isURL'
import Plugin from 'markdown-it-regexp'
// import $ from 'jquery'
import mdIt from "markdown-it";

// import flowchart from 'flowchart.js'
// let viz = new Viz()


function highlightRender (code, lang) {
  if (!lang || /no(-?)highlight|plain|text/.test(lang)) { return }
  function parseFenceCodeParams (lang) {
    const attrMatch = lang.match(/{(.*)}/)
    const params = {}
    if (attrMatch && attrMatch.length >= 2) {
      const attrs = attrMatch[1]
      const paraMatch = attrs.match(/([#.](\S+?)\s)|((\S+?)\s*=\s*("(.+?)"|'(.+?)'|\[[^\]]*\]|\{[}]*\}|(\S+)))/g)
      paraMatch && paraMatch.forEach(param => {
        param = param.trim()
        if (param[0] === '#') {
          params['id'] = param.slice(1)
        } else if (param[0] === '.') {
          if (params['class']) params['class'] = []
          params['class'] = params['class'].concat(param.slice(1))
        } else {
          const offset = param.indexOf('=')
          const id = param.substring(0, offset).trim().toLowerCase()
          let val = param.substring(offset + 1).trim()
          const valStart = val[0]
          const valEnd = val[val.length - 1]
          if (['"', "'"].indexOf(valStart) !== -1 && ['"', "'"].indexOf(valEnd) !== -1 && valStart === valEnd) {
            val = val.substring(1, val.length - 1)
          }
          if (id === 'class') {
            if (params['class']) params['class'] = []
            params['class'] = params['class'].concat(val)
          } else {
            params[id] = val
          }
        }
      })
    }
    return params
  }
  function serializeParamToAttribute (params) {
    if (Object.getOwnPropertyNames(params).length === 0) {
      return ''
    } else {
      return ` data-params="${escape(JSON.stringify(params))}"`
    }
  }
  const fenceCodeAlias = {
    sequence: 'sequence-diagram',
    flow: 'flow-chart',
    graphviz: 'graphviz',
    mermaid: 'mermaid',
    abc: 'abc',
    vega: 'vega',
    geo: 'geo'
  }

  const params = parseFenceCodeParams(lang)
  const attr = serializeParamToAttribute(params)
  lang = lang.split(/\s+/g)[0]

  code = escapeHTML(code)

  const langAlias = fenceCodeAlias[lang]
  if (langAlias) {
    return `<div class="${langAlias} raw"${attr}>${code}</div>`
  }

  const result = {
    value: code
  }
  const showlinenumbers = /=$|=\d+$|=\+$/.test(lang)
  if (showlinenumbers) {
    let startnumber = 1
    const matches = lang.match(/=(\d+)$/)
    if (matches) { startnumber = parseInt(matches[1]) }
    const lines = result.value.split('\n')
    const linenumbers = []
    for (let i = 0; i < lines.length - 1; i++) {
      linenumbers[i] = `<span data-linenumber='${startnumber + i}'></span>`
    }
    const continuelinenumber = /=\+$/.test(lang)
    const linegutter = `<div class='gutter linenumber${continuelinenumber ? ' continue' : ''}'>${linenumbers.join('\n')}</div>`
    result.value = `<div class='wrapper'>${linegutter}<div class='code'>${result.value}</div></div>`
  }
  return result.value
}


const md = mdIt({
  html: true,        // Enable HTML tags in source
  xhtmlOut: true,        // Use '/' to close single tags (<br />).
  breaks: true,        // Convert '\n' in paragraphs into <br>
  langPrefix: '',  // CSS language prefix for fenced blocks. Can be
  linkify: false,        // 自动识别url
  typographer: true,
  quotes: '“”‘’',
  highlight: highlightRender
});

// pdf
const pdfPlugin = new Plugin(
  // regexp to match
  /{%pdf\s*([\d\D]*?)\s*%}/,

  // match, utils
  (match) => {
    const pdfurl = match[1]
    if (!isURL(pdfurl)) return match[0]
    const div = $('<div class="pdf raw"></div>')
    div.attr('data-pdfurl', pdfurl)
    return div[0].outerHTML
  }
)
md.use(pdfPlugin)

// regex for extra tags
const spaceregex = /\s*/
const notinhtmltagregex = /(?![^<]*>|[^<>]*<\/)/
let coloregex = /\[color=([#|(|)|\s|,|\w]*?)\]/
coloregex = new RegExp(coloregex.source + notinhtmltagregex.source, 'g')
let nameregex = /\[name=(.*?)\]/
let timeregex = /\[time=([:|,|+|-|(|)|\s|\w]*?)\]/
const nameandtimeregex = new RegExp(nameregex.source + spaceregex.source + timeregex.source + notinhtmltagregex.source, 'g')
nameregex = new RegExp(nameregex.source + notinhtmltagregex.source, 'g')
timeregex = new RegExp(timeregex.source + notinhtmltagregex.source, 'g')

function replaceExtraTags (html) {
  html = html.replace(coloregex, '<span class="color" data-color="$1"></span>')
  html = html.replace(nameandtimeregex, '<small><i class="fa fa-user"></i> $1 <i class="fa fa-clock-o"></i> $2</small>')
  html = html.replace(nameregex, '<small><i class="fa fa-user"></i> $1</small>')
  html = html.replace(timeregex, '<small><i class="fa fa-clock-o"></i> $1</small>')
  return html
}

export { md }

// dynamic event or object binding here
export function finishView (view) {
  // blockquote
  const blockquote = view.find('blockquote.raw').removeClass('raw')


  const blockquoteP = blockquote.find('p')
  blockquoteP.each((key, value) => {
    let html = $(value).html()
    html = replaceExtraTags(html)
    $(value).html(html)
  })
  // color tag in blockquote will change its left border color
  const blockquoteColor = blockquote.find('.color')
  blockquoteColor.each((key, value) => {
    $(value).closest('blockquote').css('border-left-color', $(value).attr('data-color'))
  })

  // TODO:
  // sequence diagram
  // const sequences = view.find('div.sequence-diagram.raw').removeClass('raw')
  // sequences.each((key, value) => {
  //   try {
  //     var $value = $(value)
  //     const $ele = $(value).parent().parent()

  //     const sequence = $value
  //     sequence.sequenceDiagram({
  //       theme: 'simple'
  //     })

  //     $ele.addClass('sequence-diagram')
  //     $value.children().unwrap().unwrap()
  //     const svg = $ele.find('> svg')
  //     svg[0].setAttribute('viewBox', `0 0 ${svg.attr('width')} ${svg.attr('height')}`)
  //     svg[0].setAttribute('preserveAspectRatio', 'xMidYMid meet')
  //   } catch (err) {
  //     $value.unwrap()
  //     $value.parent().append(`<div class="alert alert-warning">${escapeHTML(err)}</div>`)
  //     console.warn(err)
  //   }
  // })

  // flowchart
  // const flow = view.find('div.flow-chart.raw').removeClass('raw')
  // flow.each((key, value) => {
  //   try {
  //     var $value = $(value)
  //     const $ele = $(value).parent().parent()

  //     const chart = flowchart.parse($value.text())
  //     $value.html('')
  //     chart.drawSVG(value, {
  //       'line-width': 2,
  //       fill: 'none',
  //       'font-size': '16px',
  //       'font-family': "'Andale Mono', monospace"
  //     })

  //     $ele.addClass('flow-chart')
  //     $value.children().unwrap().unwrap()
  //   } catch (err) {
  //     $value.unwrap()
  //     $value.parent().append(`<div class="alert alert-warning">${escapeHTML(err)}</div>`)
  //     console.warn(err)
  //   }
  // })
  // TODO:
  // graphviz
  // var graphvizs = view.find('div.graphviz.raw').removeClass('raw')
  // graphvizs.each(function (key, value) {
  //   try {
  //     var $value = $(value)
  //     var $ele = $(value).parent().parent()
  //     $value.unwrap()
  //     viz.renderString($value.text())
  //       .then(graphviz => {
  //         if (!graphviz) throw Error('viz.js output empty graph')
  //         $value.html(graphviz)

  //         $ele.addClass('graphviz')
  //         $value.children().unwrap()
  //       })
  //       .catch(err => {
  //         viz = new Viz()
  //         $value.parent().append(`<div class="alert alert-warning">${escapeHTML(err)}</div>`)
  //         console.warn(err)
  //       })
  //   } catch (err) {
  //     viz = new Viz()
  //     $value.parent().append(`<div class="alert alert-warning">${escapeHTML(err)}</div>`)
  //     console.warn(err)
  //   }
  // })

  // pdf
  view.find('div.pdf.raw').removeClass('raw')
    .each(function (key, value) {
      const url = $(value).attr('data-pdfurl')
      // 修改
      // const inner = $('<div></div>')
      const pdfDiv = document.createElement('div')
      // 修改 end
      $(this).append(pdfDiv)
      PDFObject.embed(url, pdfDiv, {
        height: '400px'
      })
    })

  // syntax highlighting
  view.find('code.raw').removeClass('raw')
    .each((key, value) => {
      const langDiv = $(value)
      if (langDiv.length > 0) {
        const reallang = langDiv[0].className.replace(/hljs|wrap/g, '').trim()
        const codeDiv = langDiv.find('.code')
        let code = ''
        if (codeDiv.length > 0) code = codeDiv.html()
        else code = langDiv.html()
        var result
        if (!reallang) {
          result = {
            value: code
          }
        } else if (reallang === 'haskell' || reallang === 'go' || reallang === 'typescript' || reallang === 'jsx' || reallang === 'gherkin') {
          code = unescapeHTML(code)
          result = {
            value: Prism.highlight(code, Prism.languages[reallang])
          }
        } else if (reallang === 'tiddlywiki' || reallang === 'mediawiki') {
          code = unescapeHTML(code)
          result = {
            value: Prism.highlight(code, Prism.languages.wiki)
          }
        } else if (reallang === 'cmake') {
          code = unescapeHTML(code)
          result = {
            value: Prism.highlight(code, Prism.languages.makefile)
          }
        } else {
          code = unescapeHTML(code)
          const languages = hljs.listLanguages()
          if (!languages.includes(reallang)) {
            result = hljs.highlightAuto(code)
          } else {
            result = hljs.highlight(reallang, code)
          }
        }
        if (codeDiv.length > 0) codeDiv.html(result.value)
        else langDiv.html(result.value)
      }
    })
  
  // mathjax
  const mathjaxdivs = view.find('span.mathjax.raw').removeClass('raw').toArray()
  try {
    if (mathjaxdivs.length > 1) {
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, mathjaxdivs])
      window.MathJax.Hub.Queue(window.viewAjaxCallback)
    } else if (mathjaxdivs.length > 0) {
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, mathjaxdivs[0]])
      window.MathJax.Hub.Queue(window.viewAjaxCallback)
    }
  } catch (err) {
    console.warn(err)
  }
}
