import { wholeTokenSpan as L, markExtRanges as T, pairMarks as D, Plugin as B } from "@textox/plugin-sdk";
import { Plugin as y, PluginKey as M, TextSelection as x } from "prosemirror-state";
import { Decoration as v, DecorationSet as k } from "prosemirror-view";
const C = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, O = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
};
function W(e) {
  const n = document.createElement("span");
  return n.className = "alert-label", n.contentEditable = "false", n.textContent = O[e] ?? e, n;
}
function H(e, n) {
  const a = [];
  return e.descendants((t, o) => {
    if (t.type.name !== "blockquote") return !0;
    const r = t.firstChild;
    if (!r || r.type.name !== "paragraph") return !1;
    const i = r.firstChild;
    if (!i?.isText) return !1;
    const s = i.text?.match(C);
    if (!s) return !1;
    const l = s[1].toLowerCase();
    if (!O[l]) return !1;
    a.push(
      v.node(o, o + t.nodeSize, { class: `alert alert-${l}` })
    );
    const c = o + 2, u = c + s[0].length;
    return n >= c && n <= u || (a.push(v.inline(c, u, { class: "syntax-hidden" })), a.push(v.widget(c, W(l), { side: -1 }))), !1;
  }), a;
}
function U(e) {
  e.core.ruler.push("alert_split", (n) => {
    const a = n.tokens;
    for (let t = 0; t < a.length; t++) {
      if (a[t]?.type !== "blockquote_open") continue;
      let o = 1, r = -1;
      for (let h = t + 1; h < a.length && o > 0; h++) {
        const g = a[h];
        if (g.type === "blockquote_open") {
          o++;
          continue;
        }
        if (g.type === "blockquote_close") {
          o--;
          continue;
        }
        o === 1 && g.type === "inline" && r < 0 && (r = h);
      }
      if (r < 0) continue;
      const i = a[r], s = i.content;
      if (!s.match(C)) continue;
      const c = s.indexOf(`
`);
      if (c < 0) continue;
      const u = s.slice(0, c), m = s.slice(c + 1);
      i.content = u, i.children = [new n.Token("text", "", 0)], i.children[0].content = u;
      const _ = [];
      _.push(new n.Token("paragraph_close", "p", -1));
      const p = new n.Token("paragraph_open", "p", 1);
      p.block = !0, _.push(p);
      const d = new n.Token("inline", "", 0);
      d.content = m, d.children = [new n.Token("text", "", 0)], d.children[0].content = m, d.block = !0, _.push(d), _.push(new n.Token("paragraph_close", "p", -1)), a.splice(r + 1, 1, ..._), t = r + _.length;
    }
    return !0;
  });
}
const V = {
  name: "alert",
  mdItPlugins: [U],
  inline: {
    markNames: [],
    extRanges: (e) => {
      if (e.type.name !== "paragraph") return [];
      const n = e.textContent.match(C);
      return n ? [[0, n[0].length]] : [];
    }
  },
  plugins: (e) => [
    new y({
      key: new M("alert-decoration"),
      props: {
        decorations(n) {
          const a = H(n.doc, n.selection.$head.pos);
          return a.length > 0 ? k.create(n.doc, a) : k.empty;
        }
      }
    })
  ]
}, K = {
  id: "alert",
  register: ({ editor: e }) => [e.registerSyntaxFeature(V)]
}, G = { "[": "]", "(": ")" }, Z = /* @__PURE__ */ new Set(["]", ")"]);
function J(e) {
  return e.length === 0 || /^\s/.test(e);
}
function X() {
  return new y({
    props: {
      handleTextInput(e, n, a, t) {
        if (e.editable === !1) return !0;
        if (n !== a) return !1;
        const o = e.state.doc.resolve(n);
        if (!o.parent.isTextblock) return !1;
        const r = o.parentOffset, i = o.parent.content.size, s = r < i ? o.parent.textBetween(r, r + 1) : "";
        if (Z.has(t) && s === t) {
          const m = e.state.tr.setSelection(
            x.create(e.state.doc, n + 1)
          );
          return e.dispatch(m), !0;
        }
        const l = G[t];
        if (!l) return !1;
        const c = o.parent.textBetween(r, i);
        if (!J(c)) return !1;
        const u = e.state.tr.insertText(t + l, n, a);
        return u.setSelection(x.create(u.doc, n + 1)), e.dispatch(u), !0;
      }
    }
  });
}
const Q = (e, n) => {
  const a = e.selection;
  if (!a.empty) return !1;
  const t = e.doc.resolve(a.from);
  if (!t.parent.isTextblock) return !1;
  const o = t.parentOffset, r = t.parent.content.size;
  if (o === 0 || o === r) return !1;
  const i = t.parent.textBetween(o - 1, o), s = t.parent.textBetween(o, o + 1);
  return i === "[" && s === "]" || i === "(" && s === ")" ? (n && n(e.tr.delete(a.from - 1, a.from + 1)), !0) : !1;
}, Y = {
  name: "auto_pair",
  plugins: () => [X()],
  keymap: (e) => ({
    Backspace: Q
  })
}, ee = {
  id: "autoPair",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Y)]
};
function ne(e, n) {
  return e[n].content;
}
function ae(e, n, a, t, o) {
  const r = e.utils.arrayReplaceAt, i = e.utils.lib.ucmicro, s = new RegExp([i.Z.source, i.P.source, i.Cc.source].join("|"));
  function l(c, u, m) {
    let _ = 0;
    const p = [];
    if (c.replace(o, function(d, h, g) {
      let f;
      if (Object.prototype.hasOwnProperty.call(a, d)) {
        if (f = a[d], h > 0 && !s.test(g[h - 1]) || h + d.length < g.length && !s.test(g[h + d.length]))
          return;
      } else
        f = d.slice(1, -1);
      if (h > _) {
        const A = new m("text", "", 0);
        A.content = c.slice(_, h), p.push(A);
      }
      const j = new m("emoji", "", 0);
      j.markup = f, j.content = n[f], p.push(j), _ = h + d.length;
    }), _ < c.length) {
      const d = new m("text", "", 0);
      d.content = c.slice(_), p.push(d);
    }
    return p;
  }
  return function(u) {
    let m;
    const _ = u.tokens;
    let p = 0;
    for (let d = 0, h = _.length; d < h; d++) {
      if (_[d].type !== "inline")
        continue;
      let g = _[d].children;
      for (let f = g.length - 1; f >= 0; f--)
        m = g[f], (m.type === "link_open" || m.type === "link_close") && m.info === "auto" && (p -= m.nesting), m.type === "text" && p === 0 && t.test(m.content) && (_[d].children = g = r(
          g,
          f,
          l(m.content, m.level, u.Token)
        ));
    }
  };
}
function te(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
function oe(e) {
  let n = e.defs;
  e.enabled.length && (n = Object.keys(n).reduce((s, l) => (e.enabled.indexOf(l) >= 0 && (s[l] = n[l]), s), {}));
  const a = Object.keys(e.shortcuts).reduce((s, l) => n[l] ? Array.isArray(e.shortcuts[l]) ? (e.shortcuts[l].forEach((c) => {
    s[c] = l;
  }), s) : (s[e.shortcuts[l]] = l, s) : s, {}), t = Object.keys(n);
  let o;
  t.length === 0 ? o = "^$" : o = t.map((s) => `:${s}:`).concat(Object.keys(a)).sort().reverse().map((s) => te(s)).join("|");
  const r = RegExp(o), i = RegExp(o, "g");
  return {
    defs: n,
    shortcuts: a,
    scanRE: r,
    replaceRE: i
  };
}
function re(e, n) {
  const t = oe(Object.assign({}, {
    defs: {},
    shortcuts: {},
    enabled: []
  }, n || {}));
  e.renderer.rules.emoji = ne, e.core.ruler.after(
    "linkify",
    "emoji",
    ae(e, t.defs, t.shortcuts, t.scanRE, t.replaceRE)
  );
}
const ie = {
  100: "💯",
  1234: "🔢",
  grinning: "😀",
  smiley: "😃",
  smile: "😄",
  grin: "😁",
  laughing: "😆",
  satisfied: "😆",
  sweat_smile: "😅",
  rofl: "🤣",
  joy: "😂",
  slightly_smiling_face: "🙂",
  upside_down_face: "🙃",
  melting_face: "🫠",
  wink: "😉",
  blush: "😊",
  innocent: "😇",
  smiling_face_with_three_hearts: "🥰",
  heart_eyes: "😍",
  star_struck: "🤩",
  kissing_heart: "😘",
  kissing: "😗",
  relaxed: "☺️",
  kissing_closed_eyes: "😚",
  kissing_smiling_eyes: "😙",
  smiling_face_with_tear: "🥲",
  yum: "😋",
  stuck_out_tongue: "😛",
  stuck_out_tongue_winking_eye: "😜",
  zany_face: "🤪",
  stuck_out_tongue_closed_eyes: "😝",
  money_mouth_face: "🤑",
  hugs: "🤗",
  hand_over_mouth: "🤭",
  face_with_open_eyes_and_hand_over_mouth: "🫢",
  face_with_peeking_eye: "🫣",
  shushing_face: "🤫",
  thinking: "🤔",
  saluting_face: "🫡",
  zipper_mouth_face: "🤐",
  raised_eyebrow: "🤨",
  neutral_face: "😐",
  expressionless: "😑",
  no_mouth: "😶",
  dotted_line_face: "🫥",
  face_in_clouds: "😶‍🌫️",
  smirk: "😏",
  unamused: "😒",
  roll_eyes: "🙄",
  grimacing: "😬",
  face_exhaling: "😮‍💨",
  lying_face: "🤥",
  shaking_face: "🫨",
  relieved: "😌",
  pensive: "😔",
  sleepy: "😪",
  drooling_face: "🤤",
  sleeping: "😴",
  mask: "😷",
  face_with_thermometer: "🤒",
  face_with_head_bandage: "🤕",
  nauseated_face: "🤢",
  vomiting_face: "🤮",
  sneezing_face: "🤧",
  hot_face: "🥵",
  cold_face: "🥶",
  woozy_face: "🥴",
  dizzy_face: "😵",
  face_with_spiral_eyes: "😵‍💫",
  exploding_head: "🤯",
  cowboy_hat_face: "🤠",
  partying_face: "🥳",
  disguised_face: "🥸",
  sunglasses: "😎",
  nerd_face: "🤓",
  monocle_face: "🧐",
  confused: "😕",
  face_with_diagonal_mouth: "🫤",
  worried: "😟",
  slightly_frowning_face: "🙁",
  frowning_face: "☹️",
  open_mouth: "😮",
  hushed: "😯",
  astonished: "😲",
  flushed: "😳",
  pleading_face: "🥺",
  face_holding_back_tears: "🥹",
  frowning: "😦",
  anguished: "😧",
  fearful: "😨",
  cold_sweat: "😰",
  disappointed_relieved: "😥",
  cry: "😢",
  sob: "😭",
  scream: "😱",
  confounded: "😖",
  persevere: "😣",
  disappointed: "😞",
  sweat: "😓",
  weary: "😩",
  tired_face: "😫",
  yawning_face: "🥱",
  triumph: "😤",
  rage: "😡",
  pout: "😡",
  angry: "😠",
  cursing_face: "🤬",
  smiling_imp: "😈",
  imp: "👿",
  skull: "💀",
  skull_and_crossbones: "☠️",
  hankey: "💩",
  poop: "💩",
  shit: "💩",
  clown_face: "🤡",
  japanese_ogre: "👹",
  japanese_goblin: "👺",
  ghost: "👻",
  alien: "👽",
  space_invader: "👾",
  robot: "🤖",
  smiley_cat: "😺",
  smile_cat: "😸",
  joy_cat: "😹",
  heart_eyes_cat: "😻",
  smirk_cat: "😼",
  kissing_cat: "😽",
  scream_cat: "🙀",
  crying_cat_face: "😿",
  pouting_cat: "😾",
  see_no_evil: "🙈",
  hear_no_evil: "🙉",
  speak_no_evil: "🙊",
  love_letter: "💌",
  cupid: "💘",
  gift_heart: "💝",
  sparkling_heart: "💖",
  heartpulse: "💗",
  heartbeat: "💓",
  revolving_hearts: "💞",
  two_hearts: "💕",
  heart_decoration: "💟",
  heavy_heart_exclamation: "❣️",
  broken_heart: "💔",
  heart_on_fire: "❤️‍🔥",
  mending_heart: "❤️‍🩹",
  heart: "❤️",
  pink_heart: "🩷",
  orange_heart: "🧡",
  yellow_heart: "💛",
  green_heart: "💚",
  blue_heart: "💙",
  light_blue_heart: "🩵",
  purple_heart: "💜",
  brown_heart: "🤎",
  black_heart: "🖤",
  grey_heart: "🩶",
  white_heart: "🤍",
  kiss: "💋",
  anger: "💢",
  boom: "💥",
  collision: "💥",
  dizzy: "💫",
  sweat_drops: "💦",
  dash: "💨",
  hole: "🕳️",
  speech_balloon: "💬",
  eye_speech_bubble: "👁️‍🗨️",
  left_speech_bubble: "🗨️",
  right_anger_bubble: "🗯️",
  thought_balloon: "💭",
  zzz: "💤",
  wave: "👋",
  raised_back_of_hand: "🤚",
  raised_hand_with_fingers_splayed: "🖐️",
  hand: "✋",
  raised_hand: "✋",
  vulcan_salute: "🖖",
  rightwards_hand: "🫱",
  leftwards_hand: "🫲",
  palm_down_hand: "🫳",
  palm_up_hand: "🫴",
  leftwards_pushing_hand: "🫷",
  rightwards_pushing_hand: "🫸",
  ok_hand: "👌",
  pinched_fingers: "🤌",
  pinching_hand: "🤏",
  v: "✌️",
  crossed_fingers: "🤞",
  hand_with_index_finger_and_thumb_crossed: "🫰",
  love_you_gesture: "🤟",
  metal: "🤘",
  call_me_hand: "🤙",
  point_left: "👈",
  point_right: "👉",
  point_up_2: "👆",
  middle_finger: "🖕",
  fu: "🖕",
  point_down: "👇",
  point_up: "☝️",
  index_pointing_at_the_viewer: "🫵",
  "+1": "👍",
  thumbsup: "👍",
  "-1": "👎",
  thumbsdown: "👎",
  fist_raised: "✊",
  fist: "✊",
  fist_oncoming: "👊",
  facepunch: "👊",
  punch: "👊",
  fist_left: "🤛",
  fist_right: "🤜",
  clap: "👏",
  raised_hands: "🙌",
  heart_hands: "🫶",
  open_hands: "👐",
  palms_up_together: "🤲",
  handshake: "🤝",
  pray: "🙏",
  writing_hand: "✍️",
  nail_care: "💅",
  selfie: "🤳",
  muscle: "💪",
  mechanical_arm: "🦾",
  mechanical_leg: "🦿",
  leg: "🦵",
  foot: "🦶",
  ear: "👂",
  ear_with_hearing_aid: "🦻",
  nose: "👃",
  brain: "🧠",
  anatomical_heart: "🫀",
  lungs: "🫁",
  tooth: "🦷",
  bone: "🦴",
  eyes: "👀",
  eye: "👁️",
  tongue: "👅",
  lips: "👄",
  biting_lip: "🫦",
  baby: "👶",
  child: "🧒",
  boy: "👦",
  girl: "👧",
  adult: "🧑",
  blond_haired_person: "👱",
  man: "👨",
  bearded_person: "🧔",
  man_beard: "🧔‍♂️",
  woman_beard: "🧔‍♀️",
  red_haired_man: "👨‍🦰",
  curly_haired_man: "👨‍🦱",
  white_haired_man: "👨‍🦳",
  bald_man: "👨‍🦲",
  woman: "👩",
  red_haired_woman: "👩‍🦰",
  person_red_hair: "🧑‍🦰",
  curly_haired_woman: "👩‍🦱",
  person_curly_hair: "🧑‍🦱",
  white_haired_woman: "👩‍🦳",
  person_white_hair: "🧑‍🦳",
  bald_woman: "👩‍🦲",
  person_bald: "🧑‍🦲",
  blond_haired_woman: "👱‍♀️",
  blonde_woman: "👱‍♀️",
  blond_haired_man: "👱‍♂️",
  older_adult: "🧓",
  older_man: "👴",
  older_woman: "👵",
  frowning_person: "🙍",
  frowning_man: "🙍‍♂️",
  frowning_woman: "🙍‍♀️",
  pouting_face: "🙎",
  pouting_man: "🙎‍♂️",
  pouting_woman: "🙎‍♀️",
  no_good: "🙅",
  no_good_man: "🙅‍♂️",
  ng_man: "🙅‍♂️",
  no_good_woman: "🙅‍♀️",
  ng_woman: "🙅‍♀️",
  ok_person: "🙆",
  ok_man: "🙆‍♂️",
  ok_woman: "🙆‍♀️",
  tipping_hand_person: "💁",
  information_desk_person: "💁",
  tipping_hand_man: "💁‍♂️",
  sassy_man: "💁‍♂️",
  tipping_hand_woman: "💁‍♀️",
  sassy_woman: "💁‍♀️",
  raising_hand: "🙋",
  raising_hand_man: "🙋‍♂️",
  raising_hand_woman: "🙋‍♀️",
  deaf_person: "🧏",
  deaf_man: "🧏‍♂️",
  deaf_woman: "🧏‍♀️",
  bow: "🙇",
  bowing_man: "🙇‍♂️",
  bowing_woman: "🙇‍♀️",
  facepalm: "🤦",
  man_facepalming: "🤦‍♂️",
  woman_facepalming: "🤦‍♀️",
  shrug: "🤷",
  man_shrugging: "🤷‍♂️",
  woman_shrugging: "🤷‍♀️",
  health_worker: "🧑‍⚕️",
  man_health_worker: "👨‍⚕️",
  woman_health_worker: "👩‍⚕️",
  student: "🧑‍🎓",
  man_student: "👨‍🎓",
  woman_student: "👩‍🎓",
  teacher: "🧑‍🏫",
  man_teacher: "👨‍🏫",
  woman_teacher: "👩‍🏫",
  judge: "🧑‍⚖️",
  man_judge: "👨‍⚖️",
  woman_judge: "👩‍⚖️",
  farmer: "🧑‍🌾",
  man_farmer: "👨‍🌾",
  woman_farmer: "👩‍🌾",
  cook: "🧑‍🍳",
  man_cook: "👨‍🍳",
  woman_cook: "👩‍🍳",
  mechanic: "🧑‍🔧",
  man_mechanic: "👨‍🔧",
  woman_mechanic: "👩‍🔧",
  factory_worker: "🧑‍🏭",
  man_factory_worker: "👨‍🏭",
  woman_factory_worker: "👩‍🏭",
  office_worker: "🧑‍💼",
  man_office_worker: "👨‍💼",
  woman_office_worker: "👩‍💼",
  scientist: "🧑‍🔬",
  man_scientist: "👨‍🔬",
  woman_scientist: "👩‍🔬",
  technologist: "🧑‍💻",
  man_technologist: "👨‍💻",
  woman_technologist: "👩‍💻",
  singer: "🧑‍🎤",
  man_singer: "👨‍🎤",
  woman_singer: "👩‍🎤",
  artist: "🧑‍🎨",
  man_artist: "👨‍🎨",
  woman_artist: "👩‍🎨",
  pilot: "🧑‍✈️",
  man_pilot: "👨‍✈️",
  woman_pilot: "👩‍✈️",
  astronaut: "🧑‍🚀",
  man_astronaut: "👨‍🚀",
  woman_astronaut: "👩‍🚀",
  firefighter: "🧑‍🚒",
  man_firefighter: "👨‍🚒",
  woman_firefighter: "👩‍🚒",
  police_officer: "👮",
  cop: "👮",
  policeman: "👮‍♂️",
  policewoman: "👮‍♀️",
  detective: "🕵️",
  male_detective: "🕵️‍♂️",
  female_detective: "🕵️‍♀️",
  guard: "💂",
  guardsman: "💂‍♂️",
  guardswoman: "💂‍♀️",
  ninja: "🥷",
  construction_worker: "👷",
  construction_worker_man: "👷‍♂️",
  construction_worker_woman: "👷‍♀️",
  person_with_crown: "🫅",
  prince: "🤴",
  princess: "👸",
  person_with_turban: "👳",
  man_with_turban: "👳‍♂️",
  woman_with_turban: "👳‍♀️",
  man_with_gua_pi_mao: "👲",
  woman_with_headscarf: "🧕",
  person_in_tuxedo: "🤵",
  man_in_tuxedo: "🤵‍♂️",
  woman_in_tuxedo: "🤵‍♀️",
  person_with_veil: "👰",
  man_with_veil: "👰‍♂️",
  woman_with_veil: "👰‍♀️",
  bride_with_veil: "👰‍♀️",
  pregnant_woman: "🤰",
  pregnant_man: "🫃",
  pregnant_person: "🫄",
  breast_feeding: "🤱",
  woman_feeding_baby: "👩‍🍼",
  man_feeding_baby: "👨‍🍼",
  person_feeding_baby: "🧑‍🍼",
  angel: "👼",
  santa: "🎅",
  mrs_claus: "🤶",
  mx_claus: "🧑‍🎄",
  superhero: "🦸",
  superhero_man: "🦸‍♂️",
  superhero_woman: "🦸‍♀️",
  supervillain: "🦹",
  supervillain_man: "🦹‍♂️",
  supervillain_woman: "🦹‍♀️",
  mage: "🧙",
  mage_man: "🧙‍♂️",
  mage_woman: "🧙‍♀️",
  fairy: "🧚",
  fairy_man: "🧚‍♂️",
  fairy_woman: "🧚‍♀️",
  vampire: "🧛",
  vampire_man: "🧛‍♂️",
  vampire_woman: "🧛‍♀️",
  merperson: "🧜",
  merman: "🧜‍♂️",
  mermaid: "🧜‍♀️",
  elf: "🧝",
  elf_man: "🧝‍♂️",
  elf_woman: "🧝‍♀️",
  genie: "🧞",
  genie_man: "🧞‍♂️",
  genie_woman: "🧞‍♀️",
  zombie: "🧟",
  zombie_man: "🧟‍♂️",
  zombie_woman: "🧟‍♀️",
  troll: "🧌",
  massage: "💆",
  massage_man: "💆‍♂️",
  massage_woman: "💆‍♀️",
  haircut: "💇",
  haircut_man: "💇‍♂️",
  haircut_woman: "💇‍♀️",
  walking: "🚶",
  walking_man: "🚶‍♂️",
  walking_woman: "🚶‍♀️",
  standing_person: "🧍",
  standing_man: "🧍‍♂️",
  standing_woman: "🧍‍♀️",
  kneeling_person: "🧎",
  kneeling_man: "🧎‍♂️",
  kneeling_woman: "🧎‍♀️",
  person_with_probing_cane: "🧑‍🦯",
  man_with_probing_cane: "👨‍🦯",
  woman_with_probing_cane: "👩‍🦯",
  person_in_motorized_wheelchair: "🧑‍🦼",
  man_in_motorized_wheelchair: "👨‍🦼",
  woman_in_motorized_wheelchair: "👩‍🦼",
  person_in_manual_wheelchair: "🧑‍🦽",
  man_in_manual_wheelchair: "👨‍🦽",
  woman_in_manual_wheelchair: "👩‍🦽",
  runner: "🏃",
  running: "🏃",
  running_man: "🏃‍♂️",
  running_woman: "🏃‍♀️",
  woman_dancing: "💃",
  dancer: "💃",
  man_dancing: "🕺",
  business_suit_levitating: "🕴️",
  dancers: "👯",
  dancing_men: "👯‍♂️",
  dancing_women: "👯‍♀️",
  sauna_person: "🧖",
  sauna_man: "🧖‍♂️",
  sauna_woman: "🧖‍♀️",
  climbing: "🧗",
  climbing_man: "🧗‍♂️",
  climbing_woman: "🧗‍♀️",
  person_fencing: "🤺",
  horse_racing: "🏇",
  skier: "⛷️",
  snowboarder: "🏂",
  golfing: "🏌️",
  golfing_man: "🏌️‍♂️",
  golfing_woman: "🏌️‍♀️",
  surfer: "🏄",
  surfing_man: "🏄‍♂️",
  surfing_woman: "🏄‍♀️",
  rowboat: "🚣",
  rowing_man: "🚣‍♂️",
  rowing_woman: "🚣‍♀️",
  swimmer: "🏊",
  swimming_man: "🏊‍♂️",
  swimming_woman: "🏊‍♀️",
  bouncing_ball_person: "⛹️",
  bouncing_ball_man: "⛹️‍♂️",
  basketball_man: "⛹️‍♂️",
  bouncing_ball_woman: "⛹️‍♀️",
  basketball_woman: "⛹️‍♀️",
  weight_lifting: "🏋️",
  weight_lifting_man: "🏋️‍♂️",
  weight_lifting_woman: "🏋️‍♀️",
  bicyclist: "🚴",
  biking_man: "🚴‍♂️",
  biking_woman: "🚴‍♀️",
  mountain_bicyclist: "🚵",
  mountain_biking_man: "🚵‍♂️",
  mountain_biking_woman: "🚵‍♀️",
  cartwheeling: "🤸",
  man_cartwheeling: "🤸‍♂️",
  woman_cartwheeling: "🤸‍♀️",
  wrestling: "🤼",
  men_wrestling: "🤼‍♂️",
  women_wrestling: "🤼‍♀️",
  water_polo: "🤽",
  man_playing_water_polo: "🤽‍♂️",
  woman_playing_water_polo: "🤽‍♀️",
  handball_person: "🤾",
  man_playing_handball: "🤾‍♂️",
  woman_playing_handball: "🤾‍♀️",
  juggling_person: "🤹",
  man_juggling: "🤹‍♂️",
  woman_juggling: "🤹‍♀️",
  lotus_position: "🧘",
  lotus_position_man: "🧘‍♂️",
  lotus_position_woman: "🧘‍♀️",
  bath: "🛀",
  sleeping_bed: "🛌",
  people_holding_hands: "🧑‍🤝‍🧑",
  two_women_holding_hands: "👭",
  couple: "👫",
  two_men_holding_hands: "👬",
  couplekiss: "💏",
  couplekiss_man_woman: "👩‍❤️‍💋‍👨",
  couplekiss_man_man: "👨‍❤️‍💋‍👨",
  couplekiss_woman_woman: "👩‍❤️‍💋‍👩",
  couple_with_heart: "💑",
  couple_with_heart_woman_man: "👩‍❤️‍👨",
  couple_with_heart_man_man: "👨‍❤️‍👨",
  couple_with_heart_woman_woman: "👩‍❤️‍👩",
  family: "👪",
  family_man_woman_boy: "👨‍👩‍👦",
  family_man_woman_girl: "👨‍👩‍👧",
  family_man_woman_girl_boy: "👨‍👩‍👧‍👦",
  family_man_woman_boy_boy: "👨‍👩‍👦‍👦",
  family_man_woman_girl_girl: "👨‍👩‍👧‍👧",
  family_man_man_boy: "👨‍👨‍👦",
  family_man_man_girl: "👨‍👨‍👧",
  family_man_man_girl_boy: "👨‍👨‍👧‍👦",
  family_man_man_boy_boy: "👨‍👨‍👦‍👦",
  family_man_man_girl_girl: "👨‍👨‍👧‍👧",
  family_woman_woman_boy: "👩‍👩‍👦",
  family_woman_woman_girl: "👩‍👩‍👧",
  family_woman_woman_girl_boy: "👩‍👩‍👧‍👦",
  family_woman_woman_boy_boy: "👩‍👩‍👦‍👦",
  family_woman_woman_girl_girl: "👩‍👩‍👧‍👧",
  family_man_boy: "👨‍👦",
  family_man_boy_boy: "👨‍👦‍👦",
  family_man_girl: "👨‍👧",
  family_man_girl_boy: "👨‍👧‍👦",
  family_man_girl_girl: "👨‍👧‍👧",
  family_woman_boy: "👩‍👦",
  family_woman_boy_boy: "👩‍👦‍👦",
  family_woman_girl: "👩‍👧",
  family_woman_girl_boy: "👩‍👧‍👦",
  family_woman_girl_girl: "👩‍👧‍👧",
  speaking_head: "🗣️",
  bust_in_silhouette: "👤",
  busts_in_silhouette: "👥",
  people_hugging: "🫂",
  footprints: "👣",
  monkey_face: "🐵",
  monkey: "🐒",
  gorilla: "🦍",
  orangutan: "🦧",
  dog: "🐶",
  dog2: "🐕",
  guide_dog: "🦮",
  service_dog: "🐕‍🦺",
  poodle: "🐩",
  wolf: "🐺",
  fox_face: "🦊",
  raccoon: "🦝",
  cat: "🐱",
  cat2: "🐈",
  black_cat: "🐈‍⬛",
  lion: "🦁",
  tiger: "🐯",
  tiger2: "🐅",
  leopard: "🐆",
  horse: "🐴",
  moose: "🫎",
  donkey: "🫏",
  racehorse: "🐎",
  unicorn: "🦄",
  zebra: "🦓",
  deer: "🦌",
  bison: "🦬",
  cow: "🐮",
  ox: "🐂",
  water_buffalo: "🐃",
  cow2: "🐄",
  pig: "🐷",
  pig2: "🐖",
  boar: "🐗",
  pig_nose: "🐽",
  ram: "🐏",
  sheep: "🐑",
  goat: "🐐",
  dromedary_camel: "🐪",
  camel: "🐫",
  llama: "🦙",
  giraffe: "🦒",
  elephant: "🐘",
  mammoth: "🦣",
  rhinoceros: "🦏",
  hippopotamus: "🦛",
  mouse: "🐭",
  mouse2: "🐁",
  rat: "🐀",
  hamster: "🐹",
  rabbit: "🐰",
  rabbit2: "🐇",
  chipmunk: "🐿️",
  beaver: "🦫",
  hedgehog: "🦔",
  bat: "🦇",
  bear: "🐻",
  polar_bear: "🐻‍❄️",
  koala: "🐨",
  panda_face: "🐼",
  sloth: "🦥",
  otter: "🦦",
  skunk: "🦨",
  kangaroo: "🦘",
  badger: "🦡",
  feet: "🐾",
  paw_prints: "🐾",
  turkey: "🦃",
  chicken: "🐔",
  rooster: "🐓",
  hatching_chick: "🐣",
  baby_chick: "🐤",
  hatched_chick: "🐥",
  bird: "🐦",
  penguin: "🐧",
  dove: "🕊️",
  eagle: "🦅",
  duck: "🦆",
  swan: "🦢",
  owl: "🦉",
  dodo: "🦤",
  feather: "🪶",
  flamingo: "🦩",
  peacock: "🦚",
  parrot: "🦜",
  wing: "🪽",
  black_bird: "🐦‍⬛",
  goose: "🪿",
  frog: "🐸",
  crocodile: "🐊",
  turtle: "🐢",
  lizard: "🦎",
  snake: "🐍",
  dragon_face: "🐲",
  dragon: "🐉",
  sauropod: "🦕",
  "t-rex": "🦖",
  whale: "🐳",
  whale2: "🐋",
  dolphin: "🐬",
  flipper: "🐬",
  seal: "🦭",
  fish: "🐟",
  tropical_fish: "🐠",
  blowfish: "🐡",
  shark: "🦈",
  octopus: "🐙",
  shell: "🐚",
  coral: "🪸",
  jellyfish: "🪼",
  snail: "🐌",
  butterfly: "🦋",
  bug: "🐛",
  ant: "🐜",
  bee: "🐝",
  honeybee: "🐝",
  beetle: "🪲",
  lady_beetle: "🐞",
  cricket: "🦗",
  cockroach: "🪳",
  spider: "🕷️",
  spider_web: "🕸️",
  scorpion: "🦂",
  mosquito: "🦟",
  fly: "🪰",
  worm: "🪱",
  microbe: "🦠",
  bouquet: "💐",
  cherry_blossom: "🌸",
  white_flower: "💮",
  lotus: "🪷",
  rosette: "🏵️",
  rose: "🌹",
  wilted_flower: "🥀",
  hibiscus: "🌺",
  sunflower: "🌻",
  blossom: "🌼",
  tulip: "🌷",
  hyacinth: "🪻",
  seedling: "🌱",
  potted_plant: "🪴",
  evergreen_tree: "🌲",
  deciduous_tree: "🌳",
  palm_tree: "🌴",
  cactus: "🌵",
  ear_of_rice: "🌾",
  herb: "🌿",
  shamrock: "☘️",
  four_leaf_clover: "🍀",
  maple_leaf: "🍁",
  fallen_leaf: "🍂",
  leaves: "🍃",
  empty_nest: "🪹",
  nest_with_eggs: "🪺",
  mushroom: "🍄",
  grapes: "🍇",
  melon: "🍈",
  watermelon: "🍉",
  tangerine: "🍊",
  orange: "🍊",
  mandarin: "🍊",
  lemon: "🍋",
  banana: "🍌",
  pineapple: "🍍",
  mango: "🥭",
  apple: "🍎",
  green_apple: "🍏",
  pear: "🍐",
  peach: "🍑",
  cherries: "🍒",
  strawberry: "🍓",
  blueberries: "🫐",
  kiwi_fruit: "🥝",
  tomato: "🍅",
  olive: "🫒",
  coconut: "🥥",
  avocado: "🥑",
  eggplant: "🍆",
  potato: "🥔",
  carrot: "🥕",
  corn: "🌽",
  hot_pepper: "🌶️",
  bell_pepper: "🫑",
  cucumber: "🥒",
  leafy_green: "🥬",
  broccoli: "🥦",
  garlic: "🧄",
  onion: "🧅",
  peanuts: "🥜",
  beans: "🫘",
  chestnut: "🌰",
  ginger_root: "🫚",
  pea_pod: "🫛",
  bread: "🍞",
  croissant: "🥐",
  baguette_bread: "🥖",
  flatbread: "🫓",
  pretzel: "🥨",
  bagel: "🥯",
  pancakes: "🥞",
  waffle: "🧇",
  cheese: "🧀",
  meat_on_bone: "🍖",
  poultry_leg: "🍗",
  cut_of_meat: "🥩",
  bacon: "🥓",
  hamburger: "🍔",
  fries: "🍟",
  pizza: "🍕",
  hotdog: "🌭",
  sandwich: "🥪",
  taco: "🌮",
  burrito: "🌯",
  tamale: "🫔",
  stuffed_flatbread: "🥙",
  falafel: "🧆",
  egg: "🥚",
  fried_egg: "🍳",
  shallow_pan_of_food: "🥘",
  stew: "🍲",
  fondue: "🫕",
  bowl_with_spoon: "🥣",
  green_salad: "🥗",
  popcorn: "🍿",
  butter: "🧈",
  salt: "🧂",
  canned_food: "🥫",
  bento: "🍱",
  rice_cracker: "🍘",
  rice_ball: "🍙",
  rice: "🍚",
  curry: "🍛",
  ramen: "🍜",
  spaghetti: "🍝",
  sweet_potato: "🍠",
  oden: "🍢",
  sushi: "🍣",
  fried_shrimp: "🍤",
  fish_cake: "🍥",
  moon_cake: "🥮",
  dango: "🍡",
  dumpling: "🥟",
  fortune_cookie: "🥠",
  takeout_box: "🥡",
  crab: "🦀",
  lobster: "🦞",
  shrimp: "🦐",
  squid: "🦑",
  oyster: "🦪",
  icecream: "🍦",
  shaved_ice: "🍧",
  ice_cream: "🍨",
  doughnut: "🍩",
  cookie: "🍪",
  birthday: "🎂",
  cake: "🍰",
  cupcake: "🧁",
  pie: "🥧",
  chocolate_bar: "🍫",
  candy: "🍬",
  lollipop: "🍭",
  custard: "🍮",
  honey_pot: "🍯",
  baby_bottle: "🍼",
  milk_glass: "🥛",
  coffee: "☕",
  teapot: "🫖",
  tea: "🍵",
  sake: "🍶",
  champagne: "🍾",
  wine_glass: "🍷",
  cocktail: "🍸",
  tropical_drink: "🍹",
  beer: "🍺",
  beers: "🍻",
  clinking_glasses: "🥂",
  tumbler_glass: "🥃",
  pouring_liquid: "🫗",
  cup_with_straw: "🥤",
  bubble_tea: "🧋",
  beverage_box: "🧃",
  mate: "🧉",
  ice_cube: "🧊",
  chopsticks: "🥢",
  plate_with_cutlery: "🍽️",
  fork_and_knife: "🍴",
  spoon: "🥄",
  hocho: "🔪",
  knife: "🔪",
  jar: "🫙",
  amphora: "🏺",
  earth_africa: "🌍",
  earth_americas: "🌎",
  earth_asia: "🌏",
  globe_with_meridians: "🌐",
  world_map: "🗺️",
  japan: "🗾",
  compass: "🧭",
  mountain_snow: "🏔️",
  mountain: "⛰️",
  volcano: "🌋",
  mount_fuji: "🗻",
  camping: "🏕️",
  beach_umbrella: "🏖️",
  desert: "🏜️",
  desert_island: "🏝️",
  national_park: "🏞️",
  stadium: "🏟️",
  classical_building: "🏛️",
  building_construction: "🏗️",
  bricks: "🧱",
  rock: "🪨",
  wood: "🪵",
  hut: "🛖",
  houses: "🏘️",
  derelict_house: "🏚️",
  house: "🏠",
  house_with_garden: "🏡",
  office: "🏢",
  post_office: "🏣",
  european_post_office: "🏤",
  hospital: "🏥",
  bank: "🏦",
  hotel: "🏨",
  love_hotel: "🏩",
  convenience_store: "🏪",
  school: "🏫",
  department_store: "🏬",
  factory: "🏭",
  japanese_castle: "🏯",
  european_castle: "🏰",
  wedding: "💒",
  tokyo_tower: "🗼",
  statue_of_liberty: "🗽",
  church: "⛪",
  mosque: "🕌",
  hindu_temple: "🛕",
  synagogue: "🕍",
  shinto_shrine: "⛩️",
  kaaba: "🕋",
  fountain: "⛲",
  tent: "⛺",
  foggy: "🌁",
  night_with_stars: "🌃",
  cityscape: "🏙️",
  sunrise_over_mountains: "🌄",
  sunrise: "🌅",
  city_sunset: "🌆",
  city_sunrise: "🌇",
  bridge_at_night: "🌉",
  hotsprings: "♨️",
  carousel_horse: "🎠",
  playground_slide: "🛝",
  ferris_wheel: "🎡",
  roller_coaster: "🎢",
  barber: "💈",
  circus_tent: "🎪",
  steam_locomotive: "🚂",
  railway_car: "🚃",
  bullettrain_side: "🚄",
  bullettrain_front: "🚅",
  train2: "🚆",
  metro: "🚇",
  light_rail: "🚈",
  station: "🚉",
  tram: "🚊",
  monorail: "🚝",
  mountain_railway: "🚞",
  train: "🚋",
  bus: "🚌",
  oncoming_bus: "🚍",
  trolleybus: "🚎",
  minibus: "🚐",
  ambulance: "🚑",
  fire_engine: "🚒",
  police_car: "🚓",
  oncoming_police_car: "🚔",
  taxi: "🚕",
  oncoming_taxi: "🚖",
  car: "🚗",
  red_car: "🚗",
  oncoming_automobile: "🚘",
  blue_car: "🚙",
  pickup_truck: "🛻",
  truck: "🚚",
  articulated_lorry: "🚛",
  tractor: "🚜",
  racing_car: "🏎️",
  motorcycle: "🏍️",
  motor_scooter: "🛵",
  manual_wheelchair: "🦽",
  motorized_wheelchair: "🦼",
  auto_rickshaw: "🛺",
  bike: "🚲",
  kick_scooter: "🛴",
  skateboard: "🛹",
  roller_skate: "🛼",
  busstop: "🚏",
  motorway: "🛣️",
  railway_track: "🛤️",
  oil_drum: "🛢️",
  fuelpump: "⛽",
  wheel: "🛞",
  rotating_light: "🚨",
  traffic_light: "🚥",
  vertical_traffic_light: "🚦",
  stop_sign: "🛑",
  construction: "🚧",
  anchor: "⚓",
  ring_buoy: "🛟",
  boat: "⛵",
  sailboat: "⛵",
  canoe: "🛶",
  speedboat: "🚤",
  passenger_ship: "🛳️",
  ferry: "⛴️",
  motor_boat: "🛥️",
  ship: "🚢",
  airplane: "✈️",
  small_airplane: "🛩️",
  flight_departure: "🛫",
  flight_arrival: "🛬",
  parachute: "🪂",
  seat: "💺",
  helicopter: "🚁",
  suspension_railway: "🚟",
  mountain_cableway: "🚠",
  aerial_tramway: "🚡",
  artificial_satellite: "🛰️",
  rocket: "🚀",
  flying_saucer: "🛸",
  bellhop_bell: "🛎️",
  luggage: "🧳",
  hourglass: "⌛",
  hourglass_flowing_sand: "⏳",
  watch: "⌚",
  alarm_clock: "⏰",
  stopwatch: "⏱️",
  timer_clock: "⏲️",
  mantelpiece_clock: "🕰️",
  clock12: "🕛",
  clock1230: "🕧",
  clock1: "🕐",
  clock130: "🕜",
  clock2: "🕑",
  clock230: "🕝",
  clock3: "🕒",
  clock330: "🕞",
  clock4: "🕓",
  clock430: "🕟",
  clock5: "🕔",
  clock530: "🕠",
  clock6: "🕕",
  clock630: "🕡",
  clock7: "🕖",
  clock730: "🕢",
  clock8: "🕗",
  clock830: "🕣",
  clock9: "🕘",
  clock930: "🕤",
  clock10: "🕙",
  clock1030: "🕥",
  clock11: "🕚",
  clock1130: "🕦",
  new_moon: "🌑",
  waxing_crescent_moon: "🌒",
  first_quarter_moon: "🌓",
  moon: "🌔",
  waxing_gibbous_moon: "🌔",
  full_moon: "🌕",
  waning_gibbous_moon: "🌖",
  last_quarter_moon: "🌗",
  waning_crescent_moon: "🌘",
  crescent_moon: "🌙",
  new_moon_with_face: "🌚",
  first_quarter_moon_with_face: "🌛",
  last_quarter_moon_with_face: "🌜",
  thermometer: "🌡️",
  sunny: "☀️",
  full_moon_with_face: "🌝",
  sun_with_face: "🌞",
  ringed_planet: "🪐",
  star: "⭐",
  star2: "🌟",
  stars: "🌠",
  milky_way: "🌌",
  cloud: "☁️",
  partly_sunny: "⛅",
  cloud_with_lightning_and_rain: "⛈️",
  sun_behind_small_cloud: "🌤️",
  sun_behind_large_cloud: "🌥️",
  sun_behind_rain_cloud: "🌦️",
  cloud_with_rain: "🌧️",
  cloud_with_snow: "🌨️",
  cloud_with_lightning: "🌩️",
  tornado: "🌪️",
  fog: "🌫️",
  wind_face: "🌬️",
  cyclone: "🌀",
  rainbow: "🌈",
  closed_umbrella: "🌂",
  open_umbrella: "☂️",
  umbrella: "☔",
  parasol_on_ground: "⛱️",
  zap: "⚡",
  snowflake: "❄️",
  snowman_with_snow: "☃️",
  snowman: "⛄",
  comet: "☄️",
  fire: "🔥",
  droplet: "💧",
  ocean: "🌊",
  jack_o_lantern: "🎃",
  christmas_tree: "🎄",
  fireworks: "🎆",
  sparkler: "🎇",
  firecracker: "🧨",
  sparkles: "✨",
  balloon: "🎈",
  tada: "🎉",
  confetti_ball: "🎊",
  tanabata_tree: "🎋",
  bamboo: "🎍",
  dolls: "🎎",
  flags: "🎏",
  wind_chime: "🎐",
  rice_scene: "🎑",
  red_envelope: "🧧",
  ribbon: "🎀",
  gift: "🎁",
  reminder_ribbon: "🎗️",
  tickets: "🎟️",
  ticket: "🎫",
  medal_military: "🎖️",
  trophy: "🏆",
  medal_sports: "🏅",
  "1st_place_medal": "🥇",
  "2nd_place_medal": "🥈",
  "3rd_place_medal": "🥉",
  soccer: "⚽",
  baseball: "⚾",
  softball: "🥎",
  basketball: "🏀",
  volleyball: "🏐",
  football: "🏈",
  rugby_football: "🏉",
  tennis: "🎾",
  flying_disc: "🥏",
  bowling: "🎳",
  cricket_game: "🏏",
  field_hockey: "🏑",
  ice_hockey: "🏒",
  lacrosse: "🥍",
  ping_pong: "🏓",
  badminton: "🏸",
  boxing_glove: "🥊",
  martial_arts_uniform: "🥋",
  goal_net: "🥅",
  golf: "⛳",
  ice_skate: "⛸️",
  fishing_pole_and_fish: "🎣",
  diving_mask: "🤿",
  running_shirt_with_sash: "🎽",
  ski: "🎿",
  sled: "🛷",
  curling_stone: "🥌",
  dart: "🎯",
  yo_yo: "🪀",
  kite: "🪁",
  gun: "🔫",
  "8ball": "🎱",
  crystal_ball: "🔮",
  magic_wand: "🪄",
  video_game: "🎮",
  joystick: "🕹️",
  slot_machine: "🎰",
  game_die: "🎲",
  jigsaw: "🧩",
  teddy_bear: "🧸",
  pinata: "🪅",
  mirror_ball: "🪩",
  nesting_dolls: "🪆",
  spades: "♠️",
  hearts: "♥️",
  diamonds: "♦️",
  clubs: "♣️",
  chess_pawn: "♟️",
  black_joker: "🃏",
  mahjong: "🀄",
  flower_playing_cards: "🎴",
  performing_arts: "🎭",
  framed_picture: "🖼️",
  art: "🎨",
  thread: "🧵",
  sewing_needle: "🪡",
  yarn: "🧶",
  knot: "🪢",
  eyeglasses: "👓",
  dark_sunglasses: "🕶️",
  goggles: "🥽",
  lab_coat: "🥼",
  safety_vest: "🦺",
  necktie: "👔",
  shirt: "👕",
  tshirt: "👕",
  jeans: "👖",
  scarf: "🧣",
  gloves: "🧤",
  coat: "🧥",
  socks: "🧦",
  dress: "👗",
  kimono: "👘",
  sari: "🥻",
  one_piece_swimsuit: "🩱",
  swim_brief: "🩲",
  shorts: "🩳",
  bikini: "👙",
  womans_clothes: "👚",
  folding_hand_fan: "🪭",
  purse: "👛",
  handbag: "👜",
  pouch: "👝",
  shopping: "🛍️",
  school_satchel: "🎒",
  thong_sandal: "🩴",
  mans_shoe: "👞",
  shoe: "👞",
  athletic_shoe: "👟",
  hiking_boot: "🥾",
  flat_shoe: "🥿",
  high_heel: "👠",
  sandal: "👡",
  ballet_shoes: "🩰",
  boot: "👢",
  hair_pick: "🪮",
  crown: "👑",
  womans_hat: "👒",
  tophat: "🎩",
  mortar_board: "🎓",
  billed_cap: "🧢",
  military_helmet: "🪖",
  rescue_worker_helmet: "⛑️",
  prayer_beads: "📿",
  lipstick: "💄",
  ring: "💍",
  gem: "💎",
  mute: "🔇",
  speaker: "🔈",
  sound: "🔉",
  loud_sound: "🔊",
  loudspeaker: "📢",
  mega: "📣",
  postal_horn: "📯",
  bell: "🔔",
  no_bell: "🔕",
  musical_score: "🎼",
  musical_note: "🎵",
  notes: "🎶",
  studio_microphone: "🎙️",
  level_slider: "🎚️",
  control_knobs: "🎛️",
  microphone: "🎤",
  headphones: "🎧",
  radio: "📻",
  saxophone: "🎷",
  accordion: "🪗",
  guitar: "🎸",
  musical_keyboard: "🎹",
  trumpet: "🎺",
  violin: "🎻",
  banjo: "🪕",
  drum: "🥁",
  long_drum: "🪘",
  maracas: "🪇",
  flute: "🪈",
  iphone: "📱",
  calling: "📲",
  phone: "☎️",
  telephone: "☎️",
  telephone_receiver: "📞",
  pager: "📟",
  fax: "📠",
  battery: "🔋",
  low_battery: "🪫",
  electric_plug: "🔌",
  computer: "💻",
  desktop_computer: "🖥️",
  printer: "🖨️",
  keyboard: "⌨️",
  computer_mouse: "🖱️",
  trackball: "🖲️",
  minidisc: "💽",
  floppy_disk: "💾",
  cd: "💿",
  dvd: "📀",
  abacus: "🧮",
  movie_camera: "🎥",
  film_strip: "🎞️",
  film_projector: "📽️",
  clapper: "🎬",
  tv: "📺",
  camera: "📷",
  camera_flash: "📸",
  video_camera: "📹",
  vhs: "📼",
  mag: "🔍",
  mag_right: "🔎",
  candle: "🕯️",
  bulb: "💡",
  flashlight: "🔦",
  izakaya_lantern: "🏮",
  lantern: "🏮",
  diya_lamp: "🪔",
  notebook_with_decorative_cover: "📔",
  closed_book: "📕",
  book: "📖",
  open_book: "📖",
  green_book: "📗",
  blue_book: "📘",
  orange_book: "📙",
  books: "📚",
  notebook: "📓",
  ledger: "📒",
  page_with_curl: "📃",
  scroll: "📜",
  page_facing_up: "📄",
  newspaper: "📰",
  newspaper_roll: "🗞️",
  bookmark_tabs: "📑",
  bookmark: "🔖",
  label: "🏷️",
  moneybag: "💰",
  coin: "🪙",
  yen: "💴",
  dollar: "💵",
  euro: "💶",
  pound: "💷",
  money_with_wings: "💸",
  credit_card: "💳",
  receipt: "🧾",
  chart: "💹",
  envelope: "✉️",
  email: "📧",
  "e-mail": "📧",
  incoming_envelope: "📨",
  envelope_with_arrow: "📩",
  outbox_tray: "📤",
  inbox_tray: "📥",
  package: "📦",
  mailbox: "📫",
  mailbox_closed: "📪",
  mailbox_with_mail: "📬",
  mailbox_with_no_mail: "📭",
  postbox: "📮",
  ballot_box: "🗳️",
  pencil2: "✏️",
  black_nib: "✒️",
  fountain_pen: "🖋️",
  pen: "🖊️",
  paintbrush: "🖌️",
  crayon: "🖍️",
  memo: "📝",
  pencil: "📝",
  briefcase: "💼",
  file_folder: "📁",
  open_file_folder: "📂",
  card_index_dividers: "🗂️",
  date: "📅",
  calendar: "📆",
  spiral_notepad: "🗒️",
  spiral_calendar: "🗓️",
  card_index: "📇",
  chart_with_upwards_trend: "📈",
  chart_with_downwards_trend: "📉",
  bar_chart: "📊",
  clipboard: "📋",
  pushpin: "📌",
  round_pushpin: "📍",
  paperclip: "📎",
  paperclips: "🖇️",
  straight_ruler: "📏",
  triangular_ruler: "📐",
  scissors: "✂️",
  card_file_box: "🗃️",
  file_cabinet: "🗄️",
  wastebasket: "🗑️",
  lock: "🔒",
  unlock: "🔓",
  lock_with_ink_pen: "🔏",
  closed_lock_with_key: "🔐",
  key: "🔑",
  old_key: "🗝️",
  hammer: "🔨",
  axe: "🪓",
  pick: "⛏️",
  hammer_and_pick: "⚒️",
  hammer_and_wrench: "🛠️",
  dagger: "🗡️",
  crossed_swords: "⚔️",
  bomb: "💣",
  boomerang: "🪃",
  bow_and_arrow: "🏹",
  shield: "🛡️",
  carpentry_saw: "🪚",
  wrench: "🔧",
  screwdriver: "🪛",
  nut_and_bolt: "🔩",
  gear: "⚙️",
  clamp: "🗜️",
  balance_scale: "⚖️",
  probing_cane: "🦯",
  link: "🔗",
  chains: "⛓️",
  hook: "🪝",
  toolbox: "🧰",
  magnet: "🧲",
  ladder: "🪜",
  alembic: "⚗️",
  test_tube: "🧪",
  petri_dish: "🧫",
  dna: "🧬",
  microscope: "🔬",
  telescope: "🔭",
  satellite: "📡",
  syringe: "💉",
  drop_of_blood: "🩸",
  pill: "💊",
  adhesive_bandage: "🩹",
  crutch: "🩼",
  stethoscope: "🩺",
  x_ray: "🩻",
  door: "🚪",
  elevator: "🛗",
  mirror: "🪞",
  window: "🪟",
  bed: "🛏️",
  couch_and_lamp: "🛋️",
  chair: "🪑",
  toilet: "🚽",
  plunger: "🪠",
  shower: "🚿",
  bathtub: "🛁",
  mouse_trap: "🪤",
  razor: "🪒",
  lotion_bottle: "🧴",
  safety_pin: "🧷",
  broom: "🧹",
  basket: "🧺",
  roll_of_paper: "🧻",
  bucket: "🪣",
  soap: "🧼",
  bubbles: "🫧",
  toothbrush: "🪥",
  sponge: "🧽",
  fire_extinguisher: "🧯",
  shopping_cart: "🛒",
  smoking: "🚬",
  coffin: "⚰️",
  headstone: "🪦",
  funeral_urn: "⚱️",
  nazar_amulet: "🧿",
  hamsa: "🪬",
  moyai: "🗿",
  placard: "🪧",
  identification_card: "🪪",
  atm: "🏧",
  put_litter_in_its_place: "🚮",
  potable_water: "🚰",
  wheelchair: "♿",
  mens: "🚹",
  womens: "🚺",
  restroom: "🚻",
  baby_symbol: "🚼",
  wc: "🚾",
  passport_control: "🛂",
  customs: "🛃",
  baggage_claim: "🛄",
  left_luggage: "🛅",
  warning: "⚠️",
  children_crossing: "🚸",
  no_entry: "⛔",
  no_entry_sign: "🚫",
  no_bicycles: "🚳",
  no_smoking: "🚭",
  do_not_litter: "🚯",
  "non-potable_water": "🚱",
  no_pedestrians: "🚷",
  no_mobile_phones: "📵",
  underage: "🔞",
  radioactive: "☢️",
  biohazard: "☣️",
  arrow_up: "⬆️",
  arrow_upper_right: "↗️",
  arrow_right: "➡️",
  arrow_lower_right: "↘️",
  arrow_down: "⬇️",
  arrow_lower_left: "↙️",
  arrow_left: "⬅️",
  arrow_upper_left: "↖️",
  arrow_up_down: "↕️",
  left_right_arrow: "↔️",
  leftwards_arrow_with_hook: "↩️",
  arrow_right_hook: "↪️",
  arrow_heading_up: "⤴️",
  arrow_heading_down: "⤵️",
  arrows_clockwise: "🔃",
  arrows_counterclockwise: "🔄",
  back: "🔙",
  end: "🔚",
  on: "🔛",
  soon: "🔜",
  top: "🔝",
  place_of_worship: "🛐",
  atom_symbol: "⚛️",
  om: "🕉️",
  star_of_david: "✡️",
  wheel_of_dharma: "☸️",
  yin_yang: "☯️",
  latin_cross: "✝️",
  orthodox_cross: "☦️",
  star_and_crescent: "☪️",
  peace_symbol: "☮️",
  menorah: "🕎",
  six_pointed_star: "🔯",
  khanda: "🪯",
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpius: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
  ophiuchus: "⛎",
  twisted_rightwards_arrows: "🔀",
  repeat: "🔁",
  repeat_one: "🔂",
  arrow_forward: "▶️",
  fast_forward: "⏩",
  next_track_button: "⏭️",
  play_or_pause_button: "⏯️",
  arrow_backward: "◀️",
  rewind: "⏪",
  previous_track_button: "⏮️",
  arrow_up_small: "🔼",
  arrow_double_up: "⏫",
  arrow_down_small: "🔽",
  arrow_double_down: "⏬",
  pause_button: "⏸️",
  stop_button: "⏹️",
  record_button: "⏺️",
  eject_button: "⏏️",
  cinema: "🎦",
  low_brightness: "🔅",
  high_brightness: "🔆",
  signal_strength: "📶",
  wireless: "🛜",
  vibration_mode: "📳",
  mobile_phone_off: "📴",
  female_sign: "♀️",
  male_sign: "♂️",
  transgender_symbol: "⚧️",
  heavy_multiplication_x: "✖️",
  heavy_plus_sign: "➕",
  heavy_minus_sign: "➖",
  heavy_division_sign: "➗",
  heavy_equals_sign: "🟰",
  infinity: "♾️",
  bangbang: "‼️",
  interrobang: "⁉️",
  question: "❓",
  grey_question: "❔",
  grey_exclamation: "❕",
  exclamation: "❗",
  heavy_exclamation_mark: "❗",
  wavy_dash: "〰️",
  currency_exchange: "💱",
  heavy_dollar_sign: "💲",
  medical_symbol: "⚕️",
  recycle: "♻️",
  fleur_de_lis: "⚜️",
  trident: "🔱",
  name_badge: "📛",
  beginner: "🔰",
  o: "⭕",
  white_check_mark: "✅",
  ballot_box_with_check: "☑️",
  heavy_check_mark: "✔️",
  x: "❌",
  negative_squared_cross_mark: "❎",
  curly_loop: "➰",
  loop: "➿",
  part_alternation_mark: "〽️",
  eight_spoked_asterisk: "✳️",
  eight_pointed_black_star: "✴️",
  sparkle: "❇️",
  copyright: "©️",
  registered: "®️",
  tm: "™️",
  hash: "#️⃣",
  asterisk: "*️⃣",
  zero: "0️⃣",
  one: "1️⃣",
  two: "2️⃣",
  three: "3️⃣",
  four: "4️⃣",
  five: "5️⃣",
  six: "6️⃣",
  seven: "7️⃣",
  eight: "8️⃣",
  nine: "9️⃣",
  keycap_ten: "🔟",
  capital_abcd: "🔠",
  abcd: "🔡",
  symbols: "🔣",
  abc: "🔤",
  a: "🅰️",
  ab: "🆎",
  b: "🅱️",
  cl: "🆑",
  cool: "🆒",
  free: "🆓",
  information_source: "ℹ️",
  id: "🆔",
  m: "Ⓜ️",
  new: "🆕",
  ng: "🆖",
  o2: "🅾️",
  ok: "🆗",
  parking: "🅿️",
  sos: "🆘",
  up: "🆙",
  vs: "🆚",
  koko: "🈁",
  sa: "🈂️",
  ideograph_advantage: "🉐",
  accept: "🉑",
  congratulations: "㊗️",
  secret: "㊙️",
  u6e80: "🈵",
  red_circle: "🔴",
  orange_circle: "🟠",
  yellow_circle: "🟡",
  green_circle: "🟢",
  large_blue_circle: "🔵",
  purple_circle: "🟣",
  brown_circle: "🟤",
  black_circle: "⚫",
  white_circle: "⚪",
  red_square: "🟥",
  orange_square: "🟧",
  yellow_square: "🟨",
  green_square: "🟩",
  blue_square: "🟦",
  purple_square: "🟪",
  brown_square: "🟫",
  black_large_square: "⬛",
  white_large_square: "⬜",
  black_medium_square: "◼️",
  white_medium_square: "◻️",
  black_medium_small_square: "◾",
  white_medium_small_square: "◽",
  black_small_square: "▪️",
  white_small_square: "▫️",
  large_orange_diamond: "🔶",
  large_blue_diamond: "🔷",
  small_orange_diamond: "🔸",
  small_blue_diamond: "🔹",
  small_red_triangle: "🔺",
  small_red_triangle_down: "🔻",
  diamond_shape_with_a_dot_inside: "💠",
  radio_button: "🔘",
  white_square_button: "🔳",
  black_square_button: "🔲",
  checkered_flag: "🏁",
  triangular_flag_on_post: "🚩",
  crossed_flags: "🎌",
  black_flag: "🏴",
  white_flag: "🏳️",
  rainbow_flag: "🏳️‍🌈",
  transgender_flag: "🏳️‍⚧️",
  pirate_flag: "🏴‍☠️",
  ascension_island: "🇦🇨",
  andorra: "🇦🇩",
  united_arab_emirates: "🇦🇪",
  afghanistan: "🇦🇫",
  antigua_barbuda: "🇦🇬",
  anguilla: "🇦🇮",
  albania: "🇦🇱",
  armenia: "🇦🇲",
  angola: "🇦🇴",
  antarctica: "🇦🇶",
  argentina: "🇦🇷",
  american_samoa: "🇦🇸",
  austria: "🇦🇹",
  australia: "🇦🇺",
  aruba: "🇦🇼",
  aland_islands: "🇦🇽",
  azerbaijan: "🇦🇿",
  bosnia_herzegovina: "🇧🇦",
  barbados: "🇧🇧",
  bangladesh: "🇧🇩",
  belgium: "🇧🇪",
  burkina_faso: "🇧🇫",
  bulgaria: "🇧🇬",
  bahrain: "🇧🇭",
  burundi: "🇧🇮",
  benin: "🇧🇯",
  st_barthelemy: "🇧🇱",
  bermuda: "🇧🇲",
  brunei: "🇧🇳",
  bolivia: "🇧🇴",
  caribbean_netherlands: "🇧🇶",
  brazil: "🇧🇷",
  bahamas: "🇧🇸",
  bhutan: "🇧🇹",
  bouvet_island: "🇧🇻",
  botswana: "🇧🇼",
  belarus: "🇧🇾",
  belize: "🇧🇿",
  canada: "🇨🇦",
  cocos_islands: "🇨🇨",
  congo_kinshasa: "🇨🇩",
  central_african_republic: "🇨🇫",
  congo_brazzaville: "🇨🇬",
  switzerland: "🇨🇭",
  cote_divoire: "🇨🇮",
  cook_islands: "🇨🇰",
  chile: "🇨🇱",
  cameroon: "🇨🇲",
  cn: "🇨🇳",
  colombia: "🇨🇴",
  clipperton_island: "🇨🇵",
  costa_rica: "🇨🇷",
  cuba: "🇨🇺",
  cape_verde: "🇨🇻",
  curacao: "🇨🇼",
  christmas_island: "🇨🇽",
  cyprus: "🇨🇾",
  czech_republic: "🇨🇿",
  de: "🇩🇪",
  diego_garcia: "🇩🇬",
  djibouti: "🇩🇯",
  denmark: "🇩🇰",
  dominica: "🇩🇲",
  dominican_republic: "🇩🇴",
  algeria: "🇩🇿",
  ceuta_melilla: "🇪🇦",
  ecuador: "🇪🇨",
  estonia: "🇪🇪",
  egypt: "🇪🇬",
  western_sahara: "🇪🇭",
  eritrea: "🇪🇷",
  es: "🇪🇸",
  ethiopia: "🇪🇹",
  eu: "🇪🇺",
  european_union: "🇪🇺",
  finland: "🇫🇮",
  fiji: "🇫🇯",
  falkland_islands: "🇫🇰",
  micronesia: "🇫🇲",
  faroe_islands: "🇫🇴",
  fr: "🇫🇷",
  gabon: "🇬🇦",
  gb: "🇬🇧",
  uk: "🇬🇧",
  grenada: "🇬🇩",
  georgia: "🇬🇪",
  french_guiana: "🇬🇫",
  guernsey: "🇬🇬",
  ghana: "🇬🇭",
  gibraltar: "🇬🇮",
  greenland: "🇬🇱",
  gambia: "🇬🇲",
  guinea: "🇬🇳",
  guadeloupe: "🇬🇵",
  equatorial_guinea: "🇬🇶",
  greece: "🇬🇷",
  south_georgia_south_sandwich_islands: "🇬🇸",
  guatemala: "🇬🇹",
  guam: "🇬🇺",
  guinea_bissau: "🇬🇼",
  guyana: "🇬🇾",
  hong_kong: "🇭🇰",
  heard_mcdonald_islands: "🇭🇲",
  honduras: "🇭🇳",
  croatia: "🇭🇷",
  haiti: "🇭🇹",
  hungary: "🇭🇺",
  canary_islands: "🇮🇨",
  indonesia: "🇮🇩",
  ireland: "🇮🇪",
  israel: "🇮🇱",
  isle_of_man: "🇮🇲",
  india: "🇮🇳",
  british_indian_ocean_territory: "🇮🇴",
  iraq: "🇮🇶",
  iran: "🇮🇷",
  iceland: "🇮🇸",
  it: "🇮🇹",
  jersey: "🇯🇪",
  jamaica: "🇯🇲",
  jordan: "🇯🇴",
  jp: "🇯🇵",
  kenya: "🇰🇪",
  kyrgyzstan: "🇰🇬",
  cambodia: "🇰🇭",
  kiribati: "🇰🇮",
  comoros: "🇰🇲",
  st_kitts_nevis: "🇰🇳",
  north_korea: "🇰🇵",
  kr: "🇰🇷",
  kuwait: "🇰🇼",
  cayman_islands: "🇰🇾",
  kazakhstan: "🇰🇿",
  laos: "🇱🇦",
  lebanon: "🇱🇧",
  st_lucia: "🇱🇨",
  liechtenstein: "🇱🇮",
  sri_lanka: "🇱🇰",
  liberia: "🇱🇷",
  lesotho: "🇱🇸",
  lithuania: "🇱🇹",
  luxembourg: "🇱🇺",
  latvia: "🇱🇻",
  libya: "🇱🇾",
  morocco: "🇲🇦",
  monaco: "🇲🇨",
  moldova: "🇲🇩",
  montenegro: "🇲🇪",
  st_martin: "🇲🇫",
  madagascar: "🇲🇬",
  marshall_islands: "🇲🇭",
  macedonia: "🇲🇰",
  mali: "🇲🇱",
  myanmar: "🇲🇲",
  mongolia: "🇲🇳",
  macau: "🇲🇴",
  northern_mariana_islands: "🇲🇵",
  martinique: "🇲🇶",
  mauritania: "🇲🇷",
  montserrat: "🇲🇸",
  malta: "🇲🇹",
  mauritius: "🇲🇺",
  maldives: "🇲🇻",
  malawi: "🇲🇼",
  mexico: "🇲🇽",
  malaysia: "🇲🇾",
  mozambique: "🇲🇿",
  namibia: "🇳🇦",
  new_caledonia: "🇳🇨",
  niger: "🇳🇪",
  norfolk_island: "🇳🇫",
  nigeria: "🇳🇬",
  nicaragua: "🇳🇮",
  netherlands: "🇳🇱",
  norway: "🇳🇴",
  nepal: "🇳🇵",
  nauru: "🇳🇷",
  niue: "🇳🇺",
  new_zealand: "🇳🇿",
  oman: "🇴🇲",
  panama: "🇵🇦",
  peru: "🇵🇪",
  french_polynesia: "🇵🇫",
  papua_new_guinea: "🇵🇬",
  philippines: "🇵🇭",
  pakistan: "🇵🇰",
  poland: "🇵🇱",
  st_pierre_miquelon: "🇵🇲",
  pitcairn_islands: "🇵🇳",
  puerto_rico: "🇵🇷",
  palestinian_territories: "🇵🇸",
  portugal: "🇵🇹",
  palau: "🇵🇼",
  paraguay: "🇵🇾",
  qatar: "🇶🇦",
  reunion: "🇷🇪",
  romania: "🇷🇴",
  serbia: "🇷🇸",
  ru: "🇷🇺",
  rwanda: "🇷🇼",
  saudi_arabia: "🇸🇦",
  solomon_islands: "🇸🇧",
  seychelles: "🇸🇨",
  sudan: "🇸🇩",
  sweden: "🇸🇪",
  singapore: "🇸🇬",
  st_helena: "🇸🇭",
  slovenia: "🇸🇮",
  svalbard_jan_mayen: "🇸🇯",
  slovakia: "🇸🇰",
  sierra_leone: "🇸🇱",
  san_marino: "🇸🇲",
  senegal: "🇸🇳",
  somalia: "🇸🇴",
  suriname: "🇸🇷",
  south_sudan: "🇸🇸",
  sao_tome_principe: "🇸🇹",
  el_salvador: "🇸🇻",
  sint_maarten: "🇸🇽",
  syria: "🇸🇾",
  swaziland: "🇸🇿",
  tristan_da_cunha: "🇹🇦",
  turks_caicos_islands: "🇹🇨",
  chad: "🇹🇩",
  french_southern_territories: "🇹🇫",
  togo: "🇹🇬",
  thailand: "🇹🇭",
  tajikistan: "🇹🇯",
  tokelau: "🇹🇰",
  timor_leste: "🇹🇱",
  turkmenistan: "🇹🇲",
  tunisia: "🇹🇳",
  tonga: "🇹🇴",
  tr: "🇹🇷",
  trinidad_tobago: "🇹🇹",
  tuvalu: "🇹🇻",
  taiwan: "🇹🇼",
  tanzania: "🇹🇿",
  ukraine: "🇺🇦",
  uganda: "🇺🇬",
  us_outlying_islands: "🇺🇲",
  united_nations: "🇺🇳",
  us: "🇺🇸",
  uruguay: "🇺🇾",
  uzbekistan: "🇺🇿",
  vatican_city: "🇻🇦",
  st_vincent_grenadines: "🇻🇨",
  venezuela: "🇻🇪",
  british_virgin_islands: "🇻🇬",
  us_virgin_islands: "🇻🇮",
  vietnam: "🇻🇳",
  vanuatu: "🇻🇺",
  wallis_futuna: "🇼🇫",
  samoa: "🇼🇸",
  kosovo: "🇽🇰",
  yemen: "🇾🇪",
  mayotte: "🇾🇹",
  south_africa: "🇿🇦",
  zambia: "🇿🇲",
  zimbabwe: "🇿🇼",
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿"
}, q = ie, F = Object.keys(q).sort();
function $(e, n) {
  let a = 0;
  for (; e[n + a] === "\\"; ) a++;
  return a;
}
const se = (e, n, a) => {
  if (a.type !== "emoji") return null;
  const t = $(e, n), o = `:${a.markup}:`;
  return e.startsWith(o, n + t) ? t + o.length : null;
};
function N(e, n) {
  let a = 0;
  for (let t = n - 1; t >= 0 && e[t] === "\\"; t--) a++;
  return a % 2 === 1;
}
function le(e) {
  const n = [];
  for (const a of e.tokens) {
    if (a.token.type !== "emoji" || !a.exact) continue;
    const t = a.pos + $(e.text, a.pos);
    if (N(e.text, t)) continue;
    const o = `:${a.token.markup}:`;
    if (t + o.length !== a.end) continue;
    const r = L(
      { token: a.token, pos: t, end: a.end, exact: !0, verified: !0 },
      {
        type: "emoji",
        widget: {
          kind: "emoji",
          // `len` 是 `:name:` 的长度（不含前置反斜杠串），点击后落到 span 尾部。
          attrs: { glyph: a.token.content, len: String(o.length) },
          when: "always",
          side: -1,
          stopEvents: !0
        }
      }
    );
    r && n.push(r);
  }
  return n;
}
const ce = /\B:([a-z0-9_+\-]+)$/, E = 8, w = {
  open: !1,
  partial: "",
  matches: [],
  selected: 0,
  dismissedFor: "",
  from: 0,
  to: 0
}, b = new M("emoji-autocomplete");
function _e(e) {
  const n = [];
  for (const a of F)
    if (a.startsWith(e) && n.push(a), n.length >= E) return n;
  if (n.length < E) {
    for (const a of F)
      if (!n.includes(a) && (a.includes(e) && n.push(a), n.length >= E))
        break;
  }
  return n;
}
function P(e, n) {
  const a = e.selection;
  if (!a.empty) return w;
  const t = a.$from;
  if (!t.parent.isTextblock) return w;
  const o = t.parent.textBetween(0, t.parentOffset, `
`, `
`), r = ce.exec(o);
  if (!r || N(o, r.index)) return w;
  const i = r[1];
  if (n.dismissedFor === i)
    return { ...w, dismissedFor: i };
  const s = _e(i);
  if (s.length === 0) return w;
  const l = t.pos, u = n.open && n.partial === i && n.matches.length === s.length ? Math.min(n.selected, s.length - 1) : 0;
  return {
    open: !0,
    partial: i,
    matches: s,
    selected: u,
    dismissedFor: "",
    from: l - i.length - 1,
    // points at `:`
    to: l
  };
}
function I(e, n, a) {
  const t = `:${n}: `, o = e.state.tr.insertText(t, a.from, a.to), r = a.from + t.length;
  o.setSelection(x.create(o.doc, r)), e.dispatch(o);
}
function ue() {
  return new y({
    key: b,
    state: {
      init: (e, n) => P(n, w),
      apply(e, n, a, t) {
        const o = e.getMeta(b);
        if (o?.type === "select") {
          if (!n.open) return n;
          const r = n.matches.length - 1, i = Math.max(0, Math.min(r, o.index));
          return { ...n, selected: i };
        }
        return o?.type === "dismiss" ? { ...w, dismissedFor: n.partial } : P(t, n);
      }
    },
    props: {
      decorations(e) {
        const n = b.getState(e);
        if (!n?.open) return k.empty;
        const a = me(n);
        return k.create(e.doc, [
          v.widget(n.to, a, {
            side: 1,
            key: `emoji-auto@${n.partial}@${n.selected}`,
            ignoreSelection: !0,
            stopEvent: () => !0
          })
        ]);
      },
      handleKeyDown(e, n) {
        const a = b.getState(e.state);
        if (!a?.open) return !1;
        if (n.key === "ArrowDown")
          return e.dispatch(
            e.state.tr.setMeta(b, { type: "select", index: a.selected + 1 })
          ), n.preventDefault(), !0;
        if (n.key === "ArrowUp")
          return e.dispatch(
            e.state.tr.setMeta(b, { type: "select", index: a.selected - 1 })
          ), n.preventDefault(), !0;
        if (n.key === "Enter" || n.key === "Tab") {
          const t = a.matches[a.selected];
          return t ? (I(e, t, a), n.preventDefault(), !0) : !1;
        }
        return n.key === "Escape" ? (e.dispatch(e.state.tr.setMeta(b, { type: "dismiss" })), n.preventDefault(), !0) : !1;
      }
    },
    // Position the popup below the cursor after every update. It uses
    // `position: fixed` with viewport coords from `coordsAtPos`, but the
    // widget lives inside the editor's DOM — if an ancestor is a fixed
    // containing block (via `contain: layout`, transform, etc.) the
    // coords must be rebased to that block (see reposition below).
    view(e) {
      const n = () => {
        const a = b.getState(e.state);
        if (!a?.open) return;
        const t = e.dom.querySelector(".emoji-completion");
        if (!t) return;
        const o = e.coordsAtPos(a.to, -1), i = t.offsetParent?.getBoundingClientRect() ?? { top: 0, left: 0 };
        t.style.top = `${o.bottom + 2 - i.top}px`, t.style.left = `${o.left - i.left}px`;
        const s = t.querySelector(".emoji-completion-row.selected");
        if (s) {
          const l = t.getBoundingClientRect(), c = s.getBoundingClientRect();
          c.top < l.top ? t.scrollTop -= l.top - c.top : c.bottom > l.bottom && (t.scrollTop += c.bottom - l.bottom);
        }
      };
      return n(), {
        update() {
          n();
        }
      };
    }
  });
}
function me(e) {
  const n = document.createElement("div");
  n.className = "emoji-completion", n.setAttribute("contenteditable", "false"), n.addEventListener("mousedown", (a) => a.preventDefault());
  for (let a = 0; a < e.matches.length; a++) {
    const t = e.matches[a], o = document.createElement("div");
    o.className = "emoji-completion-row", a === e.selected && o.classList.add("selected"), o.dataset.name = t;
    const r = document.createElement("span");
    r.className = "emoji-completion-glyph", r.textContent = q[t] ?? "";
    const i = document.createElement("span");
    i.className = "emoji-completion-name", i.textContent = `:${t}:`, o.appendChild(r), o.appendChild(i), o.addEventListener("click", () => {
      n.dispatchEvent(
        new CustomEvent("emoji-autocomplete-pick", {
          bubbles: !0,
          detail: { name: t }
        })
      );
    }), n.appendChild(o);
  }
  return n;
}
function de() {
  return new y({
    view(e) {
      const n = (a) => {
        const t = a, o = b.getState(e.state);
        o?.open && I(e, t.detail.name, o);
      };
      return e.dom.addEventListener("emoji-autocomplete-pick", n), {
        destroy() {
          e.dom.removeEventListener("emoji-autocomplete-pick", n);
        }
      };
    }
  });
}
function pe() {
  return new y({
    props: {
      handleClick(e, n, a) {
        const o = a.target?.closest(".emoji-glyph");
        if (!o) return !1;
        const r = Number(o.getAttribute("data-len") ?? "0");
        if (!r) return !1;
        const i = e.posAtDOM(o, 0);
        if (i < 0) return !1;
        const s = i + r;
        return s > e.state.doc.content.size ? !1 : (a.preventDefault(), e.dispatch(
          e.state.tr.setSelection(x.create(e.state.doc, s))
        ), e.focus(), !0);
      }
    }
  });
}
const he = (e) => {
  const n = document.createElement("span");
  return n.className = "emoji-glyph", n.textContent = e.glyph ?? "", e.len && n.setAttribute("data-len", e.len), n;
}, ge = {
  name: "emoji",
  // No mark, no node — pure decoration. The source chars are valid plain
  // text in md (no escape needed for `:`), so serialization is automatic.
  // `bare` installs the core replacement rule with only the shortcode table
  // (no `:)`-style shortcuts; those must stay plain text).
  mdItPlugins: [(e) => e.use(re, { defs: q, shortcuts: {} })],
  // Fallback for the legacy per-token load path: keep the source spelling.
  // 依赖 `shortcuts: {}`：shortcut 的 markup 是规范名而非源码短码，若启用
  // shortcuts 这里会把 `:)` 改写成 `:smile:`。
  parserTokens: {
    emoji: (e, n) => {
      e.addText(`:${n.markup}:`);
    }
  },
  plugins: () => [ue(), de(), pe()],
  inline: {
    // 四个迁移特性（highlight / sub-sup / math / emoji）都是 `order: -1`，
    // 组内次序由注册序决定；emoji 的 span 是原子（无 mark），先认领先占用，
    // 其余特性不得再认领其区间。
    order: -1,
    derive: le,
    tokenAdvance: se,
    markNames: [],
    extRanges: () => [],
    decorationWidgets: { emoji: he }
  }
}, fe = {
  id: "emoji",
  register: ({ editor: e }) => [e.registerSyntaxFeature(ge)]
}, S = "headingTypeIndicator_focus";
function be(e) {
  const n = new M("headingTypeIndicator");
  let a = !1;
  return new y({
    key: n,
    state: {
      init: () => k.empty,
      apply: (t, o, r, i) => {
        const s = t.getMeta(S);
        return s !== void 0 && (a = s), a ? we(i) : k.empty;
      }
    },
    props: {
      decorations(t) {
        return n.getState(t);
      },
      handleDOMEvents: {
        focus: (t) => (a || t.dispatch(t.state.tr.setMeta(S, !0)), !1),
        blur: (t) => (a && t.dispatch(t.state.tr.setMeta(S, !1)), !1)
      }
    }
  });
}
function R(e) {
  for (let n = e.depth; n >= 0; n--) {
    const a = e.node(n);
    if (a.type.name === "heading")
      return {
        level: a.attrs.level,
        from: e.before(n),
        to: e.before(n) + a.nodeSize
      };
  }
  return null;
}
function we(e) {
  const { $from: n, $to: a } = e.selection, t = R(n) ?? R(a);
  if (!t || t.level < 1 || t.level > 6)
    return k.empty;
  const o = v.node(t.from, t.to, {
    class: "heading-type-indicator",
    "data-label": `H${t.level}`
  });
  return k.create(e.doc, [o]);
}
const ke = {
  name: "heading-type-indicator",
  plugins: (e) => [be()]
}, ye = {
  id: "headingIndicator",
  register: ({ editor: e }) => [e.registerSyntaxFeature(ke)]
}, xe = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function ve(e, n) {
  const a = e.posMax, t = e.pos;
  if (e.src.charCodeAt(t) !== 126 || n || t + 2 >= a)
    return !1;
  e.pos = t + 1;
  let o = !1;
  for (; e.pos < a; ) {
    if (e.src.charCodeAt(e.pos) === 126) {
      o = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!o || t + 1 === e.pos)
    return e.pos = t, !1;
  const r = e.src.slice(t + 1, e.pos);
  if (r.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = t, !1;
  e.posMax = e.pos, e.pos = t + 1;
  const i = e.push("sub_open", "sub", 1);
  i.markup = "~";
  const s = e.push("text", "", 0);
  s.content = r.replace(xe, "$1");
  const l = e.push("sub_close", "sub", -1);
  return l.markup = "~", e.pos = e.posMax + 1, e.posMax = a, !0;
}
function je(e) {
  e.inline.ruler.after("emphasis", "sub", ve);
}
const Ee = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function Se(e, n) {
  const a = e.posMax, t = e.pos;
  if (e.src.charCodeAt(t) !== 94 || n || t + 2 >= a)
    return !1;
  e.pos = t + 1;
  let o = !1;
  for (; e.pos < a; ) {
    if (e.src.charCodeAt(e.pos) === 94) {
      o = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!o || t + 1 === e.pos)
    return e.pos = t, !1;
  const r = e.src.slice(t + 1, e.pos);
  if (r.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = t, !1;
  e.posMax = e.pos, e.pos = t + 1;
  const i = e.push("sup_open", "sup", 1);
  i.markup = "^";
  const s = e.push("text", "", 0);
  s.content = r.replace(Ee, "$1");
  const l = e.push("sup_close", "sup", -1);
  return l.markup = "^", e.pos = e.posMax + 1, e.posMax = a, !0;
}
function Te(e) {
  e.inline.ruler.after("emphasis", "sup", Se);
}
const ze = {
  name: "sub-sup",
  marks: {
    sub: {
      parseDOM: [{ tag: "sub" }],
      toDOM: () => ["sub", 0]
    },
    sup: {
      parseDOM: [{ tag: "sup" }],
      toDOM: () => ["sup", 0]
    }
  },
  mdItPlugins: [(e) => e.use(je).use(Te)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike / highlight 的 s_* / mark_* 同构，分隔符取自 tok.markup。
  parserTokens: {
    sub_open: (e, n, a) => {
      e.addText(n.markup), e.openMark(a.marks.sub.create());
    },
    sub_close: (e, n, a) => {
      e.closeMarkType(a.marks.sub), e.addText(n.markup);
    },
    sup_open: (e, n, a) => {
      e.addText(n.markup), e.openMark(a.marks.sup.create());
    },
    sup_close: (e, n, a) => {
      e.closeMarkType(a.marks.sup), e.addText(n.markup);
    }
  },
  markDelims: {
    sub: { open: "", close: "" },
    sup: { open: "", close: "" }
  },
  inline: {
    order: -1,
    derive: (e) => [
      ...D(e, { open: "sub_open", close: "sub_close", mark: "sub" }),
      ...D(e, { open: "sup_open", close: "sup_close", mark: "sup" })
    ],
    markNames: ["sub", "sup"],
    extRanges: (e) => [
      ...T(e, "sub", 1),
      ...T(e, "sup", 1)
    ]
  }
}, Me = {
  id: "subSup",
  register: ({ editor: e }) => [e.registerSyntaxFeature(ze)]
}, z = /* @__PURE__ */ new Set();
class Ce {
  dom;
  view;
  // Cache the last rendered (doc, items) so the refresh plugin bails out fast
  // when nothing relevant to the TOC changed (refresh fires on every tx).
  lastDoc = null;
  lastSig = "";
  constructor(n, a) {
    this.view = a, this.dom = document.createElement("div"), this.dom.className = "toc", this.dom.setAttribute("contenteditable", "false"), this.render(), z.add(this);
  }
  render() {
    const n = this.view.state.doc;
    if (n === this.lastDoc) return;
    const a = [];
    n.descendants((r, i) => {
      r.type.name === "heading" && a.push({
        level: r.attrs.level,
        text: r.textContent,
        pos: i
      });
    });
    const t = a.map((r) => `${r.pos}	${r.level}	${r.text}`).join(`
`);
    if (t === this.lastSig && this.lastDoc !== null) {
      this.lastDoc = n;
      return;
    }
    if (this.lastDoc = n, this.lastSig = t, this.dom.innerHTML = "", a.length === 0) {
      const r = document.createElement("div");
      r.className = "toc-empty", r.textContent = "(no headings yet)", this.dom.appendChild(r);
      return;
    }
    const o = document.createElement("ul");
    o.className = "toc-list";
    for (const r of a) {
      const i = document.createElement("li");
      i.className = `toc-item toc-h${r.level}`, i.textContent = r.text || "(empty heading)", i.addEventListener("mousedown", (s) => {
        s.preventDefault();
      }), i.addEventListener("click", () => this.jumpTo(r.pos)), o.appendChild(i);
    }
    this.dom.appendChild(o);
  }
  jumpTo(n) {
    const a = this.view.state.tr;
    a.setSelection(x.near(a.doc.resolve(n + 1))), this.view.dispatch(a), this.view.nodeDOM(n)?.scrollIntoView({ block: "start", behavior: "smooth" }), this.view.focus();
  }
  // The node never changes (atom, no attrs/content); the refresh plugin calls
  // render() externally. Returning true tells PM "we handled it".
  update() {
    return !0;
  }
  destroy() {
    z.delete(this);
  }
  // Atom block — selectable and PM should treat the whole node as a unit.
  stopEvent() {
    return !1;
  }
  ignoreMutation() {
    return !0;
  }
}
function qe() {
  return new y({
    view() {
      const e = () => {
        for (const n of z) n.render();
      };
      return e(), {
        update() {
          e();
        }
      };
    }
  });
}
const Ae = {
  name: "toc",
  nodes: {
    toc: {
      group: "block",
      atom: !0,
      selectable: !0,
      defining: !0,
      // No attrs — the rendered content derives from the doc's headings.
      parseDOM: [{ tag: "div.toc" }],
      toDOM: () => ["div", { class: "toc" }]
    }
  },
  plugins: () => [
    qe(),
    new y({
      props: {
        nodeViews: {
          toc: (e, n) => new Ce(e, n)
        }
      }
    })
  ],
  keymap: () => ({
    // Convert paragraph `[toc]` / `[TOC]` to a toc node on Enter.
    Enter: (e, n) => {
      const a = e.selection;
      if (!a.empty) return !1;
      const t = a.$from;
      if (t.parent.type.name !== "paragraph") return !1;
      const o = t.parent.textContent;
      if (o !== "[toc]" && o !== "[TOC]") return !1;
      if (n) {
        const r = e.schema, i = r.nodes.toc.create(), s = t.before(), l = t.after(), c = e.tr;
        c.replaceWith(s, l, [
          i,
          r.nodes.paragraph.create()
        ]);
        const u = s + i.nodeSize + 1;
        c.setSelection(x.create(c.doc, u)), n(c);
      }
      return !0;
    }
  }),
  parserPostProcess: (e) => {
    const n = [];
    let a = !1;
    const t = e.type.schema.nodes.toc;
    return !t || (e.forEach((o) => {
      o.type.name === "paragraph" && (o.textContent === "[toc]" || o.textContent === "[TOC]") ? (n.push(t.create()), a = !0) : n.push(o);
    }), !a) ? e : e.type.create(e.attrs, n, e.marks);
  },
  blockHandlers: {
    toc: (e, n) => {
      e.write("[toc]"), e.closeBlock(n);
    }
  }
}, De = {
  id: "toc",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Ae)]
}, Fe = {
  id: "underline",
  markName: "underline",
  delim: "<u>",
  closeDelim: "</u>",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.underline.label`）
  labelKey: "underline.label",
  icon: "underline",
  order: 4
};
function Pe(e, n) {
  const a = [], o = "</u>";
  for (let r = 0; r < e.length; ) {
    if (n[r] || !e.startsWith("<u>", r)) {
      r++;
      continue;
    }
    const i = r, s = r + 3, l = s;
    let c = -1;
    for (let _ = l; _ < e.length; _++)
      if (!n[_] && e.startsWith(o, _)) {
        c = _;
        break;
      }
    if (c === -1) break;
    const u = c + o.length, m = c;
    if (l >= m) {
      r = u;
      continue;
    }
    if (/\s/.test(e[l]) || /\s/.test(e[m - 1])) {
      r = l;
      continue;
    }
    for (let _ = i; _ < u; _++) n[_] = 1;
    a.push({ type: "underline", from: l, to: m, openFrom: i, openTo: s, closeFrom: c, closeTo: u, wrap: !0 }), r = u;
  }
  return a;
}
function Re() {
  return (e, n) => {
    const { from: a, to: t, empty: o } = e.selection;
    if (o) return !1;
    const r = e.doc, i = "<u>", s = "</u>", l = i.length, c = s.length, u = a >= l ? r.textBetween(a - l, a) : "", m = t + c <= r.content.size ? r.textBetween(t, t + c) : "";
    if (u === i && m === s)
      return n && n(e.tr.delete(t, t + c).delete(a - l, a)), !0;
    if (n) {
      const _ = r.textBetween(a, t), p = e.tr.replaceWith(a, t, e.schema.text(i + _ + s));
      p.setSelection(x.create(p.doc, a + l, a + l + _.length)), n(p);
    }
    return !0;
  };
}
const Oe = {
  name: "underline",
  marks: {
    underline: {
      parseDOM: [{ tag: "u" }],
      toDOM: () => ["u", 0]
    }
  },
  markDelims: {
    underline: { open: "", close: "" }
  },
  inline: {
    order: 1,
    derive: (e) => Pe(e.text, e.consumed),
    markNames: ["underline"],
    extRanges: (e) => T(e, "underline", 3, 4)
  },
  keymap: () => ({
    "Mod-u": Re()
  })
}, $e = {
  id: "underline",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(Oe),
    e.registerFormatToolbarItem(Fe)
  ]
}, Ne = [
  K,
  Me,
  $e,
  fe,
  ee,
  ye,
  De
], Ie = "en-US", Le = {
  "en-US": {
    name: "Markdown Extensions",
    description: "Editor-native Markdown syntax extensions packaged as a single plugin.",
    groups: { editor: "Editing" },
    alert: {
      label: "Callout boxes",
      description: "GitHub-style callouts using blockquote syntax, e.g. > [!NOTE]"
    },
    subSup: {
      label: "Subscript & superscript",
      description: "Write ~sub~ and ^sup^ to lower or raise text"
    },
    underline: {
      label: "Underline",
      description: "Wrap the selected text in <u>…</u>"
    },
    emoji: {
      label: "Emoji",
      description: "Type shortcodes like :smile: to insert emoji"
    },
    autoPair: {
      label: "Auto pair",
      description: "Automatically close brackets and parentheses while typing"
    },
    headingIndicator: {
      label: "Heading badge",
      description: "Show the heading level (H1–H6) next to the active heading"
    },
    toc: {
      label: "Table of contents",
      description: "Build a live outline of the document headings from [toc]"
    }
  },
  "zh-CN": {
    name: "Markdown 扩展",
    description: "以单个插件形式提供的编辑器原生 Markdown 语法扩展。",
    groups: { editor: "编辑" },
    alert: {
      label: "提示框",
      description: "GitHub 风格的提示框，使用引用语法，如 > [!NOTE]"
    },
    subSup: {
      label: "下标与上标",
      description: "用 ~sub~ 与 ^sup^ 为文本添加下标与上标"
    },
    underline: {
      label: "下划线",
      description: "用 <u>…</u> 为选中文本添加下划线"
    },
    emoji: {
      label: "表情符号",
      description: "输入 :smile: 等短代码插入表情"
    },
    autoPair: {
      label: "自动配对",
      description: "输入时自动补全配对括号"
    },
    headingIndicator: {
      label: "标题角标",
      description: "在光标所在标题旁显示标题级别（H1–H6）"
    },
    toc: {
      label: "目录",
      description: "输入 [toc] 生成随文档标题实时更新的目录块"
    }
  }
};
class Ue extends B {
  featureResources = [];
  onload() {
    this.addMessages(Le, Ie), this.syncFeatures(), this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }
  onunload() {
    this.disposeFeatures();
  }
  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  syncFeatures() {
    this.disposeFeatures();
    for (const n of Ne)
      if (this.settings.get(n.id) !== !1)
        try {
          const a = n.register({
            editor: this.app.editor,
            settings: this.settings,
            t: (t) => this.t(t)
          });
          this.featureResources.push(...Array.isArray(a) ? a : [a]);
        } catch (a) {
          this.app.log.error(`feature ${n.id} failed to load`, a);
        }
  }
  disposeFeatures() {
    for (const n of this.featureResources)
      try {
        n.dispose();
      } catch (a) {
        this.app.log.warn("feature dispose failed", a);
      }
    this.featureResources = [];
  }
}
export {
  Ue as default
};
