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
  return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u${cp}.png`   ;  
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
  selectMixmoji(undefined, pc.name.split("_"));
}

const scrollElement = (e) => {
  e.target.onscroll = undefined;
  setTimeout(() => { e.target.onscroll = scrollElement; }, 2000);
  document.documentElement.className = e.target.id.replace("#","");
}

const updateAppHeight = () => {
  const doc = document.documentElement
  doc.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', updateAppHeight)
updateAppHeight()

const setFavicon = (url) => {
  document.getElementById("favicon").href = url;
  document.getElementById("md-image").content = url;
}

let p1 = document.getElementById("p1")
let p2 = document.getElementById("p2")
let pc = document.getElementById("pc");

let emojiContainer = document.getElementById("emoji-container");
let mixmojiContainer = document.getElementById("mixmoji-container");
p1.onclick = focusEmoji;
p2.onclick = focusEmoji;


const selectMixmoji = (e, parents) => {
  if (e) document.documentElement.className = "mixmoji-container";
  let img = e?.target || document.getElementById(parents.join("_")) || document.getElementById(parents.reverse().join("_"));
  
  if (!img) return;

  parents = img?.c ? Array.from(img?.c) : undefined;
  console.log("Selecting mix", img.id, parents);

  pc.src = img.src;
  setFavicon(pc.src);

  document.getElementById("preview-container").classList.add("mix")
  pc.name = parents.join("_");
  document.title = "= " + parents.map(codePointToText).join("+");
 
  let p2id = (parents[0] == emoji1.id) ? parents.pop() : parents.shift();
  let p1id = parents.pop();

  emoji1?.classList.remove("selected");
  emoji2?.classList.remove("secondary");
  emoji1 = document.getElementById(p1id);
  emoji2 = document.getElementById(p2id);
  emoji1?.classList.add("selected");
  emoji2?.classList.add("secondary");

  p1.src = emoji1.src;
  p1.targetId = p1id;
  p2.src = emoji2.src;
  p2.targetId = p2id;
  p2.parentElement.classList.add("active");

  
  

  let url = "/mix/?" + img.c.map(cc => codePointToText(cc)).join("&");
  url += "/" + parseInt(img.date).toString(36);
  window.history.replaceState({}, "", url);
}

let emoji1 = undefined;
let emoji2 = undefined;
let pinnedEmoji = undefined;

let emojiStack = localStorage.getItem("emojiStack") ? JSON.parse(localStorage.getItem("emojiStack")) : [];


const clickedEmoji = (e) => {
  if (e) document.documentElement.className = "emoji-container";

  let target = e.target.closest("div");
  if (target == pinnedEmoji) {
    console.log("unpin", pinnedEmoji.title);
    pinnedEmoji.classList.remove("pinned");
    pinnedEmoji = undefined;
  } else if (target == emoji1 || target == emoji2) {
    console.log("pinning", target.title)
    pinnedEmoji?.classList.remove("pinned");
    pinnedEmoji = target;
    pinnedEmoji.classList.add("pinned");
  }

  selectEmoji(undefined, target.id);

  if (pinnedEmoji) {
    selectMixmoji(undefined, [pinnedEmoji.id, target.id]);
  }
}
const selectEmoji = (e, id) => {

  // document.documentElement.className = "emojis";
  let target = e?.target ?? document.getElementById(id);
  id = target.id;
  console.log("Selecting Base", target, id);
  document.getElementById("preview-container").classList.remove("mix")

  window.history.replaceState({}, "", "/mix/?" + codePointToText(id));

  emoji1?.classList.remove("selected");
  emoji2?.classList.remove("secondary");

  if (pinnedEmoji) {
    emoji2 = target;
    emoji1 = pinnedEmoji;
  } else {
    emoji2 = emoji1;
    emoji1 = target;
  }

  emoji1?.classList.add("selected");
  emoji2?.classList.add("secondary");

  emojiStack.unshift(id);
  emojiStack.splice(9);
  localStorage.setItem("emojiStack", JSON.stringify(emojiStack));

  document.title = " = " + codePointToText(id);

  console.log(target.src)
  setFavicon(target.src);
  p1.src = emoji1.src;  
  p2.src = emoji2?.src;
  pc.src = "";

  emojiContainer.onscroll = scrollElement;
  mixmojiContainer.onscroll = scrollElement;
  
  
  const imageLoaded = (e) => { e.target.classList.add("loaded") 
}
  const re = new RegExp("^.*" + target.id + ".*$","gm");

  const array = [...window.pairs.matchAll(re)];

  let parent = document.getElementById("mixmoji-container");
  parent.classList.remove("hidden");
  parent.scrollTo(0, 0);
  parent.childNodes.forEach(child => {parent.removeChild(child)});
  let div = el("div#mixmoji-content", {className: array.length < 20 ? "sparse content" : "content"}, 
    array.map(match => {
      let [d, c1, c2] = match.pop().split("/");
      let className = ["mixmoji"];
      className.push("c-" + c1);
      className.push("c-" + c2);
      let altParent = c1 == id ? c2 : c1;
      let index = emojiStack.indexOf(altParent);
      let date = parseInt(d) + 20200000;
      if (index == 0 && c1 ==  c2) {
        index = -1;
      }
      let url = mixmojiUrl(date, [c1, c2]);
      if (index > 0 || c1 ==  c2) {
        className.push("featured");
      }

      return el("img", {
        id: [c1, c2].join("_"), 
        date: d, 
        className:className.join(" "), c:[c1, c2], onclick:selectMixmoji, 
        style:"transition: all 0.3s " + Math.random()/8 + "s ease-out;" + (index < 0 ? "" : "order:" + (-10 + index)),
        onload:imageLoaded, 
        src:url, 
        loading:"lazy"
      }, codePointToText(c1), codePointToText(c2))
    })
  )
  parent.appendChild(div);
  if (1) {
    selectMixmoji(undefined, [emoji1?.id, emoji2?.id]);
  }

}

let div = el("div#emoji-content.content", {}, 
  window.points.map(point => {
    let dud = window.duds.includes(point);
    let url = emojiUrl(point);
    let text = codePointToText(point);
    return el("div", {id:point, title:text, src:url, className: dud ? "dud emoji" : "emoji"}, el("span", text),
      el("img", {onclick:clickedEmoji, src:url, loading:"lazy"})
    );
  })
)
emojiContainer.appendChild(div);

let query = location.search.substring(1);
if (query.length) {
  let date = undefined;
  if (query.indexOf("/")){
    [query, date] = query.split("/");
    date = parseInt(date,36);
  }
  let components = query.split("&");
  console.log("query", components, date);

  components = components.map(c => Array.from(decodeURIComponent(c)).map(a=>a.codePointAt(0).toString(16)).join("-"));

  if (components.length > 0) {
    document.documentElement.className = "mixmoji-container";

    selectEmoji(undefined, components[0])
    if (components.length > 1) {
      selectMixmoji(undefined, components);
    }
  }
} else {
  // document.documentElement.classList.add("showAbout");
}
