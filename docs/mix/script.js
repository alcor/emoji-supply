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
  selectEmoji(undefined,e.target.targetId);
}

let p1 = document.getElementById("p1")
let p2 = document.getElementById("p2")
let pc = document.getElementById("pc");

let e1 = document.getElementById("emojis");
let e2 = document.getElementById("mixmojis");
p1.onclick = focusEmoji;
p2.onclick = focusEmoji;

const scrollElement = (e) => {
  e.target.onscroll = undefined;
  setTimeout(() => { e.target.onscroll = scrollElement; }, 2000);

  document.documentElement.className = e.target.id.replace("#","");
}

const appHeight = () => {
  const doc = document.documentElement
  doc.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', appHeight)
appHeight()


console.log(p1)

selectMixmoji = (e, parents) => {
  let img = e?.target || document.getElementById(parents.join("_"));
  parents = Array.from(img.c)
  console.log("Selecting mix", img, parents);

  document.getElementById("pc").src = img.src;
 
  
  let p2id = (parents[0] == lastEmoji.id) ? parents.pop() : parents.shift();
  let p1id = parents.pop();
  
  let parent1 = document.getElementById(p1id);
  let parent2 = document.getElementById(p2id)
  
  p1.src = lastEmoji.src;
  p1.targetId = p1id;
  // document.documentElement.className = "mixmoji";
  p2.src = parent2.src;
  p2.targetId = p2id;
  
  location.hash = "/" + img.c.map(cc => codePointToText(cc)).join("/");
  // location.hash = "/" + codePointToText(e.target.id);
}

let lastEmoji = undefined;
const selectEmoji = (e, id) => {
  let target = e?.target ?? document.getElementById(id);
  id = target.id;
  console.log("Selecting Base", target, id);
  location.hash = "/" + codePointToText(id);
  lastEmoji?.classList.remove("selected");
  target.classList.add("selected");
  lastEmoji = target;

  pc.src = target.src;
  p1.src = "";
  p2.src = "";

  e1.onscroll = scrollElement;
  e2.onscroll = scrollElement;
  document.documentElement.className = "mixmojis"
  
  const imageLoaded = (e) => {
    e.target.classList.add("loaded")
  }
  const re = new RegExp("^.*" + target.id + ".*$","gm");

  const array = [...window.pairs.matchAll(re)];

  let parent = document.getElementById("mixmojis");
  parent.classList.remove("hidden");
  parent.scrollTo(0, 0);
  parent.childNodes.forEach(child => {parent.removeChild(child)});
  let div = el("div", {className: array.length < 20 ? "sparse" : ""}, 
    array.map(match => {
      let [d, c1, c2] = match.pop().split("/")
      let url = mixmojiUrl(parseInt(d) + 20200000, [c1, c2]);
      return el("img.mixmoji", {id: [c1, c2].join("_"), c:[c1, c2], onclick:selectMixmoji, style:"transition: all 0.3s " + Math.random()/8 + "s ease-out", onload:imageLoaded, src:url, loading:"lazy"}, codePointToText(c1), codePointToText(c2))
    })

  )

  parent.appendChild(div);
}

let div = el("div", {}, 
  window.points.map(point => el("img.emoji", {id: point, onclick:selectEmoji, src:emojiUrl(point), loading:"lazy"}, codePointToText(point)))
)

document.getElementById("emojis").appendChild(div);

let hash = location.hash;
let components = hash.split("/");
components.shift();
components = components.map(c => Array.from(decodeURIComponent(c)).map(a=>a.codePointAt(0).toString(16)).join("-"));
console.log("hash", components);
if (components.length > 0) {
  document.documentElement.className = "mixmojis";
}
selectEmoji(undefined, components[0])
if (components.length > 1) {
  selectMixmoji(undefined, components);
}


