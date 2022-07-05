const el = (selector, ...args) => {
  var attrs = (args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]) && !(args[0] instanceof HTMLElement)) ? args.shift() : {};

  let classes = selector.split(".");
  if (classes.length > 0) selector = classes.shift();
  if (classes.length) attrs.className = classes.join(" ")

  let id = selector.split("#");
  if (id.length > 0) selector = id.shift();
  if (id.length) attrs.id = id[0];

  var node = document.createElement(selector.length > 0 ? selector : "div");
  for (let prop in attrs) {
    if (attrs.hasOwnProperty(prop) && attrs[prop] != undefined) {
      if (prop.indexOf("data-") == 0) {
        let dataProp = prop.substring(5).replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });
        node.dataset[dataProp] = attrs[prop];
      } else {
        node[prop] = attrs[prop];
      }
    }
  }

  const append = (child) => {
    if (Array.isArray(child)) return child.forEach(append);
    if (typeof child == "string") child = document.createTextNode(child);
    if (child) node.appendChild(child);
  };
  args.forEach(append);

  return node;
};
window.el = el;





const codePointToText = (codePoint) => {
  let cps = codePoint.split("-").map(hex => parseInt(hex, 16));
  let emoji = String.fromCodePoint(...cps);
  return emoji;
}
const emojiUrl = (codePoint) => {
  let cp = codePoint.split("-").filter(x => x !== "fe0f").join("_");

  return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/emoji_u${cp}.svg`      
}

const mixmojiUrl = (r, c) => {
  c[0] = c[0].split(/-/g).join("-u");
  c[1] = c[1].split(/-/g).join("-u");
  return `https://www.gstatic.com/android/keyboard/emojikitchen/${r}/u${c[0]}/u${c[0]}_u${c[1]}.png`
}

const copyToClipboard = async (e) => {
  console.log("e,",e);
  try {
    const imgURL = e.target.src;
    const data = await fetch(imgURL);
    const blob = await data.blob();

    const image = new Image();
    img.src = e.target.src;
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    console.log('Fetched image copied.');
  } catch(err) {
    console.error(err.name, err.message);
  }
}

const focusEmoji = (e) => {
  clickEmoji(e);
}
let p1 = document.getElementById("p1")
let p2 = document.getElementById("p2")
let pc = document.getElementById("pc");

let e1 = document.getElementById("emojis");
let e2 = document.getElementById("mixmojis");
p1.onclick = focusEmoji;
p2.onclick = focusEmoji;

const focusElement = (e) => {
  // console.log("e",e)
  document.documentElement.className = e.target.id.replace("#","");
}


e1.ontouchstart = e1.onmousedown = focusElement;
e2.ontouchstart = e2.onmousedown = focusElement;

console.log(p1)

clickMixMoji = (e) => {
  let img = e.target;

  document.getElementById("pc").src = e.target.src;
  
  let p2id = img.c[0] == lastEmoji.id ? img.c[1] : img.c[0];
  let parent2 = document.getElementById(p2id)
  
  // document.documentElement.className = "mixmoji";
  document.getElementById("p2").src = parent2.src;
  
  console.log("CLicked", img.id, img.c);
  location.hash = "/" + img.c.map(cc => codePointToText(cc)).join("/");
  // location.hash = "/" + codePointToText(e.target.id);
}

let lastEmoji = undefined;
const clickEmoji = (e) => {
  console.log("CLicked", e.target.id);
  location.hash = "/" + codePointToText(e.target.id);
  lastEmoji?.classList.remove("selected");
  e.target.classList.add("selected");
  lastEmoji = e.target;


  pc.src = "";
  p2.src = "";
  
  document.getElementById("p1").src = e.target.src;
  const re = new RegExp("^.*" + e.target.id + ".*$","gm");

  const array = [...window.pairs.matchAll(re)];

  let parent = document.getElementById("mixmojis");
  parent.classList.remove("hidden");
  parent.scrollTo(0, 0);
  parent.childNodes.forEach(child => {parent.removeChild(child)});
  let div = el("div", {}, 
    array.map(match => {
      let [d, c1, c2] = match.pop().split("/")
      let url = mixmojiUrl(parseInt(d) + 20200000, [c1, c2]);
      return el("img.mixmoji", {id: c1+c2, c:[c1, c2], onclick:clickMixMoji, src:url, loading:"lazy"}, codePointToText(c1), codePointToText(c2))
    })

  )

  parent.appendChild(div);
}

let div = el("div", {}, 
  window.points.map(point => el("img.emoji", {id: point, onclick:clickEmoji, src:emojiUrl(point), loading:"lazy"}, codePointToText(point)))
)

document.getElementById("emojis").appendChild(div);


console.log("e",div)

// let p1 = document.getElementById("p1");
// let p2 = document.getElementById("p2");
// var revisions = ["20201001","20210218","20210521","20210831","20211115","20220110","20220203","20220406","20220506",
// ];
// p1.oninput = update;
// p2.oninput = update;
// p1.onfocus = p2.onfocus = (e) => e.target.select();
// p1.onmouseup = p2.onmouseup = (e) => {return false;}

// const codePoints = s => Array.from(s).map(c => c.codePointAt(0));
// const concatPoints = a => a.map(d => "u" + d.toString(16)).join("-");

// function update(e) {
//   e?.target?.select();
//   let img = document.getElementById("child");
  
//   let cp = [
//     codePoints(p1.value || p1.placeholder),
//     codePoints(p2.value || p2.placeholder)
//   ]//.sort((a, b) => a[0]-b[0])
//   cp = cp.map(a => concatPoints(a))  

//   let cpAlts = [cp, [cp[1], cp[0]]];
//   cpAlts.forEach(c => {
//     revisions.forEach(r => {
//       let url = `https://www.gstatic.com/android/keyboard/emojikitchen/${r}/${c[0]}/${c[0]}_${c[1]}.png`
//       var tester=new Image();
//       tester.onload=(i) => console.log("i", img.src = url);
//       tester.onerror=(i) => {};console.debug("e:"+ url);
//       tester.src=url;
//     })
//   })
   
   
// }
// update()



