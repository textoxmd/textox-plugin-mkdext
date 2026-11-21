import { wholeTokenSpan as Ms, markConsumed as Ke, markExtRanges as _e, pairMarks as Ga, leaveLineDraft as Ls, renderFormulaToSVG as wi, defineCodeBlockExtension as _s, Plugin as As } from "@textox/plugin-sdk";
import { Plugin as _t, PluginKey as ia, TextSelection as pt, Selection as Gn } from "prosemirror-state";
import { Decoration as zt, DecorationSet as St } from "prosemirror-view";
import { jsx as o, jsxs as A } from "react/jsx-runtime";
import { useState as ki, useRef as b, useEffect as oa, Fragment as xi, createContext as se, useLayoutEffect as bs, forwardRef as $, useContext as bt, useMemo as Ot, useInsertionEffect as Mi, createElement as Li, useCallback as x, useImperativeHandle as E } from "react";
import { createRoot as Ns } from "react-dom/client";
import { Transform as $s } from "prosemirror-transform";
const Ln = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, _i = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
};
function Es(e) {
  const a = document.createElement("span");
  return a.className = "alert-label", a.contentEditable = "false", a.textContent = _i[e] ?? e, a;
}
function Cs(e, a) {
  const s = [];
  return e.descendants((i, n) => {
    if (i.type.name !== "blockquote") return !0;
    const c = i.firstChild;
    if (!c || c.type.name !== "paragraph") return !1;
    const d = c.firstChild;
    if (!d?.isText) return !1;
    const u = d.text?.match(Ln);
    if (!u) return !1;
    const p = u[1].toLowerCase();
    if (!_i[p]) return !1;
    s.push(
      zt.node(n, n + i.nodeSize, { class: `alert alert-${p}` })
    );
    const t = n + 2, r = t + u[0].length;
    return a >= t && a <= r || (s.push(zt.inline(t, r, { class: "syntax-hidden" })), s.push(zt.widget(t, Es(p), { side: -1 }))), !1;
  }), s;
}
function Is(e) {
  e.core.ruler.push("alert_split", (a) => {
    const s = a.tokens;
    for (let i = 0; i < s.length; i++) {
      if (s[i]?.type !== "blockquote_open") continue;
      let n = 1, c = -1;
      for (let g = i + 1; g < s.length && n > 0; g++) {
        const v = s[g];
        if (v.type === "blockquote_open") {
          n++;
          continue;
        }
        if (v.type === "blockquote_close") {
          n--;
          continue;
        }
        n === 1 && v.type === "inline" && c < 0 && (c = g);
      }
      if (c < 0) continue;
      const d = s[c], u = d.content;
      if (!u.match(Ln)) continue;
      const t = u.indexOf(`
`);
      if (t < 0) continue;
      const r = u.slice(0, t), l = u.slice(t + 1);
      d.content = r, d.children = [new a.Token("text", "", 0)], d.children[0].content = r;
      const h = [];
      h.push(new a.Token("paragraph_close", "p", -1));
      const f = new a.Token("paragraph_open", "p", 1);
      f.block = !0, h.push(f);
      const y = new a.Token("inline", "", 0);
      y.content = l, y.children = [new a.Token("text", "", 0)], y.children[0].content = l, y.block = !0, h.push(y), h.push(new a.Token("paragraph_close", "p", -1)), s.splice(c + 1, 1, ...h), i = c + h.length;
    }
    return !0;
  });
}
const Os = {
  name: "alert",
  mdItPlugins: [Is],
  inline: {
    markNames: [],
    extRanges: (e) => {
      if (e.type.name !== "paragraph") return [];
      const a = e.textContent.match(Ln);
      return a ? [[0, a[0].length]] : [];
    }
  },
  plugins: (e) => [
    new _t({
      key: new ia("alert-decoration"),
      props: {
        decorations(a) {
          const s = Cs(a.doc, a.selection.$head.pos);
          return s.length > 0 ? St.create(a.doc, s) : St.empty;
        }
      }
    })
  ]
}, js = {
  id: "alert",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Os)]
}, Ss = { "[": "]", "(": ")" }, Ts = /* @__PURE__ */ new Set(["]", ")"]);
function Bs(e) {
  return e.length === 0 || /^\s/.test(e);
}
function Ds() {
  return new _t({
    props: {
      handleTextInput(e, a, s, i) {
        if (e.editable === !1) return !0;
        if (a !== s) return !1;
        const n = e.state.doc.resolve(a);
        if (!n.parent.isTextblock) return !1;
        const c = n.parentOffset, d = n.parent.content.size, u = c < d ? n.parent.textBetween(c, c + 1) : "";
        if (Ts.has(i) && u === i) {
          const l = e.state.tr.setSelection(
            pt.create(e.state.doc, a + 1)
          );
          return e.dispatch(l), !0;
        }
        const p = Ss[i];
        if (!p) return !1;
        const t = n.parent.textBetween(c, d);
        if (!Bs(t)) return !1;
        const r = e.state.tr.insertText(i + p, a, s);
        return r.setSelection(pt.create(r.doc, a + 1)), e.dispatch(r), !0;
      }
    }
  });
}
const zs = (e, a) => {
  const s = e.selection;
  if (!s.empty) return !1;
  const i = e.doc.resolve(s.from);
  if (!i.parent.isTextblock) return !1;
  const n = i.parentOffset, c = i.parent.content.size;
  if (n === 0 || n === c) return !1;
  const d = i.parent.textBetween(n - 1, n), u = i.parent.textBetween(n, n + 1);
  return d === "[" && u === "]" || d === "(" && u === ")" ? (a && a(e.tr.delete(s.from - 1, s.from + 1)), !0) : !1;
}, Ws = {
  name: "auto_pair",
  plugins: () => [Ds()],
  keymap: (e) => ({
    Backspace: zs
  })
}, Vs = {
  id: "autoPair",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Ws)]
};
function Rs(e, a) {
  return e[a].content;
}
function Ps(e, a, s, i, n) {
  const c = e.utils.arrayReplaceAt, d = e.utils.lib.ucmicro, u = new RegExp([d.Z.source, d.P.source, d.Cc.source].join("|"));
  function p(t, r, l) {
    let h = 0;
    const f = [];
    if (t.replace(n, function(y, g, v) {
      let w;
      if (Object.prototype.hasOwnProperty.call(s, y)) {
        if (w = s[y], g > 0 && !u.test(v[g - 1]) || g + y.length < v.length && !u.test(v[g + y.length]))
          return;
      } else
        w = y.slice(1, -1);
      if (g > h) {
        const N = new l("text", "", 0);
        N.content = t.slice(h, g), f.push(N);
      }
      const L = new l("emoji", "", 0);
      L.markup = w, L.content = a[w], f.push(L), h = g + y.length;
    }), h < t.length) {
      const y = new l("text", "", 0);
      y.content = t.slice(h), f.push(y);
    }
    return f;
  }
  return function(r) {
    let l;
    const h = r.tokens;
    let f = 0;
    for (let y = 0, g = h.length; y < g; y++) {
      if (h[y].type !== "inline")
        continue;
      let v = h[y].children;
      for (let w = v.length - 1; w >= 0; w--)
        l = v[w], (l.type === "link_open" || l.type === "link_close") && l.info === "auto" && (f -= l.nesting), l.type === "text" && f === 0 && i.test(l.content) && (h[y].children = v = c(
          v,
          w,
          p(l.content, l.level, r.Token)
        ));
    }
  };
}
function Fs(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
function Hs(e) {
  let a = e.defs;
  e.enabled.length && (a = Object.keys(a).reduce((u, p) => (e.enabled.indexOf(p) >= 0 && (u[p] = a[p]), u), {}));
  const s = Object.keys(e.shortcuts).reduce((u, p) => a[p] ? Array.isArray(e.shortcuts[p]) ? (e.shortcuts[p].forEach((t) => {
    u[t] = p;
  }), u) : (u[e.shortcuts[p]] = p, u) : u, {}), i = Object.keys(a);
  let n;
  i.length === 0 ? n = "^$" : n = i.map((u) => `:${u}:`).concat(Object.keys(s)).sort().reverse().map((u) => Fs(u)).join("|");
  const c = RegExp(n), d = RegExp(n, "g");
  return {
    defs: a,
    shortcuts: s,
    scanRE: c,
    replaceRE: d
  };
}
function qs(e, a) {
  const i = Hs(Object.assign({}, {
    defs: {},
    shortcuts: {},
    enabled: []
  }, a || {}));
  e.renderer.rules.emoji = Rs, e.core.ruler.after(
    "linkify",
    "emoji",
    Ps(e, i.defs, i.shortcuts, i.scanRE, i.replaceRE)
  );
}
const Ys = {
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
}, _n = Ys, Zn = Object.keys(_n).sort();
function Ai(e, a) {
  let s = 0;
  for (; e[a + s] === "\\"; ) s++;
  return s;
}
const Xs = (e, a, s) => {
  if (s.type !== "emoji") return null;
  const i = Ai(e, a), n = `:${s.markup}:`;
  return e.startsWith(n, a + i) ? i + n.length : null;
};
function bi(e, a) {
  let s = 0;
  for (let i = a - 1; i >= 0 && e[i] === "\\"; i--) s++;
  return s % 2 === 1;
}
function Us(e) {
  const a = [];
  for (const s of e.tokens) {
    if (s.token.type !== "emoji" || !s.exact) continue;
    const i = s.pos + Ai(e.text, s.pos);
    if (bi(e.text, i)) continue;
    const n = `:${s.token.markup}:`;
    if (i + n.length !== s.end) continue;
    const c = Ms(
      { token: s.token, pos: i, end: s.end, exact: !0, verified: !0 },
      {
        type: "emoji",
        widget: {
          kind: "emoji",
          // `len` 是 `:name:` 的长度（不含前置反斜杠串），点击后落到 span 尾部。
          attrs: { glyph: s.token.content, len: String(n.length) },
          when: "always",
          side: -1,
          stopEvents: !0
        }
      }
    );
    c && a.push(c);
  }
  return a;
}
const Ks = /\B:([a-z0-9_+\-]+)$/, fa = 8, qt = {
  open: !1,
  partial: "",
  matches: [],
  selected: 0,
  dismissedFor: "",
  from: 0,
  to: 0
}, Bt = new ia("emoji-autocomplete");
function Gs(e) {
  const a = [];
  for (const s of Zn)
    if (s.startsWith(e) && a.push(s), a.length >= fa) return a;
  if (a.length < fa) {
    for (const s of Zn)
      if (!a.includes(s) && (s.includes(e) && a.push(s), a.length >= fa))
        break;
  }
  return a;
}
function Qn(e, a) {
  const s = e.selection;
  if (!s.empty) return qt;
  const i = s.$from;
  if (!i.parent.isTextblock) return qt;
  const n = i.parent.textBetween(0, i.parentOffset, `
`, `
`), c = Ks.exec(n);
  if (!c || bi(n, c.index)) return qt;
  const d = c[1];
  if (a.dismissedFor === d)
    return { ...qt, dismissedFor: d };
  const u = Gs(d);
  if (u.length === 0) return qt;
  const p = i.pos, r = a.open && a.partial === d && a.matches.length === u.length ? Math.min(a.selected, u.length - 1) : 0;
  return {
    open: !0,
    partial: d,
    matches: u,
    selected: r,
    dismissedFor: "",
    from: p - d.length - 1,
    // points at `:`
    to: p
  };
}
function Ni(e, a, s) {
  const i = `:${a}: `, n = e.state.tr.insertText(i, s.from, s.to), c = s.from + i.length;
  n.setSelection(pt.create(n.doc, c)), e.dispatch(n);
}
function Zs() {
  return new _t({
    key: Bt,
    state: {
      init: (e, a) => Qn(a, qt),
      apply(e, a, s, i) {
        const n = e.getMeta(Bt);
        if (n?.type === "select") {
          if (!a.open) return a;
          const c = a.matches.length - 1, d = Math.max(0, Math.min(c, n.index));
          return { ...a, selected: d };
        }
        return n?.type === "dismiss" ? { ...qt, dismissedFor: a.partial } : Qn(i, a);
      }
    },
    props: {
      decorations(e) {
        const a = Bt.getState(e);
        if (!a?.open) return St.empty;
        const s = Qs(a);
        return St.create(e.doc, [
          zt.widget(a.to, s, {
            side: 1,
            key: `emoji-auto@${a.partial}@${a.selected}`,
            ignoreSelection: !0,
            stopEvent: () => !0
          })
        ]);
      },
      handleKeyDown(e, a) {
        const s = Bt.getState(e.state);
        if (!s?.open) return !1;
        if (a.key === "ArrowDown")
          return e.dispatch(
            e.state.tr.setMeta(Bt, { type: "select", index: s.selected + 1 })
          ), a.preventDefault(), !0;
        if (a.key === "ArrowUp")
          return e.dispatch(
            e.state.tr.setMeta(Bt, { type: "select", index: s.selected - 1 })
          ), a.preventDefault(), !0;
        if (a.key === "Enter" || a.key === "Tab") {
          const i = s.matches[s.selected];
          return i ? (Ni(e, i, s), a.preventDefault(), !0) : !1;
        }
        return a.key === "Escape" ? (e.dispatch(e.state.tr.setMeta(Bt, { type: "dismiss" })), a.preventDefault(), !0) : !1;
      }
    },
    // Position the popup below the cursor after every update. It uses
    // `position: fixed` with viewport coords from `coordsAtPos`, but the
    // widget lives inside the editor's DOM — if an ancestor is a fixed
    // containing block (via `contain: layout`, transform, etc.) the
    // coords must be rebased to that block (see reposition below).
    view(e) {
      const a = () => {
        const s = Bt.getState(e.state);
        if (!s?.open) return;
        const i = e.dom.querySelector(".emoji-completion");
        if (!i) return;
        const n = e.coordsAtPos(s.to, -1), d = i.offsetParent?.getBoundingClientRect() ?? { top: 0, left: 0 };
        i.style.top = `${n.bottom + 2 - d.top}px`, i.style.left = `${n.left - d.left}px`;
        const u = i.querySelector(".emoji-completion-row.selected");
        if (u) {
          const p = i.getBoundingClientRect(), t = u.getBoundingClientRect();
          t.top < p.top ? i.scrollTop -= p.top - t.top : t.bottom > p.bottom && (i.scrollTop += t.bottom - p.bottom);
        }
      };
      return a(), {
        update() {
          a();
        }
      };
    }
  });
}
function Qs(e) {
  const a = document.createElement("div");
  a.className = "emoji-completion", a.setAttribute("contenteditable", "false"), a.addEventListener("mousedown", (s) => s.preventDefault());
  for (let s = 0; s < e.matches.length; s++) {
    const i = e.matches[s], n = document.createElement("div");
    n.className = "emoji-completion-row", s === e.selected && n.classList.add("selected"), n.dataset.name = i;
    const c = document.createElement("span");
    c.className = "emoji-completion-glyph", c.textContent = _n[i] ?? "";
    const d = document.createElement("span");
    d.className = "emoji-completion-name", d.textContent = `:${i}:`, n.appendChild(c), n.appendChild(d), n.addEventListener("click", () => {
      a.dispatchEvent(
        new CustomEvent("emoji-autocomplete-pick", {
          bubbles: !0,
          detail: { name: i }
        })
      );
    }), a.appendChild(n);
  }
  return a;
}
function Js() {
  return new _t({
    view(e) {
      const a = (s) => {
        const i = s, n = Bt.getState(e.state);
        n?.open && Ni(e, i.detail.name, n);
      };
      return e.dom.addEventListener("emoji-autocomplete-pick", a), {
        destroy() {
          e.dom.removeEventListener("emoji-autocomplete-pick", a);
        }
      };
    }
  });
}
function tl() {
  return new _t({
    props: {
      handleClick(e, a, s) {
        const n = s.target?.closest(".emoji-glyph");
        if (!n) return !1;
        const c = Number(n.getAttribute("data-len") ?? "0");
        if (!c) return !1;
        const d = e.posAtDOM(n, 0);
        if (d < 0) return !1;
        const u = d + c;
        return u > e.state.doc.content.size ? !1 : (s.preventDefault(), e.dispatch(
          e.state.tr.setSelection(pt.create(e.state.doc, u))
        ), e.focus(), !0);
      }
    }
  });
}
const el = (e) => {
  const a = document.createElement("span");
  return a.className = "emoji-glyph", a.textContent = e.glyph ?? "", e.len && a.setAttribute("data-len", e.len), a;
}, al = {
  name: "emoji",
  // No mark, no node — pure decoration. The source chars are valid plain
  // text in md (no escape needed for `:`), so serialization is automatic.
  // `bare` installs the core replacement rule with only the shortcode table
  // (no `:)`-style shortcuts; those must stay plain text).
  mdItPlugins: [(e) => e.use(qs, { defs: _n, shortcuts: {} })],
  // Fallback for the legacy per-token load path: keep the source spelling.
  // 依赖 `shortcuts: {}`：shortcut 的 markup 是规范名而非源码短码，若启用
  // shortcuts 这里会把 `:)` 改写成 `:smile:`。
  parserTokens: {
    emoji: (e, a) => {
      e.addText(`:${a.markup}:`);
    }
  },
  plugins: () => [Zs(), Js(), tl()],
  inline: {
    // 四个迁移特性（highlight / sub-sup / math / emoji）都是 `order: -1`，
    // 组内次序由注册序决定；emoji 的 span 是原子（无 mark），先认领先占用，
    // 其余特性不得再认领其区间。
    order: -1,
    derive: Us,
    tokenAdvance: Xs,
    markNames: [],
    extRanges: () => [],
    decorationWidgets: { emoji: el }
  }
}, nl = {
  id: "emoji",
  register: ({ editor: e }) => [e.registerSyntaxFeature(al)]
}, rl = [
  ["path", "M7 4h4l3 8 3-8h4"],
  ["line", 4, 16, 10, 16],
  ["circle", 18, 6, 2]
], Jn = /\[\^(\d+)\]/g;
function il(e) {
  let a = 0;
  return e.descendants((s) => {
    if (!s.isTextblock) return !0;
    const i = s.textContent;
    Jn.lastIndex = 0;
    let n;
    for (; n = Jn.exec(i); ) a = Math.max(a, parseInt(n[1], 10));
    return !0;
  }), a + 1;
}
const ol = {
  id: "footnote",
  keyword: "footnote",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.footnote.label`）
  labelKey: "footnote.label",
  descriptionKey: "footnote.description",
  icon: rl,
  defaultShortcut: "Cmd+Opt+F",
  category: "paragraph",
  order: 2,
  insert(e) {
    const a = e.state.schema, s = a.marks.footnote_ref;
    if (!s || !a.nodes.paragraph) return;
    const i = String(il(e.state.doc)), n = `[^${i}]`, { from: c, to: d } = e.state.selection, u = e.state.tr.insertText(n, c, d);
    u.addMark(c, c + n.length, s.create({ id: i }));
    const p = a.nodes.paragraph.create(null, a.text(`[^${i}]: `));
    u.insert(u.doc.content.size, p), e.dispatch(u), e.focus();
  }
};
function sl(e, a, s, i) {
  const n = Number(e[a].meta.id + 1).toString();
  let c = "";
  return typeof i.docId == "string" && (c = `-${i.docId}-`), c + n;
}
function ll(e, a) {
  let s = Number(e[a].meta.id + 1).toString();
  return e[a].meta.subId > 0 && (s += `:${e[a].meta.subId}`), `[${s}]`;
}
function cl(e, a, s, i, n) {
  const c = n.rules.footnote_anchor_name(e, a, s, i, n), d = n.rules.footnote_caption(e, a, s, i, n);
  let u = c;
  return e[a].meta.subId > 0 && (u += `:${e[a].meta.subId}`), `<sup class="footnote-ref"><a href="#fn${c}" id="fnref${u}">${d}</a></sup>`;
}
function ul(e, a, s) {
  return (s.xhtmlOut ? `<hr class="footnotes-sep" />
` : `<hr class="footnotes-sep">
`) + `<section class="footnotes">
<ol class="footnotes-list">
`;
}
function ml() {
  return `</ol>
</section>
`;
}
function dl(e, a, s, i, n) {
  let c = n.rules.footnote_anchor_name(e, a, s, i, n);
  return e[a].meta.subId > 0 && (c += `:${e[a].meta.subId}`), `<li id="fn${c}" class="footnote-item">`;
}
function hl() {
  return `</li>
`;
}
function pl(e, a, s, i, n) {
  let c = n.rules.footnote_anchor_name(e, a, s, i, n);
  return e[a].meta.subId > 0 && (c += `:${e[a].meta.subId}`), ` <a href="#fnref${c}" class="footnote-backref">↩︎</a>`;
}
function fl(e) {
  const a = e.helpers.parseLinkLabel, s = e.utils.isSpace;
  e.renderer.rules.footnote_ref = cl, e.renderer.rules.footnote_block_open = ul, e.renderer.rules.footnote_block_close = ml, e.renderer.rules.footnote_open = dl, e.renderer.rules.footnote_close = hl, e.renderer.rules.footnote_anchor = pl, e.renderer.rules.footnote_caption = ll, e.renderer.rules.footnote_anchor_name = sl;
  function i(u, p, t, r) {
    const l = u.bMarks[p] + u.tShift[p], h = u.eMarks[p];
    if (l + 4 > h || u.src.charCodeAt(l) !== 91 || u.src.charCodeAt(l + 1) !== 94) return !1;
    let f;
    for (f = l + 2; f < h; f++) {
      if (u.src.charCodeAt(f) === 32) return !1;
      if (u.src.charCodeAt(f) === 93)
        break;
    }
    if (f === l + 2 || f + 1 >= h || u.src.charCodeAt(++f) !== 58) return !1;
    if (r) return !0;
    f++, u.env.footnotes || (u.env.footnotes = {}), u.env.footnotes.refs || (u.env.footnotes.refs = {});
    const y = u.src.slice(l + 2, f - 2);
    u.env.footnotes.refs[`:${y}`] = -1;
    const g = new u.Token("footnote_reference_open", "", 1);
    g.meta = { label: y }, g.level = u.level++, u.tokens.push(g);
    const v = u.bMarks[p], w = u.tShift[p], L = u.sCount[p], N = u.parentType, T = f, Y = u.sCount[p] + f - (u.bMarks[p] + u.tShift[p]);
    let G = Y;
    for (; f < h; ) {
      const tt = u.src.charCodeAt(f);
      if (s(tt))
        tt === 9 ? G += 4 - G % 4 : G++;
      else
        break;
      f++;
    }
    u.tShift[p] = f - T, u.sCount[p] = G - Y, u.bMarks[p] = T, u.blkIndent += 4, u.parentType = "footnote", u.sCount[p] < u.blkIndent && (u.sCount[p] += u.blkIndent), u.md.block.tokenize(u, p, t, !0), u.parentType = N, u.blkIndent -= 4, u.tShift[p] = w, u.sCount[p] = L, u.bMarks[p] = v;
    const Z = new u.Token("footnote_reference_close", "", -1);
    return Z.level = --u.level, u.tokens.push(Z), !0;
  }
  function n(u, p) {
    const t = u.posMax, r = u.pos;
    if (r + 2 >= t || u.src.charCodeAt(r) !== 94 || u.src.charCodeAt(r + 1) !== 91) return !1;
    const l = r + 2, h = a(u, r + 1);
    if (h < 0) return !1;
    if (!p) {
      u.env.footnotes || (u.env.footnotes = {}), u.env.footnotes.list || (u.env.footnotes.list = []);
      const f = u.env.footnotes.list.length, y = [];
      u.md.inline.parse(
        u.src.slice(l, h),
        u.md,
        u.env,
        y
      );
      const g = u.push("footnote_ref", "", 0);
      g.meta = { id: f }, u.env.footnotes.list[f] = {
        content: u.src.slice(l, h),
        tokens: y
      };
    }
    return u.pos = h + 1, u.posMax = t, !0;
  }
  function c(u, p) {
    const t = u.posMax, r = u.pos;
    if (r + 3 > t || !u.env.footnotes || !u.env.footnotes.refs || u.src.charCodeAt(r) !== 91 || u.src.charCodeAt(r + 1) !== 94) return !1;
    let l;
    for (l = r + 2; l < t; l++) {
      if (u.src.charCodeAt(l) === 32 || u.src.charCodeAt(l) === 10) return !1;
      if (u.src.charCodeAt(l) === 93)
        break;
    }
    if (l === r + 2 || l >= t) return !1;
    l++;
    const h = u.src.slice(r + 2, l - 1);
    if (typeof u.env.footnotes.refs[`:${h}`] > "u") return !1;
    if (!p) {
      u.env.footnotes.list || (u.env.footnotes.list = []);
      let f;
      u.env.footnotes.refs[`:${h}`] < 0 ? (f = u.env.footnotes.list.length, u.env.footnotes.list[f] = { label: h, count: 0 }, u.env.footnotes.refs[`:${h}`] = f) : f = u.env.footnotes.refs[`:${h}`];
      const y = u.env.footnotes.list[f].count;
      u.env.footnotes.list[f].count++;
      const g = u.push("footnote_ref", "", 0);
      g.meta = { id: f, subId: y, label: h };
    }
    return u.pos = l, u.posMax = t, !0;
  }
  function d(u) {
    let p, t, r, l = !1;
    const h = {};
    if (!u.env.footnotes || (u.tokens = u.tokens.filter(function(y) {
      return y.type === "footnote_reference_open" ? (l = !0, t = [], r = y.meta.label, !1) : y.type === "footnote_reference_close" ? (l = !1, h[":" + r] = t, !1) : (l && t.push(y), !l);
    }), !u.env.footnotes.list))
      return;
    const f = u.env.footnotes.list;
    u.tokens.push(new u.Token("footnote_block_open", "", 1));
    for (let y = 0, g = f.length; y < g; y++) {
      const v = new u.Token("footnote_open", "", 1);
      if (v.meta = { id: y, label: f[y].label }, u.tokens.push(v), f[y].tokens) {
        p = [];
        const N = new u.Token("paragraph_open", "p", 1);
        N.block = !0, p.push(N);
        const T = new u.Token("inline", "", 0);
        T.children = f[y].tokens, T.content = f[y].content, p.push(T);
        const Y = new u.Token("paragraph_close", "p", -1);
        Y.block = !0, p.push(Y);
      } else f[y].label && (p = h[`:${f[y].label}`]);
      p && (u.tokens = u.tokens.concat(p));
      let w;
      u.tokens[u.tokens.length - 1].type === "paragraph_close" ? w = u.tokens.pop() : w = null;
      const L = f[y].count > 0 ? f[y].count : 1;
      for (let N = 0; N < L; N++) {
        const T = new u.Token("footnote_anchor", "", 0);
        T.meta = { id: y, subId: N, label: f[y].label }, u.tokens.push(T);
      }
      w && u.tokens.push(w), u.tokens.push(new u.Token("footnote_close", "", -1));
    }
    u.tokens.push(new u.Token("footnote_block_close", "", -1));
  }
  e.block.ruler.before("reference", "footnote_def", i, { alt: ["paragraph", "reference"] }), e.inline.ruler.after("image", "footnote_inline", n), e.inline.ruler.after("footnote_inline", "footnote_ref", c), e.core.ruler.after("inline", "footnote_tail", d);
}
const $i = /^\[\^([^\]]+)\]:/;
function tr(e) {
  return e.type.name === "paragraph" && $i.test(e.textContent);
}
function er(e) {
  const a = $i.exec(e.textContent);
  return a ? a[1] : "";
}
function yl(e, a) {
  const s = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), i = new RegExp(`^\\[\\^${s}\\]:`), n = e.split(/(?<=\n)/), c = [];
  let d = 0;
  for (const t of n)
    c.push(d), d += t.length;
  const u = (t) => n[t].replace(/\r?\n$/, ""), p = (t) => /^( {4,}|\t)/.test(u(t));
  for (let t = 0; t < n.length; t++) {
    if (!i.test(n[t])) continue;
    const r = c[t];
    let l = t + 1;
    for (; l < n.length; ) {
      if (u(l).trim() === "") {
        let f = l + 1;
        for (; f < n.length && u(f).trim() === ""; ) f++;
        if (f < n.length && p(f)) {
          l = f;
          continue;
        }
        break;
      }
      if (p(l)) {
        l++;
        continue;
      }
      break;
    }
    const h = l < n.length ? c[l] : e.length;
    return { start: r, end: h, raw: e.slice(r, h) };
  }
  return null;
}
const vl = {
  matches: tr,
  keyOf: er,
  collect(e, a) {
    const s = [];
    return a.forEach((i) => {
      if (!tr(i)) return;
      const n = er(i);
      if (!n) return;
      const c = yl(e, n);
      c && s.push({ ...c, key: n });
    }), s;
  },
  render(e, a) {
    return a(e);
  }
}, ar = /\[\^(\d+)\]/g, Za = /^\[\^(\d+)\]:\s*/, Pe = /* @__PURE__ */ new WeakMap();
function gl(e, a) {
  const s = [];
  ar.lastIndex = 0;
  let i;
  for (; i = ar.exec(e); ) {
    const n = i.index, c = n + i[0].length, d = i[1];
    if (n === 0) continue;
    const u = n, p = n + 2, t = c - 1, r = c;
    let l = !1;
    for (let h = u; h < p; h++)
      if (a[h]) {
        l = !0;
        break;
      }
    if (!l) {
      for (let h = t; h < r; h++)
        if (a[h]) {
          l = !0;
          break;
        }
    }
    l || (Ke(a, n, c), s.push({
      type: "footnote_ref",
      from: n,
      to: c,
      openFrom: n,
      openTo: n,
      closeFrom: c,
      closeTo: c,
      wrap: !0,
      delimRanges: [
        { from: u, to: p },
        { from: t, to: r }
      ],
      attrs: { id: d }
    }));
  }
  return s;
}
function wl(e, a) {
  let s = !1;
  return e.doc.descendants((i) => {
    if (s) return !1;
    if (i.isText) {
      for (const n of i.marks)
        if (n.type.name === "footnote_ref" && n.attrs.id === a)
          return s = !0, !1;
    }
    return !0;
  }), s;
}
function kl(e, a) {
  let s = -1;
  e.state.doc.descendants((i, n) => i.type.name === "paragraph" && i.textContent.startsWith(`[^${a}]:`) ? (s = n + i.nodeSize - 1, !1) : !0), !(s < 0) && e.dispatch(e.state.tr.setSelection(pt.near(e.state.doc.resolve(s))).scrollIntoView());
}
function xl(e, a) {
  const s = e.state.schema.marks.footnote_ref;
  let i = -1;
  e.state.doc.descendants((n, c) => {
    const d = n.text;
    return d && n.isText && n.marks.some((u) => u.type === s && u.attrs.id === a) ? (i = c + d.length, !1) : !0;
  }), !(i < 0) && (e.dispatch(e.state.tr.setSelection(pt.create(e.state.doc, i)).scrollIntoView()), e.focus());
}
function Ml() {
  return new _t({
    props: {
      decorations(e) {
        const a = [];
        return e.doc.descendants((s, i) => {
          if (s.type.name !== "paragraph") return !0;
          const n = s.textContent, c = Za.exec(n);
          if (!c) return !0;
          const d = c[1], u = d.length, p = c[0].length, t = i + 1, r = t + n.length, l = e.selection.from, f = l >= t && l < r ? "syntax-hint" : "syntax-hidden";
          if (a.push(zt.inline(t, t + 2, { class: f })), a.push(zt.inline(t + 2 + u, t + p, { class: f })), a.push(zt.inline(t + 2, t + 2 + u, { class: "fn-def-num" })), wl(e, d)) {
            const y = document.createElement("span");
            y.className = "md-reverse-footnote-area", y.setAttribute("contenteditable", "false"), y.appendChild(document.createTextNode(" "));
            const g = document.createElement("a");
            g.className = "reversefootnote", g.setAttribute("href", "#"), g.setAttribute("title", "回到文档"), g.setAttribute("data-index", "0"), g.textContent = "↩", y.appendChild(g), a.push(zt.widget(i + s.nodeSize - 1, y, {
              side: 1,
              stopEvent: (v) => v.type !== "click"
            }));
          }
          return !0;
        }), a.length ? St.create(e.doc, a) : St.empty;
      }
    },
    view(e) {
      const a = (c) => {
        const d = c.target instanceof Element ? c.target : c.target.parentElement;
        if (!d) return;
        const u = d.closest("sup.footnote-ref");
        if (u && (c.metaKey || c.ctrlKey)) {
          c.preventDefault(), c.stopPropagation();
          const t = u.getAttribute("data-ref");
          t && kl(e, t);
          return;
        }
        const p = d.closest(".reversefootnote");
        if (p) {
          if (c.button !== 0) return;
          c.preventDefault(), c.stopPropagation();
          const t = p.closest("p");
          if (t) {
            const r = Za.exec(t.textContent ?? "");
            r && xl(e, r[1]);
          }
        }
      };
      let s = null;
      const i = (c) => {
        let d = "";
        return e.state.doc.descendants((u) => u.type.name === "paragraph" && u.textContent.startsWith(`[^${c}]:`) ? (d = u.textContent.replace(/^\[\^\d+\]:\s*/, ""), !1) : !0), d;
      }, n = (c) => {
        const d = c.target instanceof Element ? c.target : c.target.parentElement;
        if (!d) return;
        const u = d.closest("sup.footnote-ref");
        if (!u) {
          s?.remove(), s = null;
          return;
        }
        if (s) return;
        const p = u.getAttribute("data-ref");
        if (!p) return;
        const t = i(p);
        if (!t) return;
        const r = u.getBoundingClientRect(), l = document.createElement("div");
        l.className = "fn-tooltip", l.textContent = t, document.body.appendChild(l), l.style.top = `${r.bottom + 6}px`, l.style.left = `${r.left}px`, s = l;
      };
      return e.dom.addEventListener("mouseover", n), e.dom.addEventListener("mouseout", n), e.dom.addEventListener("mousedown", a, !0), {
        destroy() {
          e.dom.removeEventListener("mouseover", n), e.dom.removeEventListener("mouseout", n), e.dom.removeEventListener("mousedown", a, !0), s?.remove();
        }
      };
    }
  });
}
const Ll = {
  name: "footnote",
  mdItPlugins: [(e) => e.use(fl)],
  marks: {
    footnote_ref: {
      attrs: { id: {} },
      inclusive: !1,
      parseDOM: [{ tag: "sup.footnote-ref", getAttrs: (e) => ({ id: e.getAttribute("data-ref") }) }],
      toDOM: (e) => ["sup", { class: "footnote-ref", "data-ref": e.attrs.id }, 0]
    }
  },
  parserTokens: {
    footnote_ref: (e, a, s) => {
      const i = String(a.meta?.label ?? a.content ?? "");
      i && (e.openMark(s.marks.footnote_ref.create({ id: i })), e.addText(`[^${i}]`), e.closeMarkType(s.marks.footnote_ref));
    },
    footnote_open: (e, a, s) => {
      const i = String(a.meta?.label ?? a.content ?? "");
      Pe.set(e, i), e.openNode(s.nodes.paragraph), e.addText(`[^${i}]: `);
    },
    footnote_close: (e, a, s) => {
      Pe.delete(e), e.closeNode();
    },
    paragraph_open: (e, a, s) => {
      Pe.get(e) || e.openNode(s.nodes.paragraph);
    },
    paragraph_close: (e, a, s) => {
      Pe.get(e) || e.closeNode();
    }
  },
  markDelims: {
    footnote_ref: { open: "", close: "" }
  },
  inline: {
    order: 1.1,
    derive: (e) => gl(e.text, e.consumed),
    markNames: ["footnote_ref"],
    extRanges: (e) => {
      const a = [], s = e.type.schema.marks.footnote_ref;
      if (!s) return a;
      let i = -1, n = null;
      const c = (t) => {
        i < 0 || !n || (a.push([i, t]), i = -1, n = null);
      };
      let d = 0;
      e.forEach((t) => {
        if (t.isText) {
          const r = t.marks.find((l) => l.type === s) ?? null;
          r ? i < 0 ? (i = d, n = r) : n && !r.eq(n) && (c(d), i = d, n = r) : c(d);
        }
        d += t.nodeSize;
      }), c(d);
      const u = e.textContent, p = Za.exec(u);
      return p && a.push([0, p[0].length]), a;
    }
  },
  plugins: () => [Ml()],
  sourceVerbatim: vl
}, _l = {
  id: "footnote",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(Ll),
    e.registerExtension({
      id: "footnote.editor",
      insert: ol,
      create() {
        return {};
      }
    })
  ]
}, ya = "view", Qa = "panel";
let ie = null;
function nr(e) {
  ie = e;
}
function Ei() {
  return ie && ie.read() === "source" ? "source" : Qa;
}
function Al(e) {
  return ie ? ie.subscribe((a) => e(a === "source" ? "source" : Qa)) : () => {
  };
}
async function bl(e) {
  await ie?.write(e);
}
var Nl = ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (a, s) => (typeof require < "u" ? require : a)[s] }) : e)(function(e) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
}), C = (...e) => e.filter(Boolean).join(" "), An = se({ strict: !1 });
function $l(e, a) {
  e.indexOf(a) === -1 && e.push(a);
}
function El(e, a) {
  let s = e.indexOf(a);
  s > -1 && e.splice(s, 1);
}
var Xt = (e, a, s) => s > a ? a : s < e ? e : s, bn = () => {
}, Ut = {}, Ci = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e), Ii = (e) => /^0[^.\s]+$/u.test(e);
function Oi(e) {
  let a;
  return () => (a === void 0 && (a = e()), a);
}
var le = (e) => e, Nn = (...e) => e.reduce((a, s) => (i) => s(a(i))), ji = (e, a, s) => {
  let i = a - e;
  return i ? (s - e) / i : 1;
}, Si = class {
  constructor() {
    this.subscriptions = [];
  }
  add(e) {
    return $l(this.subscriptions, e), () => El(this.subscriptions, e);
  }
  notify(e, a, s) {
    let i = this.subscriptions.length;
    if (i) if (i === 1) this.subscriptions[0](e, a, s);
    else for (let n = 0; n < i; n++) {
      let c = this.subscriptions[n];
      c && c(e, a, s);
    }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}, $t = (e) => e * 1e3, Nt = (e) => e / 1e3, Ti = (e, a) => a ? e * (1e3 / a) : 0, Bi = (e, a, s) => (((1 - 3 * s + 3 * a) * e + (3 * s - 6 * a)) * e + 3 * a) * e, Cl = 1e-7, Il = 12;
function Ol(e, a, s, i, n) {
  let c, d, u = 0;
  do
    d = a + (s - a) / 2, c = Bi(d, i, n) - e, c > 0 ? s = d : a = d;
  while (Math.abs(c) > Cl && ++u < Il);
  return d;
}
function $e(e, a, s, i) {
  if (e === a && s === i) return le;
  let n = (c) => Ol(c, 0, 1, e, s);
  return (c) => c === 0 || c === 1 ? c : Bi(n(c), a, i);
}
var Di = (e) => (a) => a <= 0.5 ? e(2 * a) / 2 : (2 - e(2 * (1 - a))) / 2, zi = (e) => (a) => 1 - e(1 - a), Wi = $e(0.33, 1.53, 0.69, 0.99), $n = zi(Wi), Vi = Di($n), Ri = (e) => e >= 1 ? 1 : (e *= 2) < 1 ? 0.5 * $n(e) : 0.5 * (2 - Math.pow(2, -10 * (e - 1))), En = (e) => 1 - Math.sin(Math.acos(e)), jl = zi(En), Pi = Di(En), Sl = $e(0.42, 0, 1, 1), Tl = $e(0, 0, 0.58, 1), Fi = $e(0.42, 0, 0.58, 1), Bl = (e) => Array.isArray(e) && typeof e[0] != "number", Hi = (e) => Array.isArray(e) && typeof e[0] == "number", Dl = { linear: le, easeIn: Sl, easeInOut: Fi, easeOut: Tl, circIn: En, circInOut: Pi, circOut: jl, backIn: $n, backInOut: Vi, backOut: Wi, anticipate: Ri }, zl = (e) => typeof e == "string", rr = (e) => {
  if (Hi(e)) {
    bn(e.length === 4);
    let [a, s, i, n] = e;
    return $e(a, s, i, n);
  } else if (zl(e)) return Dl[e];
  return e;
}, Fe = ["setup", "read", "resolveKeyframes", "preUpdate", "update", "preRender", "render", "postRender"];
function Wl(e, a) {
  let s = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), n = !1, c = !1, d = /* @__PURE__ */ new WeakSet(), u = { delta: 0, timestamp: 0, isProcessing: !1 };
  function p(r) {
    d.has(r) && (t.schedule(r), e()), r(u);
  }
  let t = { schedule: (r, l = !1, h = !1) => {
    let f = h && n ? s : i;
    return l && d.add(r), f.add(r), r;
  }, cancel: (r) => {
    i.delete(r), d.delete(r);
  }, process: (r) => {
    if (u = r, n) {
      c = !0;
      return;
    }
    n = !0;
    let l = s;
    s = i, i = l, s.forEach(p), s.clear(), n = !1, c && (c = !1, t.process(r));
  } };
  return t;
}
var Vl = 40;
function qi(e, a) {
  let s = !1, i = !0, n = { delta: 0, timestamp: 0, isProcessing: !1 }, c = () => s = !0, d = Fe.reduce((w, L) => (w[L] = Wl(c), w), {}), { setup: u, read: p, resolveKeyframes: t, preUpdate: r, update: l, preRender: h, render: f, postRender: y } = d, g = () => {
    let w = Ut.useManualTiming, L = w ? n.timestamp : performance.now();
    s = !1, w || (n.delta = i ? 1e3 / 60 : Math.max(Math.min(L - n.timestamp, Vl), 1)), n.timestamp = L, n.isProcessing = !0, u.process(n), p.process(n), t.process(n), r.process(n), l.process(n), h.process(n), f.process(n), y.process(n), n.isProcessing = !1, s && a && (i = !1, e(g));
  }, v = () => {
    s = !0, i = !0, n.isProcessing || e(g);
  };
  return { schedule: Fe.reduce((w, L) => {
    let N = d[L];
    return w[L] = (T, Y = !1, G = !1) => (s || v(), N.schedule(T, Y, G)), w;
  }, {}), cancel: (w) => {
    for (let L = 0; L < Fe.length; L++) d[Fe[L]].cancel(w);
  }, state: n, steps: d };
}
var { schedule: jt, cancel: Ja, state: Ge } = qi(typeof requestAnimationFrame < "u" ? requestAnimationFrame : le, !0), Ue;
function Rl() {
  Ue = void 0;
}
var Lt = { now: () => (Ue === void 0 && Lt.set(Ge.isProcessing || Ut.useManualTiming ? Ge.timestamp : performance.now()), Ue), set: (e) => {
  Ue = e, queueMicrotask(Rl);
} }, Yi = (e) => (a) => typeof a == "string" && a.startsWith(e), Xi = Yi("--"), Pl = Yi("var(--"), Cn = (e) => Pl(e) ? Fl.test(e.split("/*")[0].trim()) : !1, Fl = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function ir(e) {
  return typeof e != "string" ? !1 : e.split("/*")[0].includes("var(--");
}
var ce = { test: (e) => typeof e == "number", parse: parseFloat, transform: (e) => e }, Ae = { ...ce, transform: (e) => Xt(0, 1, e) }, He = { ...ce, default: 1 }, Me = (e) => Math.round(e * 1e5) / 1e5, In = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function Hl(e) {
  return e == null;
}
var ql = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, On = (e, a) => (s) => !!(typeof s == "string" && ql.test(s) && s.startsWith(e) || a && !Hl(s) && Object.prototype.hasOwnProperty.call(s, a)), Ui = (e, a, s) => (i) => {
  if (typeof i != "string") return i;
  let [n, c, d, u] = i.match(In);
  return { [e]: parseFloat(n), [a]: parseFloat(c), [s]: parseFloat(d), alpha: u !== void 0 ? parseFloat(u) : 1 };
}, Yl = (e) => Xt(0, 255, e), va = { ...ce, transform: (e) => Math.round(Yl(e)) }, Zt = { test: On("rgb", "red"), parse: Ui("red", "green", "blue"), transform: ({ red: e, green: a, blue: s, alpha: i = 1 }) => "rgba(" + va.transform(e) + ", " + va.transform(a) + ", " + va.transform(s) + ", " + Me(Ae.transform(i)) + ")" };
function Xl(e) {
  let a = "", s = "", i = "", n = "";
  return e.length > 5 ? (a = e.substring(1, 3), s = e.substring(3, 5), i = e.substring(5, 7), n = e.substring(7, 9)) : (a = e.substring(1, 2), s = e.substring(2, 3), i = e.substring(3, 4), n = e.substring(4, 5), a += a, s += s, i += i, n += n), { red: parseInt(a, 16), green: parseInt(s, 16), blue: parseInt(i, 16), alpha: n ? parseInt(n, 16) / 255 : 1 };
}
var tn = { test: On("#"), parse: Xl, transform: Zt.transform }, Ee = (e) => ({ test: (a) => typeof a == "string" && a.endsWith(e) && a.split(" ").length === 1, parse: parseFloat, transform: (a) => `${a}${e}` }), Dt = Ee("deg"), re = Ee("%"), K = Ee("px"), Ul = Ee("vh"), Kl = Ee("vw"), or = { ...re, parse: (e) => re.parse(e) / 100, transform: (e) => re.transform(e * 100) }, ne = { test: On("hsl", "hue"), parse: Ui("hue", "saturation", "lightness"), transform: ({ hue: e, saturation: a, lightness: s, alpha: i = 1 }) => "hsla(" + Math.round(e) + ", " + re.transform(Me(a)) + ", " + re.transform(Me(s)) + ", " + Me(Ae.transform(i)) + ")" }, ht = { test: (e) => Zt.test(e) || tn.test(e) || ne.test(e), parse: (e) => Zt.test(e) ? Zt.parse(e) : ne.test(e) ? ne.parse(e) : tn.parse(e), transform: (e) => typeof e == "string" ? e : e.hasOwnProperty("red") ? Zt.transform(e) : ne.transform(e), getAnimatableNone: (e) => {
  let a = ht.parse(e);
  return a.alpha = 0, ht.transform(a);
} }, Gl = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function Zl(e) {
  return isNaN(e) && typeof e == "string" && (e.match(In)?.length || 0) + (e.match(Gl)?.length || 0) > 0;
}
var Ki = "number", Gi = "color", Ql = "var", Jl = "var(", sr = "${}", tc = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function oe(e) {
  let a = e.toString(), s = [], i = { color: [], number: [], var: [] }, n = [], c = 0, d = a.replace(tc, (u) => (ht.test(u) ? (i.color.push(c), n.push(Gi), s.push(ht.parse(u))) : u.startsWith(Jl) ? (i.var.push(c), n.push(Ql), s.push(u)) : (i.number.push(c), n.push(Ki), s.push(parseFloat(u))), ++c, sr)).split(sr);
  return { values: s, split: d, indexes: i, types: n };
}
function ec(e) {
  return oe(e).values;
}
function Zi({ split: e, types: a }) {
  let s = e.length;
  return (i) => {
    let n = "";
    for (let c = 0; c < s; c++) if (n += e[c], i[c] !== void 0) {
      let d = a[c];
      d === Ki ? n += Me(i[c]) : d === Gi ? n += ht.transform(i[c]) : n += i[c];
    }
    return n;
  };
}
function ac(e) {
  return Zi(oe(e));
}
var nc = (e) => typeof e == "number" ? 0 : ht.test(e) ? ht.getAnimatableNone(e) : e, rc = (e, a) => typeof e == "number" ? a?.trim().endsWith("/") ? e : 0 : nc(e);
function ic(e) {
  let a = oe(e);
  return Zi(a)(a.values.map((s, i) => rc(s, a.split[i])));
}
var Et = { test: Zl, parse: ec, createTransformer: ac, getAnimatableNone: ic };
function ga(e, a, s) {
  return s < 0 && (s += 1), s > 1 && (s -= 1), s < 1 / 6 ? e + (a - e) * 6 * s : s < 1 / 2 ? a : s < 2 / 3 ? e + (a - e) * (2 / 3 - s) * 6 : e;
}
function oc({ hue: e, saturation: a, lightness: s, alpha: i }) {
  e /= 360, a /= 100, s /= 100;
  let n = 0, c = 0, d = 0;
  if (!a) n = c = d = s;
  else {
    let u = s < 0.5 ? s * (1 + a) : s + a - s * a, p = 2 * s - u;
    n = ga(p, u, e + 1 / 3), c = ga(p, u, e), d = ga(p, u, e - 1 / 3);
  }
  return { red: Math.round(n * 255), green: Math.round(c * 255), blue: Math.round(d * 255), alpha: i };
}
function Ze(e, a) {
  return (s) => s > 0 ? a : e;
}
var Ce = (e, a, s) => e + (a - e) * s, wa = (e, a, s) => {
  let i = e * e, n = s * (a * a - i) + i;
  return n < 0 ? 0 : Math.sqrt(n);
}, sc = [tn, Zt, ne], lc = (e) => sc.find((a) => a.test(e));
function lr(e) {
  let a = lc(e);
  if (!a) return !1;
  let s = a.parse(e);
  return a === ne && (s = oc(s)), s;
}
var cr = (e, a) => {
  let s = lr(e), i = lr(a);
  if (!s || !i) return Ze(e, a);
  let n = { ...s };
  return (c) => (n.red = wa(s.red, i.red, c), n.green = wa(s.green, i.green, c), n.blue = wa(s.blue, i.blue, c), n.alpha = Ce(s.alpha, i.alpha, c), Zt.transform(n));
}, en = /* @__PURE__ */ new Set(["none", "hidden"]);
function cc(e, a) {
  return en.has(e) ? (s) => s <= 0 ? e : a : (s) => s >= 1 ? a : e;
}
function uc(e, a) {
  return (s) => Ce(e, a, s);
}
function jn(e) {
  return typeof e == "number" ? uc : typeof e == "string" ? Cn(e) ? Ze : ht.test(e) ? cr : hc : Array.isArray(e) ? Qi : typeof e == "object" ? ht.test(e) ? cr : mc : Ze;
}
function Qi(e, a) {
  let s = [...e], i = s.length, n = e.map((c, d) => jn(c)(c, a[d]));
  return (c) => {
    for (let d = 0; d < i; d++) s[d] = n[d](c);
    return s;
  };
}
function mc(e, a) {
  let s = { ...e, ...a }, i = {};
  for (let n in s) e[n] !== void 0 && a[n] !== void 0 && (i[n] = jn(e[n])(e[n], a[n]));
  return (n) => {
    for (let c in i) s[c] = i[c](n);
    return s;
  };
}
function dc(e, a) {
  let s = [], i = { color: 0, var: 0, number: 0 };
  for (let n = 0; n < a.values.length; n++) {
    let c = a.types[n], d = e.indexes[c][i[c]], u = e.values[d] ?? 0;
    s[n] = u, i[c]++;
  }
  return s;
}
var hc = (e, a) => {
  let s = Et.createTransformer(a), i = oe(e), n = oe(a);
  return i.indexes.var.length === n.indexes.var.length && i.indexes.color.length === n.indexes.color.length && i.indexes.number.length >= n.indexes.number.length ? en.has(e) && !n.values.length || en.has(a) && !i.values.length ? cc(e, a) : Nn(Qi(dc(i, n), n.values), s) : Ze(e, a);
};
function Ji(e, a, s) {
  return typeof e == "number" && typeof a == "number" && typeof s == "number" ? Ce(e, a, s) : jn(e)(e, a);
}
var pc = (e) => {
  let a = ({ timestamp: s }) => e(s);
  return { start: (s = !0) => jt.update(a, s), stop: () => Ja(a), now: () => Ge.isProcessing ? Ge.timestamp : Lt.now() };
}, to = (e, a, s = 10) => {
  let i = "", n = Math.max(Math.round(a / s), 2);
  for (let c = 0; c < n; c++) i += Math.round(e(c / (n - 1)) * 1e4) / 1e4 + ", ";
  return `linear(${i.substring(0, i.length - 2)})`;
};
function Sn(e) {
  let a = 0, s = 50, i = e.next(a);
  for (; !i.done && a < 2e4; ) a += s, i = e.next(a);
  return a >= 2e4 ? 1 / 0 : a;
}
function fc(e, a = 100, s) {
  let i = s({ ...e, keyframes: [0, a] }), n = Math.min(Sn(i), 2e4);
  return { type: "keyframes", ease: (c) => i.next(n * c).value / a, duration: Nt(n) };
}
var mt = { stiffness: 100, damping: 10, mass: 1, velocity: 0, duration: 800, bounce: 0.3, visualDuration: 0.3, restSpeed: { granular: 0.01, default: 2 }, restDelta: { granular: 5e-3, default: 0.5 }, minDuration: 0.01, maxDuration: 10, minDamping: 0.05, maxDamping: 1 };
function an(e, a) {
  return e * Math.sqrt(1 - a * a);
}
var yc = 12;
function vc(e, a, s) {
  let i = s;
  for (let n = 1; n < yc; n++) i = i - e(i) / a(i);
  return i;
}
var ka = 1e-3;
function gc({ duration: e = mt.duration, bounce: a = mt.bounce, velocity: s = mt.velocity, mass: i = mt.mass }) {
  let n, c, d = 1 - a;
  d = Xt(mt.minDamping, mt.maxDamping, d), e = Xt(mt.minDuration, mt.maxDuration, Nt(e)), d < 1 ? (n = (t) => {
    let r = t * d, l = r * e, h = r - s, f = an(t, d), y = Math.exp(-l);
    return ka - h / f * y;
  }, c = (t) => {
    let r = t * d * e, l = r * s + s, h = Math.pow(d, 2) * Math.pow(t, 2) * e, f = Math.exp(-r), y = an(Math.pow(t, 2), d);
    return (-n(t) + ka > 0 ? -1 : 1) * ((l - h) * f) / y;
  }) : (n = (t) => {
    let r = Math.exp(-t * e), l = (t - s) * e + 1;
    return -ka + r * l;
  }, c = (t) => {
    let r = Math.exp(-t * e), l = (s - t) * (e * e);
    return r * l;
  });
  let u = 5 / e, p = vc(n, c, u);
  if (e = $t(e), isNaN(p)) return { stiffness: mt.stiffness, damping: mt.damping, duration: e };
  {
    let t = Math.pow(p, 2) * i;
    return { stiffness: t, damping: d * 2 * Math.sqrt(i * t), duration: e };
  }
}
var wc = ["duration", "bounce"], kc = ["stiffness", "damping", "mass"];
function ur(e, a) {
  return a.some((s) => e[s] !== void 0);
}
function xc(e) {
  let a = { velocity: mt.velocity, stiffness: mt.stiffness, damping: mt.damping, mass: mt.mass, isResolvedFromDuration: !1, ...e };
  if (!ur(e, kc) && ur(e, wc)) if (a.velocity = 0, e.visualDuration) {
    let s = e.visualDuration, i = 2 * Math.PI / (s * 1.2), n = i * i, c = 2 * Xt(0.05, 1, 1 - (e.bounce || 0)) * Math.sqrt(n);
    a = { ...a, mass: mt.mass, stiffness: n, damping: c };
  } else {
    let s = gc({ ...e, velocity: 0 });
    a = { ...a, ...s, mass: mt.mass }, a.isResolvedFromDuration = !0;
  }
  return a;
}
function Qe(e = mt.visualDuration, a = mt.bounce) {
  let s = typeof e != "object" ? { visualDuration: e, keyframes: [0, 1], bounce: a } : e, { restSpeed: i, restDelta: n } = s, c = s.keyframes[0], d = s.keyframes[s.keyframes.length - 1], u = { done: !1, value: c }, { stiffness: p, damping: t, mass: r, duration: l, velocity: h, isResolvedFromDuration: f } = xc({ ...s, velocity: -Nt(s.velocity || 0) }), y = h || 0, g = t / (2 * Math.sqrt(p * r)), v = d - c, w = Nt(Math.sqrt(p / r)), L = Math.abs(v) < 5;
  i || (i = L ? mt.restSpeed.granular : mt.restSpeed.default), n || (n = L ? mt.restDelta.granular : mt.restDelta.default);
  let N, T, Y, G, Z, tt;
  if (g < 1) Y = an(w, g), G = (y + g * w * v) / Y, N = (nt) => {
    let lt = Math.exp(-g * w * nt);
    return d - lt * (G * Math.sin(Y * nt) + v * Math.cos(Y * nt));
  }, Z = g * w * G + v * Y, tt = g * w * v - G * Y, T = (nt) => Math.exp(-g * w * nt) * (Z * Math.sin(Y * nt) + tt * Math.cos(Y * nt));
  else if (g === 1) {
    N = (lt) => d - Math.exp(-w * lt) * (v + (y + w * v) * lt);
    let nt = y + w * v;
    T = (lt) => Math.exp(-w * lt) * (w * nt * lt - y);
  } else {
    let nt = w * Math.sqrt(g * g - 1);
    N = (st) => {
      let wt = Math.exp(-g * w * st), X = Math.min(nt * st, 300);
      return d - wt * ((y + g * w * v) * Math.sinh(X) + nt * v * Math.cosh(X)) / nt;
    };
    let lt = (y + g * w * v) / nt, ft = g * w * lt - v * nt, xt = g * w * v - lt * nt;
    T = (st) => {
      let wt = Math.exp(-g * w * st), X = Math.min(nt * st, 300);
      return wt * (ft * Math.sinh(X) + xt * Math.cosh(X));
    };
  }
  let ot = { calculatedDuration: f && l || null, velocity: (nt) => $t(T(nt)), next: (nt) => {
    if (!f && g < 1) {
      let ft = Math.exp(-g * w * nt), xt = Math.sin(Y * nt), st = Math.cos(Y * nt), wt = d - ft * (G * xt + v * st), X = $t(ft * (Z * xt + tt * st));
      return u.done = Math.abs(X) <= i && Math.abs(d - wt) <= n, u.value = u.done ? d : wt, u;
    }
    let lt = N(nt);
    if (f) u.done = nt >= l;
    else {
      let ft = $t(T(nt));
      u.done = Math.abs(ft) <= i && Math.abs(d - lt) <= n;
    }
    return u.value = u.done ? d : lt, u;
  }, toString: () => {
    let nt = Math.min(Sn(ot), 2e4), lt = to((ft) => ot.next(nt * ft).value, nt, 30);
    return nt + "ms " + lt;
  }, toTransition: () => {
  } };
  return ot;
}
Qe.applyToOptions = (e) => {
  let a = fc(e, 100, Qe);
  return e.ease = a.ease, e.duration = $t(a.duration), e.type = "keyframes", e;
};
var Mc = 5;
function eo(e, a, s) {
  let i = Math.max(a - Mc, 0);
  return Ti(s - e(i), a - i);
}
function nn({ keyframes: e, velocity: a = 0, power: s = 0.8, timeConstant: i = 325, bounceDamping: n = 10, bounceStiffness: c = 500, modifyTarget: d, min: u, max: p, restDelta: t = 0.5, restSpeed: r }) {
  let l = e[0], h = { done: !1, value: l }, f = (tt) => u !== void 0 && tt < u || p !== void 0 && tt > p, y = (tt) => u === void 0 ? p : p === void 0 || Math.abs(u - tt) < Math.abs(p - tt) ? u : p, g = s * a, v = l + g, w = d === void 0 ? v : d(v);
  w !== v && (g = w - l);
  let L = (tt) => -g * Math.exp(-tt / i), N = (tt) => w + L(tt), T = (tt) => {
    let ot = L(tt), nt = N(tt);
    h.done = Math.abs(ot) <= t, h.value = h.done ? w : nt;
  }, Y, G, Z = (tt) => {
    f(h.value) && (Y = tt, G = Qe({ keyframes: [h.value, y(h.value)], velocity: eo(N, tt, h.value), damping: n, stiffness: c, restDelta: t, restSpeed: r }));
  };
  return Z(0), { calculatedDuration: null, next: (tt) => {
    let ot = !1;
    return !G && Y === void 0 && (ot = !0, T(tt), Z(tt)), Y !== void 0 && tt >= Y ? G.next(tt - Y) : (!ot && T(tt), h);
  } };
}
function Lc(e, a, s) {
  let i = [], n = s || Ut.mix || Ji, c = e.length - 1;
  for (let d = 0; d < c; d++) {
    let u = n(e[d], e[d + 1]);
    if (a) {
      let p = Array.isArray(a) ? a[d] || le : a;
      u = Nn(p, u);
    }
    i.push(u);
  }
  return i;
}
function _c(e, a, { clamp: s = !0, ease: i, mixer: n } = {}) {
  let c = e.length;
  if (bn(c === a.length), c === 1) return () => a[0];
  if (c === 2 && a[0] === a[1]) return () => a[1];
  let d = e[0] === e[1];
  e[0] > e[c - 1] && (e = [...e].reverse(), a = [...a].reverse());
  let u = Lc(a, i, n), p = u.length, t = (r) => {
    if (d && r < e[0]) return a[0];
    let l = 0;
    if (p > 1) for (; l < e.length - 2 && !(r < e[l + 1]); l++) ;
    let h = ji(e[l], e[l + 1], r);
    return u[l](h);
  };
  return s ? (r) => t(Xt(e[0], e[c - 1], r)) : t;
}
function Ac(e, a) {
  let s = e[e.length - 1];
  for (let i = 1; i <= a; i++) {
    let n = ji(0, a, i);
    e.push(Ce(s, 1, n));
  }
}
function bc(e) {
  let a = [0];
  return Ac(a, e.length - 1), a;
}
function Nc(e, a) {
  return e.map((s) => s * a);
}
function $c(e, a) {
  return e.map(() => a || Fi).splice(0, e.length - 1);
}
function Le({ duration: e = 300, keyframes: a, times: s, ease: i = "easeInOut" }) {
  let n = Bl(i) ? i.map(rr) : rr(i), c = { done: !1, value: a[0] }, d = Nc(s && s.length === a.length ? s : bc(a), e), u = _c(d, a, { ease: Array.isArray(n) ? n : $c(a, n) });
  return { calculatedDuration: e, next: (p) => (c.value = u(p), c.done = p >= e, c) };
}
var Ec = (e) => e !== null;
function sa(e, { repeat: a, repeatType: s = "loop" }, i, n = 1) {
  let c = e.filter(Ec), d = n < 0 || a && s !== "loop" && a % 2 === 1 ? 0 : c.length - 1;
  return !d || i === void 0 ? c[d] : i;
}
var Cc = { decay: nn, inertia: nn, tween: Le, keyframes: Le, spring: Qe };
function ao(e) {
  typeof e.type == "string" && (e.type = Cc[e.type]);
}
var Tn = class {
  constructor() {
    this.updateFinished();
  }
  get finished() {
    return this._finished;
  }
  updateFinished() {
    this._finished = new Promise((e) => {
      this.resolve = e;
    });
  }
  notifyFinished() {
    this.resolve();
  }
  then(e, a) {
    return this.finished.then(e, a);
  }
}, Ic = (e) => e / 100, Je = class extends Tn {
  constructor(e) {
    super(), this.state = "idle", this.startTime = null, this.isStopped = !1, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = { done: !1, value: void 0 }, this.stop = () => {
      let { motionValue: a } = this.options;
      a && a.updatedAt !== Lt.now() && this.tick(Lt.now()), this.isStopped = !0, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
    }, this.options = e, this.initAnimation(), this.play(), e.autoplay === !1 && this.pause();
  }
  initAnimation() {
    let { options: e } = this;
    ao(e);
    let { type: a = Le, repeat: s = 0, repeatDelay: i = 0, repeatType: n, velocity: c = 0 } = e, { keyframes: d } = e, u = a || Le;
    u !== Le && typeof d[0] != "number" && (this.mixKeyframes = Nn(Ic, Ji(d[0], d[1])), d = [0, 100]);
    let p = u({ ...e, keyframes: d });
    n === "mirror" && (this.mirroredGenerator = u({ ...e, keyframes: [...d].reverse(), velocity: -c })), p.calculatedDuration === null && (p.calculatedDuration = Sn(p));
    let { calculatedDuration: t } = p;
    this.calculatedDuration = t, this.resolvedDuration = t + i, this.totalDuration = this.resolvedDuration * (s + 1) - i, this.generator = p;
  }
  updateTime(e) {
    let a = Math.round(e - this.startTime) * this.playbackSpeed;
    this.holdTime !== null ? this.currentTime = this.holdTime : this.currentTime = a;
  }
  tick(e, a = !1) {
    let { generator: s, totalDuration: i, mixKeyframes: n, mirroredGenerator: c, resolvedDuration: d, calculatedDuration: u } = this;
    if (this.startTime === null) return s.next(0);
    let { delay: p = 0, keyframes: t, repeat: r, repeatType: l, repeatDelay: h, type: f, onUpdate: y, finalKeyframe: g } = this.options;
    this.speed > 0 ? this.startTime = Math.min(this.startTime, e) : this.speed < 0 && (this.startTime = Math.min(e - i / this.speed, this.startTime)), a ? this.currentTime = e : this.updateTime(e);
    let v = this.currentTime - p * (this.playbackSpeed >= 0 ? 1 : -1), w = this.playbackSpeed >= 0 ? v < 0 : v > i;
    this.currentTime = Math.max(v, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = i);
    let L = this.currentTime, N = s;
    if (r) {
      let Z = Math.min(this.currentTime, i) / d, tt = Math.floor(Z), ot = Z % 1;
      !ot && Z >= 1 && (ot = 1), ot === 1 && tt--, tt = Math.min(tt, r + 1), tt % 2 && (l === "reverse" ? (ot = 1 - ot, h && (ot -= h / d)) : l === "mirror" && (N = c)), L = Xt(0, 1, ot) * d;
    }
    let T;
    w ? (this.delayState.value = t[0], T = this.delayState) : T = N.next(L), n && !w && (T.value = n(T.value));
    let { done: Y } = T;
    !w && u !== null && (Y = this.playbackSpeed >= 0 ? this.currentTime >= i : this.currentTime <= 0);
    let G = this.holdTime === null && (this.state === "finished" || this.state === "running" && Y);
    return G && f !== nn && (T.value = sa(t, this.options, g, this.speed)), y && y(T.value), G && this.finish(), T;
  }
  then(e, a) {
    return this.finished.then(e, a);
  }
  get duration() {
    return Nt(this.calculatedDuration);
  }
  get iterationDuration() {
    let { delay: e = 0 } = this.options || {};
    return this.duration + Nt(e);
  }
  get time() {
    return Nt(this.currentTime);
  }
  set time(e) {
    e = $t(e), this.currentTime = e, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = e : this.driver && (this.startTime = this.driver.now() - e / this.playbackSpeed), this.driver ? this.driver.start(!1) : (this.startTime = 0, this.state = "paused", this.holdTime = e, this.tick(e));
  }
  getGeneratorVelocity() {
    let e = this.currentTime;
    if (e <= 0) return this.options.velocity || 0;
    if (this.generator.velocity) return this.generator.velocity(e);
    let a = this.generator.next(e).value;
    return eo((s) => this.generator.next(s).value, e, a);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(e) {
    let a = this.playbackSpeed !== e;
    a && this.driver && this.updateTime(Lt.now()), this.playbackSpeed = e, a && this.driver && (this.time = Nt(this.currentTime));
  }
  play() {
    if (this.isStopped) return;
    let { driver: e = pc, startTime: a } = this.options;
    this.driver || (this.driver = e((i) => this.tick(i))), this.options.onPlay?.();
    let s = this.driver.now();
    this.state === "finished" ? (this.updateFinished(), this.startTime = s) : this.holdTime !== null ? this.startTime = s - this.holdTime : this.startTime || (this.startTime = a ?? s), this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
  }
  pause() {
    this.state = "paused", this.updateTime(Lt.now()), this.holdTime = this.currentTime;
  }
  complete() {
    this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
  }
  finish() {
    this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
  }
  teardown() {
    this.state = "idle", this.stopDriver(), this.startTime = this.holdTime = null;
  }
  stopDriver() {
    this.driver && (this.driver.stop(), this.driver = void 0);
  }
  sample(e) {
    return this.startTime = 0, this.tick(e, !0);
  }
  attachTimeline(e) {
    return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), e.observe(this);
  }
};
function Oc(e) {
  for (let a = 1; a < e.length; a++) e[a] ?? (e[a] = e[a - 1]);
}
var Qt = (e) => e * 180 / Math.PI, rn = (e) => {
  let a = Qt(Math.atan2(e[1], e[0]));
  return on(a);
}, jc = { x: 4, y: 5, translateX: 4, translateY: 5, scaleX: 0, scaleY: 3, scale: (e) => (Math.abs(e[0]) + Math.abs(e[3])) / 2, rotate: rn, rotateZ: rn, skewX: (e) => Qt(Math.atan(e[1])), skewY: (e) => Qt(Math.atan(e[2])), skew: (e) => (Math.abs(e[1]) + Math.abs(e[2])) / 2 }, on = (e) => (e = e % 360, e < 0 && (e += 360), e), mr = rn, dr = (e) => Math.sqrt(e[0] * e[0] + e[1] * e[1]), hr = (e) => Math.sqrt(e[4] * e[4] + e[5] * e[5]), Sc = { x: 12, y: 13, z: 14, translateX: 12, translateY: 13, translateZ: 14, scaleX: dr, scaleY: hr, scale: (e) => (dr(e) + hr(e)) / 2, rotateX: (e) => on(Qt(Math.atan2(e[6], e[5]))), rotateY: (e) => on(Qt(Math.atan2(-e[2], e[0]))), rotateZ: mr, rotate: mr, skewX: (e) => Qt(Math.atan(e[4])), skewY: (e) => Qt(Math.atan(e[1])), skew: (e) => (Math.abs(e[1]) + Math.abs(e[4])) / 2 };
function sn(e) {
  return e.includes("scale") ? 1 : 0;
}
function ln(e, a) {
  if (!e || e === "none") return sn(a);
  let s = e.match(/^matrix3d\(([-\d.e\s,]+)\)$/u), i, n;
  if (s) i = Sc, n = s;
  else {
    let u = e.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    i = jc, n = u;
  }
  if (!n) return sn(a);
  let c = i[a], d = n[1].split(",").map(Bc);
  return typeof c == "function" ? c(d) : d[c];
}
var Tc = (e, a) => {
  let { transform: s = "none" } = getComputedStyle(e);
  return ln(s, a);
};
function Bc(e) {
  return parseFloat(e.trim());
}
var ue = ["transformPerspective", "x", "y", "z", "translateX", "translateY", "translateZ", "scale", "scaleX", "scaleY", "rotate", "rotateX", "rotateY", "rotateZ", "skew", "skewX", "skewY"], me = /* @__PURE__ */ new Set([...ue, "pathRotation"]), pr = (e) => e === ce || e === K, Dc = /* @__PURE__ */ new Set(["x", "y", "z"]), zc = ue.filter((e) => !Dc.has(e));
function Wc(e) {
  let a = [];
  return zc.forEach((s) => {
    let i = e.getValue(s);
    i !== void 0 && (a.push([s, i.get()]), i.set(s.startsWith("scale") ? 1 : 0));
  }), a;
}
var Yt = { width: ({ x: e }, { paddingLeft: a = "0", paddingRight: s = "0", boxSizing: i }) => {
  let n = e.max - e.min;
  return i === "border-box" ? n : n - parseFloat(a) - parseFloat(s);
}, height: ({ y: e }, { paddingTop: a = "0", paddingBottom: s = "0", boxSizing: i }) => {
  let n = e.max - e.min;
  return i === "border-box" ? n : n - parseFloat(a) - parseFloat(s);
}, top: (e, { top: a }) => parseFloat(a), left: (e, { left: a }) => parseFloat(a), bottom: ({ y: e }, { top: a }) => parseFloat(a) + (e.max - e.min), right: ({ x: e }, { left: a }) => parseFloat(a) + (e.max - e.min), x: (e, { transform: a }) => ln(a, "x"), y: (e, { transform: a }) => ln(a, "y") };
Yt.translateX = Yt.x;
Yt.translateY = Yt.y;
var Jt = /* @__PURE__ */ new Set(), cn = !1, un = !1, mn = !1;
function no() {
  if (un) {
    let e = Array.from(Jt).filter((i) => i.needsMeasurement), a = new Set(e.map((i) => i.element)), s = /* @__PURE__ */ new Map();
    a.forEach((i) => {
      let n = Wc(i);
      n.length && (s.set(i, n), i.render());
    }), e.forEach((i) => i.measureInitialState()), a.forEach((i) => {
      i.render();
      let n = s.get(i);
      n && n.forEach(([c, d]) => {
        i.getValue(c)?.set(d);
      });
    }), e.forEach((i) => i.measureEndState()), e.forEach((i) => {
      i.suspendedScrollY !== void 0 && window.scrollTo(0, i.suspendedScrollY);
    });
  }
  un = !1, cn = !1, Jt.forEach((e) => e.complete(mn)), Jt.clear();
}
function ro() {
  Jt.forEach((e) => {
    e.readKeyframes(), e.needsMeasurement && (un = !0);
  });
}
function Vc() {
  mn = !0, ro(), no(), mn = !1;
}
var Bn = class {
  constructor(e, a, s, i, n, c = !1) {
    this.state = "pending", this.isAsync = !1, this.needsMeasurement = !1, this.unresolvedKeyframes = [...e], this.onComplete = a, this.name = s, this.motionValue = i, this.element = n, this.isAsync = c;
  }
  scheduleResolve() {
    this.state = "scheduled", this.isAsync ? (Jt.add(this), cn || (cn = !0, jt.read(ro), jt.resolveKeyframes(no))) : (this.readKeyframes(), this.complete());
  }
  readKeyframes() {
    let { unresolvedKeyframes: e, name: a, element: s, motionValue: i } = this;
    if (e[0] === null) {
      let n = i?.get(), c = e[e.length - 1];
      if (n !== void 0) e[0] = n;
      else if (s && a) {
        let d = s.readValue(a, c);
        d != null && (e[0] = d);
      }
      e[0] === void 0 && (e[0] = c), i && n === void 0 && i.set(e[0]);
    }
    Oc(e);
  }
  setFinalKeyframe() {
  }
  measureInitialState() {
  }
  renderEndStyles() {
  }
  measureEndState() {
  }
  complete(e = !1) {
    this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, e), Jt.delete(this);
  }
  cancel() {
    this.state === "scheduled" && (Jt.delete(this), this.state = "pending");
  }
  resume() {
    this.state === "pending" && this.scheduleResolve();
  }
}, Rc = (e) => e.startsWith("--");
function io(e, a, s) {
  Rc(a) ? e.style.setProperty(a, s) : e.style[a] = s;
}
var Pc = {};
function oo(e, a) {
  let s = Oi(e);
  return () => Pc[a] ?? s();
}
var Fc = oo(() => window.ScrollTimeline !== void 0, "scrollTimeline"), so = oo(() => {
  try {
    document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
  } catch {
    return !1;
  }
  return !0;
}, "linearEasing"), xe = ([e, a, s, i]) => `cubic-bezier(${e}, ${a}, ${s}, ${i})`, fr = { linear: "linear", ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", circIn: xe([0, 0.65, 0.55, 1]), circOut: xe([0.55, 0, 1, 0.45]), backIn: xe([0.31, 0.01, 0.66, -0.59]), backOut: xe([0.33, 1.53, 0.69, 0.99]) };
function lo(e, a) {
  if (e) return typeof e == "function" ? so() ? to(e, a) : "ease-out" : Hi(e) ? xe(e) : Array.isArray(e) ? e.map((s) => lo(s, a) || fr.easeOut) : fr[e];
}
function Hc(e, a, s, { delay: i = 0, duration: n = 300, repeat: c = 0, repeatType: d = "loop", ease: u = "easeOut", times: p } = {}, t = void 0) {
  let r = { [a]: s };
  p && (r.offset = p);
  let l = lo(u, n);
  Array.isArray(l) && (r.easing = l);
  let h = { delay: i, duration: n, easing: Array.isArray(l) ? "linear" : l, fill: "both", iterations: c + 1, direction: d === "reverse" ? "alternate" : "normal" };
  return t && (h.pseudoElement = t), e.animate(r, h);
}
function co(e) {
  return typeof e == "function" && "applyToOptions" in e;
}
function qc({ type: e, ...a }) {
  return co(e) && so() ? e.applyToOptions(a) : (a.duration ?? (a.duration = 300), a.ease ?? (a.ease = "easeOut"), a);
}
var uo = class extends Tn {
  constructor(e) {
    if (super(), this.finishedTime = null, this.isStopped = !1, this.manualStartTime = null, !e) return;
    let { element: a, name: s, keyframes: i, pseudoElement: n, allowFlatten: c = !1, finalKeyframe: d, onComplete: u } = e;
    this.isPseudoElement = !!n, this.allowFlatten = c, this.options = e, bn(typeof e.type != "string");
    let p = qc(e);
    this.animation = Hc(a, s, i, p, n), p.autoplay === !1 && this.animation.pause(), this.animation.onfinish = () => {
      if (this.finishedTime = this.time, !n) {
        let t = sa(i, this.options, d, this.speed);
        this.updateMotionValue && this.updateMotionValue(t), io(a, s, t), this.animation.cancel();
      }
      u?.(), this.notifyFinished();
    };
  }
  play() {
    this.isStopped || (this.manualStartTime = null, this.animation.play(), this.state === "finished" && this.updateFinished());
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch {
    }
  }
  stop() {
    if (this.isStopped) return;
    this.isStopped = !0;
    let { state: e } = this;
    e === "idle" || e === "finished" || (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
  }
  commitStyles() {
    let e = this.options?.element;
    !this.isPseudoElement && e?.isConnected && this.animation.commitStyles?.();
  }
  get duration() {
    let e = this.animation.effect?.getComputedTiming?.().duration || 0;
    return Nt(Number(e));
  }
  get iterationDuration() {
    let { delay: e = 0 } = this.options || {};
    return this.duration + Nt(e);
  }
  get time() {
    return Nt(Number(this.animation.currentTime) || 0);
  }
  set time(e) {
    let a = this.finishedTime !== null;
    this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = $t(e), a && this.animation.pause();
  }
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(e) {
    e < 0 && (this.finishedTime = null), this.animation.playbackRate = e;
  }
  get state() {
    return this.finishedTime !== null ? "finished" : this.animation.playState;
  }
  get startTime() {
    return this.manualStartTime ?? Number(this.animation.startTime);
  }
  set startTime(e) {
    this.manualStartTime = this.animation.startTime = e;
  }
  attachTimeline({ timeline: e, rangeStart: a, rangeEnd: s, observe: i }) {
    return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, e && Fc() ? (this.animation.timeline = e, a && (this.animation.rangeStart = a), s && (this.animation.rangeEnd = s), le) : i(this);
  }
}, mo = { anticipate: Ri, backInOut: Vi, circInOut: Pi };
function Yc(e) {
  return e in mo;
}
function Xc(e) {
  typeof e.ease == "string" && Yc(e.ease) && (e.ease = mo[e.ease]);
}
var xa = 10, Uc = class extends uo {
  constructor(e) {
    Xc(e), ao(e), super(e), e.startTime !== void 0 && e.autoplay !== !1 && (this.startTime = e.startTime), this.options = e;
  }
  updateMotionValue(e) {
    let { motionValue: a, onUpdate: s, onComplete: i, element: n, ...c } = this.options;
    if (!a) return;
    if (e !== void 0) {
      a.set(e);
      return;
    }
    let d = new Je({ ...c, autoplay: !1 }), u = Math.max(xa, Lt.now() - this.startTime), p = Xt(0, xa, u - xa), t = d.sample(u).value, { name: r } = this.options;
    n && r && io(n, r, t), a.setWithVelocity(d.sample(Math.max(0, u - p)).value, t, p), d.stop();
  }
}, yr = (e, a) => a === "zIndex" ? !1 : !!(typeof e == "number" || Array.isArray(e) || typeof e == "string" && (Et.test(e) || e === "0") && !e.startsWith("url("));
function Kc(e) {
  let a = e[0];
  if (e.length === 1) return !0;
  for (let s = 0; s < e.length; s++) if (e[s] !== a) return !0;
}
function Gc(e, a, s, i) {
  let n = e[0];
  if (n === null) return !1;
  if (a === "display" || a === "visibility") return !0;
  let c = e[e.length - 1], d = yr(n, a), u = yr(c, a);
  return !d || !u ? !1 : Kc(e) || (s === "spring" || co(s)) && i;
}
function dn(e) {
  e.duration = 0, e.type = "keyframes";
}
var ho = /* @__PURE__ */ new Set(["opacity", "clipPath", "filter", "transform"]), Zc = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function Qc(e) {
  for (let a = 0; a < e.length; a++) if (typeof e[a] == "string" && Zc.test(e[a])) return !0;
  return !1;
}
var Jc = /* @__PURE__ */ new Set(["color", "backgroundColor", "outlineColor", "fill", "stroke", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"]), tu = Oi(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
function eu(e) {
  let { motionValue: a, name: s, repeatDelay: i, repeatType: n, damping: c, type: d, keyframes: u } = e;
  if (!(a?.owner?.current instanceof HTMLElement)) return !1;
  let { onUpdate: p, transformTemplate: t } = a.owner.getProps();
  return tu() && s && (ho.has(s) || Jc.has(s) && Qc(u)) && (s !== "transform" || !t) && !p && !i && n !== "mirror" && c !== 0 && d !== "inertia";
}
var au = 40, nu = class extends Tn {
  constructor({ autoplay: e = !0, delay: a = 0, type: s = "keyframes", repeat: i = 0, repeatDelay: n = 0, repeatType: c = "loop", keyframes: d, name: u, motionValue: p, element: t, ...r }) {
    super(), this.stop = () => {
      this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
    }, this.createdAt = Lt.now();
    let l = { autoplay: e, delay: a, type: s, repeat: i, repeatDelay: n, repeatType: c, name: u, motionValue: p, element: t, ...r }, h = t?.KeyframeResolver || Bn;
    this.keyframeResolver = new h(d, (f, y, g) => this.onKeyframesResolved(f, y, l, !g), u, p, t), this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(e, a, s, i) {
    this.keyframeResolver = void 0;
    let { name: n, type: c, velocity: d, delay: u, isHandoff: p, onUpdate: t } = s;
    this.resolvedAt = Lt.now();
    let r = !0;
    Gc(e, n, c, d) || (r = !1, (Ut.instantAnimations || !u) && t?.(sa(e, s, a)), e[0] = e[e.length - 1], dn(s), s.repeat = 0);
    let l = { startTime: i ? this.resolvedAt ? this.resolvedAt - this.createdAt > au ? this.resolvedAt : this.createdAt : this.createdAt : void 0, finalKeyframe: a, ...s, keyframes: e }, h = r && !p && eu(l), f = l.motionValue?.owner?.current, y;
    if (h) try {
      y = new Uc({ ...l, element: f });
    } catch {
      y = new Je(l);
    }
    else y = new Je(l);
    y.finished.then(() => {
      this.notifyFinished();
    }).catch(le), this.pendingTimeline && (this.stopTimeline = y.attachTimeline(this.pendingTimeline), this.pendingTimeline = void 0), this._animation = y;
  }
  get finished() {
    return this._animation ? this.animation.finished : this._finished;
  }
  then(e, a) {
    return this.finished.finally(e).then(() => {
    });
  }
  get animation() {
    return this._animation || (this.keyframeResolver?.resume(), Vc()), this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(e) {
    this.animation.time = e;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(e) {
    this.animation.speed = e;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(e) {
    return this._animation ? this.stopTimeline = this.animation.attachTimeline(e) : this.pendingTimeline = e, () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    this._animation && this.animation.cancel(), this.keyframeResolver?.cancel();
  }
};
function po(e, a, s, i = 0, n = 1) {
  let c = Array.from(e).sort((p, t) => p.sortNodePosition(t)).indexOf(a), d = e.size, u = (d - 1) * i;
  return typeof s == "function" ? s(c, d) : n === 1 ? c * i : u - c * i;
}
var vr = 30, ru = (e) => !isNaN(parseFloat(e)), iu = class {
  constructor(e, a = {}) {
    this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (s) => {
      let i = Lt.now();
      if (this.updatedAt !== i && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(s), this.current !== this.prev && (this.events.change?.notify(this.current), this.dependents)) for (let n of this.dependents) n.dirty();
    }, this.hasAnimated = !1, this.setCurrent(e), this.owner = a.owner;
  }
  setCurrent(e) {
    this.current = e, this.updatedAt = Lt.now(), this.canTrackVelocity === null && e !== void 0 && (this.canTrackVelocity = ru(this.current));
  }
  setPrevFrameValue(e = this.current) {
    this.prevFrameValue = e, this.prevUpdatedAt = this.updatedAt;
  }
  onChange(e) {
    return this.on("change", e);
  }
  on(e, a) {
    this.events[e] || (this.events[e] = new Si());
    let s = this.events[e].add(a);
    return e === "change" ? () => {
      s(), jt.read(() => {
        this.events.change.getSize() || this.stop();
      });
    } : s;
  }
  clearListeners() {
    for (let e in this.events) this.events[e].clear();
  }
  attach(e, a) {
    this.passiveEffect = e, this.stopPassiveEffect = a;
  }
  set(e) {
    this.passiveEffect ? this.passiveEffect(e, this.updateAndNotify) : this.updateAndNotify(e);
  }
  setWithVelocity(e, a, s) {
    this.set(a), this.prev = void 0, this.prevFrameValue = e, this.prevUpdatedAt = this.updatedAt - s;
  }
  jump(e, a = !0) {
    this.updateAndNotify(e), this.prev = e, this.prevUpdatedAt = this.prevFrameValue = void 0, a && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
  dirty() {
    this.events.change?.notify(this.current);
  }
  addDependent(e) {
    this.dependents || (this.dependents = /* @__PURE__ */ new Set()), this.dependents.add(e);
  }
  removeDependent(e) {
    this.dependents && this.dependents.delete(e);
  }
  get() {
    return this.current;
  }
  getPrevious() {
    return this.prev;
  }
  getVelocity() {
    let e = Lt.now();
    if (!this.canTrackVelocity || this.prevFrameValue === void 0 || e - this.updatedAt > vr) return 0;
    let a = Math.min(this.updatedAt - this.prevUpdatedAt, vr);
    return Ti(parseFloat(this.current) - parseFloat(this.prevFrameValue), a);
  }
  start(e) {
    return this.stop(), new Promise((a) => {
      this.hasAnimated = !0, this.animation = e(a), this.events.animationStart && this.events.animationStart.notify();
    }).then(() => {
      this.events.animationComplete && this.events.animationComplete.notify(), this.clearAnimation();
    });
  }
  stop() {
    this.animation && (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()), this.clearAnimation();
  }
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  destroy() {
    this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
};
function ta(e, a) {
  return new iu(e, a);
}
function fo(e, a) {
  if (e?.inherit && a) {
    let { inherit: s, ...i } = e;
    return { ...a, ...i };
  }
  return e;
}
function yo(e, a) {
  let s = e?.[a] ?? e?.default ?? e;
  return s !== e ? fo(s, e) : s;
}
var ou = { type: "spring", stiffness: 500, damping: 25, restSpeed: 10 }, su = (e) => ({ type: "spring", stiffness: 550, damping: e === 0 ? 2 * Math.sqrt(550) : 30, restSpeed: 10 }), lu = { type: "keyframes", duration: 0.8 }, cu = { type: "keyframes", ease: [0.25, 0.1, 0.35, 1], duration: 0.3 }, uu = (e, { keyframes: a }) => a.length > 2 ? lu : me.has(e) ? e.startsWith("scale") ? su(a[1]) : ou : cu, mu = /* @__PURE__ */ new Set(["when", "delay", "delayChildren", "staggerChildren", "staggerDirection", "repeat", "repeatType", "repeatDelay", "from", "elapsed"]);
function du(e) {
  for (let a in e) if (!mu.has(a)) return !0;
  return !1;
}
var hu = (e, a, s, i = {}, n, c) => (d) => {
  let u = yo(i, e) || {}, p = u.delay || i.delay || 0, { elapsed: t = 0 } = i;
  t = t - $t(p);
  let r = { keyframes: Array.isArray(s) ? s : [null, s], ease: "easeOut", velocity: a.getVelocity(), ...u, delay: -t, onUpdate: (h) => {
    a.set(h), u.onUpdate && u.onUpdate(h);
  }, onComplete: () => {
    d(), u.onComplete && u.onComplete();
  }, name: e, motionValue: a, element: c ? void 0 : n };
  du(u) || Object.assign(r, uu(e, r)), r.duration && (r.duration = $t(r.duration)), r.repeatDelay && (r.repeatDelay = $t(r.repeatDelay)), r.from !== void 0 && (r.keyframes[0] = r.from);
  let l = !1;
  if ((r.type === !1 || r.duration === 0 && !r.repeatDelay) && (dn(r), r.delay === 0 && (l = !0)), (Ut.instantAnimations || Ut.skipAnimations || n?.shouldSkipAnimations || u.skipAnimations) && (l = !0, dn(r), r.delay = 0), r.allowFlatten = !u.type && !u.ease, l && !c && a.get() !== void 0) {
    let h = sa(r.keyframes, u);
    if (h !== void 0) {
      jt.update(() => {
        r.onUpdate(h), r.onComplete();
      });
      return;
    }
  }
  return u.isSync ? new Je(r) : new nu(r);
}, pu = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function fu(e) {
  let a = pu.exec(e);
  if (!a) return [,];
  let [, s, i, n] = a;
  return [`--${s ?? i}`, n];
}
function vo(e, a, s = 1) {
  let [i, n] = fu(e);
  if (!i) return;
  let c = window.getComputedStyle(a).getPropertyValue(i);
  if (c) {
    let d = c.trim();
    return Ci(d) ? parseFloat(d) : d;
  }
  return Cn(n) ? vo(n, a, s + 1) : n;
}
function gr(e) {
  let a = [{}, {}];
  return e?.values.forEach((s, i) => {
    a[0][i] = s.get(), a[1][i] = s.getVelocity();
  }), a;
}
function Dn(e, a, s, i) {
  if (typeof a == "function") {
    let [n, c] = gr(i);
    a = a(s !== void 0 ? s : e.custom, n, c);
  }
  if (typeof a == "string" && (a = e.variants && e.variants[a]), typeof a == "function") {
    let [n, c] = gr(i);
    a = a(s !== void 0 ? s : e.custom, n, c);
  }
  return a;
}
function te(e, a, s) {
  let i = e.getProps();
  return Dn(i, a, s !== void 0 ? s : i.custom, e);
}
var go = /* @__PURE__ */ new Set(["width", "height", "top", "left", "right", "bottom", ...ue]), hn = (e) => Array.isArray(e);
function yu(e, a, s) {
  e.hasValue(a) ? e.getValue(a).set(s) : e.addValue(a, ta(s));
}
function vu(e) {
  return hn(e) ? e[e.length - 1] || 0 : e;
}
function zn(e, a) {
  let s = te(e, a), { transitionEnd: i = {}, transition: n = {}, ...c } = s || {};
  c = { ...c, ...i };
  for (let d in c) {
    let u = vu(c[d]);
    yu(e, d, u);
  }
}
var vt = (e) => !!(e && e.getVelocity);
function gu(e) {
  return !!(vt(e) && e.add);
}
function wu(e, a) {
  let s = e.getValue("willChange");
  if (gu(s)) return s.add(a);
  if (!s && Ut.WillChange) {
    let i = new Ut.WillChange("auto");
    e.addValue("willChange", i), i.add(a);
  }
}
function Wn(e) {
  return e.replace(/([A-Z])/g, (a) => `-${a.toLowerCase()}`);
}
var ku = "framerAppearId", wo = "data-" + Wn(ku);
function xu(e) {
  return e.props[wo];
}
function Mu({ protectedKeys: e, needsAnimating: a }, s) {
  let i = e.hasOwnProperty(s) && a[s] !== !0;
  return a[s] = !1, i;
}
function ko(e, a, { delay: s = 0, transitionOverride: i, type: n } = {}) {
  let { transition: c, transitionEnd: d, ...u } = a, p = e.getDefaultTransition();
  c = c ? fo(c, p) : p;
  let t = c?.reduceMotion, r = c?.skipAnimations;
  i && (c = i);
  let l = [], h = n && e.animationState && e.animationState.getState()[n], f = c?.path;
  f && f.animateVisualElement(e, u, c, s, l);
  for (let y in u) {
    let g = e.getValue(y, e.latestValues[y] ?? null), v = u[y];
    if (v === void 0 || h && Mu(h, y)) continue;
    let w = { delay: s, ...yo(c || {}, y) };
    r && (w.skipAnimations = !0);
    let L = g.get();
    if (L !== void 0 && !g.isAnimating() && !Array.isArray(v) && v === L && !w.velocity) {
      jt.update(() => g.set(v));
      continue;
    }
    let N = !1;
    if (window.MotionHandoffAnimation) {
      let G = xu(e);
      if (G) {
        let Z = window.MotionHandoffAnimation(G, y, jt);
        Z !== null && (w.startTime = Z, N = !0);
      }
    }
    wu(e, y);
    let T = t ?? e.shouldReduceMotion;
    g.start(hu(y, g, v, T && go.has(y) ? { type: !1 } : w, e, N));
    let Y = g.animation;
    Y && l.push(Y);
  }
  if (d) {
    let y = () => jt.update(() => {
      d && zn(e, d);
    });
    l.length ? Promise.all(l).then(y) : y();
  }
  return l;
}
function pn(e, a, s = {}) {
  let i = te(e, a, s.type === "exit" ? e.presenceContext?.custom : void 0), { transition: n = e.getDefaultTransition() || {} } = i || {};
  s.transitionOverride && (n = s.transitionOverride);
  let c = i ? () => Promise.all(ko(e, i, s)) : () => Promise.resolve(), d = e.variantChildren && e.variantChildren.size ? (p = 0) => {
    let { delayChildren: t = 0, staggerChildren: r, staggerDirection: l } = n;
    return Lu(e, a, p, t, r, l, s);
  } : () => Promise.resolve(), { when: u } = n;
  if (u) {
    let [p, t] = u === "beforeChildren" ? [c, d] : [d, c];
    return p().then(() => t());
  } else return Promise.all([c(), d(s.delay)]);
}
function Lu(e, a, s = 0, i = 0, n = 0, c = 1, d) {
  let u = [];
  for (let p of e.variantChildren) p.notify("AnimationStart", a), u.push(pn(p, a, { ...d, delay: s + (typeof i == "function" ? 0 : i) + po(e.variantChildren, p, i, n, c) }).then(() => p.notify("AnimationComplete", a)));
  return Promise.all(u);
}
function xo(e, a, s = {}) {
  e.notify("AnimationStart", a);
  let i;
  if (Array.isArray(a)) {
    let n = a.map((c) => pn(e, c, s));
    i = Promise.all(n);
  } else if (typeof a == "string") i = pn(e, a, s);
  else {
    let n = typeof a == "function" ? te(e, a, s.custom) : a;
    i = Promise.all(ko(e, n, s));
  }
  return i.then(() => {
    e.notify("AnimationComplete", a);
  });
}
var _u = { test: (e) => e === "auto", parse: (e) => e }, Mo = (e) => (a) => a.test(e), Lo = [ce, K, re, Dt, Kl, Ul, _u], wr = (e) => Lo.find(Mo(e));
function Au(e) {
  return typeof e == "number" ? e === 0 : e !== null ? e === "none" || e === "0" || Ii(e) : !0;
}
var bu = /* @__PURE__ */ new Set(["brightness", "contrast", "saturate", "opacity"]);
function Nu(e) {
  let [a, s] = e.slice(0, -1).split("(");
  if (a === "drop-shadow") return e;
  let [i] = s.match(In) || [];
  if (!i) return e;
  let n = s.replace(i, ""), c = bu.has(a) ? 1 : 0;
  return i !== s && (c *= 100), a + "(" + c + n + ")";
}
var $u = /\b([a-z-]*)\(.*?\)/gu, fn = { ...Et, getAnimatableNone: (e) => {
  let a = e.match($u);
  return a ? a.map(Nu).join(" ") : e;
} }, yn = { ...Et, getAnimatableNone: (e) => {
  let a = Et.parse(e);
  return Et.createTransformer(e)(a.map((s) => typeof s == "number" ? 0 : typeof s == "object" ? { ...s, alpha: 1 } : s));
} }, kr = { ...ce, transform: Math.round }, Eu = { rotate: Dt, pathRotation: Dt, rotateX: Dt, rotateY: Dt, rotateZ: Dt, scale: He, scaleX: He, scaleY: He, scaleZ: He, skew: Dt, skewX: Dt, skewY: Dt, distance: K, translateX: K, translateY: K, translateZ: K, x: K, y: K, z: K, perspective: K, transformPerspective: K, opacity: Ae, originX: or, originY: or, originZ: K }, ea = { borderWidth: K, borderTopWidth: K, borderRightWidth: K, borderBottomWidth: K, borderLeftWidth: K, borderRadius: K, borderTopLeftRadius: K, borderTopRightRadius: K, borderBottomRightRadius: K, borderBottomLeftRadius: K, width: K, maxWidth: K, height: K, maxHeight: K, top: K, right: K, bottom: K, left: K, inset: K, insetBlock: K, insetBlockStart: K, insetBlockEnd: K, insetInline: K, insetInlineStart: K, insetInlineEnd: K, padding: K, paddingTop: K, paddingRight: K, paddingBottom: K, paddingLeft: K, paddingBlock: K, paddingBlockStart: K, paddingBlockEnd: K, paddingInline: K, paddingInlineStart: K, paddingInlineEnd: K, margin: K, marginTop: K, marginRight: K, marginBottom: K, marginLeft: K, marginBlock: K, marginBlockStart: K, marginBlockEnd: K, marginInline: K, marginInlineStart: K, marginInlineEnd: K, fontSize: K, backgroundPositionX: K, backgroundPositionY: K, ...Eu, zIndex: kr, fillOpacity: Ae, strokeOpacity: Ae, numOctaves: kr }, Cu = { ...ea, color: ht, backgroundColor: ht, outlineColor: ht, fill: ht, stroke: ht, borderColor: ht, borderTopColor: ht, borderRightColor: ht, borderBottomColor: ht, borderLeftColor: ht, filter: fn, WebkitFilter: fn, mask: yn, WebkitMask: yn }, _o = (e) => Cu[e], Iu = /* @__PURE__ */ new Set([fn, yn]);
function Ao(e, a) {
  let s = _o(e);
  return Iu.has(s) || (s = Et), s.getAnimatableNone ? s.getAnimatableNone(a) : void 0;
}
var Ou = /* @__PURE__ */ new Set(["auto", "none", "0"]);
function ju(e, a, s) {
  let i = 0, n;
  for (; i < e.length && !n; ) {
    let c = e[i];
    typeof c == "string" && !Ou.has(c) && oe(c).values.length && (n = e[i]), i++;
  }
  if (n && s) for (let c of a) e[c] = Ao(s, n);
}
var Su = class extends Bn {
  constructor(e, a, s, i, n) {
    super(e, a, s, i, n, !0);
  }
  readKeyframes() {
    let { unresolvedKeyframes: e, element: a, name: s } = this;
    if (!a || !a.current) return;
    super.readKeyframes();
    for (let t = 0; t < e.length; t++) {
      let r = e[t];
      if (typeof r == "string" && (r = r.trim(), Cn(r))) {
        let l = vo(r, a.current);
        l !== void 0 && (e[t] = l), t === e.length - 1 && (this.finalKeyframe = r);
      }
    }
    if (this.resolveNoneKeyframes(), !go.has(s) || e.length !== 2) return;
    let [i, n] = e, c = wr(i), d = wr(n), u = ir(i), p = ir(n);
    if (u !== p && Yt[s]) {
      this.needsMeasurement = !0;
      return;
    }
    if (c !== d) if (pr(c) && pr(d)) for (let t = 0; t < e.length; t++) {
      let r = e[t];
      typeof r == "string" && (e[t] = parseFloat(r));
    }
    else Yt[s] && (this.needsMeasurement = !0);
  }
  resolveNoneKeyframes() {
    let { unresolvedKeyframes: e, name: a } = this, s = [];
    for (let i = 0; i < e.length; i++) (e[i] === null || Au(e[i])) && s.push(i);
    s.length && ju(e, s, a);
  }
  measureInitialState() {
    let { element: e, unresolvedKeyframes: a, name: s } = this;
    if (!e || !e.current) return;
    s === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = Yt[s](e.measureViewportBox(), window.getComputedStyle(e.current)), a[0] = this.measuredOrigin;
    let i = a[a.length - 1];
    i !== void 0 && e.getValue(s, i).jump(i, !1);
  }
  measureEndState() {
    let { element: e, name: a, unresolvedKeyframes: s } = this;
    if (!e || !e.current) return;
    let i = e.getValue(a);
    i && i.jump(this.measuredOrigin, !1);
    let n = s.length - 1, c = s[n];
    s[n] = Yt[a](e.measureViewportBox(), window.getComputedStyle(e.current)), c !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = c), this.removedTransforms?.length && this.removedTransforms.forEach(([d, u]) => {
      e.getValue(d).set(u);
    }), this.resolveNoneKeyframes();
  }
}, vn = (e, a) => a && typeof e == "number" ? a.transform(e) : e, { schedule: Tu } = qi(queueMicrotask, !1), Bu = [...Lo, ht, Et], Du = (e) => Bu.find(Mo(e)), xr = () => ({ min: 0, max: 0 }), bo = () => ({ x: xr(), y: xr() }), zu = /* @__PURE__ */ new WeakMap();
function la(e) {
  return e !== null && typeof e == "object" && typeof e.start == "function";
}
function be(e) {
  return typeof e == "string" || Array.isArray(e);
}
var Vn = ["animate", "whileInView", "whileFocus", "whileHover", "whileTap", "whileDrag", "exit"], Rn = ["initial", ...Vn];
function ca(e) {
  return la(e.animate) || Rn.some((a) => be(e[a]));
}
function No(e) {
  return !!(ca(e) || e.variants);
}
function Wu(e, a, s) {
  for (let i in a) {
    let n = a[i], c = s[i];
    if (vt(n)) e.addValue(i, n);
    else if (vt(c)) e.addValue(i, ta(n, { owner: e }));
    else if (c !== n) if (e.hasValue(i)) {
      let d = e.getValue(i);
      d.liveStyle === !0 ? d.jump(n) : d.hasAnimated || d.set(n);
    } else {
      let d = e.getStaticValue(i);
      e.addValue(i, ta(d !== void 0 ? d : n, { owner: e }));
    }
  }
  for (let i in s) a[i] === void 0 && e.removeValue(i);
  return a;
}
var aa = { current: null }, Pn = { current: !1 }, Vu = typeof window < "u";
function $o() {
  if (Pn.current = !0, !!Vu) if (window.matchMedia) {
    let e = window.matchMedia("(prefers-reduced-motion)"), a = () => aa.current = e.matches;
    e.addEventListener("change", a), a();
  } else aa.current = !1;
}
var Mr = ["AnimationStart", "AnimationComplete", "Update", "BeforeLayoutMeasure", "LayoutMeasure", "LayoutAnimationStart", "LayoutAnimationComplete"], na = {};
function Eo(e) {
  na = e;
}
function Ru() {
  return na;
}
var Pu = class {
  scrapeMotionValuesFromProps(e, a, s) {
    return {};
  }
  constructor({ parent: e, props: a, presenceContext: s, reducedMotionConfig: i, skipAnimations: n, blockInitialAnimation: c, visualState: d }, u = {}) {
    this.current = null, this.children = /* @__PURE__ */ new Set(), this.isVariantNode = !1, this.isControllingVariants = !1, this.shouldReduceMotion = null, this.shouldSkipAnimations = !1, this.values = /* @__PURE__ */ new Map(), this.KeyframeResolver = Bn, this.features = {}, this.valueSubscriptions = /* @__PURE__ */ new Map(), this.prevMotionValues = {}, this.hasBeenMounted = !1, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
      this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
    }, this.renderScheduledAt = 0, this.scheduleRender = () => {
      let h = Lt.now();
      this.renderScheduledAt < h && (this.renderScheduledAt = h, jt.render(this.render, !1, !0));
    };
    let { latestValues: p, renderState: t } = d;
    this.latestValues = p, this.baseTarget = { ...p }, this.initialValues = a.initial ? { ...p } : {}, this.renderState = t, this.parent = e, this.props = a, this.presenceContext = s, this.depth = e ? e.depth + 1 : 0, this.reducedMotionConfig = i, this.skipAnimationsConfig = n, this.options = u, this.blockInitialAnimation = !!c, this.isControllingVariants = ca(a), this.isVariantNode = No(a), this.isVariantNode && (this.variantChildren = /* @__PURE__ */ new Set()), this.manuallyAnimateOnMount = !!(e && e.current);
    let { willChange: r, ...l } = this.scrapeMotionValuesFromProps(a, {}, this);
    for (let h in l) {
      let f = l[h];
      p[h] !== void 0 && vt(f) && f.set(p[h]);
    }
  }
  mount(e) {
    if (this.hasBeenMounted) for (let a in this.initialValues) this.values.get(a)?.jump(this.initialValues[a]), this.latestValues[a] = this.initialValues[a];
    this.current = e, zu.set(e, this), this.projection && !this.projection.instance && this.projection.mount(e), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((a, s) => this.bindToMotionValue(s, a)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = !1 : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = !0 : (Pn.current || $o(), this.shouldReduceMotion = aa.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? !1, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = !0;
  }
  unmount() {
    this.projection && this.projection.unmount(), Ja(this.notifyUpdate), Ja(this.render), this.valueSubscriptions.forEach((e) => e()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
    for (let e in this.events) this.events[e].clear();
    for (let e in this.features) {
      let a = this.features[e];
      a && (a.unmount(), a.isMounted = !1);
    }
    this.current = null;
  }
  addChild(e) {
    this.children.add(e), this.enteringChildren ?? (this.enteringChildren = /* @__PURE__ */ new Set()), this.enteringChildren.add(e);
  }
  removeChild(e) {
    this.children.delete(e), this.enteringChildren && this.enteringChildren.delete(e);
  }
  bindToMotionValue(e, a) {
    if (this.valueSubscriptions.has(e) && this.valueSubscriptions.get(e)(), a.accelerate && ho.has(e) && this.current instanceof HTMLElement) {
      let { factory: c, keyframes: d, times: u, ease: p, duration: t } = a.accelerate, r = new uo({ element: this.current, name: e, keyframes: d, times: u, ease: p, duration: $t(t) }), l = c(r);
      this.valueSubscriptions.set(e, () => {
        l(), r.cancel();
      });
      return;
    }
    let s = me.has(e);
    s && this.onBindTransform && this.onBindTransform();
    let i = a.on("change", (c) => {
      this.latestValues[e] = c, this.props.onUpdate && jt.preRender(this.notifyUpdate), s && this.projection && (this.projection.isTransformDirty = !0), this.scheduleRender();
    }), n;
    typeof window < "u" && window.MotionCheckAppearSync && (n = window.MotionCheckAppearSync(this, e, a)), this.valueSubscriptions.set(e, () => {
      i(), n && n();
    });
  }
  sortNodePosition(e) {
    return !this.current || !this.sortInstanceNodePosition || this.type !== e.type ? 0 : this.sortInstanceNodePosition(this.current, e.current);
  }
  updateFeatures() {
    let e = "animation";
    for (e in na) {
      let a = na[e];
      if (!a) continue;
      let { isEnabled: s, Feature: i } = a;
      if (!this.features[e] && i && s(this.props) && (this.features[e] = new i(this)), this.features[e]) {
        let n = this.features[e];
        n.isMounted ? n.update() : (n.mount(), n.isMounted = !0);
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  measureViewportBox() {
    return this.current ? this.measureInstanceViewportBox(this.current, this.props) : bo();
  }
  getStaticValue(e) {
    return this.latestValues[e];
  }
  setStaticValue(e, a) {
    this.latestValues[e] = a;
  }
  update(e, a) {
    (e.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = e, this.prevPresenceContext = this.presenceContext, this.presenceContext = a;
    for (let s = 0; s < Mr.length; s++) {
      let i = Mr[s];
      this.propEventSubscriptions[i] && (this.propEventSubscriptions[i](), delete this.propEventSubscriptions[i]);
      let n = "on" + i, c = e[n];
      c && (this.propEventSubscriptions[i] = this.on(i, c));
    }
    this.prevMotionValues = Wu(this, this.scrapeMotionValuesFromProps(e, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
  }
  getProps() {
    return this.props;
  }
  getVariant(e) {
    return this.props.variants ? this.props.variants[e] : void 0;
  }
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  addVariantChild(e) {
    let a = this.getClosestVariantNode();
    if (a) return a.variantChildren && a.variantChildren.add(e), () => a.variantChildren.delete(e);
  }
  addValue(e, a) {
    let s = this.values.get(e);
    a !== s && (s && this.removeValue(e), this.bindToMotionValue(e, a), this.values.set(e, a), this.latestValues[e] = a.get());
  }
  removeValue(e) {
    this.values.delete(e);
    let a = this.valueSubscriptions.get(e);
    a && (a(), this.valueSubscriptions.delete(e)), delete this.latestValues[e], this.removeValueFromRenderState(e, this.renderState);
  }
  hasValue(e) {
    return this.values.has(e);
  }
  getValue(e, a) {
    if (this.props.values && this.props.values[e]) return this.props.values[e];
    let s = this.values.get(e);
    return s === void 0 && a !== void 0 && (s = ta(a === null ? void 0 : a, { owner: this }), this.addValue(e, s)), s;
  }
  readValue(e, a) {
    let s = this.latestValues[e] !== void 0 || !this.current ? this.latestValues[e] : this.getBaseTargetFromProps(this.props, e) ?? this.readValueFromInstance(this.current, e, this.options);
    return s != null && (typeof s == "string" && (Ci(s) || Ii(s)) ? s = parseFloat(s) : !Du(s) && Et.test(a) && (s = Ao(e, a)), this.setBaseTarget(e, vt(s) ? s.get() : s)), vt(s) ? s.get() : s;
  }
  setBaseTarget(e, a) {
    this.baseTarget[e] = a;
  }
  getBaseTarget(e) {
    let { initial: a } = this.props, s;
    if (typeof a == "string" || typeof a == "object") {
      let n = Dn(this.props, a, this.presenceContext?.custom);
      n && (s = n[e]);
    }
    if (a && s !== void 0) return s;
    let i = this.getBaseTargetFromProps(this.props, e);
    return i !== void 0 && !vt(i) ? i : this.initialValues[e] !== void 0 && s === void 0 ? void 0 : this.baseTarget[e];
  }
  on(e, a) {
    return this.events[e] || (this.events[e] = new Si()), this.events[e].add(a);
  }
  notify(e, ...a) {
    this.events[e] && this.events[e].notify(...a);
  }
  scheduleRenderMicrotask() {
    Tu.render(this.render);
  }
}, Co = class extends Pu {
  constructor() {
    super(...arguments), this.KeyframeResolver = Su;
  }
  sortInstanceNodePosition(e, a) {
    return e.compareDocumentPosition(a) & 2 ? 1 : -1;
  }
  getBaseTargetFromProps(e, a) {
    let s = e.style;
    return s ? s[a] : void 0;
  }
  removeValueFromRenderState(e, { vars: a, style: s }) {
    delete a[e], delete s[e];
  }
  handleChildMotionValue() {
    this.childSubscription && (this.childSubscription(), delete this.childSubscription);
    let { children: e } = this.props;
    vt(e) && (this.childSubscription = e.on("change", (a) => {
      this.current && (this.current.textContent = `${a}`);
    }));
  }
}, Io = class {
  constructor(e) {
    this.isMounted = !1, this.node = e;
  }
  update() {
  }
};
function Fu({ top: e, left: a, right: s, bottom: i }) {
  return { x: { min: a, max: s }, y: { min: e, max: i } };
}
function Hu(e, a) {
  if (!a) return e;
  let s = a({ x: e.left, y: e.top }), i = a({ x: e.right, y: e.bottom });
  return { top: s.y, left: s.x, bottom: i.y, right: i.x };
}
function qu(e, a) {
  return Fu(Hu(e.getBoundingClientRect(), a));
}
var Yu = { x: "translateX", y: "translateY", z: "translateZ", transformPerspective: "perspective" }, Xu = ue.length;
function Uu(e, a, s) {
  let i = "", n = !0;
  for (let d = 0; d < Xu; d++) {
    let u = ue[d], p = e[u];
    if (p === void 0) continue;
    let t = !0;
    if (typeof p == "number") t = p === (u.startsWith("scale") ? 1 : 0);
    else {
      let r = parseFloat(p);
      t = u.startsWith("scale") ? r === 1 : r === 0;
    }
    if (!t || s) {
      let r = vn(p, ea[u]);
      if (!t) {
        n = !1;
        let l = Yu[u] || u;
        i += `${l}(${r}) `;
      }
      s && (a[u] = r);
    }
  }
  let c = e.pathRotation;
  return c && (n = !1, i += `rotate(${vn(c, ea.pathRotation)}) `), i = i.trim(), s ? i = s(a, n ? "" : i) : n && (i = "none"), i;
}
function Fn(e, a, s) {
  let { style: i, vars: n, transformOrigin: c } = e, d = !1, u = !1;
  for (let p in a) {
    let t = a[p];
    if (me.has(p)) {
      d = !0;
      continue;
    } else if (Xi(p)) {
      n[p] = t;
      continue;
    } else {
      let r = vn(t, ea[p]);
      p.startsWith("origin") ? (u = !0, c[p] = r) : i[p] = r;
    }
  }
  if (a.transform || (d || s ? i.transform = Uu(a, e.transform, s) : i.transform && (i.transform = "none")), u) {
    let { originX: p = "50%", originY: t = "50%", originZ: r = 0 } = c;
    i.transformOrigin = `${p} ${t} ${r}`;
  }
}
function Oo(e, { style: a, vars: s }, i, n) {
  let c = e.style, d;
  for (d in a) c[d] = a[d];
  n?.applyProjectionStyles(c, i);
  for (d in s) c.setProperty(d, s[d]);
}
function Lr(e, a) {
  return a.max === a.min ? 0 : e / (a.max - a.min) * 100;
}
var ke = { correct: (e, a) => {
  if (!a.target) return e;
  if (typeof e == "string") if (K.test(e)) e = parseFloat(e);
  else return e;
  let s = Lr(e, a.target.x), i = Lr(e, a.target.y);
  return `${s}% ${i}%`;
} }, Ku = { correct: (e, { treeScale: a, projectionDelta: s }) => {
  let i = e, n = Et.parse(e);
  if (n.length > 5) return i;
  let c = Et.createTransformer(e), d = typeof n[0] != "number" ? 1 : 0, u = s.x.scale * a.x, p = s.y.scale * a.y;
  n[0 + d] /= u, n[1 + d] /= p;
  let t = Ce(u, p, 0.5);
  return typeof n[2 + d] == "number" && (n[2 + d] /= t), typeof n[3 + d] == "number" && (n[3 + d] /= t), c(n);
} }, Gu = { borderRadius: { ...ke, applyTo: ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"] }, borderTopLeftRadius: ke, borderTopRightRadius: ke, borderBottomLeftRadius: ke, borderBottomRightRadius: ke, boxShadow: Ku };
function jo(e, { layout: a, layoutId: s }) {
  return me.has(e) || e.startsWith("origin") || (a || s !== void 0) && (!!Gu[e] || e === "opacity");
}
function Hn(e, a, s) {
  let i = e.style, n = a?.style, c = {};
  if (!i) return c;
  for (let d in i) (vt(i[d]) || n && vt(n[d]) || jo(d, e) || s?.getValue(d)?.liveStyle !== void 0) && (c[d] = i[d]);
  return c;
}
function Zu(e) {
  return window.getComputedStyle(e);
}
var Qu = class extends Co {
  constructor() {
    super(...arguments), this.type = "html", this.renderInstance = Oo;
  }
  readValueFromInstance(e, a) {
    if (me.has(a)) return this.projection?.isProjecting ? sn(a) : Tc(e, a);
    {
      let s = Zu(e), i = (Xi(a) ? s.getPropertyValue(a) : s[a]) || 0;
      return typeof i == "string" ? i.trim() : i;
    }
  }
  measureInstanceViewportBox(e, { transformPagePoint: a }) {
    return qu(e, a);
  }
  build(e, a, s) {
    Fn(e, a, s.transformTemplate);
  }
  scrapeMotionValuesFromProps(e, a, s) {
    return Hn(e, a, s);
  }
}, Ju = { offset: "stroke-dashoffset", array: "stroke-dasharray" }, tm = { offset: "strokeDashoffset", array: "strokeDasharray" };
function em(e, a, s = 1, i = 0, n = !0) {
  e.pathLength = 1;
  let c = n ? Ju : tm;
  e[c.offset] = `${-i}`, e[c.array] = `${a} ${s}`;
}
var am = ["offsetDistance", "offsetPath", "offsetRotate", "offsetAnchor"];
function So(e, { attrX: a, attrY: s, attrScale: i, pathLength: n, pathSpacing: c = 1, pathOffset: d = 0, ...u }, p, t, r) {
  if (Fn(e, u, t), p) {
    e.style.viewBox && (e.attrs.viewBox = e.style.viewBox);
    return;
  }
  e.attrs = e.style, e.style = {};
  let { attrs: l, style: h } = e;
  l.transform && (h.transform = l.transform, delete l.transform), (h.transform || l.transformOrigin) && (h.transformOrigin = l.transformOrigin ?? "50% 50%", delete l.transformOrigin), h.transform && (h.transformBox = r?.transformBox ?? "fill-box", delete l.transformBox);
  for (let f of am) l[f] !== void 0 && (h[f] = l[f], delete l[f]);
  a !== void 0 && (l.x = a), s !== void 0 && (l.y = s), i !== void 0 && (l.scale = i), n !== void 0 && em(l, n, c, d, !1);
}
var To = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues", "viewBox", "gradientTransform", "pathLength", "startOffset", "textLength", "lengthAdjust"]), Bo = (e) => typeof e == "string" && e.toLowerCase() === "svg";
function nm(e, a, s, i) {
  Oo(e, a, void 0, i);
  for (let n in a.attrs) e.setAttribute(To.has(n) ? n : Wn(n), a.attrs[n]);
}
function Do(e, a, s) {
  let i = Hn(e, a, s);
  for (let n in e) if (vt(e[n]) || vt(a[n])) {
    let c = ue.indexOf(n) !== -1 ? "attr" + n.charAt(0).toUpperCase() + n.substring(1) : n;
    i[c] = e[n];
  }
  return i;
}
var rm = class extends Co {
  constructor() {
    super(...arguments), this.type = "svg", this.isSVGTag = !1, this.measureInstanceViewportBox = bo;
  }
  getBaseTargetFromProps(e, a) {
    return e[a];
  }
  readValueFromInstance(e, a) {
    if (me.has(a)) {
      let s = _o(a);
      return s && s.default || 0;
    }
    return a = To.has(a) ? a : Wn(a), e.getAttribute(a);
  }
  scrapeMotionValuesFromProps(e, a, s) {
    return Do(e, a, s);
  }
  build(e, a, s) {
    So(e, a, this.isSVGTag, s.transformTemplate, s.style);
  }
  renderInstance(e, a, s, i) {
    nm(e, a, s, i);
  }
  mount(e) {
    this.isSVGTag = Bo(e.tagName), super.mount(e);
  }
}, im = Rn.length;
function zo(e) {
  if (!e) return;
  if (!e.isControllingVariants) {
    let s = e.parent ? zo(e.parent) || {} : {};
    return e.props.initial !== void 0 && (s.initial = e.props.initial), s;
  }
  let a = {};
  for (let s = 0; s < im; s++) {
    let i = Rn[s], n = e.props[i];
    (be(n) || n === !1) && (a[i] = n);
  }
  return a;
}
function Wo(e, a) {
  if (!Array.isArray(a)) return !1;
  let s = a.length;
  if (s !== e.length) return !1;
  for (let i = 0; i < s; i++) if (a[i] !== e[i]) return !1;
  return !0;
}
var om = [...Vn].reverse(), sm = Vn.length;
function lm(e) {
  return (a) => Promise.all(a.map(({ animation: s, options: i }) => xo(e, s, i)));
}
function cm(e) {
  let a = lm(e), s = _r(), i = !0, n = !1, c = (t) => (r, l) => {
    let h = te(e, l, t === "exit" ? e.presenceContext?.custom : void 0);
    if (h) {
      let { transition: f, transitionEnd: y, ...g } = h;
      r = { ...r, ...g, ...y };
    }
    return r;
  };
  function d(t) {
    a = t(e);
  }
  function u(t) {
    let { props: r } = e, l = zo(e.parent) || {}, h = [], f = /* @__PURE__ */ new Set(), y = {}, g = 1 / 0;
    for (let w = 0; w < sm; w++) {
      let L = om[w], N = s[L], T = r[L] !== void 0 ? r[L] : l[L], Y = be(T), G = L === t ? N.isActive : null;
      G === !1 && (g = w);
      let Z = T === l[L] && T !== r[L] && Y;
      if (Z && (i || n) && e.manuallyAnimateOnMount && (Z = !1), N.protectedKeys = { ...y }, !N.isActive && G === null || !T && !N.prevProp || la(T) || typeof T == "boolean") continue;
      if (L === "exit" && N.isActive && G !== !0) {
        N.prevResolvedValues && (y = { ...y, ...N.prevResolvedValues });
        continue;
      }
      let tt = um(N.prevProp, T), ot = tt || L === t && N.isActive && !Z && Y || w > g && Y, nt = !1, lt = Array.isArray(T) ? T : [T], ft = lt.reduce(c(L), {});
      G === !1 && (ft = {});
      let { prevResolvedValues: xt = {} } = N, st = { ...xt, ...ft }, wt = (ct) => {
        ot = !0, f.has(ct) && (nt = !0, f.delete(ct)), N.needsAnimating[ct] = !0;
        let dt = e.getValue(ct);
        dt && (dt.liveStyle = !1);
      };
      for (let ct in st) {
        let dt = ft[ct], At = xt[ct];
        if (y.hasOwnProperty(ct)) continue;
        let kt = !1;
        hn(dt) && hn(At) ? kt = !Wo(dt, At) || tt : kt = dt !== At, kt ? dt != null ? wt(ct) : f.add(ct) : dt !== void 0 && f.has(ct) ? wt(ct) : N.protectedKeys[ct] = !0;
      }
      N.prevProp = T, N.prevResolvedValues = ft, N.isActive && (y = { ...y, ...ft }), (i || n) && e.blockInitialAnimation && (ot = !1);
      let X = Z && tt;
      ot && (!X || nt) && h.push(...lt.map((ct) => {
        let dt = { type: L };
        if (typeof ct == "string" && (i || n) && !X && e.manuallyAnimateOnMount && e.parent) {
          let { parent: At } = e, kt = te(At, ct);
          if (At.enteringChildren && kt) {
            let { delayChildren: de } = kt.transition || {};
            dt.delay = po(At.enteringChildren, e, de);
          }
        }
        return { animation: ct, options: dt };
      }));
    }
    if (f.size) {
      let w = {};
      if (typeof r.initial != "boolean") {
        let L = te(e, Array.isArray(r.initial) ? r.initial[0] : r.initial);
        L && L.transition && (w.transition = L.transition);
      }
      f.forEach((L) => {
        let N = e.getBaseTarget(L), T = e.getValue(L);
        T && (T.liveStyle = !0), w[L] = N ?? null;
      }), h.push({ animation: w });
    }
    let v = !!h.length;
    return i && (r.initial === !1 || r.initial === r.animate) && !e.manuallyAnimateOnMount && (v = !1), i = !1, n = !1, v ? a(h) : Promise.resolve();
  }
  function p(t, r) {
    if (s[t].isActive === r) return Promise.resolve();
    e.variantChildren?.forEach((h) => h.animationState?.setActive(t, r)), s[t].isActive = r;
    let l = u(t);
    for (let h in s) s[h].protectedKeys = {};
    return l;
  }
  return { animateChanges: u, setActive: p, setAnimateFunction: d, getState: () => s, reset: () => {
    s = _r(), n = !0;
  } };
}
function um(e, a) {
  return typeof a == "string" ? a !== e : Array.isArray(a) ? !Wo(a, e) : !1;
}
function Kt(e = !1) {
  return { isActive: e, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function _r() {
  return { animate: Kt(!0), whileInView: Kt(), whileHover: Kt(), whileTap: Kt(), whileDrag: Kt(), whileFocus: Kt(), exit: Kt() };
}
function mm(e) {
  return vt(e) ? e.get() : e;
}
var Ar = { animation: ["animate", "variants", "whileHover", "whileTap", "exit", "whileInView", "whileFocus", "whileDrag"], exit: ["exit"], drag: ["drag", "dragControls"], focus: ["whileFocus"], hover: ["whileHover", "onHoverStart", "onHoverEnd"], tap: ["whileTap", "onTap", "onTapStart", "onTapCancel"], pan: ["onPan", "onPanStart", "onPanSessionStart", "onPanEnd"], inView: ["whileInView", "onViewportEnter", "onViewportLeave"], layout: ["layout", "layoutId"] }, br = !1;
function dm() {
  if (br) return;
  let e = {};
  for (let a in Ar) e[a] = { isEnabled: (s) => Ar[a].some((i) => !!s[i]) };
  Eo(e), br = !0;
}
function Vo() {
  return dm(), Ru();
}
function gn(e) {
  let a = Vo();
  for (let s in e) a[s] = { ...a[s], ...e[s] };
  Eo(a);
}
function I({ children: e, features: a, strict: s = !1 }) {
  let [, i] = ki(!Ma(a)), n = b(void 0);
  if (!Ma(a)) {
    let { renderer: c, ...d } = a;
    n.current = c, gn(d);
  }
  return oa(() => {
    Ma(a) && a().then(({ renderer: c, ...d }) => {
      gn(d), n.current = c, i(!0);
    });
  }, []), o(An.Provider, { value: { renderer: n.current, strict: s }, children: e });
}
function Ma(e) {
  return typeof e == "function";
}
var hm = se({}), Ro = se({ transformPagePoint: (e) => e, isStatic: !1, reducedMotion: "never" }), ua = se({});
function pm(e, a) {
  if (ca(e)) {
    let { initial: s, animate: i } = e;
    return { initial: s === !1 || be(s) ? s : void 0, animate: be(i) ? i : void 0 };
  }
  return e.inherit !== !1 ? a : {};
}
function fm(e) {
  let { initial: a, animate: s } = pm(e, bt(ua));
  return Ot(() => ({ initial: a, animate: s }), [Nr(a), Nr(s)]);
}
function Nr(e) {
  return Array.isArray(e) ? e.join(" ") : e;
}
var qn = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} });
function Po(e, a, s) {
  for (let i in a) !vt(a[i]) && !jo(i, s) && (e[i] = a[i]);
}
function ym({ transformTemplate: e }, a) {
  return Ot(() => {
    let s = qn();
    return Fn(s, a, e), Object.assign({}, s.vars, s.style);
  }, [a]);
}
function vm(e, a) {
  let s = e.style || {}, i = {};
  return Po(i, s, e), Object.assign(i, ym(e, a)), i;
}
function gm(e, a) {
  let s = {}, i = vm(e, a);
  return e.drag && e.dragListener !== !1 && (s.draggable = !1, i.userSelect = i.WebkitUserSelect = i.WebkitTouchCallout = "none", i.touchAction = e.drag === !0 ? "none" : `pan-${e.drag === "x" ? "y" : "x"}`), e.tabIndex === void 0 && (e.onTap || e.onTapStart || e.whileTap) && (s.tabIndex = 0), s.style = i, s;
}
var Fo = () => ({ ...qn(), attrs: {} });
function wm(e, a, s, i) {
  let n = Ot(() => {
    let c = Fo();
    return So(c, a, Bo(i), e.transformTemplate, e.style), { ...c.attrs, style: { ...c.style } };
  }, [a]);
  if (e.style) {
    let c = {};
    Po(c, e.style, e), n.style = { ...c, ...n.style };
  }
  return n;
}
var km = /* @__PURE__ */ new Set(["animate", "exit", "variants", "initial", "style", "values", "variants", "transition", "transformTemplate", "custom", "inherit", "onBeforeLayoutMeasure", "onAnimationStart", "onAnimationComplete", "onUpdate", "onDragStart", "onDrag", "onDragEnd", "onMeasureDragConstraints", "onDirectionLock", "onDragTransitionEnd", "_dragX", "_dragY", "onHoverStart", "onHoverEnd", "onViewportEnter", "onViewportLeave", "globalTapTarget", "propagate", "ignoreStrict", "viewport"]);
function ra(e) {
  return e.startsWith("while") || e.startsWith("drag") && e !== "draggable" || e.startsWith("layout") || e.startsWith("onTap") || e.startsWith("onPan") || e.startsWith("onLayout") || km.has(e);
}
var Ho = (e) => !ra(e);
function xm(e) {
  typeof e == "function" && (Ho = (a) => a.startsWith("on") ? !ra(a) : e(a));
}
try {
  xm(Nl("@emotion/is-prop-valid").default);
} catch {
}
function Mm(e, a, s) {
  let i = {};
  for (let n in e) n === "values" && typeof e.values == "object" || vt(e[n]) || (Ho(n) || s === !0 && ra(n) || !a && !ra(n) || e.draggable && n.startsWith("onDrag")) && (i[n] = e[n]);
  return i;
}
var Lm = ["animate", "circle", "defs", "desc", "ellipse", "g", "image", "line", "filter", "marker", "mask", "metadata", "path", "pattern", "polygon", "polyline", "rect", "stop", "switch", "symbol", "svg", "text", "tspan", "use", "view"];
function Yn(e) {
  return typeof e != "string" || e.includes("-") ? !1 : !!(Lm.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
function _m(e, a, s, { latestValues: i }, n, c = !1, d) {
  let u = (d ?? Yn(e) ? wm : gm)(a, i, n, e), p = Mm(a, typeof e == "string", c), t = e !== xi ? { ...p, ...u, ref: s } : {}, { children: r } = a, l = Ot(() => vt(r) ? r.get() : r, [r]);
  return Li(e, { ...t, children: l });
}
var qo = se(null);
function Yo(e) {
  let a = b(null);
  return a.current === null && (a.current = e()), a.current;
}
function Am({ scrapeMotionValuesFromProps: e, createRenderState: a }, s, i, n) {
  return { latestValues: bm(s, i, n, e), renderState: a() };
}
function bm(e, a, s, i) {
  let n = {}, c = i(e, {});
  for (let h in c) n[h] = mm(c[h]);
  let { initial: d, animate: u } = e, p = ca(e), t = No(e);
  a && t && !p && e.inherit !== !1 && (d === void 0 && (d = a.initial), u === void 0 && (u = a.animate));
  let r = s ? s.initial === !1 : !1;
  r = r || d === !1;
  let l = r ? u : d;
  if (l && typeof l != "boolean" && !la(l)) {
    let h = Array.isArray(l) ? l : [l];
    for (let f = 0; f < h.length; f++) {
      let y = Dn(e, h[f]);
      if (y) {
        let { transitionEnd: g, transition: v, ...w } = y;
        for (let L in w) {
          let N = w[L];
          if (Array.isArray(N)) {
            let T = r ? N.length - 1 : 0;
            N = N[T];
          }
          N !== null && (n[L] = N);
        }
        for (let L in g) n[L] = g[L];
      }
    }
  }
  return n;
}
var Xo = (e) => (a, s) => {
  let i = bt(ua), n = bt(qo), c = () => Am(e, a, i, n);
  return s ? c() : Yo(c);
}, Nm = Xo({ scrapeMotionValuesFromProps: Hn, createRenderState: qn }), $m = Xo({ scrapeMotionValuesFromProps: Do, createRenderState: Fo }), Em = Symbol.for("motionComponentSymbol");
function Cm(e, a, s) {
  let i = b(s);
  Mi(() => {
    i.current = s;
  });
  let n = b(null);
  return x((c) => {
    c && e.onMount?.(c), a && (c ? a.mount(c) : a.unmount());
    let d = i.current;
    if (typeof d == "function") if (c) {
      let u = d(c);
      typeof u == "function" && (n.current = u);
    } else n.current ? (n.current(), n.current = null) : d(c);
    else d && (d.current = c);
  }, [a]);
}
var Im = se({});
function Om(e) {
  return e && typeof e == "object" && Object.prototype.hasOwnProperty.call(e, "current");
}
var jm = typeof window < "u", Uo = jm ? bs : oa;
function Sm(e, a, s, i, n, c) {
  let { visualElement: d } = bt(ua), u = bt(An), p = bt(qo), t = bt(Ro), r = t.reducedMotion, l = t.skipAnimations, h = b(null), f = b(!1);
  i = i || u.renderer, !h.current && i && (h.current = i(e, { visualState: a, parent: d, props: s, presenceContext: p, blockInitialAnimation: p ? p.initial === !1 : !1, reducedMotionConfig: r, skipAnimations: l, isSVG: c }), f.current && h.current && (h.current.manuallyAnimateOnMount = !0));
  let y = h.current, g = bt(Im);
  y && !y.projection && n && (y.type === "html" || y.type === "svg") && Tm(h.current, s, n, g);
  let v = b(!1);
  Mi(() => {
    y && v.current && y.update(s, p);
  });
  let w = s[wo], L = b(!!w && typeof window < "u" && !window.MotionHandoffIsComplete?.(w) && window.MotionHasOptimisedAnimation?.(w));
  return Uo(() => {
    f.current = !0, y && (v.current = !0, window.MotionIsMounted = !0, y.updateFeatures(), y.scheduleRenderMicrotask(), L.current && y.animationState && y.animationState.animateChanges());
  }), oa(() => {
    y && (!L.current && y.animationState && y.animationState.animateChanges(), L.current && (queueMicrotask(() => {
      window.MotionHandoffMarkAsComplete?.(w);
    }), L.current = !1), y.enteringChildren = void 0);
  }), y;
}
function Tm(e, a, s, i) {
  let { layoutId: n, layout: c, drag: d, dragConstraints: u, layoutScroll: p, layoutRoot: t, layoutAnchor: r, layoutCrossfade: l } = a;
  e.projection = new s(e.latestValues, a["data-framer-portal-id"] ? void 0 : Ko(e.parent)), e.projection.setOptions({ layoutId: n, layout: c, alwaysMeasureLayout: !!d || u && Om(u), visualElement: e, animationType: typeof c == "string" ? c : "both", initialPromotionConfig: i, crossfade: l, layoutScroll: p, layoutRoot: t, layoutAnchor: r });
}
function Ko(e) {
  if (e) return e.options.allowProjection !== !1 ? e.projection : Ko(e.parent);
}
function La(e, { forwardMotionProps: a = !1, type: s } = {}, i, n) {
  i && gn(i);
  let c = s ? s === "svg" : Yn(e), d = c ? $m : Nm;
  function u(t, r) {
    let l, h = { ...bt(Ro), ...t, layoutId: Bm(t) }, { isStatic: f } = h, y = fm(t), g = d(t, f);
    if (!f && typeof window < "u") {
      Dm();
      let v = zm(h);
      l = v.MeasureLayout, y.visualElement = Sm(e, g, h, n, v.ProjectionNode, c);
    }
    return A(ua.Provider, { value: y, children: [l && y.visualElement ? o(l, { visualElement: y.visualElement, ...h }) : null, _m(e, t, Cm(g, y.visualElement, r), g, f, a, c)] });
  }
  u.displayName = `motion.${typeof e == "string" ? e : `create(${e.displayName ?? e.name ?? ""})`}`;
  let p = $(u);
  return p[Em] = e, p;
}
function Bm({ layoutId: e }) {
  let a = bt(hm).id;
  return a && e !== void 0 ? a + "-" + e : e;
}
function Dm(e, a) {
  bt(An).strict;
}
function zm(e) {
  let a = Vo(), { drag: s, layout: i } = a;
  if (!s && !i) return {};
  let n = { ...s, ...i };
  return { MeasureLayout: s?.isEnabled(e) || i?.isEnabled(e) ? n.MeasureLayout : void 0, ProjectionNode: n.ProjectionNode };
}
function Wm(e, a) {
  if (typeof Proxy > "u") return La;
  let s = /* @__PURE__ */ new Map(), i = (c, d) => La(c, d, e, a), n = (c, d) => i(c, d);
  return new Proxy(n, { get: (c, d) => d === "create" ? i : (s.has(d) || s.set(d, La(d, void 0, e, a)), s.get(d)) });
}
var m = Wm(), Vm = class extends Io {
  constructor(e) {
    super(e), e.animationState || (e.animationState = cm(e));
  }
  updateAnimationControlsSubscription() {
    let { animate: e } = this.node.getProps();
    la(e) && (this.unmountControls = e.subscribe(this.node));
  }
  mount() {
    this.updateAnimationControlsSubscription();
  }
  update() {
    let { animate: e } = this.node.getProps(), { animate: a } = this.node.prevProps || {};
    e !== a && this.updateAnimationControlsSubscription();
  }
  unmount() {
    this.node.animationState.reset(), this.unmountControls?.();
  }
}, Rm = 0, Pm = class extends Io {
  constructor() {
    super(...arguments), this.id = Rm++, this.isExitComplete = !1;
  }
  update() {
    if (!this.node.presenceContext) return;
    let { isPresent: e, onExitComplete: a } = this.node.presenceContext, { isPresent: s } = this.node.prevPresenceContext || {};
    if (!this.node.animationState || e === s) return;
    if (e && s === !1) {
      if (this.isExitComplete) {
        let { initial: n, custom: c } = this.node.getProps();
        if (typeof n == "string" || typeof n == "object" && n !== null && !Array.isArray(n)) {
          let d = te(this.node, n, c);
          if (d) {
            let { transition: u, transitionEnd: p, ...t } = d;
            for (let r in t) this.node.getValue(r)?.jump(t[r]);
          }
        }
        this.node.animationState.reset(), this.node.animationState.animateChanges();
      } else this.node.animationState.setActive("exit", !1);
      this.isExitComplete = !1;
      return;
    }
    let i = this.node.animationState.setActive("exit", !e);
    a && !e && i.then(() => {
      this.isExitComplete = !0, a(this.id);
    });
  }
  mount() {
    let { register: e, onExitComplete: a } = this.node.presenceContext || {};
    a && a(this.id), e && (this.unmount = e(this.id));
  }
  unmount() {
  }
}, Fm = { animation: { Feature: Vm }, exit: { Feature: Pm } }, Hm = (e, a) => a.isSVG ?? Yn(e) ? new rm(a) : new Qu(a, { allowProjection: e !== xi }), O = { renderer: Hm, ...Fm };
function j() {
  !Pn.current && $o();
  let [e] = ki(aa.current);
  return e;
}
function qm(e) {
  e.values.forEach((a) => a.stop());
}
function wn(e, a) {
  [...a].reverse().forEach((s) => {
    let i = e.getVariant(s);
    i && zn(e, i), e.variantChildren && e.variantChildren.forEach((n) => {
      wn(n, a);
    });
  });
}
function Ym(e, a) {
  if (Array.isArray(a)) return wn(e, a);
  if (typeof a == "string") return wn(e, [a]);
  zn(e, a);
}
function Xm() {
  let e = /* @__PURE__ */ new Set(), a = { subscribe(s) {
    return e.add(s), () => {
      e.delete(s);
    };
  }, start(s, i) {
    let n = [];
    return e.forEach((c) => {
      n.push(xo(c, s, { transitionOverride: i }));
    }), Promise.all(n);
  }, set(s) {
    return e.forEach((i) => {
      Ym(i, s);
    });
  }, stop() {
    e.forEach((s) => {
      qm(s);
    });
  }, mount() {
    return () => {
      a.stop();
    };
  } };
  return a;
}
function Um() {
  let e = Yo(Xm);
  return Uo(e.mount, []), e;
}
var M = Um, Km = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = j(), g = b(!1);
  E(p, () => (g.current = !0, { startAnimation: () => {
    y ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal");
  } }));
  let v = x((Z) => {
    !c || y || (g.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate")));
  }, [t, r, l, h, f, y, e, c]), w = x((Z) => {
    g.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"));
  }, [t, r, l, h, f, a]), L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -1.5, 1, 0], transition: { duration: 0.85 * n, ease: [0.22, 0.9, 0.32, 1] } } }, N = { normal: { pathLength: 1, scale: 1, opacity: 1 }, animate: { pathLength: [0, 1], scale: [1, 1.12, 1], opacity: [0.6, 1, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.06 } } }, T = { normal: { pathLength: 1, opacity: 1, y: 0 }, animate: { pathLength: [0, 1], y: [-6, 0], opacity: [0, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } }, Y = { normal: { x: 0, opacity: 1 }, animate: { x: [-8, 0], opacity: [0, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.02 } } }, G = { normal: { pathLength: 1, opacity: 1, scaleX: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], scaleX: [0.9, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.18 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: v, onMouseLeave: w, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: L, children: [o(m.path, { d: "m14 12 4 4 4-4", initial: "normal", animate: r, variants: N }), o(m.path, { d: "M18 16V7", initial: "normal", animate: l, variants: T }), o(m.path, { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16", initial: "normal", animate: h, variants: Y }), o(m.path, { d: "M3.304 13h6.392", initial: "normal", animate: f, variants: G })] }) }) });
});
Km.displayName = "AArrowDownIcon";
var Gm = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = j(), g = b(!1);
  E(p, () => (g.current = !0, { startAnimation: () => {
    y ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal");
  } }));
  let v = x((Z) => {
    !c || y || (g.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate")));
  }, [t, r, l, h, f, y, e, c]), w = x((Z) => {
    g.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"));
  }, [t, r, l, h, f, a]), L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -1.5, 1, 0], transition: { duration: 0.85 * n, ease: [0.22, 0.9, 0.32, 1] } } }, N = { normal: { pathLength: 1, scale: 1, opacity: 1 }, animate: { pathLength: [0, 1], scale: [1, 1.12, 1], opacity: [0.6, 1, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.06 } } }, T = { normal: { pathLength: 1, opacity: 1, y: 0 }, animate: { pathLength: [0, 1], y: [6, 0], opacity: [0, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } }, Y = { normal: { x: 0, opacity: 1 }, animate: { x: [8, 0], opacity: [0, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.02 } } }, G = { normal: { pathLength: 1, opacity: 1, scaleX: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], scaleX: [0.9, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.18 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: v, onMouseLeave: w, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: L, children: [o(m.path, { d: "m14 11 4-4 4 4", initial: "normal", animate: r, variants: N }), o(m.path, { d: "M18 16V7", initial: "normal", animate: l, variants: T }), o(m.path, { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16", initial: "normal", animate: h, variants: Y }), o(m.path, { d: "M3.304 13h6.392", initial: "normal", animate: f, variants: G })] }) }) });
});
Gm.displayName = "AArrowUpIcon";
var Zm = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: -6, transition: { duration: 0.35, ease: "easeOut" } } }, g = { normal: { rotate: 0 }, animate: { rotate: 360, transition: { duration: 1.4 * n, repeat: 1 / 0, ease: "linear" } } }, v = { normal: { rotate: 0 }, animate: { rotate: -25, transition: { duration: 0.7 * n, ease: "easeInOut", repeat: 1 / 0, repeatType: "mirror" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("circle", { cx: "16", cy: "4", r: "1" }), o("path", { d: "m18 19 1-7-6 1" }), o(m.path, { d: "m5 8 3-3 5.5 3-2.36 3.5", variants: v }), A(m.g, { variants: g, children: [o("path", { d: "M4.24 14.5a5 5 0 0 0 6.88 6" }), o("path", { d: "M13.76 17.5a5 5 0 0 0-6.88-6" })] })] }) }) });
});
Zm.displayName = "AccessibilityIcon";
var Qm = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDasharray: "none", strokeDashoffset: 0, opacity: 1 }, animate: { strokeDasharray: "60 120", strokeDashoffset: [0, -180], transition: { duration: 1.4 * n, ease: "linear", repeat: 1 / 0, repeatType: "loop" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: o(m.path, { d: "M2 12h2.49a2 2 0 0 0 1.92-1.46l2.35-8.36a.25.25 0 0 1 .48 0l5.52 19.64a.25.25 0 0 0 .48 0l2.35-8.36A2 2 0 0 1 19.52 12H22", variants: y }) }) }) });
});
Qm.displayName = "ActivityIcon";
var Jm = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: async () => {
    if (r) {
      t.start("normal");
      return;
    }
    await t.start("tense"), await t.start("shake"), await t.start("flash"), await t.start("calm");
  }, stopAnimation: () => t.start("normal") }));
  let h = x(async (N) => {
    !c || r || (l.current ? e?.(N) : (await t.start("tense"), await t.start("shake"), await t.start("flash"), await t.start("calm")));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, tense: { scale: 0.95, transition: { duration: 0.2 * n, ease: [0.4, 0, 0.6, 1] } }, shake: { rotate: [0, -4, 4, -3, 3, -2, 2, 0], scale: 1, transition: { duration: 0.5 * n, ease: "linear" } }, flash: { scale: [1, 1.1, 1], transition: { duration: 0.3 * n, ease: [0.34, 1.56, 0.64, 1] } }, calm: { rotate: 0, scale: 1, transition: { duration: 0.4 * n, ease: [0.33, 1, 0.68, 1] } } }, g = { normal: { scale: 1 }, tense: { scale: 0.98, transition: { duration: 0.2 * n } }, shake: { scale: 1 }, flash: { scale: [1, 1.02, 1], transition: { duration: 0.3 * n } }, calm: { scale: 1 } }, v = (N) => {
    let T = N === "left" ? -0.5 : 0.5, Y = N === "left" ? 5 : -5;
    return { normal: { x: 0, y: 0, rotate: 0 }, tense: { y: -0.3, rotate: Y * 1.5, transition: { duration: 0.2 * n, ease: "easeOut" } }, shake: { x: [0, T, -T, T, 0], transition: { duration: 0.5 * n } }, flash: { y: -0.5, rotate: Y * 2, transition: { duration: 0.15 * n } }, calm: { x: 0, y: 0, rotate: 0, transition: { duration: 0.4 * n, ease: [0.33, 1, 0.68, 1] } } };
  }, w = { normal: { scaleY: 1 }, tense: { scaleY: 0.6, transition: { duration: 0.2 * n, ease: "easeOut" } }, shake: { scaleY: [0.6, 0.5, 0.6] }, flash: { scaleY: [0.6, 0.3, 0.6], transition: { duration: 0.3 * n } }, calm: { scaleY: 1, transition: { duration: 0.4 * n, ease: [0.33, 1, 0.68, 1] } } }, L = { normal: { scaleX: 1, y: 0 }, tense: { scaleX: 0.9, y: -0.5, transition: { duration: 0.2 * n, ease: "easeOut" } }, shake: { y: [0, -0.3, 0] }, flash: { scaleX: 0.8, y: -0.8, transition: { duration: 0.15 * n } }, calm: { scaleX: 1, y: 0, transition: { duration: 0.4 * n, ease: [0.33, 1, 0.68, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: g }), o(m.path, { d: "M7.5 8 10 9", variants: v("left") }), o(m.path, { d: "m14 9 2.5-1", variants: v("right") }), o(m.path, { d: "M9 10h.01", variants: w }), o(m.path, { d: "M15 10h.01", variants: w }), o(m.path, { d: "M16 16s-1.5-2-4-2-4 2-4 2", variants: L })] }) }) });
});
Jm.displayName = "AngryIcon";
var t1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, x: 0 }, animate: { rotate: [0, -2, 2, 0], x: [0, -0.5, 0.5, 0], transition: { duration: 0.45 * n, ease: "easeOut" } } }, g = { normal: { y: 0 }, animate: { y: [0, 0.5, 0], transition: { duration: 0.3 * n, ease: "easeOut" } } }, v = (L) => ({ normal: { x: 0 }, animate: { x: [0, L, 0], transition: { duration: 0.25 * n, ease: "easeOut" } } }), w = { normal: { scaleX: 1 }, animate: { scaleX: [1, 0.9, 1], transition: { duration: 0.3 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: g }), o(m.path, { d: "M8 9h2", variants: v(-1) }), o(m.path, { d: "M14 9h2", variants: v(1) }), o(m.path, { d: "M8 15h8", variants: w })] }) }) });
});
t1.displayName = "AnnoyedIcon";
var e1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.04, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { y: 0 }, animate: { y: [0, 3, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.5, 1] } } }, v = { normal: { y: 0 }, animate: { y: [0, -3, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.5, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m3 16 4 4 4-4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M7 20V4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m21 8-4-4-4 4", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M17 4v16", variants: v, initial: "normal", animate: t })] }) }) });
});
e1.displayName = "ArrowDownUpIcon";
var a1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.08, 0.96, 1], rotate: [0, -4, 2, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [6, -2, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.8, 1.1, 1], opacity: [0.7, 1, 1], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.2 } } }, L = { normal: { x: 0, opacity: 1 }, animate: { x: [-6, 0], opacity: [0, 1], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m3 8 4-4 4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M7 4v16", variants: v, initial: "normal", animate: t }), o(m.rect, { x: "15", y: "4", width: "4", height: "6", ry: "2", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M17 20v-6h-2", variants: L, initial: "normal", animate: t }), o(m.path, { d: "M15 20h4", variants: L, initial: "normal", animate: t })] }) }) });
});
a1.displayName = "ArrowUp01Icon";
var n1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.08, 0.96, 1], rotate: [0, -4, 2, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [6, -2, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { x: 0, opacity: 1 }, animate: { x: [-6, 0], opacity: [0, 1], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.2 } } }, L = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.8, 1.1, 1], opacity: [0.7, 1, 1], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m3 8 4-4 4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M7 4v16", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M17 10V4h-2", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M15 10h4", variants: w, initial: "normal", animate: t }), o(m.rect, { x: "15", y: "14", width: "4", height: "6", ry: "2", variants: L, initial: "normal", animate: t })] }) }) });
});
n1.displayName = "ArrowUp10Icon";
var r1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, -5, 3, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [6, -2, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1], y: [-4, 0], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.2 } } }, L = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1], x: [6, 0], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m3 8 4-4 4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M7 4v16", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M20 8h-5", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M15 10V6.5a2.5 2.5 0 0 1 5 0V10", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M15 14h5l-5 6h5", variants: L, initial: "normal", animate: t })] }) }) });
});
r1.displayName = "ArrowUpAZIcon";
var i1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, -5, 3, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [6, -2, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1], x: [6, 0], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.2 } } }, L = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1], y: [6, 0], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m3 8 4-4 4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M7 4v16", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M15 4h5l-5 6h5", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M15 20v-3.5a2.5 2.5 0 0 1 5 0V20", variants: L, initial: "normal", animate: t }), o(m.path, { d: "M20 18h-5", variants: L, initial: "normal", animate: t })] }) }) });
});
i1.displayName = "ArrowUpZAIcon";
var o1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1, transition: { duration: 0.3 * n } }, animate: { rotate: 360, scale: [1, 1.1, 1], transition: { duration: 2 * n, ease: "linear", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: [o("circle", { cx: "12", cy: "12", r: "1" }), o("path", { d: "M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" }), o("path", { d: "M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" })] }) }) });
});
o1.displayName = "AtomIcon";
var s1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scaleY: 1, opacity: 1 }, animate: (v) => ({ scaleY: [1, 1.4, 0.6, 1], opacity: [1, 0.8, 1], transition: { duration: 0.9 * n, repeat: 0, delay: v * 0.2, ease: "easeInOut" } }) }, g = ["M2 10v3", "M6 6v11", "M10 3v18", "M14 8v7", "M18 5v13", "M22 10v3"];
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: g.map((v, w) => o(m.path, { d: v, variants: y, custom: w, style: { originY: 0.5 } }, w)) }) }) });
});
s1.displayName = "AudioLinesIcon";
var $r = "M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2", _a = 0.16, l1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("sweep");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((L) => {
    !c || r || (l.current ? e?.(L) : h());
  }, [c, r, h, e]), g = x((L) => {
    l.current ? a?.(L) : f();
  }, [f, a]), v = { rest: { opacity: 1, transition: { duration: 0.26 * n, ease: "easeOut" } }, sweep: { opacity: 0.3, transition: { duration: 0.18 * n, ease: "easeOut" } } }, w = { rest: { pathLength: 1, pathOffset: 0, transition: { duration: 0.28 * n, ease: "easeOut" } }, sweep: { pathLength: [_a, _a], pathOffset: [-_a, 1], transition: { duration: 1.25 * n, ease: "linear", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: $r, animate: t, initial: "rest", variants: v }), o(m.path, { d: $r, animate: t, initial: "rest", variants: w })] }) }) });
});
l1.displayName = "AudioWaveformIcon";
var c1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.02, 1], rotate: [0, 180, 0], transition: { duration: 1.1 * n, ease: "easeInOut" } } }, w = { normal: { strokeDashoffset: 0, scaleY: 1, opacity: 1 }, animate: { strokeDashoffset: [16, 0], scaleY: [1, 1.16, 0.98, 1], opacity: [0.9, 1, 1], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.18 } } }, L = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [80, 0], opacity: [0, 1], transition: { duration: 0.9 * n, ease: [0.22, 0.8, 0.2, 1], delay: 0.32 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z", initial: "normal", animate: t, variants: v, style: { strokeDasharray: 260, transformOrigin: "12px 12px" } }), o(m.path, { d: "M12 7v10", initial: "normal", animate: r, variants: w, style: { strokeDasharray: 16, strokeLinecap: "round", transformOrigin: "12px 12px" } }), o(m.path, { d: "M15.4 10a4 4 0 1 0 0 4", initial: "normal", animate: l, variants: L, style: { strokeDasharray: 80, strokeLinecap: "round" } })] }) }) });
});
c1.displayName = "BadgeCentIcon";
var u1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.02, 1], rotate: [0, 180, 0], transition: { duration: 1.1 * n, ease: "easeInOut" } } }, w = { normal: { strokeDashoffset: 0, scale: 1 }, animate: { strokeDashoffset: [140, 0], scale: [0.96, 1.05, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.25 } } }, L = { normal: { strokeDashoffset: 0, scaleY: 1, opacity: 1 }, animate: { strokeDashoffset: [16, 0], scaleY: [0.9, 1.05, 1], opacity: [0.8, 1], transition: { duration: 0.85 * n, ease: "easeInOut", delay: 0.18 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z", initial: "normal", animate: t, variants: v, style: { strokeDasharray: 260, transformOrigin: "12px 12px" } }), o(m.path, { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8", initial: "normal", animate: r, variants: w, style: { strokeDasharray: 140, strokeLinecap: "round" } }), o(m.path, { d: "M12 18V6", initial: "normal", animate: l, variants: L, style: { strokeDasharray: 20, strokeLinecap: "round" } })] }) }) });
});
u1.displayName = "BadgeDollarIcon";
var m1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.6 * n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { x: 0 }, animate: { x: [0, -2, 2, 0], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, v = { normal: { y: 0 }, animate: { y: [0, -2, 0], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { rotate: 0 }, animate: { rotate: [0, 360], transition: { duration: 0.6 * n, ease: "linear" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: y, children: [o(m.path, { d: "M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2", variants: g }), o(m.path, { d: "M17 14V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v10", variants: v }), o(m.rect, { width: "13", height: "8", x: "8", y: "6", rx: "1", variants: v }), o(m.circle, { cx: "18", cy: "20", r: "2", variants: w }), o(m.circle, { cx: "9", cy: "20", r: "2", variants: w })] }) }) });
});
m1.displayName = "BaggageClaimIcon";
var d1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -2, 2, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 1.5 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, g = { normal: { opacity: 1, scaleY: 1 }, animate: (w) => ({ opacity: [0.4, 1, 0.8], scaleY: [0.6, 1, 0.8], transition: { duration: 1 * n, ease: [0.42, 0, 0.58, 1], repeat: 0, delay: w * 0.25 } }) }, v = { normal: { opacity: 1 }, animate: { opacity: [0.6, 1, 0.7, 1], transition: { duration: 1.2 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M10 10v4", variants: g, custom: 0 }), o(m.path, { d: "M14 10v4", variants: g, custom: 1 }), o(m.path, { d: "M6 10v4", variants: g, custom: 2 }), o(m.rect, { x: "2", y: "6", width: "16", height: "12", rx: "2", variants: v }), o(m.path, { d: "M22 14v-4", variants: v })] }) }) });
});
d1.displayName = "BatteryFullIcon";
var h1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("warning"), r.start("warning"), l.start("warning"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("warning"), r.start("warning"), l.start("warning")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { scale: 1, rotate: 0 }, warning: { scale: [1, 1.05, 1], rotate: [0, -2, 2, 0], transition: { duration: 0.45 * n, ease: "easeInOut" } } }, w = { normal: { pathLength: 1, opacity: 1 }, warning: { pathLength: [0.3, 1], opacity: [0.4, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, L = { normal: { opacity: 1, scale: 1 }, warning: { opacity: [1, 0.2, 1], scale: [1, 1.4, 1], transition: { duration: 0.4 * n, ease: "easeInOut", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: v, children: [o(m.path, { d: "M22 14L22 10", animate: l, initial: "normal", variants: L }), o(m.rect, { x: "2", y: "6", width: "16", height: "12", rx: "2", animate: r, initial: "normal", variants: w })] }) }) });
});
h1.displayName = "BatteryIcon";
var p1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, 7, -18, 14, -9, 5, -2, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1] } } }, g = { normal: { x: 0 }, animate: { x: [0, 1.5, -5, 4, -2.5, 1.5, -1, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1], delay: 0.05 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("relative inline-flex", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, style: { transformOrigin: "top center" }, children: [o(m.path, { d: "M10.268 21a2 2 0 0 0 3.464 0", variants: g }), o("path", { d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" })] }) }) });
});
p1.displayName = "BellIcon";
var f1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, 7, -18, 14, -9, 5, -2, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1] } } }, g = { normal: { x: 0 }, animate: { x: [0, 1.5, -5, 4, -2.5, 1.5, -1, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1], delay: 0.08 * n } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.3, 1.2, 0.94, 1], opacity: [0, 1, 1, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: 0.16 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("relative inline-flex", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", style: { transformOrigin: "top center" }, children: [o(m.path, { d: "M10.268 21a2 2 0 0 0 3.464 0", variants: g }), o(m.path, { d: "M15 8h6", variants: v }), o("path", { d: "M16.243 3.757A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673A9.4 9.4 0 0 1 18.667 12" })] }) }) });
});
f1.displayName = "BellMinusIcon";
var y1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, 7, -18, 14, -9, 5, -2, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1] } } }, g = { normal: { x: 0 }, animate: { x: [0, 1.5, -5, 4, -2.5, 1.5, -1, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1], delay: 0.08 * n } } }, v = { normal: { scale: 1, opacity: 1, rotate: 0 }, animate: { scale: [0.3, 1.2, 0.94, 1], rotate: [-90, 8, 0], opacity: [0, 1, 1, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: 0.16 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("relative inline-flex", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, style: { transformOrigin: "top center" }, children: [o(m.path, { d: "M10.268 21a2 2 0 0 0 3.464 0", variants: g }), o(m.path, { d: "M15 8h6", variants: v, style: { transformOrigin: "18px 8px" } }), o(m.path, { d: "M18 5v6", variants: v, style: { transformOrigin: "18px 8px" } }), o("path", { d: "M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332" })] }) }) });
});
y1.displayName = "BellPlusIcon";
var v1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, 7, -18, 14, -9, 5, -2, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1] } } }, g = { normal: { x: 0 }, animate: { x: [0, 1.5, -5, 4, -2.5, 1.5, -1, 0], transition: { duration: 1.3 * n, ease: "easeInOut", times: [0, 0.09, 0.26, 0.45, 0.62, 0.78, 0.9, 1], delay: 0.08 * n } } }, v = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [0, 1, 0.25, 1, 1], scale: [0.5, 1.15, 0.7, 1.15, 1], transition: { duration: 1.3 * n, ease: "easeOut", times: [0, 0.25, 0.5, 0.75, 1], delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("relative inline-flex", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, style: { transformOrigin: "top center" }, children: [o(m.path, { d: "M10.268 21a2 2 0 0 0 3.464 0", variants: g }), o(m.path, { d: "M22 8c0-2.3-.8-4.3-2-6", variants: v, style: { transformOrigin: "0% 100%" } }), o("path", { d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" }), o(m.path, { d: "M4 2C2.8 3.7 2 5.7 2 8", variants: v, style: { transformOrigin: "100% 100%" } })] }) }) });
});
v1.displayName = "BellRingIcon";
var g1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1, transition: { duration: 0.3 * n } }, animate: { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1.2, 1], transition: { duration: 0.6 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: [o("path", { d: "M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1" }), o("path", { d: "M15 14a5 5 0 0 0-7.584 2" }), o("path", { d: "M9.964 6.825C8.019 7.977 9.5 13 8 15" })] }) }) });
});
g1.displayName = "BicepsFlexedIcon";
var w1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1.4, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0 }, animate: { x: [0, 40, -40, 0], transition: { duration: n, ease: "easeInOut", times: [0, 0.4, 0.401, 1] } } }, g = { normal: { rotate: 0 }, animate: { rotate: 720, transition: { duration: n, ease: "linear" } } }, v = { normal: { rotate: 0 }, animate: { rotate: 720, transition: { duration: n, ease: "linear", delay: 0.06 } } }, w = { normal: { rotate: 0 }, animate: { rotate: 720, transition: { duration: n, ease: "linear" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center overflow-hidden", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.g, { variants: g, style: { transformOrigin: "5.5px 17.5px" }, initial: "normal", animate: t, children: o("circle", { cx: "5.5", cy: "17.5", r: "3.5" }) }), o(m.g, { variants: v, style: { transformOrigin: "18.5px 17.5px" }, initial: "normal", animate: t, children: o("circle", { cx: "18.5", cy: "17.5", r: "3.5" }) }), o(m.g, { variants: w, style: { transformOrigin: "12px 14px" }, initial: "normal", animate: t, children: o("circle", { cx: "12", cy: "14", r: "0.8" }) }), o("circle", { cx: "15", cy: "5", r: "1" }), o("path", { d: "M12 17.5V14l-3-3 4-3 2 3h2" })] }) }) });
});
w1.displayName = "BikeIcon";
var k1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.055, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = (w, L = 0.6) => ({ normal: { pathLength: 0, opacity: 1 }, animate: { pathLength: 1, opacity: 1, transition: { duration: L, ease: "easeInOut", delay: w } } }), v = (w) => ({ normal: { scale: 0.6, opacity: 0 }, animate: { scale: [0.6, 1.25, 1], opacity: [0, 0.9, 0], transition: { duration: 0.35 * n, ease: "easeOut", delay: w } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-bitcoin-icon lucide-bitcoin", children: A(m.g, { variants: y, initial: "normal", animate: t, children: [A("g", { children: [o("path", { d: "M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894" }), o("path", { d: "M10.551 19.089L5.86 18.047" }), o("path", { d: "M10.551 19.089l-.347 1.97" }), o("path", { d: "M12.114 12.195c4.924.869 6.14-6.025 1.215-6.893" }), o("path", { d: "M12.114 12.195l-3.94-.694" }), o("path", { d: "M13.329 5.301L8.29 4.26" }), o("path", { d: "M14.198 5.302l.348-1.97" }), o("path", { d: "M7.48 20.364l3.126-17.727" })] }), o(m.path, { d: "M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894", pathLength: 1, variants: g(0.06, 0.55), initial: "normal", animate: t }), o(m.path, { d: "M10.551 19.089L5.86 18.047", pathLength: 1, variants: g(0.12, 0.45), initial: "normal", animate: t }), o(m.path, { d: "M10.551 19.089l-.347 1.97", pathLength: 1, variants: g(0.18, 0.4), initial: "normal", animate: t }), o(m.path, { d: "M12.114 12.195c4.924.869 6.14-6.025 1.215-6.893", pathLength: 1, variants: g(0.26, 0.6), initial: "normal", animate: t }), o(m.path, { d: "M12.114 12.195l-3.94-.694", pathLength: 1, variants: g(0.32, 0.45), initial: "normal", animate: t }), o(m.path, { d: "M13.329 5.301L8.29 4.26", pathLength: 1, variants: g(0.4, 0.45), initial: "normal", animate: t }), o(m.path, { d: "M14.198 5.302l.348-1.97", pathLength: 1, variants: g(0.46, 0.4), initial: "normal", animate: t }), o(m.path, { d: "M7.48 20.364l3.126-17.727", pathLength: 1, variants: g(0.54, 0.75), initial: "normal", animate: t }), o(m.circle, { cx: "12.2", cy: "12.2", r: "0.9", fill: "currentColor", variants: v(0.28), initial: "normal", animate: t }), o(m.circle, { cx: "10.6", cy: "19.1", r: "0.8", fill: "currentColor", variants: v(0.16), initial: "normal", animate: t }), o(m.circle, { cx: "14.3", cy: "5.3", r: "0.7", fill: "currentColor", variants: v(0.48), initial: "normal", animate: t })] }) }) }) });
});
k1.displayName = "BitcoinIcon";
var x1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -1.5, 1.5, 0], scale: [1, 1.02, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { strokeDashoffset: 0, opacity: 1, x: 0 }, animate: { strokeDashoffset: [48, 0], opacity: [0.45, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 1, x: 0 }, animate: { strokeDashoffset: [48, 0], opacity: [0.45, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.09 } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.06, 1], opacity: [0.9, 1, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.25 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-blend-icon lucide-blend", children: A(m.g, { variants: y, initial: "normal", animate: t, children: [o(m.circle, { cx: "9", cy: "9", r: "7", strokeDasharray: "48", strokeDashoffset: "48", variants: g, initial: "normal", animate: t }), o(m.g, { variants: w, initial: "normal", animate: t, children: o(m.circle, { cx: "15", cy: "15", r: "7", strokeDasharray: "48", strokeDashoffset: "48", variants: v, initial: "normal", animate: t }) })] }) }) }) });
});
x1.displayName = "BlendIcon";
var M1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -2, 2, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 1 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.5, 1], transition: { duration: 0.8 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, v = { normal: { scale: 1 }, animate: { scale: [1, 1.2, 0.9, 1], transition: { duration: 1 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2", variants: g }), o(m.rect, { x: "14", y: "2", width: "8", height: "8", rx: "1", variants: v })] }) }) });
});
M1.displayName = "BlocksIcon";
var L1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.08, 0.95, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 1.3 * n, ease: "easeInOut", repeat: 0 } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.3, 0.9, 1], opacity: [1, 0.6, 1], transition: { duration: 1.1 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", variants: g }), o(m.circle, { cx: "12", cy: "12", r: "4", variants: v })] }) }) });
});
L1.displayName = "BoltIcon";
var _1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.97, 1], rotate: [0, -2, 2, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.05, 0.98, 1], opacity: 1, transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.15 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.25 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M12 21V7", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m16 12 2 2 4-4", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3", variants: v, initial: "normal", animate: t })] }) }) });
});
_1.displayName = "BookOpenCheckIcon";
var A1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 0.97, 1], rotate: [0, -2, 2, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.05, 0.98, 1], opacity: [0.9, 1, 1], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M12 7v14", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z", variants: v, initial: "normal", animate: t })] }) }) });
});
A1.displayName = "BookOpenIcon";
var b1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.04, 0.98, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.1 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: (w) => ({ pathLength: [0.9, 1, 1], opacity: [0.7, 1, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: w * 0.12 } }) }, v = { normal: { opacity: 1, y: 0, scaleX: 1 }, animate: (w) => ({ opacity: [0.6, 1, 1], y: [1.5, -1, 0], scaleX: [0.9, 1.05, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.2 + w * 0.1 } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M12 7v14", variants: g, custom: 0, initial: "normal", animate: t }), o(m.path, { d: "M16 12h2", variants: v, custom: 0, initial: "normal", animate: t }), o(m.path, { d: "M16 8h2", variants: v, custom: 1, initial: "normal", animate: t }), o(m.path, { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z", variants: g, custom: 1, initial: "normal", animate: t }), o(m.path, { d: "M6 12h2", variants: v, custom: 2, initial: "normal", animate: t }), o(m.path, { d: "M6 8h2", variants: v, custom: 3, initial: "normal", animate: t })] }) }) });
});
b1.displayName = "BookOpenTextIcon";
var N1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scaleX: 1, scaleY: 1 }, animate: { y: [0, -4, 0], scaleY: [1, 1.1, 0.95, 1], scaleX: [1, 0.97, 1.02, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" }), o(m.path, { d: "m9 10 2 2 4-4", variants: g })] }) }) });
});
N1.displayName = "BookmarkCheckIcon";
var $1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scaleX: 1, scaleY: 1 }, animate: { y: [0, -4, 0], scaleY: [1, 1.1, 0.95, 1], scaleX: [1, 0.97, 1.02, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("relative inline-flex", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: o("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }) }) }) });
});
$1.displayName = "BookmarkIcon";
var E1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scaleX: 1, scaleY: 1 }, animate: { y: [0, -4, 0], scaleY: [1, 1.1, 0.95, 1], scaleX: [1, 0.97, 1.02, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } }, g = { normal: { scaleX: 1, opacity: 1 }, animate: { scaleX: [1, 0.7, 1.2, 1], opacity: [1, 0.6, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }), o(m.line, { x1: "15", x2: "9", y1: "10", y2: "10", variants: g })] }) }) });
});
E1.displayName = "BookmarkMinusIcon";
var C1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scaleX: 1, scaleY: 1 }, animate: { y: [0, -4, 0], scaleY: [1, 1.1, 0.95, 1], scaleX: [1, 0.97, 1.02, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.2, 0.9, 1], opacity: [1, 0.8, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }), o(m.line, { x1: "12", x2: "12", y1: "7", y2: "13", variants: g }), o(m.line, { x1: "15", x2: "9", y1: "10", y2: "10", variants: g })] }) }) });
});
C1.displayName = "BookmarkPlusIcon";
var I1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scaleX: 1, scaleY: 1 }, animate: { y: [0, -4, 0], scaleY: [1, 1.1, 0.95, 1], scaleX: [1, 0.97, 1.02, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" }), o(m.path, { d: "m14.5 7.5-5 5", variants: g }), o(m.path, { d: "m9.5 7.5 5 5", variants: g })] }) }) });
});
I1.displayName = "BookmarkXIcon";
var O1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 0.98, 1], y: [0, -1, 0], transition: { duration: n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: (v) => ({ pathLength: [0, 1], opacity: [0.4, 1], transition: { duration: n, ease: "easeInOut", delay: v * 0.08 } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", variants: g, custom: 0, initial: "normal", animate: t }), o(m.path, { d: "m3.3 7 8.7 5 8.7-5", variants: g, custom: 1, initial: "normal", animate: t }), o(m.path, { d: "M12 22V12", variants: g, custom: 2, initial: "normal", animate: t })] }) }) });
});
O1.displayName = "BoxIcon";
var j1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.04, 1], transition: { duration: n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { y: 0 }, animate: (v) => ({ y: [0, -2 - v, 0], transition: { duration: n * 0.9, delay: v * 0.08, ease: [0.22, 1, 0.36, 1] } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [A(m.g, { variants: g, custom: 2, animate: t, initial: "normal", children: [o("path", { d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }), o("path", { d: "m7 16.5-4.74-2.85" }), o("path", { d: "m7 16.5 5-3" }), o("path", { d: "M7 16.5v5.17" })] }), A(m.g, { variants: g, custom: 1, animate: t, initial: "normal", children: [o("path", { d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }), o("path", { d: "m17 16.5-5-3" }), o("path", { d: "m17 16.5 4.74-2.85" }), o("path", { d: "M17 16.5v5.17" })] }), A(m.g, { variants: g, custom: 0, animate: t, initial: "normal", children: [o("path", { d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" }), o("path", { d: "M12 8 7.26 5.15" }), o("path", { d: "m12 8 4.74-2.85" }), o("path", { d: "M12 13.5V8" })] })] }) }) });
});
j1.displayName = "BoxesIcon";
var S1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = j(), y = b(!1);
  E(p, () => (y.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal");
  } }));
  let g = x((Z) => {
    !c || f || (y.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate")));
  }, [t, r, l, h, f, e, c]), v = x((Z) => {
    y.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"));
  }, [t, r, l, h, a]), w = Ot(() => ({ normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -2.2, 1.2, 0], scale: [1, 1.015, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }), []), L = Ot(() => ({ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.55, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.06 } } }), []), N = Ot(() => ({ normal: { pathLength: 1, opacity: 1, scale: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], scale: [0.98, 1.02, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.12 } } }), []), T = Ot(() => ({ normal: { pathLength: 1, opacity: 1, scale: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], scale: [1.02, 0.98, 1], transition: { duration: 0.62 * n, ease: "easeInOut", delay: 0.18 } } }), []), Y = Ot(() => ({ normal: { pathLength: 0, opacity: 0 }, animate: { pathLength: [0, 1], opacity: [0, 1, 0], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.26 } } }), []), G = Ot(() => ({ normal: { pathLength: 0, opacity: 0 }, animate: { pathLength: [0, 1], opacity: [0, 1, 0], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.34 } } }), []);
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-brain-icon lucide-brain", children: A(m.g, { variants: w, initial: "normal", animate: t, children: [o(m.path, { d: "M12 18V5", variants: L, initial: "normal", animate: r }), o(m.path, { d: "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4", variants: N, initial: "normal", animate: t }), o(m.path, { d: "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5", variants: T, initial: "normal", animate: t }), o(m.path, { d: "M17.997 5.125a4 4 0 0 1 2.526 5.77", variants: N, initial: "normal", animate: t }), o(m.path, { d: "M18 18a4 4 0 0 0 2-7.464", variants: T, initial: "normal", animate: t }), o(m.path, { d: "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517", variants: N, initial: "normal", animate: t }), o(m.path, { d: "M6 18a4 4 0 0 1-2-7.464", variants: T, initial: "normal", animate: t }), o(m.path, { d: "M6.003 5.125a4 4 0 0 0-2.526 5.77", variants: N, initial: "normal", animate: t }), o(m.path, { d: "M8.5 11.6 10.2 10.4", stroke: "currentColor", strokeWidth: "1.4", variants: Y, initial: "normal", animate: l }), o(m.path, { d: "M13.8 9.4 15.6 10.7", stroke: "currentColor", strokeWidth: "1.4", variants: G, initial: "normal", animate: h })] }) }) }) });
});
S1.displayName = "BrainIcon";
var T1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { rotate: [0, -3, 3, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 1 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.5, 1], transition: { duration: 0.8 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, v = { normal: { scale: 1 }, animate: { scale: [1, 1.2, 0.9, 1], transition: { duration: 0.8 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.rect, { x: "8", y: "8", width: "8", height: "8", rx: "2", variants: v }), o(m.path, { d: "M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2", variants: g }), o(m.path, { d: "M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2", variants: g })] }) }) });
});
T1.displayName = "BringToFrontIcon";
var B1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("press");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { scale: 1, opacity: 1 }, press: { scale: [1, 1.8, 1], opacity: [1, 1, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: w * 0.06 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }), o("line", { x1: "8", x2: "16", y1: "6", y2: "6" }), o("line", { x1: "16", x2: "16", y1: "14", y2: "18" }), o(m.path, { d: "M16 10h.01", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M12 10h.01", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M8 10h.01", animate: t, initial: "rest", variants: v(2), style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M12 14h.01", animate: t, initial: "rest", variants: v(3), style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M8 14h.01", animate: t, initial: "rest", variants: v(4), style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M12 18h.01", animate: t, initial: "rest", variants: v(5), style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M8 18h.01", animate: t, initial: "rest", variants: v(6), style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
B1.displayName = "CalculatorIcon";
var D1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("flip"), r.start("flip"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { y: 0 }, flip: { y: [0, -1.5, 0], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1] } } }, L = { rest: { scaleY: 1 }, flip: { scaleY: [1, 0.88, 1.03, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.35, 0.7, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M8 2v4", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box", transformOrigin: "bottom center" } }), o(m.path, { d: "M16 2v4", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box", transformOrigin: "bottom center" } }), o(m.rect, { width: "18", height: "18", x: "3", y: "4", rx: "2", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", transformOrigin: "top center" } }), o("path", { d: "M3 10h18" })] }) }) });
});
D1.displayName = "CalendarIcon";
var z1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("snap");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { scale: 1 }, snap: { scale: [1, 0.45, 1.15, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.3, 0.65, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" }), o(m.circle, { cx: "12", cy: "13", r: "3", animate: t, initial: "rest", variants: v, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
z1.displayName = "CameraIcon";
var W1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("drive");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((tt) => {
    !c || r || (l.current ? e?.(tt) : h());
  }, [c, r, h, e]), g = x((tt) => {
    l.current ? a?.(tt) : f();
  }, [f, a]), v = 1.4 * n, w = [0, 0.11, 0.22, 0.33, 0.5, 0.62, 0.78, 0.9, 1], L = [0, 0.14, 0.27, 0.4, 0.54, 0.67, 0.81, 0.92, 1], N = [0, -0.16, 0.05, 0, -0.12, 0.03, -0.07, 0.02, 0], T = { transformBox: "view-box", originX: "12px", originY: "19px" }, Y = { rest: { y: 0, rotate: 0 }, drive: { y: [0, -0.28, 0.09, -0.05, -0.21, 0.06, -0.12, 0.03, 0], rotate: [0, -1.05, 0.68, -0.2, -0.76, 0.44, -0.36, 0.12, 0], transition: { y: { duration: v, ease: "easeInOut", times: w, repeat: 1 / 0, delay: 0.08 * n }, rotate: { duration: v, ease: "easeInOut", times: L, repeat: 1 / 0, delay: 0.08 * n } } } }, G = { rest: { y: 0 }, drive: { y: N, transition: { duration: v, ease: "easeInOut", times: w, repeat: 1 / 0 } } }, Z = { rest: { y: 0 }, drive: { y: N, transition: { duration: v, ease: "easeInOut", times: w, repeat: 1 / 0, delay: 0.12 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2", animate: t, initial: "rest", variants: Y, style: T }), o(m.circle, { cx: "7", cy: "17", r: "2", animate: t, initial: "rest", variants: Z }), o(m.path, { d: "M9 17h6", animate: t, initial: "rest", variants: Y, style: T }), o(m.circle, { cx: "17", cy: "17", r: "2", animate: t, initial: "rest", variants: G })] }) }) });
});
W1.displayName = "CarIcon";
var V1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("idle"), r.start("blink"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("open");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { rotate: 0, y: 0 }, idle: { rotate: [0, -10, -10, 0, 0], y: [0, 0, -0.6, 0, 0], transition: { duration: 2.6 * n, ease: "easeInOut", times: [0, 0.18, 0.5, 0.68, 1], repeat: 1 / 0 } } }, L = { open: { scaleY: 1 }, blink: { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 2.6 * n, ease: "easeInOut", times: [0, 0.34, 0.4, 0.46, 1], repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, animate: t, initial: "rest", variants: w, ...u, style: { color: d, transformOrigin: "bottom center", ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" }), o(m.path, { d: "M8 14v.5", animate: r, initial: "open", variants: L, style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M16 14v.5", animate: r, initial: "open", variants: L, style: { transformBox: "fill-box", transformOrigin: "center" } }), o("path", { d: "M11.25 16.25h1.5L12 17l-.75-.75Z" })] }) }) });
});
V1.displayName = "CatIcon";
var R1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 * n } }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, transition: { duration: 0.2 * n } }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: g, animate: t, initial: "normal", children: [o(m.path, { d: "M3 3v16a2 2 0 0 0 2 2h16", variants: y }), o(m.path, { d: "M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z", variants: y })] }) }) });
});
R1.displayName = "ChartAreaIcon";
var P1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 * n } }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, transition: { duration: 0.2 * n } }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: g, animate: t, initial: "normal", children: [o(m.path, { d: "M3 3v16a2 2 0 0 0 2 2h16", variants: y }), o(m.path, { d: "M7 16h8", variants: y }), o(m.path, { d: "M7 11h12", variants: y }), o(m.path, { d: "M7 6h3", variants: y })] }) }) });
});
P1.displayName = "ChartBarIcon";
var F1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 * n } }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, transition: { duration: 0.2 * n } }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: g, animate: t, initial: "normal", children: [o(m.path, { d: "M3 3v16a2 2 0 0 0 2 2h16", variants: y }), o(m.path, { d: "M18 17V9", variants: y }), o(m.path, { d: "M13 17V5", variants: y }), o(m.path, { d: "M8 17v-3", variants: y })] }) }) });
});
F1.displayName = "ChartColumnIcon";
var H1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 * n } }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, transition: { duration: 0.2 * n } }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: g, animate: t, initial: "normal", children: [o(m.path, { d: "M3 3v16a2 2 0 0 0 2 2h16", variants: y }), o(m.path, { d: "m19 9-5 5-4-4-3 3", variants: y })] }) }) });
});
H1.displayName = "ChartLineIcon";
var q1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 * n } }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 0.7, transition: { duration: 0.2 * n } }, animate: { scale: [0, 1], opacity: [0.7, 1, 0.7], transition: { duration: 0.4 * n, ease: "easeOut" } } }, v = { normal: { scale: 1, transition: { duration: 0.2 * n } }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: v, animate: t, initial: "normal", children: [o(m.path, { d: "m13.11 7.664 1.78 2.672", variants: y }), o(m.path, { d: "m14.162 12.788-3.324 1.424", variants: y }), o(m.path, { d: "m20 4-6.06 1.515", variants: y }), o(m.path, { d: "M3 3v16a2 2 0 0 0 2 2h16", variants: y }), o(m.circle, { cx: "12", cy: "6", r: "2", variants: g }), o(m.circle, { cx: "16", cy: "12", r: "2", variants: g }), o(m.circle, { cx: "9", cy: "15", r: "2", variants: g })] }) }) });
});
q1.displayName = "ChartNetworkIcon";
var Y1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((T) => {
    !c || h || (f.current ? e?.(T) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((T) => {
    f.current ? a?.(T) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = [0.25, 0.1, 0.25, 1], w = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.04, 0.99, 1], rotate: [0, -1.5, 1, 0], transition: { duration: 0.8 * n, ease: v } } }, L = (T = 0) => ({ normal: { scaleY: 1, opacity: 1, transformOrigin: "center bottom" }, animate: { scaleY: [1, 1.4, 0.95, 1], opacity: [1, 1, 0.95, 1], transition: { duration: 0.7 * n, ease: v, delay: T } } }), N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 1 * n, ease: "easeInOut", delay: 0.12 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: w, children: [o(m.path, { d: "M12 16v5", initial: "normal", animate: r, variants: L(0) }), o(m.path, { d: "M16 14v7", initial: "normal", animate: r, variants: L(0.06) }), o(m.path, { d: "M20 10v11", initial: "normal", animate: r, variants: L(0.12) }), o(m.path, { d: "m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15", initial: "normal", animate: l, variants: N }), o(m.path, { d: "M4 18v3", initial: "normal", animate: r, variants: L(0.18) }), o(m.path, { d: "M8 14v7", initial: "normal", animate: r, variants: L(0.24) })] }) }) });
});
Y1.displayName = "ChartNoAxesCombinedIcon";
var X1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 * n } }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, rotate: 0, transition: { duration: 0.2 * n } }, animate: { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: g, animate: t, initial: "normal", children: [o(m.path, { d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z", variants: y }), o(m.path, { d: "M21.21 15.89A10 10 0 1 1 8 2.83", variants: y })] }) }) });
});
X1.displayName = "ChartPieIcon";
var U1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.04, 1], transition: { duration: 0.6 * n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0, 1], opacity: [0, 1], transition: { duration: 0.4 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: y, children: [o(m.circle, { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor", variants: g }), o(m.circle, { cx: "18.5", cy: "5.5", r: ".5", fill: "currentColor", variants: g }), o(m.circle, { cx: "11.5", cy: "11.5", r: ".5", fill: "currentColor", variants: g }), o(m.circle, { cx: "7.5", cy: "16.5", r: ".5", fill: "currentColor", variants: g }), o(m.circle, { cx: "17.5", cy: "14.5", r: ".5", fill: "currentColor", variants: g }), o(m.path, { d: "M3 3v16a2 2 0 0 0 2 2h16", variants: v })] }) }) });
});
U1.displayName = "ChartScatterIcon";
var K1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, scale: 1, opacity: 1 }, animate: { strokeDashoffset: [20, 0], scale: [1, 1.2, 1], opacity: [0.5, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1], x: [-6, 0], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.35 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M18 6 7 17l-5-5", strokeDasharray: "20", strokeDashoffset: "0", variants: y, initial: "normal", animate: t }), o(m.path, { d: "m22 10-7.5 7.5L13 16", strokeDasharray: "20", strokeDashoffset: "0", variants: g, initial: "normal", animate: t })] }) }) });
});
K1.displayName = "CheckCheckIcon";
var G1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, scale: 1, opacity: 1 }, animate: { strokeDashoffset: [20, 0], scale: [0.7, 1.15, 0.97, 1], opacity: [0, 1, 1], transition: { strokeDashoffset: { duration: 0.45 * n, ease: [0.16, 1, 0.3, 1] }, scale: { duration: 0.55 * n, ease: "easeOut", times: [0, 0.55, 0.8, 1], delay: 0.1 * n }, opacity: { duration: 0.18 * n } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: o(m.path, { d: "M5 13l4 4L19 7", strokeDasharray: "20", strokeDashoffset: "0", variants: y, initial: "normal", animate: t, style: { transformOrigin: "center" } }) }) }) });
});
G1.displayName = "CheckIcon";
var Z1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, opacity: 1 }, animate: { y: [0, -1.5, 4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.2, 0.55, 1] } } }, g = { normal: { y: 0, opacity: 0 }, animate: { y: [0, 9], opacity: [0, 0.45, 0], transition: { duration: 1 * n, ease: "easeOut", delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m6 9 6 6 6-6", variants: g, stroke: "currentColor" }), o(m.path, { d: "m6 9 6 6 6-6", variants: y, stroke: "currentColor" })] }) }) });
});
Z1.displayName = "ChevronDownIcon";
var Q1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 1.5, -4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.2, 0.55, 1] } } }, g = { normal: { x: 0, opacity: 0 }, animate: { x: [0, -9], opacity: [0, 0.45, 0], transition: { duration: 1 * n, ease: "easeOut", delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m15 18-6-6 6-6", variants: g, stroke: "currentColor" }), o(m.path, { d: "m15 18-6-6 6-6", variants: y })] }) }) });
});
Q1.displayName = "ChevronLeftIcon";
var J1 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -1.5, 4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.2, 0.55, 1] } } }, g = { normal: { x: 0, opacity: 0 }, animate: { x: [0, 9], opacity: [0, 0.45, 0], transition: { duration: 1 * n, ease: "easeOut", delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m9 18 6-6-6-6", variants: g, stroke: "currentColor" }), o(m.path, { d: "m9 18 6-6-6-6", variants: y })] }) }) });
});
J1.displayName = "ChevronRightIcon";
var td = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, opacity: 1 }, animate: { y: [0, 1.5, -4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.2, 0.55, 1] } } }, g = { normal: { y: 0, opacity: 0 }, animate: { y: [0, -9], opacity: [0, 0.45, 0], transition: { duration: 1 * n, ease: "easeOut", delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m18 15-6-6-6 6", variants: g, stroke: "currentColor" }), o(m.path, { d: "m18 15-6-6-6 6", variants: y, stroke: "currentColor" })] }) }) });
});
td.displayName = "ChevronUpIcon";
var ed = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, opacity: 1 }, animate: { y: [0, -1.5, 4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1] } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [0, -1.5, 4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1], delay: 0.12 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m7 6 5 5 5-5", variants: g, stroke: "currentColor" }), o(m.path, { d: "m7 13 5 5 5-5", variants: y, stroke: "currentColor" })] }) }) });
});
ed.displayName = "ChevronsDownIcon";
var ad = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 1.5, -4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1] } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 1.5, -4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1], delay: 0.12 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m18 17-5-5 5-5", variants: g, stroke: "currentColor" }), o(m.path, { d: "m11 17-5-5 5-5", variants: y, stroke: "currentColor" })] }) }) });
});
ad.displayName = "ChevronsLeftIcon";
var nd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -4, 0], opacity: [1, 0.5, 1], transition: { duration: 1 * n, repeat: 0 } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 4, 0], opacity: [1, 0.5, 1], transition: { duration: 1 * n, repeat: 0, delay: 0.2 } } }, v = { normal: { opacity: 0.3 }, animate: (w) => ({ opacity: [0.3, 1, 0.3], transition: { duration: 1 * n, repeat: 1 / 0, delay: w * 0.3 } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "M8 12h.01", variants: v, custom: 0 }), o(m.path, { d: "M12 12h.01", variants: v, custom: 1 }), o(m.path, { d: "M16 12h.01", variants: v, custom: 2 }), o(m.path, { d: "m7 7-5 5 5 5", variants: y, stroke: "currentColor" }), o(m.path, { d: "m17 7 5 5-5 5", variants: g, stroke: "currentColor" })] }) }) });
});
nd.displayName = "ChevronsLeftRightEllipsisIcon";
var rd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -4, 0], opacity: [1, 0.6, 1], transition: { duration: 0.8 * n, repeat: 0 } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 4, 0], opacity: [1, 0.6, 1], transition: { duration: 0.8 * n, repeat: 0, delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m9 7-5 5 5 5", variants: y, stroke: "currentColor" }), o(m.path, { d: "m15 7 5 5-5 5", variants: g, stroke: "currentColor" })] }) }) });
});
rd.displayName = "ChevronsLeftRightIcon";
var id = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -1.5, 4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1] } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -1.5, 4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1], delay: 0.12 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m6 17 5-5-5-5", variants: g, stroke: "currentColor" }), o(m.path, { d: "m13 17 5-5-5-5", variants: y, stroke: "currentColor" })] }) }) });
});
id.displayName = "ChevronsRightIcon";
var od = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -4, 0], opacity: [1, 0.6, 1], transition: { duration: 0.9 * n, repeat: 0 } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 4, 0], opacity: [1, 0.6, 1], transition: { duration: 0.9 * n, repeat: 0, delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m20 17-5-5 5-5", variants: y, stroke: "currentColor" }), o(m.path, { d: "m4 17 5-5-5-5", variants: g, stroke: "currentColor" })] }) }) });
});
od.displayName = "ChevronsRightLeftIcon";
var sd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, opacity: 1 }, animate: { y: [0, 1.5, -4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1] } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [0, 1.5, -4, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.55, 1], delay: 0.12 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "m17 11-5-5-5 5", variants: y, stroke: "currentColor" }), o(m.path, { d: "m17 18-5-5-5 5", variants: g, stroke: "currentColor" })] }) }) });
});
sd.displayName = "ChevronsUpIcon";
var ld = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, 300, 360], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.25, 1], opacity: [1, 0.7, 1], transition: { duration: 0.35 * n, ease: "easeOut" } } }, v = { normal: { opacity: 0.8 }, animate: { opacity: [0.8, 0.25, 0.8], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: y }), o(m.circle, { cx: "12", cy: "12", r: "4", variants: g }), o(m.line, { x1: "21.17", y1: "8", x2: "12", y2: "8", variants: v }), o(m.line, { x1: "3.95", y1: "6.06", x2: "8.54", y2: "14", variants: v, transition: { delay: 0.08 * n } }), o(m.line, { x1: "10.88", y1: "21.94", x2: "15.46", y2: "14", variants: v, transition: { delay: 0.16 * n } })] }) }) });
});
ld.displayName = "ChromeIcon";
var cd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((L) => {
    !c || l || (h.current ? e?.(L) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((L) => {
    h.current ? a?.(L) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { scale: 1 }, animate: { scale: [1, 1.12, 0.96, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0.7, 1], opacity: [0.7, 1], transition: { duration: 0.35 * n, ease: "easeOut" } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.3 * n, delay: 0.12 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: g, children: [o(m.path, { d: "M21.801 10A10 10 0 1 1 17 3.335", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m9 11 3 3L22 4", variants: w, initial: "normal", animate: r })] }) }) });
});
cd.displayName = "CircleCheckBigIcon";
var ud = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((L) => {
    !c || l || (h.current ? e?.(L) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((L) => {
    h.current ? a?.(L) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { scale: 1 }, animate: { scale: [1, 1.08, 0.97, 1], transition: { duration: 0.4 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0.85, 1], opacity: [0.8, 1], transition: { duration: 0.3 * n, ease: "easeOut" } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.28 * n, delay: 0.1 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: g, children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m9 12 2 2 4-4", variants: w, initial: "normal", animate: r })] }) }) });
});
ud.displayName = "CircleCheckIcon";
var md = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = b(!1), h = M(), f = j();
  E(p, () => (l.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), h.start("normal"), r.start("normal")) : (t.start("animate"), h.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), h.start("normal"), r.start("normal");
  } }));
  let y = x((L) => {
    !c || f || (l.current ? e?.(L) : (t.start("animate"), h.start("animate"), r.start("animate")));
  }, [t, h, f, e, c]), g = x((L) => {
    l.current ? a?.(L) : (t.start("normal"), h.start("normal"), r.start("normal"));
  }, [t, h, a]), v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.1, 0.9, 1.05, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } }, w = { normal: { y: 0, opacity: 1 }, animate: { y: [-10, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "12", cy: "12", r: "10", animate: t, initial: "normal", variants: v }), o(m.path, { d: "m16 10-4 4-4-4", animate: r, initial: "normal", variants: w })] }) }) });
});
md.displayName = "CircleChevronDownIcon";
var dd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = b(!1), h = M(), f = j();
  E(p, () => (l.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), h.start("normal"), r.start("normal")) : (t.start("animate"), h.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), h.start("normal"), r.start("normal");
  } }));
  let y = x((L) => {
    !c || f || (l.current ? e?.(L) : (t.start("animate"), h.start("animate"), r.start("animate")));
  }, [t, h, f, e, c]), g = x((L) => {
    l.current ? a?.(L) : (t.start("normal"), h.start("normal"), r.start("normal"));
  }, [t, h, a]), v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.1, 0.9, 1.05, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } }, w = { normal: { y: 0, opacity: 1 }, animate: { x: [10, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "12", cy: "12", r: "10", animate: t, initial: "normal", variants: v }), o(m.path, { d: "m14 16-4-4 4-4", animate: r, initial: "normal", variants: w })] }) }) });
});
dd.displayName = "CircleChevronLeftIcon";
var hd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = b(!1), h = M(), f = j();
  E(p, () => (l.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), h.start("normal"), r.start("normal")) : (t.start("animate"), h.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), h.start("normal"), r.start("normal");
  } }));
  let y = x((L) => {
    !c || f || (l.current ? e?.(L) : (t.start("animate"), h.start("animate"), r.start("animate")));
  }, [t, h, f, e, c]), g = x((L) => {
    l.current ? a?.(L) : (t.start("normal"), h.start("normal"), r.start("normal"));
  }, [t, h, a]), v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.1, 0.9, 1.05, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } }, w = { normal: { y: 0, opacity: 1 }, animate: { x: [-10, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "12", cy: "12", r: "10", animate: t, initial: "normal", variants: v }), o(m.path, { d: "m10 8 4 4-4 4", animate: r, initial: "normal", variants: w })] }) }) });
});
hd.displayName = "CircleChevronRightIcon";
var pd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = b(!1), h = M(), f = j();
  E(p, () => (l.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), h.start("normal"), r.start("normal")) : (t.start("animate"), h.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), h.start("normal"), r.start("normal");
  } }));
  let y = x((L) => {
    !c || f || (l.current ? e?.(L) : (t.start("animate"), h.start("animate"), r.start("animate")));
  }, [t, h, f, e, c]), g = x((L) => {
    l.current ? a?.(L) : (t.start("normal"), h.start("normal"), r.start("normal"));
  }, [t, h, a]), v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.1, 0.9, 1.05, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } }, w = { normal: { y: 0, opacity: 1 }, animate: { y: [10, 0], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "12", cy: "12", r: "10", animate: t, initial: "normal", variants: v }), o(m.path, { d: "m8 14 4-4 4 4", animate: r, initial: "normal", variants: w })] }) }) });
});
pd.displayName = "CircleChevronUpIcon";
var fd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e, c]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.1, 1], rotate: 360, transition: { duration: 2 * n, repeat: 0, ease: "linear" } } }, g = { normal: { opacity: 1 }, animate: { opacity: [1, 0.4, 1], transition: { duration: 1 * n, repeat: 0, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: y, stroke: "currentColor" }), o(m.path, { d: "M8 12h8", variants: g, stroke: "currentColor" }), o(m.path, { d: "M12 8v8", variants: g, stroke: "currentColor" })] }) }) });
});
fd.displayName = "CirclePlusIcon";
var yd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { strokeDashoffset: 0, y: 0 }, animate: { strokeDashoffset: [240, 0], transition: { duration: 1 * n, ease: "easeInOut" }, y: [0, -2, 0] } }, v = { normal: { strokeDashoffset: 0, y: 0 }, animate: { strokeDashoffset: [60, 0], transition: { duration: 1 * n, ease: "easeInOut", delay: 0.2 }, y: [0, -2, 0] } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.rect, { x: "8", y: "2", width: "8", height: "4", rx: "1", ry: "1", initial: "normal", animate: r, variants: v, style: { strokeDasharray: 60, strokeLinecap: "round" } }), o(m.path, { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", initial: "normal", animate: t, variants: g, style: { strokeDasharray: 240, strokeLinecap: "round" } })] }) }) });
});
yd.displayName = "ClipboardIcon";
var vd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("run");
  }, [t, r]), f = x(() => {
    t.stop();
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((N) => {
    !c || r || (l.current ? e?.(N) : h());
  }, [c, r, h, e]), g = x((N) => {
    l.current ? a?.(N) : f();
  }, [f, a]), v = { rest: { rotate: 0 }, run: { rotate: [0, 360], transition: { duration: 2 * n, ease: "linear", repeat: 1 / 0, repeatType: "loop" } } }, w = { rest: { rotate: 0 }, run: { rotate: [0, 360], transition: { duration: 24 * n, ease: "linear", repeat: 1 / 0, repeatType: "loop" } } }, L = { transformBox: "view-box", originX: "12px", originY: "12px" };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M12 12V6", animate: t, initial: "rest", variants: v, style: L }), o(m.path, { d: "M12 12l4 2", animate: t, initial: "rest", variants: w, style: L }), o("circle", { cx: "12", cy: "12", r: "10" })] }) }) });
});
vd.displayName = "ClockIcon";
var gd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [100, 0], opacity: [0.4, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [30, 0], opacity: [0.5, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.05 } } }, v = { normal: { y: 0, scale: 1, opacity: 1 }, animate: { y: [2, -2, 0], scale: [1, 1.06, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { scale: 1 }, animate: { scale: [1, 1.02, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-cloud-upload-icon lucide-cloud-upload", children: A(m.g, { variants: w, initial: "normal", animate: t, children: [o(m.path, { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", strokeDasharray: "100", strokeDashoffset: "100", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M12 13v8", strokeDasharray: "30", strokeDashoffset: "30", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m8 17 4-4 4 4", variants: v, initial: "normal", animate: t })] }) }) }) });
});
gd.displayName = "CloudUploadIcon";
var wd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scaleX: 1 }, animate: { scaleX: [1, 0.75, 1], transition: { duration: 0.28 * n, ease: "easeOut" } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [0, 3, 0], opacity: [1, 0.6, 1], transition: { duration: 0.32 * n, ease: "easeOut" } } }, v = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -3, 0], opacity: [1, 0.6, 1], transition: { duration: 0.32 * n, delay: 0.05 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: A(m.g, { variants: y, initial: "normal", animate: t, children: [o(m.path, { d: "m8 6-6 6 6 6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m16 18 6-6-6-6", variants: v, initial: "normal", animate: t })] }) }) }) });
});
wd.displayName = "CodeIcon";
var kd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = b(!1), f = j();
  E(p, () => (h.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || f || (h.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, f, e, c]), g = x((N) => {
    h.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [1, 0, 1], opacity: [1, 0.4, 1], transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m6 8-4 4 4 4", animate: t, initial: "normal", variants: v }), o(m.path, { d: "m18 16 4-4-4-4", animate: r, initial: "normal", variants: w }), o(m.path, { d: "m14.5 4-5 16", animate: l, initial: "normal", variants: L })] }) }) });
});
kd.displayName = "CodeXmlIcon";
var xd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, transition: { duration: 0.2 * n } }, animate: { y: [0, -2, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0.4, 1, 0.4, 1], y: [0, -4, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.path, { variants: g, d: "M6 2v2" }), o(m.path, { variants: g, d: "M10 2v2" }), o(m.path, { variants: g, d: "M14 2v2" }), o(m.path, { variants: y, d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" })] }) }) });
});
xd.displayName = "CoffeeIcon";
var Md = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 0.98, 1], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { rotate: 0, opacity: 1 }, animate: { rotate: [0, 200, 170, 180], opacity: [0.9, 1], transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z", variants: g, style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.circle, { cx: "12", cy: "12", r: "10", variants: y, initial: "normal" })] }) }) });
});
Md.displayName = "CompassIcon";
var Ld = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [100, 0], opacity: [0.3, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, delay: 0.3, ease: "easeOut" } } }, v = { normal: { x: 0, opacity: 1 }, animate: { x: [-10, 0], opacity: [0, 1], transition: { duration: 0.4 * n, ease: "easeOut", delay: 0.6 } } }, w = { normal: { opacity: 1, strokeDashoffset: 0 }, animate: { strokeDashoffset: [30, 0], opacity: [0, 1], transition: { duration: 0.6 * n, delay: 0.5, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-contact-icon lucide-contact", children: [o(m.path, { d: "M16 2v2", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2", strokeDasharray: "30", strokeDashoffset: "0", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M8 2v2", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "11", r: "3", variants: g, initial: "normal", animate: t }), o(m.rect, { x: "3", y: "4", width: "18", height: "18", rx: "2", strokeDasharray: "100", strokeDashoffset: "0", variants: y, initial: "normal", animate: t })] }) }) });
});
Ld.displayName = "ContactIcon";
var _d = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [100, 0], opacity: [0.3, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, delay: 0.3, ease: "easeOut" } } }, v = { normal: { x: 0, opacity: 1 }, animate: { x: [-10, 0], opacity: [0, 1], transition: { duration: 0.4 * n, ease: "easeOut", delay: 0.6 } } }, w = { normal: { opacity: 1, strokeDashoffset: 0 }, animate: { strokeDashoffset: [30, 0], opacity: [0, 1], transition: { duration: 0.6 * n, delay: 0.5, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-contact-round-icon lucide-contact-round", children: [o(m.path, { d: "M16 2v2", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M17.915 22a6 6 0 0 0-12 0", strokeDasharray: "30", strokeDashoffset: "0", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M8 2v2", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "12", r: "4", variants: g, initial: "normal", animate: t }), o(m.rect, { x: "3", y: "4", width: "18", height: "18", rx: "2", strokeDasharray: "100", strokeDashoffset: "0", variants: y, initial: "normal", animate: t })] }) }) });
});
_d.displayName = "ContactRoundIcon";
var Ad = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { type: "spring", stiffness: 160, damping: 17, mass: 1 }, g = { normal: { translateX: 0, translateY: 0, rotate: 0 }, animate: { translateX: -3, translateY: -3, rotate: 360, transition: { ...y, duration: 0.7 * n } } }, v = { normal: { x: 0, y: 0 }, animate: { x: 3, y: 3, transition: y } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.rect, { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", variants: g, animate: t, transition: { ...y, duration: 0.7 * n } }), o(m.path, { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", variants: v, animate: t, transition: y })] }) }) });
});
Ad.displayName = "CopyIcon";
var bd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1, 1], x: [3, -3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M20 4v7a4 4 0 0 1-4 4H4", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m9 10-5 5 5 5", variants: g, initial: "normal", animate: t })] }) }) });
});
bd.displayName = "CornerDownLeftIcon";
var Nd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1, 1], x: [-3, 3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M4 4v7a4 4 0 0 0 4 4h12", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m15 10 5 5-5 5", variants: g, initial: "normal", animate: t })] }) }) });
});
Nd.displayName = "CornerDownRightIcon";
var $d = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1, 1], y: [-3, 3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M20 4h-7a4 4 0 0 0-4 4v12", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m14 15-5 5-5-5", variants: g, initial: "normal", animate: t })] }) }) });
});
$d.displayName = "CornerLeftDownIcon";
var Ed = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1, 1], y: [3, -3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M20 20h-7a4 4 0 0 1-4-4V4", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M14 9 9 4 4 9", variants: g, initial: "normal", animate: t })] }) }) });
});
Ed.displayName = "CornerLeftUpIcon";
var Cd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1, 1], y: [-3, 3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M4 4h7a4 4 0 0 1 4 4v12", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m10 15 5 5 5-5", variants: g, initial: "normal", animate: t })] }) }) });
});
Cd.displayName = "CornerRightDownIcon";
var Id = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1, 1], y: [3, -3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M4 20h7a4 4 0 0 0 4-4V4", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m10 9 5-5 5 5", variants: g, initial: "normal", animate: t })] }) }) });
});
Id.displayName = "CornerRightUpIcon";
var Od = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1, 1], x: [3, -3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M20 20v-7a4 4 0 0 0-4-4H4", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M9 14 4 9l5-5", variants: g, initial: "normal", animate: t })] }) }) });
});
Od.displayName = "CornerUpLeftIcon";
var jd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, x: 0 }, animate: { opacity: [0, 1, 1], x: [-3, 3, 0], transition: { duration: 0.8 * n, ease: "easeOut", times: [0, 0.6, 1], delay: 0.5 * n } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M4 20v-7a4 4 0 0 1 4-4h12", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m15 14 5-5-5-5", variants: g, initial: "normal", animate: t })] }) }) });
});
jd.displayName = "CornerUpRightIcon";
var Sd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((T) => {
    !c || h || (f.current ? e?.(T) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, c, a]), g = x((T) => {
    f.current ? a?.(T) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l]), v = { normal: { rotate: 0, scale: 1, x: 0, y: 0 }, animate: { rotate: [0, -4, 2, 0], scale: [1, 1.02, 1], x: [0, -0.4, 0], y: [0, -0.3, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, w = { normal: { x: 0, opacity: 1 }, animate: { x: [-2, 0], opacity: [0.7, 1], transition: { duration: 0.4 * n, ease: "easeOut", delay: 0.08 } } }, L = { normal: { pathLength: 0, opacity: 0 }, animate: { pathLength: [0, 1], opacity: [0, 1, 0.9], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.18 } } }, N = { normal: { scale: 1 }, animate: { scale: [1, 1.035, 1], transition: { duration: 0.28 * n, ease: "easeOut", delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-credit-card-icon lucide-credit-card", children: A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.rect, { width: "20", height: "14", x: "2", y: "5", rx: "2", variants: N, initial: "normal", animate: t }), o(m.line, { x1: "2", x2: "22", y1: "10", y2: "10", variants: w, initial: "normal", animate: r }), o(m.path, { d: "M5 15 H15", stroke: "currentColor", strokeWidth: "2", variants: L, initial: "normal", animate: l })] }) }) }) });
});
Sd.displayName = "CreditCardIcon";
var Td = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -1.5, 1.5, 0], transition: { duration: 1.1 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1, y: 0 }, animate: (v) => ({ opacity: [0.6, 1], scale: [0.95, 1.04, 1], y: [3, -2, 0], transition: { duration: 0.9 * n, ease: "easeInOut", delay: v * 0.08 } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.rect, { width: "7", height: "9", x: "3", y: "3", rx: "1", variants: g, custom: 0, initial: "normal", animate: t }), o(m.rect, { width: "7", height: "5", x: "14", y: "3", rx: "1", variants: g, custom: 1, initial: "normal", animate: t }), o(m.rect, { width: "7", height: "9", x: "14", y: "12", rx: "1", variants: g, custom: 2, initial: "normal", animate: t }), o(m.rect, { width: "7", height: "5", x: "3", y: "16", rx: "1", variants: g, custom: 3, initial: "normal", animate: t })] }) }) });
});
Td.displayName = "DashboardIcon";
var Bd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.15, 0.9, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { x: 0, opacity: 1 }, animate: { x: [-10, 0, 10, 0], opacity: [0.8, 1, 0.8, 1], transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M12 3v14", variants: g }), " ", o(m.path, { d: "M5 10h14", variants: g }), " ", o(m.path, { d: "M5 21h14", variants: v }), " "] }) }) });
});
Bd.displayName = "DiffIcon";
var Dd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("spin");
  }, [t, r]), f = x(() => {
    t.stop();
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { rotate: 0 }, spin: { rotate: [0, 360], transition: { duration: 1.8 * n, ease: "linear", repeat: 1 / 0, repeatType: "loop" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("circle", { cx: "12", cy: "12", r: "10" }), o(m.path, { d: "M6 12c0-1.7.7-3.2 1.8-4.2", animate: t, initial: "rest", variants: v, style: { transformBox: "view-box", originX: "12px", originY: "12px" } }), o("circle", { cx: "12", cy: "12", r: "2" }), o(m.path, { d: "M18 12c0 1.7-.7 3.2-1.8 4.2", animate: t, initial: "rest", variants: v, style: { transformBox: "view-box", originX: "12px", originY: "12px" } })] }) }) });
});
Dd.displayName = "Disc3Icon";
var zd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("pant"), r.start("blink"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("open");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { rotate: 0, y: 0 }, pant: { rotate: [0, -3, 0, 3, 0], y: [0, -0.5, 0, -0.5, 0], transition: { duration: 0.7 * n, ease: "easeInOut", repeat: 1 / 0 } } }, L = { open: { scaleY: 1 }, blink: { scaleY: [1, 1, 0.15, 1, 1], transition: { duration: 2.8 * n, ease: "easeInOut", times: [0, 0.42, 0.47, 0.52, 1], repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, animate: t, initial: "rest", variants: w, ...u, style: { color: d, transformOrigin: "bottom center", ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M11.25 16.25h1.5L12 17z" }), o(m.path, { d: "M16 14v.5", animate: r, initial: "open", variants: L, style: { transformBox: "fill-box", transformOrigin: "center" } }), o("path", { d: "M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" }), o(m.path, { d: "M8 14v.5", animate: r, initial: "open", variants: L, style: { transformBox: "fill-box", transformOrigin: "center" } }), o("path", { d: "M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" })] }) }) });
});
zd.displayName = "DogIcon";
var Wd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.line, { x1: "12", x2: "12", y1: "2", y2: "22", variants: v }), o(m.path, { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", variants: g })] }) }) });
});
Wd.displayName = "DollarSignIcon";
var Vd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [30, 0], opacity: [0.4, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1, scale: 1 }, animate: { y: [-2, 2, 0], scale: [1, 1.05, 1], opacity: [0.6, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.05 } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [60, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { scale: 1 }, animate: { scale: [1, 1.02, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-download-icon lucide-download", children: A(m.g, { variants: w, initial: "normal", animate: t, children: [o(m.path, { d: "M12 3v12", strokeDasharray: "30", strokeDashoffset: "30", variants: y, initial: "normal", animate: t }), o(m.path, { d: "m7 10 5 5 5-5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", strokeDasharray: "60", strokeDashoffset: "60", variants: v, initial: "normal", animate: t })] }) }) }) });
});
Vd.displayName = "DownloadIcon";
var Rd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("hit"), r.start("hit"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = (N) => ({ rest: { rotate: 0 }, hit: { rotate: N === 0 ? [0, 14, -3, 0] : [0, -14, 3, 0], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.35, 0.7, 1], delay: N * 0.12 * n } } }), L = { rest: { scaleY: 1 }, hit: { scaleY: [1, 0.88, 1.05, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.38, 0.72, 1], delay: 0.3 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m2 2 8 8", animate: t, initial: "rest", variants: w(0), style: { transformBox: "view-box", originX: "2px", originY: "2px" } }), o(m.path, { d: "m22 2-8 8", animate: t, initial: "rest", variants: w(1), style: { transformBox: "view-box", originX: "22px", originY: "2px" } }), o(m.ellipse, { cx: "12", cy: "9", rx: "10", ry: "5", animate: r, initial: "rest", variants: L, style: { transformBox: "view-box", originX: "12px", originY: "9px" } }), o("path", { d: "M7 13.4v7.9" }), o("path", { d: "M12 14v8" }), o("path", { d: "M17 13.4v7.9" }), o("path", { d: "M2 9v8a10 5 0 0 0 20 0V9" })] }) }) });
});
Rd.displayName = "DrumIcon";
var Pd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0 }, animate: (g) => ({ y: [0, -3, 0], transition: { duration: 0.35 * n, delay: g * 0.12, ease: "easeInOut" } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.circle, { cx: "5", cy: "12", r: "1", variants: y, custom: 0 }), o(m.circle, { cx: "12", cy: "12", r: "1", variants: y, custom: 1 }), o(m.circle, { cx: "19", cy: "12", r: "1", variants: y, custom: 2 })] }) }) });
});
Pd.displayName = "EllipsisIcon";
var Fd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0 }, animate: (g) => ({ x: [0, -3, 0], transition: { duration: 0.35 * n, delay: g * 0.12, ease: "easeInOut" } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.circle, { cx: "12", cy: "5", r: "1", variants: y, custom: 0 }), o(m.circle, { cx: "12", cy: "12", r: "1", variants: y, custom: 1 }), o(m.circle, { cx: "12", cy: "19", r: "1", variants: y, custom: 2 })] }) }) });
});
Fd.displayName = "EllipsisVerticalIcon";
var Hd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.16 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.26 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-euro-icon lucide-euro", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M4 10h12" }), o("path", { d: "M4 14h9" }), o("path", { d: "M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" })] }), o(m.path, { d: "M4 10h12", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M4 14h9", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2", pathLength: 1, variants: w, initial: "normal", animate: t })] }) }) });
});
Hd.displayName = "EuroIcon";
var qd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r]), g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.4, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } }, v = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [0, -1, 2, 0], y: [0, 1, -2, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.15, 0.55, 1], delay: 0.12 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M15 3h6v6", variants: v, initial: "normal", animate: r }), o(m.path, { d: "M10 14 21 3", variants: v, initial: "normal", animate: r }), o(m.path, { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", variants: g, initial: "normal", animate: t })] }) }) });
});
qd.displayName = "ExternalLinkIcon";
var Yd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1), y = b(null);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("flick"), l.start("idle"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } })), oa(() => {
    if (!c || h) return;
    let T = async () => {
      await l.start("idle");
      let Y = 2500 + Math.random() * 3e3;
      y.current = window.setTimeout(T, Y);
    };
    return T(), () => {
      y.current && clearTimeout(y.current);
    };
  }, [l, h]);
  let g = x((T) => {
    !c || h || (f.current ? e?.(T) : (t.start("pulse"), r.start("flick"), l.start("hover")));
  }, [t, r, l, h]), v = x(() => {
    f.current || (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l]), w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.5, 1], transition: { duration: 0.9 * n, ease: "easeInOut" } }, pulse: { scale: [1, 1.05, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, L = { normal: { rotate: 0, y: 0, opacity: 1 }, flick: (T) => ({ rotate: [0, -12, 8, 0], y: [0, -2, 1, 0], opacity: [1, 0.7, 1, 1], transition: { duration: 0.6 * n, delay: T * 0.05, ease: "easeInOut" } }) }, N = { normal: { scaleY: 1 }, idle: { scaleY: [1, 0.85, 1], transition: { duration: 0.3 * n, ease: "easeInOut" } }, hover: { scaleY: [1, 0.8, 1], transition: { duration: 0.25 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: l, variants: N, children: [o(m.path, { d: "M2 8a10.645 10.645 0 0 0 20 0", variants: w, initial: "normal", animate: t }), o(m.path, { d: "m15 18-.722-3.25", custom: 0, variants: L, initial: "normal", animate: r }), o(m.path, { d: "m9 18 .722-3.25", custom: 1, variants: L, initial: "normal", animate: r }), o(m.path, { d: "m20 15-1.726-2.05", custom: 2, variants: L, initial: "normal", animate: r }), o(m.path, { d: "m4 15 1.726-2.05", custom: 3, variants: L, initial: "normal", animate: r })] }) }) });
});
Yd.displayName = "EyeClosedIcon";
var Xd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("open"), r.start("center")) : (t.start("blink"), r.start("scan"));
  }, stopAnimation: () => {
    t.start("open"), r.start("center");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("blink"), r.start("scan")));
  }, [t, r, e, l, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("open"), r.start("center"));
  }, [t, r, a]), g = { open: { scaleY: 1 }, blink: { scaleY: [1, 0.1, 1], transition: { duration: 0.25 * n, repeatDelay: 2.4, ease: "easeInOut" } } }, v = { center: { x: 0 }, scan: { x: [-2, 2, -1, 1, 0], transition: { duration: 1.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", animate: t, initial: "open", variants: g, style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.circle, { cx: "12", cy: "12", r: "3", animate: r, initial: "center", variants: v })] }) }) });
});
Xd.displayName = "EyeIcon";
var Ud = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("visible"), r.start("visible")) : (t.start("hide"), r.start("strike"));
  }, stopAnimation: () => {
    t.start("visible"), r.start("visible");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("hide"), r.start("strike")));
  }, [t, r, c, l, e]), y = x((w) => {
    h.current ? a?.(w) : (t.start("visible"), r.start("visible"));
  }, [t, r, a]), g = { visible: { opacity: 1, scale: 1 }, hide: { opacity: 0.4, scale: 0.92, transition: { duration: 0.25 * n, ease: "easeOut" } } }, v = { visible: { pathLength: 1, opacity: 1 }, strike: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.35 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [A(m.g, { animate: t, initial: "visible", variants: g, style: { transformBox: "fill-box", transformOrigin: "center" }, children: [o("path", { d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }), o("path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }), o("path", { d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" })] }), o(m.path, { d: "m2 2 20 20", animate: r, initial: "visible", variants: v })] }) }) });
});
Ud.displayName = "EyeOffIcon";
var Kd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.15, 0.92, 1], rotate: [0, -4, 4, 0], transition: { duration: 0.9 * n, ease: "easeOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0.2, 1], opacity: [0.4, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7 a1 1 0 0 1 1-1h3z", variants: g }) }) }) });
});
Kd.displayName = "FacebookIcon";
var Gd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("run");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { x: 0, opacity: 1 }, run: { x: [0, 2.4, 0], opacity: [1, 0.75, 1], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0, delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box" } }), o(m.path, { d: "M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box" } })] }) }) });
});
Gd.displayName = "FastForwardIcon";
var Zd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, y: 0 }, animate: { scale: [1, 1.04, 1], y: [0, -1, 0], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: (w) => ({ opacity: [0, 1], scale: [0.85, 1], transition: { duration: 0.4 * n, ease: "easeOut", delay: w * 0.08 } }) }, v = ["M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z", "M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z", "M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z", "M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z", "M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"];
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: v.map((w, L) => o(m.path, { d: w, variants: g, custom: L }, L)) }) }) });
});
Zd.displayName = "FigmaIcon";
var Qd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("write");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { pathLength: 1, opacity: 1 }, write: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1], delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }), o("path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }), o(m.path, { d: "M10 9H8", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box", transformOrigin: "left center" } }), o(m.path, { d: "M16 13H8", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box", transformOrigin: "left center" } }), o(m.path, { d: "M16 17H8", animate: t, initial: "rest", variants: v(2), style: { transformBox: "fill-box", transformOrigin: "left center" } })] }) }) });
});
Qd.displayName = "FileTextIcon";
var Jd = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("sift");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { scaleY: 1, scaleX: 1 }, sift: { scaleY: [1, 0.86, 1.06, 1], scaleX: [1, 1.06, 0.97, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.35, 0.7, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: o("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: o(m.path, { d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z", animate: t, initial: "rest", variants: v, style: { transformBox: "fill-box", transformOrigin: "top center" } }) }) }) });
});
Jd.displayName = "FilterIcon";
var th = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("swim"), r.start("swim"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { rotate: 0 }, swim: { rotate: [0, 3, 0, -3, 0], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0 } } }, L = { rest: { rotate: 0 }, swim: { rotate: [0, -16, 0, 16, 0], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, animate: t, initial: "rest", variants: w, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" }), o("path", { d: "M18 12v.5" }), o("path", { d: "M16 17.93a9.77 9.77 0 0 1 0-11.86" }), o(m.path, { d: "M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", transformOrigin: "right center" } }), o("path", { d: "M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" }), o("path", { d: "m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" })] }) }) });
});
th.displayName = "FishIcon";
var eh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1.3, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, y: 0, rotate: 0 }, animate: { scale: [1, 1.05, 1.02, 1], y: [0, -2, -1, 0], rotate: [0, -2, 1, 0], transition: { duration: n, ease: "easeInOut" } } }, g = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [0, -40, 0], transition: { duration: n * 0.8, ease: "linear" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4", variants: g, style: { strokeDasharray: 120, transformOrigin: "12px 18px" } }) }) }) });
});
eh.displayName = "FlameIcon";
var ah = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, e, c]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.05, 0.98, 1], rotate: [0, -2, 2, 0], y: [0, -2, 1, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z", initial: "normal", animate: t, variants: y }) }) }) });
});
ah.displayName = "FolderIcon";
var nh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.05, 0.97, 1], rotate: [0, -2, 2, 0], y: [0, -1.5, 0.5, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, v = { normal: { y: 0, opacity: 0 }, animate: { y: [-6, 0], opacity: [0, 1, 0], transition: { duration: 1 * n, ease: "easeInOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2", animate: t, initial: "normal", variants: g }), o(m.rect, { x: "7", y: "11", width: "10", height: "6", rx: "1", animate: r, initial: "normal", variants: v })] }) }) });
});
nh.displayName = "FolderOpenIcon";
var rh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.07, 0.95, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.4 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 1.5 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: "M5 16V9h14V2H5l14 14h-7m-7 0 7 7v-7m-7 0h7", variants: g }) }) }) });
});
rh.displayName = "FramerIcon";
var ih = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 0.95, 1], transition: { duration: 0.5 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 0.85, 1], rotate: [0, 20, -20, 0], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.line, { x1: "6", x2: "10", y1: "11", y2: "11", variants: g, initial: "normal", animate: t }), o(m.line, { x1: "8", x2: "8", y1: "9", y2: "13", variants: g, initial: "normal", animate: t }), o(m.line, { x1: "15", x2: "15.01", y1: "12", y2: "12", variants: g, initial: "normal", animate: t }), o(m.line, { x1: "18", x2: "18.01", y1: "10", y2: "10", variants: g, initial: "normal", animate: t })] }) }) });
});
ih.displayName = "GamepadIcon";
var oh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.16 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.26 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.36 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-georgian-lari-icon lucide-georgian-lari", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M11.5 21a7.5 7.5 0 1 1 7.35-9" }), o("path", { d: "M13 12V3" }), o("path", { d: "M4 21h16" }), o("path", { d: "M9 12V3" })] }), o(m.path, { d: "M11.5 21a7.5 7.5 0 1 1 7.35-9", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M9 12V3", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M13 12V3", pathLength: 1, variants: w, initial: "normal", animate: t }), o(m.path, { d: "M4 21h16", pathLength: 1, variants: L, initial: "normal", animate: t })] }) }) });
});
oh.displayName = "GeorgianLariIcon";
var sh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("shake"), r.start("shake"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { rotate: 0 }, shake: { rotate: [0, -7, 6, -4, 3, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.38, 0.58, 0.78, 1] } } }, L = { rest: { scale: 1 }, shake: { scale: [1, 1.18, 0.96, 1.06, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: 0.16 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, animate: t, initial: "rest", variants: w, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("rect", { x: "3", y: "8", width: "18", height: "4", rx: "1" }), o("path", { d: "M12 8v13" }), o("path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" }), o(m.path, { d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", transformOrigin: "bottom center" } })] }) }) });
});
sh.displayName = "GiftIcon";
var lh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.12, 1], opacity: [1, 0.9, 1], transition: { duration: n * 0.35, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { pathLength: { duration: n * 0.6, ease: y, delay: n * 0.15 }, opacity: { duration: n * 0.3, ease: "easeOut", delay: n * 0.15 } } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.55 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { overflow: "visible" }, children: [o(m.circle, { cx: "6", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M15 6a9 9 0 0 0-9 9V3", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: w, initial: "normal", animate: t })] }) }) });
});
lh.displayName = "GitBranchIcon";
var ch = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.12, 1], opacity: [1, 0.9, 1], transition: { duration: n * 0.35, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { pathLength: { duration: n * 0.6, ease: y, delay: n * 0.15 }, opacity: { duration: n * 0.3, ease: "easeOut", delay: n * 0.15 } } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.55 } } }, L = { normal: { scaleX: 1, y: 0 }, animate: { scaleX: [1, 0.55, 1], y: [0, -1, 0], transition: { duration: 0.28 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { overflow: "visible" }, children: [o(m.circle, { cx: "6", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M15 6a9 9 0 0 0-9 9V3", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: w, initial: "normal", animate: t }), o(m.path, { d: "M21 18h-6", variants: L, initial: "normal", animate: t })] }) }) });
});
ch.displayName = "GitBranchMinusIcon";
var uh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((T) => {
    !c || r || (l.current ? e?.(T) : t.start("animate"));
  }, [t, r, c, e]), f = x((T) => {
    l.current ? a?.(T) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.12, 1], opacity: [1, 0.9, 1], transition: { duration: n * 0.35, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { pathLength: { duration: n * 0.6, ease: y, delay: n * 0.15 }, opacity: { duration: n * 0.3, ease: "easeOut", delay: n * 0.15 } } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.55 } } }, L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.2, 0.85, 1], rotate: [0, 10, -10, 0], transition: { duration: 1 * n, ease: "easeInOut", repeat: 0 } } }, N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.6 * n, ease: "easeInOut", repeat: 0, repeatDelay: 0.4 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { overflow: "visible" }, children: [o(m.circle, { cx: "6", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M15 6a9 9 0 0 0-9 9V3", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: w, initial: "normal", animate: t }), A(m.g, { variants: L, initial: "normal", animate: t, children: [o(m.path, { d: "M18 15v6", variants: N }), o(m.path, { d: "M21 18h-6", variants: N })] })] }) }) });
});
uh.displayName = "GitBranchPlusIcon";
var mh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.7, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((T) => {
    !c || r || (l.current ? e?.(T) : t.start("animate"));
  }, [t, r, c, e]), f = x((T) => {
    l.current ? a?.(T) : t.start("normal");
  }, [t, a]), y = [0.34, 1.56, 0.64, 1], g = [0.16, 1, 0.3, 1], v = { normal: { rotate: 0 }, animate: { rotate: 360, transition: { duration: n, ease: "linear" } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.2, 1.24, 0.92, 1], opacity: [0, 1], transition: { scale: { duration: 0.52 * n, ease: y, delay: 0 }, opacity: { duration: 0.22 * n, ease: "easeOut", delay: 0 } } } }, L = { normal: { x1: 3, opacity: 1 }, animate: { x1: [9, 3], opacity: [0, 1], transition: { x1: { duration: 0.42 * n, ease: g, delay: 0.42 * n }, opacity: { duration: 0.18 * n, ease: "easeOut", delay: 0.42 * n } } } }, N = { normal: { x2: 21, opacity: 1 }, animate: { x2: [15, 21], opacity: [0, 1], transition: { x2: { duration: 0.42 * n, ease: g, delay: 0.42 * n }, opacity: { duration: 0.18 * n, ease: "easeOut", delay: 0.42 * n } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: v, initial: "normal", animate: t, children: [o(m.circle, { cx: "12", cy: "12", r: "3", variants: w, initial: "normal", animate: t }), o(m.line, { x1: "3", x2: "9", y1: "12", y2: "12", variants: L, initial: "normal", animate: t }), o(m.line, { x1: "15", x2: "21", y1: "12", y2: "12", variants: N, initial: "normal", animate: t })] }) }) });
});
mh.displayName = "GitCommitHorizontalIcon";
var dh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.7, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((T) => {
    !c || r || (l.current ? e?.(T) : t.start("animate"));
  }, [t, r, c, e]), f = x((T) => {
    l.current ? a?.(T) : t.start("normal");
  }, [t, a]), y = [0.34, 1.56, 0.64, 1], g = [0.16, 1, 0.3, 1], v = { normal: { rotate: 0 }, animate: { rotate: 360, transition: { duration: n, ease: "linear" } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.2, 1.24, 0.92, 1], opacity: [0, 1], transition: { scale: { duration: 0.52 * n, ease: y, delay: 0 }, opacity: { duration: 0.22 * n, ease: "easeOut", delay: 0 } } } }, L = { normal: { y1: 3, opacity: 1 }, animate: { y1: [9, 3], opacity: [0, 1], transition: { y1: { duration: 0.42 * n, ease: g, delay: 0.42 * n }, opacity: { duration: 0.18 * n, ease: "easeOut", delay: 0.42 * n } } } }, N = { normal: { y2: 21, opacity: 1 }, animate: { y2: [15, 21], opacity: [0, 1], transition: { y2: { duration: 0.42 * n, ease: g, delay: 0.42 * n }, opacity: { duration: 0.18 * n, ease: "easeOut", delay: 0.42 * n } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: v, initial: "normal", animate: t, children: [o(m.path, { d: "M12 3v6", variants: L, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "12", r: "3", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M12 15v6", variants: N, initial: "normal", animate: t })] }) }) });
});
dh.displayName = "GitCommitVerticalIcon";
var hh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((Y) => {
    !c || r || (l.current ? e?.(Y) : t.start("animate"));
  }, [t, r, c, e]), f = x((Y) => {
    l.current ? a?.(Y) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y, delay: n * 0.3 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.5, ease: y, delay: n * 0.15 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.5, ease: y, delay: n * 0.45 } } }, N = { normal: { x: 0, opacity: 1 }, animate: { x: [-4, 0], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.3 } } }, T = { normal: { x: 0, opacity: 1 }, animate: { x: [4, 0], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.6 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "5", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M12 6h5a2 2 0 0 1 2 2v7", variants: w, initial: "normal", animate: t }), o(m.path, { d: "m15 9-3-3 3-3", variants: N, initial: "normal", animate: t }), o(m.circle, { cx: "19", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M12 18H7a2 2 0 0 1-2-2V9", variants: L, initial: "normal", animate: t }), o(m.path, { d: "m9 15 3 3-3 3", variants: T, initial: "normal", animate: t })] }) }) });
});
hh.displayName = "GitCompareArrowsIcon";
var ph = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y, delay: n * 0.15 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.5, ease: y, delay: n * 0.3 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.5, ease: y, delay: n * 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "6", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M13 6h3a2 2 0 0 1 2 2v7", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M11 18H8a2 2 0 0 1-2-2V9", variants: L, initial: "normal", animate: t })] }) }) });
});
ph.displayName = "GitCompareIcon";
var fh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((T) => {
    !c || r || (l.current ? e?.(T) : t.start("animate"));
  }, [t, r, c, e]), f = x((T) => {
    l.current ? a?.(T) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.45, ease: y, delay: n * 0.15 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.4, ease: y, delay: n * 0.4 } } }, L = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.25, ease: y, delay: n * 0.65 } } }, N = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.25, ease: y, delay: n * 0.65 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "12", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M12 12v3", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9", variants: w, initial: "normal", animate: t }), o(m.circle, { cx: "6", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: L, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: N, initial: "normal", animate: t })] }) }) });
});
fh.displayName = "GitForkIcon";
var yh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.85, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((T) => {
    !c || r || (l.current ? e?.(T) : t.start("animate"));
  }, [t, r, c, e]), f = x((T) => {
    l.current ? a?.(T) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y, delay: n * 0.1 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.4, ease: y, delay: n * 0.25 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.45, ease: y, delay: n * 0.45 } } }, N = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.15, 1], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.75 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M9 3 3 9", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M9 9 3 3", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M6 12v9", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M12 6h4a2 2 0 0 1 2 2v7", variants: L, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: N, initial: "normal", animate: t })] }) }) });
});
yh.displayName = "GitMergeConflictIcon";
var vh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = [0.25, 1, 0.5, 1], g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.1, 1], opacity: [0, 1], transition: { duration: n * 0.3, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.3, 1], transition: { duration: n * 0.6, ease: y, delay: n * 0.15 } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.15, 1], opacity: [0, 1], transition: { duration: n * 0.35, ease: y, delay: n * 0.65 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "6", cy: "6", r: "3", style: { transformOrigin: "center" }, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M6 21V9a9 9 0 0 0 9 11", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "18", cy: "18", r: "3", style: { transformOrigin: "center" }, variants: w, initial: "normal", animate: t })] }) }) });
});
vh.displayName = "GitMergeIcon";
var gh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, e, c]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, transition: { duration: 0.3 * n } }, animate: { scale: [1, 1.05, 1], transition: { duration: 1 * n } } }, g = { normal: { pathLength: 1, pathOffset: 0, opacity: 1, transition: { duration: 0.3 * n } }, animate: { pathLength: [1, 0.6, 1], pathOffset: [0, 0.4, 0], opacity: [1, 0.7, 1], transition: { duration: 1 * n } } }, v = { normal: { rotate: 0, originX: 0.9, originY: 0.5 }, animate: { rotate: [0, 20, -15, 0], originX: 0.9, originY: 0.5, transition: { duration: 1 * n, repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.path, { d: `M15 22v-4a4.8 4.8 0 0 0-1-3.5
	                        c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5
	                        .28-1.15.28-2.35 0-3.5
	                        0 0-1 0-3 1.5
	                        -2.64-.5-5.36-.5-8 0
	                        C6 2 5 2 5 2
	                        c-.3 1.15-.3 2.35 0 3.5
	                        A5.403 5.403 0 0 0 4 9
	                        c0 3.5 3 5.5 6 5.5
	                        -.39.49-.68 1.05-.85 1.65
	                        -.17.6-.22 1.23-.15 1.85v4`, variants: g, initial: "normal" }), o(m.path, { d: "M9 18c-4.51 2-5-2-7-2", variants: v, initial: "normal", animate: t })] }) }) });
});
gh.displayName = "GithubIcon";
var wh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.7, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 0.9, 1.08, 1], opacity: [1, 0.85, 1], transition: { duration: n, ease: [0.34, 1.56, 0.64, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: o(m.path, { d: "m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.18.38.38 0 0 0-.26-.08.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.69-6.88a.71.71 0 0 0 .31-.83Z" }) }) }) });
});
wh.displayName = "GitlabIcon";
var kh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((L) => {
    !c || l || (h.current ? e?.(L) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, c, e]), y = x((L) => {
    h.current ? a?.(L) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.03, 1], rotate: 360, transition: { rotate: { duration: 1.4 * n, ease: "linear" }, scale: { duration: 0.25 * n, ease: "easeOut" } } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0.9, 1], opacity: [0.8, 1], transition: { duration: 0.35 * n, ease: "easeOut" } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.5, 1], transition: { duration: 0.4 * n, delay: 0.08 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: g, children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: v, initial: "normal", animate: r }), o(m.path, { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", variants: w, initial: "normal", animate: r }), o(m.path, { d: "M2 12h20", variants: w, initial: "normal", animate: r })] }) }) });
});
kh.displayName = "GlobeIcon";
var xh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, x: 0, opacity: 1 }, animate: { rotate: [0, -8, 8, -5, 5, 0], x: [0, -2, 2, -1, 1, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M15.686 15A14.5 14.5 0 0 1 12 22a14.5 14.5 0 0 1 0-20 10 10 0 1 0 9.542 13" }), o("path", { d: "M2 12h8.5" }), o(m.path, { d: "M20 6V4a2 2 0 1 0-4 0v2", variants: y, initial: "normal", animate: t }), o(m.rect, { width: "8", height: "5", x: "14", y: "6", rx: "1", variants: y, initial: "normal", animate: t })] }) }) });
});
xh.displayName = "GlobeLockIcon";
var Mh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("strum");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { x: 0, y: 0 }, strum: { x: [0, 0.5, -0.4, 0.25, 0], y: [0, -0.5, 0.4, -0.25, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.2, 0.48, 0.74, 1], delay: w * 0.08 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m11.9 12.1 4.514-4.514", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box" } }), o("path", { d: "M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z" }), o(m.path, { d: "m6 16 2 2", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box" } }), o("path", { d: "M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z" })] }) }) });
});
Mh.displayName = "GuitarIcon";
var Lh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -2, 1, 0], transition: { duration: 0.9 * n, ease: [0.22, 1, 0.36, 1] } } }, w = { normal: { scale: 1, opacity: 1, y: 0 }, animate: { scale: [0.7, 1.02, 1], opacity: [0, 1, 1], y: [-6, 0], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.1 } } }, L = { normal: { pathLength: 1, opacity: 1, y: 0 }, animate: { pathLength: [0, 1], opacity: [0.5, 1], y: [2, 0], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: v, children: [o(m.path, { d: "M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17", initial: "normal", animate: l, variants: L }), o(m.path, { d: "m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9", initial: "normal", animate: l, variants: L }), o(m.path, { d: "m2 16 6 6", initial: "normal", animate: l, variants: L }), o(m.circle, { cx: "16", cy: "9", r: "2.9", initial: "normal", animate: r, variants: w }), o(m.circle, { cx: "6", cy: "5", r: "3", initial: "normal", animate: r, variants: w })] }) }) });
});
Lh.displayName = "HandCoinsIcon";
var _h = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, -3, 3, -2, 0], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.2, 0.9, 1], opacity: [1, 0.7, 1], transition: { duration: 0.9 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: `M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 
	            2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 
	            2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 
	            2 0 0 1 2-2h3`, variants: g }) }) }) });
});
_h.displayName = "HeadphonesIcon";
var Ah = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, -3, 3, -2, 0], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.2, 0.9, 1], opacity: [1, 0.7, 1], transition: { duration: 0.9 * n, ease: "easeInOut", repeat: 0 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [1, 0, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: `M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 
	            2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 
	            0v7a2 2 0 0 1-2 2h-1a2 
	            2 0 0 1-2-2v-3a2 2 0 0 1 
	            2-2h3`, variants: g }), o(m.path, { d: "M22 2L2 22", variants: v, strokeWidth: 2.5 })] }) }) });
});
Ah.displayName = "HeadphonesOffIcon";
var bh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { strokeDashoffset: 0, scale: 1, rotate: 0 }, animate: { strokeDashoffset: [240, 40, 0], scale: [1, 0.96, 1.06, 1], rotate: [0, -2, 1, 0], transition: { duration: 0.95 * n, ease: [0.2, 0.85, 0.25, 1], times: [0, 0.35, 0.75, 1] } } }, v = { normal: { strokeDashoffset: 0, x: 0, opacity: 1 }, animate: { strokeDashoffset: [100, 20, 0], x: [10, -4, 0], opacity: [0, 1, 1], transition: { duration: 0.7 * n, ease: [0.22, 0.9, 0.28, 1], delay: 0.18, times: [0, 0.5, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z", initial: "normal", animate: t, variants: g, style: { strokeDasharray: 240, transformOrigin: "12px 12px" } }), o(m.path, { d: "M21 16v2a4 4 0 0 1-4 4h-5", initial: "normal", animate: r, variants: v, style: { strokeDasharray: 100, strokeLinecap: "round" } })] }) }) });
});
bh.displayName = "HeadsetIcon";
var Nh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = [0.16, 1, 0.3, 1], g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.45 * n, ease: y } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.45 * n, ease: y, delay: 0.1 * n } } }, w = { normal: { scale: 1 }, animate: { scale: [1, 1.25, 0.95, 1.12, 1], transition: { duration: 0.95 * n, ease: "easeOut", times: [0, 0.28, 0.48, 0.72, 1], delay: 0.1 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: w, style: { transformOrigin: "center" }, children: [o(m.path, { d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676", variants: g, strokeLinecap: "round", strokeLinejoin: "round" }), o(m.path, { d: "M12.409 5.824A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5", variants: v, strokeLinecap: "round", strokeLinejoin: "round" })] }) }) });
});
Nh.displayName = "HeartIcon";
var $h = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { opacity: 1 }, animate: { opacity: 0.65, transition: { duration: 0.2 * n, ease: "easeOut" } } }, g = { normal: { opacity: 1 }, animate: { opacity: [1, 0.4, 1], transition: { duration: 0.35 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o("path", { d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10" }), o(m.path, { d: "M21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9", variants: y }), o(m.path, { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", variants: g })] }) }) });
});
$h.displayName = "HouseIcon";
var Eh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("draw"), r.start("draw"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { pathLength: 1, opacity: 1 }, draw: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } }, L = { rest: { scale: 1, opacity: 1 }, draw: { scale: [0, 1.25, 1], opacity: [0, 1, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: 0.3 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }), o(m.circle, { cx: "9", cy: "9", r: "2", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
Eh.displayName = "ImageIcon";
var Ch = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((Y) => {
    !c || r || (l.current ? e?.(Y) : t.start("animate"));
  }, [t, r, c, e]), f = x((Y) => {
    l.current ? a?.(Y) : t.start("normal");
  }, [t, a]), y = [0.12, 1, 0.25, 1], g = { normal: { strokeDasharray: "1", strokeDashoffset: 0 }, animate: { strokeDasharray: "1", strokeDashoffset: [1, 0], transition: { duration: 0.5 * n, ease: y, delay: 0.06 } } }, v = { normal: { strokeDasharray: "1", strokeDashoffset: 0 }, animate: { strokeDasharray: "1", strokeDashoffset: [1, 0], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.16 } } }, w = { normal: { strokeDasharray: "1", strokeDashoffset: 0 }, animate: { strokeDasharray: "1", strokeDashoffset: [1, 0], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.26 } } }, L = { normal: { strokeDasharray: "1", strokeDashoffset: 0 }, animate: { strokeDasharray: "1", strokeDashoffset: [1, 0], transition: { duration: 0.45 * n, ease: "easeInOut", delay: 0.42 } } }, N = { normal: { scale: 1, x: 0, y: 0 }, animate: { scale: [1, 1.05, 1], x: [0, -1, 0], y: [0, -1, 0], transition: { duration: 0.6 * n, ease: y } } }, T = { normal: { strokeDasharray: "1", strokeDashoffset: 0, x: 0, y: 0, opacity: 1, scale: 1 }, animate: { strokeDasharray: "1", strokeDashoffset: [1, 0], x: [-0.3, 0.5, 0], y: [-0.2, 0.5, 0], scale: [1, 1.05, 1], opacity: [1, 1], transition: { duration: 0.6 * n, ease: y, delay: 0.5 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-indian-rupee-icon lucide-indian-rupee", children: A(m.g, { variants: N, initial: "normal", animate: t, children: [A("g", { opacity: 0.3, children: [o("path", { d: "M6 3h12" }), o("path", { d: "M6 8h12" }), o("path", { d: "M9 13c6.667 0 6.667-10 0-10" }), o("path", { d: "M6 13h3" }), o("path", { d: "m6 13 8.5 8" })] }), o(m.path, { d: "M6 3h12", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M6 8h12", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M9 13c6.667 0 6.667-10 0-10", pathLength: 1, variants: w, initial: "normal", animate: t }), o(m.path, { d: "M6 13h3", pathLength: 1, variants: L, initial: "normal", animate: t }), o(m.path, { d: "m6 13 8.5 8", pathLength: 1, variants: T, initial: "normal", animate: t })] }) }) }) });
});
Ch.displayName = "IndianRupeeIcon";
var Ih = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -2, 2, 0], scale: [1, 1.08, 0.95, 1], transition: { duration: 0.7 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.8 * n, ease: "easeInOut", repeat: 0 } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.3, 0.8, 1], opacity: [1, 0.5, 1], transition: { duration: 0.5 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.circle, { cx: "12", cy: "12", r: "10", variants: g }), o(m.path, { d: "M12 16v-4", variants: v }), o(m.path, { d: "M12 8h.01", variants: v })] }) }) });
});
Ih.displayName = "InfoIcon";
var Oh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 1], rotate: 0, transition: { duration: 0.4 * n, ease: "easeOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0.2, 1], opacity: [0.6, 1], transition: { duration: 0.55 * n, ease: "easeInOut" } } }, v = { normal: { scale: 1, pathLength: 1 }, animate: { scale: [0.85, 1.05, 1], pathLength: [0, 1], transition: { duration: 0.5 * n, delay: 0.1 * n, ease: "easeOut" } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.5, 1], opacity: [1, 0.4, 1], transition: { duration: 0.35 * n, delay: 0.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.rect, { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5", variants: g }), o(m.path, { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z", variants: v }), o(m.line, { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5", variants: w })] }) }) });
});
Oh.displayName = "InstagramIcon";
var jh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = [0.16, 1, 0.3, 1], g = { normal: { scale: 1, rotate: 0, x: 0, y: 0 }, animate: { scale: [1, 1.01, 1.01, 1], rotate: [0, -6, 0, 6, 0], x: [0, 0, 0, 0, 0], y: [0, 0, 0, 0, 0], transition: { duration: 0.9 * n, ease: y, times: [0, 0.25, 0.5, 0.75, 1] } } }, v = { normal: { strokeDashoffset: 0, scale: 1, opacity: 1 }, animate: { scale: [1, 0.98, 1, 1.02, 1], opacity: [1, 1, 1, 1, 1], transition: { duration: 0.9 * n, ease: y, times: [0, 0.25, 0.5, 0.75, 1] } } }, w = { normal: { strokeDashoffset: 0, opacity: 1, x: 0 }, animate: { x: [0, -0.6, 0, 0.6, 0], opacity: [1, 1, 1, 1, 1], transition: { duration: 0.9 * n, ease: y, times: [0, 0.25, 0.5, 0.75, 1] } } }, L = { normal: { x: 0, y: 0, rotate: 0, originX: 19, originY: 6 }, animate: { rotate: [0, -18, 0, 18, 0], x: [0, -1, 0, 1, 0], y: [0, -0.4, 0, 0.4, 0], transition: { duration: 0.9 * n, ease: y, times: [0, 0.25, 0.5, 0.75, 1], delay: 0.04 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-key-icon lucide-key", children: A(m.g, { variants: g, initial: "normal", animate: t, children: [o(m.circle, { cx: "7.5", cy: "15.5", r: "5.5", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m21 2-9.6 9.6", variants: w, initial: "normal", animate: t }), o(m.path, { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4", variants: L, initial: "normal", animate: t })] }) }) }) });
});
jh.displayName = "KeyIcon";
var Sh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [140, 0], opacity: [0.4, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, rotate: 0, originX: 16.5, originY: 7.5 }, animate: { scale: [1, 1.12, 1], rotate: [0, -8, 8, 0], transition: { duration: 0.6 * n, delay: 0.45, ease: "easeInOut" } } }, v = { normal: { x: 0, y: 0 }, animate: { x: [0, 1.2, 0], y: [0, -0.6, 0], transition: { duration: 0.45 * n, delay: 0.55, ease: "easeInOut" } } }, w = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -2, 2, 0], scale: [1, 1.02, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-key-round-icon lucide-key-round", children: A(m.g, { variants: w, initial: "normal", animate: t, children: [o(m.path, { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z", strokeDasharray: "140", strokeDashoffset: "140", variants: y, initial: "normal", animate: t }), o(m.g, { variants: v, initial: "normal", animate: t, children: o(m.path, { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172" }) }), o(m.circle, { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", variants: g, initial: "normal", animate: t })] }) }) }) });
});
Sh.displayName = "KeyRoundIcon";
var Th = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((T) => {
    !c || l || (h.current ? e?.(T) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, c, e]), y = x((T) => {
    h.current ? a?.(T) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.03, 0.995, 1], rotate: [0, -3, 1, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.05 } } }, w = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [0.4, 0], y: [0, -0.4, 0], opacity: [0.5, 1], transition: { duration: 0.45 * n, ease: "easeOut", delay: 0.12 } } }, L = { normal: { scale: 1, rotate: 0, originX: 12, originY: 12 }, animate: { scale: [1, 1.06, 1], rotate: [0, -10, 0], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.18 } } }, N = { normal: { pathLength: 0, opacity: 0 }, animate: { pathLength: [0, 1], opacity: [0, 1, 0], transition: { duration: 0.4 * n, ease: "easeOut", delay: 0.36 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-key-square-icon lucide-key-square", children: A(m.g, { variants: g, initial: "normal", animate: t, children: [o(m.path, { d: "M12.4 2.7a2.5 2.5 0 0 1 3.4 0l5.5 5.5a2.5 2.5 0 0 1 0 3.4l-3.7 3.7a2.5 2.5 0 0 1-3.4 0L8.7 9.8a2.5 2.5 0 0 1 0-3.4z", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m14 7 3 3", variants: L, initial: "normal", animate: t }), o(m.path, { d: "m9.4 10.6-6.814 6.814A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M10.1 13.9 L12.2 12.2", stroke: "currentColor", strokeWidth: "1.4", variants: N, initial: "normal", animate: r })] }) }) }) });
});
Th.displayName = "KeySquareIcon";
var Bh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("open");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((L) => {
    !c || r || (l.current ? e?.(L) : h());
  }, [c, r, h, e]), g = x((L) => {
    l.current ? a?.(L) : f();
  }, [f, a]), v = { transformPerspective: 55, originX: "12px", originY: "15.526px" }, w = { rest: { rotateX: 0, ...v, transition: { duration: 0.5 * n, ease: "easeOut" } }, open: { rotateX: [72, -8, 3, 0], ...v, transition: { duration: 1.2 * n, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 0.84, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M4 15.526V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8.526", animate: t, initial: "rest", variants: w, style: { transformBox: "view-box" } }), o("path", { d: "M20 15.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526" }), o("path", { d: "M20.054 15.987H3.946" })] }) }) });
});
Bh.displayName = "LaptopIcon";
var Dh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.2, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: 1.05, transition: { duration: n, ease: "easeOut" } } }, g = { normal: { y: 0, opacity: 1 }, animate: (v) => ({ y: -(v + 1) * 4, opacity: 1, transition: { duration: n, ease: "easeOut", delay: v * 0.07 } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: y, children: [o(m.path, { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z", variants: g, custom: 0 }), o(m.path, { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12", variants: g, custom: 1 }), o(m.path, { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17", variants: g, custom: 2 })] }) }) });
});
Dh.displayName = "LayersIcon";
var zh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.03, 1], rotate: [0, 1, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: (w) => ({ opacity: [0.4, 1], scale: [0.85, 1.08, 1], transition: { duration: 0.55 * n, delay: 0.08 * w, ease: "easeOut" } }) }, v = { normal: { x: -26, y: -26, opacity: 0 }, animate: { x: [-26, 26], y: [-26, 26], opacity: [0, 0.35, 0], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.1 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-layout-grid-icon lucide-layout-grid", children: [o("defs", { children: A("linearGradient", { id: "grid-sweep", x1: "0", y1: "0", x2: "1", y2: "1", children: [o("stop", { offset: "0%", stopColor: "currentColor", stopOpacity: "0" }), o("stop", { offset: "50%", stopColor: "currentColor", stopOpacity: "0.35" }), o("stop", { offset: "100%", stopColor: "currentColor", stopOpacity: "0" })] }) }), A(m.g, { variants: y, initial: "normal", animate: t, children: [o(m.rect, { width: "7", height: "7", x: "3", y: "3", rx: "1", variants: g, custom: 0, initial: "normal", animate: t }), o(m.rect, { width: "7", height: "7", x: "14", y: "3", rx: "1", variants: g, custom: 1, initial: "normal", animate: t }), o(m.rect, { width: "7", height: "7", x: "14", y: "14", rx: "1", variants: g, custom: 2, initial: "normal", animate: t }), o(m.rect, { width: "7", height: "7", x: "3", y: "14", rx: "1", variants: g, custom: 3, initial: "normal", animate: t }), o(m.rect, { x: "2", y: "2", width: "20", height: "20", rx: "3", fill: "url(#grid-sweep)", variants: v, initial: "normal", animate: t, style: { pointerEvents: "none" } })] })] }) }) });
});
zh.displayName = "LayoutGridIcon";
var Wh = $(({ className: e, size: a = 24, duration: s = 1, isAnimated: i = !0, color: n, onMouseEnter: c, onMouseLeave: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !i || r || (l.current ? c?.(v) : t.start("animate"));
  }, [t, r, i, c]), f = x((v) => {
    l.current ? d?.(v) : t.start("normal");
  }, [t, d]), y = { normal: { scale: 1, opacity: 1 }, animate: (v) => ({ scale: [0.85, 1.05, 1], opacity: [0.6, 1], transition: { duration: 0.35 * s, delay: v * 0.08, ease: "easeOut" } }) }, g = { normal: { scaleX: 1 }, animate: (v) => ({ scaleX: [0, 1], transition: { duration: 0.3 * s, delay: 0.15 + v * 0.07, ease: "easeOut" } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", e), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: n, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: a, height: a, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.rect, { width: "7", height: "7", x: "3", y: "3", rx: "1", variants: y, custom: 0 }), o(m.rect, { width: "7", height: "7", x: "3", y: "14", rx: "1", variants: y, custom: 1 }), o(m.path, { d: "M14 4h7", variants: g, custom: 0, style: { transformOrigin: "left" } }), o(m.path, { d: "M14 9h7", variants: g, custom: 1, style: { transformOrigin: "left" } }), o(m.path, { d: "M14 15h7", variants: g, custom: 2, style: { transformOrigin: "left" } }), o(m.path, { d: "M14 20h7", variants: g, custom: 3, style: { transformOrigin: "left" } })] }) }) });
});
Wh.displayName = "LayoutListIcon";
var Vh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("on");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { opacity: 1, scale: 1 }, on: { opacity: [0.35, 1, 0.55, 1, 0.85, 1], scale: [0.94, 1.08, 1, 1.04, 1, 1], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.18, 0.32, 0.5, 0.7, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5", animate: t, initial: "rest", variants: v, style: { transformBox: "fill-box", transformOrigin: "bottom center" } }), o("path", { d: "M9 18h6" }), o("path", { d: "M10 22h4" })] }) }) });
});
Vh.displayName = "LightbulbIcon";
var Rh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r]), g = { normal: { scale: 1, rotate: 0, x: 0 }, animate: { x: [0, -2, 0], rotate: [0, -3, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, v = { normal: { scale: 1, rotate: 0, x: 0 }, animate: { x: [0, 2, 0], rotate: [0, 3, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", variants: v, initial: "normal", animate: r }), o(m.path, { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71", variants: g, initial: "normal", animate: t })] }) }) });
});
Rh.displayName = "LinkIcon";
var Ph = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 1], rotate: 0, transition: { duration: 0.45 * n, ease: "easeOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0.3, 1], opacity: [0.6, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.45 * n, delay: 0.12 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: `M16 8a6 6 0 0 1 6 6v7h-4v-7
	              a2 2 0 0 0-2-2 
	              2 2 0 0 0-2 2v7h-4v-7
	              a6 6 0 0 1 6-6z`, variants: g }), o(m.rect, { width: "4", height: "12", x: "2", y: "9", variants: v }), o(m.circle, { cx: "4", cy: "4", r: "2", variants: v })] }) }) });
});
Ph.displayName = "LinkedinIcon";
var Fh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.9, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -2, 2, 0], opacity: [1, 0.9, 0.9, 1], transition: { duration: 0.75 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { y: 0, opacity: 1, rotate: 0 }, animate: { y: [0, -4, -2, 0], rotate: [0, -4, -2, 0], opacity: [1, 0.9, 0.95, 1], transition: { duration: 0.9 * n, ease: "easeOut", repeat: 0, delay: 0.04 } } }, v = { normal: { y: 0, opacity: 1, rotate: 0 }, animate: { y: [0, 4, 2, 0], rotate: [0, 4, 2, 0], opacity: [1, 0.9, 0.95, 1], transition: { duration: 0.9 * n, ease: "easeOut", repeat: 0, delay: 0.12 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "M3 5h8", variants: y, stroke: "currentColor" }), o(m.path, { d: "M3 12h8", variants: y, stroke: "currentColor", transition: { delay: 0.06 } }), o(m.path, { d: "M3 19h8", variants: y, stroke: "currentColor", transition: { delay: 0.12 } }), o(m.path, { d: "m15 8 3-3 3 3", variants: g, stroke: "currentColor" }), o(m.path, { d: "m15 16 3 3 3-3", variants: v, stroke: "currentColor" })] }) }) });
});
Fh.displayName = "ListChevronsUpDownIcon";
var Hh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((y) => {
    !c || r || (l.current ? e?.(y) : t.start("animate"));
  }, [t, r, c, e]), f = x((y) => {
    l.current ? a?.(y) : t.start("normal");
  }, [t, a]);
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: { normal: { rotate: 0 }, animate: { rotate: 360, transition: { duration: 1 * n, ease: "linear", repeat: 1 / 0 } } }, children: o("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }) }) }) });
});
Hh.displayName = "LoaderCircleIcon";
var qh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1, transition: { duration: 0.3 * n } }, animate: { rotate: 360, scale: [1, 1.1, 1], transition: { rotate: { duration: 1 * n, ease: "linear", repeat: 1 / 0 }, scale: { duration: 0.6 * n, repeat: 1 / 0, repeatType: "mirror" } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: [o(m.path, { d: "M12 2v4" }), o(m.path, { d: "m16.2 7.8 2.9-2.9" }), o(m.path, { d: "M18 12h4" }), o(m.path, { d: "m16.2 16.2 2.9 2.9" }), o(m.path, { d: "M12 18v4" }), o(m.path, { d: "m4.9 19.1 2.9-2.9" }), o(m.path, { d: "M2 12h4" }), o(m.path, { d: "m4.9 4.9 2.9 2.9" })] }) }) });
});
qh.displayName = "LoaderIcon";
var Yh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, rotate: 0 }, animate: { x: [0, -3, 3, -3, 3, 0], rotate: [0, -2, 2, -2, 2, 0], transition: { duration: 0.4 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: [o(m.rect, { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", initial: "normal", animate: t }), o(m.path, { d: "M7 11V7a5 5 0 0 1 10 0v4", initial: "normal", animate: t })] }) }) });
});
Yh.displayName = "LockIcon";
var Xh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 28, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, -3, 2, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [-8, 2, 0], opacity: [0, 1, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m10 17 5-5-5-5", variants: g }), o(m.path, { d: "M15 12H3", variants: g }), o(m.path, { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", variants: v })] }) }) });
});
Xh.displayName = "LoginIcon";
var Uh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 28, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, 3, -2, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [8, -2, 0], opacity: [0, 1, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.1 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m16 17 5-5-5-5", variants: g }), o(m.path, { d: "M21 12H9", variants: g }), o(m.path, { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", variants: v })] }) }) });
});
Uh.displayName = "LogoutIcon";
var Kh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (l.start("normal"), t.start("normal"), r.start("normal")) : (l.start("animate"), t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    l.start("normal"), t.start("normal"), r.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (l.start("animate"), t.start("animate"), r.start("animate")));
  }, [l, t, r, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (l.start("normal"), t.start("normal"), r.start("normal"));
  }, [l, t, r, a]), v = { normal: { scale: 1 }, animate: { scale: [1, 1.04, 1], transition: { duration: 0.36 * n, ease: "easeOut" } } }, w = { normal: { rotateX: 0, translateY: 0, transformOrigin: "12px 6px" }, animate: { rotateX: [-0, -12, 2, 0], translateY: [0, -1.6, 0.6, 0], transition: { duration: 0.45 * n, ease: "easeOut", times: [0, 0.5, 0.85, 1] } } }, L = { normal: { opacity: 1 }, animate: { opacity: [1, 0.95, 1], transition: { duration: 0.45 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, initial: "normal", animate: l, variants: v, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", initial: "normal", animate: t, variants: w, style: { transformStyle: "preserve-3d" } }), o(m.rect, { x: "2", y: "4", width: "20", height: "16", rx: "2", initial: "normal", animate: r, variants: L })] }) }) });
});
Kh.displayName = "MailIcon";
var Gh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scale: 1 }, animate: { y: [0, -3, 3, -2, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 1.6 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, g = { normal: { rotate: 0, opacity: 1 }, animate: { rotate: [-4, 4, -3, 0], opacity: [1, 0.7, 1], transition: { duration: 1.2 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } }, v = { normal: { opacity: 1 }, animate: { opacity: [0.7, 1, 0.5, 1], transition: { duration: 1.4 * n, ease: [0.42, 0, 0.58, 1], repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M17 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 1-1.732", variants: v }), o(m.path, { d: "m22 5.5-6.419 4.179a2 2 0 0 1-2.162 0L7 5.5", variants: g }), o(m.rect, { x: "7", y: "3", width: "15", height: "12", rx: "2", variants: v })] }) }) });
});
Gh.displayName = "MailsIcon";
var Zh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [140, 0], transition: { duration: 1.5 * n, ease: "easeOut" } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.2, 1], opacity: [1, 0.7, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.2 } } }, L = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [30, 0], transition: { duration: 1 * n, ease: "easeOut", delay: 0.4 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M19.43 12.935c.357-.967.57-1.955.57-2.935a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32.197 32.197 0 0 0 .813-.728", initial: "normal", animate: t, variants: v, style: { strokeDasharray: 140 } }), o(m.circle, { cx: "12", cy: "10", r: "3", initial: "normal", animate: r, variants: w }), o(m.path, { d: "m16 18 2 2 4-4", initial: "normal", animate: l, variants: L, style: { strokeDasharray: 30 } })] }) }) });
});
Zh.displayName = "MapPinCheckIcon";
var Qh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [160, 0], transition: { duration: 1 * n, ease: "easeInOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [28, 0], opacity: [0, 1], transition: { duration: 1 * n, ease: "easeOut", delay: 0.28 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", initial: "normal", animate: t, variants: g, style: { strokeDasharray: 160, strokeLinecap: "round" } }), o(m.path, { d: "m9 10 2 2 4-4", initial: "normal", animate: r, variants: v, style: { strokeDasharray: 28, strokeLinecap: "round" } })] }) }) });
});
Qh.displayName = "MapPinCheckInsideIcon";
var Jh = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { strokeDashoffset: 0, scale: 1 }, animate: { strokeDashoffset: [120, 0], scale: [1, 1.05, 1], transition: { duration: 1.5 * n, ease: "easeOut" } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.2, 1], opacity: [1, 0.7, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", initial: "normal", animate: t, variants: g, style: { strokeDasharray: 120, strokeLinecap: "round" } }), o(m.circle, { cx: "12", cy: "10", r: "3", initial: "normal", animate: r, variants: v })] }) }) });
});
Jh.displayName = "MapPinIcon";
var t0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [180, 0], transition: { duration: 1.6 * n, ease: "easeOut" } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.18, 1], opacity: [1, 0.8, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.8 } } }, L = { normal: { y: 0, strokeDashoffset: 0, opacity: 1 }, animate: { y: [-4, 0], strokeDashoffset: [80, 0], opacity: [0, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0", initial: "normal", animate: t, variants: v, style: { strokeDasharray: 180, strokeLinecap: "round" } }), o(m.circle, { cx: "12", cy: "8", r: "2", initial: "normal", animate: r, variants: w }), o(m.path, { d: "M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712", initial: "normal", animate: l, variants: L, style: { strokeDasharray: 80, strokeLinecap: "round" } })] }) }) });
});
t0.displayName = "MapPinnedIcon";
var e0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = [0.32, 1.2, 0.5, 1], g = [0.16, 1, 0.3, 1], v = { normal: { scale: 1, opacity: 1, rotate: 0 }, animate: { scale: [0, 1.12, 1], opacity: [0, 1], rotate: [-12, 2, 0], transition: { scale: { duration: n * 0.55, ease: y }, opacity: { duration: n * 0.3, ease: g }, rotate: { duration: n * 0.55, ease: y } } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { pathLength: { duration: n * 0.5, ease: g, delay: n * 0.18 }, opacity: { duration: n * 0.25, ease: g, delay: n * 0.18 } } } }, L = { normal: { pathLength: 1, opacity: 1, scale: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], scale: [0.88, 1.04, 1], transition: { pathLength: { duration: n * 0.65, ease: g, delay: n * 0.35 }, opacity: { duration: n * 0.3, ease: g, delay: n * 0.35 }, scale: { duration: n * 0.65, ease: y, delay: n * 0.35 } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "M16 3h5v5", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m21 3-6.75 6.75", variants: w, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "14", r: "6", variants: L, initial: "normal", animate: t })] }) }) });
});
e0.displayName = "MarsIcon";
var a0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("shout");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { rotate: 0, scale: 1 }, shout: { rotate: [0, -6, 4, -2, 0], scale: [1, 1.06, 1.01, 1.03, 1], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.22, 0.46, 0.72, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, animate: t, initial: "rest", variants: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" }), o("path", { d: "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" }), o("path", { d: "M8 6v8" })] }) }) });
});
a0.displayName = "MegaphoneIcon";
var n0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, scaleX: 1 }, animate: { x: 3, scaleX: 0.85, transition: { duration: 0.25 * n, ease: "easeOut", delay: 0 } } }, g = { normal: { x: 0, scaleX: 1 }, animate: { x: 5, scaleX: 0.7, transition: { duration: 0.25 * n, ease: "easeOut", delay: 0.05 * n } } }, v = { normal: { x: 0, scaleX: 1 }, animate: { x: 7, scaleX: 0.55, transition: { duration: 0.25 * n, ease: "easeOut", delay: 0.1 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "M4 6h16", variants: y, style: { transformOrigin: "left center" } }), o(m.path, { d: "M4 12h16", variants: g, style: { transformOrigin: "left center" } }), o(m.path, { d: "M4 18h16", variants: v, style: { transformOrigin: "left center" } })] }) }) });
});
n0.displayName = "MenuIcon";
var r0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 0.95, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.1 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: `M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 
	               3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 
	               0 0 1 1.099.092 10 10 0 1 0-4.777-4.719`, variants: g }) }) }) });
});
r0.displayName = "MessageCircleIcon";
var i0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, -3, 3, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.5 * n, repeat: 0, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: [o("path", { d: "M12 19v3" }), o("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }), o("rect", { x: "9", y: "2", width: "6", height: "13", rx: "3" })] }) }) });
});
i0.displayName = "MicIcon";
var o0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.05, 0.95, 1], rotate: [0, -3, 3, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.5 * n, repeat: 0, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [1, 0, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "M12 19v3" }), o("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }), o("rect", { x: "9", y: "2", width: "6", height: "13", rx: "3" }), o(m.path, { d: "M2 2L22 22", variants: g })] }) }) });
});
o0.displayName = "MicOffIcon";
var s0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { scaleX: 1, y: 0 }, animate: { scaleX: [1, 0.55, 1], y: [0, -1, 0], transition: { duration: 0.28 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: i, height: i, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: o(m.path, { d: "M5 12h14", variants: y }) }) }) });
});
s0.displayName = "MinusIcon";
var l0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scale: 1, opacity: 1 }, animate: { y: [0, -2, 0], scale: [1, 1.04, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 0.85 }, animate: { opacity: [0.85, 1, 0.9], transition: { duration: 0.8 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401", variants: g }) }) }) });
});
l0.displayName = "MoonIcon";
var c0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, y: 0 }, animate: { scale: [1, 0.95, 1], y: [0, 1, 0], transition: { duration: 0.5 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [0, 1, 0, 1], scale: [0.6, 1.2, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.path, { d: "M14 4.1 12 6", variants: g }), o(m.path, { d: "m5.1 8-2.9-.8", variants: g }), o(m.path, { d: "m6 12-1.9 2", variants: g }), o(m.path, { d: "M7.2 2.2 8 5.1", variants: g }), o(m.path, { d: "M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z", variants: y })] }) }) });
});
c0.displayName = "MousePointerClickIcon";
var u0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 1], transition: { duration: n, ease: "easeInOut" } } }, g = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [-1, -3, 0], y: [-1, -3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } }, v = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [1, 3, 0], y: [1, 3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "m5 5 14 14" }), o(m.path, { d: "M5 11V5h6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M19 13v6h-6", variants: v, initial: "normal", animate: t })] }) }) });
});
u0.displayName = "MoveDiagonal2Icon";
var m0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 1], transition: { duration: n, ease: "easeInOut" } } }, g = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [1, 3, 0], y: [-1, -3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } }, v = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [-1, -3, 0], y: [1, 3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "M19 5 5 19" }), o(m.path, { d: "M13 5h6v6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M11 19H5v-6", variants: v, initial: "normal", animate: t })] }) }) });
});
m0.displayName = "MoveDiagonalIcon";
var d0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 1], transition: { duration: n, ease: "easeInOut" } } }, g = { normal: { x: 0, opacity: 1 }, animate: { x: [1, 3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } }, v = { normal: { x: 0, opacity: 1 }, animate: { x: [-1, -3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "M2 12h20" }), o(m.path, { d: "m18 8 4 4-4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m6 8-4 4 4 4", variants: v, initial: "normal", animate: t })] }) }) });
});
d0.displayName = "MoveHorizontalIcon";
var h0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0 }, animate: { x: [0, 2, -2, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.25, 0.6, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "M6 8L2 12L6 16", variants: y, stroke: "currentColor" }), o(m.path, { d: "M2 12H22", variants: y, stroke: "currentColor" })] }) }) });
});
h0.displayName = "MoveLeftIcon";
var p0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0 }, animate: { x: [0, -2, 2, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.25, 0.6, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.path, { d: "M18 8L22 12L18 16", variants: y }), o(m.path, { d: "M2 12H22", variants: y })] }) }) });
});
p0.displayName = "MoveRightIcon";
var f0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.6, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 1], transition: { duration: n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [-1, -3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } }, v = { normal: { y: 0, opacity: 1 }, animate: { y: [1, 3, 0], opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "M12 2v20" }), o(m.path, { d: "m8 6 4-4 4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m8 18 4 4 4-4", variants: v, initial: "normal", animate: t })] }) }) });
});
f0.displayName = "MoveVerticalIcon";
var y0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("play");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { y: 0, rotate: 0 }, play: { y: [0, -2, 0], rotate: [0, -4, 0, 4, 0], transition: { duration: 0.7 * n, ease: "easeInOut", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, animate: t, initial: "rest", variants: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M9 18V5l12-2v13" }), o("circle", { cx: "6", cy: "18", r: "3" }), o("circle", { cx: "18", cy: "16", r: "3" })] }) }) });
});
y0.displayName = "MusicIcon";
var v0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.4, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: 1.03, transition: { duration: n, ease: [0.22, 1, 0.36, 1], type: "spring", stiffness: 260, damping: 18, mass: 0.6 } } }, g = { normal: { y: 0 }, animate: { y: -2, transition: { duration: n, ease: [0.22, 1, 0.36, 1], type: "spring", stiffness: 280, damping: 20, mass: 0.5 } } }, v = { normal: { y: 0 }, animate: { y: -0.5, transition: { duration: n, ease: [0.22, 1, 0.36, 1], delay: n * 0.05, type: "spring", stiffness: 300, damping: 22, mass: 0.5 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M12 22v-9", variants: v, animate: t, initial: "normal" }), A(m.g, { variants: g, animate: t, initial: "normal", children: [o("path", { d: "M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" }), o("path", { d: "M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" })] }), o(m.path, { d: "M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13", variants: v, animate: t, initial: "normal" })] }) }) });
});
v0.displayName = "PackageOpenIcon";
var g0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, e, c]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [360, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: o(m.path, { d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551", initial: "normal", animate: t, variants: y, style: { strokeDasharray: 360, strokeLinecap: "round" } }) }) }) });
});
g0.displayName = "PaperclipIcon";
var w0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 0.92, 1], transition: { duration: 0.25 * n, ease: "easeOut" } } }, g = { normal: { x: 0, pathLength: 1, opacity: 1 }, animate: { x: [-0.8, 0], pathLength: [0.6, 1], opacity: [0.6, 1], transition: { duration: 0.4 * n, ease: "easeOut" } } }, v = { normal: { x: 0, pathLength: 1, opacity: 1 }, animate: { x: [0.8, 0], pathLength: [0.6, 1], opacity: [0.6, 1], transition: { duration: 0.4 * n, ease: "easeOut", delay: 0.05 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.rect, { x: "14", y: "3", width: "5", height: "18", rx: "1", variants: v }), o(m.rect, { x: "5", y: "3", width: "5", height: "18", rx: "1", variants: g })] }) }) });
});
w0.displayName = "PauseIcon";
var k0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("write");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { x: 0, y: 0, rotate: 0, transition: { duration: 0.28 * n, ease: "easeOut" } }, write: { x: [0, 0.5, -0.55, 0.46, -0.5, 0.42, -0.32, 0], y: [0, 0.22, -0.24, 0.2, -0.22, 0.18, -0.14, 0], rotate: [0, 1.35, -1.45, 1.25, -1.3, 1.1, -0.75, 0], transition: { duration: 1.15 * n, ease: "easeInOut", times: [0, 0.14, 0.3, 0.44, 0.58, 0.72, 0.86, 1], repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: o("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: A(m.g, { animate: t, initial: "rest", variants: v, style: { transformBox: "view-box", originX: "2.15px", originY: "21.85px" }, children: [o("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }), o("path", { d: "m15 5 4 4" })] }) }) }) });
});
k0.displayName = "PencilIcon";
var x0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.16 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.26 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-philippine-peso-icon lucide-philippine-peso", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M20 11H4" }), o("path", { d: "M20 7H4" }), o("path", { d: "M7 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 12H7" })] }), o(m.path, { d: "M20 7H4", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M20 11H4", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M7 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 12H7", pathLength: 1, variants: w, initial: "normal", animate: t })] }) }) });
});
x0.displayName = "PhilippinePesoIcon";
var M0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, -10, 10, -6, 6, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [1, 0.6, 1], scale: [1, 1.1, 1], transition: { duration: 0.9 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M13 2a9 9 0 0 1 9 9", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M13 6a5 5 0 0 1 5 5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
M0.displayName = "PhoneCallIcon";
var L0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, -8, 8, -6, 6, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { x: 0 }, animate: { x: [0, 4, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M14 6h8", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m18 2 4 4-4 4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
L0.displayName = "PhoneForwardedIcon";
var _0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, -8, 8, -6, 6, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 0, scale: 0.3 }, animate: { opacity: [0, 0.25, 0], scale: [0.3, 1.5], transition: { duration: 0.9 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "12", cy: "12", r: "10", fill: "none", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
_0.displayName = "PhoneIcon";
var A0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, -8, 8, -6, 6, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { x: 0, y: 0 }, animate: { x: [0, -2, 0], y: [0, 2, 0], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M16 2v6h6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m22 2-6 6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
A0.displayName = "PhoneIncomingIcon";
var b0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, -6, 6, -4, 4, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [1, 0.6, 1], scale: [1, 1.15, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m16 2 6 6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m22 2-6 6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } })] }) }) });
});
b0.displayName = "PhoneMissedIcon";
var N0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("play");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { scaleY: 1 }, play: { scaleY: [1, 1.22, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M18.5 8c-1.4 0-2.6-.8-3.2-2A6.87 6.87 0 0 0 2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8.5C22 9.6 20.4 8 18.5 8" }), o("path", { d: "M2 14h20" }), o(m.path, { d: "M6 14v4", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box", originX: "50%", originY: "0%" } }), o(m.path, { d: "M10 14v4", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box", originX: "50%", originY: "0%" } }), o(m.path, { d: "M14 14v4", animate: t, initial: "rest", variants: v(2), style: { transformBox: "fill-box", originX: "50%", originY: "0%" } }), o(m.path, { d: "M18 14v4", animate: t, initial: "rest", variants: v(3), style: { transformBox: "fill-box", originX: "50%", originY: "0%" } })] }) }) });
});
N0.displayName = "PianoIcon";
var $0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 0.92, 1], transition: { duration: 0.25 * n, ease: "easeOut" } } }, g = { normal: { x: 0, scale: 1, pathLength: 1, opacity: 1 }, animate: { x: [0, 1.5, 0], scale: [1, 1.12, 1], pathLength: [0.6, 1], opacity: [0.6, 1], transition: { duration: 0.4 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: o(m.path, { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z", variants: g }) }) }) });
});
$0.displayName = "PlayIcon";
var E0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.2, 0.85, 1], rotate: [0, 10, -10, 0], transition: { duration: 1 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.6 * n, ease: "easeInOut", repeat: 0, repeatDelay: 0.4 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M5 12h14", variants: g }), o(m.path, { d: "M12 5v14", variants: g })] }) }) });
});
E0.displayName = "PlusIcon";
var C0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("live"), r.start("live"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = (N) => ({ rest: { opacity: 1, scale: 1 }, live: { opacity: [0.25, 1, 0.25], scale: [0.94, 1.05, 0.94], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 1 / 0, delay: N * 0.16 * n } } }), L = { rest: { scale: 1 }, live: { scale: [1, 1.35, 1], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M13 17a1 1 0 1 0-2 0l.5 4.5a0.5 0.5 0 0 0 1 0z", fill: "currentColor" }), o(m.path, { d: "M16.85 18.58a9 9 0 1 0-9.7 0", animate: t, initial: "rest", variants: w(1), style: { transformBox: "view-box", originX: "12px", originY: "11px" } }), o(m.path, { d: "M8 14a5 5 0 1 1 8 0", animate: t, initial: "rest", variants: w(0), style: { transformBox: "view-box", originX: "12px", originY: "11px" } }), o(m.circle, { cx: "12", cy: "11", r: "1", fill: "currentColor", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box" } })] }) }) });
});
C0.displayName = "PodcastIcon";
var I0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.16 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.26 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.36 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-pound-sterling-icon lucide-pound-sterling", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M18 7c0-5.333-8-5.333-8 0" }), o("path", { d: "M10 7v14" }), o("path", { d: "M6 21h12" }), o("path", { d: "M6 13h10" })] }), o(m.path, { d: "M18 7c0-5.333-8-5.333-8 0", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M6 13h10", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M10 7v14", pathLength: 1, variants: w, initial: "normal", animate: t }), o(m.path, { d: "M6 21h12", pathLength: 1, variants: L, initial: "normal", animate: t })] }) }) });
});
I0.displayName = "PoundSterlingIcon";
var O0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("feed");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { scaleY: 1 }, feed: { scaleY: [0.15, 1.06, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1], times: [0, 0.7, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }), o("path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }), o(m.rect, { x: "6", y: "14", width: "12", height: "8", rx: "1", animate: t, initial: "rest", variants: v, style: { transformBox: "fill-box", transformOrigin: "top center" } })] }) }) });
});
O0.displayName = "PrinterIcon";
var j0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.04, 1], transition: { duration: 0.35 * n, ease: "easeOut" } } }, g = (w, L) => ({ normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [0, w, 0], y: [0, L, 0], opacity: [1, 0.7, 1], transition: { duration: 0.4 * n, ease: "easeOut" } } }), v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 0.6, 1], opacity: [1, 0.5, 1], transition: { duration: 0.3 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.rect, { width: "5", height: "5", x: "3", y: "3", rx: "1", variants: g(-2, -2) }), o(m.rect, { width: "5", height: "5", x: "16", y: "3", rx: "1", variants: g(2, -2) }), o(m.rect, { width: "5", height: "5", x: "3", y: "16", rx: "1", variants: g(-2, 2) }), o(m.path, { d: "M21 16h-3a2 2 0 0 0-2 2v3", variants: v }), o(m.path, { d: "M21 21v.01", variants: v }), o(m.path, { d: "M12 7v3a2 2 0 0 1-2 2H7", variants: v }), o(m.path, { d: "M3 12h.01", variants: v }), o(m.path, { d: "M12 3h.01", variants: v }), o(m.path, { d: "M12 16v.01", variants: v }), o(m.path, { d: "M16 12h1", variants: v }), o(m.path, { d: "M21 12v.01", variants: v }), o(m.path, { d: "M12 21v-1", variants: v })] }) }) });
});
j0.displayName = "QrCodeIcon";
var S0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("hop"), r.start("hop"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { y: 0, scaleX: 1, scaleY: 1 }, hop: { y: [0, 1.2, -3, 0.6, 0], scaleX: [1, 1.12, 0.94, 1.06, 1], scaleY: [1, 0.86, 1.1, 0.94, 1], transition: { duration: 0.85 * n, ease: "easeInOut", times: [0, 0.22, 0.55, 0.8, 1], repeat: 1 / 0, repeatDelay: 0.15 * n } } }, L = { rest: { rotate: 0 }, hop: { rotate: [0, 14, -8, 3, 0], transition: { duration: 0.85 * n, ease: "easeOut", times: [0, 0.28, 0.58, 0.82, 1], repeat: 1 / 0, repeatDelay: 0.15 * n, delay: 0.06 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, animate: t, initial: "rest", variants: w, ...u, style: { color: d, transformOrigin: "bottom center", ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M13 16a3 3 0 0 1 2.24 5" }), o("path", { d: "M18 12h.01" }), o("path", { d: "M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" }), o(m.path, { d: "M20 8.54V4a2 2 0 1 0-4 0v3", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", transformOrigin: "bottom center" } }), o("path", { d: "M7.612 12.524a3 3 0 1 0-1.6 4.3" })] }) }) });
});
S0.displayName = "RabbitIcon";
var T0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("tune");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { opacity: 1, scale: 1 }, tune: { opacity: [0.2, 1, 0.2], scale: [0.92, 1.06, 0.92], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 1 / 0, delay: w * 0.16 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M16.247 7.761a6 6 0 0 1 0 8.478", animate: t, initial: "rest", variants: v(0), style: { transformBox: "view-box", originX: "12px", originY: "12px" } }), o(m.path, { d: "M19.075 4.933a10 10 0 0 1 0 14.134", animate: t, initial: "rest", variants: v(1), style: { transformBox: "view-box", originX: "12px", originY: "12px" } }), o(m.path, { d: "M4.925 19.067a10 10 0 0 1 0-14.134", animate: t, initial: "rest", variants: v(1), style: { transformBox: "view-box", originX: "12px", originY: "12px" } }), o(m.path, { d: "M7.753 16.239a6 6 0 0 1 0-8.478", animate: t, initial: "rest", variants: v(0), style: { transformBox: "view-box", originX: "12px", originY: "12px" } }), o("circle", { cx: "12", cy: "12", r: "2" })] }) }) });
});
T0.displayName = "RadioIcon";
var B0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("spin");
  }, [t, r]), f = x(() => {
    t.stop();
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { rotate: 0 }, spin: { rotate: [0, 360], transition: { duration: 1 * n, ease: "linear", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, animate: t, initial: "rest", variants: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), o("path", { d: "M21 3v5h-5" }), o("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), o("path", { d: "M8 16H3v5" })] }) }) });
});
B0.displayName = "RefreshCwIcon";
var Er = "M3 11v-1a4 4 0 0 1 4-4h14", Cr = "M21 13v1a4 4 0 0 1-4 4H3", It = 0.34, D0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("cycle");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((G) => {
    !c || r || (l.current ? e?.(G) : h());
  }, [c, r, h, e]), g = x((G) => {
    l.current ? a?.(G) : f();
  }, [f, a]), v = 1.8 * n, w = { rest: { opacity: 1, transition: { duration: 0.3 * n, ease: "easeOut" } }, cycle: { opacity: 0.3, transition: { duration: 0.2 * n, ease: "easeOut" } } }, L = { rest: { opacity: 0, pathLength: 1, pathOffset: 0 }, cycle: { opacity: [0, 1, 1, 0, 0], pathLength: [It, It, It, It, It], pathOffset: [0, 0, 1, 1, 1], transition: { duration: v, ease: "linear", times: [0, 0.04, 0.46, 0.5, 1], repeat: 1 / 0 } } }, N = { rest: { opacity: 0, pathLength: 1, pathOffset: 0 }, cycle: { opacity: [0, 0, 1, 1, 0], pathLength: [It, It, It, It, It], pathOffset: [0, 0, 0, 1, 1], transition: { duration: v, ease: "linear", times: [0, 0.5, 0.54, 0.96, 1], repeat: 1 / 0 } } }, T = { rest: { scale: 1 }, cycle: { scale: [1, 1, 1.3, 1, 1], transition: { duration: v, ease: "easeInOut", times: [0, 0.4, 0.48, 0.58, 1], repeat: 1 / 0 } } }, Y = { rest: { scale: 1 }, cycle: { scale: [1, 1, 1.3, 1], transition: { duration: v, ease: "easeInOut", times: [0, 0.9, 0.98, 1], repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: Er, animate: t, initial: "rest", variants: w }), o(m.path, { d: Cr, animate: t, initial: "rest", variants: w }), o(m.path, { d: Er, animate: t, initial: "rest", variants: L }), o(m.path, { d: Cr, animate: t, initial: "rest", variants: N }), o(m.path, { d: "m17 2 4 4-4 4", animate: t, initial: "rest", variants: T, style: { transformBox: "fill-box" } }), o(m.path, { d: "m7 22-4-4 4-4", animate: t, initial: "rest", variants: Y, style: { transformBox: "fill-box" } })] }) }) });
});
D0.displayName = "RepeatIcon";
var z0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0 }, animate: { x: [0, -3, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { x: 0 }, animate: { x: [0, -1.5, 0], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.05 * n } } }, v = { normal: { opacity: 1 }, animate: { opacity: [1, 0.6, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m12 17-5-5 5-5", variants: y, initial: "normal", animate: t }), o(m.path, { d: "m7 17-5-5 5-5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M22 18v-2a4 4 0 0 0-4-4H7", variants: v, initial: "normal", animate: t })] }) }) });
});
z0.displayName = "ReplyAllIcon";
var W0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0 }, animate: { x: [0, -3, 0], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1 }, animate: { opacity: [1, 0.6, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M20 18v-2a4 4 0 0 0-4-4H4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m9 17-5-5 5-5", variants: y, initial: "normal", animate: t })] }) }) });
});
W0.displayName = "ReplyIcon";
var V0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("run");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { x: 0, opacity: 1 }, run: { x: [0, -2.4, 0], opacity: [1, 0.75, 1], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0, delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M12 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 12 18z", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box" } }), o(m.path, { d: "M22 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 22 18z", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box" } })] }) }) });
});
V0.displayName = "RewindIcon";
var R0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, x: 0 }, animate: { y: [0, -3, 0], x: [0, 3, 0], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [1, 0.3, 1], scale: [1, 1.4, 1], transition: { duration: 0.4 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z", variants: y, initial: "normal", animate: t, style: { transformBox: "fill-box", transformOrigin: "center" } }), o(m.path, { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z", variants: g, initial: "normal", animate: t })] }) }) });
});
R0.displayName = "RocketIcon";
var P0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.26 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-russian-ruble-icon lucide-russian-ruble", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M6 11h8a4 4 0 0 0 0-8H9v18" }), o("path", { d: "M6 15h8" })] }), o(m.path, { d: "M6 11h8a4 4 0 0 0 0-8H9v18", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M6 15h8", pathLength: 1, variants: v, initial: "normal", animate: t })] }) }) });
});
P0.displayName = "RussianRubleIcon";
var F0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.75, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.18 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.3 } } }, L = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.44 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-saudi-riyal-icon lucide-saudi-riyal", children: [A("g", { opacity: 0.35, children: [o("path", { d: "m20 19.5-5.5 1.2" }), o("path", { d: "M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2" }), o("path", { d: "m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16V2" }), o("path", { d: "M20 10 4 13.5" })] }), o(m.path, { d: "m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16V2", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M20 10 4 13.5", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2", pathLength: 1, variants: w, initial: "normal", animate: t }), o(m.path, { d: "m20 19.5-5.5 1.2", pathLength: 1, variants: L, initial: "normal", animate: t })] }) }) });
});
F0.displayName = "SaudiRiyalIcon";
var H0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("press");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { y: 0, scale: 1 }, press: { y: [0, 2.5, 0], scale: [1, 0.92, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.4, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, animate: t, initial: "rest", variants: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" }), o("path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }), o("path", { d: "M7 3v4a1 1 0 0 0 1 1h7" })] }) }) });
});
H0.displayName = "SaveIcon";
var q0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = (g) => ({ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.4, 1], transition: { duration: 0.25 * n, ease: "easeOut", delay: g } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.path, { d: "M3 7V5a2 2 0 0 1 2-2h2", variants: y(0) }), o(m.path, { d: "M17 3h2a2 2 0 0 1 2 2v2", variants: y(0.1) }), o(m.path, { d: "M21 17v2a2 2 0 0 1-2 2h-2", variants: y(0.2) }), o(m.path, { d: "M7 21H5a2 2 0 0 1-2-2v-2", variants: y(0.3) })] }) }) });
});
q0.displayName = "ScanIcon";
var Y0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x(() => {
    l.current || t.start("normal");
  }, [t]), y = { normal: { opacity: 1 }, animate: { opacity: [1, 0.65, 1], transition: { duration: 0.8 * n, ease: "easeInOut", repeat: 1 / 0 } } }, g = { normal: { y: 0, opacity: 1 }, animate: { y: [-6, 6, -6], opacity: [0.4, 1, 0.4], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, children: [o(m.path, { d: "M3 7V5a2 2 0 0 1 2-2h2", variants: y }), o(m.path, { d: "M17 3h2a2 2 0 0 1 2 2v2", variants: y }), o(m.path, { d: "M21 17v2a2 2 0 0 1-2 2h-2", variants: y }), o(m.path, { d: "M7 21H5a2 2 0 0 1-2-2v-2", variants: y }), o(m.path, { d: "M7 12h10", variants: g })] }) }) });
});
Y0.displayName = "ScanLineIcon";
var X0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 * n, ease: "easeOut" } } }, g = (w) => ({ normal: { y: 0, opacity: 1 }, animate: { y: [0, 2, 0], opacity: [1, 0.4, 1], transition: { duration: 0.35 * n, ease: "easeOut", delay: w } } }), v = { normal: { scale: 1 }, animate: { scale: [1, 0.85, 1], transition: { duration: 0.3 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.path, { d: "M17 12v4a1 1 0 0 1-1 1h-4", variants: g(0) }), o(m.path, { d: "M17 3h2a2 2 0 0 1 2 2v2", variants: g(0.05) }), o(m.path, { d: "M17 8V7", variants: g(0.1) }), o(m.path, { d: "M21 17v2a2 2 0 0 1-2 2h-2", variants: g(0.15) }), o(m.path, { d: "M3 7V5a2 2 0 0 1 2-2h2", variants: g(0.2) }), o(m.path, { d: "M7 17h.01", variants: g(0.25) }), o(m.path, { d: "M7 21H5a2 2 0 0 1-2-2v-2", variants: g(0.3) }), o(m.rect, { x: "7", y: "7", width: "5", height: "5", rx: "1", variants: v })] }) }) });
});
X0.displayName = "ScanQrCodeIcon";
var U0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, y: 0, rotate: 0, opacity: 1 }, animate: { x: [0, 2, -2, 1, 0], y: [0, -1, 2, -1, 0], rotate: [0, 6, -6, 4, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: A(m.g, { variants: y, children: [o(m.circle, { cx: "11", cy: "11", r: "8" }), o("path", { d: "m21 21-4.34-4.34" })] }) }) }) });
});
U0.displayName = "SearchIcon";
var K0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { x: 0, y: 0, scale: 1, opacity: 1 }, animate: { scale: [1, 0.85, 0, 0, 1], x: [0, 6, 16, -16, 0], y: [0, -4, -16, 16, 0], opacity: [1, 1, 0, 0, 1], transition: { duration: 1.4 * n, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }), o("path", { d: "m21.854 2.147-10.94 10.939" })] }) }) });
});
K0.displayName = "SendIcon";
var G0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1, y: 0 }, animate: { rotate: [0, 16, 0], scale: [1, 1.06, 1], y: [0, -0.8, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 0, opacity: 1 }, animate: { pathLength: 1, opacity: 1, transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 0, scale: 1, opacity: 1 }, animate: { pathLength: 1, scale: [1, 1.08, 1], opacity: [1, 1, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.26 } } }, w = (L) => ({ normal: { opacity: 0, scale: 0.6 }, animate: { opacity: [0, 1, 0], scale: [0.6, 1.25, 1], transition: { duration: 0.35 * n, ease: "easeOut", delay: L } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-settings-icon lucide-settings", children: A(m.g, { variants: y, initial: "normal", animate: t, children: [A("g", { children: [o("path", { d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" }), o("circle", { cx: "12", cy: "12", r: "3" })] }), o(m.path, { d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "12", r: "3", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "4.6", r: "0.8", fill: "currentColor", variants: w(0.18), initial: "normal", animate: t }), o(m.circle, { cx: "19", cy: "8", r: "0.7", fill: "currentColor", variants: w(0.26), initial: "normal", animate: t }), o(m.circle, { cx: "18.5", cy: "16.5", r: "0.7", fill: "currentColor", variants: w(0.34), initial: "normal", animate: t }), o(m.circle, { cx: "8", cy: "18", r: "0.7", fill: "currentColor", variants: w(0.42), initial: "normal", animate: t }), o(m.circle, { cx: "5.5", cy: "9", r: "0.7", fill: "currentColor", variants: w(0.5), initial: "normal", animate: t })] }) }) }) });
});
G0.displayName = "SettingsIcon";
var Z0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = (v) => ({ normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.15, 1], opacity: [0.7, 1], transition: { duration: 0.45 * n, ease: [0.22, 1, 0.36, 1], delay: v } } }), g = { normal: { opacity: 1 }, animate: { opacity: [0.4, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.circle, { cx: "18", cy: "5", r: "3", variants: y(0) }), o(m.circle, { cx: "6", cy: "12", r: "3", variants: y(0.12) }), o(m.circle, { cx: "18", cy: "19", r: "3", variants: y(0.24) }), o(m.line, { x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49", variants: g }), o(m.line, { x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49", variants: g })] }) }) });
});
Z0.displayName = "ShareIcon";
var Q0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1);
  E(p, () => (h.current = !0, { startAnimation: () => {
    l ? (t.start("normal"), r.start("normal")) : (t.start("animate"), r.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || l || (h.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, l, e, c]), y = x((w) => {
    h.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { strokeDashoffset: 0, scale: 1, rotate: 0 }, animate: { strokeDashoffset: [300, 24, 0], scale: [1, 0.98, 1.04, 1], rotate: [0, -2, 1, 0], transition: { duration: 1 * n, ease: [0.18, 0.85, 0.25, 1], times: [0, 0.35, 0.75, 1] } } }, v = { normal: { strokeDashoffset: 0, scale: 1, opacity: 1 }, animate: { strokeDashoffset: [40, 0], scale: [1, 1.1, 0.98, 1], opacity: [0, 1, 1], transition: { duration: 1.3 * n, ease: [0.22, 0.9, 0.28, 1], delay: 0.25, times: [0, 0.5, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", initial: "normal", animate: t, variants: g, style: { strokeDasharray: 300, transformOrigin: "12px 12px" } }), o(m.path, { d: "m9 12 2 2 4-4", initial: "normal", animate: r, variants: v, style: { strokeDasharray: 40, strokeLinecap: "round" } })] }) }) });
});
Q0.displayName = "ShieldCheckIcon";
var J0 = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [120, 0], opacity: [0.3, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, y: 0 }, animate: { opacity: [0, 1], y: [6, 0], transition: { duration: 0.5 * n, delay: 0.5, ease: "easeOut" } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, delay: 0.3, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-shield-user-icon lucide-shield-user", children: [o(m.path, { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", strokeDasharray: "120", strokeDashoffset: "0", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M6.376 18.91a6 6 0 0 1 11.249.003", variants: g, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "11", r: "4", variants: v, initial: "normal", animate: t })] }) }) });
});
J0.displayName = "ShieldUserIcon";
var tp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { strokeDashoffset: 0, scale: 1, rotate: 0 }, animate: { strokeDashoffset: [300, 24, 0], scale: [1, 0.98, 1.04, 1], rotate: [0, -2, 1, 0], transition: { duration: 1 * n, ease: [0.18, 0.85, 0.25, 1], times: [0, 0.35, 0.75, 1] } } }, w = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0, 1], transition: { duration: 0.5 * n, ease: [0.22, 0.9, 0.28, 1], delay: 0.28 } } }, L = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0, 1], transition: { duration: 0.5 * n, ease: [0.22, 0.9, 0.28, 1], delay: 0.36 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", initial: "normal", animate: t, variants: v, style: { strokeDasharray: 300, transformOrigin: "12px 12px" } }), o(m.path, { d: "m14.5 9.5-5 5", initial: "normal", animate: r, variants: w, style: { strokeDasharray: 40, strokeLinecap: "round" } }), o(m.path, { d: "m9.5 9.5 5 5", initial: "normal", animate: l, variants: L, style: { strokeDasharray: 40, strokeLinecap: "round" } })] }) }) });
});
tp.displayName = "ShieldXIcon";
var ep = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { scaleY: 1, scaleX: 1, rotate: 0, y: 0 }, animate: { scaleY: [1, 0.85, 1.1, 1], scaleX: [1, 1.1, 0.9, 1], rotate: [0, -4, 4, -2, 0], y: [0, -3, 0, -1, 0], transition: { duration: 1.5 * n, repeat: 0, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o("path", { d: "M16 10a4 4 0 0 1-8 0" }), o("path", { d: "M3.103 6.034h17.794" }), o("path", { d: "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" })] }) }) });
});
ep.displayName = "ShoppingBagIcon";
var ap = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, rotate: 0, scale: 1 }, animate: { y: [0, -3, 0, -1, 0], rotate: [0, -4, 3, -2, 0], transition: { duration: 1.8 * n, repeat: 0, ease: "easeInOut" } } }, g = { normal: { rotate: 0 }, animate: { rotate: [0, 360], transition: { duration: 1 * n, ease: "linear", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.circle, { cx: "8", cy: "21", r: "1", variants: g }), o(m.circle, { cx: "19", cy: "21", r: "1", variants: g }), o(m.path, { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12", variants: y })] }) }) });
});
ap.displayName = "ShoppingCartIcon";
var np = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("cross");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { x: 0 }, cross: { x: [0, 1.8, 0], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0, delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m18 14 4 4-4 4", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box" } }), o(m.path, { d: "m18 2 4 4-4 4", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box" } }), o("path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" }), o("path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" }), o("path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" })] }) }) });
});
np.displayName = "ShuffleIcon";
var rp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 1], transition: { duration: 1 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 0.8 }, animate: { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.8], transition: { duration: 0.5 * n, ease: "easeInOut" } } }, v = (w) => ({ normal: { scaleY: 1, opacity: 0.9, transformOrigin: "center bottom" }, animate: { scaleY: [1, 1.4, 0.95, 1], opacity: [0.8, 1, 0.85, 1], transition: { duration: 0.8 * n, ease: "easeInOut", delay: w } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M2 20h.01", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M7 20v-4", variants: v(0.1), initial: "normal", animate: t }), o(m.path, { d: "M12 20v-8", variants: v(0.25), initial: "normal", animate: t }), o(m.path, { d: "M17 20V8", variants: v(0.4), initial: "normal", animate: t }), o(m.path, { d: "M22 4v16", variants: v(0.55), initial: "normal", animate: t })] }) }) });
});
rp.displayName = "SignalIcon";
var ip = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("skip"), r.start("skip"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { x: 0 }, skip: { x: [0, -2.2, 0.6, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.42, 0.74, 1] } } }, L = { rest: { x: 0, scaleY: 1 }, skip: { x: [0, -0.7, 0.2, 0], scaleY: [1, 1.1, 0.98, 1], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.42, 0.74, 1], delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box" } }), o(m.path, { d: "M3 20V4", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", originX: "50%", originY: "50%" } })] }) }) });
});
ip.displayName = "SkipBackIcon";
var op = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("skip"), r.start("skip"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { x: 0 }, skip: { x: [0, 2.2, -0.6, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.42, 0.74, 1] } } }, L = { rest: { x: 0, scaleY: 1 }, skip: { x: [0, 0.7, -0.2, 0], scaleY: [1, 1.1, 0.98, 1], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.42, 0.74, 1], delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M21 4v16", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", originX: "50%", originY: "50%" } }), o(m.path, { d: "M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box" } })] }) }) });
});
op.displayName = "SkipForwardIcon";
var sp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { opacity: 1 }, animate: { opacity: [1, 0.6, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { x: 0 }, animate: (v) => ({ x: [0, v * 3, 0], transition: { duration: 0.7 * n, ease: "easeInOut", delay: v * 0.05 } }) };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M10 5H3", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M21 5h-7", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M12 19H3", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M21 19h-5", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M21 12h-9", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M8 12H3", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M14 3v4", variants: g, custom: 1, initial: "normal", animate: t }), o(m.path, { d: "M16 17v4", variants: g, custom: -1, initial: "normal", animate: t }), o(m.path, { d: "M8 10v4", variants: g, custom: 1, initial: "normal", animate: t })] }) }) });
});
sp.displayName = "SlidersHorizontalIcon";
var lp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("ring");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { x: 0, rotate: 0 }, ring: { x: [0, -1.2, 1.2, -1.2, 1.2, 0], rotate: [0, -3, 3, -3, 3, 0], transition: { duration: 0.5 * n, ease: "easeInOut", repeat: 1 / 0, repeatDelay: 0.35 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, animate: t, initial: "rest", variants: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2" }), o("path", { d: "M12 18h.01" })] }) }) });
});
lp.displayName = "SmartphoneIcon";
var cp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, opacity: 1, transition: { duration: 0.3 * n } }, animate: { pathLength: [1, 0.3, 1], opacity: [1, 0.7, 1], transition: { duration: 0.8 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: { normal: { rotate: 0, scale: 1, transition: { duration: 0.3 * n } }, animate: { rotate: [0, 10, -10, 0], scale: [1, 1.05, 1], transition: { duration: 1 * n } } }, animate: t, initial: "normal", children: [o(m.path, { d: "m10 20-1.25-2.5L6 18", variants: y }), o(m.path, { d: "M10 4 8.75 6.5 6 6", variants: y }), o(m.path, { d: "m14 20 1.25-2.5L18 18", variants: y }), o(m.path, { d: "m14 4 1.25 2.5L18 6", variants: y }), o(m.path, { d: "m17 21-3-6h-4", variants: y }), o(m.path, { d: "m17 3-3 6 1.5 3", variants: y }), o(m.path, { d: "M2 12h6.5L10 9", variants: y }), o(m.path, { d: "m20 10-1.5 2 1.5 2", variants: y }), o(m.path, { d: "M22 12h-6.5L14 15", variants: y }), o(m.path, { d: "m4 10 1.5 2L4 14", variants: y }), o(m.path, { d: "m7 21 3-6-1.5-3", variants: y }), o(m.path, { d: "m7 3 3 6h4", variants: y })] }) }) });
});
cp.displayName = "SnowFlakeIcon";
var up = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -2, 1, 0], transition: { duration: 0.85 * n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [0.6, 1, 1], scale: [0.7, 1.15, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.05 } } }, v = { normal: { opacity: 0.9, scale: 1, rotate: 0 }, animate: { opacity: [0, 1], scale: [0.4, 1], rotate: [-45, 0], transition: { duration: 0.55 * n, ease: "easeOut", delay: 0.16 } } }, w = { normal: { opacity: 1, scale: 1, y: 0 }, animate: { opacity: [0, 1], scale: [0.4, 1], y: [4, 0], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.28 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M20 2v4", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M22 4h-4", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "4", cy: "20", r: "2", variants: w, initial: "normal", animate: t })] }) }) });
});
up.displayName = "SparklesIcon";
var mp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("boom"), r.start("boom"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { scale: 1 }, boom: { scale: [1, 1.14, 0.96, 1.06, 1], transition: { duration: 0.7 * n, ease: "easeInOut", times: [0, 0.24, 0.5, 0.76, 1], repeat: 1 / 0 } } }, L = { rest: { scale: 1 }, boom: { scale: [1, 1.5, 1], transition: { duration: 0.35 * n, ease: "easeInOut", repeat: 1 / 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }), o(m.path, { d: "M12 6h.01", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box" } }), o(m.circle, { cx: "12", cy: "14", r: "4", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box" } }), o(m.path, { d: "M12 14h.01", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box" } })] }) }) });
});
mp.displayName = "SpeakerIcon";
var dp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -4, 4, -2, 2, 0], transition: { duration: 2 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { scale: 1, opacity: 1, y: 0 }, animate: (w) => ({ scale: [1, 1.3, 0.7, 1], opacity: [1, 0.4, 1], y: [0, -2, 2, 0], transition: { duration: 1 * n, ease: "easeInOut", repeat: 0, delay: w * 0.2 } }) }, v = ["M3 3h.01", "M7 5h.01", "M11 7h.01", "M3 7h.01", "M7 9h.01", "M3 11h.01"];
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [v.map((w, L) => o(m.path, { d: w, variants: g, custom: L, animate: t, initial: "normal" }, L)), o("rect", { width: "4", height: "4", x: "15", y: "5" }), o("path", { d: "m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2" }), o("path", { d: "m13 14 8-2" }), o("path", { d: "m13 19 8-2" })] }) }) });
});
dp.displayName = "SprayCanIcon";
var hp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = b(!1), h = j();
  E(p, () => (l.current = !0, { startAnimation: () => {
    h && (t.start("normal"), r.start("normal")), t.start("animate"), r.start("animate");
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal");
  } }));
  let f = x((w) => {
    !c || h || (l.current ? e?.(w) : (t.start("animate"), r.start("animate")));
  }, [t, r, c, h, e]), y = x((w) => {
    l.current ? a?.(w) : (t.start("normal"), r.start("normal"));
  }, [t, r, a]), g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, v = { normal: { x: 0, y: 0, opacity: 1 }, animate: { x: [0, 3, 0], y: [0, -3, 0], opacity: [1, 1, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: f, onMouseLeave: y, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m21 3-9 9", variants: v, initial: "normal", animate: r }), o(m.path, { d: "M15 3h6v6", variants: v, initial: "normal", animate: r })] }) }) });
});
hp.displayName = "SquareArrowOutUpRightIcon";
var pp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { idle: { scale: [1, 1.02, 0.98, 1], transition: { duration: 2.5 * n, repeat: 1 / 0, ease: "easeInOut" } }, animate: { scale: [1, 1.2, 0.95, 1.05, 1], rotate: [0, -10, 10, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "idle", variants: y, children: o(m.path, { d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z", fill: "none" }) }) }) });
});
pp.displayName = "StarIcon";
var fp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: 12, transition: { duration: n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { scale: 1 }, animate: { scale: [1, 1.18, 1], transition: { duration: n, ease: "easeInOut" } } }, v = { normal: { opacity: 1 }, animate: { opacity: [1, 0.7, 1], transition: { duration: n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.circle, { cx: "12", cy: "12", r: "4", variants: g }), o(m.path, { d: "M12 2v2", variants: v }), o(m.path, { d: "M12 20v2", variants: v }), o(m.path, { d: "m4.93 4.93 1.41 1.41", variants: v }), o(m.path, { d: "m17.66 17.66 1.41 1.41", variants: v }), o(m.path, { d: "M2 12h2", variants: v }), o(m.path, { d: "M20 12h2", variants: v }), o(m.path, { d: "m6.34 17.66-1.41 1.41", variants: v }), o(m.path, { d: "m19.07 4.93-1.41 1.41", variants: v })] }) }) });
});
fp.displayName = "SunIcon";
var yp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.75, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.75, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.18 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.28 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-swiss-franc-icon lucide-swiss-franc", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M10 21V3h8" }), o("path", { d: "M6 16h9" }), o("path", { d: "M10 9.5h7" })] }), o(m.path, { d: "M10 21V3h8", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M10 9.5h7", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M6 16h9", pathLength: 1, variants: w, initial: "normal", animate: t })] }) }) });
});
yp.displayName = "SwissFrancIcon";
var vp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [0, -5, 5, -3, 3, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 1.5 * n, ease: "easeInOut", repeat: 0 } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.polyline, { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5", variants: g }), o(m.line, { x1: "13", x2: "19", y1: "19", y2: "13", variants: g }), o(m.line, { x1: "16", x2: "20", y1: "16", y2: "20", variants: g }), o(m.line, { x1: "19", x2: "21", y1: "21", y2: "19", variants: g }), o(m.polyline, { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5", variants: g }), o(m.line, { x1: "5", x2: "9", y1: "14", y2: "18", variants: g }), o(m.line, { x1: "7", x2: "4", y1: "17", y2: "20", variants: g }), o(m.line, { x1: "3", x2: "5", y1: "19", y2: "21", variants: g })] }) }) });
});
vp.displayName = "SwordsIcon";
var gp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = j(), y = b(!1);
  E(p, () => (y.current = !0, { startAnimation: () => {
    f ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal");
  } }));
  let g = x((G) => {
    !c || f || (y.current ? e?.(G) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate")));
  }, [t, r, l, h, f, e, c]), v = x((G) => {
    y.current ? a?.(G) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"));
  }, [t, r, l, h, a]), w = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -2, 1.5, 0], y: [0, -1, 0.5, 0], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, L = { normal: { x: 0, rotate: 0, opacity: 1 }, animate: { x: [0, 1.5, 0], rotate: [0, -3, 0], opacity: 1, transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.05 } } }, N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.15 } } }, T = { normal: { scaleY: 1, y: 0, transformOrigin: "50% 100%" }, animate: { scaleY: [1, 1.04, 1], y: [0, -0.6, 0], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.2 } } }, Y = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.15, 1], opacity: [1, 0.95, 1], transition: { duration: 0.55 * n, ease: "easeOut", delay: 0.25 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: w, children: [o(m.path, { d: "m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44", initial: "normal", animate: r, variants: L }), o(m.path, { d: "m13.56 11.747 4.332-.924", initial: "normal", animate: r, variants: N }), o(m.path, { d: "m16 21-3.105-6.21", initial: "normal", animate: h, variants: T }), o(m.path, { d: "M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z", initial: "normal", animate: r, variants: L }), o(m.path, { d: "m6.158 8.633 1.114 4.456", initial: "normal", animate: h, variants: T }), o(m.path, { d: "m8 21 3.105-6.21", initial: "normal", animate: h, variants: T }), o(m.circle, { cx: "12", cy: "13", r: "2", initial: "normal", animate: l, variants: Y })] }) }) });
});
gp.displayName = "TelescopeIcon";
var wp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { transition: { duration: 0.3 * n } }, animate: { transition: { staggerChildren: 0.1 } } }, g = { normal: { scaleX: 1, originX: 0, transition: { duration: 0.3 * n } }, animate: { scaleX: [1, 0.3, 1], originX: 0, transition: { duration: 0.6 * n, times: [0, 0.5, 1], repeat: 0 } } }, v = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -2, 0], opacity: [1, 0.6, 1], transition: { duration: 0.5 * n, repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, animate: t, initial: "normal", children: [o(m.path, { d: "M12 19h8", variants: g }), o(m.path, { d: "m4 17 6-6-6-6", variants: v })] }) }) });
});
wp.displayName = "TerminalIcon";
var kp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.08, 0.98, 1.03, 1], rotate: [0, -8, 6, -4, 0], transition: { duration: 0.95 * n, ease: "easeInOut" } } }, g = { normal: { scaleY: 1, opacity: 1 }, animate: { scaleY: [1, 0.92, 1.04, 1], opacity: [1, 0.85, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.08 * n } } }, v = { normal: { rotate: 0, y: 0, scale: 1 }, animate: { rotate: [0, -8, 6, -4, 0], y: [0, -4, -8, -4, 0], scale: [1, 1.05, 1.1, 1.04, 1], transition: { duration: 0.95 * n, ease: "easeInOut", delay: 0.05 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.path, { d: "M17 14V2", variants: g, initial: "normal" }), o(m.path, { d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z", variants: v, initial: "normal" })] }) }) });
});
kp.displayName = "ThumbsDownIcon";
var xp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.9, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.08, 0.98, 1.03, 1], rotate: [0, -8, 6, -4, 0], transition: { duration: 0.95 * n, ease: "easeInOut" } } }, g = { normal: { scaleY: 1, opacity: 1 }, animate: { scaleY: [1, 0.92, 1.04, 1], opacity: [1, 0.85, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.08 * n } } }, v = { normal: { rotate: 0, y: 0, scale: 1 }, animate: { rotate: [0, -8, 6, -4, 0], y: [0, -4, -8, -4, 0], scale: [1, 1.05, 1.1, 1.04, 1], transition: { duration: 0.95 * n, ease: "easeInOut", delay: 0.05 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.path, { d: "M7 10v12", variants: g, initial: "normal", style: { transformOrigin: "center" } }), o(m.path, { d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z", variants: v, initial: "normal", style: { transformOrigin: "center" } })] }) }) });
});
xp.displayName = "ThumbsUpIcon";
var Mp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.05, 0.97, 1], rotate: [0, -2, 2, 0], y: [0, -1.5, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, w = { normal: { rotate: 0, y: 0, transformOrigin: "12px 4px" }, animate: { rotate: [-15, 5, 0], y: [-2, 0], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.1 } } }, L = { normal: { scaleY: 1, opacity: 1, transformOrigin: "center bottom" }, animate: { scaleY: [1, 1.2, 1], opacity: [1, 0.9, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M10 11v6", animate: l, initial: "normal", variants: L }), o(m.path, { d: "M14 11v6", animate: l, initial: "normal", variants: L }), o(m.path, { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", animate: t, initial: "normal", variants: v }), o(m.path, { d: "M3 6h18", stroke: "currentColor" }), o(m.path, { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", animate: r, initial: "normal", variants: w })] }) }) });
});
Mp.displayName = "Trash2Icon";
var Go = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.03, 1], transition: { duration: 0.5 * n, ease: "easeOut" } } }, g = { normal: { y: 0, rotate: 0, transformOrigin: "12px 6px" }, animate: { rotate: [0, -10, 6, -3, 0], y: [0, -2, 0.5, 0], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.05 } } }, v = { normal: { scaleX: 1, opacity: 1 }, animate: { scaleX: [0.85, 1.08, 1], opacity: [0.9, 1, 1], transition: { duration: 0.45 * n, ease: "easeOut", delay: 0.1 } } }, w = { normal: { y: 0, scaleY: 1, transformOrigin: "50% 100%" }, animate: { scaleY: [1, 0.97, 1], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M3 6h18", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", variants: g, initial: "normal", animate: t })] }) }) });
});
Go.displayName = "TrashIcon";
var Lp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -3, 2, 0], transition: { duration: 0.9 * n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { opacity: 1, x: 0, y: 0, rotate: 0 }, animate: { opacity: [0, 1], x: [4, 0], y: [-4, 0], rotate: [-8, 0], transition: { duration: 0.55 * n, ease: [0.16, 1, 0.3, 1], delay: 0.12 } } }, v = { normal: { pathLength: 1, pathOffset: 0 }, animate: { pathLength: [0, 1], pathOffset: [1, 0], transition: { duration: 0.75 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m22 17-8.5-8.5-5 5L2 7", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M16 17h6v-6", variants: g, initial: "normal", animate: t })] }) }) });
});
Lp.displayName = "TrendingDownIcon";
var _p = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 0.98, 1], rotate: [0, 2, -2, 0], transition: { duration: 0.9 * n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { pathLength: 1, pathOffset: 0 }, animate: { pathLength: [0, 1], pathOffset: [1, 0], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, v = { normal: { opacity: 1, x: 0, y: 0 }, animate: { opacity: [0, 1], x: [4, 0], y: [-4, 0], transition: { duration: 0.55 * n, ease: [0.16, 1, 0.3, 1], delay: 0.15 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: y, children: [o(m.path, { d: "M14.828 14.828 21 21", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M21 16v5h-5", variants: v, initial: "normal", animate: t }), o(m.path, { d: "m21 3-9 9-4-4-6 6", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M21 8V3h-5", variants: g, initial: "normal", animate: t })] }) }) });
});
_p.displayName = "TrendingUpDownIcon";
var Ap = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, 3, -2, 0], transition: { duration: 0.9 * n, ease: [0.22, 1, 0.36, 1] } } }, g = { normal: { opacity: 1, x: 0, y: 0, rotate: 0 }, animate: { opacity: [0, 1], x: [-4, 0], y: [4, 0], rotate: [8, 0], transition: { duration: 0.55 * n, ease: [0.16, 1, 0.3, 1], delay: 0.12 } } }, v = { normal: { pathLength: 1, pathOffset: 0 }, animate: { pathLength: [0, 1], pathOffset: [1, 0], transition: { duration: 0.75 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m22 7-8.5 8.5-5-5L2 17", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M16 7h6v6", variants: g, initial: "normal", animate: t })] }) }) });
});
Ap.displayName = "TrendingUpIcon";
var bp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0 }, animate: { rotate: [0, 3, -8, 7, -5, 3, 0], transition: { duration: 1 * n, ease: "easeInOut", times: [0, 0.1, 0.28, 0.46, 0.64, 0.82, 1] } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.06, 1], opacity: [0.6, 1, 1], transition: { duration: 1 * n, ease: "easeOut", times: [0, 0.3, 1] } } }, v = { normal: { scaleY: 1, opacity: 1 }, animate: { scaleY: [0.3, 1.2, 0.96, 1], opacity: [0, 1, 1, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: 0.16 * n } } }, w = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0, 1.6, 1], opacity: [0, 1, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: 0.3 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, children: [o(m.path, { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", variants: g }), o(m.path, { d: "M12 9v4", variants: v, style: { transformOrigin: "12px 13px" } }), o(m.path, { d: "M12 17h.01", variants: w })] }) }) });
});
bp.displayName = "TriangleAlertIcon";
var Np = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.55 * n, ease: "easeInOut", delay: 0.16 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.26 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-turkish-lira-icon lucide-turkish-lira", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M15 4 5 9" }), o("path", { d: "m15 8.5-10 5" }), o("path", { d: "M18 12a9 9 0 0 1-9 9V3" })] }), o(m.path, { d: "M15 4 5 9", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "m15 8.5-10 5", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M18 12a9 9 0 0 1-9 9V3", pathLength: 1, variants: w, initial: "normal", animate: t })] }) }) });
});
Np.displayName = "TurkishLiraIcon";
var $p = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (r.start("on"), t.start("on"));
  }, [t, r, l]), y = x(() => {
    r.start("rest"), t.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { opacity: 1 }, on: { opacity: [1, 0.32, 1, 0.44, 1, 0.76, 1], transition: { duration: 1.05 * n, ease: "linear", times: [0, 0.08, 0.16, 0.28, 0.4, 0.58, 1] } } }, L = { rest: { rotate: 0 }, on: { rotate: [0, -7, 5.5, -3.4, 1.8, -0.8, 0], transition: { duration: 1.05 * n, ease: "easeInOut", times: [0, 0.16, 0.34, 0.52, 0.7, 0.86, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m17 2-5 5-5-5", animate: t, initial: "rest", variants: L, style: { transformBox: "fill-box", originX: "50%", originY: "100%" } }), o(m.rect, { width: "20", height: "15", x: "2", y: "7", rx: "2", animate: r, initial: "rest", variants: w })] }) }) });
});
$p.displayName = "TvIcon";
var Ep = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { y: 0, scale: 1, rotate: 0 }, animate: { y: [0, -4, 0, -2, 0], scale: [1, 1.08, 0.95, 1], rotate: [0, -2, 2, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { opacity: 1, scale: 1 }, animate: { opacity: [0.9, 1, 1], scale: [1, 1.12, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.15 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", stroke: "currentColor", fill: "currentColor", viewBox: "0 0 512 512", height: i, width: i, animate: t, initial: "normal", variants: y, children: o(m.path, { d: `M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 
	               106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 
	               389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z`, variants: g, initial: "normal", animate: t }) }) }) });
});
Ep.displayName = "TwitterIcon";
var Cp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("open");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { scaleX: 1, scaleY: 1 }, open: { scaleX: [0.4, 1.08, 1], scaleY: [0.5, 1.06, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.65, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M12 13v7a2 2 0 0 0 4 0" }), o("path", { d: "M12 2v2" }), o(m.path, { d: "M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z", animate: t, initial: "rest", variants: v, style: { transformBox: "fill-box", transformOrigin: "bottom center" } })] }) }) });
});
Cp.displayName = "UmbrellaIcon";
var Ip = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((N) => {
    !c || h || (f.current ? e?.(N) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, c, e]), g = x((N) => {
    f.current ? a?.(N) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l]), v = { normal: { x: 0, rotate: 0 }, animate: { x: [-2, -4, -2, 0], rotate: [-5, -8, -5, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, w = { normal: { x: 0, rotate: 0 }, animate: { x: [2, 4, 2, 0], rotate: [5, 8, 5, 0], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, L = { normal: { opacity: 1, pathLength: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1, 0, 1], transition: { duration: 0.5 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71", variants: w, initial: "normal", animate: r }), o(m.path, { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71", variants: v, initial: "normal", animate: t }), o(m.line, { x1: "8", x2: "8", y1: "2", y2: "5", variants: L, initial: "normal", animate: l }), o(m.line, { x1: "2", x2: "5", y1: "8", y2: "8", variants: L, initial: "normal", animate: l }), o(m.line, { x1: "16", x2: "16", y1: "19", y2: "22", variants: L, initial: "normal", animate: l }), o(m.line, { x1: "19", x2: "22", y1: "16", y2: "16", variants: L, initial: "normal", animate: l })] }) }) });
});
Ip.displayName = "UnlinkIcon";
var Op = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [30, 0], opacity: [0.4, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { y: 0, opacity: 1, scale: 1 }, animate: { y: [2, -2, 0], scale: [1, 1.05, 1], opacity: [0.6, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.05 } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [60, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.1 } } }, w = { normal: { scale: 1 }, animate: { scale: [1, 1.02, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-upload-icon lucide-upload", children: A(m.g, { variants: w, initial: "normal", animate: t, children: [o(m.path, { d: "M12 3v12", strokeDasharray: "30", strokeDashoffset: "30", variants: y, initial: "normal", animate: t }), o(m.path, { d: "m17 8-5-5-5 5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", strokeDasharray: "60", strokeDashoffset: "60", variants: v, initial: "normal", animate: t })] }) }) }) });
});
Op.displayName = "UploadIcon";
var jp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, delay: 0.2, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [20, 0], opacity: [0.3, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.5 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-check-icon lucide-user-check", children: [o(m.path, { d: "m16 11 2 2 4-4", strokeDasharray: "20", strokeDashoffset: "20", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "9", cy: "7", r: "4", variants: g, initial: "normal", animate: t })] }) }) });
});
jp.displayName = "UserCheckIcon";
var Sp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { rotate: 0, scale: 1, opacity: 1 }, animate: { rotate: 360, scale: [0.8, 1.1, 1], opacity: 1, transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-cog-icon lucide-user-cog", children: [o(m.path, { d: "M10 15H6a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "9", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.circle, { cx: "18", cy: "15", r: "3" }), o(m.path, { d: "m14.305 16.53.923-.382" }), o(m.path, { d: "m15.228 13.852-.923-.383" }), o(m.path, { d: "m16.852 12.228-.383-.923" }), o(m.path, { d: "m16.852 17.772-.383.924" }), o(m.path, { d: "m19.148 12.228.383-.923" }), o(m.path, { d: "m19.53 18.696-.382-.924" }), o(m.path, { d: "m20.772 13.852.924-.383" }), o(m.path, { d: "m20.772 16.148.924.383" })] })] }) }) });
});
Sp.displayName = "UserCogIcon";
var Tp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.5 * n, ease: "easeOut", delay: 0.2 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-icon lucide-user", children: [o(m.path, { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "0", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "12", cy: "7", r: "4", variants: g, initial: "normal", animate: t })] }) }) });
});
Tp.displayName = "UserIcon";
var Bp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, animate: { scale: [1, 1.05, 1], transition: { duration: 0.4 * n } } }, g = { normal: { x: 0, rotate: 0 }, animate: { x: [0, -2, 2, -2, 2, 0], rotate: [0, -3, 3, -3, 3, 0], transition: { duration: 0.5 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.circle, { cx: "10", cy: "7", r: "4", variants: y, animate: t, initial: "normal" }), o(m.path, { d: "M10.3 15H7a4 4 0 0 0-4 4v2", variants: y, animate: t, initial: "normal" }), o(m.path, { d: "M15 15.5V14a2 2 0 0 1 4 0v1.5", variants: g, animate: t, initial: "normal" }), o(m.rect, { width: "8", height: "5", x: "13", y: "16", rx: ".899", variants: g, animate: t, initial: "normal" })] }) }) });
});
Bp.displayName = "UserLockIcon";
var Dp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, delay: 0.2, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [20, 0], opacity: [0.4, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.6 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-minus-icon lucide-user-minus", children: [o(m.path, { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "9", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), o(m.line, { x1: "22", x2: "16", y1: "11", y2: "11", strokeDasharray: "20", strokeDashoffset: "0", variants: v, initial: "normal", animate: t })] }) }) });
});
Dp.displayName = "UserMinusIcon";
var zp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, delay: 0.2, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.15, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { rotate: 0, x: 0, y: 0, opacity: 1 }, animate: { rotate: [-8, 8, -4, 0], x: [6, -2, 2, 0], y: [0, -2, 0, 0], opacity: [0.6, 1, 1, 1], transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-pen-icon lucide-user-pen", children: [o(m.path, { d: "M11.5 15H7a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z", variants: v, initial: "normal", animate: t })] }) }) });
});
zp.displayName = "UserPenIcon";
var Wp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, v = { normal: { scale: 1, rotate: 0, opacity: 1 }, animate: { scale: [1, 1.3, 1], rotate: [0, 25, -25, 0], opacity: 1, transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-plus-icon lucide-user-plus", children: [o(m.path, { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "9", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.line, { x1: "19", x2: "19", y1: "8", y2: "14" }), o(m.line, { x1: "22", x2: "16", y1: "11", y2: "11" })] })] }) }) });
});
Wp.displayName = "UserPlusIcon";
var Vp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, delay: 0.2, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [20, 0], opacity: [0.3, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.5 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-check-icon lucide-user-round-check", children: [o(m.path, { d: "M2 21a8 8 0 0 1 13.292-6", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "m16 19 2 2 4-4", strokeDasharray: "20", strokeDashoffset: "20", variants: v, initial: "normal", animate: t })] }) }) });
});
Vp.displayName = "UserRoundCheckIcon";
var Rp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { rotate: 0, scale: 1, opacity: 1 }, animate: { rotate: 360, scale: [0.9, 1.2, 1], opacity: 1, transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-cog-icon lucide-user-round-cog", children: [o(m.path, { d: "M2 21a8 8 0 0 1 10.434-7.62", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.circle, { cx: "18", cy: "18", r: "3" }), o(m.path, { d: "m14.305 19.53.923-.382" }), o(m.path, { d: "m15.228 16.852-.923-.383" }), o(m.path, { d: "m16.852 15.228-.383-.923" }), o(m.path, { d: "m16.852 20.772-.383.924" }), o(m.path, { d: "m19.148 15.228.383-.923" }), o(m.path, { d: "m19.53 21.696-.382-.924" }), o(m.path, { d: "m20.772 16.852.924-.383" }), o(m.path, { d: "m20.772 19.148.924.383" })] })] }) }) });
});
Rp.displayName = "UserRoundCogIcon";
var Pp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((v) => {
    !c || r || (l.current ? e?.(v) : t.start("animate"));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, delay: 0.3, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-icon lucide-user-round", children: [o(m.circle, { cx: "12", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M20 21a8 8 0 0 0-16 0", strokeDasharray: "40", strokeDashoffset: "0", variants: y, initial: "normal", animate: t })] }) }) });
});
Pp.displayName = "UserRoundIcon";
var Fp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, delay: 0.2, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [20, 0], opacity: [0.4, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.6 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-minus-icon lucide-user-round-minus", children: [o(m.path, { d: "M2 21a8 8 0 0 1 13.292-6", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M22 19h-6", strokeDasharray: "20", strokeDashoffset: "0", variants: v, initial: "normal", animate: t })] }) }) });
});
Fp.displayName = "UserRoundMinusIcon";
var Hp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [60, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, delay: 0.2, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { rotate: 0, x: 0, y: 0, opacity: 1 }, animate: { rotate: [-8, 8, -4, 0], x: [6, -2, 2, 0], y: [0, -2, 0, 0], opacity: [0.6, 1, 1, 1], transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-pen-icon lucide-user-round-pen", children: [o(m.path, { d: "M2 21a8 8 0 0 1 10.821-7.487", strokeDasharray: "60", strokeDashoffset: "60", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z", variants: v, initial: "normal", animate: t })] }) }) });
});
Hp.displayName = "UserRoundPenIcon";
var qp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [60, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { x: 0, y: 0, rotate: 0, opacity: 1 }, animate: { x: [0, 2, -2, 1, 0], y: [0, -1, 2, -1, 0], rotate: [0, 6, -6, 4, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-search-icon lucide-user-round-search", children: [o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M2 21a8 8 0 0 1 10.434-7.62", strokeDasharray: "60", strokeDashoffset: "60", variants: y, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.circle, { cx: "18", cy: "18", r: "3" }), o(m.path, { d: "m22 22-1.9-1.9" })] })] }) }) });
});
qp.displayName = "UserRoundSearchIcon";
var Yp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [60, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { scale: 1, rotate: 0, opacity: 1 }, animate: { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0], opacity: 1, transition: { duration: 0.6 * n, ease: "easeInOut" } } }, w = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [20, 0], transition: { duration: 0.5 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-round-x-icon lucide-user-round-x", children: [o(m.path, { d: "M2 21a8 8 0 0 1 11.873-7", strokeDasharray: "60", strokeDashoffset: "60", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.path, { d: "m17 17 5 5", strokeDasharray: "20", strokeDashoffset: "20", variants: w, initial: "normal", animate: t }), o(m.path, { d: "m22 17-5 5", strokeDasharray: "20", strokeDashoffset: "20", variants: w, initial: "normal", animate: t })] })] }) }) });
});
Yp.displayName = "UserRoundXIcon";
var Xp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { x: 0, y: 0, opacity: 1, rotate: 0 }, animate: { x: [0, 2, -2, 1, 0], y: [0, -1, 2, -1, 0], rotate: [0, 5, -5, 3, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-search-icon lucide-user-search", children: [o(m.circle, { cx: "10", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M10.3 15H7a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.circle, { cx: "17", cy: "17", r: "3" }), o(m.path, { d: "m21 21-1.9-1.9" })] })] }) }) });
});
Xp.displayName = "UserSearchIcon";
var Up = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { scale: 1, rotate: 0, opacity: 1 }, animate: { scale: [1, 1.3, 0.9, 1.15, 1], rotate: [0, -15, 15, -10, 0], opacity: [0.4, 1], transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-star-icon lucide-user-star", children: [o(m.path, { d: "M8 15H7a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z", variants: v, initial: "normal", animate: t })] }) }) });
});
Up.displayName = "UserStarIcon";
var Kp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { scale: 1, rotate: 0, opacity: 1 }, animate: { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0], opacity: [0.3, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } }, w = { normal: { strokeDashoffset: 0 }, animate: { strokeDashoffset: [20, 0], transition: { duration: 0.5 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-user-x-icon lucide-user-x", children: [o(m.path, { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", strokeDasharray: "40", strokeDashoffset: "40", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "9", cy: "7", r: "4", variants: g, initial: "normal", animate: t }), A(m.g, { variants: v, initial: "normal", animate: t, children: [o(m.line, { x1: "17", x2: "22", y1: "8", y2: "13", strokeDasharray: "20", strokeDashoffset: "20", variants: w, initial: "normal", animate: t }), o(m.line, { x1: "22", x2: "17", y1: "8", y2: "13", strokeDasharray: "20", strokeDashoffset: "20", variants: w, initial: "normal", animate: t })] })] }) }) });
});
Kp.displayName = "UserXIcon";
var Gp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [50, 0], opacity: [0.3, 1], transition: { duration: 0.7 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 0.8 }, animate: { strokeDashoffset: [40, 0], opacity: [0.2, 1], transition: { duration: 0.7 * n, ease: "easeInOut", delay: 0.3 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-users-icon lucide-users", children: [o(m.path, { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", strokeDasharray: "50", strokeDashoffset: "50", variants: y, initial: "normal", animate: t }), o(m.path, { d: "M16 3.128a4 4 0 0 1 0 7.744", strokeDasharray: "40", strokeDashoffset: "40", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M22 21v-2a4 4 0 0 0-3-3.87", strokeDasharray: "40", strokeDashoffset: "40", variants: v, initial: "normal", animate: t }), o(m.circle, { cx: "9", cy: "7", r: "4", variants: g, initial: "normal", animate: t })] }) }) });
});
Gp.displayName = "UsersIcon";
var Zp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [60, 0], opacity: [0.3, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeOut" } } }, v = { normal: { strokeDashoffset: 0, opacity: 0.7 }, animate: { strokeDashoffset: [50, 0], opacity: [0.2, 1], transition: { duration: 0.8 * n, delay: 0.4, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-users-round-icon lucide-users-round", children: [o(m.path, { d: "M18 21a8 8 0 0 0-16 0", strokeDasharray: "60", strokeDashoffset: "60", variants: y, initial: "normal", animate: t }), o(m.circle, { cx: "10", cy: "8", r: "5", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3", strokeDasharray: "50", strokeDashoffset: "50", variants: v, initial: "normal", animate: t })] }) }) });
});
Zp.displayName = "UsersRoundIcon";
var Qp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("set"), r.start("set"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { rotate: 0 }, set: { rotate: [0, -9, 2, 0], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.4, 0.75, 1] } } }, L = { rest: { rotate: 0 }, set: { rotate: [0, 9, -2, 0], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.4, 0.75, 1], delay: 0.08 * n } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box", transformOrigin: "bottom center" } }), o(m.path, { d: "M7 2v20", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box", transformOrigin: "bottom center" } }), o(m.path, { d: "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7", animate: r, initial: "rest", variants: L, style: { transformBox: "fill-box", transformOrigin: "bottom center" } })] }) }) });
});
Qp.displayName = "UtensilsIcon";
var Jp = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 0.8, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = [0.32, 1.2, 0.5, 1], g = [0.16, 1, 0.3, 1], v = { normal: { pathLength: 1, opacity: 1, scale: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], scale: [0.88, 1.04, 1], transition: { pathLength: { duration: n * 0.55, ease: g }, opacity: { duration: n * 0.3, ease: g }, scale: { duration: n * 0.55, ease: y } } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { pathLength: { duration: n * 0.5, ease: g, delay: n * 0.18 }, opacity: { duration: n * 0.25, ease: g, delay: n * 0.18 } } } }, L = { normal: { pathLength: 1, opacity: 1, scaleX: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], scaleX: [0, 1.08, 1], transition: { pathLength: { duration: n * 0.65, ease: g, delay: n * 0.35 }, opacity: { duration: n * 0.3, ease: g, delay: n * 0.35 }, scaleX: { duration: n * 0.65, ease: y, delay: n * 0.35 } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", children: [o(m.circle, { cx: "12", cy: "9", r: "6", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M12 15v7", variants: w, initial: "normal", animate: t }), o(m.path, { d: "M9 19h6", variants: L, initial: "normal", animate: t, style: { originX: "12px", originY: "19px" } })] }) }) });
});
Jp.displayName = "VenusIcon";
var tf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("pan");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { rotate: 0 }, pan: { rotate: [0, -6, -6, 2.5, 0], transition: { duration: 0.75 * n, ease: "easeInOut", times: [0, 0.32, 0.5, 0.8, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "rest", children: A(m.g, { variants: v, style: { transformBox: "view-box", originX: "9px", originY: "18px" }, children: [o("path", { d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" }), o("rect", { x: "2", y: "6", width: "14", height: "12", rx: "2" })] }) }) }) });
});
tf.displayName = "VideoIcon";
var ef = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("play");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { opacity: 1, scale: 1 }, play: { opacity: [0.25, 1, 0.25], scale: [0.85, 1.1, 0.85], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0, delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }), o(m.path, { d: "M16 9a5 5 0 0 1 0 6", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box", originX: "0%", originY: "50%" } })] }) }) });
});
ef.displayName = "Volume1Icon";
var af = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("play");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { opacity: 1, scale: 1 }, play: { opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85], transition: { duration: 1 * n, ease: "easeInOut", repeat: 1 / 0, delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }), o(m.path, { d: "M16 9a5 5 0 0 1 0 6", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box", transformOrigin: "left center" } }), o(m.path, { d: "M19.364 18.364a9 9 0 0 0 0-12.728", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box", transformOrigin: "left center" } })] }) }) });
});
af.displayName = "Volume2Icon";
var nf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("thump");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = { rest: { scale: 1 }, thump: { scale: [1, 1.12, 0.97, 1.04, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.28, 0.55, 0.78, 1] } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, animate: t, initial: "rest", variants: v, ...u, style: { color: d, ...u.style }, children: o("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: o("path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }) }) }) });
});
nf.displayName = "VolumeIcon";
var rf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = j(), h = b(!1), f = x(() => {
    l || (t.start("cut"), r.start("cut"));
  }, [t, r, l]), y = x(() => {
    t.start("rest"), r.start("rest");
  }, [t, r]);
  E(p, () => (h.current = !0, { startAnimation: f, stopAnimation: y }));
  let g = x((N) => {
    !c || l || (h.current ? e?.(N) : f());
  }, [c, l, f, e]), v = x((N) => {
    h.current ? a?.(N) : y();
  }, [y, a]), w = { rest: { pathLength: 1, opacity: 1 }, cut: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.9 * n, ease: [0.16, 1, 0.3, 1] } } }, L = (N) => ({ rest: { opacity: 1 }, cut: { opacity: [1, 0.25, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: N * 0.08 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: g, onMouseLeave: v, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o(m.path, { d: "M16 9a5 5 0 0 1 .95 2.293", animate: r, initial: "rest", variants: L(0), style: { transformBox: "fill-box", originX: "0%", originY: "50%" } }), o(m.path, { d: "M19.364 5.636a9 9 0 0 1 1.889 9.96", animate: r, initial: "rest", variants: L(1), style: { transformBox: "fill-box", originX: "0%", originY: "50%" } }), o(m.path, { d: "m2 2 20 20", animate: t, initial: "rest", variants: w, style: { transformBox: "fill-box", originX: "0%", originY: "0%" } }), o("path", { d: "m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11" }), o("path", { d: "M9.828 4.172A.686.686 0 0 1 11 4.657v.686" })] }) }) });
});
rf.displayName = "VolumeOffIcon";
var of = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1), h = x(() => {
    r || t.start("mute");
  }, [t, r]), f = x(() => {
    t.start("rest");
  }, [t]);
  E(p, () => (l.current = !0, { startAnimation: h, stopAnimation: f }));
  let y = x((w) => {
    !c || r || (l.current ? e?.(w) : h());
  }, [c, r, h, e]), g = x((w) => {
    l.current ? a?.(w) : f();
  }, [f, a]), v = (w) => ({ rest: { pathLength: 1, opacity: 1, scale: 1 }, mute: { pathLength: [0, 1], opacity: [0, 1], scale: [0.7, 1.12, 1], transition: { duration: 0.8 * n, ease: [0.34, 1.4, 0.64, 1], delay: w * 0.12 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A("svg", { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [o("path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }), o(m.line, { x1: "22", x2: "16", y1: "9", y2: "15", animate: t, initial: "rest", variants: v(0), style: { transformBox: "fill-box", originX: "50%", originY: "50%" } }), o(m.line, { x1: "16", x2: "22", y1: "9", y2: "15", animate: t, initial: "rest", variants: v(1), style: { transformBox: "fill-box", originX: "50%", originY: "50%" } })] }) }) });
});
of.displayName = "VolumeXIcon";
var sf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((w) => {
    !c || r || (l.current ? e?.(w) : t.start("animate"));
  }, [t, r, c, e]), f = x((w) => {
    l.current ? a?.(w) : t.start("normal");
  }, [t, a]), y = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [80, 0], opacity: [0.4, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, g = { normal: { rotate: 0, originX: 0.1, originY: 0.5 }, animate: { rotate: [-6, 0, -3, 0], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.2 } } }, v = { normal: { x: 0, opacity: 0 }, animate: { x: [0, 6, 0], opacity: [0, 1, 0], transition: { duration: 0.8 * n, ease: "easeInOut", delay: 0.45 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-wallet-icon lucide-wallet", children: [o(m.path, { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4", strokeDasharray: "80", strokeDashoffset: "80", variants: y, initial: "normal", animate: t }), o(m.g, { variants: g, initial: "normal", animate: t, children: o(m.path, { d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }) }), o(m.line, { x1: "14", y1: "12", x2: "18", y2: "12", variants: v, initial: "normal", animate: t })] }) }) });
});
sf.displayName = "WalletIcon";
var lf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((N) => {
    !c || r || (l.current ? e?.(N) : t.start("animate"));
  }, [t, r, c, e]), f = x((N) => {
    l.current ? a?.(N) : t.start("normal");
  }, [t, a]), y = { normal: { rotate: 0, scale: 1 }, animate: { rotate: [-2, 0, -1, 0], scale: [1, 1.02, 1], transition: { duration: 0.9 * n, ease: "easeInOut" } } }, g = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [120, 0], opacity: [0.4, 1], transition: { duration: 0.8 * n, ease: "easeInOut" } } }, v = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.7, 1.25, 1], opacity: [0, 1], transition: { duration: 0.45 * n, delay: 0.4, ease: "easeOut" } } }, w = { normal: { x: 0, opacity: 0 }, animate: { x: [0, 3, 0], opacity: [0, 1, 0], transition: { duration: 0.5 * n, delay: 0.5, ease: "easeInOut" } } }, L = { normal: { x: -18, opacity: 0 }, animate: { x: [-18, 22], opacity: [0, 0.35, 0], transition: { duration: 0.8 * n, delay: 0.25, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-wallet-minimal-icon lucide-wallet-minimal", children: A(m.g, { variants: y, initial: "normal", animate: t, children: [o("defs", { children: A("linearGradient", { id: "wm-shimmer", x1: "0", x2: "1", y1: "0", y2: "0", children: [o("stop", { offset: "0%", stopColor: "currentColor", stopOpacity: "0" }), o("stop", { offset: "50%", stopColor: "currentColor", stopOpacity: "0.35" }), o("stop", { offset: "100%", stopColor: "currentColor", stopOpacity: "0" })] }) }), o(m.path, { d: "M7 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14", strokeDasharray: "120", strokeDashoffset: "120", variants: g, initial: "normal", animate: t }), o(m.path, { d: "M17 14h.01", variants: v, initial: "normal", animate: t }), o(m.path, { d: "M17 14h.01", variants: w, initial: "normal", animate: t }), o(m.rect, { x: "2", y: "4", width: "20", height: "16", rx: "3", fill: "url(#wm-shimmer)", variants: L, initial: "normal", animate: t, style: { pointerEvents: "none" } })] }) }) }) });
});
lf.displayName = "WalletMinimalIcon";
var cf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: async () => {
    if (r) {
      t.start("normal");
      return;
    }
    await t.start("prime"), await t.start("emit"), await t.start("flow"), await t.start("settle");
  }, stopAnimation: () => t.start("normal") }));
  let h = x(async (v) => {
    !c || r || (l.current ? e?.(v) : (await t.start("prime"), await t.start("emit"), await t.start("flow"), await t.start("settle")));
  }, [t, r, c, e]), f = x((v) => {
    l.current ? a?.(v) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1 }, prime: { scale: 0.96, transition: { duration: 0.18 * n, ease: [0.4, 0, 0.6, 1] } }, emit: { scale: 1.04, transition: { duration: 0.22 * n, ease: [0.34, 1.2, 0.64, 1] } }, flow: { scale: 1 }, settle: { scale: 1, transition: { duration: 0.3 * n, ease: [0.33, 1, 0.68, 1] } } }, g = (v = 0) => ({ normal: { strokeDasharray: "0 1", opacity: 1 }, prime: { opacity: 0.6 }, emit: { strokeDasharray: "16 6", transition: { duration: 0.35 * n, ease: "easeOut" } }, flow: { strokeDasharray: ["16 6", "0 1"], opacity: [1, 0.8, 1], transition: { delay: v, duration: 0.45 * n, ease: "easeInOut" } }, settle: { strokeDasharray: "0 1", opacity: 1, transition: { duration: 0.25 * n } } });
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: y, initial: "normal", animate: t, children: [o(m.path, { d: "M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2", variants: g(0) }), o(m.path, { d: "m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06", variants: g(0.08) }), o(m.path, { d: "m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8", variants: g(0.16) })] }) }) });
});
cf.displayName = "WebhookIcon";
var uf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = j(), g = b(!1);
  E(p, () => (g.current = !0, { startAnimation: () => {
    y ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal");
  } }));
  let v = x((Z) => {
    !c || y || (g.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate")));
  }, [t, r, l, h, f, y, e, c]), w = x((Z) => {
    g.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"));
  }, [t, r, l, h, f, a]), L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 0.98, 1], rotate: [0, -2, 2, 0], transition: { duration: 0.9 * n, ease: [0.22, 0.9, 0.32, 1] } } }, N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.05 } } }, T = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.1 } } }, Y = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.15 } } }, G = { normal: { rotate: 0, opacity: 1, scale: 1 }, animate: { rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 1], opacity: [0.7, 1, 1], transition: { duration: 1.2 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: v, onMouseLeave: w, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: L, children: [o(m.path, { d: "M2 7.82a15 15 0 0 1 20 0", initial: "normal", animate: r, variants: N }), o(m.path, { d: "M5 11.858a10 10 0 0 1 11.5-1.785", initial: "normal", animate: l, variants: T }), o(m.path, { d: "M8.5 15.429a5 5 0 0 1 2.413-1.31", initial: "normal", animate: h, variants: Y }), A(m.g, { initial: "normal", animate: f, variants: G, children: [o(m.path, { d: "m14.305 19.53.923-.382" }), o(m.path, { d: "m15.228 16.852-.923-.383" }), o(m.path, { d: "m16.852 15.228-.383-.923" }), o(m.path, { d: "m16.852 20.772-.383.924" }), o(m.path, { d: "m19.148 15.228.383-.923" }), o(m.path, { d: "m19.53 21.696-.382-.924" }), o(m.path, { d: "m20.772 16.852.924-.383" }), o(m.path, { d: "m20.772 19.148.924.383" }), o(m.circle, { cx: "18", cy: "18", r: "3" })] })] }) }) });
});
uf.displayName = "WifiCogIcon";
var mf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = j(), g = b(!1);
  E(p, () => (g.current = !0, { startAnimation: () => {
    y ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal");
  } }));
  let v = x((Z) => {
    !c || y || (g.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate")));
  }, [t, r, l, h, f, y, e, c]), w = x((Z) => {
    g.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"));
  }, [t, r, l, h, f, a]), L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.98, 1], rotate: [0, -2, 2, 0], transition: { duration: 0.9 * n, ease: [0.22, 0.9, 0.32, 1] } } }, N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.06 } } }, T = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } }, Y = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.18 } } }, G = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.2, 1], opacity: [0, 1, 1], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.22 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: v, onMouseLeave: w, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: L, children: [o(m.path, { d: "M12 20h.01", initial: "normal", animate: f, variants: G }), o(m.path, { d: "M2 8.82a15 15 0 0 1 20 0", initial: "normal", animate: r, variants: N }), o(m.path, { d: "M5 12.859a10 10 0 0 1 14 0", initial: "normal", animate: l, variants: T }), o(m.path, { d: "M8.5 16.429a5 5 0 0 1 7 0", initial: "normal", animate: h, variants: Y })] }) }) });
});
mf.displayName = "WifiIcon";
var df = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = M(), g = j(), v = b(!1);
  E(p, () => (v.current = !0, { startAnimation: () => {
    g ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"), y.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"), y.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"), y.start("normal");
  } }));
  let w = x((ot) => {
    !c || g || (v.current ? e?.(ot) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"), y.start("animate")));
  }, [t, r, l, h, f, y, g, e, c]), L = x((ot) => {
    v.current ? a?.(ot) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"), y.start("normal"));
  }, [t, r, l, h, f, y, a]), N = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.04, 0.98, 1], rotate: [0, -1.5, 1.5, 0], transition: { duration: 0.9 * n, ease: [0.22, 0.9, 0.32, 1] } } }, T = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.05 } } }, Y = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } }, G = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.18 } } }, Z = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.15, 1], opacity: [0, 1, 1], transition: { duration: 0.6 * n, ease: "easeOut", delay: 0.22 } } }, tt = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.5 * n, ease: "easeInOut", delay: 0.02 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: w, onMouseLeave: L, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: N, children: [o(m.path, { d: "M12 20h.01", initial: "normal", animate: f, variants: Z }), o(m.path, { d: "M8.5 16.429a5 5 0 0 1 7 0", initial: "normal", animate: h, variants: G }), o(m.path, { d: "M5 12.859a10 10 0 0 1 5.17-2.69", initial: "normal", animate: l, variants: Y }), o(m.path, { d: "M19 12.859a10 10 0 0 0-2.007-1.523", initial: "normal", animate: l, variants: Y }), o(m.path, { d: "M2 8.82a15 15 0 0 1 4.177-2.643", initial: "normal", animate: r, variants: T }), o(m.path, { d: "M22 8.82a15 15 0 0 0-11.288-3.764", initial: "normal", animate: r, variants: T }), o(m.path, { d: "m2 2 20 20", initial: "normal", animate: y, variants: tt })] }) }) });
});
df.displayName = "WifiOffIcon";
var hf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = j(), g = b(!1);
  E(p, () => (g.current = !0, { startAnimation: () => {
    y ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal");
  } }));
  let v = x((Z) => {
    !c || y || (g.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate")));
  }, [t, r, l, h, f, y, e, c]), w = x((Z) => {
    g.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"));
  }, [t, r, l, h, f, a]), L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.06, 0.99, 1], rotate: [0, -1.5, 1.5, 0], transition: { duration: 0.9 * n, ease: [0.22, 0.9, 0.32, 1] } } }, N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.04 } } }, T = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } }, Y = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.18 } } }, G = { normal: { rotate: 0, x: 0, y: 0, opacity: 1 }, animate: { rotate: [-8, 8, -4, 0], x: [6, -2, 2, 0], y: [0, -2, 0, 0], opacity: [0.6, 1, 1, 1], transition: { duration: 1 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: v, onMouseLeave: w, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: L, children: [o(m.path, { d: "M2 8.82a15 15 0 0 1 20 0", initial: "normal", animate: r, variants: N }), o(m.path, { d: "M5 12.859a10 10 0 0 1 10.5-2.222", initial: "normal", animate: l, variants: T }), o(m.path, { d: "M8.5 16.429a5 5 0 0 1 3-1.406", initial: "normal", animate: h, variants: Y }), o(m.g, { initial: "normal", animate: f, variants: G, children: o(m.path, { d: "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" }) })] }) }) });
});
hf.displayName = "WifiPenIcon";
var pf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = M(), f = M(), y = j(), g = b(!1);
  E(p, () => (g.current = !0, { startAnimation: () => {
    y ? (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal");
  } }));
  let v = x((Z) => {
    !c || y || (g.current ? e?.(Z) : (t.start("animate"), r.start("animate"), l.start("animate"), h.start("animate"), f.start("animate")));
  }, [t, r, l, h, f, y, e, c]), w = x((Z) => {
    g.current ? a?.(Z) : (t.start("normal"), r.start("normal"), l.start("normal"), h.start("normal"), f.start("normal"));
  }, [t, r, l, h, f, a]), L = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.05, 0.98, 1], rotate: [0, -1.5, 1.5, 0], transition: { duration: 0.9 * n, ease: [0.22, 0.9, 0.32, 1] } } }, N = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.9 * n, ease: "easeOut", delay: 0.05 } } }, T = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.8 * n, ease: "easeOut", delay: 0.12 } } }, Y = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.7 * n, ease: "easeOut", delay: 0.18 } } }, G = { normal: { rotate: 0, opacity: 1 }, animate: { rotate: [0, 360], opacity: [0.6, 1, 1], transition: { duration: 1.4 * n, ease: "easeInOut", repeat: 0 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: v, onMouseLeave: w, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", initial: "normal", animate: t, variants: L, children: [o(m.path, { d: "M2 8.82a15 15 0 0 1 20 0", initial: "normal", animate: r, variants: N }), o(m.path, { d: "M5 12.86a10 10 0 0 1 3-2.032", initial: "normal", animate: l, variants: T }), o(m.path, { d: "M8.5 16.429h.01", initial: "normal", animate: h, variants: Y }), A(m.g, { initial: "normal", animate: f, variants: G, children: [o(m.path, { d: "M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" }), o(m.path, { d: "M11.965 14.105h4" }), o(m.path, { d: "M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" }), o(m.path, { d: "M21.965 22.105v-4" })] })] }) }) });
});
pf.displayName = "WifiSyncIcon";
var ff = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = M(), l = M(), h = j(), f = b(!1);
  E(p, () => (f.current = !0, { startAnimation: () => {
    h ? (t.start("normal"), r.start("normal"), l.start("normal")) : (t.start("animate"), r.start("animate"), l.start("animate"));
  }, stopAnimation: () => {
    t.start("normal"), r.start("normal"), l.start("normal");
  } }));
  let y = x((L) => {
    !c || h || (f.current ? e?.(L) : (t.start("animate"), r.start("animate"), l.start("animate")));
  }, [t, r, l, h, e, c]), g = x((L) => {
    f.current ? a?.(L) : (t.start("normal"), r.start("normal"), l.start("normal"));
  }, [t, r, l, a]), v = { normal: { rotate: 0, scale: 1, transition: { duration: 0.3 * n } }, animate: { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1], transition: { duration: 0.6 * n } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.6 * n, ease: "easeInOut" } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: y, onMouseLeave: g, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", variants: v, initial: "normal", animate: t, children: [o(m.path, { d: "M18 6 6 18", variants: w, initial: "normal", animate: r }), o(m.path, { d: "m6 6 12 12", variants: w, initial: "normal", animate: l, transition: { delay: 0.2 } })] }) }) });
});
ff.displayName = "XIcon";
var yf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((L) => {
    !c || r || (l.current ? e?.(L) : t.start("animate"));
  }, [t, r, c, e]), f = x((L) => {
    l.current ? a?.(L) : t.start("normal");
  }, [t, a]), y = { normal: { scale: 1, rotate: 0, y: 0 }, animate: { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0], y: [0, -1, 0], transition: { duration: 1.2 * n, ease: "easeInOut" } } }, g = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.7, 1], transition: { duration: 0.9 * n, ease: "easeInOut", delay: 0.06 } } }, v = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.22 } } }, w = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.8, 1], transition: { duration: 0.6 * n, ease: "easeInOut", delay: 0.34 } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: A(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", animate: t, initial: "normal", variants: y, className: "lucide lucide-japanese-yen-icon lucide-japanese-yen", children: [A("g", { opacity: 0.35, children: [o("path", { d: "M12 9.5V21m0-11.5L6 3m6 6.5L18 3" }), o("path", { d: "M6 15h12" }), o("path", { d: "M6 11h12" })] }), o(m.path, { d: "M12 9.5V21m0-11.5L6 3m6 6.5L18 3", pathLength: 1, variants: g, initial: "normal", animate: t }), o(m.path, { d: "M6 11h12", pathLength: 1, variants: v, initial: "normal", animate: t }), o(m.path, { d: "M6 15h12", pathLength: 1, variants: w, initial: "normal", animate: t })] }) }) });
});
yf.displayName = "YenYuanIcon";
var vf = $(({ onMouseEnter: e, onMouseLeave: a, className: s, size: i = 24, duration: n = 1, isAnimated: c = !0, color: d, ...u }, p) => {
  let t = M(), r = j(), l = b(!1);
  E(p, () => (l.current = !0, { startAnimation: () => r ? t.start("normal") : t.start("animate"), stopAnimation: () => t.start("normal") }));
  let h = x((g) => {
    !c || r || (l.current ? e?.(g) : t.start("animate"));
  }, [t, r, c, e]), f = x((g) => {
    l.current ? a?.(g) : t.start("normal");
  }, [t, a]), y = { normal: { pathLength: 1, pathOffset: 0, opacity: 1, scale: 1, rotate: 0 }, animate: { pathLength: [0, 1], pathOffset: [0.6, 0], opacity: [0.4, 1], scale: [0.92, 1.08, 1], rotate: [0, -4, 2, 0], transition: { pathLength: { duration: 0.45 * n, ease: "easeOut" }, pathOffset: { duration: 0.45 * n, ease: "easeOut" }, scale: { duration: 0.6 * n, ease: "easeOut" }, rotate: { duration: 0.6 * n, ease: "easeOut" }, opacity: { duration: 0.25 * n, ease: "linear" } } } };
  return o(I, { features: O, strict: !0, children: o(m.div, { className: C("inline-flex items-center justify-center", s), onMouseEnter: h, onMouseLeave: f, ...u, style: { color: d, ...u.style }, children: o(m.svg, { xmlns: "http://www.w3.org/2000/svg", width: i, height: i, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-zap-icon lucide-zap", children: o(m.path, { d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z", variants: y, initial: "normal", animate: t }) }) }) });
});
vf.displayName = "ZapIcon";
const gf = 300;
function wf(e) {
  if (typeof e != "string") return null;
  const a = /^(\d{4}-\d{2}-\d{2})$/.exec(e.trim());
  return a ? a[1] : null;
}
function kf(e) {
  if (typeof e != "string") return null;
  const a = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/.exec(e.trim());
  return a ? `${a[1]}T${a[2]}` : null;
}
function xf(e, a) {
  const s = e.type === "text", i = s ? document.createElement("textarea") : document.createElement("input");
  i.className = "fm-input", s && (i.rows = 1);
  let n = "text", c = e.value == null ? "" : String(e.value);
  if (e.type === "number") {
    n = "number";
    const p = Number(e.value);
    c = e.value == null || e.value === "" || !Number.isFinite(p) ? "" : String(p);
  } else if (e.type === "date") {
    const p = wf(e.value);
    p !== null && (n = "date", c = p);
  } else if (e.type === "datetime") {
    const p = kf(e.value);
    p !== null && (n = "datetime-local", c = p);
  }
  if (s || (i.type = n), i.value = c, !s) {
    const p = i.value;
    c !== "" && p === "" && (n === "date" || n === "datetime-local") ? (c = e.value == null ? "" : String(e.value), i.type = "text", i.value = c) : c = p;
  }
  if (s) {
    const p = () => {
      i.style.height = "auto", i.style.height = `${i.scrollHeight}px`;
    };
    if (i.addEventListener("input", p), typeof requestAnimationFrame == "function" ? requestAnimationFrame(p) : p(), typeof ResizeObserver == "function") {
      let t = -1;
      const r = new ResizeObserver(() => {
        if (!i.isConnected) {
          r.disconnect();
          return;
        }
        i.clientWidth !== t && (t = i.clientWidth, p());
      });
      r.observe(i);
    }
  }
  const d = () => {
    if (i.value === c) return;
    let p = i.value;
    e.type === "number" && (p = i.value === "" ? null : Number(i.value)), c = i.value, a.commit(p);
  };
  let u;
  return i.addEventListener("input", (p) => {
    p.isComposing || (u !== void 0 && clearTimeout(u), u = setTimeout(d, gf));
  }), i.addEventListener("change", d), i.addEventListener("keydown", (p) => {
    const t = p;
    t.isComposing || t.keyCode === 229 || t.key === "Enter" && (t.preventDefault(), d(), a.onEnter?.());
  }), i;
}
function Mf(e, a) {
  const s = document.createElement("input");
  return s.className = "fm-checkbox", s.type = "checkbox", s.checked = e.value === !0, s.addEventListener("change", () => a.commit(s.checked)), s;
}
function Lf(e, a) {
  const s = document.createElement("div");
  s.className = "fm-chips";
  const i = Array.isArray(e.value) ? e.value.map((d) => String(d)) : [], n = (d) => a.commit(d);
  i.forEach((d, u) => {
    const p = document.createElement("span");
    p.className = "fm-chip", p.textContent = d;
    const t = document.createElement("button");
    t.type = "button", t.className = "fm-chip-x", t.textContent = "×", t.addEventListener("mousedown", (r) => r.preventDefault()), t.addEventListener("click", () => n(i.filter((r, l) => l !== u))), p.appendChild(t), s.appendChild(p);
  });
  const c = document.createElement("input");
  return c.className = "fm-add-input", c.addEventListener("keydown", (d) => {
    const u = d;
    if (!(u.isComposing || u.keyCode === 229))
      if (u.key === "Enter") {
        u.preventDefault();
        const p = c.value.trim();
        if (p === "") {
          c.value = "", a.onEmptyEnter?.();
          return;
        }
        c.value = "", n([...i, p]);
      } else u.key === "Escape" && (u.preventDefault(), c.value = "");
  }), s.appendChild(c), s;
}
function _f(e) {
  const a = document.createElement("code");
  return a.className = "fm-raw-value", a.textContent = e.raw, a;
}
function Af(e, a) {
  return e.complex || e.type === "raw" ? _f(e) : e.type === "boolean" ? Mf(e, a) : e.type === "list" ? Lf(e, a) : xf(e, a);
}
function bf(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var yt = {}, qe = {}, Ft = {}, Ir;
function Ie() {
  if (Ir) return Ft;
  Ir = 1;
  function e(d) {
    return typeof d > "u" || d === null;
  }
  function a(d) {
    return typeof d == "object" && d !== null;
  }
  function s(d) {
    return Array.isArray(d) ? d : e(d) ? [] : [d];
  }
  function i(d, u) {
    if (u) {
      const p = Object.keys(u);
      for (let t = 0, r = p.length; t < r; t += 1) {
        const l = p[t];
        d[l] = u[l];
      }
    }
    return d;
  }
  function n(d, u) {
    let p = "";
    for (let t = 0; t < u; t += 1)
      p += d;
    return p;
  }
  function c(d) {
    return d === 0 && Number.NEGATIVE_INFINITY === 1 / d;
  }
  return Ft.isNothing = e, Ft.isObject = a, Ft.toArray = s, Ft.repeat = n, Ft.isNegativeZero = c, Ft.extend = i, Ft;
}
var Aa, Or;
function Oe() {
  if (Or) return Aa;
  Or = 1;
  function e(s, i) {
    let n = "";
    const c = s.reason || "(unknown reason)";
    return s.mark ? (s.mark.name && (n += 'in "' + s.mark.name + '" '), n += "(" + (s.mark.line + 1) + ":" + (s.mark.column + 1) + ")", !i && s.mark.snippet && (n += `

` + s.mark.snippet), c + " " + n) : c;
  }
  function a(s, i) {
    Error.call(this), this.name = "YAMLException", this.reason = s, this.mark = i, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return a.prototype = Object.create(Error.prototype), a.prototype.constructor = a, a.prototype.toString = function(i) {
    return this.name + ": " + e(this, i);
  }, Aa = a, Aa;
}
var ba, jr;
function Nf() {
  if (jr) return ba;
  jr = 1;
  const e = Ie();
  function a(n, c, d, u, p) {
    let t = "", r = "";
    const l = Math.floor(p / 2) - 1;
    return u - c > l && (t = " ... ", c = u - l + t.length), d - u > l && (r = " ...", d = u + l - r.length), {
      str: t + n.slice(c, d).replace(/\t/g, "→") + r,
      pos: u - c + t.length
      // relative position
    };
  }
  function s(n, c) {
    return e.repeat(" ", c - n.length) + n;
  }
  function i(n, c) {
    if (c = Object.create(c || null), !n.buffer) return null;
    c.maxLength || (c.maxLength = 79), typeof c.indent != "number" && (c.indent = 1), typeof c.linesBefore != "number" && (c.linesBefore = 3), typeof c.linesAfter != "number" && (c.linesAfter = 2);
    const d = /\r?\n|\r|\0/g, u = [0], p = [];
    let t, r = -1;
    for (; t = d.exec(n.buffer); )
      p.push(t.index), u.push(t.index + t[0].length), n.position <= t.index && r < 0 && (r = u.length - 2);
    r < 0 && (r = u.length - 1);
    let l = "";
    const h = Math.min(n.line + c.linesAfter, p.length).toString().length, f = c.maxLength - (c.indent + h + 3);
    for (let g = 1; g <= c.linesBefore && !(r - g < 0); g++) {
      const v = a(
        n.buffer,
        u[r - g],
        p[r - g],
        n.position - (u[r] - u[r - g]),
        f
      );
      l = e.repeat(" ", c.indent) + s((n.line - g + 1).toString(), h) + " | " + v.str + `
` + l;
    }
    const y = a(n.buffer, u[r], p[r], n.position, f);
    l += e.repeat(" ", c.indent) + s((n.line + 1).toString(), h) + " | " + y.str + `
`, l += e.repeat("-", c.indent + h + 3 + y.pos) + `^
`;
    for (let g = 1; g <= c.linesAfter && !(r + g >= p.length); g++) {
      const v = a(
        n.buffer,
        u[r + g],
        p[r + g],
        n.position - (u[r] - u[r + g]),
        f
      );
      l += e.repeat(" ", c.indent) + s((n.line + g + 1).toString(), h) + " | " + v.str + `
`;
    }
    return l.replace(/\n$/, "");
  }
  return ba = i, ba;
}
var Na, Sr;
function gt() {
  if (Sr) return Na;
  Sr = 1;
  const e = Oe(), a = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], s = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function i(c) {
    const d = {};
    return c !== null && Object.keys(c).forEach(function(u) {
      c[u].forEach(function(p) {
        d[String(p)] = u;
      });
    }), d;
  }
  function n(c, d) {
    if (d = d || {}, Object.keys(d).forEach(function(u) {
      if (a.indexOf(u) === -1)
        throw new e('Unknown option "' + u + '" is met in definition of "' + c + '" YAML type.');
    }), this.options = d, this.tag = c, this.kind = d.kind || null, this.resolve = d.resolve || function() {
      return !0;
    }, this.construct = d.construct || function(u) {
      return u;
    }, this.instanceOf = d.instanceOf || null, this.predicate = d.predicate || null, this.represent = d.represent || null, this.representName = d.representName || null, this.defaultStyle = d.defaultStyle || null, this.multi = d.multi || !1, this.styleAliases = i(d.styleAliases || null), s.indexOf(this.kind) === -1)
      throw new e('Unknown kind "' + this.kind + '" is specified for "' + c + '" YAML type.');
  }
  return Na = n, Na;
}
var $a, Tr;
function Zo() {
  if (Tr) return $a;
  Tr = 1;
  const e = Oe(), a = gt();
  function s(c, d) {
    const u = [];
    return c[d].forEach(function(p) {
      let t = u.length;
      u.forEach(function(r, l) {
        r.tag === p.tag && r.kind === p.kind && r.multi === p.multi && (t = l);
      }), u[t] = p;
    }), u;
  }
  function i() {
    const c = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function d(u) {
      u.multi ? (c.multi[u.kind].push(u), c.multi.fallback.push(u)) : c[u.kind][u.tag] = c.fallback[u.tag] = u;
    }
    for (let u = 0, p = arguments.length; u < p; u += 1)
      arguments[u].forEach(d);
    return c;
  }
  function n(c) {
    return this.extend(c);
  }
  return n.prototype.extend = function(d) {
    let u = [], p = [];
    if (d instanceof a)
      p.push(d);
    else if (Array.isArray(d))
      p = p.concat(d);
    else if (d && (Array.isArray(d.implicit) || Array.isArray(d.explicit)))
      d.implicit && (u = u.concat(d.implicit)), d.explicit && (p = p.concat(d.explicit));
    else
      throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    u.forEach(function(r) {
      if (!(r instanceof a))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (r.loadKind && r.loadKind !== "scalar")
        throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (r.multi)
        throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), p.forEach(function(r) {
      if (!(r instanceof a))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    const t = Object.create(n.prototype);
    return t.implicit = (this.implicit || []).concat(u), t.explicit = (this.explicit || []).concat(p), t.compiledImplicit = s(t, "implicit"), t.compiledExplicit = s(t, "explicit"), t.compiledTypeMap = i(t.compiledImplicit, t.compiledExplicit), t;
  }, $a = n, $a;
}
var Ea, Br;
function Qo() {
  if (Br) return Ea;
  Br = 1;
  const e = gt();
  return Ea = new e("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(a) {
      return a !== null ? a : "";
    }
  }), Ea;
}
var Ca, Dr;
function Jo() {
  if (Dr) return Ca;
  Dr = 1;
  const e = gt();
  return Ca = new e("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(a) {
      return a !== null ? a : [];
    }
  }), Ca;
}
var Ia, zr;
function ts() {
  if (zr) return Ia;
  zr = 1;
  const e = gt();
  return Ia = new e("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(a) {
      return a !== null ? a : {};
    }
  }), Ia;
}
var Oa, Wr;
function es() {
  if (Wr) return Oa;
  Wr = 1;
  const e = Zo();
  return Oa = new e({
    explicit: [
      Qo(),
      Jo(),
      ts()
    ]
  }), Oa;
}
var ja, Vr;
function as() {
  if (Vr) return ja;
  Vr = 1;
  const e = gt();
  function a(n) {
    if (n === null) return !0;
    const c = n.length;
    return c === 1 && n === "~" || c === 4 && (n === "null" || n === "Null" || n === "NULL");
  }
  function s() {
    return null;
  }
  function i(n) {
    return n === null;
  }
  return ja = new e("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: a,
    construct: s,
    predicate: i,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  }), ja;
}
var Sa, Rr;
function ns() {
  if (Rr) return Sa;
  Rr = 1;
  const e = gt();
  function a(n) {
    if (n === null) return !1;
    const c = n.length;
    return c === 4 && (n === "true" || n === "True" || n === "TRUE") || c === 5 && (n === "false" || n === "False" || n === "FALSE");
  }
  function s(n) {
    return n === "true" || n === "True" || n === "TRUE";
  }
  function i(n) {
    return Object.prototype.toString.call(n) === "[object Boolean]";
  }
  return Sa = new e("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: a,
    construct: s,
    predicate: i,
    represent: {
      lowercase: function(n) {
        return n ? "true" : "false";
      },
      uppercase: function(n) {
        return n ? "TRUE" : "FALSE";
      },
      camelcase: function(n) {
        return n ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), Sa;
}
var Ta, Pr;
function rs() {
  if (Pr) return Ta;
  Pr = 1;
  const e = Ie(), a = gt();
  function s(t) {
    return t >= 48 && t <= 57 || t >= 65 && t <= 70 || t >= 97 && t <= 102;
  }
  function i(t) {
    return t >= 48 && t <= 55;
  }
  function n(t) {
    return t >= 48 && t <= 57;
  }
  function c(t) {
    if (t === null) return !1;
    const r = t.length;
    let l = 0, h = !1;
    if (!r) return !1;
    let f = t[l];
    if ((f === "-" || f === "+") && (f = t[++l]), f === "0") {
      if (l + 1 === r) return !0;
      if (f = t[++l], f === "b") {
        for (l++; l < r; l++) {
          if (f = t[l], f !== "0" && f !== "1") return !1;
          h = !0;
        }
        return h && isFinite(d(t));
      }
      if (f === "x") {
        for (l++; l < r; l++) {
          if (!s(t.charCodeAt(l))) return !1;
          h = !0;
        }
        return h && isFinite(d(t));
      }
      if (f === "o") {
        for (l++; l < r; l++) {
          if (!i(t.charCodeAt(l))) return !1;
          h = !0;
        }
        return h && isFinite(d(t));
      }
    }
    for (; l < r; l++) {
      if (!n(t.charCodeAt(l)))
        return !1;
      h = !0;
    }
    return h ? isFinite(d(t)) : !1;
  }
  function d(t) {
    let r = t, l = 1, h = r[0];
    if ((h === "-" || h === "+") && (h === "-" && (l = -1), r = r.slice(1), h = r[0]), r === "0") return 0;
    if (h === "0") {
      if (r[1] === "b") return l * parseInt(r.slice(2), 2);
      if (r[1] === "x") return l * parseInt(r.slice(2), 16);
      if (r[1] === "o") return l * parseInt(r.slice(2), 8);
    }
    return l * parseInt(r, 10);
  }
  function u(t) {
    return d(t);
  }
  function p(t) {
    return Object.prototype.toString.call(t) === "[object Number]" && t % 1 === 0 && !e.isNegativeZero(t);
  }
  return Ta = new a("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: c,
    construct: u,
    predicate: p,
    represent: {
      binary: function(t) {
        return t >= 0 ? "0b" + t.toString(2) : "-0b" + t.toString(2).slice(1);
      },
      octal: function(t) {
        return t >= 0 ? "0o" + t.toString(8) : "-0o" + t.toString(8).slice(1);
      },
      decimal: function(t) {
        return t.toString(10);
      },
      hexadecimal: function(t) {
        return t >= 0 ? "0x" + t.toString(16).toUpperCase() : "-0x" + t.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), Ta;
}
var Ba, Fr;
function is() {
  if (Fr) return Ba;
  Fr = 1;
  const e = Ie(), a = gt(), s = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  ), i = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function n(t) {
    return t === null || !s.test(t) ? !1 : isFinite(parseFloat(t, 10)) ? !0 : i.test(t);
  }
  function c(t) {
    let r = t.toLowerCase();
    const l = r[0] === "-" ? -1 : 1;
    return "+-".indexOf(r[0]) >= 0 && (r = r.slice(1)), r === ".inf" ? l === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : r === ".nan" ? NaN : l * parseFloat(r, 10);
  }
  const d = /^[-+]?[0-9]+e/;
  function u(t, r) {
    if (isNaN(t))
      switch (r) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === t)
      switch (r) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === t)
      switch (r) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (e.isNegativeZero(t))
      return "-0.0";
    const l = t.toString(10);
    return d.test(l) ? l.replace("e", ".e") : l;
  }
  function p(t) {
    return Object.prototype.toString.call(t) === "[object Number]" && (t % 1 !== 0 || e.isNegativeZero(t));
  }
  return Ba = new a("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: n,
    construct: c,
    predicate: p,
    represent: u,
    defaultStyle: "lowercase"
  }), Ba;
}
var Da, Hr;
function os() {
  return Hr || (Hr = 1, Da = es().extend({
    implicit: [
      as(),
      ns(),
      rs(),
      is()
    ]
  })), Da;
}
var za, qr;
function ss() {
  return qr || (qr = 1, za = os()), za;
}
var Wa, Yr;
function ls() {
  if (Yr) return Wa;
  Yr = 1;
  const e = gt(), a = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), s = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function i(d) {
    return d === null ? !1 : a.exec(d) !== null || s.exec(d) !== null;
  }
  function n(d) {
    let u = 0, p = null, t = a.exec(d);
    if (t === null && (t = s.exec(d)), t === null) throw new Error("Date resolve error");
    const r = +t[1], l = +t[2] - 1, h = +t[3];
    if (!t[4])
      return new Date(Date.UTC(r, l, h));
    const f = +t[4], y = +t[5], g = +t[6];
    if (t[7]) {
      for (u = t[7].slice(0, 3); u.length < 3; )
        u += "0";
      u = +u;
    }
    if (t[9]) {
      const w = +t[10], L = +(t[11] || 0);
      p = (w * 60 + L) * 6e4, t[9] === "-" && (p = -p);
    }
    const v = new Date(Date.UTC(r, l, h, f, y, g, u));
    return p && v.setTime(v.getTime() - p), v;
  }
  function c(d) {
    return d.toISOString();
  }
  return Wa = new e("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: i,
    construct: n,
    instanceOf: Date,
    represent: c
  }), Wa;
}
var Va, Xr;
function cs() {
  if (Xr) return Va;
  Xr = 1;
  const e = gt();
  function a(s) {
    return s === "<<" || s === null;
  }
  return Va = new e("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: a
  }), Va;
}
var Ra, Ur;
function us() {
  if (Ur) return Ra;
  Ur = 1;
  const e = gt(), a = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function s(d) {
    if (d === null) return !1;
    let u = 0;
    const p = d.length, t = a;
    for (let r = 0; r < p; r++) {
      const l = t.indexOf(d.charAt(r));
      if (!(l > 64)) {
        if (l < 0) return !1;
        u += 6;
      }
    }
    return u % 8 === 0;
  }
  function i(d) {
    const u = d.replace(/[\r\n=]/g, ""), p = u.length, t = a;
    let r = 0;
    const l = [];
    for (let f = 0; f < p; f++)
      f % 4 === 0 && f && (l.push(r >> 16 & 255), l.push(r >> 8 & 255), l.push(r & 255)), r = r << 6 | t.indexOf(u.charAt(f));
    const h = p % 4 * 6;
    return h === 0 ? (l.push(r >> 16 & 255), l.push(r >> 8 & 255), l.push(r & 255)) : h === 18 ? (l.push(r >> 10 & 255), l.push(r >> 2 & 255)) : h === 12 && l.push(r >> 4 & 255), new Uint8Array(l);
  }
  function n(d) {
    let u = "", p = 0;
    const t = d.length, r = a;
    for (let h = 0; h < t; h++)
      h % 3 === 0 && h && (u += r[p >> 18 & 63], u += r[p >> 12 & 63], u += r[p >> 6 & 63], u += r[p & 63]), p = (p << 8) + d[h];
    const l = t % 3;
    return l === 0 ? (u += r[p >> 18 & 63], u += r[p >> 12 & 63], u += r[p >> 6 & 63], u += r[p & 63]) : l === 2 ? (u += r[p >> 10 & 63], u += r[p >> 4 & 63], u += r[p << 2 & 63], u += r[64]) : l === 1 && (u += r[p >> 2 & 63], u += r[p << 4 & 63], u += r[64], u += r[64]), u;
  }
  function c(d) {
    return Object.prototype.toString.call(d) === "[object Uint8Array]";
  }
  return Ra = new e("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: s,
    construct: i,
    predicate: c,
    represent: n
  }), Ra;
}
var Pa, Kr;
function ms() {
  if (Kr) return Pa;
  Kr = 1;
  const e = gt(), a = Object.prototype.hasOwnProperty, s = Object.prototype.toString;
  function i(c) {
    if (c === null) return !0;
    const d = {}, u = c;
    for (let p = 0, t = u.length; p < t; p += 1) {
      const r = u[p];
      let l = !1;
      if (s.call(r) !== "[object Object]") return !1;
      let h;
      for (h in r)
        if (a.call(r, h))
          if (!l) l = !0;
          else return !1;
      if (!l || a.call(d, h)) return !1;
      Object.defineProperty(d, h, { value: !0 });
    }
    return !0;
  }
  function n(c) {
    return c !== null ? c : [];
  }
  return Pa = new e("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: i,
    construct: n
  }), Pa;
}
var Fa, Gr;
function ds() {
  if (Gr) return Fa;
  Gr = 1;
  const e = gt(), a = Object.prototype.toString;
  function s(n) {
    if (n === null) return !0;
    const c = n, d = new Array(c.length);
    for (let u = 0, p = c.length; u < p; u += 1) {
      const t = c[u];
      if (a.call(t) !== "[object Object]") return !1;
      const r = Object.keys(t);
      if (r.length !== 1) return !1;
      d[u] = [r[0], t[r[0]]];
    }
    return !0;
  }
  function i(n) {
    if (n === null) return [];
    const c = n, d = new Array(c.length);
    for (let u = 0, p = c.length; u < p; u += 1) {
      const t = c[u], r = Object.keys(t);
      d[u] = [r[0], t[r[0]]];
    }
    return d;
  }
  return Fa = new e("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: s,
    construct: i
  }), Fa;
}
var Ha, Zr;
function hs() {
  if (Zr) return Ha;
  Zr = 1;
  const e = gt(), a = Object.prototype.hasOwnProperty;
  function s(n) {
    if (n === null) return !0;
    const c = n;
    for (const d in c)
      if (a.call(c, d) && c[d] !== null)
        return !1;
    return !0;
  }
  function i(n) {
    return n !== null ? n : {};
  }
  return Ha = new e("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: s,
    construct: i
  }), Ha;
}
var qa, Qr;
function Xn() {
  return Qr || (Qr = 1, qa = ss().extend({
    implicit: [
      ls(),
      cs()
    ],
    explicit: [
      us(),
      ms(),
      ds(),
      hs()
    ]
  })), qa;
}
var Jr;
function $f() {
  if (Jr) return qe;
  Jr = 1;
  const e = Ie(), a = Oe(), s = Nf(), i = Xn(), n = Object.prototype.hasOwnProperty, c = 1, d = 2, u = 3, p = 4, t = 1, r = 2, l = 3, h = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, f = /[\x85\u2028\u2029]/, y = /[,\[\]{}]/, g = /^(?:!|!!|![0-9A-Za-z-]+!)$/, v = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function w(k) {
    return Object.prototype.toString.call(k);
  }
  function L(k) {
    return k === 10 || k === 13;
  }
  function N(k) {
    return k === 9 || k === 32;
  }
  function T(k) {
    return k === 9 || k === 32 || k === 10 || k === 13;
  }
  function Y(k) {
    return k === 44 || k === 91 || k === 93 || k === 123 || k === 125;
  }
  function G(k) {
    if (k >= 48 && k <= 57)
      return k - 48;
    const S = k | 32;
    return S >= 97 && S <= 102 ? S - 97 + 10 : -1;
  }
  function Z(k) {
    return k === 120 ? 2 : k === 117 ? 4 : k === 85 ? 8 : 0;
  }
  function tt(k) {
    return k >= 48 && k <= 57 ? k - 48 : -1;
  }
  function ot(k) {
    switch (k) {
      case 48:
        return "\0";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "	";
      case 9:
        return "	";
      case 110:
        return `
`;
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function nt(k) {
    return k <= 65535 ? String.fromCharCode(k) : String.fromCharCode(
      (k - 65536 >> 10) + 55296,
      (k - 65536 & 1023) + 56320
    );
  }
  function lt(k, S, V) {
    S === "__proto__" ? Object.defineProperty(k, S, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: V
    }) : k[S] = V;
  }
  const ft = new Array(256), xt = new Array(256);
  for (let k = 0; k < 256; k++)
    ft[k] = ot(k) ? 1 : 0, xt[k] = ot(k);
  function st(k, S) {
    this.input = k, this.filename = S.filename || null, this.schema = S.schema || i, this.onWarning = S.onWarning || null, this.legacy = S.legacy || !1, this.json = S.json || !1, this.listener = S.listener || null, this.maxDepth = typeof S.maxDepth == "number" ? S.maxDepth : 100, this.maxTotalMergeKeys = typeof S.maxTotalMergeKeys == "number" ? S.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = k.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
  }
  function wt(k, S) {
    const V = {
      name: k.filename,
      buffer: k.input.slice(0, -1),
      // omit trailing \0
      position: k.position,
      line: k.line,
      column: k.position - k.lineStart
    };
    return V.snippet = s(V), new a(S, V);
  }
  function X(k, S) {
    throw wt(k, S);
  }
  function ct(k, S) {
    k.onWarning && k.onWarning.call(null, wt(k, S));
  }
  function dt(k, S, V) {
    const R = k.anchorMapTransactions;
    if (R.length !== 0) {
      const z = R[R.length - 1];
      n.call(z, S) || (z[S] = {
        existed: n.call(k.anchorMap, S),
        value: k.anchorMap[S]
      });
    }
    k.anchorMap[S] = V;
  }
  function At(k) {
    k.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function kt(k) {
    const S = k.anchorMapTransactions.pop(), V = k.anchorMapTransactions;
    if (V.length === 0) return;
    const R = V[V.length - 1], z = Object.keys(S);
    for (let _ = 0, B = z.length; _ < B; _ += 1) {
      const D = z[_];
      n.call(R, D) || (R[D] = S[D]);
    }
  }
  function de(k) {
    const S = k.anchorMapTransactions.pop(), V = Object.keys(S);
    for (let R = V.length - 1; R >= 0; R -= 1) {
      const z = S[V[R]];
      z.existed ? k.anchorMap[V[R]] = z.value : delete k.anchorMap[V[R]];
    }
  }
  function he(k) {
    return {
      position: k.position,
      line: k.line,
      lineStart: k.lineStart,
      lineIndent: k.lineIndent,
      firstTabInLine: k.firstTabInLine,
      tag: k.tag,
      anchor: k.anchor,
      kind: k.kind,
      result: k.result
    };
  }
  function ee(k, S) {
    k.position = S.position, k.line = S.line, k.lineStart = S.lineStart, k.lineIndent = S.lineIndent, k.firstTabInLine = S.firstTabInLine, k.tag = S.tag, k.anchor = S.anchor, k.kind = S.kind, k.result = S.result;
  }
  const je = {
    YAML: function(S, V, R) {
      S.version !== null && X(S, "duplication of %YAML directive"), R.length !== 1 && X(S, "YAML directive accepts exactly one argument");
      const z = /^([0-9]+)\.([0-9]+)$/.exec(R[0]);
      z === null && X(S, "ill-formed argument of the YAML directive");
      const _ = parseInt(z[1], 10), B = parseInt(z[2], 10);
      _ !== 1 && X(S, "unacceptable YAML version of the document"), S.version = R[0], S.checkLineBreaks = B < 2, B !== 1 && B !== 2 && ct(S, "unsupported YAML version of the document");
    },
    TAG: function(S, V, R) {
      let z;
      R.length !== 2 && X(S, "TAG directive accepts exactly two arguments");
      const _ = R[0];
      z = R[1], g.test(_) || X(S, "ill-formed tag handle (first argument) of the TAG directive"), n.call(S.tagMap, _) && X(S, 'there is a previously declared suffix for "' + _ + '" tag handle'), v.test(z) || X(S, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        z = decodeURIComponent(z);
      } catch {
        X(S, "tag prefix is malformed: " + z);
      }
      S.tagMap[_] = z;
    }
  };
  function Mt(k, S, V, R) {
    if (S < V) {
      const z = k.input.slice(S, V);
      if (R)
        for (let _ = 0, B = z.length; _ < B; _ += 1) {
          const D = z.charCodeAt(_);
          D === 9 || D >= 32 && D <= 1114111 || X(k, "expected valid JSON character");
        }
      else h.test(z) && X(k, "the stream contains non-printable characters");
      k.result += z;
    }
  }
  function Wt(k) {
    k.totalMergeKeys++, k.maxTotalMergeKeys !== -1 && k.totalMergeKeys > k.maxTotalMergeKeys && X(k, "merge keys exceeded maxTotalMergeKeys (" + k.maxTotalMergeKeys + ")");
  }
  function pe(k, S, V, R) {
    e.isObject(V) || X(k, "cannot merge mappings; the provided source object is unacceptable"), Wt(k);
    const z = Object.keys(V);
    for (let _ = 0, B = z.length; _ < B; _ += 1) {
      const D = z[_];
      Wt(k), n.call(S, D) || (lt(S, D, V[D]), R[D] = !0);
    }
  }
  function Tt(k, S, V, R, z, _, B, D, P) {
    if (Array.isArray(z)) {
      z = Array.prototype.slice.call(z);
      for (let F = 0, H = z.length; F < H; F += 1)
        Array.isArray(z[F]) && X(k, "nested arrays are not supported inside keys"), typeof z == "object" && w(z[F]) === "[object Object]" && (z[F] = "[object Object]");
    }
    if (typeof z == "object" && w(z) === "[object Object]" && (z = "[object Object]"), z = String(z), S === null && (S = {}), R === "tag:yaml.org,2002:merge")
      if (Array.isArray(_)) {
        _.length > 100 && X(k, "abnormal merge sequence size");
        for (let F = 0, H = _.length; F < H; F += 1)
          pe(k, S, _[F], V);
      } else
        pe(k, S, _, V);
    else
      !k.json && !n.call(V, z) && n.call(S, z) && (k.line = B || k.line, k.lineStart = D || k.lineStart, k.position = P || k.position, X(k, "duplicated mapping key")), lt(S, z, _), delete V[z];
    return S;
  }
  function fe(k) {
    const S = k.input.charCodeAt(k.position);
    S === 10 ? k.position++ : S === 13 ? (k.position++, k.input.charCodeAt(k.position) === 10 && k.position++) : X(k, "a line break is expected"), k.line += 1, k.lineStart = k.position, k.firstTabInLine = -1;
  }
  function ut(k, S, V) {
    let R = 0, z = k.input.charCodeAt(k.position);
    for (; z !== 0; ) {
      for (; N(z); )
        z === 9 && k.firstTabInLine === -1 && (k.firstTabInLine = k.position), z = k.input.charCodeAt(++k.position);
      if (S && z === 35)
        do
          z = k.input.charCodeAt(++k.position);
        while (z !== 10 && z !== 13 && z !== 0);
      if (L(z))
        for (fe(k), z = k.input.charCodeAt(k.position), R++, k.lineIndent = 0; z === 32; )
          k.lineIndent++, z = k.input.charCodeAt(++k.position);
      else
        break;
    }
    return V !== -1 && R !== 0 && k.lineIndent < V && ct(k, "deficient indentation"), R;
  }
  function Ct(k) {
    let S = k.position, V = k.input.charCodeAt(S);
    return !!((V === 45 || V === 46) && V === k.input.charCodeAt(S + 1) && V === k.input.charCodeAt(S + 2) && (S += 3, V = k.input.charCodeAt(S), V === 0 || T(V)));
  }
  function ae(k, S) {
    S === 1 ? k.result += " " : S > 1 && (k.result += e.repeat(`
`, S - 1));
  }
  function Se(k, S, V) {
    let R, z, _, B, D, P;
    const F = k.kind, H = k.result;
    let W = k.input.charCodeAt(k.position);
    if (T(W) || Y(W) || W === 35 || W === 38 || W === 42 || W === 33 || W === 124 || W === 62 || W === 39 || W === 34 || W === 37 || W === 64 || W === 96)
      return !1;
    if (W === 63 || W === 45) {
      const q = k.input.charCodeAt(k.position + 1);
      if (T(q) || V && Y(q))
        return !1;
    }
    for (k.kind = "scalar", k.result = "", R = z = k.position, _ = !1; W !== 0; ) {
      if (W === 58) {
        const q = k.input.charCodeAt(k.position + 1);
        if (T(q) || V && Y(q))
          break;
      } else if (W === 35) {
        const q = k.input.charCodeAt(k.position - 1);
        if (T(q))
          break;
      } else {
        if (k.position === k.lineStart && Ct(k) || V && Y(W))
          break;
        if (L(W))
          if (B = k.line, D = k.lineStart, P = k.lineIndent, ut(k, !1, -1), k.lineIndent >= S) {
            _ = !0, W = k.input.charCodeAt(k.position);
            continue;
          } else {
            k.position = z, k.line = B, k.lineStart = D, k.lineIndent = P;
            break;
          }
      }
      _ && (Mt(k, R, z, !1), ae(k, k.line - B), R = z = k.position, _ = !1), N(W) || (z = k.position + 1), W = k.input.charCodeAt(++k.position);
    }
    return Mt(k, R, z, !1), k.result ? !0 : (k.kind = F, k.result = H, !1);
  }
  function ye(k, S) {
    let V, R, z = k.input.charCodeAt(k.position);
    if (z !== 39)
      return !1;
    for (k.kind = "scalar", k.result = "", k.position++, V = R = k.position; (z = k.input.charCodeAt(k.position)) !== 0; )
      if (z === 39)
        if (Mt(k, V, k.position, !0), z = k.input.charCodeAt(++k.position), z === 39)
          V = k.position, k.position++, R = k.position;
        else
          return !0;
      else L(z) ? (Mt(k, V, R, !0), ae(k, ut(k, !1, S)), V = R = k.position) : k.position === k.lineStart && Ct(k) ? X(k, "unexpected end of the document within a single quoted scalar") : (k.position++, N(z) || (R = k.position));
    X(k, "unexpected end of the stream within a single quoted scalar");
  }
  function Te(k, S) {
    let V, R, z, _ = k.input.charCodeAt(k.position);
    if (_ !== 34)
      return !1;
    for (k.kind = "scalar", k.result = "", k.position++, V = R = k.position; (_ = k.input.charCodeAt(k.position)) !== 0; ) {
      if (_ === 34)
        return Mt(k, V, k.position, !0), k.position++, !0;
      if (_ === 92) {
        if (Mt(k, V, k.position, !0), _ = k.input.charCodeAt(++k.position), L(_))
          ut(k, !1, S);
        else if (_ < 256 && ft[_])
          k.result += xt[_], k.position++;
        else if ((z = Z(_)) > 0) {
          let B = z, D = 0;
          for (; B > 0; B--)
            _ = k.input.charCodeAt(++k.position), (z = G(_)) >= 0 ? D = (D << 4) + z : X(k, "expected hexadecimal character");
          k.result += nt(D), k.position++;
        } else
          X(k, "unknown escape sequence");
        V = R = k.position;
      } else L(_) ? (Mt(k, V, R, !0), ae(k, ut(k, !1, S)), V = R = k.position) : k.position === k.lineStart && Ct(k) ? X(k, "unexpected end of the document within a double quoted scalar") : (k.position++, N(_) || (R = k.position));
    }
    X(k, "unexpected end of the stream within a double quoted scalar");
  }
  function Be(k, S) {
    let V = !0, R, z, _;
    const B = k.tag;
    let D;
    const P = k.anchor;
    let F, H, W, q;
    const U = /* @__PURE__ */ Object.create(null);
    let Q, J, et, rt = k.input.charCodeAt(k.position);
    if (rt === 91)
      F = 93, q = !1, D = [];
    else if (rt === 123)
      F = 125, q = !0, D = {};
    else
      return !1;
    for (k.anchor !== null && dt(k, k.anchor, D), rt = k.input.charCodeAt(++k.position); rt !== 0; ) {
      if (ut(k, !0, S), rt = k.input.charCodeAt(k.position), rt === F)
        return k.position++, k.tag = B, k.anchor = P, k.kind = q ? "mapping" : "sequence", k.result = D, !0;
      if (V ? rt === 44 && X(k, "expected the node content, but found ','") : X(k, "missed comma between flow collection entries"), J = Q = et = null, H = W = !1, rt === 63) {
        const Pt = k.input.charCodeAt(k.position + 1);
        T(Pt) && (H = W = !0, k.position++, ut(k, !0, S));
      }
      R = k.line, z = k.lineStart, _ = k.position, Rt(k, S, c, !1, !0), J = k.tag, Q = k.result, ut(k, !0, S), rt = k.input.charCodeAt(k.position), (W || k.line === R) && rt === 58 && (H = !0, rt = k.input.charCodeAt(++k.position), ut(k, !0, S), Rt(k, S, c, !1, !0), et = k.result), q ? Tt(k, D, U, J, Q, et, R, z, _) : H ? D.push(Tt(k, null, U, J, Q, et, R, z, _)) : D.push(Q), ut(k, !0, S), rt = k.input.charCodeAt(k.position), rt === 44 ? (V = !0, rt = k.input.charCodeAt(++k.position)) : V = !1;
    }
    X(k, "unexpected end of the stream within a flow collection");
  }
  function Vt(k, S) {
    let V, R = t, z = !1, _ = !1, B = S, D = 0, P = !1, F, H = k.input.charCodeAt(k.position);
    if (H === 124)
      V = !1;
    else if (H === 62)
      V = !0;
    else
      return !1;
    for (k.kind = "scalar", k.result = ""; H !== 0; )
      if (H = k.input.charCodeAt(++k.position), H === 43 || H === 45)
        t === R ? R = H === 43 ? l : r : X(k, "repeat of a chomping mode identifier");
      else if ((F = tt(H)) >= 0)
        F === 0 ? X(k, "bad explicit indentation width of a block scalar; it cannot be less than one") : _ ? X(k, "repeat of an indentation width identifier") : (B = S + F - 1, _ = !0);
      else
        break;
    if (N(H)) {
      do
        H = k.input.charCodeAt(++k.position);
      while (N(H));
      if (H === 35)
        do
          H = k.input.charCodeAt(++k.position);
        while (!L(H) && H !== 0);
    }
    for (; H !== 0; ) {
      for (fe(k), k.lineIndent = 0, H = k.input.charCodeAt(k.position); (!_ || k.lineIndent < B) && H === 32; )
        k.lineIndent++, H = k.input.charCodeAt(++k.position);
      if (!_ && k.lineIndent > B && (B = k.lineIndent), L(H)) {
        D++;
        continue;
      }
      if (!_ && B === 0 && X(k, "missing indentation for block scalar"), k.lineIndent < B) {
        R === l ? k.result += e.repeat(`
`, z ? 1 + D : D) : R === t && z && (k.result += `
`);
        break;
      }
      V ? N(H) ? (P = !0, k.result += e.repeat(`
`, z ? 1 + D : D)) : P ? (P = !1, k.result += e.repeat(`
`, D + 1)) : D === 0 ? z && (k.result += " ") : k.result += e.repeat(`
`, D) : k.result += e.repeat(`
`, z ? 1 + D : D), z = !0, _ = !0, D = 0;
      const W = k.position;
      for (; !L(H) && H !== 0; )
        H = k.input.charCodeAt(++k.position);
      Mt(k, W, k.position, !1);
    }
    return !0;
  }
  function De(k, S) {
    const V = k.tag, R = k.anchor, z = [];
    let _ = !1;
    if (k.firstTabInLine !== -1) return !1;
    k.anchor !== null && dt(k, k.anchor, z);
    let B = k.input.charCodeAt(k.position);
    for (; B !== 0 && (k.firstTabInLine !== -1 && (k.position = k.firstTabInLine, X(k, "tab characters must not be used in indentation")), B === 45); ) {
      const D = k.input.charCodeAt(k.position + 1);
      if (!T(D))
        break;
      if (_ = !0, k.position++, ut(k, !0, -1) && k.lineIndent <= S) {
        z.push(null), B = k.input.charCodeAt(k.position);
        continue;
      }
      const P = k.line;
      if (Rt(k, S, u, !1, !0), z.push(k.result), ut(k, !0, -1), B = k.input.charCodeAt(k.position), (k.line === P || k.lineIndent > S) && B !== 0)
        X(k, "bad indentation of a sequence entry");
      else if (k.lineIndent < S)
        break;
    }
    return _ ? (k.tag = V, k.anchor = R, k.kind = "sequence", k.result = z, !0) : !1;
  }
  function ze(k, S, V) {
    let R, z, _, B;
    const D = k.tag, P = k.anchor, F = {}, H = /* @__PURE__ */ Object.create(null);
    let W = null, q = null, U = null, Q = !1, J = !1;
    if (k.firstTabInLine !== -1) return !1;
    k.anchor !== null && dt(k, k.anchor, F);
    let et = k.input.charCodeAt(k.position);
    for (; et !== 0; ) {
      !Q && k.firstTabInLine !== -1 && (k.position = k.firstTabInLine, X(k, "tab characters must not be used in indentation"));
      const rt = k.input.charCodeAt(k.position + 1), Pt = k.line;
      if ((et === 63 || et === 58) && T(rt))
        et === 63 ? (Q && (Tt(k, F, H, W, q, null, z, _, B), W = q = U = null), J = !0, Q = !0, R = !0) : Q ? (Q = !1, R = !0) : X(k, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), k.position += 1, et = rt;
      else {
        if (z = k.line, _ = k.lineStart, B = k.position, !Rt(k, V, d, !1, !0))
          break;
        if (k.line === Pt) {
          for (et = k.input.charCodeAt(k.position); N(et); )
            et = k.input.charCodeAt(++k.position);
          if (et === 58)
            et = k.input.charCodeAt(++k.position), T(et) || X(k, "a whitespace character is expected after the key-value separator within a block mapping"), Q && (Tt(k, F, H, W, q, null, z, _, B), W = q = U = null), J = !0, Q = !1, R = !1, W = k.tag, q = k.result;
          else if (J)
            X(k, "can not read an implicit mapping pair; a colon is missed");
          else
            return k.tag = D, k.anchor = P, !0;
        } else if (J)
          X(k, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return k.tag = D, k.anchor = P, !0;
      }
      if ((k.line === Pt || k.lineIndent > S) && (Q && (z = k.line, _ = k.lineStart, B = k.position), Rt(k, S, p, !0, R) && (Q ? q = k.result : U = k.result), Q || (Tt(k, F, H, W, q, U, z, _, B), W = q = U = null), ut(k, !0, -1), et = k.input.charCodeAt(k.position)), (k.line === Pt || k.lineIndent > S) && et !== 0)
        X(k, "bad indentation of a mapping entry");
      else if (k.lineIndent < S)
        break;
    }
    return Q && Tt(k, F, H, W, q, null, z, _, B), J && (k.tag = D, k.anchor = P, k.kind = "mapping", k.result = F), J;
  }
  function We(k) {
    let S = !1, V = !1, R, z, _ = k.input.charCodeAt(k.position);
    if (_ !== 33) return !1;
    k.tag !== null && X(k, "duplication of a tag property"), _ = k.input.charCodeAt(++k.position), _ === 60 ? (S = !0, _ = k.input.charCodeAt(++k.position)) : _ === 33 ? (V = !0, R = "!!", _ = k.input.charCodeAt(++k.position)) : R = "!";
    let B = k.position;
    if (S) {
      do
        _ = k.input.charCodeAt(++k.position);
      while (_ !== 0 && _ !== 62);
      k.position < k.length ? (z = k.input.slice(B, k.position), _ = k.input.charCodeAt(++k.position)) : X(k, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; _ !== 0 && !T(_); )
        _ === 33 && (V ? X(k, "tag suffix cannot contain exclamation marks") : (R = k.input.slice(B - 1, k.position + 1), g.test(R) || X(k, "named tag handle cannot contain such characters"), V = !0, B = k.position + 1)), _ = k.input.charCodeAt(++k.position);
      z = k.input.slice(B, k.position), y.test(z) && X(k, "tag suffix cannot contain flow indicator characters");
    }
    z && !v.test(z) && X(k, "tag name cannot contain such characters: " + z);
    try {
      z = decodeURIComponent(z);
    } catch {
      X(k, "tag name is malformed: " + z);
    }
    return S ? k.tag = z : n.call(k.tagMap, R) ? k.tag = k.tagMap[R] + z : R === "!" ? k.tag = "!" + z : R === "!!" ? k.tag = "tag:yaml.org,2002:" + z : X(k, 'undeclared tag handle "' + R + '"'), !0;
  }
  function Ve(k) {
    let S = k.input.charCodeAt(k.position);
    if (S !== 38) return !1;
    k.anchor !== null && X(k, "duplication of an anchor property"), S = k.input.charCodeAt(++k.position);
    const V = k.position;
    for (; S !== 0 && !T(S) && !Y(S); )
      S = k.input.charCodeAt(++k.position);
    return k.position === V && X(k, "name of an anchor node must contain at least one character"), k.anchor = k.input.slice(V, k.position), !0;
  }
  function ma(k) {
    let S = k.input.charCodeAt(k.position);
    if (S !== 42) return !1;
    S = k.input.charCodeAt(++k.position);
    const V = k.position;
    for (; S !== 0 && !T(S) && !Y(S); )
      S = k.input.charCodeAt(++k.position);
    k.position === V && X(k, "name of an alias node must contain at least one character");
    const R = k.input.slice(V, k.position);
    return n.call(k.anchorMap, R) || X(k, 'unidentified alias "' + R + '"'), k.result = k.anchorMap[R], ut(k, !0, -1), !0;
  }
  function Re(k, S, V, R) {
    const z = he(k);
    return At(k), ee(k, S), k.tag = null, k.anchor = null, k.kind = null, k.result = null, ze(k, V, R) && k.kind === "mapping" ? (kt(k), !0) : (de(k), ee(k, z), !1);
  }
  function Rt(k, S, V, R, z) {
    let _, B, D = 1, P = !1, F = !1, H = null, W, q, U;
    k.depth >= k.maxDepth && X(k, "nesting exceeded maxDepth (" + k.maxDepth + ")"), k.depth += 1, k.listener !== null && k.listener("open", k), k.tag = null, k.anchor = null, k.kind = null, k.result = null;
    const Q = _ = B = p === V || u === V;
    if (R && ut(k, !0, -1) && (P = !0, k.lineIndent > S ? D = 1 : k.lineIndent === S ? D = 0 : k.lineIndent < S && (D = -1)), D === 1)
      for (; ; ) {
        const J = k.input.charCodeAt(k.position), et = he(k);
        if (P && (J === 33 && k.tag !== null || J === 38 && k.anchor !== null) || !We(k) && !Ve(k))
          break;
        H === null && (H = et), ut(k, !0, -1) ? (P = !0, B = Q, k.lineIndent > S ? D = 1 : k.lineIndent === S ? D = 0 : k.lineIndent < S && (D = -1)) : B = !1;
      }
    if (B && (B = P || z), D === 1 || p === V)
      if (c === V || d === V ? q = S : q = S + 1, U = k.position - k.lineStart, D === 1)
        if (B && (De(k, U) || ze(k, U, q)) || Be(k, q))
          F = !0;
        else {
          const J = k.input.charCodeAt(k.position);
          H !== null && Q && !B && J !== 124 && J !== 62 && Re(
            k,
            H,
            H.position - H.lineStart,
            q
          ) || _ && Vt(k, q) || ye(k, q) || Te(k, q) ? F = !0 : ma(k) ? (F = !0, (k.tag !== null || k.anchor !== null) && X(k, "alias node should not have any properties")) : Se(k, q, c === V) && (F = !0, k.tag === null && (k.tag = "?")), k.anchor !== null && dt(k, k.anchor, k.result);
        }
      else D === 0 && (F = B && De(k, U));
    if (k.tag === null)
      k.anchor !== null && dt(k, k.anchor, k.result);
    else if (k.tag === "?") {
      k.result !== null && k.kind !== "scalar" && X(k, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + k.kind + '"');
      for (let J = 0, et = k.implicitTypes.length; J < et; J += 1)
        if (W = k.implicitTypes[J], W.resolve(k.result)) {
          k.result = W.construct(k.result), k.tag = W.tag, k.anchor !== null && dt(k, k.anchor, k.result);
          break;
        }
    } else if (k.tag !== "!") {
      if (n.call(k.typeMap[k.kind || "fallback"], k.tag))
        W = k.typeMap[k.kind || "fallback"][k.tag];
      else {
        W = null;
        const J = k.typeMap.multi[k.kind || "fallback"];
        for (let et = 0, rt = J.length; et < rt; et += 1)
          if (k.tag.slice(0, J[et].tag.length) === J[et].tag) {
            W = J[et];
            break;
          }
      }
      W || X(k, "unknown tag !<" + k.tag + ">"), k.result !== null && W.kind !== k.kind && X(k, "unacceptable node kind for !<" + k.tag + '> tag; it should be "' + W.kind + '", not "' + k.kind + '"'), W.resolve(k.result, k.tag) ? (k.result = W.construct(k.result, k.tag), k.anchor !== null && dt(k, k.anchor, k.result)) : X(k, "cannot resolve a node with !<" + k.tag + "> explicit tag");
    }
    return k.listener !== null && k.listener("close", k), k.depth -= 1, k.tag !== null || k.anchor !== null || F;
  }
  function da(k) {
    const S = k.position;
    let V = !1, R;
    for (k.version = null, k.checkLineBreaks = k.legacy, k.tagMap = /* @__PURE__ */ Object.create(null), k.anchorMap = /* @__PURE__ */ Object.create(null); (R = k.input.charCodeAt(k.position)) !== 0 && (ut(k, !0, -1), R = k.input.charCodeAt(k.position), !(k.lineIndent > 0 || R !== 37)); ) {
      V = !0, R = k.input.charCodeAt(++k.position);
      let z = k.position;
      for (; R !== 0 && !T(R); )
        R = k.input.charCodeAt(++k.position);
      const _ = k.input.slice(z, k.position), B = [];
      for (_.length < 1 && X(k, "directive name must not be less than one character in length"); R !== 0; ) {
        for (; N(R); )
          R = k.input.charCodeAt(++k.position);
        if (R === 35) {
          do
            R = k.input.charCodeAt(++k.position);
          while (R !== 0 && !L(R));
          break;
        }
        if (L(R)) break;
        for (z = k.position; R !== 0 && !T(R); )
          R = k.input.charCodeAt(++k.position);
        B.push(k.input.slice(z, k.position));
      }
      R !== 0 && fe(k), n.call(je, _) ? je[_](k, _, B) : ct(k, 'unknown document directive "' + _ + '"');
    }
    if (ut(k, !0, -1), k.lineIndent === 0 && k.input.charCodeAt(k.position) === 45 && k.input.charCodeAt(k.position + 1) === 45 && k.input.charCodeAt(k.position + 2) === 45 ? (k.position += 3, ut(k, !0, -1)) : V && X(k, "directives end mark is expected"), Rt(k, k.lineIndent - 1, p, !1, !0), ut(k, !0, -1), k.checkLineBreaks && f.test(k.input.slice(S, k.position)) && ct(k, "non-ASCII line breaks are interpreted as content"), k.documents.push(k.result), k.position === k.lineStart && Ct(k)) {
      k.input.charCodeAt(k.position) === 46 && (k.position += 3, ut(k, !0, -1));
      return;
    }
    k.position < k.length - 1 && X(k, "end of the stream or a document separator is expected");
  }
  function ve(k, S) {
    k = String(k), S = S || {}, k.length !== 0 && (k.charCodeAt(k.length - 1) !== 10 && k.charCodeAt(k.length - 1) !== 13 && (k += `
`), k.charCodeAt(0) === 65279 && (k = k.slice(1)));
    const V = new st(k, S), R = k.indexOf("\0");
    for (R !== -1 && (V.position = R, X(V, "null byte is not allowed in input")), V.input += "\0"; V.input.charCodeAt(V.position) === 32; )
      V.lineIndent += 1, V.position += 1;
    for (; V.position < V.length - 1; )
      da(V);
    return V.documents;
  }
  function ha(k, S, V) {
    S !== null && typeof S == "object" && typeof V > "u" && (V = S, S = null);
    const R = ve(k, V);
    if (typeof S != "function")
      return R;
    for (let z = 0, _ = R.length; z < _; z += 1)
      S(R[z]);
  }
  function pa(k, S) {
    const V = ve(k, S);
    if (V.length !== 0) {
      if (V.length === 1)
        return V[0];
      throw new a("expected a single document in the stream, but found more");
    }
  }
  return qe.loadAll = ha, qe.load = pa, qe;
}
var Ya = {}, ti;
function Ef() {
  if (ti) return Ya;
  ti = 1;
  const e = Ie(), a = Oe(), s = Xn(), i = Object.prototype.toString, n = Object.prototype.hasOwnProperty, c = 65279, d = 9, u = 10, p = 13, t = 32, r = 33, l = 34, h = 35, f = 37, y = 38, g = 39, v = 42, w = 44, L = 45, N = 58, T = 61, Y = 62, G = 63, Z = 64, tt = 91, ot = 93, nt = 96, lt = 123, ft = 124, xt = 125, st = {};
  st[0] = "\\0", st[7] = "\\a", st[8] = "\\b", st[9] = "\\t", st[10] = "\\n", st[11] = "\\v", st[12] = "\\f", st[13] = "\\r", st[27] = "\\e", st[34] = '\\"', st[92] = "\\\\", st[133] = "\\N", st[160] = "\\_", st[8232] = "\\L", st[8233] = "\\P";
  const wt = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], X = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function ct(_, B) {
    if (B === null) return {};
    const D = {}, P = Object.keys(B);
    for (let F = 0, H = P.length; F < H; F += 1) {
      let W = P[F], q = String(B[W]);
      W.slice(0, 2) === "!!" && (W = "tag:yaml.org,2002:" + W.slice(2));
      const U = _.compiledTypeMap.fallback[W];
      U && n.call(U.styleAliases, q) && (q = U.styleAliases[q]), D[W] = q;
    }
    return D;
  }
  function dt(_) {
    let B, D;
    const P = _.toString(16).toUpperCase();
    if (_ <= 255)
      B = "x", D = 2;
    else if (_ <= 65535)
      B = "u", D = 4;
    else if (_ <= 4294967295)
      B = "U", D = 8;
    else
      throw new a("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + B + e.repeat("0", D - P.length) + P;
  }
  const At = 1, kt = 2;
  function de(_) {
    this.schema = _.schema || s, this.indent = Math.max(1, _.indent || 2), this.noArrayIndent = _.noArrayIndent || !1, this.skipInvalid = _.skipInvalid || !1, this.flowLevel = e.isNothing(_.flowLevel) ? -1 : _.flowLevel, this.styleMap = ct(this.schema, _.styles || null), this.sortKeys = _.sortKeys || !1, this.lineWidth = _.lineWidth || 80, this.noRefs = _.noRefs || !1, this.noCompatMode = _.noCompatMode || !1, this.condenseFlow = _.condenseFlow || !1, this.quotingType = _.quotingType === '"' ? kt : At, this.forceQuotes = _.forceQuotes || !1, this.replacer = typeof _.replacer == "function" ? _.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function he(_, B) {
    const D = e.repeat(" ", B);
    let P = 0, F = "";
    const H = _.length;
    for (; P < H; ) {
      let W;
      const q = _.indexOf(`
`, P);
      q === -1 ? (W = _.slice(P), P = H) : (W = _.slice(P, q + 1), P = q + 1), W.length && W !== `
` && (F += D), F += W;
    }
    return F;
  }
  function ee(_, B) {
    return `
` + e.repeat(" ", _.indent * B);
  }
  function je(_, B) {
    for (let D = 0, P = _.implicitTypes.length; D < P; D += 1)
      if (_.implicitTypes[D].resolve(B))
        return !0;
    return !1;
  }
  function Mt(_) {
    return _ === t || _ === d;
  }
  function Wt(_) {
    return _ >= 32 && _ <= 126 || _ >= 161 && _ <= 55295 && _ !== 8232 && _ !== 8233 || _ >= 57344 && _ <= 65533 && _ !== c || _ >= 65536 && _ <= 1114111;
  }
  function pe(_) {
    return Wt(_) && _ !== c && // - b-char
    _ !== p && _ !== u;
  }
  function Tt(_, B, D) {
    const P = pe(_), F = P && !Mt(_);
    return (
      // ns-plain-safe
      (D ? P : P && // - c-flow-indicator
      _ !== w && _ !== tt && _ !== ot && _ !== lt && _ !== xt) && // ns-plain-char
      _ !== h && // false on '#'
      !(B === N && !F) || // false on ': '
      pe(B) && !Mt(B) && _ === h || // change to true on '[^ ]#'
      B === N && F
    );
  }
  function fe(_) {
    return Wt(_) && _ !== c && !Mt(_) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    _ !== L && _ !== G && _ !== N && _ !== w && _ !== tt && _ !== ot && _ !== lt && _ !== xt && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    _ !== h && _ !== y && _ !== v && _ !== r && _ !== ft && _ !== T && _ !== Y && _ !== g && _ !== l && // | “%” | “@” | “`”)
    _ !== f && _ !== Z && _ !== nt;
  }
  function ut(_) {
    return !Mt(_) && _ !== N;
  }
  function Ct(_, B) {
    const D = _.charCodeAt(B);
    let P;
    return D >= 55296 && D <= 56319 && B + 1 < _.length && (P = _.charCodeAt(B + 1), P >= 56320 && P <= 57343) ? (D - 55296) * 1024 + P - 56320 + 65536 : D;
  }
  function ae(_) {
    return /^\n* /.test(_);
  }
  const Se = 1, ye = 2, Te = 3, Be = 4, Vt = 5;
  function De(_, B, D, P, F, H, W, q) {
    let U, Q = 0, J = null, et = !1, rt = !1;
    const Pt = P !== -1;
    let ge = -1, we = fe(Ct(_, 0)) && ut(Ct(_, _.length - 1));
    if (B || W)
      for (U = 0; U < _.length; Q >= 65536 ? U += 2 : U++) {
        if (Q = Ct(_, U), !Wt(Q))
          return Vt;
        we = we && Tt(Q, J, q), J = Q;
      }
    else {
      for (U = 0; U < _.length; Q >= 65536 ? U += 2 : U++) {
        if (Q = Ct(_, U), Q === u)
          et = !0, Pt && (rt = rt || // Foldable line = too long, and not more-indented.
          U - ge - 1 > P && _[ge + 1] !== " ", ge = U);
        else if (!Wt(Q))
          return Vt;
        we = we && Tt(Q, J, q), J = Q;
      }
      rt = rt || Pt && U - ge - 1 > P && _[ge + 1] !== " ";
    }
    return !et && !rt ? we && !W && !F(_) ? Se : H === kt ? Vt : ye : D > 9 && ae(_) ? Vt : W ? H === kt ? Vt : ye : rt ? Be : Te;
  }
  function ze(_, B, D, P, F) {
    _.dump = (function() {
      if (B.length === 0)
        return _.quotingType === kt ? '""' : "''";
      if (!_.noCompatMode && (wt.indexOf(B) !== -1 || X.test(B)))
        return _.quotingType === kt ? '"' + B + '"' : "'" + B + "'";
      const H = _.indent * Math.max(1, D), W = _.lineWidth === -1 ? -1 : Math.max(Math.min(_.lineWidth, 40), _.lineWidth - H), q = P || // No block styles in flow mode.
      _.flowLevel > -1 && D >= _.flowLevel;
      function U(Q) {
        return je(_, Q);
      }
      switch (De(
        B,
        q,
        _.indent,
        W,
        U,
        _.quotingType,
        _.forceQuotes && !P,
        F
      )) {
        case Se:
          return B;
        case ye:
          return "'" + B.replace(/'/g, "''") + "'";
        case Te:
          return "|" + We(B, _.indent) + Ve(he(B, H));
        case Be:
          return ">" + We(B, _.indent) + Ve(he(ma(B, W), H));
        case Vt:
          return '"' + Rt(B) + '"';
        default:
          throw new a("impossible error: invalid scalar style");
      }
    })();
  }
  function We(_, B) {
    const D = ae(_) ? String(B) : "", P = _[_.length - 1] === `
`, H = P && (_[_.length - 2] === `
` || _ === `
`) ? "+" : P ? "" : "-";
    return D + H + `
`;
  }
  function Ve(_) {
    return _[_.length - 1] === `
` ? _.slice(0, -1) : _;
  }
  function ma(_, B) {
    const D = /(\n+)([^\n]*)/g;
    let P = (function() {
      let q = _.indexOf(`
`);
      return q = q !== -1 ? q : _.length, D.lastIndex = q, Re(_.slice(0, q), B);
    })(), F = _[0] === `
` || _[0] === " ", H, W;
    for (; W = D.exec(_); ) {
      const q = W[1], U = W[2];
      H = U[0] === " ", P += q + (!F && !H && U !== "" ? `
` : "") + Re(U, B), F = H;
    }
    return P;
  }
  function Re(_, B) {
    if (_ === "" || _[0] === " ") return _;
    const D = / [^ ]/g;
    let P, F = 0, H, W = 0, q = 0, U = "";
    for (; P = D.exec(_); )
      q = P.index, q - F > B && (H = W > F ? W : q, U += `
` + _.slice(F, H), F = H + 1), W = q;
    return U += `
`, _.length - F > B && W > F ? U += _.slice(F, W) + `
` + _.slice(W + 1) : U += _.slice(F), U.slice(1);
  }
  function Rt(_) {
    let B = "", D = 0;
    for (let P = 0; P < _.length; D >= 65536 ? P += 2 : P++) {
      D = Ct(_, P);
      const F = st[D];
      !F && Wt(D) ? (B += _[P], D >= 65536 && (B += _[P + 1])) : B += F || dt(D);
    }
    return B;
  }
  function da(_, B, D) {
    let P = "";
    const F = _.tag;
    for (let H = 0, W = D.length; H < W; H += 1) {
      let q = D[H];
      _.replacer && (q = _.replacer.call(D, String(H), q)), (S(_, B, q, !1, !1) || typeof q > "u" && S(_, B, null, !1, !1)) && (P !== "" && (P += "," + (_.condenseFlow ? "" : " ")), P += _.dump);
    }
    _.tag = F, _.dump = "[" + P + "]";
  }
  function ve(_, B, D, P) {
    let F = "";
    const H = _.tag;
    for (let W = 0, q = D.length; W < q; W += 1) {
      let U = D[W];
      _.replacer && (U = _.replacer.call(D, String(W), U)), (S(_, B + 1, U, !0, !0, !1, !0) || typeof U > "u" && S(_, B + 1, null, !0, !0, !1, !0)) && ((!P || F !== "") && (F += ee(_, B)), _.dump && u === _.dump.charCodeAt(0) ? F += "-" : F += "- ", F += _.dump);
    }
    _.tag = H, _.dump = F || "[]";
  }
  function ha(_, B, D) {
    let P = "";
    const F = _.tag, H = Object.keys(D);
    for (let W = 0, q = H.length; W < q; W += 1) {
      let U = "";
      P !== "" && (U += ", "), _.condenseFlow && (U += '"');
      const Q = H[W];
      let J = D[Q];
      _.replacer && (J = _.replacer.call(D, Q, J)), S(_, B, Q, !1, !1) && (_.dump.length > 1024 && (U += "? "), U += _.dump + (_.condenseFlow ? '"' : "") + ":" + (_.condenseFlow ? "" : " "), S(_, B, J, !1, !1) && (U += _.dump, P += U));
    }
    _.tag = F, _.dump = "{" + P + "}";
  }
  function pa(_, B, D, P) {
    let F = "";
    const H = _.tag, W = Object.keys(D);
    if (_.sortKeys === !0)
      W.sort();
    else if (typeof _.sortKeys == "function")
      W.sort(_.sortKeys);
    else if (_.sortKeys)
      throw new a("sortKeys must be a boolean or a function");
    for (let q = 0, U = W.length; q < U; q += 1) {
      let Q = "";
      (!P || F !== "") && (Q += ee(_, B));
      const J = W[q];
      let et = D[J];
      if (_.replacer && (et = _.replacer.call(D, J, et)), !S(_, B + 1, J, !0, !0, !0))
        continue;
      const rt = _.tag !== null && _.tag !== "?" || _.dump && _.dump.length > 1024;
      rt && (_.dump && u === _.dump.charCodeAt(0) ? Q += "?" : Q += "? "), Q += _.dump, rt && (Q += ee(_, B)), S(_, B + 1, et, !0, rt) && (_.dump && u === _.dump.charCodeAt(0) ? Q += ":" : Q += ": ", Q += _.dump, F += Q);
    }
    _.tag = H, _.dump = F || "{}";
  }
  function k(_, B, D) {
    const P = D ? _.explicitTypes : _.implicitTypes;
    for (let F = 0, H = P.length; F < H; F += 1) {
      const W = P[F];
      if ((W.instanceOf || W.predicate) && (!W.instanceOf || typeof B == "object" && B instanceof W.instanceOf) && (!W.predicate || W.predicate(B))) {
        if (D ? W.multi && W.representName ? _.tag = W.representName(B) : _.tag = W.tag : _.tag = "?", W.represent) {
          const q = _.styleMap[W.tag] || W.defaultStyle;
          let U;
          if (i.call(W.represent) === "[object Function]")
            U = W.represent(B, q);
          else if (n.call(W.represent, q))
            U = W.represent[q](B, q);
          else
            throw new a("!<" + W.tag + '> tag resolver accepts not "' + q + '" style');
          _.dump = U;
        }
        return !0;
      }
    }
    return !1;
  }
  function S(_, B, D, P, F, H, W) {
    _.tag = null, _.dump = D, k(_, D, !1) || k(_, D, !0);
    const q = i.call(_.dump), U = P;
    P && (P = _.flowLevel < 0 || _.flowLevel > B);
    const Q = q === "[object Object]" || q === "[object Array]";
    let J, et;
    if (Q && (J = _.duplicates.indexOf(D), et = J !== -1), (_.tag !== null && _.tag !== "?" || et || _.indent !== 2 && B > 0) && (F = !1), et && _.usedDuplicates[J])
      _.dump = "*ref_" + J;
    else {
      if (Q && et && !_.usedDuplicates[J] && (_.usedDuplicates[J] = !0), q === "[object Object]")
        P && Object.keys(_.dump).length !== 0 ? (pa(_, B, _.dump, F), et && (_.dump = "&ref_" + J + _.dump)) : (ha(_, B, _.dump), et && (_.dump = "&ref_" + J + " " + _.dump));
      else if (q === "[object Array]")
        P && _.dump.length !== 0 ? (_.noArrayIndent && !W && B > 0 ? ve(_, B - 1, _.dump, F) : ve(_, B, _.dump, F), et && (_.dump = "&ref_" + J + _.dump)) : (da(_, B, _.dump), et && (_.dump = "&ref_" + J + " " + _.dump));
      else if (q === "[object String]")
        _.tag !== "?" && ze(_, _.dump, B, H, U);
      else {
        if (q === "[object Undefined]")
          return !1;
        if (_.skipInvalid) return !1;
        throw new a("unacceptable kind of an object to dump " + q);
      }
      if (_.tag !== null && _.tag !== "?") {
        let rt = encodeURI(
          _.tag[0] === "!" ? _.tag.slice(1) : _.tag
        ).replace(/!/g, "%21");
        _.tag[0] === "!" ? rt = "!" + rt : rt.slice(0, 18) === "tag:yaml.org,2002:" ? rt = "!!" + rt.slice(18) : rt = "!<" + rt + ">", _.dump = rt + " " + _.dump;
      }
    }
    return !0;
  }
  function V(_, B) {
    const D = [], P = [];
    R(_, D, P);
    const F = P.length;
    for (let H = 0; H < F; H += 1)
      B.duplicates.push(D[P[H]]);
    B.usedDuplicates = new Array(F);
  }
  function R(_, B, D) {
    if (_ !== null && typeof _ == "object") {
      const P = B.indexOf(_);
      if (P !== -1)
        D.indexOf(P) === -1 && D.push(P);
      else if (B.push(_), Array.isArray(_))
        for (let F = 0, H = _.length; F < H; F += 1)
          R(_[F], B, D);
      else {
        const F = Object.keys(_);
        for (let H = 0, W = F.length; H < W; H += 1)
          R(_[F[H]], B, D);
      }
    }
  }
  function z(_, B) {
    B = B || {};
    const D = new de(B);
    D.noRefs || V(_, D);
    let P = _;
    return D.replacer && (P = D.replacer.call({ "": P }, "", P)), S(D, 0, P, !0, !0) ? D.dump + `
` : "";
  }
  return Ya.dump = z, Ya;
}
var ei;
function Cf() {
  if (ei) return yt;
  ei = 1;
  const e = $f(), a = Ef();
  function s(i, n) {
    return function() {
      throw new Error("Function yaml." + i + " is removed in js-yaml 4. Use yaml." + n + " instead, which is now safe by default.");
    };
  }
  return yt.Type = gt(), yt.Schema = Zo(), yt.FAILSAFE_SCHEMA = es(), yt.JSON_SCHEMA = os(), yt.CORE_SCHEMA = ss(), yt.DEFAULT_SCHEMA = Xn(), yt.load = e.load, yt.loadAll = e.loadAll, yt.dump = a.dump, yt.YAMLException = Oe(), yt.types = {
    binary: us(),
    float: is(),
    map: ts(),
    null: as(),
    pairs: ds(),
    set: hs(),
    timestamp: ls(),
    bool: ns(),
    int: rs(),
    merge: cs(),
    omap: ms(),
    seq: Jo(),
    str: Qo()
  }, yt.safeLoad = s("safeLoad", "load"), yt.safeLoadAll = s("safeLoadAll", "loadAll"), yt.safeDump = s("safeDump", "dump"), yt;
}
var If = Cf();
const Of = /* @__PURE__ */ bf(If), {
  Type: Oy,
  Schema: jy,
  FAILSAFE_SCHEMA: Sy,
  JSON_SCHEMA: jf,
  CORE_SCHEMA: Ty,
  DEFAULT_SCHEMA: By,
  load: Sf,
  loadAll: Dy,
  dump: zy,
  YAMLException: Wy,
  types: Vy,
  safeLoad: Ry,
  safeLoadAll: Py,
  safeDump: Fy
} = Of, Tf = /^([^#\s][^:\n]*?):(?:[ \t](.*))?$/, Bf = /^\d{4}-\d{2}-\d{2}$/, Df = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
function ai(e) {
  return e.startsWith(" ") || e.startsWith("	");
}
function ni(e) {
  return e.trimStart().startsWith("#");
}
function zf(e) {
  return e.includes(`\r
`) ? `\r
` : `
`;
}
function Wf(e) {
  return typeof e == "boolean" ? "boolean" : typeof e == "number" ? "number" : Array.isArray(e) ? "list" : typeof e == "string" ? Bf.test(e) ? "date" : Df.test(e) ? "datetime" : "text" : "raw";
}
function ri(e, a) {
  for (let s = a; s < e.length; s++)
    if (e[s] === "#" && (s === 0 || e[s - 1] === " " || e[s - 1] === "	"))
      return e.slice(s);
}
function Vf(e) {
  const a = e.search(/\S/), s = a >= 0 ? e[a] : "";
  if (s !== '"' && s !== "'") return ri(e, 0);
  const i = s;
  let n = a + 1;
  for (; n < e.length; n++) {
    const c = e[n];
    if (c === "\\" && i === '"') {
      n++;
      continue;
    }
    if (c === i) {
      if (i === "'" && e[n + 1] === "'") {
        n++;
        continue;
      }
      n++;
      break;
    }
  }
  return ri(e, n);
}
function Ye(e) {
  const a = zf(e), s = /\r?\n$/.test(e), i = e.length ? e.split(/\r?\n/) : [];
  i.length && i[i.length - 1] === "" && i.pop();
  let n = null, c = !1;
  try {
    const p = e.trim() ? Sf(e, { schema: jf }) : {};
    n = p && typeof p == "object" && !Array.isArray(p) ? p : null, n || (c = e.trim() !== "");
  } catch {
    c = !0;
  }
  const d = [];
  let u = 0;
  for (; u < i.length; ) {
    const p = i[u], t = Tf.exec(p);
    if (!t || ai(p) || ni(p)) {
      u++;
      continue;
    }
    const r = t[1].trim();
    let l = u + 1;
    for (; l < i.length && i[l].trim() !== "" && ai(i[l]); ) l++;
    const h = i.slice(u, l), f = h.join(a), y = n ? n[r] : void 0, g = c ? "raw" : Wf(y), w = h.some((N) => ni(N)) || g === "raw" || h.length > 1 && g !== "list", L = Vf(t[2] ?? "");
    d.push({
      key: r,
      lines: [u, l],
      raw: f,
      type: w ? "raw" : g,
      value: y,
      complex: w,
      trailingComment: L
    }), u = l;
  }
  return { entries: d, lines: i, eol: a, ok: !c, trailingNewline: s };
}
let kn = null;
function ii(e) {
  kn = e;
}
const Rf = "app.textox.mkdext";
function Gt(e, a) {
  if (!kn) return a;
  const s = kn(e);
  return !s || s === `${Rf}.${e}` ? a : s;
}
const ps = [
  "title",
  "description",
  "summary",
  "tags",
  "categories",
  "status",
  "type",
  "priority",
  "date",
  "created",
  "updated",
  "author",
  "owner",
  "audience",
  "language",
  "version",
  "related",
  "keywords",
  "project",
  "aliases",
  "slug",
  "draft"
], fs = {
  name: "title",
  header: "title",
  tag: "tags",
  label: "tags",
  labels: "tags",
  desc: "description",
  abstract: "summary",
  category: "categories",
  state: "status",
  kind: "type",
  level: "priority",
  published: "date",
  publish: "date",
  time: "date",
  modified: "updated",
  update: "updated",
  lastmod: "updated",
  authors: "author",
  creator: "author",
  lang: "language",
  locale: "language",
  keyword: "keywords",
  topic: "keywords",
  topics: "keywords",
  alias: "aliases",
  permalink: "slug",
  url: "slug",
  isdraft: "draft"
}, Pf = {
  title: "text",
  description: "text",
  summary: "text",
  status: "text",
  type: "text",
  priority: "text",
  author: "text",
  owner: "text",
  audience: "text",
  language: "text",
  version: "text",
  related: "text",
  project: "text",
  slug: "text",
  tags: "list",
  categories: "list",
  keywords: "list",
  aliases: "list",
  date: "date",
  created: "datetime",
  updated: "datetime",
  draft: "boolean"
}, Ff = /* @__PURE__ */ new Set([
  ...ps,
  ...Object.keys(fs)
]);
function ys(e) {
  const a = e.trim().toLowerCase();
  return fs[a] ?? a;
}
function Hf(e) {
  return Ff.has(e.trim().toLowerCase());
}
function qf(e) {
  return Pf[ys(e)] ?? null;
}
function oi(e, a) {
  if (qf(e) !== "list") return a.type;
  if (a.type === "list" || !a.complex && a.type === "text") return "list";
  const s = a.value == null || a.value === "", i = !a.raw.includes(`
`) && a.trailingComment === void 0;
  return s && i && (a.type === "text" || a.type === "raw") ? "list" : a.type;
}
function Yf(e, a) {
  return e !== "list" || Array.isArray(a) ? a : a == null || a === "" ? [] : [String(a)];
}
const si = "http://www.w3.org/2000/svg", at = (e) => ({ tag: "path", attrs: { d: e } }), Ht = (e, a, s) => ({
  tag: "circle",
  attrs: { cx: String(e), cy: String(a), r: String(s) }
}), li = (e, a, s, i, n) => ({
  tag: "rect",
  attrs: { x: String(e), y: String(a), width: String(s), height: String(i), rx: String(n) }
}), Xf = {
  title: [at("M4 7V4h16v3"), at("M9 20h6"), at("M12 4v16")],
  description: [at("M3 6h18"), at("M3 12h18"), at("M3 18h12")],
  summary: [at("M3 6h18"), at("M3 12h18"), at("M3 18h8")],
  tags: [
    at("M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"),
    Ht(7, 7, 1.2)
  ],
  categories: [
    at("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")
  ],
  status: [Ht(12, 12, 9), at("M8 12.5l2.5 2.5L16 9")],
  type: [at("M12 2 2 7l10 5 10-5z"), at("M2 17l10 5 10-5"), at("M2 12l10 5 10-5")],
  priority: [at("M5 21V4"), at("M5 5h13l-2 3.5L18 12H5")],
  date: [li(3, 5, 18, 16, 2), at("M3 10h18M8 3v4M16 3v4")],
  created: [Ht(12, 12, 9), at("M12 7v5l3 2")],
  updated: [at("M21 12a9 9 0 1 1-2.6-6.4"), at("M21 4v6h-6")],
  author: [Ht(12, 8, 3.5), at("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5")],
  owner: [Ht(12, 8, 3.5), at("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"), at("M18 5l1 1.6 1.8.4-1.4 1.4.3 1.8-1.7-.9-1.7.9.3-1.8L15 7l1.8-.4z")],
  audience: [Ht(9, 8, 3), at("M2 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"), Ht(17.5, 9, 2.2)],
  language: [
    Ht(12, 12, 9),
    at("M3 12h18"),
    at("M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9z")
  ],
  version: [at("M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z")],
  related: [
    at("M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"),
    at("M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1")
  ],
  keywords: [at("M4 9h16M4 15h16M10 3 8 21M16 3l-2 18")],
  project: [li(3, 4, 8, 16, 1.5), at("M15 4h6v9h-6z")],
  aliases: [at("M7 7h11l-3-3"), at("M17 17H6l3 3")],
  slug: [at("M9 4 7 20M17 4l-2 16M4 9h16M3 15h16")],
  draft: [at("M4 20l4-1L19 8l-3-3L5 16z"), at("M14 6l3 3")]
}, Uf = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true"
};
function vs(e, a) {
  const s = document.createElementNS(si, "svg");
  s.setAttribute("class", e);
  for (const [i, n] of Object.entries(Uf)) s.setAttribute(i, n);
  for (const i of a) {
    const n = document.createElementNS(si, i.tag);
    for (const [c, d] of Object.entries(i.attrs)) n.setAttribute(c, d);
    s.appendChild(n);
  }
  return s;
}
function Kf(e) {
  return (Array.from(e.trim())[0] ?? "").toUpperCase();
}
function Gf(e) {
  const a = document.createElement("span");
  return a.className = "fm-ico fm-ico-letter", a.textContent = Kf(e), a.setAttribute("aria-hidden", "true"), a;
}
function Xa(e) {
  const a = Xf[ys(e)];
  return a ? vs("fm-ico", a) : Gf(e);
}
const Zf = {
  panel: [at("M16 18l6-6-6-6"), at("M8 6l-6 6 6 6")],
  source: [at("M3 5h18M3 12h18M3 19h18")]
};
function Qf(e) {
  return vs("fm-toggle-icon", Zf[e]);
}
const ci = 8;
function Jf(e, a, s = ps) {
  const i = [], n = /* @__PURE__ */ new Set([a]), c = (d) => {
    d !== "" && !n.has(d) && (n.add(d), i.push(d));
  };
  for (const d of e) c(d.key);
  for (const d of s) c(d);
  return i;
}
function t2(e, a) {
  const s = a.trim().toLowerCase();
  if (s === "") return [...e].slice(0, ci);
  const i = [], n = [];
  for (const c of e) {
    const d = c.toLowerCase();
    d.startsWith(s) ? i.push(c) : d.includes(s) && n.push(c);
  }
  return [...i, ...n].slice(0, ci);
}
function ui(e, a) {
  let s = [], i = 0, n = !1, c = !1;
  const d = document.createElement("div");
  d.className = "fm-suggest", d.setAttribute("role", "listbox"), d.hidden = !0;
  const u = () => {
    n = !1, s = [], i = 0, d.hidden = !0, d.textContent = "", e.setAttribute("aria-expanded", "false");
  }, p = () => {
    const f = a.container.getBoundingClientRect(), y = e.getBoundingClientRect();
    d.style.left = `${y.left - f.left}px`, d.style.top = `${y.bottom - f.top + 2}px`, d.style.width = `${y.width}px`;
  }, t = () => {
    if (s.length === 0) {
      u();
      return;
    }
    const f = e.value.trim().toLowerCase();
    d.textContent = "", s.forEach((y, g) => {
      const v = document.createElement("div");
      v.className = g === i ? "fm-suggest-item is-active" : "fm-suggest-item", v.setAttribute("role", "option"), v.setAttribute("aria-selected", g === i ? "true" : "false");
      const w = f === "" ? -1 : y.toLowerCase().indexOf(f);
      if (w >= 0) {
        const L = document.createElement("mark");
        L.textContent = y.slice(w, w + f.length), v.append(
          document.createTextNode(y.slice(0, w)),
          L,
          document.createTextNode(y.slice(w + f.length))
        );
      } else
        v.textContent = y;
      v.addEventListener("mousedown", (L) => {
        L.preventDefault(), e.value = y, u(), a.onSubmit?.();
      }), d.appendChild(v);
    }), d.hidden = !1, n = !0, e.setAttribute("aria-expanded", "true"), p();
  }, r = () => {
    s = t2(a.candidates(), e.value), i = 0, c = !1, t();
  }, l = () => r(), h = (f) => {
    if (!(f.isComposing || f.keyCode === 229)) {
      if (f.key === "ArrowDown" || f.key === "ArrowUp") {
        if (!n || s.length === 0) return;
        if (f.preventDefault(), e.value.trim() === "" && !c) {
          c = !0, t();
          return;
        }
        c = !0;
        const y = f.key === "ArrowDown" ? 1 : s.length - 1;
        i = (i + y) % s.length, t();
        return;
      }
      if (f.key === "Enter") {
        f.preventDefault();
        const y = e.value.trim() !== "" || c;
        n && s.length > 0 && y && (e.value = s[i]), u(), a.onSubmit?.();
        return;
      }
      if (f.key === "Tab") {
        n && s.length > 0 && (f.preventDefault(), e.value = s[i]), u();
        return;
      }
      if (f.key === "Escape") {
        if (n) {
          f.preventDefault(), u();
          return;
        }
        a.onCancel?.();
      }
    }
  };
  return e.setAttribute("aria-autocomplete", "list"), e.setAttribute("aria-expanded", "false"), a.container.appendChild(d), e.addEventListener("input", l), e.addEventListener("keydown", h), {
    open: r,
    close: u,
    destroy() {
      e.removeEventListener("input", l), e.removeEventListener("keydown", h), e.removeAttribute("aria-autocomplete"), e.removeAttribute("aria-expanded"), d.remove(), n = !1, s = [], c = !1;
    }
  };
}
function Un(e, a) {
  if (a === "number") {
    if (e == null || e === "") return "";
    const s = Number(e);
    return Number.isFinite(s) ? String(s) : "";
  }
  return a === "boolean" ? e ? "true" : "false" : a === "date" || a === "datetime" ? String(e) : a2(String(e ?? ""));
}
function e2(e) {
  return !!(e === "" || e.trim() !== e || /[\x00-\x1f\x7f]/.test(e) || /[:#\[\]{}&*!|>'"%@`,]/.test(e) || /^[-?](\s|$)/.test(e) || /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(e) || /^(true|false|null|~|yes|no|on|off)$/i.test(e));
}
function a2(e) {
  return e2(e) ? `"${e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (s) => `\\x${s.charCodeAt(0).toString(16).padStart(2, "0")}`)}"` : e;
}
function gs(e) {
  return `[${e.map((a) => Un(a, "text")).join(", ")}]`;
}
function n2(e, a) {
  return e.map((s) => `${a}- ${Un(s, "text")}`);
}
function r2(e, a) {
  return e.entries.find((s) => s.key === a);
}
function i2(e, a) {
  const { lines: s, eol: i } = e, n = s.slice(), c = (h, f, y) => {
    n.splice(h, f, ...y);
  }, d = (h) => {
    const f = h.join(i);
    return f === "" ? "" : f + (e.trailingNewline ? i : "");
  };
  if (a.kind === "add") {
    const h = mi(a.value, a.type), f = `${a.key}:${h ? ` ${h}` : ""}`;
    return n.push(f), d(n);
  }
  const u = r2(e, a.key);
  if (!u) return null;
  const [p, t] = u.lines;
  if (a.kind === "rename") {
    const h = n[p], f = h.slice(h.indexOf(":"));
    return n[p] = `${a.nextKey}${f}`, d(n);
  }
  if (a.kind === "remove")
    return c(p, t - p, []), d(n);
  if (u.complex) return null;
  if (a.type === "list") {
    const h = Array.isArray(a.value) ? a.value : [];
    if (u.raw.split(i)[0].includes("["))
      n[p] = `${a.key}: ${gs(h)}${u.trailingComment ? ` ${u.trailingComment}` : ""}`, t - p > 1 && c(p + 1, t - p - 1, []);
    else {
      const y = [`${a.key}:`, ...n2(h, "  ")];
      u.trailingComment && (y[0] = `${a.key}: ${u.trailingComment}`), c(p, t - p, y);
    }
    return d(n);
  }
  if (t - p > 1) return null;
  const r = u.trailingComment ? ` ${u.trailingComment}` : "", l = mi(a.value, a.type);
  return n[p] = `${a.key}:${l ? ` ${l}` : ""}${r}`, d(n);
}
function mi(e, a) {
  return a === "list" ? gs(Array.isArray(e) ? e : []) : Un(e, a);
}
let Ne = null;
function o2(e) {
  Ne = e;
}
function s2(e) {
  Ne === e && (Ne = null);
}
function l2(e, a, s) {
  return new m2(e, a, s);
}
const c2 = /^[^\s#:][^#:]*$/;
function di(e) {
  return e === e.trim() && e !== "" && c2.test(e);
}
function u2(e) {
  for (const a of [e, ...Array.from(e.querySelectorAll("*"))])
    a instanceof HTMLTextAreaElement ? a.readOnly = !0 : a instanceof HTMLInputElement ? a.type === "checkbox" ? a.disabled = !0 : a.readOnly = !0 : a instanceof HTMLButtonElement && (a.disabled = !0);
}
class m2 {
  constructor(a, s, i) {
    this.view = s, this.getPos = i, this.node = a, this.dom = document.createElement("yaml-block"), this.deleteBtn = document.createElement("button"), this.deleteBtn.type = "button", this.deleteBtn.className = "fm-delete-block", this.deleteIconRoot = Ns(this.deleteBtn), this.deleteIconRoot.render(Li(Go, { size: 14, color: "currentColor" }));
    const n = Gt("frontMatter.removeBlock", "Remove document properties");
    this.deleteBtn.title = n, this.deleteBtn.setAttribute("aria-label", n), this.deleteBtn.addEventListener("mousedown", (c) => c.preventDefault()), this.deleteBtn.addEventListener("click", () => this.removeBlock()), this.addBtn = document.createElement("button"), this.addBtn.type = "button", this.addBtn.className = "fm-add-btn", this.addBtn.textContent = `+ ${Gt("frontMatter.addProperty", "Add property")}`, this.addBtn.addEventListener("mousedown", (c) => c.preventDefault()), this.addBtn.addEventListener("click", () => this.addPendingRow()), this.toggle = document.createElement("button"), this.toggle.type = "button", this.toggle.className = "fm-toggle", this.toggle.addEventListener("mousedown", (c) => c.preventDefault()), this.toggle.addEventListener("click", () => {
      bl(this.mode === "panel" ? "source" : "panel");
    }), this.actions = document.createElement("div"), this.actions.className = "fm-actions", this.actions.setAttribute("contenteditable", "false"), this.actions.append(this.deleteBtn, this.addBtn, this.toggle), this.dom.appendChild(this.actions), this.panel = document.createElement("div"), this.panel.className = "fm-panel", this.panel.setAttribute("contenteditable", "false"), this.dom.appendChild(this.panel), this.source = document.createElement("div"), this.source.className = "fm-source", this.contentDOM = document.createElement("div"), this.contentDOM.className = "fm-source-body", this.source.appendChild(this.contentDOM), this.dom.appendChild(this.source), this.locked = this.readLocked(), typeof MutationObserver == "function" && (this.lockObserver = new MutationObserver(() => {
      const c = this.readLocked();
      c !== this.locked && (this.locked = c, this.render());
    }), this.lockObserver.observe(this.view.dom, {
      attributes: !0,
      attributeFilter: ["contenteditable"]
    })), this.mode = Ei(), this.unsubscribe = Al((c) => {
      this.mode = c, this.render();
    }), this.render(), this.openPendingRowIfRequested();
  }
  dom;
  contentDOM;
  actions;
  deleteBtn;
  deleteIconRoot;
  addBtn;
  toggle;
  panel;
  source;
  node;
  mode;
  unsubscribe;
  /** 列表值提交后待恢复焦点的行 key（整块重建会丢焦点，用于连续输入）。 */
  pendingListFocus = null;
  /** 静默写回进行中：期间不重建面板（避免打断单值控件的输入）。 */
  silentUpdate = !1;
  /** 编辑器是否处于锁定（不可编辑）状态。 */
  locked = !1;
  /** 监听编辑器锁定态变化（PM 的 editable prop 反映在 `.ProseMirror` 的 contenteditable 上）。 */
  lockObserver = null;
  update(a) {
    if (a.type !== this.node.type) return !1;
    const s = a.textContent !== this.node.textContent;
    return this.node = a, s && !this.silentUpdate ? this.render() : this.refreshSourceAttr(), !0;
  }
  stopEvent(a) {
    const s = a.target;
    return this.panel.contains(s) || this.actions.contains(s);
  }
  ignoreMutation(a) {
    return a.type === "attributes" && (a.target === this.dom || a.target === this.contentDOM) ? !0 : !this.contentDOM.contains(a.target);
  }
  selectNode() {
    this.dom.classList.add("fm-selected");
  }
  deselectNode() {
    this.dom.classList.remove("fm-selected");
  }
  destroy() {
    this.deleteIconRoot.unmount(), this.lockObserver?.disconnect(), this.lockObserver = null, this.unsubscribe();
  }
  /** 编辑器是否锁定：PM 在 editable=false 时把编辑器根的 contenteditable 置为 "false"。 */
  readLocked() {
    return this.view.dom.getAttribute("contenteditable") === "false";
  }
  // ── 内部 ─────────────────────────────────────────────
  refreshSourceAttr() {
    this.dom.setAttribute("data-source", this.node.textContent), this.dom.setAttribute("data-mode", this.mode);
  }
  render() {
    this.refreshSourceAttr();
    const a = this.mode === "panel";
    this.dom.setAttribute("data-locked", this.locked ? "true" : "false"), this.addBtn.disabled = this.locked, this.toggle.disabled = this.locked, this.deleteBtn.disabled = this.locked, this.addBtn.style.display = a ? "" : "none", this.toggle.textContent = "", this.toggle.appendChild(Qf(a ? "panel" : "source")), this.toggle.setAttribute(
      "title",
      a ? Gt("frontMatter.toggleToSource", "View source") : Gt("frontMatter.toggleToPanel", "View properties")
    ), this.panel.style.display = a ? "" : "none", this.source.style.display = a ? "none" : "", a && this.renderPanel();
  }
  /** 删除整个 front matter 节点；跳过原子叶落笔，文档删空时补一个空段落。 */
  removeBlock() {
    if (this.readLocked()) return;
    const a = this.getPos();
    if (a == null) return;
    const s = this.node.type.schema.nodes.paragraph, i = this.view.state.tr.delete(a, a + this.node.nodeSize), n = Gn.findFrom(i.doc.resolve(a), 1, !0);
    if (n)
      i.setSelection(n);
    else {
      const c = i.doc.content.size;
      i.insert(c, s.create()), i.setSelection(pt.create(i.doc, c + 1));
    }
    i.scrollIntoView(), this.view.dispatch(i), this.view.focus();
  }
  /** 面板最后一个可编辑输入行（单值输入 / tag）按 Enter：提交后把光标送到属性块下方的正文。 */
  exitBlock() {
    if (this.readLocked()) return;
    const a = this.getPos();
    if (a == null) return;
    const s = a + this.node.nodeSize, i = this.view.state.tr, n = Gn.findFrom(i.doc.resolve(s), 1, !0);
    if (n)
      i.setSelection(n);
    else {
      const c = i.doc.content.size;
      i.insert(c, this.node.type.schema.nodes.paragraph.create()), i.setSelection(pt.create(i.doc, c + 1));
    }
    i.scrollIntoView(), this.view.dispatch(i), this.view.focus();
  }
  /** 消费一次性标记：新建的空块在 DOM 挂载后展开待输入行（联想浮层按真实布局定位）。 */
  openPendingRowIfRequested() {
    if (Ne !== this.view || (Ne = null, this.mode !== "panel" || this.readLocked() || this.node.textContent !== "")) return;
    const a = () => {
      !this.dom.isConnected || this.mode !== "panel" || this.readLocked() || this.addPendingRow();
    };
    typeof queueMicrotask == "function" ? queueMicrotask(a) : setTimeout(a, 0);
  }
  renderPanel() {
    const a = Ye(this.node.textContent);
    if (this.panel.textContent = "", !a.ok) {
      const c = document.createElement("div");
      c.className = "fm-panel-warn", c.textContent = Gt("frontMatter.invalidYaml", "Invalid YAML — switch to source to edit"), this.panel.appendChild(c);
      return;
    }
    const s = document.createElement("div");
    s.className = "fm-list";
    const i = a.entries;
    let n = -1;
    if (i.forEach((c, d) => {
      const u = oi(c.key, c);
      u !== "raw" && u !== "boolean" && (n = d);
    }), i.forEach((c, d) => {
      s.appendChild(this.buildRow(c, d === n));
    }), this.panel.appendChild(s), this.pendingListFocus !== null) {
      const c = this.pendingListFocus;
      this.pendingListFocus = null;
      for (const d of Array.from(this.panel.querySelectorAll(".fm-row")))
        if (d.querySelector(".fm-key-label")?.textContent === c) {
          d.querySelector(".fm-chips .fm-add-input")?.focus();
          break;
        }
    }
  }
  /**
   * 属性名联想候选：内置常用名 ∪ 本文已用属性名（去重）。
   * - 改名（`excludeKey` 非空）：排除正在编辑自身的 key，本文已用名优先靠前。
   * - 新增（`excludeKey` 为空）：排除文档里已存在的 key，避免建议出重复属性。
   */
  suggestKeys(a) {
    const s = Ye(this.node.textContent), i = s.ok ? s.entries : [], n = Jf(i, a);
    if (a !== "") return n;
    const c = new Set(i.map((d) => d.key));
    return n.filter((d) => !c.has(d));
  }
  /**
   * 「添加属性」：直接新增一行（无需先填属性名）。行内 key 列为编辑态输入框、光标就位，
   * Enter/失焦提交（合法键名写回）；空值/非法/Escape 撤销该行。提交成功后整块重建。
   */
  addPendingRow() {
    if (this.readLocked() || this.mode !== "panel") return;
    const a = this.panel.querySelector(".fm-list");
    if (!a || a.querySelector(".fm-add-row")) return;
    const s = document.createElement("div");
    s.className = "fm-row fm-add-row", s.appendChild(Xa(""));
    const i = document.createElement("div");
    i.className = "fm-key";
    const n = document.createElement("input");
    n.className = "fm-key-edit", n.placeholder = Gt("frontMatter.addPropertyKeyPrompt", "Property name"), n.addEventListener("input", () => {
      s.firstChild && s.replaceChild(Xa(n.value), s.firstChild);
    });
    let c = null;
    const d = (t = !1) => {
      c?.destroy(), c = null;
      const r = s.contains(document.activeElement);
      s.remove(), t && r && this.view.focus();
    }, u = () => {
      if (!s.isConnected) return;
      const t = n === document.activeElement;
      c?.destroy(), c = null;
      const r = n.value;
      if (r && di(r) && this.commitEdit({ kind: "add", key: r, value: "", type: "text" })) {
        t && queueMicrotask(() => this.focusValueOf(r));
        return;
      }
      d(t);
    };
    c = ui(n, {
      container: this.panel,
      candidates: () => this.suggestKeys(""),
      onSubmit: u,
      onCancel: () => d(!0)
    }), n.addEventListener("blur", u), i.appendChild(n), s.appendChild(i);
    const p = document.createElement("div");
    p.className = "fm-val", s.appendChild(p), a.appendChild(s), n.focus(), c?.open();
  }
  /** 提交新增行后把焦点交给该 key 的值控件（防御：写回后若出现同名行，取最后一行）。 */
  focusValueOf(a) {
    const s = Array.from(this.panel.querySelectorAll(".fm-row"));
    for (let i = s.length - 1; i >= 0; i--) {
      const n = s[i];
      if (n.querySelector(".fm-key-label")?.textContent !== a) continue;
      const c = n.querySelector(
        ".fm-val .fm-input, .fm-chips .fm-add-input, .fm-checkbox"
      );
      c ? c.focus() : this.view.focus();
      return;
    }
  }
  /** 单行：类型图标 + 键名单元（默认文本，点击编辑）+ 值控件 + 删除按钮。 */
  buildRow(a, s) {
    const i = document.createElement("div");
    i.className = "fm-row";
    const n = this.locked, c = Xa(a.key), d = n || Hf(a.key), u = document.createElement("div");
    u.className = d ? "fm-key fm-key-locked" : "fm-key", d || (u.tabIndex = 0);
    let p = null;
    const t = () => {
      p?.destroy(), p = null, u.textContent = "";
      const v = document.createElement("span");
      v.className = "fm-key-label", v.textContent = a.key, u.appendChild(v);
    }, r = () => {
      p?.destroy(), p = null;
      const v = u.querySelector(".fm-key-edit");
      if (!v) return;
      const w = v.value;
      if (!di(w) || w === a.key) {
        t();
        return;
      }
      this.commitEdit({ kind: "rename", key: a.key, nextKey: w }) || t();
    }, l = () => {
      if (u.querySelector(".fm-key-edit")) return;
      const v = document.createElement("input");
      v.className = "fm-key-edit", v.value = a.key, p = ui(v, {
        container: this.panel,
        candidates: () => this.suggestKeys(a.key),
        onSubmit: r,
        onCancel: t
      }), v.addEventListener("change", r), v.addEventListener("blur", () => {
        u.contains(v) && v.value === a.key && t();
      }), u.textContent = "", u.appendChild(v), v.focus(), v.select();
    };
    t(), d || (u.addEventListener("mousedown", (v) => {
      v.target.classList.contains("fm-key-edit") || v.preventDefault();
    }), u.addEventListener("click", l), u.addEventListener("focus", l));
    const h = oi(a.key, a), f = {
      ...a,
      type: h,
      // 已解析为可编辑类型时清掉 complex（空值曾被推断为 raw）；raw 保持只读降级。
      complex: h === "raw",
      value: Yf(h, a.value)
    }, y = document.createElement("div");
    y.className = "fm-val";
    const g = Af(f, {
      commit: (v) => {
        const w = { kind: "setValue", key: a.key, value: v, type: h };
        if (h === "list") {
          this.pendingListFocus = a.key, this.commitEdit(w);
          return;
        }
        this.commitValueSilent(w);
      },
      // 最后一个可编辑输入行：单值输入 Enter 提交后跳出；列表 tag 空输入 Enter 跳出。
      onEnter: s && h !== "list" ? () => this.exitBlock() : void 0,
      onEmptyEnter: s && h === "list" ? () => this.exitBlock() : void 0
    });
    if (n && u2(g), y.appendChild(g), i.append(c, u, y), !n) {
      const v = document.createElement("button");
      v.type = "button", v.className = "fm-remove", v.textContent = "×", v.title = Gt("frontMatter.removeProperty", "Remove property"), v.addEventListener("mousedown", (w) => w.preventDefault()), v.addEventListener("click", () => void this.commitEdit({ kind: "remove", key: a.key })), i.appendChild(v);
    }
    return i;
  }
  /** 值控件的静默写回：落事务但不重建面板（避免打断输入 / 中文 IME）。 */
  commitValueSilent(a) {
    this.silentUpdate = !0;
    try {
      return this.commitEdit(a);
    } finally {
      this.silentUpdate = !1;
    }
  }
  /** 把一次编辑写回节点文本；写回被拒（无效/会破坏 YAML）返回 false。 */
  commitEdit(a) {
    const s = this.getPos();
    if (s == null) return !1;
    const i = Ye(this.node.textContent), n = i2(i, a);
    if (n == null || !Ye(n).ok) return !1;
    const c = s + 1, d = s + this.node.nodeSize - 1, u = this.view.state.tr.replaceWith(c, d, n ? this.node.type.schema.text(n) : []);
    return this.view.dispatch(u), !0;
  }
}
const d2 = (e, a, s, i) => {
  if (a !== 0 || e.tShift[a] !== 0) return !1;
  const n = e.bMarks[a];
  if (e.eMarks[a] - n !== 3 || e.src.slice(n, n + 3) !== "---") return !1;
  let d = -1;
  for (let t = a + 1; t <= s; t++) {
    const r = e.bMarks[t], l = e.eMarks[t];
    if (e.tShift[t] === 0 && l - r === 3 && e.src.slice(r, l) === "---") {
      d = t;
      break;
    }
  }
  if (d === -1) return !1;
  if (i) return !0;
  const u = e.src.slice(e.bMarks[a + 1], e.bMarks[d]).replace(/\n$/, ""), p = e.push("front_matter", "div", 0);
  return p.content = u, p.markup = "---", p.block = !0, p.map = [a, d + 1], e.line = d + 1, !0;
}, h2 = {
  name: "front-matter",
  nodes: {
    front_matter: {
      group: "block",
      content: "text*",
      code: !0,
      marks: "",
      defining: !0,
      parseDOM: [
        {
          tag: "yaml-block",
          preserveWhitespace: "full"
        }
      ],
      toDOM: () => ["yaml-block", 0]
    }
  },
  mdItPlugins: [
    (e) => {
      e.block.ruler.before("hr", "front_matter", d2, {
        alt: ["paragraph", "reference", "blockquote", "list"]
      });
    }
  ],
  parserTokens: {
    front_matter: (e, a, s) => {
      const i = a.content, n = i ? [s.text(i)] : [];
      e.push(s.nodes.front_matter.createChecked({}, n));
    }
  },
  blockHandlers: {
    front_matter: (e, a) => {
      e.write(`---
`), e.tick("inner");
      for (const s of a.textContent)
        e.tick("inner"), s === `
` ? (e.out += `
`, e.delim && (e.out += e.delim)) : e.out += s, e.advance(1);
      e.tick("inner"), e.write(`
---`), e.closeBlock(a);
    }
  },
  plugins: () => [
    new _t({
      props: {
        nodeViews: {
          front_matter: (e, a, s) => l2(e, a, s)
        }
      }
    })
  ],
  keymap: (e) => ({
    Enter: (a, s, i) => {
      const n = a.selection;
      if (!n.empty) return !1;
      const c = n.$from, d = e.nodes.front_matter;
      if (c.parent.type.name === "paragraph" && c.depth === 1 && c.index(0) === 0 && c.parent.textContent === "---") {
        if (s) {
          const p = d.create(), t = c.before(), r = c.after(), l = a.tr;
          if (l.replaceWith(t, r, p), Ei() === "panel") {
            const h = t + p.nodeSize;
            h > l.doc.content.size - 2 && l.insert(h, e.nodes.paragraph.create()), l.setSelection(pt.create(l.doc, h + 1));
          } else {
            const h = t + 1;
            l.setSelection(pt.create(l.doc, h));
          }
          i && o2(i);
          try {
            s(l);
          } finally {
            i && s2(i);
          }
        }
        return !0;
      }
      if (c.parent.type === d) {
        const p = c.parent.textContent;
        if (c.parentOffset === p.length && p.endsWith(`
`)) {
          if (s) {
            const r = a.tr, l = c.after();
            r.delete(l - 2, l - 1);
            const h = l - 1, f = r.doc.content.size;
            if (h >= f) {
              const y = e.nodes.paragraph.create();
              r.insert(h, y);
            }
            r.setSelection(pt.create(r.doc, h + 1)), s(r);
          }
          return !0;
        }
        return !1;
      }
      return !1;
    },
    ArrowDown: (a, s) => {
      const i = a.selection;
      if (!i.empty) return !1;
      const n = i.$from, c = a.schema.nodes.front_matter;
      if (n.parent.type !== c || n.parent.textContent.slice(n.parentOffset).includes(`
`)) return !1;
      if (s) {
        const p = a.tr, t = n.after(), r = p.doc.content.size;
        if (t >= r) {
          const l = a.schema.nodes.paragraph.create();
          p.insert(t, l);
        }
        p.setSelection(pt.create(p.doc, t + 1)), s(p);
      }
      return !0;
    }
  })
}, p2 = {
  id: "frontMatter",
  register: ({ editor: e, settings: a, t: s }) => (nr({
    read: () => a.get(ya),
    write: (n) => a.set(ya, n),
    subscribe: (n) => a.onDidChange(
      (c) => n(c.values[ya] === "source" ? "source" : "panel")
    ).dispose
  }), ii((n) => s(n)), [
    e.registerSyntaxFeature(h2),
    {
      dispose() {
        nr(null), ii(null);
      }
    }
  ])
}, Ua = "headingTypeIndicator_focus";
function f2(e) {
  const a = new ia("headingTypeIndicator");
  let s = !1;
  return new _t({
    key: a,
    state: {
      init: () => St.empty,
      apply: (i, n, c, d) => {
        const u = i.getMeta(Ua);
        return u !== void 0 && (s = u), s ? y2(d) : St.empty;
      }
    },
    props: {
      decorations(i) {
        return a.getState(i);
      },
      handleDOMEvents: {
        focus: (i) => (s || i.dispatch(i.state.tr.setMeta(Ua, !0)), !1),
        blur: (i) => (s && i.dispatch(i.state.tr.setMeta(Ua, !1)), !1)
      }
    }
  });
}
function hi(e) {
  for (let a = e.depth; a >= 0; a--) {
    const s = e.node(a);
    if (s.type.name === "heading")
      return {
        level: s.attrs.level,
        from: e.before(a),
        to: e.before(a) + s.nodeSize
      };
  }
  return null;
}
function y2(e) {
  const { $from: a, $to: s } = e.selection, i = hi(a) ?? hi(s);
  if (!i || i.level < 1 || i.level > 6)
    return St.empty;
  const n = zt.node(i.from, i.to, {
    class: "heading-type-indicator",
    "data-label": `H${i.level}`
  });
  return St.create(e.doc, [n]);
}
const v2 = {
  name: "heading-type-indicator",
  plugins: (e) => [f2()]
}, g2 = {
  id: "headingIndicator",
  register: ({ editor: e }) => [e.registerSyntaxFeature(v2)]
}, w2 = {
  id: "highlight",
  markName: "highlight",
  delim: "==",
  labelKey: "highlight.label",
  icon: "highlighter",
  order: 3
}, k2 = [
  "#f7d54e",
  // yellow
  "#a3e07a",
  // green
  "#8ec5f2",
  // blue
  "#f2a0c0",
  // pink
  "#f7b267",
  // orange
  "#c9a7eb"
  // purple
], x2 = k2[0], Ka = "texto-plugin-highlight-color";
function M2(e) {
  const a = `color-mix(in oklab, ${e} 35%, transparent)`, s = `color-mix(in oklab, ${e} 50%, transparent)`;
  return `:root{--highlight-color:${a}}:root.dark{--highlight-color:${s}}`;
}
function L2(e) {
  const a = typeof e == "string" && /^#[0-9a-fA-F]{6}$/.test(e) ? e : x2;
  let s = document.getElementById(Ka);
  return s || (s = document.createElement("style"), s.id = Ka, document.head.appendChild(s)), s.textContent = M2(a), {
    dispose() {
      document.getElementById(Ka)?.remove();
    }
  };
}
function _2(e) {
  function a(i, n) {
    const c = i.pos, d = i.src.charCodeAt(c);
    if (n || d !== 61)
      return !1;
    const u = i.scanDelims(i.pos, !0);
    let p = u.length;
    const t = String.fromCharCode(d);
    if (p < 2)
      return !1;
    if (p % 2) {
      const r = i.push("text", "", 0);
      r.content = t, p--;
    }
    for (let r = 0; r < p; r += 2) {
      const l = i.push("text", "", 0);
      l.content = t + t, !(!u.can_open && !u.can_close) && i.delimiters.push({
        marker: d,
        length: 0,
        // disable "rule of 3" length checks meant for emphasis
        jump: r / 2,
        // 1 delimiter = 2 characters
        token: i.tokens.length - 1,
        end: -1,
        open: u.can_open,
        close: u.can_close
      });
    }
    return i.pos += u.length, !0;
  }
  function s(i, n) {
    const c = [], d = n.length;
    for (let u = 0; u < d; u++) {
      const p = n[u];
      if (p.marker !== 61 || p.end === -1)
        continue;
      const t = n[p.end], r = i.tokens[p.token];
      r.type = "mark_open", r.tag = "mark", r.nesting = 1, r.markup = "==", r.content = "";
      const l = i.tokens[t.token];
      l.type = "mark_close", l.tag = "mark", l.nesting = -1, l.markup = "==", l.content = "", i.tokens[t.token - 1].type === "text" && i.tokens[t.token - 1].content === "=" && c.push(t.token - 1);
    }
    for (; c.length; ) {
      const u = c.pop();
      let p = u + 1;
      for (; p < i.tokens.length && i.tokens[p].type === "mark_close"; )
        p++;
      if (p--, u !== p) {
        const t = i.tokens[p];
        i.tokens[p] = i.tokens[u], i.tokens[u] = t;
      }
    }
  }
  e.inline.ruler.before("emphasis", "mark", a), e.inline.ruler2.before("emphasis", "mark", function(i) {
    let n;
    const c = i.tokens_meta, d = (i.tokens_meta || []).length;
    for (s(i, i.delimiters), n = 0; n < d; n++)
      c[n] && c[n].delimiters && s(i, c[n].delimiters);
  });
}
const A2 = {
  name: "highlight",
  marks: {
    highlight: {
      parseDOM: [{ tag: "mark" }],
      toDOM: () => ["mark", 0]
    }
  },
  mdItPlugins: [(e) => e.use(_2)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike 的 s_open / s_close 同构，缺了会让回退路径丢掉 `==` 字面。
  parserTokens: {
    mark_open: (e, a, s) => {
      e.addText(a.markup), e.openMark(s.marks.highlight.create());
    },
    mark_close: (e, a, s) => {
      e.closeMarkType(s.marks.highlight), e.addText(a.markup);
    }
  },
  markDelims: {
    highlight: { open: "", close: "" }
  },
  inline: {
    // v2：语义归 md-it，位置归骨架；本特性只声明「成对 token → mark」。
    order: -1,
    derive: (e) => Ga(e, { open: "mark_open", close: "mark_close", mark: "highlight" }),
    markNames: ["highlight"],
    extRanges: (e) => _e(e, "highlight", 2)
  }
}, b2 = {
  id: "highlight",
  register: ({ editor: e, settings: a }) => [
    e.registerSyntaxFeature(A2),
    e.registerFormatToolbarItem(w2),
    // 颜色样式表随特性一起释放：关闭高亮（或改色触发重装）时先移除再重建
    L2(a.get("highlightColor"))
  ]
}, xn = /* @__PURE__ */ new Set();
function N2(e) {
  return xn.add(e), () => xn.delete(e);
}
function $2() {
  for (const e of xn) e();
}
const E2 = /* @__PURE__ */ new Set([
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "section",
  "source",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
]), C2 = /* @__PURE__ */ new Set(["script", "pre", "style", "textarea"]);
function ws(e) {
  if (/^\s{0,3}<!--$/.test(e)) return { tag: "!" };
  const a = e.match(/^\s{0,3}<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)>?$/);
  if (!a || a[1] === "/") return null;
  const s = (a[2] ?? "").toLowerCase(), i = C2.has(s);
  return !E2.has(s) && !i || !e.trimEnd().endsWith(">") && !i ? null : { tag: s };
}
const ks = /* @__PURE__ */ new Set([
  "span",
  "kbd",
  "abbr",
  "cite",
  "q",
  "dfn",
  "ins",
  "small",
  "time",
  "bdo",
  "bdi",
  "samp",
  "var",
  "data"
]);
function I2(e) {
  const a = {}, s = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let i;
  for (; i = s.exec(e); ) {
    const n = i[2] ?? i[3] ?? i[4] ?? "";
    n && (a[i[1]] = n);
  }
  return a;
}
function pi(e, a) {
  const s = [];
  let i = 0;
  for (; i < e.length; ) {
    if (a[i] || e[i] !== "<") {
      i++;
      continue;
    }
    const n = e[i + 1];
    if (!n || n === "/" || n === "!") {
      i++;
      continue;
    }
    const c = i + 1;
    let d = c;
    for (; d < e.length && /[a-zA-Z]/.test(e[d]); ) d++;
    if (d === c) {
      i++;
      continue;
    }
    const u = e.slice(c, d).toLowerCase();
    if (!ks.has(u)) {
      i++;
      continue;
    }
    const p = d;
    let t = -1, r = !1;
    for (let T = p; T < e.length; T++) {
      if (a[T]) {
        r = !0;
        break;
      }
      if (e[T] === ">") {
        t = T + 1;
        break;
      }
    }
    if (r || t === -1) {
      i = t > 0 ? t : d;
      continue;
    }
    for (let T = i; T < t; T++)
      if (a[T]) {
        r = !0;
        break;
      }
    if (r) {
      i = t;
      continue;
    }
    const l = e.slice(p, t - 1).trim(), h = I2(l), f = `</${u}>`;
    let y = -1;
    for (let T = t; T < e.length; T++)
      if (!a[T] && e.startsWith(f, T)) {
        y = T;
        break;
      }
    if (y === -1) {
      i = t;
      continue;
    }
    const g = y + f.length;
    for (let T = y; T < g; T++)
      if (a[T]) {
        r = !0;
        break;
      }
    if (r) {
      i = g;
      continue;
    }
    const v = t, w = y;
    if (v >= w) {
      i = g;
      continue;
    }
    Ke(a, i, t), Ke(a, y, g);
    const L = t - i, N = g - y;
    s.push({
      type: "html_inline",
      from: v,
      to: w,
      openFrom: i,
      openTo: t,
      closeFrom: y,
      closeTo: g,
      attrs: { tag: u, htmlAttrs: h, openLen: L, closeLen: N }
    }), i = g;
  }
  return s;
}
function O2(e) {
  return Ls({
    match: (a) => {
      const s = ws(a);
      return s ? { data: s, prefixLen: a.match(/^\s*/)?.[0].length ?? 0 } : null;
    },
    draftClass: () => "html-block-draft",
    commit: (a, s, i, n) => {
      const c = n.tag === "!" ? "<!--" : i.textContent.trim(), d = n.tag === "!" ? "-->" : `</${n.tag}>`, u = e.nodes.html_block.create(
        null,
        e.text(c + `
` + d)
      );
      a.replaceWith(s, s + i.nodeSize, u);
    }
  });
}
function j2() {
  return new _t({
    props: {
      nodeViews: {
        html_block: (e, a, s) => {
          const i = document.createElement("html-block"), n = document.createElement("div");
          n.className = "html-block-code", i.setAttribute("data-export", "html"), n.setAttribute("data-export-source", ""), i.appendChild(n);
          const c = document.createElement("div");
          c.className = "html-block-render", c.contentEditable = "false", c.style.display = "none", i.appendChild(c);
          let d = null, u = !1, p = e;
          return Promise.resolve().then(() => _y).then(({ createHtmlBlockView: t }) => {
            u || (d = t({ dom: i, contentDOM: n, renderContainer: c, view: a, getPos: s, node: p }), d.update(p));
          }).catch(() => {
          }), {
            dom: i,
            contentDOM: n,
            update(t) {
              return p = t, d ? d.update(t) : !0;
            },
            destroy() {
              u = !0, d?.destroy();
            },
            stopEvent(t) {
              return d?.stopEvent(t) ?? !1;
            },
            ignoreMutation(t) {
              return d?.ignoreMutation(t) ?? !1;
            }
          };
        }
      }
    }
  });
}
function S2() {
  const e = new ia("htmlBlockSelectionWatcher");
  return new _t({
    key: e,
    view: () => ({
      update: (a, s) => {
        const i = s.selection, n = a.state.selection;
        (i.from !== n.from || i.to !== n.to) && $2();
      }
    })
  });
}
const T2 = {
  name: "html-block",
  nodes: {
    html_block: {
      group: "block",
      content: "text*",
      marks: "",
      code: !0,
      defining: !0,
      attrs: { lang: { default: "html" } },
      parseDOM: [{ tag: "html-block", preserveWhitespace: "full" }],
      toDOM: () => ["html-block", 0]
    }
  },
  blockHandlers: {
    html_block: (e, a) => {
      e.write(), e.tick("inner");
      for (const s of a.textContent)
        e.tick("inner"), s === `
` ? (e.out += `
`, e.delim && (e.out += e.delim)) : e.out += s, e.advance(1);
      e.tick("inner"), e.closeBlock(a);
    }
  },
  plugins: (e) => [
    O2(e).plugin,
    j2(),
    S2()
  ],
  keymap: (e) => ({
    Enter: (a, s) => {
      const i = a.selection;
      if (!i.empty) return !1;
      const n = i.$from, c = n.parent;
      if (c.type.name !== "paragraph") return !1;
      const d = ws(c.textContent);
      if (!d) return !1;
      if (s) {
        const u = d.tag === "!" ? "<!--" : c.textContent.trim(), p = d.tag === "!" ? "-->" : `</${d.tag}>`, t = n.before(), r = e.nodes.html_block.create(null, e.text(u + `
` + p)), l = a.tr.replaceWith(t, t + c.nodeSize, r);
        l.setSelection(pt.create(l.doc, t + 1 + u.length + 1)), s(l);
      }
      return !0;
    },
    Backspace: (a, s) => {
      const i = a.selection;
      if (!i.empty) return !1;
      const n = i.$from;
      if (n.parent.type.name !== "html_block" || n.parent.content.size > 0) return !1;
      if (s) {
        const c = n.before(), d = n.parent.nodeSize, u = a.tr.delete(c, c + d);
        if (u.doc.content.size === 0) {
          const p = e.nodes.paragraph.createAndFill();
          p && u.insert(0, p);
        }
        s(u);
      }
      return !0;
    },
    ArrowDown: (a, s) => {
      const i = a.selection;
      if (!i.empty) return !1;
      const n = i.$from, c = a.schema.nodes.html_block;
      if (n.parent.type === c) {
        if (n.parent.textContent.slice(n.parentOffset).includes(`
`)) return !1;
        if (s) {
          const l = a.tr, h = n.after(), f = l.doc.content.size;
          if (h >= f) {
            const y = a.schema.nodes.paragraph.create();
            l.insert(h, y);
          }
          l.setSelection(pt.create(l.doc, h + 1)), s(l);
        }
        return !0;
      }
      if (!n.parent.isTextblock || n.parent.textContent.slice(n.parentOffset).includes(`
`)) return !1;
      const p = a.doc.nodeAt(n.after());
      return !p || p.type !== c || p.textContent.trim() === "" ? !1 : (s && s(a.tr.setSelection(pt.create(a.tr.doc, n.after() + 1))), !0);
    },
    ArrowUp: (a, s) => {
      const i = a.selection;
      if (!i.empty) return !1;
      const n = i.$from, c = a.schema.nodes.html_block;
      if (!n.parent.isTextblock || n.parent.textContent.slice(0, n.parentOffset).includes(`
`)) return !1;
      const t = a.doc.resolve(n.before()).nodeBefore;
      return !t || t.type !== c || t.textContent.trim() === "" ? !1 : (s && s(a.tr.setSelection(pt.create(a.tr.doc, n.before() - 1))), !0);
    }
  }),
  parserTokens: {
    html_block: (e, a, s) => {
      const i = a.content.replace(/\n$/, ""), n = i ? [s.text(i)] : [];
      e.push(s.nodes.html_block.create(null, n));
    }
  }
}, fi = /<!--([\s\S]*?)-->/g;
function B2(e, a) {
  const s = [];
  fi.lastIndex = 0;
  let i;
  for (; i = fi.exec(e); ) {
    const n = i.index, c = n + i[0].length;
    let d = !1;
    for (let u = n; u < c; u++)
      if (a[u]) {
        d = !0;
        break;
      }
    d || (Ke(a, n, c), s.push({
      type: "html_comment",
      from: n,
      to: c,
      openFrom: n,
      openTo: n,
      closeFrom: c,
      closeTo: c,
      opaque: !0
    }));
  }
  return s;
}
const D2 = {
  name: "html-comment",
  marks: {
    html_comment: {
      inclusive: !1,
      parseDOM: [{ tag: "mark-comment" }],
      toDOM: () => ["mark-comment", 0]
    }
  },
  // md-it with `html: false` already lets `<!-- ... -->` flow through as
  // plain text (verified). Method-B handles the rest.
  markDelims: {
    html_comment: { open: "", close: "" }
  },
  inline: {
    order: 0.5,
    derive: (e) => B2(e.text, e.consumed),
    markNames: ["html_comment"],
    extRanges: (e) => {
      const a = [], s = e.type.schema.marks.html_comment;
      if (!s) return a;
      let i = -1, n = 0;
      const c = (d) => {
        i >= 0 && a.push([i, d]), i = -1;
      };
      return e.forEach((d) => {
        d.isText && (d.marks.some((p) => p.type === s) ? i < 0 && (i = n) : c(n)), n += d.nodeSize;
      }), c(n), a;
    }
  }
}, z2 = {
  name: "html-inline",
  marks: {
    html_inline: {
      attrs: {
        tag: { default: "span" },
        htmlAttrs: { default: {} },
        openLen: { default: 0 },
        closeLen: { default: 0 }
      },
      inclusive: !1,
      parseDOM: [{
        tag: "*",
        getAttrs: (e) => {
          const a = e, s = a.tagName.toLowerCase();
          if (!ks.has(s)) return !1;
          const i = {};
          for (const n of a.attributes)
            n.name.startsWith("data-") || (i[n.name] = n.value);
          return { tag: s, htmlAttrs: i, openLen: 0, closeLen: 0 };
        }
      }],
      toDOM: (e) => {
        const { tag: a, htmlAttrs: s } = e.attrs;
        return [a, s, 0];
      }
    }
  },
  markDelims: {
    html_inline: { open: "", close: "" }
  },
  inline: {
    order: 0.3,
    derive: (e) => pi(e.text, e.consumed),
    markNames: ["html_inline"],
    extRanges: (e) => {
      const a = [], s = e.type.schema.marks.html_inline;
      if (!s) return a;
      let i = -1, n = 0, c = 0, d = 0;
      const u = (p) => {
        i >= 0 && a.push([i - n, p + c]), i = -1;
      };
      return e.forEach((p) => {
        if (p.isText) {
          const t = p.marks.find((r) => r.type === s);
          if (t && i < 0) {
            i = d;
            const r = t.attrs;
            n = r.openLen ?? 0, c = r.closeLen ?? 0;
          } else t || u(d);
        }
        d += p.nodeSize;
      }), u(d), a;
    }
  },
  parserPostProcess: (e) => {
    const a = e.type.schema.marks.html_inline;
    if (!a) return e;
    const s = new $s(e);
    let i = !1;
    return e.descendants((n, c) => {
      if (!n.isTextblock || n.type.name === "code_block") return !0;
      const d = n.textContent, u = pi(d, new Uint8Array(d.length));
      if (u.length === 0) return !0;
      const p = c + 1;
      for (const t of u)
        t.type === "html_inline" && (s.addMark(p + t.from, p + t.to, a.create(t.attrs)), i = !0);
      return !1;
    }), i ? s.doc : e;
  }
}, W2 = {
  name: "html:md-config",
  mdItPlugins: [
    (e) => {
      e.set({ html: !0 }), e.inline.ruler.disable(["html_inline"]);
    }
  ]
}, V2 = {
  id: "html",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(W2),
    e.registerSyntaxFeature(T2),
    e.registerSyntaxFeature(z2),
    e.registerSyntaxFeature(D2)
  ]
}, R2 = ["latex", "math"], P2 = {
  id: "math.copy-latex",
  labelKey: "math.copyLatex",
  requires: ["block"],
  order: 10,
  when: (e) => {
    const a = e.block?.node;
    return a?.type.name === "code_block" && R2.includes(a.attrs.lang);
  },
  run: (e) => {
    const a = e.block?.node;
    if (a)
      return navigator.clipboard.writeText(a.textContent);
  }
}, F2 = [["path", "M18 7V4H6l6 8-6 8h12v-3"]], H2 = {
  // 裸 slug：宿主按 id 去重，且须与原生菜单项 / 快捷键 / 命令分发的 action id 一致。
  id: "math_block",
  keyword: "math",
  labelKey: "math.mathBlock",
  descriptionKey: "math.mathBlockDesc",
  icon: F2,
  defaultShortcut: "Cmd+Shift+M",
  category: "paragraph",
  order: 3,
  insert(e) {
    const s = e.state.schema.nodes.code_block;
    if (!s) return;
    const { $from: i } = e.state.selection, n = e.state.tr.replaceWith(
      i.before(),
      i.after(),
      s.create({ lang: "latex" })
    );
    e.dispatch(n), e.focus();
  }
};
function q2(e) {
  const a = document.createElement("div");
  a.className = "math-preview";
  let s = 0;
  return {
    dom: a,
    update(i, n) {
      const c = ++s, d = i.textContent;
      if (!d.trim()) {
        a.innerHTML = '<div class="cb-render-empty">Empty formula</div>';
        return;
      }
      a.innerHTML = '<div class="cb-render-loading">Rendering...</div>', wi(d, {
        mode: "display",
        decorate: (u) => {
          u.style.maxWidth = "100%", u.style.height = "auto";
        }
      }).then((u) => {
        c === s && (a.innerHTML = `<div class="math-svg-container">${u}</div>`);
      }).catch((u) => {
        c === s && n.onError(u?.message ?? String(u));
      });
    },
    destroy() {
      s += 1;
    }
  };
}
const yi = {
  $: { close: "$" },
  "\\(": { close: "\\)", openClass: "math-delim-open", closeClass: "math-delim-close" }
};
function Kn(e) {
  return Object.prototype.hasOwnProperty.call(yi, e) ? yi[e] : null;
}
function Y2({
  text: e,
  pos: a,
  token: s
}) {
  const i = Kn(s.markup);
  if (!i) return null;
  const n = s.content, c = a, d = c + s.markup.length;
  if (!e.startsWith(s.markup, c) || !e.startsWith(n, d)) return null;
  const u = d + n.length;
  if (!e.startsWith(i.close, u)) return null;
  const p = u + i.close.length;
  let t = d, r = u;
  for (; t < r && /\s/.test(e[t]); ) t++;
  for (; r > t && /\s/.test(e[r - 1]); ) r--;
  const l = e.slice(t, r), h = {
    type: "inline_math",
    from: t,
    to: r,
    openFrom: c,
    openTo: d,
    closeFrom: u,
    closeTo: p,
    attrs: { latex: l },
    opaque: !0,
    delimRanges: [
      { from: c, to: d, ...i.openClass ? { className: i.openClass } : {} },
      { from: t, to: r, softInside: !0 },
      { from: u, to: p, ...i.closeClass ? { className: i.closeClass } : {} }
    ]
  };
  return l && (h.widgetDecorations = [
    { pos: t, when: "outside", kind: "math-render", attrs: { latex: l }, side: -1 }
  ]), h;
}
function X2(e, a, s) {
  if (s.type !== "math_inline") return null;
  const i = Kn(s.markup);
  if (!i || !e.startsWith(s.markup, a)) return null;
  const n = a + s.markup.length;
  if (!e.startsWith(s.content, n)) return null;
  const c = n + s.content.length;
  return e.startsWith(i.close, c) ? c + i.close.length - a : null;
}
function U2(e) {
  const a = [];
  for (const s of e.tokens) {
    if (s.token.type !== "math_inline" || !s.exact) continue;
    const i = Y2({
      text: e.text,
      pos: s.pos,
      token: s.token
    });
    i && a.push(i);
  }
  return a;
}
typeof window < "u" && !customElements.get("math-jax") && customElements.define(
  "math-jax",
  class extends HTMLElement {
    constructor() {
      super(), this.addEventListener("mousedown", (a) => {
        a.button !== 0 && a.preventDefault();
      });
    }
    // data-render 是「连接后才懒观察」的开关：只有 render widget 需要它。
    // 放在 connectedCallback 而非 builder 里 observe，是因为 PM 逐事务重建
    // 装饰时会丢弃未挂载的孤儿元素——连接时才 observe，孤儿元素就不会进入
    // 观察集合，也就不会触发渲染回调泄漏。
    connectedCallback() {
      this.style.display = "inline-block", this.style.verticalAlign = "middle", this.style.lineHeight = "1", this.hasAttribute("data-render") && gi().observe(this);
    }
    disconnectedCallback() {
      gi().unobserve(this);
    }
    static get observedAttributes() {
      return ["latex", "data-formula"];
    }
    attributeChangedCallback(a, s, i) {
      s !== i && a === "data-formula" && i && this.removeAttribute("data-rendered");
    }
  }
);
const vi = /* @__PURE__ */ new Map(), K2 = "v1";
let Xe = null;
function gi() {
  return Xe || (Xe = new IntersectionObserver(
    (e) => {
      e.forEach((a) => {
        if (a.isIntersecting) {
          const s = a.target, i = s.getAttribute("data-formula");
          i && !s.hasAttribute("data-rendered") && (s.setAttribute("data-rendered", "true"), G2(i).then((n) => {
            n && s.isConnected ? s.innerHTML = n : s.isConnected && (s.textContent = i);
          })), Xe?.unobserve(s);
        }
      });
    },
    { root: null, rootMargin: "100px", threshold: 0 }
  )), Xe;
}
async function G2(e) {
  const a = `${K2}:${e}`, s = vi.get(a);
  if (s) return s;
  try {
    const i = await wi(e, {
      mode: "inline",
      decorate: (n) => {
        const c = n.getAttribute("viewBox");
        (c ? c.split(" ").map(Number).filter((u) => !Number.isNaN(u)) : []).length !== 4 && n.setAttribute("viewBox", "0 -700 1000 1400"), n.style.pointerEvents = "none";
      }
    });
    return vi.set(a, i), i;
  } catch (i) {
    return console.error("Math render error:", i), null;
  }
}
function Z2(e) {
  const a = document.createElement("math-jax");
  return a.setAttribute("latex", e), a.setAttribute("data-formula", e), a.setAttribute("contenteditable", "false"), a.textContent = e, a;
}
const Q2 = (e) => {
  const a = Z2(e.latex ?? "");
  return a.setAttribute("data-render", "1"), a;
};
function xs(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function it(e, a) {
  const s = it.mergeDelimiters(a && a.delimiters), i = a && a.outerSpace || !1, n = a && a.katexOptions || {};
  n.throwOnError = n.throwOnError || !1, n.macros = n.macros || a && a.macros, it.katex || (a && typeof a.engine == "object" ? it.katex = a.engine : it.katex = { renderToString() {
    return "No math renderer found.";
  } });
  for (const c of s.inline)
    i && "outerSpace" in c && (c.outerSpace = !0), e.inline.ruler.before("escape", c.name, it.inline(c)), e.renderer.rules[c.name] = (d, u) => c.tmpl.replace(/\$1/, it.render(d[u].content, !!c.displayMode, n));
  for (const c of s.block)
    e.block.ruler.before("fence", c.name, it.block(c)), e.renderer.rules[c.name] = (d, u) => c.tmpl.replace(/\$2/, xs(d[u].info)).replace(/\$1/, it.render(d[u].content, !0, n));
}
it.mergeDelimiters = function(e) {
  const a = Array.isArray(e) ? e : typeof e == "string" ? [e] : ["dollars"], s = { inline: [], block: [] };
  for (const i of a)
    i in it.rules && (s.inline.push(...it.rules[i].inline), s.block.push(...it.rules[i].block));
  return s;
};
it.inline = (e) => function(a, s) {
  const i = a.pos, n = a.src, d = n.startsWith(e.tag, e.rex.lastIndex = i) && (!e.pre || e.pre(n, e.outerSpace, i)) && e.rex.exec(n), u = !!d && i < e.rex.lastIndex && (!e.post || e.post(n, e.outerSpace, e.rex.lastIndex - 1));
  if (u) {
    if (!s) {
      const p = a.push(e.name, "math", 0);
      p.content = d[1], p.markup = e.tag;
    }
    a.pos = e.rex.lastIndex;
  }
  return u;
};
it.block = (e) => function(s, i, n, c) {
  const d = s.bMarks[i] + s.tShift[i], u = s.src, t = u.startsWith(e.tag, e.rex.lastIndex = d) && (!e.pre || e.pre(u, !1, d)) && e.rex.exec(u), r = !!t && d < e.rex.lastIndex && (!e.post || e.post(u, !1, e.rex.lastIndex - 1));
  if (r && !c) {
    const l = e.rex.lastIndex - 1;
    let h;
    for (h = i; h < n && !(l >= s.bMarks[h] + s.tShift[h] && l <= s.eMarks[h]); h++)
      ;
    const f = s.lineMax, y = s.parentType;
    s.lineMax = h, s.parentType = "math", y === "blockquote" && (t[1] = t[1].replace(/(\n*?^(?:\s*>)+)/gm, ""));
    let g = s.push(e.name, "math", 0);
    g.block = !0, g.tag = e.tag, g.markup = "", g.content = t[1], g.info = t[t.length - 1], g.map = [i, h + 1], s.parentType = y, s.lineMax = f, s.line = h + 1;
  }
  return r;
};
it.render = function(e, a, s) {
  s.displayMode = a;
  let i;
  try {
    i = it.katex.renderToString(e, s);
  } catch (n) {
    i = xs(`${e}:${n.message}`);
  }
  return i;
};
it.use = function(e) {
  return it.katex = e, it;
};
it.inlineRuleNames = ["math_inline", "math_inline_double"];
it.blockRuleNames = ["math_block", "math_block_eqno"];
it.$_pre = (e, a, s) => {
  const i = s > 0 ? e[s - 1].charCodeAt(0) : !1;
  return a ? !i || i === 32 : !i || i !== 92 && (i < 48 || i > 57);
};
it.$_post = (e, a, s) => {
  const i = e[s + 1] && e[s + 1].charCodeAt(0);
  return a ? !i || i === 32 || i === 46 || i === 44 || i === 59 : !i || i < 48 || i > 57;
};
it.rules = {
  brackets: {
    inline: [
      {
        name: "math_inline",
        rex: /\\\((.+?)\\\)/gy,
        tmpl: "<eq>$1</eq>",
        tag: "\\("
      }
    ],
    block: [
      {
        name: "math_block_eqno",
        rex: /\\\[(((?!\\\]|\\\[)[\s\S])+?)\\\]\s*?\(([^)$\r\n]+?)\)/gmy,
        tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
        tag: "\\["
      },
      {
        name: "math_block",
        rex: /\\\[([\s\S]+?)\\\]/gmy,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "\\["
      }
    ]
  },
  doxygen: {
    inline: [
      {
        name: "math_inline",
        rex: /\\f\$(.+?)\\f\$/gy,
        tmpl: "<eq>$1</eq>",
        tag: "\\f$"
      }
    ],
    block: [
      {
        name: "math_block_eqno",
        rex: /\\f\[([^]+?)\\f\]\s*?\(([^)\s]+?)\)/gmy,
        tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
        tag: "\\f["
      },
      {
        name: "math_block",
        rex: /\\f\[([^]+?)\\f\]/gmy,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "\\f["
      }
    ]
  },
  gitlab: {
    inline: [
      {
        name: "math_inline",
        rex: /\$`(.+?)`\$/gy,
        tmpl: "<eq>$1</eq>",
        tag: "$`"
      }
    ],
    block: [
      {
        name: "math_block_eqno",
        rex: /`{3}math\s*([^`]+?)\s*?`{3}\s*\(([^)\r\n]+?)\)/gm,
        tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
        tag: "```math"
      },
      {
        name: "math_block",
        rex: /`{3}math\s*([^`]*?)\s*`{3}/gm,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "```math"
      }
    ]
  },
  julia: {
    inline: [
      {
        name: "math_inline",
        rex: /`{2}([^`]+?)`{2}/gy,
        tmpl: "<eq>$1</eq>",
        tag: "``"
      },
      {
        name: "math_inline",
        rex: /\$((?:\S?)|(?:\S.*?\S))\$/gy,
        tmpl: "<eq>$1</eq>",
        tag: "$",
        spaceEnclosed: !1,
        pre: it.$_pre,
        post: it.$_post
      }
    ],
    block: [
      {
        name: "math_block_eqno",
        rex: /`{3}math\s+?([^`]+?)\s+?`{3}\s*?\(([^)$\r\n]+?)\)/gmy,
        tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
        tag: "```math"
      },
      {
        name: "math_block",
        rex: /`{3}math\s+?([^`]+?)\s+?`{3}/gmy,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "```math"
      }
    ]
  },
  kramdown: {
    inline: [
      {
        name: "math_inline",
        rex: /\${2}(.+?)\${2}/gy,
        tmpl: "<eq>$1</eq>",
        tag: "$$"
      }
    ],
    block: [
      {
        name: "math_block_eqno",
        rex: /\${2}([^$]+?)\${2}\s*?\(([^)\s]+?)\)/gmy,
        tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
        tag: "$$"
      },
      {
        name: "math_block",
        rex: /\${2}([^$]+?)\${2}/gmy,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "$$"
      }
    ]
  },
  beg_end: {
    inline: [],
    block: [
      {
        name: "math_block",
        rex: /(\\(?:begin)\{([a-z]+)\}[\s\S]+?\\(?:end)\{\2\})/gmy,
        // regexp to match \begin{...}...\end{...} environment.
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "\\"
      }
    ]
  },
  dollars: {
    inline: [
      {
        name: "math_inline_double",
        rex: /\${2}([^$]*?[^\\])\${2}/gy,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "$$",
        displayMode: !0,
        pre: it.$_pre,
        post: it.$_post
      },
      {
        name: "math_inline",
        rex: /\$((?:[^\s\\])|(?:\S.*?[^\s\\]))\$/gy,
        tmpl: "<eq>$1</eq>",
        tag: "$",
        outerSpace: !1,
        pre: it.$_pre,
        post: it.$_post
      }
    ],
    block: [
      {
        name: "math_block_eqno",
        rex: /\${2}([^$]*?[^\\])\${2}\s*?\(([^)\s]+?)\)/gmy,
        tmpl: '<section class="eqno"><eqn>$1</eqn><span>($2)</span></section>',
        tag: "$$"
      },
      {
        name: "math_block",
        rex: /\${2}([^$]*?[^\\])\${2}/gmy,
        tmpl: "<section><eqn>$1</eqn></section>",
        tag: "$$"
      }
    ]
  }
};
function J2(e) {
  e.use(it, {
    engine: { renderToString: (a) => a },
    delimiters: "dollars"
  });
  for (const a of it.rules.brackets.inline)
    e.inline.ruler.before("escape", a.name, it.inline(a));
}
const ty = {
  name: "inline-math",
  marks: {
    inline_math: {
      parseDOM: [{ tag: "span.math.inline" }],
      toDOM: (e) => ["span", { class: "math inline", "data-latex": e.attrs.latex }, 0],
      attrs: { latex: { default: "" } }
    }
  },
  markDelims: {
    // 分隔符是文本的一部分；markDelims 为空，由 extRanges 控制不转义的范围。
    inline_math: { open: "", close: "" }
  },
  // `dollars` 覆盖 `$…$`，`brackets` 覆盖 `\(…\)`：两条规则都产出
  // `math_inline`（markup 分别是 `$` / `\(`），定位层按 `tokenAdvance` 认领源码宽度。
  // 规则注册（含「brackets 只取 inline」的理由）见 `md-rules.ts`。
  mdItPlugins: [J2],
  parserTokens: {
    math_inline: (e, a, s) => {
      const i = a.content;
      if (!i) return;
      const n = Kn(a.markup);
      if (!n) {
        e.addText(a.markup + i + a.markup);
        return;
      }
      const c = s.marks.inline_math.create({ latex: i });
      e.addText(a.markup), e.openMark(c), e.addText(i), e.closeMarkType(s.marks.inline_math), e.addText(n.close);
    },
    math_block: (e, a, s) => {
      const i = a.content.replace(/^\n+|\n+$/g, ""), n = i ? [s.text(i)] : [];
      e.push(s.nodes.code_block.createChecked({ lang: "latex" }, n));
    }
  },
  inline: {
    order: -1,
    derive: U2,
    tokenAdvance: X2,
    markNames: ["inline_math"],
    extRanges: (e) => _e(e, "inline_math", 1, 1),
    suppressFormatToolbar: !0,
    decorationWidgets: {
      "math-render": Q2
    }
  }
}, ey = ["latex", "math"], ay = {
  id: "math",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(ty),
    e.registerExtension(
      _s({
        id: "math.renderer",
        languages: ey,
        createPreview: q2
      })
    ),
    e.registerInsertCommand(H2),
    e.registerContextMenuItem(P2)
  ]
}, ny = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function ry(e, a) {
  const s = e.posMax, i = e.pos;
  if (e.src.charCodeAt(i) !== 126 || a || i + 2 >= s)
    return !1;
  e.pos = i + 1;
  let n = !1;
  for (; e.pos < s; ) {
    if (e.src.charCodeAt(e.pos) === 126) {
      n = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!n || i + 1 === e.pos)
    return e.pos = i, !1;
  const c = e.src.slice(i + 1, e.pos);
  if (c.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = i, !1;
  e.posMax = e.pos, e.pos = i + 1;
  const d = e.push("sub_open", "sub", 1);
  d.markup = "~";
  const u = e.push("text", "", 0);
  u.content = c.replace(ny, "$1");
  const p = e.push("sub_close", "sub", -1);
  return p.markup = "~", e.pos = e.posMax + 1, e.posMax = s, !0;
}
function iy(e) {
  e.inline.ruler.after("emphasis", "sub", ry);
}
const oy = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function sy(e, a) {
  const s = e.posMax, i = e.pos;
  if (e.src.charCodeAt(i) !== 94 || a || i + 2 >= s)
    return !1;
  e.pos = i + 1;
  let n = !1;
  for (; e.pos < s; ) {
    if (e.src.charCodeAt(e.pos) === 94) {
      n = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!n || i + 1 === e.pos)
    return e.pos = i, !1;
  const c = e.src.slice(i + 1, e.pos);
  if (c.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = i, !1;
  e.posMax = e.pos, e.pos = i + 1;
  const d = e.push("sup_open", "sup", 1);
  d.markup = "^";
  const u = e.push("text", "", 0);
  u.content = c.replace(oy, "$1");
  const p = e.push("sup_close", "sup", -1);
  return p.markup = "^", e.pos = e.posMax + 1, e.posMax = s, !0;
}
function ly(e) {
  e.inline.ruler.after("emphasis", "sup", sy);
}
const cy = {
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
  mdItPlugins: [(e) => e.use(iy).use(ly)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike / highlight 的 s_* / mark_* 同构，分隔符取自 tok.markup。
  parserTokens: {
    sub_open: (e, a, s) => {
      e.addText(a.markup), e.openMark(s.marks.sub.create());
    },
    sub_close: (e, a, s) => {
      e.closeMarkType(s.marks.sub), e.addText(a.markup);
    },
    sup_open: (e, a, s) => {
      e.addText(a.markup), e.openMark(s.marks.sup.create());
    },
    sup_close: (e, a, s) => {
      e.closeMarkType(s.marks.sup), e.addText(a.markup);
    }
  },
  markDelims: {
    sub: { open: "", close: "" },
    sup: { open: "", close: "" }
  },
  inline: {
    order: -1,
    derive: (e) => [
      ...Ga(e, { open: "sub_open", close: "sub_close", mark: "sub" }),
      ...Ga(e, { open: "sup_open", close: "sup_close", mark: "sup" })
    ],
    markNames: ["sub", "sup"],
    extRanges: (e) => [
      ..._e(e, "sub", 1),
      ..._e(e, "sup", 1)
    ]
  }
}, uy = {
  id: "subSup",
  register: ({ editor: e }) => [e.registerSyntaxFeature(cy)]
}, Mn = /* @__PURE__ */ new Set();
class my {
  dom;
  view;
  // Cache the last rendered (doc, items) so the refresh plugin bails out fast
  // when nothing relevant to the TOC changed (refresh fires on every tx).
  lastDoc = null;
  lastSig = "";
  constructor(a, s) {
    this.view = s, this.dom = document.createElement("div"), this.dom.className = "toc", this.dom.setAttribute("contenteditable", "false"), this.render(), Mn.add(this);
  }
  render() {
    const a = this.view.state.doc;
    if (a === this.lastDoc) return;
    const s = [];
    a.descendants((c, d) => {
      c.type.name === "heading" && s.push({
        level: c.attrs.level,
        text: c.textContent,
        pos: d
      });
    });
    const i = s.map((c) => `${c.pos}	${c.level}	${c.text}`).join(`
`);
    if (i === this.lastSig && this.lastDoc !== null) {
      this.lastDoc = a;
      return;
    }
    if (this.lastDoc = a, this.lastSig = i, this.dom.innerHTML = "", s.length === 0) {
      const c = document.createElement("div");
      c.className = "toc-empty", c.textContent = "(no headings yet)", this.dom.appendChild(c);
      return;
    }
    const n = document.createElement("ul");
    n.className = "toc-list";
    for (const c of s) {
      const d = document.createElement("li");
      d.className = `toc-item toc-h${c.level}`, d.textContent = c.text || "(empty heading)", d.addEventListener("mousedown", (u) => {
        u.preventDefault();
      }), d.addEventListener("click", () => this.jumpTo(c.pos)), n.appendChild(d);
    }
    this.dom.appendChild(n);
  }
  jumpTo(a) {
    const s = this.view.state.tr;
    s.setSelection(pt.near(s.doc.resolve(a + 1))), this.view.dispatch(s), this.view.nodeDOM(a)?.scrollIntoView({ block: "start", behavior: "smooth" }), this.view.focus();
  }
  // The node never changes (atom, no attrs/content); the refresh plugin calls
  // render() externally. Returning true tells PM "we handled it".
  update() {
    return !0;
  }
  destroy() {
    Mn.delete(this);
  }
  // Atom block — selectable and PM should treat the whole node as a unit.
  stopEvent() {
    return !1;
  }
  ignoreMutation() {
    return !0;
  }
}
function dy() {
  return new _t({
    view() {
      const e = () => {
        for (const a of Mn) a.render();
      };
      return e(), {
        update() {
          e();
        }
      };
    }
  });
}
const hy = {
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
    dy(),
    new _t({
      props: {
        nodeViews: {
          toc: (e, a) => new my(e, a)
        }
      }
    })
  ],
  keymap: () => ({
    // Convert paragraph `[toc]` / `[TOC]` to a toc node on Enter.
    Enter: (e, a) => {
      const s = e.selection;
      if (!s.empty) return !1;
      const i = s.$from;
      if (i.parent.type.name !== "paragraph") return !1;
      const n = i.parent.textContent;
      if (n !== "[toc]" && n !== "[TOC]") return !1;
      if (a) {
        const c = e.schema, d = c.nodes.toc.create(), u = i.before(), p = i.after(), t = e.tr;
        t.replaceWith(u, p, [
          d,
          c.nodes.paragraph.create()
        ]);
        const r = u + d.nodeSize + 1;
        t.setSelection(pt.create(t.doc, r)), a(t);
      }
      return !0;
    }
  }),
  parserPostProcess: (e) => {
    const a = [];
    let s = !1;
    const i = e.type.schema.nodes.toc;
    return !i || (e.forEach((n) => {
      n.type.name === "paragraph" && (n.textContent === "[toc]" || n.textContent === "[TOC]") ? (a.push(i.create()), s = !0) : a.push(n);
    }), !s) ? e : e.type.create(e.attrs, a, e.marks);
  },
  blockHandlers: {
    toc: (e, a) => {
      e.write("[toc]"), e.closeBlock(a);
    }
  }
}, py = {
  id: "toc",
  register: ({ editor: e }) => [e.registerSyntaxFeature(hy)]
}, fy = {
  id: "underline",
  markName: "underline",
  delim: "<u>",
  closeDelim: "</u>",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.underline.label`）
  labelKey: "underline.label",
  icon: "underline",
  order: 4
};
function yy(e, a) {
  const s = [], n = "</u>";
  for (let c = 0; c < e.length; ) {
    if (a[c] || !e.startsWith("<u>", c)) {
      c++;
      continue;
    }
    const d = c, u = c + 3, p = u;
    let t = -1;
    for (let h = p; h < e.length; h++)
      if (!a[h] && e.startsWith(n, h)) {
        t = h;
        break;
      }
    if (t === -1) break;
    const r = t + n.length, l = t;
    if (p >= l) {
      c = r;
      continue;
    }
    if (/\s/.test(e[p]) || /\s/.test(e[l - 1])) {
      c = p;
      continue;
    }
    for (let h = d; h < r; h++) a[h] = 1;
    s.push({ type: "underline", from: p, to: l, openFrom: d, openTo: u, closeFrom: t, closeTo: r, wrap: !0 }), c = r;
  }
  return s;
}
function vy() {
  return (e, a) => {
    const { from: s, to: i, empty: n } = e.selection;
    if (n) return !1;
    const c = e.doc, d = "<u>", u = "</u>", p = d.length, t = u.length, r = s >= p ? c.textBetween(s - p, s) : "", l = i + t <= c.content.size ? c.textBetween(i, i + t) : "";
    if (r === d && l === u)
      return a && a(e.tr.delete(i, i + t).delete(s - p, s)), !0;
    if (a) {
      const h = c.textBetween(s, i), f = e.tr.replaceWith(s, i, e.schema.text(d + h + u));
      f.setSelection(pt.create(f.doc, s + p, s + p + h.length)), a(f);
    }
    return !0;
  };
}
const gy = {
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
    derive: (e) => yy(e.text, e.consumed),
    markNames: ["underline"],
    extRanges: (e) => _e(e, "underline", 3, 4)
  },
  keymap: () => ({
    "Mod-u": vy()
  })
}, wy = {
  id: "underline",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(gy),
    e.registerFormatToolbarItem(fy)
  ]
}, ky = [
  js,
  uy,
  wy,
  nl,
  Vs,
  g2,
  py,
  b2,
  V2,
  ay,
  _l,
  p2
], xy = "en-US", My = {
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
    },
    highlight: {
      label: "Highlight",
      description: "Wrap text in == to add a highlight background",
      color: {
        label: "Highlight color",
        description: "Background color for highlighted text"
      }
    },
    html: {
      label: "HTML support",
      description: "Render GFM HTML blocks, inline tags and comments"
    },
    math: {
      label: "Math",
      description: "Render LaTeX math formulas inline and in fenced code blocks",
      copyLatex: "Copy LaTeX Source",
      mathBlock: "Math Block",
      mathBlockDesc: "Insert math block"
    },
    footnote: {
      label: "Footnote",
      description: "Insert footnotes with references and definitions"
    },
    frontMatter: {
      label: "Document properties",
      description: "A YAML metadata block at the top of a document, fenced with ---",
      defaultView: "Default view",
      defaultViewDesc: "How document properties are shown when a file opens",
      viewPanel: "Properties panel",
      viewSource: "Raw YAML",
      panelTitle: "Document properties",
      toggleToSource: "View source",
      toggleToPanel: "View properties",
      addProperty: "Add property",
      addPropertyKeyPrompt: "Property name",
      removeProperty: "Remove property",
      removeBlock: "Remove document properties",
      invalidYaml: "Invalid YAML — switch to source to edit"
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
    },
    highlight: {
      label: "高亮",
      description: "用 == 括选文本添加高亮背景",
      color: {
        label: "高亮颜色",
        description: "选中文本的高亮背景颜色"
      }
    },
    html: {
      label: "HTML 支持",
      description: "渲染 GFM HTML 块、内联标签与注释"
    },
    math: {
      label: "数学公式",
      description: "渲染行内与代码块中的 LaTeX 数学公式",
      copyLatex: "复制 LaTeX 源码",
      mathBlock: "数学公式",
      mathBlockDesc: "插入数学公式块"
    },
    footnote: {
      label: "脚注",
      description: "插入带引用与定义的脚注"
    },
    frontMatter: {
      label: "文档属性",
      description: "文档开头的 YAML 元信息块，使用 --- 包裹",
      defaultView: "默认视图",
      defaultViewDesc: "打开文件时文档属性的显示方式",
      viewPanel: "属性面板",
      viewSource: "原始 YAML",
      panelTitle: "文档属性",
      toggleToSource: "查看源码",
      toggleToPanel: "查看属性面板",
      addProperty: "添加属性",
      addPropertyKeyPrompt: "属性名",
      removeProperty: "删除属性",
      removeBlock: "删除文档属性",
      invalidYaml: "YAML 无效 — 请切换到源码编辑"
    }
  }
};
class qy extends As {
  featureResources = [];
  onload() {
    this.addMessages(My, xy), this.syncFeatures(), this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }
  onunload() {
    this.disposeFeatures();
  }
  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  syncFeatures() {
    this.disposeFeatures();
    for (const a of ky)
      if (this.settings.get(a.id) !== !1)
        try {
          const s = a.register({
            editor: this.app.editor,
            settings: this.settings,
            t: (i) => this.t(i)
          });
          this.featureResources.push(...Array.isArray(s) ? s : [s]);
        } catch (s) {
          this.app.log.error(`feature ${a.id} failed to load`, s);
        }
  }
  disposeFeatures() {
    for (const a of this.featureResources)
      try {
        a.dispose();
      } catch (s) {
        this.app.log.warn("feature dispose failed", s);
      }
    this.featureResources = [];
  }
}
function Ly(e) {
  const { dom: a, contentDOM: s, renderContainer: i, view: n, getPos: c } = e;
  let d = e.node, u = "code", p = null;
  const t = (v) => {
    if (v.button !== 0) {
      v.button === 2 && v.preventDefault();
      return;
    }
    if (!n.editable) return;
    v.preventDefault();
    const w = c();
    if (w == null) return;
    const L = w + 1, N = n.state.tr.setSelection(pt.create(n.state.doc, L)).scrollIntoView();
    n.dispatch(N), n.focus();
  };
  i.addEventListener("mousedown", t);
  const r = () => {
    const v = c();
    if (v == null) return !1;
    const w = n.state.selection;
    return w.from > v && w.from < v + d.nodeSize;
  }, l = () => {
    u !== "code" && (u = "code", s.style.display = "", i.style.display = "none", a.classList.remove("html-block-render-mode"));
  }, h = () => {
    u !== "render" && (u = "render", s.style.display = "none", i.style.display = "", a.classList.add("html-block-render-mode"));
  }, f = (v) => {
    const w = v.trim();
    return w.startsWith("<!--") && w.endsWith("-->");
  }, y = () => {
    const v = d.textContent, w = f(v);
    if (a.classList.toggle("html-block-comment", w), w) {
      p = null, l();
      return;
    }
    !r() && v.trim() !== "" ? ((u !== "render" || p !== v) && (i.innerHTML = v, p = v), h()) : (p = null, l());
  }, g = N2(y);
  return {
    update(v) {
      return v.type.name !== "html_block" ? !1 : (d = v, y(), !0);
    },
    destroy() {
      g(), i.removeEventListener("mousedown", t);
    },
    stopEvent(v) {
      return i.contains(v.target) && u === "render";
    },
    ignoreMutation(v) {
      return !!(i.contains(v.target) || v.type === "attributes" && (v.target === a || v.target === s));
    }
  };
}
const _y = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createHtmlBlockView: Ly
}, Symbol.toStringTag, { value: "Module" }));
export {
  qy as default
};
