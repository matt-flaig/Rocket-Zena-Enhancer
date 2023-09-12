var subdomain = window.location.hostname.split('.').slice(0, -2).join('.');

// valid environments: test, qa, prod
var zenaEnvironment = (function (subdomain) {
  switch (subdomain) {
    case "zena-test":
      return "test"
    case "zena-qa":
      return "qa";
    case "zena-prod":
      return "prod";
  }
})(subdomain);

window.onload = function(e){ 
  console.log("Zena Platform Enhancer Loaded");
  
  // recall base preferences
  chrome.storage.sync.get(["theme", "disableSaveBeforeExiting", "multilineDetailsInput"], function(e) {
    // set the theme based on preference
    if(e.theme == "inverted"){
      console.log('Applying inverted theme')
      invertWebpageColors();
    }
    // disable exit prompt when there are unsaved changes
    if(e.disableSaveBeforeExiting == "yes"){
      console.log('Overriding onbeforeunload globally')
      window.addEventListener("onbeforeunload", (event) => {
        event.stopImmediatePropagation();
      }, true);
      window.addEventListener("beforeunload", (event) => {
        event.stopImmediatePropagation();
      }, true);
      window.onbeforeunload = function() {
        return null;  // return null to avoid pop up
      }
    }
    // multiline editing is enabled by default in options.html
    // so we default to turning it on if there's anything but "no"
    if(e.multilineDetailsInput != "no"){
      // load the extension override script
      loadScript('library/js/extensions.js');
    }
  });  

}
// change header color based on env
document.arrive("#app-header", function(element) {
  if(zenaEnvironment){ // not all instances will have a Zena environment setup
    if(zenaEnvironment == "test"){
      element.style.backgroundColor = "#96ca4f";
    }
    if(zenaEnvironment == "qa"){
      element.style.backgroundColor = "#7f63a1";
    }
    if(zenaEnvironment == "prod"){
      element.style.backgroundColor = "#f14d3c";
    }
    
    // change Zena Title to selector
    // move this to a setInterval until it's inserted
    // as sometimes it fires too early while things
    // are still loading and doesn't load into
    // the header.
    setTimeout(function(){
      var subHeaderField = element.querySelector('.app-header2-text');
      subHeaderField.style.top = "-2px";
      subHeaderField.innerHTML = '<select name="environment" id="environmentSelector" class="x-font-select x-form-field x-form-text-default" onFocus="this.setAttribute(\'PrvSelectedValue\',this.value);" onChange="changeToSelectedEnvironment(event, this)"><option value="prod" ' + (zenaEnvironment == "prod" ? "selected" : "") + '>Zena Prod</option><option value="qa" ' + (zenaEnvironment == "qa" ? "selected" : "") + '>Zena QA</option><option value="test" ' + (zenaEnvironment == "test" ? "selected" : "") + '>Zena Test</option></select>';
      // Fire the window resize event which fixes the header vertical centering
      // setTimeout(function(){
      //   window.dispatchEvent(new Event('resize'));
      // }, 1200)
      
      //element.querySelector('#box-1049').innerHTML = '<select name="environment" id="environment"><option value="test"' + (zenaEnvironment == "test" ? "selected" : "") + '>Zena-TEST</option><option value="qa">Zena-QA</option><option value="prod">Zena-PROD</option></select>';
    }, 750);
  }
});

chrome.storage.sync.get(["autoExpandCollapsedElements"], function(e) {
  if(e.autoExpandCollapsedElements == "yes"){
    document.arrive('.x-tool-expand-bottom', function(el){
      // document.querySelectorAll('.x-tool-expand-bottom').forEach((e) => {
      //   el.click();
      // })
      console.log('Expanding element: ')
      console.log(el);
      el.click();
    })    
  }
});

function openExensionOptionsPage(){
  window.open(chrome.runtime.getURL('options.html'));
}

function invertWebpageColors(){
  // creates an element that overlays the entire webpage and inverts all the colors
  (d=>{
    var css = `
          :root{
            background-color: #fefefe;
            filter: invert(100%)
          }
          * {
            background-color: inherit
          }
          img:not([src*=".svg"]), video{
            filter: invert(100%)
          }
    `,
    style,
    id="dark-theme-snippet",
    ee = d.getElementById(id);
    if (null != ee) ee.parentNode.removeChild(ee);
    else {
      style = d.createElement('style');
      style.type = "text/css";
      style.id = id;
      if (style.styleSheet) style.styleSheet.cssText = css;
      else style.appendChild(d.createTextNode(css));
      (d.head||d.querySelector('head')).appendChild(style);
    }
  })(document)
}

// function used to load scripts by injecting a script tag at in the <body> element
const loadScript = (url) => {
  let body = document.getElementsByTagName('body')[0];
  let script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.runtime.getURL(url));
  body.appendChild(script);
}
loadScript('library/js/inline.js');
