import { wholeTokenSpan as hr, markConsumed as We, markExtRanges as Te, pairMarks as Ln, leaveLineDraft as _r, renderFormulaToSVG as Dt, defineCodeBlockExtension as gr, Plugin as br } from "@textox/plugin-sdk";
import { Plugin as G, PluginKey as Ve, TextSelection as H, Selection as zn } from "prosemirror-state";
import { Decoration as ne, DecorationSet as Q } from "prosemirror-view";
import { Transform as kr } from "prosemirror-transform";
const qn = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, Pt = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
};
function yr(e) {
  const t = document.createElement("span");
  return t.className = "alert-label", t.contentEditable = "false", t.textContent = Pt[e] ?? e, t;
}
function wr(e, t) {
  const r = [];
  return e.descendants((o, i) => {
    if (o.type.name !== "blockquote") return !0;
    const a = o.firstChild;
    if (!a || a.type.name !== "paragraph") return !1;
    const c = a.firstChild;
    if (!c?.isText) return !1;
    const l = c.text?.match(qn);
    if (!l) return !1;
    const f = l[1].toLowerCase();
    if (!Pt[f]) return !1;
    r.push(
      ne.node(i, i + o.nodeSize, { class: `alert alert-${f}` })
    );
    const u = i + 2, d = u + l[0].length;
    return t >= u && t <= d || (r.push(ne.inline(u, d, { class: "syntax-hidden" })), r.push(ne.widget(u, yr(f), { side: -1 }))), !1;
  }), r;
}
function xr(e) {
  e.core.ruler.push("alert_split", (t) => {
    const r = t.tokens;
    for (let o = 0; o < r.length; o++) {
      if (r[o]?.type !== "blockquote_open") continue;
      let i = 1, a = -1;
      for (let M = o + 1; M < r.length && i > 0; M++) {
        const S = r[M];
        if (S.type === "blockquote_open") {
          i++;
          continue;
        }
        if (S.type === "blockquote_close") {
          i--;
          continue;
        }
        i === 1 && S.type === "inline" && a < 0 && (a = M);
      }
      if (a < 0) continue;
      const c = r[a], l = c.content;
      if (!l.match(qn)) continue;
      const u = l.indexOf(`
`);
      if (u < 0) continue;
      const d = l.slice(0, u), p = l.slice(u + 1);
      c.content = d, c.children = [new t.Token("text", "", 0)], c.children[0].content = d;
      const h = [];
      h.push(new t.Token("paragraph_close", "p", -1));
      const b = new t.Token("paragraph_open", "p", 1);
      b.block = !0, h.push(b);
      const v = new t.Token("inline", "", 0);
      v.content = p, v.children = [new t.Token("text", "", 0)], v.children[0].content = p, v.block = !0, h.push(v), h.push(new t.Token("paragraph_close", "p", -1)), r.splice(a + 1, 1, ...h), o = a + h.length;
    }
    return !0;
  });
}
const vr = {
  name: "alert",
  mdItPlugins: [xr],
  inline: {
    markNames: [],
    extRanges: (e) => {
      if (e.type.name !== "paragraph") return [];
      const t = e.textContent.match(qn);
      return t ? [[0, t[0].length]] : [];
    }
  },
  plugins: (e) => [
    new G({
      key: new Ve("alert-decoration"),
      props: {
        decorations(t) {
          const r = wr(t.doc, t.selection.$head.pos);
          return r.length > 0 ? Q.create(t.doc, r) : Q.empty;
        }
      }
    })
  ]
}, Ar = {
  id: "alert",
  register: ({ editor: e }) => [e.registerSyntaxFeature(vr)]
}, Sr = { "[": "]", "(": ")" }, Er = /* @__PURE__ */ new Set(["]", ")"]);
function Cr(e) {
  return e.length === 0 || /^\s/.test(e);
}
function Tr() {
  return new G({
    props: {
      handleTextInput(e, t, r, o) {
        if (e.editable === !1) return !0;
        if (t !== r) return !1;
        const i = e.state.doc.resolve(t);
        if (!i.parent.isTextblock) return !1;
        const a = i.parentOffset, c = i.parent.content.size, l = a < c ? i.parent.textBetween(a, a + 1) : "";
        if (Er.has(o) && l === o) {
          const p = e.state.tr.setSelection(
            H.create(e.state.doc, t + 1)
          );
          return e.dispatch(p), !0;
        }
        const f = Sr[o];
        if (!f) return !1;
        const u = i.parent.textBetween(a, c);
        if (!Cr(u)) return !1;
        const d = e.state.tr.insertText(o + f, t, r);
        return d.setSelection(H.create(d.doc, t + 1)), e.dispatch(d), !0;
      }
    }
  });
}
const Mr = (e, t) => {
  const r = e.selection;
  if (!r.empty) return !1;
  const o = e.doc.resolve(r.from);
  if (!o.parent.isTextblock) return !1;
  const i = o.parentOffset, a = o.parent.content.size;
  if (i === 0 || i === a) return !1;
  const c = o.parent.textBetween(i - 1, i), l = o.parent.textBetween(i, i + 1);
  return c === "[" && l === "]" || c === "(" && l === ")" ? (t && t(e.tr.delete(r.from - 1, r.from + 1)), !0) : !1;
}, Lr = {
  name: "auto_pair",
  plugins: () => [Tr()],
  keymap: (e) => ({
    Backspace: Mr
  })
}, Ir = {
  id: "autoPair",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Lr)]
};
function Or(e, t) {
  return e[t].content;
}
function Nr(e, t, r, o, i) {
  const a = e.utils.arrayReplaceAt, c = e.utils.lib.ucmicro, l = new RegExp([c.Z.source, c.P.source, c.Cc.source].join("|"));
  function f(u, d, p) {
    let h = 0;
    const b = [];
    if (u.replace(i, function(v, M, S) {
      let O;
      if (Object.prototype.hasOwnProperty.call(r, v)) {
        if (O = r[v], M > 0 && !l.test(S[M - 1]) || M + v.length < S.length && !l.test(S[M + v.length]))
          return;
      } else
        O = v.slice(1, -1);
      if (M > h) {
        const B = new p("text", "", 0);
        B.content = u.slice(h, M), b.push(B);
      }
      const P = new p("emoji", "", 0);
      P.markup = O, P.content = t[O], b.push(P), h = M + v.length;
    }), h < u.length) {
      const v = new p("text", "", 0);
      v.content = u.slice(h), b.push(v);
    }
    return b;
  }
  return function(d) {
    let p;
    const h = d.tokens;
    let b = 0;
    for (let v = 0, M = h.length; v < M; v++) {
      if (h[v].type !== "inline")
        continue;
      let S = h[v].children;
      for (let O = S.length - 1; O >= 0; O--)
        p = S[O], (p.type === "link_open" || p.type === "link_close") && p.info === "auto" && (b -= p.nesting), p.type === "text" && b === 0 && o.test(p.content) && (h[v].children = S = a(
          S,
          O,
          f(p.content, p.level, d.Token)
        ));
    }
  };
}
function $r(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
function Rr(e) {
  let t = e.defs;
  e.enabled.length && (t = Object.keys(t).reduce((l, f) => (e.enabled.indexOf(f) >= 0 && (l[f] = t[f]), l), {}));
  const r = Object.keys(e.shortcuts).reduce((l, f) => t[f] ? Array.isArray(e.shortcuts[f]) ? (e.shortcuts[f].forEach((u) => {
    l[u] = f;
  }), l) : (l[e.shortcuts[f]] = f, l) : l, {}), o = Object.keys(t);
  let i;
  o.length === 0 ? i = "^$" : i = o.map((l) => `:${l}:`).concat(Object.keys(r)).sort().reverse().map((l) => $r(l)).join("|");
  const a = RegExp(i), c = RegExp(i, "g");
  return {
    defs: t,
    shortcuts: r,
    scanRE: a,
    replaceRE: c
  };
}
function qr(e, t) {
  const o = Rr(Object.assign({}, {
    defs: {},
    shortcuts: {},
    enabled: []
  }, t || {}));
  e.renderer.rules.emoji = Or, e.core.ruler.after(
    "linkify",
    "emoji",
    Nr(e, o.defs, o.shortcuts, o.scanRE, o.replaceRE)
  );
}
const Fr = {
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
}, Fn = Fr, Hn = Object.keys(Fn).sort();
function jt(e, t) {
  let r = 0;
  for (; e[t + r] === "\\"; ) r++;
  return r;
}
const Dr = (e, t, r) => {
  if (r.type !== "emoji") return null;
  const o = jt(e, t), i = `:${r.markup}:`;
  return e.startsWith(i, t + o) ? o + i.length : null;
};
function Bt(e, t) {
  let r = 0;
  for (let o = t - 1; o >= 0 && e[o] === "\\"; o--) r++;
  return r % 2 === 1;
}
function Pr(e) {
  const t = [];
  for (const r of e.tokens) {
    if (r.token.type !== "emoji" || !r.exact) continue;
    const o = r.pos + jt(e.text, r.pos);
    if (Bt(e.text, o)) continue;
    const i = `:${r.token.markup}:`;
    if (o + i.length !== r.end) continue;
    const a = hr(
      { token: r.token, pos: o, end: r.end, exact: !0, verified: !0 },
      {
        type: "emoji",
        widget: {
          kind: "emoji",
          // `len` 是 `:name:` 的长度（不含前置反斜杠串），点击后落到 span 尾部。
          attrs: { glyph: r.token.content, len: String(i.length) },
          when: "always",
          side: -1,
          stopEvents: !0
        }
      }
    );
    a && t.push(a);
  }
  return t;
}
const jr = /\B:([a-z0-9_+\-]+)$/, tn = 8, ce = {
  open: !1,
  partial: "",
  matches: [],
  selected: 0,
  dismissedFor: "",
  from: 0,
  to: 0
}, ee = new Ve("emoji-autocomplete");
function Br(e) {
  const t = [];
  for (const r of Hn)
    if (r.startsWith(e) && t.push(r), t.length >= tn) return t;
  if (t.length < tn) {
    for (const r of Hn)
      if (!t.includes(r) && (r.includes(e) && t.push(r), t.length >= tn))
        break;
  }
  return t;
}
function Yn(e, t) {
  const r = e.selection;
  if (!r.empty) return ce;
  const o = r.$from;
  if (!o.parent.isTextblock) return ce;
  const i = o.parent.textBetween(0, o.parentOffset, `
`, `
`), a = jr.exec(i);
  if (!a || Bt(i, a.index)) return ce;
  const c = a[1];
  if (t.dismissedFor === c)
    return { ...ce, dismissedFor: c };
  const l = Br(c);
  if (l.length === 0) return ce;
  const f = o.pos, d = t.open && t.partial === c && t.matches.length === l.length ? Math.min(t.selected, l.length - 1) : 0;
  return {
    open: !0,
    partial: c,
    matches: l,
    selected: d,
    dismissedFor: "",
    from: f - c.length - 1,
    // points at `:`
    to: f
  };
}
function zt(e, t, r) {
  const o = `:${t}: `, i = e.state.tr.insertText(o, r.from, r.to), a = r.from + o.length;
  i.setSelection(H.create(i.doc, a)), e.dispatch(i);
}
function zr() {
  return new G({
    key: ee,
    state: {
      init: (e, t) => Yn(t, ce),
      apply(e, t, r, o) {
        const i = e.getMeta(ee);
        if (i?.type === "select") {
          if (!t.open) return t;
          const a = t.matches.length - 1, c = Math.max(0, Math.min(a, i.index));
          return { ...t, selected: c };
        }
        return i?.type === "dismiss" ? { ...ce, dismissedFor: t.partial } : Yn(o, t);
      }
    },
    props: {
      decorations(e) {
        const t = ee.getState(e);
        if (!t?.open) return Q.empty;
        const r = Hr(t);
        return Q.create(e.doc, [
          ne.widget(t.to, r, {
            side: 1,
            key: `emoji-auto@${t.partial}@${t.selected}`,
            ignoreSelection: !0,
            stopEvent: () => !0
          })
        ]);
      },
      handleKeyDown(e, t) {
        const r = ee.getState(e.state);
        if (!r?.open) return !1;
        if (t.key === "ArrowDown")
          return e.dispatch(
            e.state.tr.setMeta(ee, { type: "select", index: r.selected + 1 })
          ), t.preventDefault(), !0;
        if (t.key === "ArrowUp")
          return e.dispatch(
            e.state.tr.setMeta(ee, { type: "select", index: r.selected - 1 })
          ), t.preventDefault(), !0;
        if (t.key === "Enter" || t.key === "Tab") {
          const o = r.matches[r.selected];
          return o ? (zt(e, o, r), t.preventDefault(), !0) : !1;
        }
        return t.key === "Escape" ? (e.dispatch(e.state.tr.setMeta(ee, { type: "dismiss" })), t.preventDefault(), !0) : !1;
      }
    },
    // Position the popup below the cursor after every update. It uses
    // `position: fixed` with viewport coords from `coordsAtPos`, but the
    // widget lives inside the editor's DOM — if an ancestor is a fixed
    // containing block (via `contain: layout`, transform, etc.) the
    // coords must be rebased to that block (see reposition below).
    view(e) {
      const t = () => {
        const r = ee.getState(e.state);
        if (!r?.open) return;
        const o = e.dom.querySelector(".emoji-completion");
        if (!o) return;
        const i = e.coordsAtPos(r.to, -1), c = o.offsetParent?.getBoundingClientRect() ?? { top: 0, left: 0 };
        o.style.top = `${i.bottom + 2 - c.top}px`, o.style.left = `${i.left - c.left}px`;
        const l = o.querySelector(".emoji-completion-row.selected");
        if (l) {
          const f = o.getBoundingClientRect(), u = l.getBoundingClientRect();
          u.top < f.top ? o.scrollTop -= f.top - u.top : u.bottom > f.bottom && (o.scrollTop += u.bottom - f.bottom);
        }
      };
      return t(), {
        update() {
          t();
        }
      };
    }
  });
}
function Hr(e) {
  const t = document.createElement("div");
  t.className = "emoji-completion", t.setAttribute("contenteditable", "false"), t.addEventListener("mousedown", (r) => r.preventDefault());
  for (let r = 0; r < e.matches.length; r++) {
    const o = e.matches[r], i = document.createElement("div");
    i.className = "emoji-completion-row", r === e.selected && i.classList.add("selected"), i.dataset.name = o;
    const a = document.createElement("span");
    a.className = "emoji-completion-glyph", a.textContent = Fn[o] ?? "";
    const c = document.createElement("span");
    c.className = "emoji-completion-name", c.textContent = `:${o}:`, i.appendChild(a), i.appendChild(c), i.addEventListener("click", () => {
      t.dispatchEvent(
        new CustomEvent("emoji-autocomplete-pick", {
          bubbles: !0,
          detail: { name: o }
        })
      );
    }), t.appendChild(i);
  }
  return t;
}
function Yr() {
  return new G({
    view(e) {
      const t = (r) => {
        const o = r, i = ee.getState(e.state);
        i?.open && zt(e, o.detail.name, i);
      };
      return e.dom.addEventListener("emoji-autocomplete-pick", t), {
        destroy() {
          e.dom.removeEventListener("emoji-autocomplete-pick", t);
        }
      };
    }
  });
}
function Kr() {
  return new G({
    props: {
      handleClick(e, t, r) {
        const i = r.target?.closest(".emoji-glyph");
        if (!i) return !1;
        const a = Number(i.getAttribute("data-len") ?? "0");
        if (!a) return !1;
        const c = e.posAtDOM(i, 0);
        if (c < 0) return !1;
        const l = c + a;
        return l > e.state.doc.content.size ? !1 : (r.preventDefault(), e.dispatch(
          e.state.tr.setSelection(H.create(e.state.doc, l))
        ), e.focus(), !0);
      }
    }
  });
}
const Ur = (e) => {
  const t = document.createElement("span");
  return t.className = "emoji-glyph", t.textContent = e.glyph ?? "", e.len && t.setAttribute("data-len", e.len), t;
}, Wr = {
  name: "emoji",
  // No mark, no node — pure decoration. The source chars are valid plain
  // text in md (no escape needed for `:`), so serialization is automatic.
  // `bare` installs the core replacement rule with only the shortcode table
  // (no `:)`-style shortcuts; those must stay plain text).
  mdItPlugins: [(e) => e.use(qr, { defs: Fn, shortcuts: {} })],
  // Fallback for the legacy per-token load path: keep the source spelling.
  // 依赖 `shortcuts: {}`：shortcut 的 markup 是规范名而非源码短码，若启用
  // shortcuts 这里会把 `:)` 改写成 `:smile:`。
  parserTokens: {
    emoji: (e, t) => {
      e.addText(`:${t.markup}:`);
    }
  },
  plugins: () => [zr(), Yr(), Kr()],
  inline: {
    // 四个迁移特性（highlight / sub-sup / math / emoji）都是 `order: -1`，
    // 组内次序由注册序决定；emoji 的 span 是原子（无 mark），先认领先占用，
    // 其余特性不得再认领其区间。
    order: -1,
    derive: Pr,
    tokenAdvance: Dr,
    markNames: [],
    extRanges: () => [],
    decorationWidgets: { emoji: Ur }
  }
}, Vr = {
  id: "emoji",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Wr)]
}, Gr = [
  ["path", "M7 4h4l3 8 3-8h4"],
  ["line", 4, 16, 10, 16],
  ["circle", 18, 6, 2]
], Kn = /\[\^(\d+)\]/g;
function Xr(e) {
  let t = 0;
  return e.descendants((r) => {
    if (!r.isTextblock) return !0;
    const o = r.textContent;
    Kn.lastIndex = 0;
    let i;
    for (; i = Kn.exec(o); ) t = Math.max(t, parseInt(i[1], 10));
    return !0;
  }), t + 1;
}
const Qr = {
  id: "footnote",
  keyword: "footnote",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.footnote.label`）
  labelKey: "footnote.label",
  descriptionKey: "footnote.description",
  icon: Gr,
  defaultShortcut: "Cmd+Opt+F",
  category: "paragraph",
  order: 2,
  insert(e) {
    const t = e.state.schema, r = t.marks.footnote_ref;
    if (!r || !t.nodes.paragraph) return;
    const o = String(Xr(e.state.doc)), i = `[^${o}]`, { from: a, to: c } = e.state.selection, l = e.state.tr.insertText(i, a, c);
    l.addMark(a, a + i.length, r.create({ id: o }));
    const f = t.nodes.paragraph.create(null, t.text(`[^${o}]: `));
    l.insert(l.doc.content.size, f), e.dispatch(l), e.focus();
  }
};
function Zr(e, t, r, o) {
  const i = Number(e[t].meta.id + 1).toString();
  let a = "";
  return typeof o.docId == "string" && (a = `-${o.docId}-`), a + i;
}
function Jr(e, t) {
  let r = Number(e[t].meta.id + 1).toString();
  return e[t].meta.subId > 0 && (r += `:${e[t].meta.subId}`), `[${r}]`;
}
function eo(e, t, r, o, i) {
  const a = i.rules.footnote_anchor_name(e, t, r, o, i), c = i.rules.footnote_caption(e, t, r, o, i);
  let l = a;
  return e[t].meta.subId > 0 && (l += `:${e[t].meta.subId}`), `<sup class="footnote-ref"><a href="#fn${a}" id="fnref${l}">${c}</a></sup>`;
}
function no(e, t, r) {
  return (r.xhtmlOut ? `<hr class="footnotes-sep" />
` : `<hr class="footnotes-sep">
`) + `<section class="footnotes">
<ol class="footnotes-list">
`;
}
function to() {
  return `</ol>
</section>
`;
}
function ro(e, t, r, o, i) {
  let a = i.rules.footnote_anchor_name(e, t, r, o, i);
  return e[t].meta.subId > 0 && (a += `:${e[t].meta.subId}`), `<li id="fn${a}" class="footnote-item">`;
}
function oo() {
  return `</li>
`;
}
function io(e, t, r, o, i) {
  let a = i.rules.footnote_anchor_name(e, t, r, o, i);
  return e[t].meta.subId > 0 && (a += `:${e[t].meta.subId}`), ` <a href="#fnref${a}" class="footnote-backref">↩︎</a>`;
}
function lo(e) {
  const t = e.helpers.parseLinkLabel, r = e.utils.isSpace;
  e.renderer.rules.footnote_ref = eo, e.renderer.rules.footnote_block_open = no, e.renderer.rules.footnote_block_close = to, e.renderer.rules.footnote_open = ro, e.renderer.rules.footnote_close = oo, e.renderer.rules.footnote_anchor = io, e.renderer.rules.footnote_caption = Jr, e.renderer.rules.footnote_anchor_name = Zr;
  function o(l, f, u, d) {
    const p = l.bMarks[f] + l.tShift[f], h = l.eMarks[f];
    if (p + 4 > h || l.src.charCodeAt(p) !== 91 || l.src.charCodeAt(p + 1) !== 94) return !1;
    let b;
    for (b = p + 2; b < h; b++) {
      if (l.src.charCodeAt(b) === 32) return !1;
      if (l.src.charCodeAt(b) === 93)
        break;
    }
    if (b === p + 2 || b + 1 >= h || l.src.charCodeAt(++b) !== 58) return !1;
    if (d) return !0;
    b++, l.env.footnotes || (l.env.footnotes = {}), l.env.footnotes.refs || (l.env.footnotes.refs = {});
    const v = l.src.slice(p + 2, b - 2);
    l.env.footnotes.refs[`:${v}`] = -1;
    const M = new l.Token("footnote_reference_open", "", 1);
    M.meta = { label: v }, M.level = l.level++, l.tokens.push(M);
    const S = l.bMarks[f], O = l.tShift[f], P = l.sCount[f], B = l.parentType, R = b, W = l.sCount[f] + b - (l.bMarks[f] + l.tShift[f]);
    let te = W;
    for (; b < h; ) {
      const ue = l.src.charCodeAt(b);
      if (r(ue))
        ue === 9 ? te += 4 - te % 4 : te++;
      else
        break;
      b++;
    }
    l.tShift[f] = b - R, l.sCount[f] = te - W, l.bMarks[f] = R, l.blkIndent += 4, l.parentType = "footnote", l.sCount[f] < l.blkIndent && (l.sCount[f] += l.blkIndent), l.md.block.tokenize(l, f, u, !0), l.parentType = B, l.blkIndent -= 4, l.tShift[f] = O, l.sCount[f] = P, l.bMarks[f] = S;
    const pe = new l.Token("footnote_reference_close", "", -1);
    return pe.level = --l.level, l.tokens.push(pe), !0;
  }
  function i(l, f) {
    const u = l.posMax, d = l.pos;
    if (d + 2 >= u || l.src.charCodeAt(d) !== 94 || l.src.charCodeAt(d + 1) !== 91) return !1;
    const p = d + 2, h = t(l, d + 1);
    if (h < 0) return !1;
    if (!f) {
      l.env.footnotes || (l.env.footnotes = {}), l.env.footnotes.list || (l.env.footnotes.list = []);
      const b = l.env.footnotes.list.length, v = [];
      l.md.inline.parse(
        l.src.slice(p, h),
        l.md,
        l.env,
        v
      );
      const M = l.push("footnote_ref", "", 0);
      M.meta = { id: b }, l.env.footnotes.list[b] = {
        content: l.src.slice(p, h),
        tokens: v
      };
    }
    return l.pos = h + 1, l.posMax = u, !0;
  }
  function a(l, f) {
    const u = l.posMax, d = l.pos;
    if (d + 3 > u || !l.env.footnotes || !l.env.footnotes.refs || l.src.charCodeAt(d) !== 91 || l.src.charCodeAt(d + 1) !== 94) return !1;
    let p;
    for (p = d + 2; p < u; p++) {
      if (l.src.charCodeAt(p) === 32 || l.src.charCodeAt(p) === 10) return !1;
      if (l.src.charCodeAt(p) === 93)
        break;
    }
    if (p === d + 2 || p >= u) return !1;
    p++;
    const h = l.src.slice(d + 2, p - 1);
    if (typeof l.env.footnotes.refs[`:${h}`] > "u") return !1;
    if (!f) {
      l.env.footnotes.list || (l.env.footnotes.list = []);
      let b;
      l.env.footnotes.refs[`:${h}`] < 0 ? (b = l.env.footnotes.list.length, l.env.footnotes.list[b] = { label: h, count: 0 }, l.env.footnotes.refs[`:${h}`] = b) : b = l.env.footnotes.refs[`:${h}`];
      const v = l.env.footnotes.list[b].count;
      l.env.footnotes.list[b].count++;
      const M = l.push("footnote_ref", "", 0);
      M.meta = { id: b, subId: v, label: h };
    }
    return l.pos = p, l.posMax = u, !0;
  }
  function c(l) {
    let f, u, d, p = !1;
    const h = {};
    if (!l.env.footnotes || (l.tokens = l.tokens.filter(function(v) {
      return v.type === "footnote_reference_open" ? (p = !0, u = [], d = v.meta.label, !1) : v.type === "footnote_reference_close" ? (p = !1, h[":" + d] = u, !1) : (p && u.push(v), !p);
    }), !l.env.footnotes.list))
      return;
    const b = l.env.footnotes.list;
    l.tokens.push(new l.Token("footnote_block_open", "", 1));
    for (let v = 0, M = b.length; v < M; v++) {
      const S = new l.Token("footnote_open", "", 1);
      if (S.meta = { id: v, label: b[v].label }, l.tokens.push(S), b[v].tokens) {
        f = [];
        const B = new l.Token("paragraph_open", "p", 1);
        B.block = !0, f.push(B);
        const R = new l.Token("inline", "", 0);
        R.children = b[v].tokens, R.content = b[v].content, f.push(R);
        const W = new l.Token("paragraph_close", "p", -1);
        W.block = !0, f.push(W);
      } else b[v].label && (f = h[`:${b[v].label}`]);
      f && (l.tokens = l.tokens.concat(f));
      let O;
      l.tokens[l.tokens.length - 1].type === "paragraph_close" ? O = l.tokens.pop() : O = null;
      const P = b[v].count > 0 ? b[v].count : 1;
      for (let B = 0; B < P; B++) {
        const R = new l.Token("footnote_anchor", "", 0);
        R.meta = { id: v, subId: B, label: b[v].label }, l.tokens.push(R);
      }
      O && l.tokens.push(O), l.tokens.push(new l.Token("footnote_close", "", -1));
    }
    l.tokens.push(new l.Token("footnote_block_close", "", -1));
  }
  e.block.ruler.before("reference", "footnote_def", o, { alt: ["paragraph", "reference"] }), e.inline.ruler.after("image", "footnote_inline", i), e.inline.ruler.after("footnote_inline", "footnote_ref", a), e.core.ruler.after("inline", "footnote_tail", c);
}
const Ht = /^\[\^([^\]]+)\]:/;
function Un(e) {
  return e.type.name === "paragraph" && Ht.test(e.textContent);
}
function Wn(e) {
  const t = Ht.exec(e.textContent);
  return t ? t[1] : "";
}
function ao(e, t) {
  const r = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), o = new RegExp(`^\\[\\^${r}\\]:`), i = e.split(/(?<=\n)/), a = [];
  let c = 0;
  for (const u of i)
    a.push(c), c += u.length;
  const l = (u) => i[u].replace(/\r?\n$/, ""), f = (u) => /^( {4,}|\t)/.test(l(u));
  for (let u = 0; u < i.length; u++) {
    if (!o.test(i[u])) continue;
    const d = a[u];
    let p = u + 1;
    for (; p < i.length; ) {
      if (l(p).trim() === "") {
        let b = p + 1;
        for (; b < i.length && l(b).trim() === ""; ) b++;
        if (b < i.length && f(b)) {
          p = b;
          continue;
        }
        break;
      }
      if (f(p)) {
        p++;
        continue;
      }
      break;
    }
    const h = p < i.length ? a[p] : e.length;
    return { start: d, end: h, raw: e.slice(d, h) };
  }
  return null;
}
const so = {
  matches: Un,
  keyOf: Wn,
  collect(e, t) {
    const r = [];
    return t.forEach((o) => {
      if (!Un(o)) return;
      const i = Wn(o);
      if (!i) return;
      const a = ao(e, i);
      a && r.push({ ...a, key: i });
    }), r;
  },
  render(e, t) {
    return t(e);
  }
}, Vn = /\[\^(\d+)\]/g, In = /^\[\^(\d+)\]:\s*/, He = /* @__PURE__ */ new WeakMap();
function co(e, t) {
  const r = [];
  Vn.lastIndex = 0;
  let o;
  for (; o = Vn.exec(e); ) {
    const i = o.index, a = i + o[0].length, c = o[1];
    if (i === 0) continue;
    const l = i, f = i + 2, u = a - 1, d = a;
    let p = !1;
    for (let h = l; h < f; h++)
      if (t[h]) {
        p = !0;
        break;
      }
    if (!p) {
      for (let h = u; h < d; h++)
        if (t[h]) {
          p = !0;
          break;
        }
    }
    p || (We(t, i, a), r.push({
      type: "footnote_ref",
      from: i,
      to: a,
      openFrom: i,
      openTo: i,
      closeFrom: a,
      closeTo: a,
      wrap: !0,
      delimRanges: [
        { from: l, to: f },
        { from: u, to: d }
      ],
      attrs: { id: c }
    }));
  }
  return r;
}
function uo(e, t) {
  let r = !1;
  return e.doc.descendants((o) => {
    if (r) return !1;
    if (o.isText) {
      for (const i of o.marks)
        if (i.type.name === "footnote_ref" && i.attrs.id === t)
          return r = !0, !1;
    }
    return !0;
  }), r;
}
function fo(e, t) {
  let r = -1;
  e.state.doc.descendants((o, i) => o.type.name === "paragraph" && o.textContent.startsWith(`[^${t}]:`) ? (r = i + o.nodeSize - 1, !1) : !0), !(r < 0) && e.dispatch(e.state.tr.setSelection(H.near(e.state.doc.resolve(r))).scrollIntoView());
}
function po(e, t) {
  const r = e.state.schema.marks.footnote_ref;
  let o = -1;
  e.state.doc.descendants((i, a) => {
    const c = i.text;
    return c && i.isText && i.marks.some((l) => l.type === r && l.attrs.id === t) ? (o = a + c.length, !1) : !0;
  }), !(o < 0) && (e.dispatch(e.state.tr.setSelection(H.create(e.state.doc, o)).scrollIntoView()), e.focus());
}
function mo() {
  return new G({
    props: {
      decorations(e) {
        const t = [];
        return e.doc.descendants((r, o) => {
          if (r.type.name !== "paragraph") return !0;
          const i = r.textContent, a = In.exec(i);
          if (!a) return !0;
          const c = a[1], l = c.length, f = a[0].length, u = o + 1, d = u + i.length, p = e.selection.from, b = p >= u && p < d ? "syntax-hint" : "syntax-hidden";
          if (t.push(ne.inline(u, u + 2, { class: b })), t.push(ne.inline(u + 2 + l, u + f, { class: b })), t.push(ne.inline(u + 2, u + 2 + l, { class: "fn-def-num" })), uo(e, c)) {
            const v = document.createElement("span");
            v.className = "md-reverse-footnote-area", v.setAttribute("contenteditable", "false"), v.appendChild(document.createTextNode(" "));
            const M = document.createElement("a");
            M.className = "reversefootnote", M.setAttribute("href", "#"), M.setAttribute("title", "回到文档"), M.setAttribute("data-index", "0"), M.textContent = "↩", v.appendChild(M), t.push(ne.widget(o + r.nodeSize - 1, v, {
              side: 1,
              stopEvent: (S) => S.type !== "click"
            }));
          }
          return !0;
        }), t.length ? Q.create(e.doc, t) : Q.empty;
      }
    },
    view(e) {
      const t = (a) => {
        const c = a.target instanceof Element ? a.target : a.target.parentElement;
        if (!c) return;
        const l = c.closest("sup.footnote-ref");
        if (l && (a.metaKey || a.ctrlKey)) {
          a.preventDefault(), a.stopPropagation();
          const u = l.getAttribute("data-ref");
          u && fo(e, u);
          return;
        }
        const f = c.closest(".reversefootnote");
        if (f) {
          if (a.button !== 0) return;
          a.preventDefault(), a.stopPropagation();
          const u = f.closest("p");
          if (u) {
            const d = In.exec(u.textContent ?? "");
            d && po(e, d[1]);
          }
        }
      };
      let r = null;
      const o = (a) => {
        let c = "";
        return e.state.doc.descendants((l) => l.type.name === "paragraph" && l.textContent.startsWith(`[^${a}]:`) ? (c = l.textContent.replace(/^\[\^\d+\]:\s*/, ""), !1) : !0), c;
      }, i = (a) => {
        const c = a.target instanceof Element ? a.target : a.target.parentElement;
        if (!c) return;
        const l = c.closest("sup.footnote-ref");
        if (!l) {
          r?.remove(), r = null;
          return;
        }
        if (r) return;
        const f = l.getAttribute("data-ref");
        if (!f) return;
        const u = o(f);
        if (!u) return;
        const d = l.getBoundingClientRect(), p = document.createElement("div");
        p.className = "fn-tooltip", p.textContent = u, document.body.appendChild(p), p.style.top = `${d.bottom + 6}px`, p.style.left = `${d.left}px`, r = p;
      };
      return e.dom.addEventListener("mouseover", i), e.dom.addEventListener("mouseout", i), e.dom.addEventListener("mousedown", t, !0), {
        destroy() {
          e.dom.removeEventListener("mouseover", i), e.dom.removeEventListener("mouseout", i), e.dom.removeEventListener("mousedown", t, !0), r?.remove();
        }
      };
    }
  });
}
const ho = {
  name: "footnote",
  mdItPlugins: [(e) => e.use(lo)],
  marks: {
    footnote_ref: {
      attrs: { id: {} },
      inclusive: !1,
      parseDOM: [{ tag: "sup.footnote-ref", getAttrs: (e) => ({ id: e.getAttribute("data-ref") }) }],
      toDOM: (e) => ["sup", { class: "footnote-ref", "data-ref": e.attrs.id }, 0]
    }
  },
  parserTokens: {
    footnote_ref: (e, t, r) => {
      const o = String(t.meta?.label ?? t.content ?? "");
      o && (e.openMark(r.marks.footnote_ref.create({ id: o })), e.addText(`[^${o}]`), e.closeMarkType(r.marks.footnote_ref));
    },
    footnote_open: (e, t, r) => {
      const o = String(t.meta?.label ?? t.content ?? "");
      He.set(e, o), e.openNode(r.nodes.paragraph), e.addText(`[^${o}]: `);
    },
    footnote_close: (e, t, r) => {
      He.delete(e), e.closeNode();
    },
    paragraph_open: (e, t, r) => {
      He.get(e) || e.openNode(r.nodes.paragraph);
    },
    paragraph_close: (e, t, r) => {
      He.get(e) || e.closeNode();
    }
  },
  markDelims: {
    footnote_ref: { open: "", close: "" }
  },
  inline: {
    order: 1.1,
    derive: (e) => co(e.text, e.consumed),
    markNames: ["footnote_ref"],
    extRanges: (e) => {
      const t = [], r = e.type.schema.marks.footnote_ref;
      if (!r) return t;
      let o = -1, i = null;
      const a = (u) => {
        o < 0 || !i || (t.push([o, u]), o = -1, i = null);
      };
      let c = 0;
      e.forEach((u) => {
        if (u.isText) {
          const d = u.marks.find((p) => p.type === r) ?? null;
          d ? o < 0 ? (o = c, i = d) : i && !d.eq(i) && (a(c), o = c, i = d) : a(c);
        }
        c += u.nodeSize;
      }), a(c);
      const l = e.textContent, f = In.exec(l);
      return f && t.push([0, f[0].length]), t;
    }
  },
  plugins: () => [mo()],
  sourceVerbatim: so
}, _o = {
  id: "footnote",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(ho),
    e.registerExtension({
      id: "footnote.editor",
      insert: Qr,
      create() {
        return {};
      }
    })
  ]
}, rn = "view", On = "panel";
let ge = null;
function Gn(e) {
  ge = e;
}
function Yt() {
  return ge && ge.read() === "source" ? "source" : On;
}
function go(e) {
  return ge ? ge.subscribe((t) => e(t === "source" ? "source" : On)) : () => {
  };
}
async function bo(e) {
  await ge?.write(e);
}
const ko = 300;
function yo(e) {
  if (typeof e != "string") return null;
  const t = /^(\d{4}-\d{2}-\d{2})$/.exec(e.trim());
  return t ? t[1] : null;
}
function wo(e) {
  if (typeof e != "string") return null;
  const t = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/.exec(e.trim());
  return t ? `${t[1]}T${t[2]}` : null;
}
function xo(e, t) {
  const r = e.type === "text", o = r ? document.createElement("textarea") : document.createElement("input");
  o.className = "fm-input", r && (o.rows = 1);
  let i = "text", a = e.value == null ? "" : String(e.value);
  if (e.type === "number") {
    i = "number";
    const f = Number(e.value);
    a = e.value == null || e.value === "" || !Number.isFinite(f) ? "" : String(f);
  } else if (e.type === "date") {
    const f = yo(e.value);
    f !== null && (i = "date", a = f);
  } else if (e.type === "datetime") {
    const f = wo(e.value);
    f !== null && (i = "datetime-local", a = f);
  }
  if (r || (o.type = i), o.value = a, !r) {
    const f = o.value;
    a !== "" && f === "" && (i === "date" || i === "datetime-local") ? (a = e.value == null ? "" : String(e.value), o.type = "text", o.value = a) : a = f;
  }
  if (r) {
    const f = () => {
      o.style.height = "auto", o.style.height = `${o.scrollHeight}px`;
    };
    if (o.addEventListener("input", f), typeof requestAnimationFrame == "function" ? requestAnimationFrame(f) : f(), typeof ResizeObserver == "function") {
      let u = -1;
      const d = new ResizeObserver(() => {
        if (!o.isConnected) {
          d.disconnect();
          return;
        }
        o.clientWidth !== u && (u = o.clientWidth, f());
      });
      d.observe(o);
    }
  }
  const c = () => {
    if (o.value === a) return;
    let f = o.value;
    e.type === "number" && (f = o.value === "" ? null : Number(o.value)), a = o.value, t.commit(f);
  };
  let l;
  return o.addEventListener("input", (f) => {
    f.isComposing || (l !== void 0 && clearTimeout(l), l = setTimeout(c, ko));
  }), o.addEventListener("change", c), o.addEventListener("keydown", (f) => {
    const u = f;
    u.isComposing || u.keyCode === 229 || u.key === "Enter" && (u.preventDefault(), c(), t.onEnter?.());
  }), o;
}
function vo(e, t) {
  const r = document.createElement("input");
  return r.className = "fm-checkbox", r.type = "checkbox", r.checked = e.value === !0, r.addEventListener("change", () => t.commit(r.checked)), r;
}
function Ao(e, t) {
  const r = document.createElement("div");
  r.className = "fm-chips";
  const o = Array.isArray(e.value) ? e.value.map((c) => String(c)) : [], i = (c) => t.commit(c);
  o.forEach((c, l) => {
    const f = document.createElement("span");
    f.className = "fm-chip", f.textContent = c;
    const u = document.createElement("button");
    u.type = "button", u.className = "fm-chip-x", u.textContent = "×", u.addEventListener("mousedown", (d) => d.preventDefault()), u.addEventListener("click", () => i(o.filter((d, p) => p !== l))), f.appendChild(u), r.appendChild(f);
  });
  const a = document.createElement("input");
  return a.className = "fm-add-input", a.addEventListener("keydown", (c) => {
    const l = c;
    if (!(l.isComposing || l.keyCode === 229))
      if (l.key === "Enter") {
        l.preventDefault();
        const f = a.value.trim();
        if (f === "") {
          a.value = "", t.onEmptyEnter?.();
          return;
        }
        a.value = "", i([...o, f]);
      } else l.key === "Escape" && (l.preventDefault(), a.value = "");
  }), r.appendChild(a), r;
}
function So(e) {
  const t = document.createElement("code");
  return t.className = "fm-raw-value", t.textContent = e.raw, t;
}
function Eo(e, t) {
  return e.complex || e.type === "raw" ? So(e) : e.type === "boolean" ? vo(e, t) : e.type === "list" ? Ao(e, t) : xo(e, t);
}
function Co(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var K = {}, Ye = {}, ae = {}, Xn;
function Le() {
  if (Xn) return ae;
  Xn = 1;
  function e(c) {
    return typeof c > "u" || c === null;
  }
  function t(c) {
    return typeof c == "object" && c !== null;
  }
  function r(c) {
    return Array.isArray(c) ? c : e(c) ? [] : [c];
  }
  function o(c, l) {
    if (l) {
      const f = Object.keys(l);
      for (let u = 0, d = f.length; u < d; u += 1) {
        const p = f[u];
        c[p] = l[p];
      }
    }
    return c;
  }
  function i(c, l) {
    let f = "";
    for (let u = 0; u < l; u += 1)
      f += c;
    return f;
  }
  function a(c) {
    return c === 0 && Number.NEGATIVE_INFINITY === 1 / c;
  }
  return ae.isNothing = e, ae.isObject = t, ae.toArray = r, ae.repeat = i, ae.isNegativeZero = a, ae.extend = o, ae;
}
var on, Qn;
function Ie() {
  if (Qn) return on;
  Qn = 1;
  function e(r, o) {
    let i = "";
    const a = r.reason || "(unknown reason)";
    return r.mark ? (r.mark.name && (i += 'in "' + r.mark.name + '" '), i += "(" + (r.mark.line + 1) + ":" + (r.mark.column + 1) + ")", !o && r.mark.snippet && (i += `

` + r.mark.snippet), a + " " + i) : a;
  }
  function t(r, o) {
    Error.call(this), this.name = "YAMLException", this.reason = r, this.mark = o, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return t.prototype = Object.create(Error.prototype), t.prototype.constructor = t, t.prototype.toString = function(o) {
    return this.name + ": " + e(this, o);
  }, on = t, on;
}
var ln, Zn;
function To() {
  if (Zn) return ln;
  Zn = 1;
  const e = Le();
  function t(i, a, c, l, f) {
    let u = "", d = "";
    const p = Math.floor(f / 2) - 1;
    return l - a > p && (u = " ... ", a = l - p + u.length), c - l > p && (d = " ...", c = l + p - d.length), {
      str: u + i.slice(a, c).replace(/\t/g, "→") + d,
      pos: l - a + u.length
      // relative position
    };
  }
  function r(i, a) {
    return e.repeat(" ", a - i.length) + i;
  }
  function o(i, a) {
    if (a = Object.create(a || null), !i.buffer) return null;
    a.maxLength || (a.maxLength = 79), typeof a.indent != "number" && (a.indent = 1), typeof a.linesBefore != "number" && (a.linesBefore = 3), typeof a.linesAfter != "number" && (a.linesAfter = 2);
    const c = /\r?\n|\r|\0/g, l = [0], f = [];
    let u, d = -1;
    for (; u = c.exec(i.buffer); )
      f.push(u.index), l.push(u.index + u[0].length), i.position <= u.index && d < 0 && (d = l.length - 2);
    d < 0 && (d = l.length - 1);
    let p = "";
    const h = Math.min(i.line + a.linesAfter, f.length).toString().length, b = a.maxLength - (a.indent + h + 3);
    for (let M = 1; M <= a.linesBefore && !(d - M < 0); M++) {
      const S = t(
        i.buffer,
        l[d - M],
        f[d - M],
        i.position - (l[d] - l[d - M]),
        b
      );
      p = e.repeat(" ", a.indent) + r((i.line - M + 1).toString(), h) + " | " + S.str + `
` + p;
    }
    const v = t(i.buffer, l[d], f[d], i.position, b);
    p += e.repeat(" ", a.indent) + r((i.line + 1).toString(), h) + " | " + v.str + `
`, p += e.repeat("-", a.indent + h + 3 + v.pos) + `^
`;
    for (let M = 1; M <= a.linesAfter && !(d + M >= f.length); M++) {
      const S = t(
        i.buffer,
        l[d + M],
        f[d + M],
        i.position - (l[d] - l[d + M]),
        b
      );
      p += e.repeat(" ", a.indent) + r((i.line + M + 1).toString(), h) + " | " + S.str + `
`;
    }
    return p.replace(/\n$/, "");
  }
  return ln = o, ln;
}
var an, Jn;
function U() {
  if (Jn) return an;
  Jn = 1;
  const e = Ie(), t = [
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
  ], r = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function o(a) {
    const c = {};
    return a !== null && Object.keys(a).forEach(function(l) {
      a[l].forEach(function(f) {
        c[String(f)] = l;
      });
    }), c;
  }
  function i(a, c) {
    if (c = c || {}, Object.keys(c).forEach(function(l) {
      if (t.indexOf(l) === -1)
        throw new e('Unknown option "' + l + '" is met in definition of "' + a + '" YAML type.');
    }), this.options = c, this.tag = a, this.kind = c.kind || null, this.resolve = c.resolve || function() {
      return !0;
    }, this.construct = c.construct || function(l) {
      return l;
    }, this.instanceOf = c.instanceOf || null, this.predicate = c.predicate || null, this.represent = c.represent || null, this.representName = c.representName || null, this.defaultStyle = c.defaultStyle || null, this.multi = c.multi || !1, this.styleAliases = o(c.styleAliases || null), r.indexOf(this.kind) === -1)
      throw new e('Unknown kind "' + this.kind + '" is specified for "' + a + '" YAML type.');
  }
  return an = i, an;
}
var sn, et;
function Kt() {
  if (et) return sn;
  et = 1;
  const e = Ie(), t = U();
  function r(a, c) {
    const l = [];
    return a[c].forEach(function(f) {
      let u = l.length;
      l.forEach(function(d, p) {
        d.tag === f.tag && d.kind === f.kind && d.multi === f.multi && (u = p);
      }), l[u] = f;
    }), l;
  }
  function o() {
    const a = {
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
    function c(l) {
      l.multi ? (a.multi[l.kind].push(l), a.multi.fallback.push(l)) : a[l.kind][l.tag] = a.fallback[l.tag] = l;
    }
    for (let l = 0, f = arguments.length; l < f; l += 1)
      arguments[l].forEach(c);
    return a;
  }
  function i(a) {
    return this.extend(a);
  }
  return i.prototype.extend = function(c) {
    let l = [], f = [];
    if (c instanceof t)
      f.push(c);
    else if (Array.isArray(c))
      f = f.concat(c);
    else if (c && (Array.isArray(c.implicit) || Array.isArray(c.explicit)))
      c.implicit && (l = l.concat(c.implicit)), c.explicit && (f = f.concat(c.explicit));
    else
      throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    l.forEach(function(d) {
      if (!(d instanceof t))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (d.loadKind && d.loadKind !== "scalar")
        throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (d.multi)
        throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), f.forEach(function(d) {
      if (!(d instanceof t))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    const u = Object.create(i.prototype);
    return u.implicit = (this.implicit || []).concat(l), u.explicit = (this.explicit || []).concat(f), u.compiledImplicit = r(u, "implicit"), u.compiledExplicit = r(u, "explicit"), u.compiledTypeMap = o(u.compiledImplicit, u.compiledExplicit), u;
  }, sn = i, sn;
}
var cn, nt;
function Ut() {
  if (nt) return cn;
  nt = 1;
  const e = U();
  return cn = new e("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(t) {
      return t !== null ? t : "";
    }
  }), cn;
}
var un, tt;
function Wt() {
  if (tt) return un;
  tt = 1;
  const e = U();
  return un = new e("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(t) {
      return t !== null ? t : [];
    }
  }), un;
}
var fn, rt;
function Vt() {
  if (rt) return fn;
  rt = 1;
  const e = U();
  return fn = new e("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(t) {
      return t !== null ? t : {};
    }
  }), fn;
}
var dn, ot;
function Gt() {
  if (ot) return dn;
  ot = 1;
  const e = Kt();
  return dn = new e({
    explicit: [
      Ut(),
      Wt(),
      Vt()
    ]
  }), dn;
}
var pn, it;
function Xt() {
  if (it) return pn;
  it = 1;
  const e = U();
  function t(i) {
    if (i === null) return !0;
    const a = i.length;
    return a === 1 && i === "~" || a === 4 && (i === "null" || i === "Null" || i === "NULL");
  }
  function r() {
    return null;
  }
  function o(i) {
    return i === null;
  }
  return pn = new e("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: t,
    construct: r,
    predicate: o,
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
  }), pn;
}
var mn, lt;
function Qt() {
  if (lt) return mn;
  lt = 1;
  const e = U();
  function t(i) {
    if (i === null) return !1;
    const a = i.length;
    return a === 4 && (i === "true" || i === "True" || i === "TRUE") || a === 5 && (i === "false" || i === "False" || i === "FALSE");
  }
  function r(i) {
    return i === "true" || i === "True" || i === "TRUE";
  }
  function o(i) {
    return Object.prototype.toString.call(i) === "[object Boolean]";
  }
  return mn = new e("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: t,
    construct: r,
    predicate: o,
    represent: {
      lowercase: function(i) {
        return i ? "true" : "false";
      },
      uppercase: function(i) {
        return i ? "TRUE" : "FALSE";
      },
      camelcase: function(i) {
        return i ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), mn;
}
var hn, at;
function Zt() {
  if (at) return hn;
  at = 1;
  const e = Le(), t = U();
  function r(u) {
    return u >= 48 && u <= 57 || u >= 65 && u <= 70 || u >= 97 && u <= 102;
  }
  function o(u) {
    return u >= 48 && u <= 55;
  }
  function i(u) {
    return u >= 48 && u <= 57;
  }
  function a(u) {
    if (u === null) return !1;
    const d = u.length;
    let p = 0, h = !1;
    if (!d) return !1;
    let b = u[p];
    if ((b === "-" || b === "+") && (b = u[++p]), b === "0") {
      if (p + 1 === d) return !0;
      if (b = u[++p], b === "b") {
        for (p++; p < d; p++) {
          if (b = u[p], b !== "0" && b !== "1") return !1;
          h = !0;
        }
        return h && isFinite(c(u));
      }
      if (b === "x") {
        for (p++; p < d; p++) {
          if (!r(u.charCodeAt(p))) return !1;
          h = !0;
        }
        return h && isFinite(c(u));
      }
      if (b === "o") {
        for (p++; p < d; p++) {
          if (!o(u.charCodeAt(p))) return !1;
          h = !0;
        }
        return h && isFinite(c(u));
      }
    }
    for (; p < d; p++) {
      if (!i(u.charCodeAt(p)))
        return !1;
      h = !0;
    }
    return h ? isFinite(c(u)) : !1;
  }
  function c(u) {
    let d = u, p = 1, h = d[0];
    if ((h === "-" || h === "+") && (h === "-" && (p = -1), d = d.slice(1), h = d[0]), d === "0") return 0;
    if (h === "0") {
      if (d[1] === "b") return p * parseInt(d.slice(2), 2);
      if (d[1] === "x") return p * parseInt(d.slice(2), 16);
      if (d[1] === "o") return p * parseInt(d.slice(2), 8);
    }
    return p * parseInt(d, 10);
  }
  function l(u) {
    return c(u);
  }
  function f(u) {
    return Object.prototype.toString.call(u) === "[object Number]" && u % 1 === 0 && !e.isNegativeZero(u);
  }
  return hn = new t("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: a,
    construct: l,
    predicate: f,
    represent: {
      binary: function(u) {
        return u >= 0 ? "0b" + u.toString(2) : "-0b" + u.toString(2).slice(1);
      },
      octal: function(u) {
        return u >= 0 ? "0o" + u.toString(8) : "-0o" + u.toString(8).slice(1);
      },
      decimal: function(u) {
        return u.toString(10);
      },
      hexadecimal: function(u) {
        return u >= 0 ? "0x" + u.toString(16).toUpperCase() : "-0x" + u.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), hn;
}
var _n, st;
function Jt() {
  if (st) return _n;
  st = 1;
  const e = Le(), t = U(), r = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  ), o = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function i(u) {
    return u === null || !r.test(u) ? !1 : isFinite(parseFloat(u, 10)) ? !0 : o.test(u);
  }
  function a(u) {
    let d = u.toLowerCase();
    const p = d[0] === "-" ? -1 : 1;
    return "+-".indexOf(d[0]) >= 0 && (d = d.slice(1)), d === ".inf" ? p === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : d === ".nan" ? NaN : p * parseFloat(d, 10);
  }
  const c = /^[-+]?[0-9]+e/;
  function l(u, d) {
    if (isNaN(u))
      switch (d) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === u)
      switch (d) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === u)
      switch (d) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (e.isNegativeZero(u))
      return "-0.0";
    const p = u.toString(10);
    return c.test(p) ? p.replace("e", ".e") : p;
  }
  function f(u) {
    return Object.prototype.toString.call(u) === "[object Number]" && (u % 1 !== 0 || e.isNegativeZero(u));
  }
  return _n = new t("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: i,
    construct: a,
    predicate: f,
    represent: l,
    defaultStyle: "lowercase"
  }), _n;
}
var gn, ct;
function er() {
  return ct || (ct = 1, gn = Gt().extend({
    implicit: [
      Xt(),
      Qt(),
      Zt(),
      Jt()
    ]
  })), gn;
}
var bn, ut;
function nr() {
  return ut || (ut = 1, bn = er()), bn;
}
var kn, ft;
function tr() {
  if (ft) return kn;
  ft = 1;
  const e = U(), t = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), r = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function o(c) {
    return c === null ? !1 : t.exec(c) !== null || r.exec(c) !== null;
  }
  function i(c) {
    let l = 0, f = null, u = t.exec(c);
    if (u === null && (u = r.exec(c)), u === null) throw new Error("Date resolve error");
    const d = +u[1], p = +u[2] - 1, h = +u[3];
    if (!u[4])
      return new Date(Date.UTC(d, p, h));
    const b = +u[4], v = +u[5], M = +u[6];
    if (u[7]) {
      for (l = u[7].slice(0, 3); l.length < 3; )
        l += "0";
      l = +l;
    }
    if (u[9]) {
      const O = +u[10], P = +(u[11] || 0);
      f = (O * 60 + P) * 6e4, u[9] === "-" && (f = -f);
    }
    const S = new Date(Date.UTC(d, p, h, b, v, M, l));
    return f && S.setTime(S.getTime() - f), S;
  }
  function a(c) {
    return c.toISOString();
  }
  return kn = new e("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: o,
    construct: i,
    instanceOf: Date,
    represent: a
  }), kn;
}
var yn, dt;
function rr() {
  if (dt) return yn;
  dt = 1;
  const e = U();
  function t(r) {
    return r === "<<" || r === null;
  }
  return yn = new e("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: t
  }), yn;
}
var wn, pt;
function or() {
  if (pt) return wn;
  pt = 1;
  const e = U(), t = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function r(c) {
    if (c === null) return !1;
    let l = 0;
    const f = c.length, u = t;
    for (let d = 0; d < f; d++) {
      const p = u.indexOf(c.charAt(d));
      if (!(p > 64)) {
        if (p < 0) return !1;
        l += 6;
      }
    }
    return l % 8 === 0;
  }
  function o(c) {
    const l = c.replace(/[\r\n=]/g, ""), f = l.length, u = t;
    let d = 0;
    const p = [];
    for (let b = 0; b < f; b++)
      b % 4 === 0 && b && (p.push(d >> 16 & 255), p.push(d >> 8 & 255), p.push(d & 255)), d = d << 6 | u.indexOf(l.charAt(b));
    const h = f % 4 * 6;
    return h === 0 ? (p.push(d >> 16 & 255), p.push(d >> 8 & 255), p.push(d & 255)) : h === 18 ? (p.push(d >> 10 & 255), p.push(d >> 2 & 255)) : h === 12 && p.push(d >> 4 & 255), new Uint8Array(p);
  }
  function i(c) {
    let l = "", f = 0;
    const u = c.length, d = t;
    for (let h = 0; h < u; h++)
      h % 3 === 0 && h && (l += d[f >> 18 & 63], l += d[f >> 12 & 63], l += d[f >> 6 & 63], l += d[f & 63]), f = (f << 8) + c[h];
    const p = u % 3;
    return p === 0 ? (l += d[f >> 18 & 63], l += d[f >> 12 & 63], l += d[f >> 6 & 63], l += d[f & 63]) : p === 2 ? (l += d[f >> 10 & 63], l += d[f >> 4 & 63], l += d[f << 2 & 63], l += d[64]) : p === 1 && (l += d[f >> 2 & 63], l += d[f << 4 & 63], l += d[64], l += d[64]), l;
  }
  function a(c) {
    return Object.prototype.toString.call(c) === "[object Uint8Array]";
  }
  return wn = new e("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: r,
    construct: o,
    predicate: a,
    represent: i
  }), wn;
}
var xn, mt;
function ir() {
  if (mt) return xn;
  mt = 1;
  const e = U(), t = Object.prototype.hasOwnProperty, r = Object.prototype.toString;
  function o(a) {
    if (a === null) return !0;
    const c = {}, l = a;
    for (let f = 0, u = l.length; f < u; f += 1) {
      const d = l[f];
      let p = !1;
      if (r.call(d) !== "[object Object]") return !1;
      let h;
      for (h in d)
        if (t.call(d, h))
          if (!p) p = !0;
          else return !1;
      if (!p || t.call(c, h)) return !1;
      Object.defineProperty(c, h, { value: !0 });
    }
    return !0;
  }
  function i(a) {
    return a !== null ? a : [];
  }
  return xn = new e("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: o,
    construct: i
  }), xn;
}
var vn, ht;
function lr() {
  if (ht) return vn;
  ht = 1;
  const e = U(), t = Object.prototype.toString;
  function r(i) {
    if (i === null) return !0;
    const a = i, c = new Array(a.length);
    for (let l = 0, f = a.length; l < f; l += 1) {
      const u = a[l];
      if (t.call(u) !== "[object Object]") return !1;
      const d = Object.keys(u);
      if (d.length !== 1) return !1;
      c[l] = [d[0], u[d[0]]];
    }
    return !0;
  }
  function o(i) {
    if (i === null) return [];
    const a = i, c = new Array(a.length);
    for (let l = 0, f = a.length; l < f; l += 1) {
      const u = a[l], d = Object.keys(u);
      c[l] = [d[0], u[d[0]]];
    }
    return c;
  }
  return vn = new e("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: r,
    construct: o
  }), vn;
}
var An, _t;
function ar() {
  if (_t) return An;
  _t = 1;
  const e = U(), t = Object.prototype.hasOwnProperty;
  function r(i) {
    if (i === null) return !0;
    const a = i;
    for (const c in a)
      if (t.call(a, c) && a[c] !== null)
        return !1;
    return !0;
  }
  function o(i) {
    return i !== null ? i : {};
  }
  return An = new e("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: r,
    construct: o
  }), An;
}
var Sn, gt;
function Dn() {
  return gt || (gt = 1, Sn = nr().extend({
    implicit: [
      tr(),
      rr()
    ],
    explicit: [
      or(),
      ir(),
      lr(),
      ar()
    ]
  })), Sn;
}
var bt;
function Mo() {
  if (bt) return Ye;
  bt = 1;
  const e = Le(), t = Ie(), r = To(), o = Dn(), i = Object.prototype.hasOwnProperty, a = 1, c = 2, l = 3, f = 4, u = 1, d = 2, p = 3, h = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, b = /[\x85\u2028\u2029]/, v = /[,\[\]{}]/, M = /^(?:!|!!|![0-9A-Za-z-]+!)$/, S = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function O(n) {
    return Object.prototype.toString.call(n);
  }
  function P(n) {
    return n === 10 || n === 13;
  }
  function B(n) {
    return n === 9 || n === 32;
  }
  function R(n) {
    return n === 9 || n === 32 || n === 10 || n === 13;
  }
  function W(n) {
    return n === 44 || n === 91 || n === 93 || n === 123 || n === 125;
  }
  function te(n) {
    if (n >= 48 && n <= 57)
      return n - 48;
    const m = n | 32;
    return m >= 97 && m <= 102 ? m - 97 + 10 : -1;
  }
  function pe(n) {
    return n === 120 ? 2 : n === 117 ? 4 : n === 85 ? 8 : 0;
  }
  function ue(n) {
    return n >= 48 && n <= 57 ? n - 48 : -1;
  }
  function be(n) {
    switch (n) {
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
  function Ge(n) {
    return n <= 65535 ? String.fromCharCode(n) : String.fromCharCode(
      (n - 65536 >> 10) + 55296,
      (n - 65536 & 1023) + 56320
    );
  }
  function ke(n, m, w) {
    m === "__proto__" ? Object.defineProperty(n, m, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: w
    }) : n[m] = w;
  }
  const Oe = new Array(256), ye = new Array(256);
  for (let n = 0; n < 256; n++)
    Oe[n] = be(n) ? 1 : 0, ye[n] = be(n);
  function Y(n, m) {
    this.input = n, this.filename = m.filename || null, this.schema = m.schema || o, this.onWarning = m.onWarning || null, this.legacy = m.legacy || !1, this.json = m.json || !1, this.listener = m.listener || null, this.maxDepth = typeof m.maxDepth == "number" ? m.maxDepth : 100, this.maxTotalMergeKeys = typeof m.maxTotalMergeKeys == "number" ? m.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = n.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
  }
  function Ne(n, m) {
    const w = {
      name: n.filename,
      buffer: n.input.slice(0, -1),
      // omit trailing \0
      position: n.position,
      line: n.line,
      column: n.position - n.lineStart
    };
    return w.snippet = r(w), new t(m, w);
  }
  function I(n, m) {
    throw Ne(n, m);
  }
  function me(n, m) {
    n.onWarning && n.onWarning.call(null, Ne(n, m));
  }
  function Z(n, m, w) {
    const x = n.anchorMapTransactions;
    if (x.length !== 0) {
      const k = x[x.length - 1];
      i.call(k, m) || (k[m] = {
        existed: i.call(n.anchorMap, m),
        value: n.anchorMap[m]
      });
    }
    n.anchorMap[m] = w;
  }
  function Xe(n) {
    n.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function fe(n) {
    const m = n.anchorMapTransactions.pop(), w = n.anchorMapTransactions;
    if (w.length === 0) return;
    const x = w[w.length - 1], k = Object.keys(m);
    for (let s = 0, _ = k.length; s < _; s += 1) {
      const g = k[s];
      i.call(x, g) || (x[g] = m[g]);
    }
  }
  function Qe(n) {
    const m = n.anchorMapTransactions.pop(), w = Object.keys(m);
    for (let x = w.length - 1; x >= 0; x -= 1) {
      const k = m[w[x]];
      k.existed ? n.anchorMap[w[x]] = k.value : delete n.anchorMap[w[x]];
    }
  }
  function we(n) {
    return {
      position: n.position,
      line: n.line,
      lineStart: n.lineStart,
      lineIndent: n.lineIndent,
      firstTabInLine: n.firstTabInLine,
      tag: n.tag,
      anchor: n.anchor,
      kind: n.kind,
      result: n.result
    };
  }
  function he(n, m) {
    n.position = m.position, n.line = m.line, n.lineStart = m.lineStart, n.lineIndent = m.lineIndent, n.firstTabInLine = m.firstTabInLine, n.tag = m.tag, n.anchor = m.anchor, n.kind = m.kind, n.result = m.result;
  }
  const $e = {
    YAML: function(m, w, x) {
      m.version !== null && I(m, "duplication of %YAML directive"), x.length !== 1 && I(m, "YAML directive accepts exactly one argument");
      const k = /^([0-9]+)\.([0-9]+)$/.exec(x[0]);
      k === null && I(m, "ill-formed argument of the YAML directive");
      const s = parseInt(k[1], 10), _ = parseInt(k[2], 10);
      s !== 1 && I(m, "unacceptable YAML version of the document"), m.version = x[0], m.checkLineBreaks = _ < 2, _ !== 1 && _ !== 2 && me(m, "unsupported YAML version of the document");
    },
    TAG: function(m, w, x) {
      let k;
      x.length !== 2 && I(m, "TAG directive accepts exactly two arguments");
      const s = x[0];
      k = x[1], M.test(s) || I(m, "ill-formed tag handle (first argument) of the TAG directive"), i.call(m.tagMap, s) && I(m, 'there is a previously declared suffix for "' + s + '" tag handle'), S.test(k) || I(m, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        k = decodeURIComponent(k);
      } catch {
        I(m, "tag prefix is malformed: " + k);
      }
      m.tagMap[s] = k;
    }
  };
  function V(n, m, w, x) {
    if (m < w) {
      const k = n.input.slice(m, w);
      if (x)
        for (let s = 0, _ = k.length; s < _; s += 1) {
          const g = k.charCodeAt(s);
          g === 9 || g >= 32 && g <= 1114111 || I(n, "expected valid JSON character");
        }
      else h.test(k) && I(n, "the stream contains non-printable characters");
      n.result += k;
    }
  }
  function re(n) {
    n.totalMergeKeys++, n.maxTotalMergeKeys !== -1 && n.totalMergeKeys > n.maxTotalMergeKeys && I(n, "merge keys exceeded maxTotalMergeKeys (" + n.maxTotalMergeKeys + ")");
  }
  function xe(n, m, w, x) {
    e.isObject(w) || I(n, "cannot merge mappings; the provided source object is unacceptable"), re(n);
    const k = Object.keys(w);
    for (let s = 0, _ = k.length; s < _; s += 1) {
      const g = k[s];
      re(n), i.call(m, g) || (ke(m, g, w[g]), x[g] = !0);
    }
  }
  function J(n, m, w, x, k, s, _, g, A) {
    if (Array.isArray(k)) {
      k = Array.prototype.slice.call(k);
      for (let E = 0, C = k.length; E < C; E += 1)
        Array.isArray(k[E]) && I(n, "nested arrays are not supported inside keys"), typeof k == "object" && O(k[E]) === "[object Object]" && (k[E] = "[object Object]");
    }
    if (typeof k == "object" && O(k) === "[object Object]" && (k = "[object Object]"), k = String(k), m === null && (m = {}), x === "tag:yaml.org,2002:merge")
      if (Array.isArray(s)) {
        s.length > 100 && I(n, "abnormal merge sequence size");
        for (let E = 0, C = s.length; E < C; E += 1)
          xe(n, m, s[E], w);
      } else
        xe(n, m, s, w);
    else
      !n.json && !i.call(w, k) && i.call(m, k) && (n.line = _ || n.line, n.lineStart = g || n.lineStart, n.position = A || n.position, I(n, "duplicated mapping key")), ke(m, k, s), delete w[k];
    return m;
  }
  function ve(n) {
    const m = n.input.charCodeAt(n.position);
    m === 10 ? n.position++ : m === 13 ? (n.position++, n.input.charCodeAt(n.position) === 10 && n.position++) : I(n, "a line break is expected"), n.line += 1, n.lineStart = n.position, n.firstTabInLine = -1;
  }
  function z(n, m, w) {
    let x = 0, k = n.input.charCodeAt(n.position);
    for (; k !== 0; ) {
      for (; B(k); )
        k === 9 && n.firstTabInLine === -1 && (n.firstTabInLine = n.position), k = n.input.charCodeAt(++n.position);
      if (m && k === 35)
        do
          k = n.input.charCodeAt(++n.position);
        while (k !== 10 && k !== 13 && k !== 0);
      if (P(k))
        for (ve(n), k = n.input.charCodeAt(n.position), x++, n.lineIndent = 0; k === 32; )
          n.lineIndent++, k = n.input.charCodeAt(++n.position);
      else
        break;
    }
    return w !== -1 && x !== 0 && n.lineIndent < w && me(n, "deficient indentation"), x;
  }
  function X(n) {
    let m = n.position, w = n.input.charCodeAt(m);
    return !!((w === 45 || w === 46) && w === n.input.charCodeAt(m + 1) && w === n.input.charCodeAt(m + 2) && (m += 3, w = n.input.charCodeAt(m), w === 0 || R(w)));
  }
  function _e(n, m) {
    m === 1 ? n.result += " " : m > 1 && (n.result += e.repeat(`
`, m - 1));
  }
  function Re(n, m, w) {
    let x, k, s, _, g, A;
    const E = n.kind, C = n.result;
    let y = n.input.charCodeAt(n.position);
    if (R(y) || W(y) || y === 35 || y === 38 || y === 42 || y === 33 || y === 124 || y === 62 || y === 39 || y === 34 || y === 37 || y === 64 || y === 96)
      return !1;
    if (y === 63 || y === 45) {
      const T = n.input.charCodeAt(n.position + 1);
      if (R(T) || w && W(T))
        return !1;
    }
    for (n.kind = "scalar", n.result = "", x = k = n.position, s = !1; y !== 0; ) {
      if (y === 58) {
        const T = n.input.charCodeAt(n.position + 1);
        if (R(T) || w && W(T))
          break;
      } else if (y === 35) {
        const T = n.input.charCodeAt(n.position - 1);
        if (R(T))
          break;
      } else {
        if (n.position === n.lineStart && X(n) || w && W(y))
          break;
        if (P(y))
          if (_ = n.line, g = n.lineStart, A = n.lineIndent, z(n, !1, -1), n.lineIndent >= m) {
            s = !0, y = n.input.charCodeAt(n.position);
            continue;
          } else {
            n.position = k, n.line = _, n.lineStart = g, n.lineIndent = A;
            break;
          }
      }
      s && (V(n, x, k, !1), _e(n, n.line - _), x = k = n.position, s = !1), B(y) || (k = n.position + 1), y = n.input.charCodeAt(++n.position);
    }
    return V(n, x, k, !1), n.result ? !0 : (n.kind = E, n.result = C, !1);
  }
  function Ae(n, m) {
    let w, x, k = n.input.charCodeAt(n.position);
    if (k !== 39)
      return !1;
    for (n.kind = "scalar", n.result = "", n.position++, w = x = n.position; (k = n.input.charCodeAt(n.position)) !== 0; )
      if (k === 39)
        if (V(n, w, n.position, !0), k = n.input.charCodeAt(++n.position), k === 39)
          w = n.position, n.position++, x = n.position;
        else
          return !0;
      else P(k) ? (V(n, w, x, !0), _e(n, z(n, !1, m)), w = x = n.position) : n.position === n.lineStart && X(n) ? I(n, "unexpected end of the document within a single quoted scalar") : (n.position++, B(k) || (x = n.position));
    I(n, "unexpected end of the stream within a single quoted scalar");
  }
  function qe(n, m) {
    let w, x, k, s = n.input.charCodeAt(n.position);
    if (s !== 34)
      return !1;
    for (n.kind = "scalar", n.result = "", n.position++, w = x = n.position; (s = n.input.charCodeAt(n.position)) !== 0; ) {
      if (s === 34)
        return V(n, w, n.position, !0), n.position++, !0;
      if (s === 92) {
        if (V(n, w, n.position, !0), s = n.input.charCodeAt(++n.position), P(s))
          z(n, !1, m);
        else if (s < 256 && Oe[s])
          n.result += ye[s], n.position++;
        else if ((k = pe(s)) > 0) {
          let _ = k, g = 0;
          for (; _ > 0; _--)
            s = n.input.charCodeAt(++n.position), (k = te(s)) >= 0 ? g = (g << 4) + k : I(n, "expected hexadecimal character");
          n.result += Ge(g), n.position++;
        } else
          I(n, "unknown escape sequence");
        w = x = n.position;
      } else P(s) ? (V(n, w, x, !0), _e(n, z(n, !1, m)), w = x = n.position) : n.position === n.lineStart && X(n) ? I(n, "unexpected end of the document within a double quoted scalar") : (n.position++, B(s) || (x = n.position));
    }
    I(n, "unexpected end of the stream within a double quoted scalar");
  }
  function Fe(n, m) {
    let w = !0, x, k, s;
    const _ = n.tag;
    let g;
    const A = n.anchor;
    let E, C, y, T;
    const L = /* @__PURE__ */ Object.create(null);
    let N, $, F, D = n.input.charCodeAt(n.position);
    if (D === 91)
      E = 93, T = !1, g = [];
    else if (D === 123)
      E = 125, T = !0, g = {};
    else
      return !1;
    for (n.anchor !== null && Z(n, n.anchor, g), D = n.input.charCodeAt(++n.position); D !== 0; ) {
      if (z(n, !0, m), D = n.input.charCodeAt(n.position), D === E)
        return n.position++, n.tag = _, n.anchor = A, n.kind = T ? "mapping" : "sequence", n.result = g, !0;
      if (w ? D === 44 && I(n, "expected the node content, but found ','") : I(n, "missed comma between flow collection entries"), $ = N = F = null, C = y = !1, D === 63) {
        const le = n.input.charCodeAt(n.position + 1);
        R(le) && (C = y = !0, n.position++, z(n, !0, m));
      }
      x = n.line, k = n.lineStart, s = n.position, ie(n, m, a, !1, !0), $ = n.tag, N = n.result, z(n, !0, m), D = n.input.charCodeAt(n.position), (y || n.line === x) && D === 58 && (C = !0, D = n.input.charCodeAt(++n.position), z(n, !0, m), ie(n, m, a, !1, !0), F = n.result), T ? J(n, g, L, $, N, F, x, k, s) : C ? g.push(J(n, null, L, $, N, F, x, k, s)) : g.push(N), z(n, !0, m), D = n.input.charCodeAt(n.position), D === 44 ? (w = !0, D = n.input.charCodeAt(++n.position)) : w = !1;
    }
    I(n, "unexpected end of the stream within a flow collection");
  }
  function oe(n, m) {
    let w, x = u, k = !1, s = !1, _ = m, g = 0, A = !1, E, C = n.input.charCodeAt(n.position);
    if (C === 124)
      w = !1;
    else if (C === 62)
      w = !0;
    else
      return !1;
    for (n.kind = "scalar", n.result = ""; C !== 0; )
      if (C = n.input.charCodeAt(++n.position), C === 43 || C === 45)
        u === x ? x = C === 43 ? p : d : I(n, "repeat of a chomping mode identifier");
      else if ((E = ue(C)) >= 0)
        E === 0 ? I(n, "bad explicit indentation width of a block scalar; it cannot be less than one") : s ? I(n, "repeat of an indentation width identifier") : (_ = m + E - 1, s = !0);
      else
        break;
    if (B(C)) {
      do
        C = n.input.charCodeAt(++n.position);
      while (B(C));
      if (C === 35)
        do
          C = n.input.charCodeAt(++n.position);
        while (!P(C) && C !== 0);
    }
    for (; C !== 0; ) {
      for (ve(n), n.lineIndent = 0, C = n.input.charCodeAt(n.position); (!s || n.lineIndent < _) && C === 32; )
        n.lineIndent++, C = n.input.charCodeAt(++n.position);
      if (!s && n.lineIndent > _ && (_ = n.lineIndent), P(C)) {
        g++;
        continue;
      }
      if (!s && _ === 0 && I(n, "missing indentation for block scalar"), n.lineIndent < _) {
        x === p ? n.result += e.repeat(`
`, k ? 1 + g : g) : x === u && k && (n.result += `
`);
        break;
      }
      w ? B(C) ? (A = !0, n.result += e.repeat(`
`, k ? 1 + g : g)) : A ? (A = !1, n.result += e.repeat(`
`, g + 1)) : g === 0 ? k && (n.result += " ") : n.result += e.repeat(`
`, g) : n.result += e.repeat(`
`, k ? 1 + g : g), k = !0, s = !0, g = 0;
      const y = n.position;
      for (; !P(C) && C !== 0; )
        C = n.input.charCodeAt(++n.position);
      V(n, y, n.position, !1);
    }
    return !0;
  }
  function De(n, m) {
    const w = n.tag, x = n.anchor, k = [];
    let s = !1;
    if (n.firstTabInLine !== -1) return !1;
    n.anchor !== null && Z(n, n.anchor, k);
    let _ = n.input.charCodeAt(n.position);
    for (; _ !== 0 && (n.firstTabInLine !== -1 && (n.position = n.firstTabInLine, I(n, "tab characters must not be used in indentation")), _ === 45); ) {
      const g = n.input.charCodeAt(n.position + 1);
      if (!R(g))
        break;
      if (s = !0, n.position++, z(n, !0, -1) && n.lineIndent <= m) {
        k.push(null), _ = n.input.charCodeAt(n.position);
        continue;
      }
      const A = n.line;
      if (ie(n, m, l, !1, !0), k.push(n.result), z(n, !0, -1), _ = n.input.charCodeAt(n.position), (n.line === A || n.lineIndent > m) && _ !== 0)
        I(n, "bad indentation of a sequence entry");
      else if (n.lineIndent < m)
        break;
    }
    return s ? (n.tag = w, n.anchor = x, n.kind = "sequence", n.result = k, !0) : !1;
  }
  function Pe(n, m, w) {
    let x, k, s, _;
    const g = n.tag, A = n.anchor, E = {}, C = /* @__PURE__ */ Object.create(null);
    let y = null, T = null, L = null, N = !1, $ = !1;
    if (n.firstTabInLine !== -1) return !1;
    n.anchor !== null && Z(n, n.anchor, E);
    let F = n.input.charCodeAt(n.position);
    for (; F !== 0; ) {
      !N && n.firstTabInLine !== -1 && (n.position = n.firstTabInLine, I(n, "tab characters must not be used in indentation"));
      const D = n.input.charCodeAt(n.position + 1), le = n.line;
      if ((F === 63 || F === 58) && R(D))
        F === 63 ? (N && (J(n, E, C, y, T, null, k, s, _), y = T = L = null), $ = !0, N = !0, x = !0) : N ? (N = !1, x = !0) : I(n, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), n.position += 1, F = D;
      else {
        if (k = n.line, s = n.lineStart, _ = n.position, !ie(n, w, c, !1, !0))
          break;
        if (n.line === le) {
          for (F = n.input.charCodeAt(n.position); B(F); )
            F = n.input.charCodeAt(++n.position);
          if (F === 58)
            F = n.input.charCodeAt(++n.position), R(F) || I(n, "a whitespace character is expected after the key-value separator within a block mapping"), N && (J(n, E, C, y, T, null, k, s, _), y = T = L = null), $ = !0, N = !1, x = !1, y = n.tag, T = n.result;
          else if ($)
            I(n, "can not read an implicit mapping pair; a colon is missed");
          else
            return n.tag = g, n.anchor = A, !0;
        } else if ($)
          I(n, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return n.tag = g, n.anchor = A, !0;
      }
      if ((n.line === le || n.lineIndent > m) && (N && (k = n.line, s = n.lineStart, _ = n.position), ie(n, m, f, !0, x) && (N ? T = n.result : L = n.result), N || (J(n, E, C, y, T, L, k, s, _), y = T = L = null), z(n, !0, -1), F = n.input.charCodeAt(n.position)), (n.line === le || n.lineIndent > m) && F !== 0)
        I(n, "bad indentation of a mapping entry");
      else if (n.lineIndent < m)
        break;
    }
    return N && J(n, E, C, y, T, null, k, s, _), $ && (n.tag = g, n.anchor = A, n.kind = "mapping", n.result = E), $;
  }
  function je(n) {
    let m = !1, w = !1, x, k, s = n.input.charCodeAt(n.position);
    if (s !== 33) return !1;
    n.tag !== null && I(n, "duplication of a tag property"), s = n.input.charCodeAt(++n.position), s === 60 ? (m = !0, s = n.input.charCodeAt(++n.position)) : s === 33 ? (w = !0, x = "!!", s = n.input.charCodeAt(++n.position)) : x = "!";
    let _ = n.position;
    if (m) {
      do
        s = n.input.charCodeAt(++n.position);
      while (s !== 0 && s !== 62);
      n.position < n.length ? (k = n.input.slice(_, n.position), s = n.input.charCodeAt(++n.position)) : I(n, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; s !== 0 && !R(s); )
        s === 33 && (w ? I(n, "tag suffix cannot contain exclamation marks") : (x = n.input.slice(_ - 1, n.position + 1), M.test(x) || I(n, "named tag handle cannot contain such characters"), w = !0, _ = n.position + 1)), s = n.input.charCodeAt(++n.position);
      k = n.input.slice(_, n.position), v.test(k) && I(n, "tag suffix cannot contain flow indicator characters");
    }
    k && !S.test(k) && I(n, "tag name cannot contain such characters: " + k);
    try {
      k = decodeURIComponent(k);
    } catch {
      I(n, "tag name is malformed: " + k);
    }
    return m ? n.tag = k : i.call(n.tagMap, x) ? n.tag = n.tagMap[x] + k : x === "!" ? n.tag = "!" + k : x === "!!" ? n.tag = "tag:yaml.org,2002:" + k : I(n, 'undeclared tag handle "' + x + '"'), !0;
  }
  function Be(n) {
    let m = n.input.charCodeAt(n.position);
    if (m !== 38) return !1;
    n.anchor !== null && I(n, "duplication of an anchor property"), m = n.input.charCodeAt(++n.position);
    const w = n.position;
    for (; m !== 0 && !R(m) && !W(m); )
      m = n.input.charCodeAt(++n.position);
    return n.position === w && I(n, "name of an anchor node must contain at least one character"), n.anchor = n.input.slice(w, n.position), !0;
  }
  function Ze(n) {
    let m = n.input.charCodeAt(n.position);
    if (m !== 42) return !1;
    m = n.input.charCodeAt(++n.position);
    const w = n.position;
    for (; m !== 0 && !R(m) && !W(m); )
      m = n.input.charCodeAt(++n.position);
    n.position === w && I(n, "name of an alias node must contain at least one character");
    const x = n.input.slice(w, n.position);
    return i.call(n.anchorMap, x) || I(n, 'unidentified alias "' + x + '"'), n.result = n.anchorMap[x], z(n, !0, -1), !0;
  }
  function ze(n, m, w, x) {
    const k = we(n);
    return Xe(n), he(n, m), n.tag = null, n.anchor = null, n.kind = null, n.result = null, Pe(n, w, x) && n.kind === "mapping" ? (fe(n), !0) : (Qe(n), he(n, k), !1);
  }
  function ie(n, m, w, x, k) {
    let s, _, g = 1, A = !1, E = !1, C = null, y, T, L;
    n.depth >= n.maxDepth && I(n, "nesting exceeded maxDepth (" + n.maxDepth + ")"), n.depth += 1, n.listener !== null && n.listener("open", n), n.tag = null, n.anchor = null, n.kind = null, n.result = null;
    const N = s = _ = f === w || l === w;
    if (x && z(n, !0, -1) && (A = !0, n.lineIndent > m ? g = 1 : n.lineIndent === m ? g = 0 : n.lineIndent < m && (g = -1)), g === 1)
      for (; ; ) {
        const $ = n.input.charCodeAt(n.position), F = we(n);
        if (A && ($ === 33 && n.tag !== null || $ === 38 && n.anchor !== null) || !je(n) && !Be(n))
          break;
        C === null && (C = F), z(n, !0, -1) ? (A = !0, _ = N, n.lineIndent > m ? g = 1 : n.lineIndent === m ? g = 0 : n.lineIndent < m && (g = -1)) : _ = !1;
      }
    if (_ && (_ = A || k), g === 1 || f === w)
      if (a === w || c === w ? T = m : T = m + 1, L = n.position - n.lineStart, g === 1)
        if (_ && (De(n, L) || Pe(n, L, T)) || Fe(n, T))
          E = !0;
        else {
          const $ = n.input.charCodeAt(n.position);
          C !== null && N && !_ && $ !== 124 && $ !== 62 && ze(
            n,
            C,
            C.position - C.lineStart,
            T
          ) || s && oe(n, T) || Ae(n, T) || qe(n, T) ? E = !0 : Ze(n) ? (E = !0, (n.tag !== null || n.anchor !== null) && I(n, "alias node should not have any properties")) : Re(n, T, a === w) && (E = !0, n.tag === null && (n.tag = "?")), n.anchor !== null && Z(n, n.anchor, n.result);
        }
      else g === 0 && (E = _ && De(n, L));
    if (n.tag === null)
      n.anchor !== null && Z(n, n.anchor, n.result);
    else if (n.tag === "?") {
      n.result !== null && n.kind !== "scalar" && I(n, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + n.kind + '"');
      for (let $ = 0, F = n.implicitTypes.length; $ < F; $ += 1)
        if (y = n.implicitTypes[$], y.resolve(n.result)) {
          n.result = y.construct(n.result), n.tag = y.tag, n.anchor !== null && Z(n, n.anchor, n.result);
          break;
        }
    } else if (n.tag !== "!") {
      if (i.call(n.typeMap[n.kind || "fallback"], n.tag))
        y = n.typeMap[n.kind || "fallback"][n.tag];
      else {
        y = null;
        const $ = n.typeMap.multi[n.kind || "fallback"];
        for (let F = 0, D = $.length; F < D; F += 1)
          if (n.tag.slice(0, $[F].tag.length) === $[F].tag) {
            y = $[F];
            break;
          }
      }
      y || I(n, "unknown tag !<" + n.tag + ">"), n.result !== null && y.kind !== n.kind && I(n, "unacceptable node kind for !<" + n.tag + '> tag; it should be "' + y.kind + '", not "' + n.kind + '"'), y.resolve(n.result, n.tag) ? (n.result = y.construct(n.result, n.tag), n.anchor !== null && Z(n, n.anchor, n.result)) : I(n, "cannot resolve a node with !<" + n.tag + "> explicit tag");
    }
    return n.listener !== null && n.listener("close", n), n.depth -= 1, n.tag !== null || n.anchor !== null || E;
  }
  function Je(n) {
    const m = n.position;
    let w = !1, x;
    for (n.version = null, n.checkLineBreaks = n.legacy, n.tagMap = /* @__PURE__ */ Object.create(null), n.anchorMap = /* @__PURE__ */ Object.create(null); (x = n.input.charCodeAt(n.position)) !== 0 && (z(n, !0, -1), x = n.input.charCodeAt(n.position), !(n.lineIndent > 0 || x !== 37)); ) {
      w = !0, x = n.input.charCodeAt(++n.position);
      let k = n.position;
      for (; x !== 0 && !R(x); )
        x = n.input.charCodeAt(++n.position);
      const s = n.input.slice(k, n.position), _ = [];
      for (s.length < 1 && I(n, "directive name must not be less than one character in length"); x !== 0; ) {
        for (; B(x); )
          x = n.input.charCodeAt(++n.position);
        if (x === 35) {
          do
            x = n.input.charCodeAt(++n.position);
          while (x !== 0 && !P(x));
          break;
        }
        if (P(x)) break;
        for (k = n.position; x !== 0 && !R(x); )
          x = n.input.charCodeAt(++n.position);
        _.push(n.input.slice(k, n.position));
      }
      x !== 0 && ve(n), i.call($e, s) ? $e[s](n, s, _) : me(n, 'unknown document directive "' + s + '"');
    }
    if (z(n, !0, -1), n.lineIndent === 0 && n.input.charCodeAt(n.position) === 45 && n.input.charCodeAt(n.position + 1) === 45 && n.input.charCodeAt(n.position + 2) === 45 ? (n.position += 3, z(n, !0, -1)) : w && I(n, "directives end mark is expected"), ie(n, n.lineIndent - 1, f, !1, !0), z(n, !0, -1), n.checkLineBreaks && b.test(n.input.slice(m, n.position)) && me(n, "non-ASCII line breaks are interpreted as content"), n.documents.push(n.result), n.position === n.lineStart && X(n)) {
      n.input.charCodeAt(n.position) === 46 && (n.position += 3, z(n, !0, -1));
      return;
    }
    n.position < n.length - 1 && I(n, "end of the stream or a document separator is expected");
  }
  function Se(n, m) {
    n = String(n), m = m || {}, n.length !== 0 && (n.charCodeAt(n.length - 1) !== 10 && n.charCodeAt(n.length - 1) !== 13 && (n += `
`), n.charCodeAt(0) === 65279 && (n = n.slice(1)));
    const w = new Y(n, m), x = n.indexOf("\0");
    for (x !== -1 && (w.position = x, I(w, "null byte is not allowed in input")), w.input += "\0"; w.input.charCodeAt(w.position) === 32; )
      w.lineIndent += 1, w.position += 1;
    for (; w.position < w.length - 1; )
      Je(w);
    return w.documents;
  }
  function en(n, m, w) {
    m !== null && typeof m == "object" && typeof w > "u" && (w = m, m = null);
    const x = Se(n, w);
    if (typeof m != "function")
      return x;
    for (let k = 0, s = x.length; k < s; k += 1)
      m(x[k]);
  }
  function nn(n, m) {
    const w = Se(n, m);
    if (w.length !== 0) {
      if (w.length === 1)
        return w[0];
      throw new t("expected a single document in the stream, but found more");
    }
  }
  return Ye.loadAll = en, Ye.load = nn, Ye;
}
var En = {}, kt;
function Lo() {
  if (kt) return En;
  kt = 1;
  const e = Le(), t = Ie(), r = Dn(), o = Object.prototype.toString, i = Object.prototype.hasOwnProperty, a = 65279, c = 9, l = 10, f = 13, u = 32, d = 33, p = 34, h = 35, b = 37, v = 38, M = 39, S = 42, O = 44, P = 45, B = 58, R = 61, W = 62, te = 63, pe = 64, ue = 91, be = 93, Ge = 96, ke = 123, Oe = 124, ye = 125, Y = {};
  Y[0] = "\\0", Y[7] = "\\a", Y[8] = "\\b", Y[9] = "\\t", Y[10] = "\\n", Y[11] = "\\v", Y[12] = "\\f", Y[13] = "\\r", Y[27] = "\\e", Y[34] = '\\"', Y[92] = "\\\\", Y[133] = "\\N", Y[160] = "\\_", Y[8232] = "\\L", Y[8233] = "\\P";
  const Ne = [
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
  ], I = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function me(s, _) {
    if (_ === null) return {};
    const g = {}, A = Object.keys(_);
    for (let E = 0, C = A.length; E < C; E += 1) {
      let y = A[E], T = String(_[y]);
      y.slice(0, 2) === "!!" && (y = "tag:yaml.org,2002:" + y.slice(2));
      const L = s.compiledTypeMap.fallback[y];
      L && i.call(L.styleAliases, T) && (T = L.styleAliases[T]), g[y] = T;
    }
    return g;
  }
  function Z(s) {
    let _, g;
    const A = s.toString(16).toUpperCase();
    if (s <= 255)
      _ = "x", g = 2;
    else if (s <= 65535)
      _ = "u", g = 4;
    else if (s <= 4294967295)
      _ = "U", g = 8;
    else
      throw new t("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + _ + e.repeat("0", g - A.length) + A;
  }
  const Xe = 1, fe = 2;
  function Qe(s) {
    this.schema = s.schema || r, this.indent = Math.max(1, s.indent || 2), this.noArrayIndent = s.noArrayIndent || !1, this.skipInvalid = s.skipInvalid || !1, this.flowLevel = e.isNothing(s.flowLevel) ? -1 : s.flowLevel, this.styleMap = me(this.schema, s.styles || null), this.sortKeys = s.sortKeys || !1, this.lineWidth = s.lineWidth || 80, this.noRefs = s.noRefs || !1, this.noCompatMode = s.noCompatMode || !1, this.condenseFlow = s.condenseFlow || !1, this.quotingType = s.quotingType === '"' ? fe : Xe, this.forceQuotes = s.forceQuotes || !1, this.replacer = typeof s.replacer == "function" ? s.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function we(s, _) {
    const g = e.repeat(" ", _);
    let A = 0, E = "";
    const C = s.length;
    for (; A < C; ) {
      let y;
      const T = s.indexOf(`
`, A);
      T === -1 ? (y = s.slice(A), A = C) : (y = s.slice(A, T + 1), A = T + 1), y.length && y !== `
` && (E += g), E += y;
    }
    return E;
  }
  function he(s, _) {
    return `
` + e.repeat(" ", s.indent * _);
  }
  function $e(s, _) {
    for (let g = 0, A = s.implicitTypes.length; g < A; g += 1)
      if (s.implicitTypes[g].resolve(_))
        return !0;
    return !1;
  }
  function V(s) {
    return s === u || s === c;
  }
  function re(s) {
    return s >= 32 && s <= 126 || s >= 161 && s <= 55295 && s !== 8232 && s !== 8233 || s >= 57344 && s <= 65533 && s !== a || s >= 65536 && s <= 1114111;
  }
  function xe(s) {
    return re(s) && s !== a && // - b-char
    s !== f && s !== l;
  }
  function J(s, _, g) {
    const A = xe(s), E = A && !V(s);
    return (
      // ns-plain-safe
      (g ? A : A && // - c-flow-indicator
      s !== O && s !== ue && s !== be && s !== ke && s !== ye) && // ns-plain-char
      s !== h && // false on '#'
      !(_ === B && !E) || // false on ': '
      xe(_) && !V(_) && s === h || // change to true on '[^ ]#'
      _ === B && E
    );
  }
  function ve(s) {
    return re(s) && s !== a && !V(s) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    s !== P && s !== te && s !== B && s !== O && s !== ue && s !== be && s !== ke && s !== ye && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    s !== h && s !== v && s !== S && s !== d && s !== Oe && s !== R && s !== W && s !== M && s !== p && // | “%” | “@” | “`”)
    s !== b && s !== pe && s !== Ge;
  }
  function z(s) {
    return !V(s) && s !== B;
  }
  function X(s, _) {
    const g = s.charCodeAt(_);
    let A;
    return g >= 55296 && g <= 56319 && _ + 1 < s.length && (A = s.charCodeAt(_ + 1), A >= 56320 && A <= 57343) ? (g - 55296) * 1024 + A - 56320 + 65536 : g;
  }
  function _e(s) {
    return /^\n* /.test(s);
  }
  const Re = 1, Ae = 2, qe = 3, Fe = 4, oe = 5;
  function De(s, _, g, A, E, C, y, T) {
    let L, N = 0, $ = null, F = !1, D = !1;
    const le = A !== -1;
    let Ee = -1, Ce = ve(X(s, 0)) && z(X(s, s.length - 1));
    if (_ || y)
      for (L = 0; L < s.length; N >= 65536 ? L += 2 : L++) {
        if (N = X(s, L), !re(N))
          return oe;
        Ce = Ce && J(N, $, T), $ = N;
      }
    else {
      for (L = 0; L < s.length; N >= 65536 ? L += 2 : L++) {
        if (N = X(s, L), N === l)
          F = !0, le && (D = D || // Foldable line = too long, and not more-indented.
          L - Ee - 1 > A && s[Ee + 1] !== " ", Ee = L);
        else if (!re(N))
          return oe;
        Ce = Ce && J(N, $, T), $ = N;
      }
      D = D || le && L - Ee - 1 > A && s[Ee + 1] !== " ";
    }
    return !F && !D ? Ce && !y && !E(s) ? Re : C === fe ? oe : Ae : g > 9 && _e(s) ? oe : y ? C === fe ? oe : Ae : D ? Fe : qe;
  }
  function Pe(s, _, g, A, E) {
    s.dump = (function() {
      if (_.length === 0)
        return s.quotingType === fe ? '""' : "''";
      if (!s.noCompatMode && (Ne.indexOf(_) !== -1 || I.test(_)))
        return s.quotingType === fe ? '"' + _ + '"' : "'" + _ + "'";
      const C = s.indent * Math.max(1, g), y = s.lineWidth === -1 ? -1 : Math.max(Math.min(s.lineWidth, 40), s.lineWidth - C), T = A || // No block styles in flow mode.
      s.flowLevel > -1 && g >= s.flowLevel;
      function L(N) {
        return $e(s, N);
      }
      switch (De(
        _,
        T,
        s.indent,
        y,
        L,
        s.quotingType,
        s.forceQuotes && !A,
        E
      )) {
        case Re:
          return _;
        case Ae:
          return "'" + _.replace(/'/g, "''") + "'";
        case qe:
          return "|" + je(_, s.indent) + Be(we(_, C));
        case Fe:
          return ">" + je(_, s.indent) + Be(we(Ze(_, y), C));
        case oe:
          return '"' + ie(_) + '"';
        default:
          throw new t("impossible error: invalid scalar style");
      }
    })();
  }
  function je(s, _) {
    const g = _e(s) ? String(_) : "", A = s[s.length - 1] === `
`, C = A && (s[s.length - 2] === `
` || s === `
`) ? "+" : A ? "" : "-";
    return g + C + `
`;
  }
  function Be(s) {
    return s[s.length - 1] === `
` ? s.slice(0, -1) : s;
  }
  function Ze(s, _) {
    const g = /(\n+)([^\n]*)/g;
    let A = (function() {
      let T = s.indexOf(`
`);
      return T = T !== -1 ? T : s.length, g.lastIndex = T, ze(s.slice(0, T), _);
    })(), E = s[0] === `
` || s[0] === " ", C, y;
    for (; y = g.exec(s); ) {
      const T = y[1], L = y[2];
      C = L[0] === " ", A += T + (!E && !C && L !== "" ? `
` : "") + ze(L, _), E = C;
    }
    return A;
  }
  function ze(s, _) {
    if (s === "" || s[0] === " ") return s;
    const g = / [^ ]/g;
    let A, E = 0, C, y = 0, T = 0, L = "";
    for (; A = g.exec(s); )
      T = A.index, T - E > _ && (C = y > E ? y : T, L += `
` + s.slice(E, C), E = C + 1), y = T;
    return L += `
`, s.length - E > _ && y > E ? L += s.slice(E, y) + `
` + s.slice(y + 1) : L += s.slice(E), L.slice(1);
  }
  function ie(s) {
    let _ = "", g = 0;
    for (let A = 0; A < s.length; g >= 65536 ? A += 2 : A++) {
      g = X(s, A);
      const E = Y[g];
      !E && re(g) ? (_ += s[A], g >= 65536 && (_ += s[A + 1])) : _ += E || Z(g);
    }
    return _;
  }
  function Je(s, _, g) {
    let A = "";
    const E = s.tag;
    for (let C = 0, y = g.length; C < y; C += 1) {
      let T = g[C];
      s.replacer && (T = s.replacer.call(g, String(C), T)), (m(s, _, T, !1, !1) || typeof T > "u" && m(s, _, null, !1, !1)) && (A !== "" && (A += "," + (s.condenseFlow ? "" : " ")), A += s.dump);
    }
    s.tag = E, s.dump = "[" + A + "]";
  }
  function Se(s, _, g, A) {
    let E = "";
    const C = s.tag;
    for (let y = 0, T = g.length; y < T; y += 1) {
      let L = g[y];
      s.replacer && (L = s.replacer.call(g, String(y), L)), (m(s, _ + 1, L, !0, !0, !1, !0) || typeof L > "u" && m(s, _ + 1, null, !0, !0, !1, !0)) && ((!A || E !== "") && (E += he(s, _)), s.dump && l === s.dump.charCodeAt(0) ? E += "-" : E += "- ", E += s.dump);
    }
    s.tag = C, s.dump = E || "[]";
  }
  function en(s, _, g) {
    let A = "";
    const E = s.tag, C = Object.keys(g);
    for (let y = 0, T = C.length; y < T; y += 1) {
      let L = "";
      A !== "" && (L += ", "), s.condenseFlow && (L += '"');
      const N = C[y];
      let $ = g[N];
      s.replacer && ($ = s.replacer.call(g, N, $)), m(s, _, N, !1, !1) && (s.dump.length > 1024 && (L += "? "), L += s.dump + (s.condenseFlow ? '"' : "") + ":" + (s.condenseFlow ? "" : " "), m(s, _, $, !1, !1) && (L += s.dump, A += L));
    }
    s.tag = E, s.dump = "{" + A + "}";
  }
  function nn(s, _, g, A) {
    let E = "";
    const C = s.tag, y = Object.keys(g);
    if (s.sortKeys === !0)
      y.sort();
    else if (typeof s.sortKeys == "function")
      y.sort(s.sortKeys);
    else if (s.sortKeys)
      throw new t("sortKeys must be a boolean or a function");
    for (let T = 0, L = y.length; T < L; T += 1) {
      let N = "";
      (!A || E !== "") && (N += he(s, _));
      const $ = y[T];
      let F = g[$];
      if (s.replacer && (F = s.replacer.call(g, $, F)), !m(s, _ + 1, $, !0, !0, !0))
        continue;
      const D = s.tag !== null && s.tag !== "?" || s.dump && s.dump.length > 1024;
      D && (s.dump && l === s.dump.charCodeAt(0) ? N += "?" : N += "? "), N += s.dump, D && (N += he(s, _)), m(s, _ + 1, F, !0, D) && (s.dump && l === s.dump.charCodeAt(0) ? N += ":" : N += ": ", N += s.dump, E += N);
    }
    s.tag = C, s.dump = E || "{}";
  }
  function n(s, _, g) {
    const A = g ? s.explicitTypes : s.implicitTypes;
    for (let E = 0, C = A.length; E < C; E += 1) {
      const y = A[E];
      if ((y.instanceOf || y.predicate) && (!y.instanceOf || typeof _ == "object" && _ instanceof y.instanceOf) && (!y.predicate || y.predicate(_))) {
        if (g ? y.multi && y.representName ? s.tag = y.representName(_) : s.tag = y.tag : s.tag = "?", y.represent) {
          const T = s.styleMap[y.tag] || y.defaultStyle;
          let L;
          if (o.call(y.represent) === "[object Function]")
            L = y.represent(_, T);
          else if (i.call(y.represent, T))
            L = y.represent[T](_, T);
          else
            throw new t("!<" + y.tag + '> tag resolver accepts not "' + T + '" style');
          s.dump = L;
        }
        return !0;
      }
    }
    return !1;
  }
  function m(s, _, g, A, E, C, y) {
    s.tag = null, s.dump = g, n(s, g, !1) || n(s, g, !0);
    const T = o.call(s.dump), L = A;
    A && (A = s.flowLevel < 0 || s.flowLevel > _);
    const N = T === "[object Object]" || T === "[object Array]";
    let $, F;
    if (N && ($ = s.duplicates.indexOf(g), F = $ !== -1), (s.tag !== null && s.tag !== "?" || F || s.indent !== 2 && _ > 0) && (E = !1), F && s.usedDuplicates[$])
      s.dump = "*ref_" + $;
    else {
      if (N && F && !s.usedDuplicates[$] && (s.usedDuplicates[$] = !0), T === "[object Object]")
        A && Object.keys(s.dump).length !== 0 ? (nn(s, _, s.dump, E), F && (s.dump = "&ref_" + $ + s.dump)) : (en(s, _, s.dump), F && (s.dump = "&ref_" + $ + " " + s.dump));
      else if (T === "[object Array]")
        A && s.dump.length !== 0 ? (s.noArrayIndent && !y && _ > 0 ? Se(s, _ - 1, s.dump, E) : Se(s, _, s.dump, E), F && (s.dump = "&ref_" + $ + s.dump)) : (Je(s, _, s.dump), F && (s.dump = "&ref_" + $ + " " + s.dump));
      else if (T === "[object String]")
        s.tag !== "?" && Pe(s, s.dump, _, C, L);
      else {
        if (T === "[object Undefined]")
          return !1;
        if (s.skipInvalid) return !1;
        throw new t("unacceptable kind of an object to dump " + T);
      }
      if (s.tag !== null && s.tag !== "?") {
        let D = encodeURI(
          s.tag[0] === "!" ? s.tag.slice(1) : s.tag
        ).replace(/!/g, "%21");
        s.tag[0] === "!" ? D = "!" + D : D.slice(0, 18) === "tag:yaml.org,2002:" ? D = "!!" + D.slice(18) : D = "!<" + D + ">", s.dump = D + " " + s.dump;
      }
    }
    return !0;
  }
  function w(s, _) {
    const g = [], A = [];
    x(s, g, A);
    const E = A.length;
    for (let C = 0; C < E; C += 1)
      _.duplicates.push(g[A[C]]);
    _.usedDuplicates = new Array(E);
  }
  function x(s, _, g) {
    if (s !== null && typeof s == "object") {
      const A = _.indexOf(s);
      if (A !== -1)
        g.indexOf(A) === -1 && g.push(A);
      else if (_.push(s), Array.isArray(s))
        for (let E = 0, C = s.length; E < C; E += 1)
          x(s[E], _, g);
      else {
        const E = Object.keys(s);
        for (let C = 0, y = E.length; C < y; C += 1)
          x(s[E[C]], _, g);
      }
    }
  }
  function k(s, _) {
    _ = _ || {};
    const g = new Qe(_);
    g.noRefs || w(s, g);
    let A = s;
    return g.replacer && (A = g.replacer.call({ "": A }, "", A)), m(g, 0, A, !0, !0) ? g.dump + `
` : "";
  }
  return En.dump = k, En;
}
var yt;
function Io() {
  if (yt) return K;
  yt = 1;
  const e = Mo(), t = Lo();
  function r(o, i) {
    return function() {
      throw new Error("Function yaml." + o + " is removed in js-yaml 4. Use yaml." + i + " instead, which is now safe by default.");
    };
  }
  return K.Type = U(), K.Schema = Kt(), K.FAILSAFE_SCHEMA = Gt(), K.JSON_SCHEMA = er(), K.CORE_SCHEMA = nr(), K.DEFAULT_SCHEMA = Dn(), K.load = e.load, K.loadAll = e.loadAll, K.dump = t.dump, K.YAMLException = Ie(), K.types = {
    binary: or(),
    float: Jt(),
    map: Vt(),
    null: Xt(),
    pairs: lr(),
    set: ar(),
    timestamp: tr(),
    bool: Qt(),
    int: Zt(),
    merge: rr(),
    omap: ir(),
    seq: Wt(),
    str: Ut()
  }, K.safeLoad = r("safeLoad", "load"), K.safeLoadAll = r("safeLoadAll", "loadAll"), K.safeDump = r("safeDump", "dump"), K;
}
var Oo = Io();
const No = /* @__PURE__ */ Co(Oo), {
  Type: Nl,
  Schema: $l,
  FAILSAFE_SCHEMA: Rl,
  JSON_SCHEMA: $o,
  CORE_SCHEMA: ql,
  DEFAULT_SCHEMA: Fl,
  load: Ro,
  loadAll: Dl,
  dump: Pl,
  YAMLException: jl,
  types: Bl,
  safeLoad: zl,
  safeLoadAll: Hl,
  safeDump: Yl
} = No, qo = /^([^#\s][^:\n]*?):(?:[ \t](.*))?$/, Fo = /^\d{4}-\d{2}-\d{2}$/, Do = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
function wt(e) {
  return e.startsWith(" ") || e.startsWith("	");
}
function xt(e) {
  return e.trimStart().startsWith("#");
}
function Po(e) {
  return e.includes(`\r
`) ? `\r
` : `
`;
}
function jo(e) {
  return typeof e == "boolean" ? "boolean" : typeof e == "number" ? "number" : Array.isArray(e) ? "list" : typeof e == "string" ? Fo.test(e) ? "date" : Do.test(e) ? "datetime" : "text" : "raw";
}
function vt(e, t) {
  for (let r = t; r < e.length; r++)
    if (e[r] === "#" && (r === 0 || e[r - 1] === " " || e[r - 1] === "	"))
      return e.slice(r);
}
function Bo(e) {
  const t = e.search(/\S/), r = t >= 0 ? e[t] : "";
  if (r !== '"' && r !== "'") return vt(e, 0);
  const o = r;
  let i = t + 1;
  for (; i < e.length; i++) {
    const a = e[i];
    if (a === "\\" && o === '"') {
      i++;
      continue;
    }
    if (a === o) {
      if (o === "'" && e[i + 1] === "'") {
        i++;
        continue;
      }
      i++;
      break;
    }
  }
  return vt(e, i);
}
function Ke(e) {
  const t = Po(e), r = /\r?\n$/.test(e), o = e.length ? e.split(/\r?\n/) : [];
  o.length && o[o.length - 1] === "" && o.pop();
  let i = null, a = !1;
  try {
    const f = e.trim() ? Ro(e, { schema: $o }) : {};
    i = f && typeof f == "object" && !Array.isArray(f) ? f : null, i || (a = e.trim() !== "");
  } catch {
    a = !0;
  }
  const c = [];
  let l = 0;
  for (; l < o.length; ) {
    const f = o[l], u = qo.exec(f);
    if (!u || wt(f) || xt(f)) {
      l++;
      continue;
    }
    const d = u[1].trim();
    let p = l + 1;
    for (; p < o.length && o[p].trim() !== "" && wt(o[p]); ) p++;
    const h = o.slice(l, p), b = h.join(t), v = i ? i[d] : void 0, M = a ? "raw" : jo(v), O = h.some((B) => xt(B)) || M === "raw" || h.length > 1 && M !== "list", P = Bo(u[2] ?? "");
    c.push({
      key: d,
      lines: [l, p],
      raw: b,
      type: O ? "raw" : M,
      value: v,
      complex: O,
      trailingComment: P
    }), l = p;
  }
  return { entries: c, lines: o, eol: t, ok: !a, trailingNewline: r };
}
let Nn = null;
function At(e) {
  Nn = e;
}
const zo = "app.textox.mkdext";
function de(e, t) {
  if (!Nn) return t;
  const r = Nn(e);
  return !r || r === `${zo}.${e}` ? t : r;
}
const sr = [
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
], cr = {
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
}, Ho = {
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
}, Yo = /* @__PURE__ */ new Set([
  ...sr,
  ...Object.keys(cr)
]);
function ur(e) {
  const t = e.trim().toLowerCase();
  return cr[t] ?? t;
}
function Ko(e) {
  return Yo.has(e.trim().toLowerCase());
}
function Uo(e) {
  return Ho[ur(e)] ?? null;
}
function St(e, t) {
  if (Uo(e) !== "list") return t.type;
  if (t.type === "list" || !t.complex && t.type === "text") return "list";
  const r = t.value == null || t.value === "", o = !t.raw.includes(`
`) && t.trailingComment === void 0;
  return r && o && (t.type === "text" || t.type === "raw") ? "list" : t.type;
}
function Wo(e, t) {
  return e !== "list" || Array.isArray(t) ? t : t == null || t === "" ? [] : [String(t)];
}
const Et = "http://www.w3.org/2000/svg", q = (e) => ({ tag: "path", attrs: { d: e } }), se = (e, t, r) => ({
  tag: "circle",
  attrs: { cx: String(e), cy: String(t), r: String(r) }
}), Ct = (e, t, r, o, i) => ({
  tag: "rect",
  attrs: { x: String(e), y: String(t), width: String(r), height: String(o), rx: String(i) }
}), Vo = {
  title: [q("M4 7V4h16v3"), q("M9 20h6"), q("M12 4v16")],
  description: [q("M3 6h18"), q("M3 12h18"), q("M3 18h12")],
  summary: [q("M3 6h18"), q("M3 12h18"), q("M3 18h8")],
  tags: [
    q("M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"),
    se(7, 7, 1.2)
  ],
  categories: [
    q("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")
  ],
  status: [se(12, 12, 9), q("M8 12.5l2.5 2.5L16 9")],
  type: [q("M12 2 2 7l10 5 10-5z"), q("M2 17l10 5 10-5"), q("M2 12l10 5 10-5")],
  priority: [q("M5 21V4"), q("M5 5h13l-2 3.5L18 12H5")],
  date: [Ct(3, 5, 18, 16, 2), q("M3 10h18M8 3v4M16 3v4")],
  created: [se(12, 12, 9), q("M12 7v5l3 2")],
  updated: [q("M21 12a9 9 0 1 1-2.6-6.4"), q("M21 4v6h-6")],
  author: [se(12, 8, 3.5), q("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5")],
  owner: [se(12, 8, 3.5), q("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"), q("M18 5l1 1.6 1.8.4-1.4 1.4.3 1.8-1.7-.9-1.7.9.3-1.8L15 7l1.8-.4z")],
  audience: [se(9, 8, 3), q("M2 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"), se(17.5, 9, 2.2)],
  language: [
    se(12, 12, 9),
    q("M3 12h18"),
    q("M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9z")
  ],
  version: [q("M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z")],
  related: [
    q("M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"),
    q("M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1")
  ],
  keywords: [q("M4 9h16M4 15h16M10 3 8 21M16 3l-2 18")],
  project: [Ct(3, 4, 8, 16, 1.5), q("M15 4h6v9h-6z")],
  aliases: [q("M7 7h11l-3-3"), q("M17 17H6l3 3")],
  slug: [q("M9 4 7 20M17 4l-2 16M4 9h16M3 15h16")],
  draft: [q("M4 20l4-1L19 8l-3-3L5 16z"), q("M14 6l3 3")]
}, Go = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true"
};
function Pn(e, t) {
  const r = document.createElementNS(Et, "svg");
  r.setAttribute("class", e);
  for (const [o, i] of Object.entries(Go)) r.setAttribute(o, i);
  for (const o of t) {
    const i = document.createElementNS(Et, o.tag);
    for (const [a, c] of Object.entries(o.attrs)) i.setAttribute(a, c);
    r.appendChild(i);
  }
  return r;
}
function Xo(e) {
  return (Array.from(e.trim())[0] ?? "").toUpperCase();
}
function Qo(e) {
  const t = document.createElement("span");
  return t.className = "fm-ico fm-ico-letter", t.textContent = Xo(e), t.setAttribute("aria-hidden", "true"), t;
}
function Cn(e) {
  const t = Vo[ur(e)];
  return t ? Pn("fm-ico", t) : Qo(e);
}
const Zo = {
  panel: [q("M16 18l6-6-6-6"), q("M8 6l-6 6 6 6")],
  source: [q("M3 5h18M3 12h18M3 19h18")]
};
function Jo(e) {
  return Pn("fm-toggle-icon", Zo[e]);
}
const ei = [
  q("M3 6h18"),
  q("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"),
  q("M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
  q("M10 11v6"),
  q("M14 11v6")
];
function ni() {
  const e = Pn("fm-delete-icon", ei);
  return e.setAttribute("width", "14"), e.setAttribute("height", "14"), e;
}
const Tt = 8;
function ti(e, t, r = sr) {
  const o = [], i = /* @__PURE__ */ new Set([t]), a = (c) => {
    c !== "" && !i.has(c) && (i.add(c), o.push(c));
  };
  for (const c of e) a(c.key);
  for (const c of r) a(c);
  return o;
}
function ri(e, t) {
  const r = t.trim().toLowerCase();
  if (r === "") return [...e].slice(0, Tt);
  const o = [], i = [];
  for (const a of e) {
    const c = a.toLowerCase();
    c.startsWith(r) ? o.push(a) : c.includes(r) && i.push(a);
  }
  return [...o, ...i].slice(0, Tt);
}
function Mt(e, t) {
  let r = [], o = 0, i = !1, a = !1;
  const c = document.createElement("div");
  c.className = "fm-suggest", c.setAttribute("role", "listbox"), c.hidden = !0;
  const l = () => {
    i = !1, r = [], o = 0, c.hidden = !0, c.textContent = "", e.setAttribute("aria-expanded", "false");
  }, f = () => {
    const b = t.container.getBoundingClientRect(), v = e.getBoundingClientRect();
    c.style.left = `${v.left - b.left}px`, c.style.top = `${v.bottom - b.top + 2}px`, c.style.width = `${v.width}px`;
  }, u = () => {
    if (r.length === 0) {
      l();
      return;
    }
    const b = e.value.trim().toLowerCase();
    c.textContent = "", r.forEach((v, M) => {
      const S = document.createElement("div");
      S.className = M === o ? "fm-suggest-item is-active" : "fm-suggest-item", S.setAttribute("role", "option"), S.setAttribute("aria-selected", M === o ? "true" : "false");
      const O = b === "" ? -1 : v.toLowerCase().indexOf(b);
      if (O >= 0) {
        const P = document.createElement("mark");
        P.textContent = v.slice(O, O + b.length), S.append(
          document.createTextNode(v.slice(0, O)),
          P,
          document.createTextNode(v.slice(O + b.length))
        );
      } else
        S.textContent = v;
      S.addEventListener("mousedown", (P) => {
        P.preventDefault(), e.value = v, l(), t.onSubmit?.();
      }), c.appendChild(S);
    }), c.hidden = !1, i = !0, e.setAttribute("aria-expanded", "true"), f();
  }, d = () => {
    r = ri(t.candidates(), e.value), o = 0, a = !1, u();
  }, p = () => d(), h = (b) => {
    if (!(b.isComposing || b.keyCode === 229)) {
      if (b.key === "ArrowDown" || b.key === "ArrowUp") {
        if (!i || r.length === 0) return;
        if (b.preventDefault(), e.value.trim() === "" && !a) {
          a = !0, u();
          return;
        }
        a = !0;
        const v = b.key === "ArrowDown" ? 1 : r.length - 1;
        o = (o + v) % r.length, u();
        return;
      }
      if (b.key === "Enter") {
        b.preventDefault();
        const v = e.value.trim() !== "" || a;
        i && r.length > 0 && v && (e.value = r[o]), l(), t.onSubmit?.();
        return;
      }
      if (b.key === "Tab") {
        i && r.length > 0 && (b.preventDefault(), e.value = r[o]), l();
        return;
      }
      if (b.key === "Escape") {
        if (i) {
          b.preventDefault(), l();
          return;
        }
        t.onCancel?.();
      }
    }
  };
  return e.setAttribute("aria-autocomplete", "list"), e.setAttribute("aria-expanded", "false"), t.container.appendChild(c), e.addEventListener("input", p), e.addEventListener("keydown", h), {
    open: d,
    close: l,
    destroy() {
      e.removeEventListener("input", p), e.removeEventListener("keydown", h), e.removeAttribute("aria-autocomplete"), e.removeAttribute("aria-expanded"), c.remove(), i = !1, r = [], a = !1;
    }
  };
}
function jn(e, t) {
  if (t === "number") {
    if (e == null || e === "") return "";
    const r = Number(e);
    return Number.isFinite(r) ? String(r) : "";
  }
  return t === "boolean" ? e ? "true" : "false" : t === "date" || t === "datetime" ? String(e) : ii(String(e ?? ""));
}
function oi(e) {
  return !!(e === "" || e.trim() !== e || /[\x00-\x1f\x7f]/.test(e) || /[:#\[\]{}&*!|>'"%@`,]/.test(e) || /^[-?](\s|$)/.test(e) || /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(e) || /^(true|false|null|~|yes|no|on|off)$/i.test(e));
}
function ii(e) {
  return oi(e) ? `"${e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (r) => `\\x${r.charCodeAt(0).toString(16).padStart(2, "0")}`)}"` : e;
}
function fr(e) {
  return `[${e.map((t) => jn(t, "text")).join(", ")}]`;
}
function li(e, t) {
  return e.map((r) => `${t}- ${jn(r, "text")}`);
}
function ai(e, t) {
  return e.entries.find((r) => r.key === t);
}
function si(e, t) {
  const { lines: r, eol: o } = e, i = r.slice(), a = (h, b, v) => {
    i.splice(h, b, ...v);
  }, c = (h) => {
    const b = h.join(o);
    return b === "" ? "" : b + (e.trailingNewline ? o : "");
  };
  if (t.kind === "add") {
    const h = Lt(t.value, t.type), b = `${t.key}:${h ? ` ${h}` : ""}`;
    return i.push(b), c(i);
  }
  const l = ai(e, t.key);
  if (!l) return null;
  const [f, u] = l.lines;
  if (t.kind === "rename") {
    const h = i[f], b = h.slice(h.indexOf(":"));
    return i[f] = `${t.nextKey}${b}`, c(i);
  }
  if (t.kind === "remove")
    return a(f, u - f, []), c(i);
  if (l.complex) return null;
  if (t.type === "list") {
    const h = Array.isArray(t.value) ? t.value : [];
    if (l.raw.split(o)[0].includes("["))
      i[f] = `${t.key}: ${fr(h)}${l.trailingComment ? ` ${l.trailingComment}` : ""}`, u - f > 1 && a(f + 1, u - f - 1, []);
    else {
      const v = [`${t.key}:`, ...li(h, "  ")];
      l.trailingComment && (v[0] = `${t.key}: ${l.trailingComment}`), a(f, u - f, v);
    }
    return c(i);
  }
  if (u - f > 1) return null;
  const d = l.trailingComment ? ` ${l.trailingComment}` : "", p = Lt(t.value, t.type);
  return i[f] = `${t.key}:${p ? ` ${p}` : ""}${d}`, c(i);
}
function Lt(e, t) {
  return t === "list" ? fr(Array.isArray(e) ? e : []) : jn(e, t);
}
let Me = null;
function ci(e) {
  Me = e;
}
function ui(e) {
  Me === e && (Me = null);
}
function fi(e, t, r) {
  return new mi(e, t, r);
}
const di = /^[^\s#:][^#:]*$/;
function It(e) {
  return e === e.trim() && e !== "" && di.test(e);
}
function pi(e) {
  for (const t of [e, ...Array.from(e.querySelectorAll("*"))])
    t instanceof HTMLTextAreaElement ? t.readOnly = !0 : t instanceof HTMLInputElement ? t.type === "checkbox" ? t.disabled = !0 : t.readOnly = !0 : t instanceof HTMLButtonElement && (t.disabled = !0);
}
class mi {
  constructor(t, r, o) {
    this.view = r, this.getPos = o, this.node = t, this.dom = document.createElement("yaml-block"), this.deleteBtn = document.createElement("button"), this.deleteBtn.type = "button", this.deleteBtn.className = "fm-delete-block", this.deleteBtn.appendChild(ni());
    const i = de("frontMatter.removeBlock", "Remove document properties");
    this.deleteBtn.title = i, this.deleteBtn.setAttribute("aria-label", i), this.deleteBtn.addEventListener("mousedown", (a) => a.preventDefault()), this.deleteBtn.addEventListener("click", () => this.removeBlock()), this.addBtn = document.createElement("button"), this.addBtn.type = "button", this.addBtn.className = "fm-add-btn", this.addBtn.textContent = `+ ${de("frontMatter.addProperty", "Add property")}`, this.addBtn.addEventListener("mousedown", (a) => a.preventDefault()), this.addBtn.addEventListener("click", () => this.addPendingRow()), this.toggle = document.createElement("button"), this.toggle.type = "button", this.toggle.className = "fm-toggle", this.toggle.addEventListener("mousedown", (a) => a.preventDefault()), this.toggle.addEventListener("click", () => {
      bo(this.mode === "panel" ? "source" : "panel");
    }), this.actions = document.createElement("div"), this.actions.className = "fm-actions", this.actions.setAttribute("contenteditable", "false"), this.actions.append(this.deleteBtn, this.addBtn, this.toggle), this.dom.appendChild(this.actions), this.panel = document.createElement("div"), this.panel.className = "fm-panel", this.panel.setAttribute("contenteditable", "false"), this.dom.appendChild(this.panel), this.source = document.createElement("div"), this.source.className = "fm-source", this.contentDOM = document.createElement("div"), this.contentDOM.className = "fm-source-body", this.source.appendChild(this.contentDOM), this.dom.appendChild(this.source), this.locked = this.readLocked(), typeof MutationObserver == "function" && (this.lockObserver = new MutationObserver(() => {
      const a = this.readLocked();
      a !== this.locked && (this.locked = a, this.render());
    }), this.lockObserver.observe(this.view.dom, {
      attributes: !0,
      attributeFilter: ["contenteditable"]
    })), this.mode = Yt(), this.unsubscribe = go((a) => {
      this.mode = a, this.render();
    }), this.render(), this.openPendingRowIfRequested();
  }
  dom;
  contentDOM;
  actions;
  deleteBtn;
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
  update(t) {
    if (t.type !== this.node.type) return !1;
    const r = t.textContent !== this.node.textContent;
    return this.node = t, r && !this.silentUpdate ? this.render() : this.refreshSourceAttr(), !0;
  }
  stopEvent(t) {
    const r = t.target;
    return this.panel.contains(r) || this.actions.contains(r);
  }
  ignoreMutation(t) {
    return t.type === "attributes" && (t.target === this.dom || t.target === this.contentDOM) ? !0 : !this.contentDOM.contains(t.target);
  }
  selectNode() {
    this.dom.classList.add("fm-selected");
  }
  deselectNode() {
    this.dom.classList.remove("fm-selected");
  }
  destroy() {
    this.lockObserver?.disconnect(), this.lockObserver = null, this.unsubscribe();
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
    this.refreshSourceAttr(), this.locked = this.readLocked();
    const t = this.mode === "panel";
    this.dom.setAttribute("data-locked", this.locked ? "true" : "false"), this.addBtn.disabled = this.locked, this.toggle.disabled = this.locked, this.deleteBtn.disabled = this.locked, this.addBtn.style.display = t ? "" : "none", this.toggle.textContent = "", this.toggle.appendChild(Jo(t ? "panel" : "source")), this.toggle.setAttribute(
      "title",
      t ? de("frontMatter.toggleToSource", "View source") : de("frontMatter.toggleToPanel", "View properties")
    ), this.panel.style.display = t ? "" : "none", this.source.style.display = t ? "none" : "", t && this.renderPanel();
  }
  /** 删除整个 front matter 节点；跳过原子叶落笔，文档删空时补一个空段落。 */
  removeBlock() {
    if (this.readLocked()) return;
    const t = this.getPos();
    if (t == null) return;
    const r = this.node.type.schema.nodes.paragraph, o = this.view.state.tr.delete(t, t + this.node.nodeSize), i = zn.findFrom(o.doc.resolve(t), 1, !0);
    if (i)
      o.setSelection(i);
    else {
      const a = o.doc.content.size;
      o.insert(a, r.create()), o.setSelection(H.create(o.doc, a + 1));
    }
    o.scrollIntoView(), this.view.dispatch(o), this.view.focus();
  }
  /** 面板最后一个可编辑输入行（单值输入 / tag）按 Enter：提交后把光标送到属性块下方的正文。 */
  exitBlock() {
    if (this.readLocked()) return;
    const t = this.getPos();
    if (t == null) return;
    const r = t + this.node.nodeSize, o = this.view.state.tr, i = zn.findFrom(o.doc.resolve(r), 1, !0);
    if (i)
      o.setSelection(i);
    else {
      const a = o.doc.content.size;
      o.insert(a, this.node.type.schema.nodes.paragraph.create()), o.setSelection(H.create(o.doc, a + 1));
    }
    o.scrollIntoView(), this.view.dispatch(o), this.view.focus();
  }
  /** 消费一次性标记：新建的空块在 DOM 挂载后展开待输入行（联想浮层按真实布局定位）。 */
  openPendingRowIfRequested() {
    if (Me !== this.view || (Me = null, this.mode !== "panel" || this.readLocked() || this.node.textContent !== "")) return;
    const t = () => {
      !this.dom.isConnected || this.mode !== "panel" || this.readLocked() || this.addPendingRow();
    };
    typeof queueMicrotask == "function" ? queueMicrotask(t) : setTimeout(t, 0);
  }
  renderPanel() {
    const t = Ke(this.node.textContent);
    if (this.panel.textContent = "", !t.ok) {
      const a = document.createElement("div");
      a.className = "fm-panel-warn", a.textContent = de("frontMatter.invalidYaml", "Invalid YAML — switch to source to edit"), this.panel.appendChild(a);
      return;
    }
    const r = document.createElement("div");
    r.className = "fm-list";
    const o = t.entries;
    let i = -1;
    if (o.forEach((a, c) => {
      const l = St(a.key, a);
      l !== "raw" && l !== "boolean" && (i = c);
    }), o.forEach((a, c) => {
      r.appendChild(this.buildRow(a, c === i));
    }), this.panel.appendChild(r), this.pendingListFocus !== null) {
      const a = this.pendingListFocus;
      this.pendingListFocus = null;
      for (const c of Array.from(this.panel.querySelectorAll(".fm-row")))
        if (c.querySelector(".fm-key-label")?.textContent === a) {
          c.querySelector(".fm-chips .fm-add-input")?.focus();
          break;
        }
    }
  }
  /**
   * 属性名联想候选：内置常用名 ∪ 本文已用属性名（去重）。
   * - 改名（`excludeKey` 非空）：排除正在编辑自身的 key，本文已用名优先靠前。
   * - 新增（`excludeKey` 为空）：排除文档里已存在的 key，避免建议出重复属性。
   */
  suggestKeys(t) {
    const r = Ke(this.node.textContent), o = r.ok ? r.entries : [], i = ti(o, t);
    if (t !== "") return i;
    const a = new Set(o.map((c) => c.key));
    return i.filter((c) => !a.has(c));
  }
  /**
   * 「添加属性」：直接新增一行（无需先填属性名）。行内 key 列为编辑态输入框、光标就位，
   * Enter/失焦提交（合法键名写回）；空值/非法/Escape 撤销该行。提交成功后整块重建。
   */
  addPendingRow() {
    if (this.readLocked() || this.mode !== "panel") return;
    const t = this.panel.querySelector(".fm-list");
    if (!t || t.querySelector(".fm-add-row")) return;
    const r = document.createElement("div");
    r.className = "fm-row fm-add-row", r.appendChild(Cn(""));
    const o = document.createElement("div");
    o.className = "fm-key";
    const i = document.createElement("input");
    i.className = "fm-key-edit", i.placeholder = de("frontMatter.addPropertyKeyPrompt", "Property name"), i.addEventListener("input", () => {
      r.firstChild && r.replaceChild(Cn(i.value), r.firstChild);
    });
    let a = null;
    const c = (u = !1) => {
      a?.destroy(), a = null;
      const d = r.contains(document.activeElement);
      r.remove(), u && d && this.view.focus();
    }, l = () => {
      if (!r.isConnected) return;
      const u = i === document.activeElement;
      a?.destroy(), a = null;
      const d = i.value;
      if (d && It(d) && this.commitEdit({ kind: "add", key: d, value: "", type: "text" })) {
        u && queueMicrotask(() => this.focusValueOf(d));
        return;
      }
      c(u);
    };
    a = Mt(i, {
      container: this.panel,
      candidates: () => this.suggestKeys(""),
      onSubmit: l,
      onCancel: () => c(!0)
    }), i.addEventListener("blur", l), o.appendChild(i), r.appendChild(o);
    const f = document.createElement("div");
    f.className = "fm-val", r.appendChild(f), t.appendChild(r), i.focus(), a?.open();
  }
  /** 提交新增行后把焦点交给该 key 的值控件（防御：写回后若出现同名行，取最后一行）。 */
  focusValueOf(t) {
    const r = Array.from(this.panel.querySelectorAll(".fm-row"));
    for (let o = r.length - 1; o >= 0; o--) {
      const i = r[o];
      if (i.querySelector(".fm-key-label")?.textContent !== t) continue;
      const a = i.querySelector(
        ".fm-val .fm-input, .fm-chips .fm-add-input, .fm-checkbox"
      );
      a ? a.focus() : this.view.focus();
      return;
    }
  }
  /** 单行：类型图标 + 键名单元（默认文本，点击编辑）+ 值控件 + 删除按钮。 */
  buildRow(t, r) {
    const o = document.createElement("div");
    o.className = "fm-row";
    const i = this.locked, a = Cn(t.key), c = i || Ko(t.key), l = document.createElement("div");
    l.className = c ? "fm-key fm-key-locked" : "fm-key", c || (l.tabIndex = 0);
    let f = null;
    const u = () => {
      f?.destroy(), f = null, l.textContent = "";
      const S = document.createElement("span");
      S.className = "fm-key-label", S.textContent = t.key, l.appendChild(S);
    }, d = () => {
      f?.destroy(), f = null;
      const S = l.querySelector(".fm-key-edit");
      if (!S) return;
      const O = S.value;
      if (!It(O) || O === t.key) {
        u();
        return;
      }
      this.commitEdit({ kind: "rename", key: t.key, nextKey: O }) || u();
    }, p = () => {
      if (l.querySelector(".fm-key-edit")) return;
      const S = document.createElement("input");
      S.className = "fm-key-edit", S.value = t.key, f = Mt(S, {
        container: this.panel,
        candidates: () => this.suggestKeys(t.key),
        onSubmit: d,
        onCancel: u
      }), S.addEventListener("change", d), S.addEventListener("blur", () => {
        l.contains(S) && S.value === t.key && u();
      }), l.textContent = "", l.appendChild(S), S.focus(), S.select();
    };
    u(), c || (l.addEventListener("mousedown", (S) => {
      S.target.classList.contains("fm-key-edit") || S.preventDefault();
    }), l.addEventListener("click", p), l.addEventListener("focus", p));
    const h = St(t.key, t), b = {
      ...t,
      type: h,
      // 已解析为可编辑类型时清掉 complex（空值曾被推断为 raw）；raw 保持只读降级。
      complex: h === "raw",
      value: Wo(h, t.value)
    }, v = document.createElement("div");
    v.className = "fm-val";
    const M = Eo(b, {
      commit: (S) => {
        const O = { kind: "setValue", key: t.key, value: S, type: h };
        if (h === "list") {
          this.pendingListFocus = t.key, this.commitEdit(O);
          return;
        }
        this.commitValueSilent(O);
      },
      // 最后一个可编辑输入行：单值输入 Enter 提交后跳出；列表 tag 空输入 Enter 跳出。
      onEnter: r && h !== "list" ? () => this.exitBlock() : void 0,
      onEmptyEnter: r && h === "list" ? () => this.exitBlock() : void 0
    });
    if (i && pi(M), v.appendChild(M), o.append(a, l, v), !i) {
      const S = document.createElement("button");
      S.type = "button", S.className = "fm-remove", S.textContent = "×", S.title = de("frontMatter.removeProperty", "Remove property"), S.addEventListener("mousedown", (O) => O.preventDefault()), S.addEventListener("click", () => void this.commitEdit({ kind: "remove", key: t.key })), o.appendChild(S);
    }
    return o;
  }
  /** 值控件的静默写回：落事务但不重建面板（避免打断输入 / 中文 IME）。 */
  commitValueSilent(t) {
    this.silentUpdate = !0;
    try {
      return this.commitEdit(t);
    } finally {
      this.silentUpdate = !1;
    }
  }
  /** 把一次编辑写回节点文本；写回被拒（无效/会破坏 YAML）返回 false。 */
  commitEdit(t) {
    const r = this.getPos();
    if (r == null) return !1;
    const o = Ke(this.node.textContent), i = si(o, t);
    if (i == null || !Ke(i).ok) return !1;
    const a = r + 1, c = r + this.node.nodeSize - 1, l = this.view.state.tr.replaceWith(a, c, i ? this.node.type.schema.text(i) : []);
    return this.view.dispatch(l), !0;
  }
}
const hi = (e, t, r, o) => {
  if (t !== 0 || e.tShift[t] !== 0) return !1;
  const i = e.bMarks[t];
  if (e.eMarks[t] - i !== 3 || e.src.slice(i, i + 3) !== "---") return !1;
  let c = -1;
  for (let u = t + 1; u <= r; u++) {
    const d = e.bMarks[u], p = e.eMarks[u];
    if (e.tShift[u] === 0 && p - d === 3 && e.src.slice(d, p) === "---") {
      c = u;
      break;
    }
  }
  if (c === -1) return !1;
  if (o) return !0;
  const l = e.src.slice(e.bMarks[t + 1], e.bMarks[c]).replace(/\n$/, ""), f = e.push("front_matter", "div", 0);
  return f.content = l, f.markup = "---", f.block = !0, f.map = [t, c + 1], e.line = c + 1, !0;
}, _i = {
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
      e.block.ruler.before("hr", "front_matter", hi, {
        alt: ["paragraph", "reference", "blockquote", "list"]
      });
    }
  ],
  parserTokens: {
    front_matter: (e, t, r) => {
      const o = t.content, i = o ? [r.text(o)] : [];
      e.push(r.nodes.front_matter.createChecked({}, i));
    }
  },
  blockHandlers: {
    front_matter: (e, t) => {
      e.write(`---
`), e.tick("inner");
      for (const r of t.textContent)
        e.tick("inner"), r === `
` ? (e.out += `
`, e.delim && (e.out += e.delim)) : e.out += r, e.advance(1);
      e.tick("inner"), e.write(`
---`), e.closeBlock(t);
    }
  },
  plugins: () => [
    new G({
      props: {
        nodeViews: {
          front_matter: (e, t, r) => fi(e, t, r)
        }
      }
    })
  ],
  keymap: (e) => ({
    Enter: (t, r, o) => {
      const i = t.selection;
      if (!i.empty) return !1;
      const a = i.$from, c = e.nodes.front_matter;
      if (a.parent.type.name === "paragraph" && a.depth === 1 && a.index(0) === 0 && a.parent.textContent === "---") {
        if (r) {
          const f = c.create(), u = a.before(), d = a.after(), p = t.tr;
          if (p.replaceWith(u, d, f), Yt() === "panel") {
            const h = u + f.nodeSize;
            h > p.doc.content.size - 2 && p.insert(h, e.nodes.paragraph.create()), p.setSelection(H.create(p.doc, h + 1));
          } else {
            const h = u + 1;
            p.setSelection(H.create(p.doc, h));
          }
          o && ci(o);
          try {
            r(p);
          } finally {
            o && ui(o);
          }
        }
        return !0;
      }
      if (a.parent.type === c) {
        const f = a.parent.textContent;
        if (a.parentOffset === f.length && f.endsWith(`
`)) {
          if (r) {
            const d = t.tr, p = a.after();
            d.delete(p - 2, p - 1);
            const h = p - 1, b = d.doc.content.size;
            if (h >= b) {
              const v = e.nodes.paragraph.create();
              d.insert(h, v);
            }
            d.setSelection(H.create(d.doc, h + 1)), r(d);
          }
          return !0;
        }
        return !1;
      }
      return !1;
    },
    ArrowDown: (t, r) => {
      const o = t.selection;
      if (!o.empty) return !1;
      const i = o.$from, a = t.schema.nodes.front_matter;
      if (i.parent.type !== a || i.parent.textContent.slice(i.parentOffset).includes(`
`)) return !1;
      if (r) {
        const f = t.tr, u = i.after(), d = f.doc.content.size;
        if (u >= d) {
          const p = t.schema.nodes.paragraph.create();
          f.insert(u, p);
        }
        f.setSelection(H.create(f.doc, u + 1)), r(f);
      }
      return !0;
    }
  })
}, gi = {
  id: "frontMatter",
  register: ({ editor: e, settings: t, t: r }) => (Gn({
    read: () => t.get(rn),
    write: (i) => t.set(rn, i),
    subscribe: (i) => t.onDidChange(
      (a) => i(a.values[rn] === "source" ? "source" : "panel")
    ).dispose
  }), At((i) => r(i)), [
    e.registerSyntaxFeature(_i),
    {
      dispose() {
        Gn(null), At(null);
      }
    }
  ])
}, Tn = "headingTypeIndicator_focus";
function bi(e) {
  const t = new Ve("headingTypeIndicator");
  let r = !1;
  return new G({
    key: t,
    state: {
      init: () => Q.empty,
      apply: (o, i, a, c) => {
        const l = o.getMeta(Tn);
        return l !== void 0 && (r = l), r ? ki(c) : Q.empty;
      }
    },
    props: {
      decorations(o) {
        return t.getState(o);
      },
      handleDOMEvents: {
        focus: (o) => (r || o.dispatch(o.state.tr.setMeta(Tn, !0)), !1),
        blur: (o) => (r && o.dispatch(o.state.tr.setMeta(Tn, !1)), !1)
      }
    }
  });
}
function Ot(e) {
  for (let t = e.depth; t >= 0; t--) {
    const r = e.node(t);
    if (r.type.name === "heading")
      return {
        level: r.attrs.level,
        from: e.before(t),
        to: e.before(t) + r.nodeSize
      };
  }
  return null;
}
function ki(e) {
  const { $from: t, $to: r } = e.selection, o = Ot(t) ?? Ot(r);
  if (!o || o.level < 1 || o.level > 6)
    return Q.empty;
  const i = ne.node(o.from, o.to, {
    class: "heading-type-indicator",
    "data-label": `H${o.level}`
  });
  return Q.create(e.doc, [i]);
}
const yi = {
  name: "heading-type-indicator",
  plugins: (e) => [bi()]
}, wi = {
  id: "headingIndicator",
  register: ({ editor: e }) => [e.registerSyntaxFeature(yi)]
}, xi = {
  id: "highlight",
  markName: "highlight",
  delim: "==",
  labelKey: "highlight.label",
  icon: "highlighter",
  order: 3
}, vi = [
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
], Ai = vi[0], Mn = "texto-plugin-highlight-color";
function Si(e) {
  const t = `color-mix(in oklab, ${e} 35%, transparent)`, r = `color-mix(in oklab, ${e} 50%, transparent)`;
  return `:root{--highlight-color:${t}}:root.dark{--highlight-color:${r}}`;
}
function Ei(e) {
  const t = typeof e == "string" && /^#[0-9a-fA-F]{6}$/.test(e) ? e : Ai;
  let r = document.getElementById(Mn);
  return r || (r = document.createElement("style"), r.id = Mn, document.head.appendChild(r)), r.textContent = Si(t), {
    dispose() {
      document.getElementById(Mn)?.remove();
    }
  };
}
function Ci(e) {
  function t(o, i) {
    const a = o.pos, c = o.src.charCodeAt(a);
    if (i || c !== 61)
      return !1;
    const l = o.scanDelims(o.pos, !0);
    let f = l.length;
    const u = String.fromCharCode(c);
    if (f < 2)
      return !1;
    if (f % 2) {
      const d = o.push("text", "", 0);
      d.content = u, f--;
    }
    for (let d = 0; d < f; d += 2) {
      const p = o.push("text", "", 0);
      p.content = u + u, !(!l.can_open && !l.can_close) && o.delimiters.push({
        marker: c,
        length: 0,
        // disable "rule of 3" length checks meant for emphasis
        jump: d / 2,
        // 1 delimiter = 2 characters
        token: o.tokens.length - 1,
        end: -1,
        open: l.can_open,
        close: l.can_close
      });
    }
    return o.pos += l.length, !0;
  }
  function r(o, i) {
    const a = [], c = i.length;
    for (let l = 0; l < c; l++) {
      const f = i[l];
      if (f.marker !== 61 || f.end === -1)
        continue;
      const u = i[f.end], d = o.tokens[f.token];
      d.type = "mark_open", d.tag = "mark", d.nesting = 1, d.markup = "==", d.content = "";
      const p = o.tokens[u.token];
      p.type = "mark_close", p.tag = "mark", p.nesting = -1, p.markup = "==", p.content = "", o.tokens[u.token - 1].type === "text" && o.tokens[u.token - 1].content === "=" && a.push(u.token - 1);
    }
    for (; a.length; ) {
      const l = a.pop();
      let f = l + 1;
      for (; f < o.tokens.length && o.tokens[f].type === "mark_close"; )
        f++;
      if (f--, l !== f) {
        const u = o.tokens[f];
        o.tokens[f] = o.tokens[l], o.tokens[l] = u;
      }
    }
  }
  e.inline.ruler.before("emphasis", "mark", t), e.inline.ruler2.before("emphasis", "mark", function(o) {
    let i;
    const a = o.tokens_meta, c = (o.tokens_meta || []).length;
    for (r(o, o.delimiters), i = 0; i < c; i++)
      a[i] && a[i].delimiters && r(o, a[i].delimiters);
  });
}
const Ti = {
  name: "highlight",
  marks: {
    highlight: {
      parseDOM: [{ tag: "mark" }],
      toDOM: () => ["mark", 0]
    }
  },
  mdItPlugins: [(e) => e.use(Ci)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike 的 s_open / s_close 同构，缺了会让回退路径丢掉 `==` 字面。
  parserTokens: {
    mark_open: (e, t, r) => {
      e.addText(t.markup), e.openMark(r.marks.highlight.create());
    },
    mark_close: (e, t, r) => {
      e.closeMarkType(r.marks.highlight), e.addText(t.markup);
    }
  },
  markDelims: {
    highlight: { open: "", close: "" }
  },
  inline: {
    // v2：语义归 md-it，位置归骨架；本特性只声明「成对 token → mark」。
    order: -1,
    derive: (e) => Ln(e, { open: "mark_open", close: "mark_close", mark: "highlight" }),
    markNames: ["highlight"],
    extRanges: (e) => Te(e, "highlight", 2)
  }
}, Mi = {
  id: "highlight",
  register: ({ editor: e, settings: t }) => [
    e.registerSyntaxFeature(Ti),
    e.registerFormatToolbarItem(xi),
    // 颜色样式表随特性一起释放：关闭高亮（或改色触发重装）时先移除再重建
    Ei(t.get("highlightColor"))
  ]
}, $n = /* @__PURE__ */ new Set();
function Li(e) {
  return $n.add(e), () => $n.delete(e);
}
function Ii() {
  for (const e of $n) e();
}
const Oi = /* @__PURE__ */ new Set([
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
]), Ni = /* @__PURE__ */ new Set(["script", "pre", "style", "textarea"]);
function dr(e) {
  if (/^\s{0,3}<!--$/.test(e)) return { tag: "!" };
  const t = e.match(/^\s{0,3}<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)>?$/);
  if (!t || t[1] === "/") return null;
  const r = (t[2] ?? "").toLowerCase(), o = Ni.has(r);
  return !Oi.has(r) && !o || !e.trimEnd().endsWith(">") && !o ? null : { tag: r };
}
const pr = /* @__PURE__ */ new Set([
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
function $i(e) {
  const t = {}, r = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let o;
  for (; o = r.exec(e); ) {
    const i = o[2] ?? o[3] ?? o[4] ?? "";
    i && (t[o[1]] = i);
  }
  return t;
}
function Nt(e, t) {
  const r = [];
  let o = 0;
  for (; o < e.length; ) {
    if (t[o] || e[o] !== "<") {
      o++;
      continue;
    }
    const i = e[o + 1];
    if (!i || i === "/" || i === "!") {
      o++;
      continue;
    }
    const a = o + 1;
    let c = a;
    for (; c < e.length && /[a-zA-Z]/.test(e[c]); ) c++;
    if (c === a) {
      o++;
      continue;
    }
    const l = e.slice(a, c).toLowerCase();
    if (!pr.has(l)) {
      o++;
      continue;
    }
    const f = c;
    let u = -1, d = !1;
    for (let R = f; R < e.length; R++) {
      if (t[R]) {
        d = !0;
        break;
      }
      if (e[R] === ">") {
        u = R + 1;
        break;
      }
    }
    if (d || u === -1) {
      o = u > 0 ? u : c;
      continue;
    }
    for (let R = o; R < u; R++)
      if (t[R]) {
        d = !0;
        break;
      }
    if (d) {
      o = u;
      continue;
    }
    const p = e.slice(f, u - 1).trim(), h = $i(p), b = `</${l}>`;
    let v = -1;
    for (let R = u; R < e.length; R++)
      if (!t[R] && e.startsWith(b, R)) {
        v = R;
        break;
      }
    if (v === -1) {
      o = u;
      continue;
    }
    const M = v + b.length;
    for (let R = v; R < M; R++)
      if (t[R]) {
        d = !0;
        break;
      }
    if (d) {
      o = M;
      continue;
    }
    const S = u, O = v;
    if (S >= O) {
      o = M;
      continue;
    }
    We(t, o, u), We(t, v, M);
    const P = u - o, B = M - v;
    r.push({
      type: "html_inline",
      from: S,
      to: O,
      openFrom: o,
      openTo: u,
      closeFrom: v,
      closeTo: M,
      attrs: { tag: l, htmlAttrs: h, openLen: P, closeLen: B }
    }), o = M;
  }
  return r;
}
function Ri(e) {
  return _r({
    match: (t) => {
      const r = dr(t);
      return r ? { data: r, prefixLen: t.match(/^\s*/)?.[0].length ?? 0 } : null;
    },
    draftClass: () => "html-block-draft",
    commit: (t, r, o, i) => {
      const a = i.tag === "!" ? "<!--" : o.textContent.trim(), c = i.tag === "!" ? "-->" : `</${i.tag}>`, l = e.nodes.html_block.create(
        null,
        e.text(a + `
` + c)
      );
      t.replaceWith(r, r + o.nodeSize, l);
    }
  });
}
function qi() {
  return new G({
    props: {
      nodeViews: {
        html_block: (e, t, r) => {
          const o = document.createElement("html-block"), i = document.createElement("div");
          i.className = "html-block-code", o.setAttribute("data-export", "html"), i.setAttribute("data-export-source", ""), o.appendChild(i);
          const a = document.createElement("div");
          a.className = "html-block-render", a.contentEditable = "false", a.style.display = "none", o.appendChild(a);
          let c = null, l = !1, f = e;
          return Promise.resolve().then(() => Tl).then(({ createHtmlBlockView: u }) => {
            l || (c = u({ dom: o, contentDOM: i, renderContainer: a, view: t, getPos: r, node: f }), c.update(f));
          }).catch(() => {
          }), {
            dom: o,
            contentDOM: i,
            update(u) {
              return f = u, c ? c.update(u) : !0;
            },
            destroy() {
              l = !0, c?.destroy();
            },
            stopEvent(u) {
              return c?.stopEvent(u) ?? !1;
            },
            ignoreMutation(u) {
              return c?.ignoreMutation(u) ?? !1;
            }
          };
        }
      }
    }
  });
}
function Fi() {
  const e = new Ve("htmlBlockSelectionWatcher");
  return new G({
    key: e,
    view: () => ({
      update: (t, r) => {
        const o = r.selection, i = t.state.selection;
        (o.from !== i.from || o.to !== i.to) && Ii();
      }
    })
  });
}
const Di = {
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
    html_block: (e, t) => {
      e.write(), e.tick("inner");
      for (const r of t.textContent)
        e.tick("inner"), r === `
` ? (e.out += `
`, e.delim && (e.out += e.delim)) : e.out += r, e.advance(1);
      e.tick("inner"), e.closeBlock(t);
    }
  },
  plugins: (e) => [
    Ri(e).plugin,
    qi(),
    Fi()
  ],
  keymap: (e) => ({
    Enter: (t, r) => {
      const o = t.selection;
      if (!o.empty) return !1;
      const i = o.$from, a = i.parent;
      if (a.type.name !== "paragraph") return !1;
      const c = dr(a.textContent);
      if (!c) return !1;
      if (r) {
        const l = c.tag === "!" ? "<!--" : a.textContent.trim(), f = c.tag === "!" ? "-->" : `</${c.tag}>`, u = i.before(), d = e.nodes.html_block.create(null, e.text(l + `
` + f)), p = t.tr.replaceWith(u, u + a.nodeSize, d);
        p.setSelection(H.create(p.doc, u + 1 + l.length + 1)), r(p);
      }
      return !0;
    },
    Backspace: (t, r) => {
      const o = t.selection;
      if (!o.empty) return !1;
      const i = o.$from;
      if (i.parent.type.name !== "html_block" || i.parent.content.size > 0) return !1;
      if (r) {
        const a = i.before(), c = i.parent.nodeSize, l = t.tr.delete(a, a + c);
        if (l.doc.content.size === 0) {
          const f = e.nodes.paragraph.createAndFill();
          f && l.insert(0, f);
        }
        r(l);
      }
      return !0;
    },
    ArrowDown: (t, r) => {
      const o = t.selection;
      if (!o.empty) return !1;
      const i = o.$from, a = t.schema.nodes.html_block;
      if (i.parent.type === a) {
        if (i.parent.textContent.slice(i.parentOffset).includes(`
`)) return !1;
        if (r) {
          const p = t.tr, h = i.after(), b = p.doc.content.size;
          if (h >= b) {
            const v = t.schema.nodes.paragraph.create();
            p.insert(h, v);
          }
          p.setSelection(H.create(p.doc, h + 1)), r(p);
        }
        return !0;
      }
      if (!i.parent.isTextblock || i.parent.textContent.slice(i.parentOffset).includes(`
`)) return !1;
      const f = t.doc.nodeAt(i.after());
      return !f || f.type !== a || f.textContent.trim() === "" ? !1 : (r && r(t.tr.setSelection(H.create(t.tr.doc, i.after() + 1))), !0);
    },
    ArrowUp: (t, r) => {
      const o = t.selection;
      if (!o.empty) return !1;
      const i = o.$from, a = t.schema.nodes.html_block;
      if (!i.parent.isTextblock || i.parent.textContent.slice(0, i.parentOffset).includes(`
`)) return !1;
      const u = t.doc.resolve(i.before()).nodeBefore;
      return !u || u.type !== a || u.textContent.trim() === "" ? !1 : (r && r(t.tr.setSelection(H.create(t.tr.doc, i.before() - 1))), !0);
    }
  }),
  parserTokens: {
    html_block: (e, t, r) => {
      const o = t.content.replace(/\n$/, ""), i = o ? [r.text(o)] : [];
      e.push(r.nodes.html_block.create(null, i));
    }
  }
}, $t = /<!--([\s\S]*?)-->/g;
function Pi(e, t) {
  const r = [];
  $t.lastIndex = 0;
  let o;
  for (; o = $t.exec(e); ) {
    const i = o.index, a = i + o[0].length;
    let c = !1;
    for (let l = i; l < a; l++)
      if (t[l]) {
        c = !0;
        break;
      }
    c || (We(t, i, a), r.push({
      type: "html_comment",
      from: i,
      to: a,
      openFrom: i,
      openTo: i,
      closeFrom: a,
      closeTo: a,
      opaque: !0
    }));
  }
  return r;
}
const ji = {
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
    derive: (e) => Pi(e.text, e.consumed),
    markNames: ["html_comment"],
    extRanges: (e) => {
      const t = [], r = e.type.schema.marks.html_comment;
      if (!r) return t;
      let o = -1, i = 0;
      const a = (c) => {
        o >= 0 && t.push([o, c]), o = -1;
      };
      return e.forEach((c) => {
        c.isText && (c.marks.some((f) => f.type === r) ? o < 0 && (o = i) : a(i)), i += c.nodeSize;
      }), a(i), t;
    }
  }
}, Bi = {
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
          const t = e, r = t.tagName.toLowerCase();
          if (!pr.has(r)) return !1;
          const o = {};
          for (const i of t.attributes)
            i.name.startsWith("data-") || (o[i.name] = i.value);
          return { tag: r, htmlAttrs: o, openLen: 0, closeLen: 0 };
        }
      }],
      toDOM: (e) => {
        const { tag: t, htmlAttrs: r } = e.attrs;
        return [t, r, 0];
      }
    }
  },
  markDelims: {
    html_inline: { open: "", close: "" }
  },
  inline: {
    order: 0.3,
    derive: (e) => Nt(e.text, e.consumed),
    markNames: ["html_inline"],
    extRanges: (e) => {
      const t = [], r = e.type.schema.marks.html_inline;
      if (!r) return t;
      let o = -1, i = 0, a = 0, c = 0;
      const l = (f) => {
        o >= 0 && t.push([o - i, f + a]), o = -1;
      };
      return e.forEach((f) => {
        if (f.isText) {
          const u = f.marks.find((d) => d.type === r);
          if (u && o < 0) {
            o = c;
            const d = u.attrs;
            i = d.openLen ?? 0, a = d.closeLen ?? 0;
          } else u || l(c);
        }
        c += f.nodeSize;
      }), l(c), t;
    }
  },
  parserPostProcess: (e) => {
    const t = e.type.schema.marks.html_inline;
    if (!t) return e;
    const r = new kr(e);
    let o = !1;
    return e.descendants((i, a) => {
      if (!i.isTextblock || i.type.name === "code_block") return !0;
      const c = i.textContent, l = Nt(c, new Uint8Array(c.length));
      if (l.length === 0) return !0;
      const f = a + 1;
      for (const u of l)
        u.type === "html_inline" && (r.addMark(f + u.from, f + u.to, t.create(u.attrs)), o = !0);
      return !1;
    }), o ? r.doc : e;
  }
}, zi = {
  name: "html:md-config",
  mdItPlugins: [
    (e) => {
      e.set({ html: !0 }), e.inline.ruler.disable(["html_inline"]);
    }
  ]
}, Hi = {
  id: "html",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(zi),
    e.registerSyntaxFeature(Di),
    e.registerSyntaxFeature(Bi),
    e.registerSyntaxFeature(ji)
  ]
}, Yi = ["latex", "math"], Ki = {
  id: "math.copy-latex",
  labelKey: "math.copyLatex",
  requires: ["block"],
  order: 10,
  when: (e) => {
    const t = e.block?.node;
    return t?.type.name === "code_block" && Yi.includes(t.attrs.lang);
  },
  run: (e) => {
    const t = e.block?.node;
    if (t)
      return navigator.clipboard.writeText(t.textContent);
  }
}, Ui = [["path", "M18 7V4H6l6 8-6 8h12v-3"]], Wi = {
  // 裸 slug：宿主按 id 去重，且须与原生菜单项 / 快捷键 / 命令分发的 action id 一致。
  id: "math_block",
  keyword: "math",
  labelKey: "math.mathBlock",
  descriptionKey: "math.mathBlockDesc",
  icon: Ui,
  defaultShortcut: "Cmd+Shift+M",
  category: "paragraph",
  order: 3,
  insert(e) {
    const r = e.state.schema.nodes.code_block;
    if (!r) return;
    const { $from: o } = e.state.selection, i = e.state.tr.replaceWith(
      o.before(),
      o.after(),
      r.create({ lang: "latex" })
    );
    e.dispatch(i), e.focus();
  }
};
function Vi(e) {
  const t = document.createElement("div");
  t.className = "math-preview";
  let r = 0;
  return {
    dom: t,
    update(o, i) {
      const a = ++r, c = o.textContent;
      if (!c.trim()) {
        t.innerHTML = '<div class="cb-render-empty">Empty formula</div>';
        return;
      }
      t.innerHTML = '<div class="cb-render-loading">Rendering...</div>', Dt(c, {
        mode: "display",
        decorate: (l) => {
          l.style.maxWidth = "100%", l.style.height = "auto";
        }
      }).then((l) => {
        a === r && (t.innerHTML = `<div class="math-svg-container">${l}</div>`);
      }).catch((l) => {
        a === r && i.onError(l?.message ?? String(l));
      });
    },
    destroy() {
      r += 1;
    }
  };
}
const Rt = {
  $: { close: "$" },
  "\\(": { close: "\\)", openClass: "math-delim-open", closeClass: "math-delim-close" }
};
function Bn(e) {
  return Object.prototype.hasOwnProperty.call(Rt, e) ? Rt[e] : null;
}
function Gi({
  text: e,
  pos: t,
  token: r
}) {
  const o = Bn(r.markup);
  if (!o) return null;
  const i = r.content, a = t, c = a + r.markup.length;
  if (!e.startsWith(r.markup, a) || !e.startsWith(i, c)) return null;
  const l = c + i.length;
  if (!e.startsWith(o.close, l)) return null;
  const f = l + o.close.length;
  let u = c, d = l;
  for (; u < d && /\s/.test(e[u]); ) u++;
  for (; d > u && /\s/.test(e[d - 1]); ) d--;
  const p = e.slice(u, d), h = {
    type: "inline_math",
    from: u,
    to: d,
    openFrom: a,
    openTo: c,
    closeFrom: l,
    closeTo: f,
    attrs: { latex: p },
    opaque: !0,
    delimRanges: [
      { from: a, to: c, ...o.openClass ? { className: o.openClass } : {} },
      { from: u, to: d, softInside: !0 },
      { from: l, to: f, ...o.closeClass ? { className: o.closeClass } : {} }
    ]
  };
  return p && (h.widgetDecorations = [
    { pos: u, when: "outside", kind: "math-render", attrs: { latex: p }, side: -1 }
  ]), h;
}
function Xi(e, t, r) {
  if (r.type !== "math_inline") return null;
  const o = Bn(r.markup);
  if (!o || !e.startsWith(r.markup, t)) return null;
  const i = t + r.markup.length;
  if (!e.startsWith(r.content, i)) return null;
  const a = i + r.content.length;
  return e.startsWith(o.close, a) ? a + o.close.length - t : null;
}
function Qi(e) {
  const t = [];
  for (const r of e.tokens) {
    if (r.token.type !== "math_inline" || !r.exact) continue;
    const o = Gi({
      text: e.text,
      pos: r.pos,
      token: r.token
    });
    o && t.push(o);
  }
  return t;
}
typeof window < "u" && !customElements.get("math-jax") && customElements.define(
  "math-jax",
  class extends HTMLElement {
    constructor() {
      super(), this.addEventListener("mousedown", (t) => {
        t.button !== 0 && t.preventDefault();
      });
    }
    // data-render 是「连接后才懒观察」的开关：只有 render widget 需要它。
    // 放在 connectedCallback 而非 builder 里 observe，是因为 PM 逐事务重建
    // 装饰时会丢弃未挂载的孤儿元素——连接时才 observe，孤儿元素就不会进入
    // 观察集合，也就不会触发渲染回调泄漏。
    connectedCallback() {
      this.style.display = "inline-block", this.style.verticalAlign = "middle", this.style.lineHeight = "1", this.hasAttribute("data-render") && Ft().observe(this);
    }
    disconnectedCallback() {
      Ft().unobserve(this);
    }
    static get observedAttributes() {
      return ["latex", "data-formula"];
    }
    attributeChangedCallback(t, r, o) {
      r !== o && t === "data-formula" && o && this.removeAttribute("data-rendered");
    }
  }
);
const qt = /* @__PURE__ */ new Map(), Zi = "v1";
let Ue = null;
function Ft() {
  return Ue || (Ue = new IntersectionObserver(
    (e) => {
      e.forEach((t) => {
        if (t.isIntersecting) {
          const r = t.target, o = r.getAttribute("data-formula");
          o && !r.hasAttribute("data-rendered") && (r.setAttribute("data-rendered", "true"), Ji(o).then((i) => {
            i && r.isConnected ? r.innerHTML = i : r.isConnected && (r.textContent = o);
          })), Ue?.unobserve(r);
        }
      });
    },
    { root: null, rootMargin: "100px", threshold: 0 }
  )), Ue;
}
async function Ji(e) {
  const t = `${Zi}:${e}`, r = qt.get(t);
  if (r) return r;
  try {
    const o = await Dt(e, {
      mode: "inline",
      decorate: (i) => {
        const a = i.getAttribute("viewBox");
        (a ? a.split(" ").map(Number).filter((l) => !Number.isNaN(l)) : []).length !== 4 && i.setAttribute("viewBox", "0 -700 1000 1400"), i.style.pointerEvents = "none";
      }
    });
    return qt.set(t, o), o;
  } catch (o) {
    return console.error("Math render error:", o), null;
  }
}
function el(e) {
  const t = document.createElement("math-jax");
  return t.setAttribute("latex", e), t.setAttribute("data-formula", e), t.setAttribute("contenteditable", "false"), t.textContent = e, t;
}
const nl = (e) => {
  const t = el(e.latex ?? "");
  return t.setAttribute("data-render", "1"), t;
};
function mr(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function j(e, t) {
  const r = j.mergeDelimiters(t && t.delimiters), o = t && t.outerSpace || !1, i = t && t.katexOptions || {};
  i.throwOnError = i.throwOnError || !1, i.macros = i.macros || t && t.macros, j.katex || (t && typeof t.engine == "object" ? j.katex = t.engine : j.katex = { renderToString() {
    return "No math renderer found.";
  } });
  for (const a of r.inline)
    o && "outerSpace" in a && (a.outerSpace = !0), e.inline.ruler.before("escape", a.name, j.inline(a)), e.renderer.rules[a.name] = (c, l) => a.tmpl.replace(/\$1/, j.render(c[l].content, !!a.displayMode, i));
  for (const a of r.block)
    e.block.ruler.before("fence", a.name, j.block(a)), e.renderer.rules[a.name] = (c, l) => a.tmpl.replace(/\$2/, mr(c[l].info)).replace(/\$1/, j.render(c[l].content, !0, i));
}
j.mergeDelimiters = function(e) {
  const t = Array.isArray(e) ? e : typeof e == "string" ? [e] : ["dollars"], r = { inline: [], block: [] };
  for (const o of t)
    o in j.rules && (r.inline.push(...j.rules[o].inline), r.block.push(...j.rules[o].block));
  return r;
};
j.inline = (e) => function(t, r) {
  const o = t.pos, i = t.src, c = i.startsWith(e.tag, e.rex.lastIndex = o) && (!e.pre || e.pre(i, e.outerSpace, o)) && e.rex.exec(i), l = !!c && o < e.rex.lastIndex && (!e.post || e.post(i, e.outerSpace, e.rex.lastIndex - 1));
  if (l) {
    if (!r) {
      const f = t.push(e.name, "math", 0);
      f.content = c[1], f.markup = e.tag;
    }
    t.pos = e.rex.lastIndex;
  }
  return l;
};
j.block = (e) => function(r, o, i, a) {
  const c = r.bMarks[o] + r.tShift[o], l = r.src, u = l.startsWith(e.tag, e.rex.lastIndex = c) && (!e.pre || e.pre(l, !1, c)) && e.rex.exec(l), d = !!u && c < e.rex.lastIndex && (!e.post || e.post(l, !1, e.rex.lastIndex - 1));
  if (d && !a) {
    const p = e.rex.lastIndex - 1;
    let h;
    for (h = o; h < i && !(p >= r.bMarks[h] + r.tShift[h] && p <= r.eMarks[h]); h++)
      ;
    const b = r.lineMax, v = r.parentType;
    r.lineMax = h, r.parentType = "math", v === "blockquote" && (u[1] = u[1].replace(/(\n*?^(?:\s*>)+)/gm, ""));
    let M = r.push(e.name, "math", 0);
    M.block = !0, M.tag = e.tag, M.markup = "", M.content = u[1], M.info = u[u.length - 1], M.map = [o, h + 1], r.parentType = v, r.lineMax = b, r.line = h + 1;
  }
  return d;
};
j.render = function(e, t, r) {
  r.displayMode = t;
  let o;
  try {
    o = j.katex.renderToString(e, r);
  } catch (i) {
    o = mr(`${e}:${i.message}`);
  }
  return o;
};
j.use = function(e) {
  return j.katex = e, j;
};
j.inlineRuleNames = ["math_inline", "math_inline_double"];
j.blockRuleNames = ["math_block", "math_block_eqno"];
j.$_pre = (e, t, r) => {
  const o = r > 0 ? e[r - 1].charCodeAt(0) : !1;
  return t ? !o || o === 32 : !o || o !== 92 && (o < 48 || o > 57);
};
j.$_post = (e, t, r) => {
  const o = e[r + 1] && e[r + 1].charCodeAt(0);
  return t ? !o || o === 32 || o === 46 || o === 44 || o === 59 : !o || o < 48 || o > 57;
};
j.rules = {
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
        pre: j.$_pre,
        post: j.$_post
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
        pre: j.$_pre,
        post: j.$_post
      },
      {
        name: "math_inline",
        rex: /\$((?:[^\s\\])|(?:\S.*?[^\s\\]))\$/gy,
        tmpl: "<eq>$1</eq>",
        tag: "$",
        outerSpace: !1,
        pre: j.$_pre,
        post: j.$_post
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
function tl(e) {
  e.use(j, {
    engine: { renderToString: (t) => t },
    delimiters: "dollars"
  });
  for (const t of j.rules.brackets.inline)
    e.inline.ruler.before("escape", t.name, j.inline(t));
}
const rl = {
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
  mdItPlugins: [tl],
  parserTokens: {
    math_inline: (e, t, r) => {
      const o = t.content;
      if (!o) return;
      const i = Bn(t.markup);
      if (!i) {
        e.addText(t.markup + o + t.markup);
        return;
      }
      const a = r.marks.inline_math.create({ latex: o });
      e.addText(t.markup), e.openMark(a), e.addText(o), e.closeMarkType(r.marks.inline_math), e.addText(i.close);
    },
    math_block: (e, t, r) => {
      const o = t.content.replace(/^\n+|\n+$/g, ""), i = o ? [r.text(o)] : [];
      e.push(r.nodes.code_block.createChecked({ lang: "latex" }, i));
    }
  },
  inline: {
    order: -1,
    derive: Qi,
    tokenAdvance: Xi,
    markNames: ["inline_math"],
    extRanges: (e) => Te(e, "inline_math", 1, 1),
    suppressFormatToolbar: !0,
    decorationWidgets: {
      "math-render": nl
    }
  }
}, ol = ["latex", "math"], il = {
  id: "math",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(rl),
    e.registerExtension(
      gr({
        id: "math.renderer",
        languages: ol,
        createPreview: Vi
      })
    ),
    e.registerInsertCommand(Wi),
    e.registerContextMenuItem(Ki)
  ]
}, ll = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function al(e, t) {
  const r = e.posMax, o = e.pos;
  if (e.src.charCodeAt(o) !== 126 || t || o + 2 >= r)
    return !1;
  e.pos = o + 1;
  let i = !1;
  for (; e.pos < r; ) {
    if (e.src.charCodeAt(e.pos) === 126) {
      i = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!i || o + 1 === e.pos)
    return e.pos = o, !1;
  const a = e.src.slice(o + 1, e.pos);
  if (a.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = o, !1;
  e.posMax = e.pos, e.pos = o + 1;
  const c = e.push("sub_open", "sub", 1);
  c.markup = "~";
  const l = e.push("text", "", 0);
  l.content = a.replace(ll, "$1");
  const f = e.push("sub_close", "sub", -1);
  return f.markup = "~", e.pos = e.posMax + 1, e.posMax = r, !0;
}
function sl(e) {
  e.inline.ruler.after("emphasis", "sub", al);
}
const cl = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function ul(e, t) {
  const r = e.posMax, o = e.pos;
  if (e.src.charCodeAt(o) !== 94 || t || o + 2 >= r)
    return !1;
  e.pos = o + 1;
  let i = !1;
  for (; e.pos < r; ) {
    if (e.src.charCodeAt(e.pos) === 94) {
      i = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!i || o + 1 === e.pos)
    return e.pos = o, !1;
  const a = e.src.slice(o + 1, e.pos);
  if (a.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = o, !1;
  e.posMax = e.pos, e.pos = o + 1;
  const c = e.push("sup_open", "sup", 1);
  c.markup = "^";
  const l = e.push("text", "", 0);
  l.content = a.replace(cl, "$1");
  const f = e.push("sup_close", "sup", -1);
  return f.markup = "^", e.pos = e.posMax + 1, e.posMax = r, !0;
}
function fl(e) {
  e.inline.ruler.after("emphasis", "sup", ul);
}
const dl = {
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
  mdItPlugins: [(e) => e.use(sl).use(fl)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike / highlight 的 s_* / mark_* 同构，分隔符取自 tok.markup。
  parserTokens: {
    sub_open: (e, t, r) => {
      e.addText(t.markup), e.openMark(r.marks.sub.create());
    },
    sub_close: (e, t, r) => {
      e.closeMarkType(r.marks.sub), e.addText(t.markup);
    },
    sup_open: (e, t, r) => {
      e.addText(t.markup), e.openMark(r.marks.sup.create());
    },
    sup_close: (e, t, r) => {
      e.closeMarkType(r.marks.sup), e.addText(t.markup);
    }
  },
  markDelims: {
    sub: { open: "", close: "" },
    sup: { open: "", close: "" }
  },
  inline: {
    order: -1,
    derive: (e) => [
      ...Ln(e, { open: "sub_open", close: "sub_close", mark: "sub" }),
      ...Ln(e, { open: "sup_open", close: "sup_close", mark: "sup" })
    ],
    markNames: ["sub", "sup"],
    extRanges: (e) => [
      ...Te(e, "sub", 1),
      ...Te(e, "sup", 1)
    ]
  }
}, pl = {
  id: "subSup",
  register: ({ editor: e }) => [e.registerSyntaxFeature(dl)]
}, Rn = /* @__PURE__ */ new Set();
class ml {
  dom;
  view;
  // Cache the last rendered (doc, items) so the refresh plugin bails out fast
  // when nothing relevant to the TOC changed (refresh fires on every tx).
  lastDoc = null;
  lastSig = "";
  constructor(t, r) {
    this.view = r, this.dom = document.createElement("div"), this.dom.className = "toc", this.dom.setAttribute("contenteditable", "false"), this.render(), Rn.add(this);
  }
  render() {
    const t = this.view.state.doc;
    if (t === this.lastDoc) return;
    const r = [];
    t.descendants((a, c) => {
      a.type.name === "heading" && r.push({
        level: a.attrs.level,
        text: a.textContent,
        pos: c
      });
    });
    const o = r.map((a) => `${a.pos}	${a.level}	${a.text}`).join(`
`);
    if (o === this.lastSig && this.lastDoc !== null) {
      this.lastDoc = t;
      return;
    }
    if (this.lastDoc = t, this.lastSig = o, this.dom.innerHTML = "", r.length === 0) {
      const a = document.createElement("div");
      a.className = "toc-empty", a.textContent = "(no headings yet)", this.dom.appendChild(a);
      return;
    }
    const i = document.createElement("ul");
    i.className = "toc-list";
    for (const a of r) {
      const c = document.createElement("li");
      c.className = `toc-item toc-h${a.level}`, c.textContent = a.text || "(empty heading)", c.addEventListener("mousedown", (l) => {
        l.preventDefault();
      }), c.addEventListener("click", () => this.jumpTo(a.pos)), i.appendChild(c);
    }
    this.dom.appendChild(i);
  }
  jumpTo(t) {
    const r = this.view.state.tr;
    r.setSelection(H.near(r.doc.resolve(t + 1))), this.view.dispatch(r), this.view.nodeDOM(t)?.scrollIntoView({ block: "start", behavior: "smooth" }), this.view.focus();
  }
  // The node never changes (atom, no attrs/content); the refresh plugin calls
  // render() externally. Returning true tells PM "we handled it".
  update() {
    return !0;
  }
  destroy() {
    Rn.delete(this);
  }
  // Atom block — selectable and PM should treat the whole node as a unit.
  stopEvent() {
    return !1;
  }
  ignoreMutation() {
    return !0;
  }
}
function hl() {
  return new G({
    view() {
      const e = () => {
        for (const t of Rn) t.render();
      };
      return e(), {
        update() {
          e();
        }
      };
    }
  });
}
const _l = {
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
    hl(),
    new G({
      props: {
        nodeViews: {
          toc: (e, t) => new ml(e, t)
        }
      }
    })
  ],
  keymap: () => ({
    // Convert paragraph `[toc]` / `[TOC]` to a toc node on Enter.
    Enter: (e, t) => {
      const r = e.selection;
      if (!r.empty) return !1;
      const o = r.$from;
      if (o.parent.type.name !== "paragraph") return !1;
      const i = o.parent.textContent;
      if (i !== "[toc]" && i !== "[TOC]") return !1;
      if (t) {
        const a = e.schema, c = a.nodes.toc.create(), l = o.before(), f = o.after(), u = e.tr;
        u.replaceWith(l, f, [
          c,
          a.nodes.paragraph.create()
        ]);
        const d = l + c.nodeSize + 1;
        u.setSelection(H.create(u.doc, d)), t(u);
      }
      return !0;
    }
  }),
  parserPostProcess: (e) => {
    const t = [];
    let r = !1;
    const o = e.type.schema.nodes.toc;
    return !o || (e.forEach((i) => {
      i.type.name === "paragraph" && (i.textContent === "[toc]" || i.textContent === "[TOC]") ? (t.push(o.create()), r = !0) : t.push(i);
    }), !r) ? e : e.type.create(e.attrs, t, e.marks);
  },
  blockHandlers: {
    toc: (e, t) => {
      e.write("[toc]"), e.closeBlock(t);
    }
  }
}, gl = {
  id: "toc",
  register: ({ editor: e }) => [e.registerSyntaxFeature(_l)]
}, bl = {
  id: "underline",
  markName: "underline",
  delim: "<u>",
  closeDelim: "</u>",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.underline.label`）
  labelKey: "underline.label",
  icon: "underline",
  order: 4
};
function kl(e, t) {
  const r = [], i = "</u>";
  for (let a = 0; a < e.length; ) {
    if (t[a] || !e.startsWith("<u>", a)) {
      a++;
      continue;
    }
    const c = a, l = a + 3, f = l;
    let u = -1;
    for (let h = f; h < e.length; h++)
      if (!t[h] && e.startsWith(i, h)) {
        u = h;
        break;
      }
    if (u === -1) break;
    const d = u + i.length, p = u;
    if (f >= p) {
      a = d;
      continue;
    }
    if (/\s/.test(e[f]) || /\s/.test(e[p - 1])) {
      a = f;
      continue;
    }
    for (let h = c; h < d; h++) t[h] = 1;
    r.push({ type: "underline", from: f, to: p, openFrom: c, openTo: l, closeFrom: u, closeTo: d, wrap: !0 }), a = d;
  }
  return r;
}
function yl() {
  return (e, t) => {
    const { from: r, to: o, empty: i } = e.selection;
    if (i) return !1;
    const a = e.doc, c = "<u>", l = "</u>", f = c.length, u = l.length, d = r >= f ? a.textBetween(r - f, r) : "", p = o + u <= a.content.size ? a.textBetween(o, o + u) : "";
    if (d === c && p === l)
      return t && t(e.tr.delete(o, o + u).delete(r - f, r)), !0;
    if (t) {
      const h = a.textBetween(r, o), b = e.tr.replaceWith(r, o, e.schema.text(c + h + l));
      b.setSelection(H.create(b.doc, r + f, r + f + h.length)), t(b);
    }
    return !0;
  };
}
const wl = {
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
    derive: (e) => kl(e.text, e.consumed),
    markNames: ["underline"],
    extRanges: (e) => Te(e, "underline", 3, 4)
  },
  keymap: () => ({
    "Mod-u": yl()
  })
}, xl = {
  id: "underline",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(wl),
    e.registerFormatToolbarItem(bl)
  ]
}, vl = [
  Ar,
  pl,
  xl,
  Vr,
  Ir,
  wi,
  gl,
  Mi,
  Hi,
  il,
  _o,
  gi
], Al = "en-US", Sl = {
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
}, El = /* @__PURE__ */ new Set(["view"]);
class Ul extends br {
  featureResources = [];
  /** 上次装配时的设置签名；显示偏好变化不参与比较。 */
  lastSettingsSignature = null;
  onload() {
    this.addMessages(Sl, Al), this.syncFeatures(), this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }
  onunload() {
    this.disposeFeatures(), this.lastSettingsSignature = null;
  }
  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  syncFeatures() {
    const t = this.settingsSignature();
    if (t !== this.lastSettingsSignature) {
      this.lastSettingsSignature = t, this.disposeFeatures();
      for (const r of vl)
        if (this.settings.get(r.id) !== !1)
          try {
            const o = r.register({
              editor: this.app.editor,
              settings: this.settings,
              t: (i) => this.t(i)
            });
            this.featureResources.push(...Array.isArray(o) ? o : [o]);
          } catch (o) {
            this.app.log.error(`feature ${r.id} failed to load`, o);
          }
    }
  }
  /**
   * 特性装配相关的设置签名：取全量配置、跳过纯显示偏好、按 key 排序，
   * `undefined` 归一为 `null` 以免 `JSON.stringify` 丢键造成签名碰撞。
   */
  settingsSignature() {
    const t = this.settings.all().values, r = Object.keys(t).filter((o) => !El.has(o)).sort().map((o) => [o, t[o] === void 0 ? null : t[o]]);
    return JSON.stringify(r);
  }
  disposeFeatures() {
    for (const t of this.featureResources)
      try {
        t.dispose();
      } catch (r) {
        this.app.log.warn("feature dispose failed", r);
      }
    this.featureResources = [];
  }
}
function Cl(e) {
  const { dom: t, contentDOM: r, renderContainer: o, view: i, getPos: a } = e;
  let c = e.node, l = "code", f = null;
  const u = (S) => {
    if (S.button !== 0) {
      S.button === 2 && S.preventDefault();
      return;
    }
    if (!i.editable) return;
    S.preventDefault();
    const O = a();
    if (O == null) return;
    const P = O + 1, B = i.state.tr.setSelection(H.create(i.state.doc, P)).scrollIntoView();
    i.dispatch(B), i.focus();
  };
  o.addEventListener("mousedown", u);
  const d = () => {
    const S = a();
    if (S == null) return !1;
    const O = i.state.selection;
    return O.from > S && O.from < S + c.nodeSize;
  }, p = () => {
    l !== "code" && (l = "code", r.style.display = "", o.style.display = "none", t.classList.remove("html-block-render-mode"));
  }, h = () => {
    l !== "render" && (l = "render", r.style.display = "none", o.style.display = "", t.classList.add("html-block-render-mode"));
  }, b = (S) => {
    const O = S.trim();
    return O.startsWith("<!--") && O.endsWith("-->");
  }, v = () => {
    const S = c.textContent, O = b(S);
    if (t.classList.toggle("html-block-comment", O), O) {
      f = null, p();
      return;
    }
    !d() && S.trim() !== "" ? ((l !== "render" || f !== S) && (o.innerHTML = S, f = S), h()) : (f = null, p());
  }, M = Li(v);
  return {
    update(S) {
      return S.type.name !== "html_block" ? !1 : (c = S, v(), !0);
    },
    destroy() {
      M(), o.removeEventListener("mousedown", u);
    },
    stopEvent(S) {
      return o.contains(S.target) && l === "render";
    },
    ignoreMutation(S) {
      return !!(o.contains(S.target) || S.type === "attributes" && (S.target === t || S.target === r));
    }
  };
}
const Tl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createHtmlBlockView: Cl
}, Symbol.toStringTag, { value: "Module" }));
export {
  Ul as default
};
