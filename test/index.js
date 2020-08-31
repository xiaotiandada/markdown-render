import { markdown, finishView } from "../dist/markdown-render-js";

window.onload = function() {
  let md = window.localStorage.getItem('md')
  let content = markdown.render(md)
  // console.log('content', content)
  
  let containerDom = document.querySelector('#container')
  containerDom.innerHTML = content

  setTimeout(() => {
    finishView($('#container'))
    console.log('done')
  }, 500)

}