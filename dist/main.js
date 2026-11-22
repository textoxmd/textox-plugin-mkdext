import { wholeTokenSpan as go, markConsumed as Ge, markExtRanges as Me, pairMarks as Ln, leaveLineDraft as _o, renderFormulaToSVG as $t, defineCodeBlockExtension as bo, Plugin as ko } from "@textox/plugin-sdk";
import { Plugin as W, PluginKey as Ue, TextSelection as z, Selection as Hn } from "prosemirror-state";
import { Decoration as ne, DecorationSet as Q } from "prosemirror-view";
import { Transform as yo } from "prosemirror-transform";
const Dn = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, qt = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
};
function wo(e) {
  const t = document.createElement("span");
  return t.className = "alert-label", t.contentEditable = "false", t.textContent = qt[e] ?? e, t;
}
function xo(e, t) {
  const o = [];
  return e.descendants((r, i) => {
    if (r.type.name !== "blockquote") return !0;
    const a = r.firstChild;
    if (!a || a.type.name !== "paragraph") return !1;
    const c = a.firstChild;
    if (!c?.isText) return !1;
    const l = c.text?.match(Dn);
    if (!l) return !1;
    const d = l[1].toLowerCase();
    if (!qt[d]) return !1;
    o.push(
      ne.node(i, i + r.nodeSize, { class: `alert alert-${d}` })
    );
    const u = i + 2, p = u + l[0].length;
    return t >= u && t <= p || (o.push(ne.inline(u, p, { class: "syntax-hidden" })), o.push(ne.widget(u, wo(d), { side: -1 }))), !1;
  }), o;
}
function vo(e) {
  e.core.ruler.push("alert_split", (t) => {
    const o = t.tokens;
    for (let r = 0; r < o.length; r++) {
      if (o[r]?.type !== "blockquote_open") continue;
      let i = 1, a = -1;
      for (let C = r + 1; C < o.length && i > 0; C++) {
        const A = o[C];
        if (A.type === "blockquote_open") {
          i++;
          continue;
        }
        if (A.type === "blockquote_close") {
          i--;
          continue;
        }
        i === 1 && A.type === "inline" && a < 0 && (a = C);
      }
      if (a < 0) continue;
      const c = o[a], l = c.content;
      if (!l.match(Dn)) continue;
      const u = l.indexOf(`
`);
      if (u < 0) continue;
      const p = l.slice(0, u), f = l.slice(u + 1);
      c.content = p, c.children = [new t.Token("text", "", 0)], c.children[0].content = p;
      const h = [];
      h.push(new t.Token("paragraph_close", "p", -1));
      const b = new t.Token("paragraph_open", "p", 1);
      b.block = !0, h.push(b);
      const v = new t.Token("inline", "", 0);
      v.content = f, v.children = [new t.Token("text", "", 0)], v.children[0].content = f, v.block = !0, h.push(v), h.push(new t.Token("paragraph_close", "p", -1)), o.splice(a + 1, 1, ...h), r = a + h.length;
    }
    return !0;
  });
}
const To = {
  name: "alert",
  mdItPlugins: [vo],
  inline: {
    markNames: [],
    extRanges: (e) => {
      if (e.type.name !== "paragraph") return [];
      const t = e.textContent.match(Dn);
      return t ? [[0, t[0].length]] : [];
    }
  },
  plugins: (e) => [
    new W({
      key: new Ue("alert-decoration"),
      props: {
        decorations(t) {
          const o = xo(t.doc, t.selection.$head.pos);
          return o.length > 0 ? Q.create(t.doc, o) : Q.empty;
        }
      }
    })
  ]
}, Ao = {
  id: "alert",
  register: ({ editor: e }) => [e.registerSyntaxFeature(To)]
}, So = { "[": "]", "(": ")" }, Eo = /* @__PURE__ */ new Set(["]", ")"]);
function Mo(e) {
  return e.length === 0 || /^\s/.test(e);
}
function Co() {
  return new W({
    props: {
      handleTextInput(e, t, o, r) {
        if (e.editable === !1) return !0;
        if (t !== o) return !1;
        const i = e.state.doc.resolve(t);
        if (!i.parent.isTextblock) return !1;
        const a = i.parentOffset, c = i.parent.content.size, l = a < c ? i.parent.textBetween(a, a + 1) : "";
        if (Eo.has(r) && l === r) {
          const f = e.state.tr.setSelection(
            z.create(e.state.doc, t + 1)
          );
          return e.dispatch(f), !0;
        }
        const d = So[r];
        if (!d) return !1;
        const u = i.parent.textBetween(a, c);
        if (!Mo(u)) return !1;
        const p = e.state.tr.insertText(r + d, t, o);
        return p.setSelection(z.create(p.doc, t + 1)), e.dispatch(p), !0;
      }
    }
  });
}
const Lo = (e, t) => {
  const o = e.selection;
  if (!o.empty) return !1;
  const r = e.doc.resolve(o.from);
  if (!r.parent.isTextblock) return !1;
  const i = r.parentOffset, a = r.parent.content.size;
  if (i === 0 || i === a) return !1;
  const c = r.parent.textBetween(i - 1, i), l = r.parent.textBetween(i, i + 1);
  return c === "[" && l === "]" || c === "(" && l === ")" ? (t && t(e.tr.delete(o.from - 1, o.from + 1)), !0) : !1;
}, Io = {
  name: "auto_pair",
  plugins: () => [Co()],
  keymap: (e) => ({
    Backspace: Lo
  })
}, Po = {
  id: "autoPair",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Io)]
};
function No(e, t) {
  return e[t].content;
}
function Oo(e, t, o, r, i) {
  const a = e.utils.arrayReplaceAt, c = e.utils.lib.ucmicro, l = new RegExp([c.Z.source, c.P.source, c.Cc.source].join("|"));
  function d(u, p, f) {
    let h = 0;
    const b = [];
    if (u.replace(i, function(v, C, A) {
      let P;
      if (Object.prototype.hasOwnProperty.call(o, v)) {
        if (P = o[v], C > 0 && !l.test(A[C - 1]) || C + v.length < A.length && !l.test(A[C + v.length]))
          return;
      } else
        P = v.slice(1, -1);
      if (C > h) {
        const B = new f("text", "", 0);
        B.content = u.slice(h, C), b.push(B);
      }
      const q = new f("emoji", "", 0);
      q.markup = P, q.content = t[P], b.push(q), h = C + v.length;
    }), h < u.length) {
      const v = new f("text", "", 0);
      v.content = u.slice(h), b.push(v);
    }
    return b;
  }
  return function(p) {
    let f;
    const h = p.tokens;
    let b = 0;
    for (let v = 0, C = h.length; v < C; v++) {
      if (h[v].type !== "inline")
        continue;
      let A = h[v].children;
      for (let P = A.length - 1; P >= 0; P--)
        f = A[P], (f.type === "link_open" || f.type === "link_close") && f.info === "auto" && (b -= f.nesting), f.type === "text" && b === 0 && r.test(f.content) && (h[v].children = A = a(
          A,
          P,
          d(f.content, f.level, p.Token)
        ));
    }
  };
}
function Ro(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
function Do(e) {
  let t = e.defs;
  e.enabled.length && (t = Object.keys(t).reduce((l, d) => (e.enabled.indexOf(d) >= 0 && (l[d] = t[d]), l), {}));
  const o = Object.keys(e.shortcuts).reduce((l, d) => t[d] ? Array.isArray(e.shortcuts[d]) ? (e.shortcuts[d].forEach((u) => {
    l[u] = d;
  }), l) : (l[e.shortcuts[d]] = d, l) : l, {}), r = Object.keys(t);
  let i;
  r.length === 0 ? i = "^$" : i = r.map((l) => `:${l}:`).concat(Object.keys(o)).sort().reverse().map((l) => Ro(l)).join("|");
  const a = RegExp(i), c = RegExp(i, "g");
  return {
    defs: t,
    shortcuts: o,
    scanRE: a,
    replaceRE: c
  };
}
function Fo(e, t) {
  const r = Do(Object.assign({}, {
    defs: {},
    shortcuts: {},
    enabled: []
  }, t || {}));
  e.renderer.rules.emoji = No, e.core.ruler.after(
    "linkify",
    "emoji",
    Oo(e, r.defs, r.shortcuts, r.scanRE, r.replaceRE)
  );
}
const $o = {
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
}, Fn = $o, zn = Object.keys(Fn).sort();
function jt(e, t) {
  let o = 0;
  for (; e[t + o] === "\\"; ) o++;
  return o;
}
const qo = (e, t, o) => {
  if (o.type !== "emoji") return null;
  const r = jt(e, t), i = `:${o.markup}:`;
  return e.startsWith(i, t + r) ? r + i.length : null;
};
function Bt(e, t) {
  let o = 0;
  for (let r = t - 1; r >= 0 && e[r] === "\\"; r--) o++;
  return o % 2 === 1;
}
function jo(e) {
  const t = [];
  for (const o of e.tokens) {
    if (o.token.type !== "emoji" || !o.exact) continue;
    const r = o.pos + jt(e.text, o.pos);
    if (Bt(e.text, r)) continue;
    const i = `:${o.token.markup}:`;
    if (r + i.length !== o.end) continue;
    const a = go(
      { token: o.token, pos: r, end: o.end, exact: !0, verified: !0 },
      {
        type: "emoji",
        widget: {
          kind: "emoji",
          // `len` 是 `:name:` 的长度（不含前置反斜杠串），点击后落到 span 尾部。
          attrs: { glyph: o.token.content, len: String(i.length) },
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
const Bo = /\B:([a-z0-9_+\-]+)$/, tn = 8, ce = {
  open: !1,
  partial: "",
  matches: [],
  selected: 0,
  dismissedFor: "",
  from: 0,
  to: 0
}, ee = new Ue("emoji-autocomplete");
function Ho(e) {
  const t = [];
  for (const o of zn)
    if (o.startsWith(e) && t.push(o), t.length >= tn) return t;
  if (t.length < tn) {
    for (const o of zn)
      if (!t.includes(o) && (o.includes(e) && t.push(o), t.length >= tn))
        break;
  }
  return t;
}
function Yn(e, t) {
  const o = e.selection;
  if (!o.empty) return ce;
  const r = o.$from;
  if (!r.parent.isTextblock) return ce;
  const i = r.parent.textBetween(0, r.parentOffset, `
`, `
`), a = Bo.exec(i);
  if (!a || Bt(i, a.index)) return ce;
  const c = a[1];
  if (t.dismissedFor === c)
    return { ...ce, dismissedFor: c };
  const l = Ho(c);
  if (l.length === 0) return ce;
  const d = r.pos, p = t.open && t.partial === c && t.matches.length === l.length ? Math.min(t.selected, l.length - 1) : 0;
  return {
    open: !0,
    partial: c,
    matches: l,
    selected: p,
    dismissedFor: "",
    from: d - c.length - 1,
    // points at `:`
    to: d
  };
}
function Ht(e, t, o) {
  const r = `:${t}: `, i = e.state.tr.insertText(r, o.from, o.to), a = o.from + r.length;
  i.setSelection(z.create(i.doc, a)), e.dispatch(i);
}
function zo() {
  return new W({
    key: ee,
    state: {
      init: (e, t) => Yn(t, ce),
      apply(e, t, o, r) {
        const i = e.getMeta(ee);
        if (i?.type === "select") {
          if (!t.open) return t;
          const a = t.matches.length - 1, c = Math.max(0, Math.min(a, i.index));
          return { ...t, selected: c };
        }
        return i?.type === "dismiss" ? { ...ce, dismissedFor: t.partial } : Yn(r, t);
      }
    },
    props: {
      decorations(e) {
        const t = ee.getState(e);
        if (!t?.open) return Q.empty;
        const o = Yo(t);
        return Q.create(e.doc, [
          ne.widget(t.to, o, {
            side: 1,
            key: `emoji-auto@${t.partial}@${t.selected}`,
            ignoreSelection: !0,
            stopEvent: () => !0
          })
        ]);
      },
      handleKeyDown(e, t) {
        const o = ee.getState(e.state);
        if (!o?.open) return !1;
        if (t.key === "ArrowDown")
          return e.dispatch(
            e.state.tr.setMeta(ee, { type: "select", index: o.selected + 1 })
          ), t.preventDefault(), !0;
        if (t.key === "ArrowUp")
          return e.dispatch(
            e.state.tr.setMeta(ee, { type: "select", index: o.selected - 1 })
          ), t.preventDefault(), !0;
        if (t.key === "Enter" || t.key === "Tab") {
          const r = o.matches[o.selected];
          return r ? (Ht(e, r, o), t.preventDefault(), !0) : !1;
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
        const o = ee.getState(e.state);
        if (!o?.open) return;
        const r = e.dom.querySelector(".emoji-completion");
        if (!r) return;
        const i = e.coordsAtPos(o.to, -1), c = r.offsetParent?.getBoundingClientRect() ?? { top: 0, left: 0 };
        r.style.top = `${i.bottom + 2 - c.top}px`, r.style.left = `${i.left - c.left}px`;
        const l = r.querySelector(".emoji-completion-row.selected");
        if (l) {
          const d = r.getBoundingClientRect(), u = l.getBoundingClientRect();
          u.top < d.top ? r.scrollTop -= d.top - u.top : u.bottom > d.bottom && (r.scrollTop += u.bottom - d.bottom);
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
function Yo(e) {
  const t = document.createElement("div");
  t.className = "emoji-completion", t.setAttribute("contenteditable", "false"), t.addEventListener("mousedown", (o) => o.preventDefault());
  for (let o = 0; o < e.matches.length; o++) {
    const r = e.matches[o], i = document.createElement("div");
    i.className = "emoji-completion-row", o === e.selected && i.classList.add("selected"), i.dataset.name = r;
    const a = document.createElement("span");
    a.className = "emoji-completion-glyph", a.textContent = Fn[r] ?? "";
    const c = document.createElement("span");
    c.className = "emoji-completion-name", c.textContent = `:${r}:`, i.appendChild(a), i.appendChild(c), i.addEventListener("click", () => {
      t.dispatchEvent(
        new CustomEvent("emoji-autocomplete-pick", {
          bubbles: !0,
          detail: { name: r }
        })
      );
    }), t.appendChild(i);
  }
  return t;
}
function Vo() {
  return new W({
    view(e) {
      const t = (o) => {
        const r = o, i = ee.getState(e.state);
        i?.open && Ht(e, r.detail.name, i);
      };
      return e.dom.addEventListener("emoji-autocomplete-pick", t), {
        destroy() {
          e.dom.removeEventListener("emoji-autocomplete-pick", t);
        }
      };
    }
  });
}
function Ko() {
  return new W({
    props: {
      handleClick(e, t, o) {
        const i = o.target?.closest(".emoji-glyph");
        if (!i) return !1;
        const a = Number(i.getAttribute("data-len") ?? "0");
        if (!a) return !1;
        const c = e.posAtDOM(i, 0);
        if (c < 0) return !1;
        const l = c + a;
        return l > e.state.doc.content.size ? !1 : (o.preventDefault(), e.dispatch(
          e.state.tr.setSelection(z.create(e.state.doc, l))
        ), e.focus(), !0);
      }
    }
  });
}
const Go = (e) => {
  const t = document.createElement("span");
  return t.className = "emoji-glyph", t.textContent = e.glyph ?? "", e.len && t.setAttribute("data-len", e.len), t;
}, Uo = {
  name: "emoji",
  // No mark, no node — pure decoration. The source chars are valid plain
  // text in md (no escape needed for `:`), so serialization is automatic.
  // `bare` installs the core replacement rule with only the shortcode table
  // (no `:)`-style shortcuts; those must stay plain text).
  mdItPlugins: [(e) => e.use(Fo, { defs: Fn, shortcuts: {} })],
  // Fallback for the legacy per-token load path: keep the source spelling.
  // 依赖 `shortcuts: {}`：shortcut 的 markup 是规范名而非源码短码，若启用
  // shortcuts 这里会把 `:)` 改写成 `:smile:`。
  parserTokens: {
    emoji: (e, t) => {
      e.addText(`:${t.markup}:`);
    }
  },
  plugins: () => [zo(), Vo(), Ko()],
  inline: {
    // 四个迁移特性（highlight / sub-sup / math / emoji）都是 `order: -1`，
    // 组内次序由注册序决定；emoji 的 span 是原子（无 mark），先认领先占用，
    // 其余特性不得再认领其区间。
    order: -1,
    derive: jo,
    tokenAdvance: qo,
    markNames: [],
    extRanges: () => [],
    decorationWidgets: { emoji: Go }
  }
}, Wo = {
  id: "emoji",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Uo)]
}, Xo = [
  ["path", "M7 4h4l3 8 3-8h4"],
  ["line", 4, 16, 10, 16],
  ["circle", 18, 6, 2]
], Vn = /\[\^(\d+)\]/g;
function Qo(e) {
  let t = 0;
  return e.descendants((o) => {
    if (!o.isTextblock) return !0;
    const r = o.textContent;
    Vn.lastIndex = 0;
    let i;
    for (; i = Vn.exec(r); ) t = Math.max(t, parseInt(i[1], 10));
    return !0;
  }), t + 1;
}
const Zo = {
  id: "footnote",
  keyword: "footnote",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.footnote.label`）
  labelKey: "footnote.label",
  descriptionKey: "footnote.description",
  icon: Xo,
  defaultShortcut: "Cmd+Opt+F",
  category: "paragraph",
  order: 2,
  insert(e) {
    const t = e.state.schema, o = t.marks.footnote_ref;
    if (!o || !t.nodes.paragraph) return;
    const r = String(Qo(e.state.doc)), i = `[^${r}]`, { from: a, to: c } = e.state.selection, l = e.state.tr.insertText(i, a, c);
    l.addMark(a, a + i.length, o.create({ id: r }));
    const d = t.nodes.paragraph.create(null, t.text(`[^${r}]: `));
    l.insert(l.doc.content.size, d), e.dispatch(l), e.focus();
  }
};
function Jo(e, t, o, r) {
  const i = Number(e[t].meta.id + 1).toString();
  let a = "";
  return typeof r.docId == "string" && (a = `-${r.docId}-`), a + i;
}
function er(e, t) {
  let o = Number(e[t].meta.id + 1).toString();
  return e[t].meta.subId > 0 && (o += `:${e[t].meta.subId}`), `[${o}]`;
}
function nr(e, t, o, r, i) {
  const a = i.rules.footnote_anchor_name(e, t, o, r, i), c = i.rules.footnote_caption(e, t, o, r, i);
  let l = a;
  return e[t].meta.subId > 0 && (l += `:${e[t].meta.subId}`), `<sup class="footnote-ref"><a href="#fn${a}" id="fnref${l}">${c}</a></sup>`;
}
function tr(e, t, o) {
  return (o.xhtmlOut ? `<hr class="footnotes-sep" />
` : `<hr class="footnotes-sep">
`) + `<section class="footnotes">
<ol class="footnotes-list">
`;
}
function or() {
  return `</ol>
</section>
`;
}
function rr(e, t, o, r, i) {
  let a = i.rules.footnote_anchor_name(e, t, o, r, i);
  return e[t].meta.subId > 0 && (a += `:${e[t].meta.subId}`), `<li id="fn${a}" class="footnote-item">`;
}
function ir() {
  return `</li>
`;
}
function lr(e, t, o, r, i) {
  let a = i.rules.footnote_anchor_name(e, t, o, r, i);
  return e[t].meta.subId > 0 && (a += `:${e[t].meta.subId}`), ` <a href="#fnref${a}" class="footnote-backref">↩︎</a>`;
}
function ar(e) {
  const t = e.helpers.parseLinkLabel, o = e.utils.isSpace;
  e.renderer.rules.footnote_ref = nr, e.renderer.rules.footnote_block_open = tr, e.renderer.rules.footnote_block_close = or, e.renderer.rules.footnote_open = rr, e.renderer.rules.footnote_close = ir, e.renderer.rules.footnote_anchor = lr, e.renderer.rules.footnote_caption = er, e.renderer.rules.footnote_anchor_name = Jo;
  function r(l, d, u, p) {
    const f = l.bMarks[d] + l.tShift[d], h = l.eMarks[d];
    if (f + 4 > h || l.src.charCodeAt(f) !== 91 || l.src.charCodeAt(f + 1) !== 94) return !1;
    let b;
    for (b = f + 2; b < h; b++) {
      if (l.src.charCodeAt(b) === 32) return !1;
      if (l.src.charCodeAt(b) === 93)
        break;
    }
    if (b === f + 2 || b + 1 >= h || l.src.charCodeAt(++b) !== 58) return !1;
    if (p) return !0;
    b++, l.env.footnotes || (l.env.footnotes = {}), l.env.footnotes.refs || (l.env.footnotes.refs = {});
    const v = l.src.slice(f + 2, b - 2);
    l.env.footnotes.refs[`:${v}`] = -1;
    const C = new l.Token("footnote_reference_open", "", 1);
    C.meta = { label: v }, C.level = l.level++, l.tokens.push(C);
    const A = l.bMarks[d], P = l.tShift[d], q = l.sCount[d], B = l.parentType, R = b, G = l.sCount[d] + b - (l.bMarks[d] + l.tShift[d]);
    let te = G;
    for (; b < h; ) {
      const ue = l.src.charCodeAt(b);
      if (o(ue))
        ue === 9 ? te += 4 - te % 4 : te++;
      else
        break;
      b++;
    }
    l.tShift[d] = b - R, l.sCount[d] = te - G, l.bMarks[d] = R, l.blkIndent += 4, l.parentType = "footnote", l.sCount[d] < l.blkIndent && (l.sCount[d] += l.blkIndent), l.md.block.tokenize(l, d, u, !0), l.parentType = B, l.blkIndent -= 4, l.tShift[d] = P, l.sCount[d] = q, l.bMarks[d] = A;
    const fe = new l.Token("footnote_reference_close", "", -1);
    return fe.level = --l.level, l.tokens.push(fe), !0;
  }
  function i(l, d) {
    const u = l.posMax, p = l.pos;
    if (p + 2 >= u || l.src.charCodeAt(p) !== 94 || l.src.charCodeAt(p + 1) !== 91) return !1;
    const f = p + 2, h = t(l, p + 1);
    if (h < 0) return !1;
    if (!d) {
      l.env.footnotes || (l.env.footnotes = {}), l.env.footnotes.list || (l.env.footnotes.list = []);
      const b = l.env.footnotes.list.length, v = [];
      l.md.inline.parse(
        l.src.slice(f, h),
        l.md,
        l.env,
        v
      );
      const C = l.push("footnote_ref", "", 0);
      C.meta = { id: b }, l.env.footnotes.list[b] = {
        content: l.src.slice(f, h),
        tokens: v
      };
    }
    return l.pos = h + 1, l.posMax = u, !0;
  }
  function a(l, d) {
    const u = l.posMax, p = l.pos;
    if (p + 3 > u || !l.env.footnotes || !l.env.footnotes.refs || l.src.charCodeAt(p) !== 91 || l.src.charCodeAt(p + 1) !== 94) return !1;
    let f;
    for (f = p + 2; f < u; f++) {
      if (l.src.charCodeAt(f) === 32 || l.src.charCodeAt(f) === 10) return !1;
      if (l.src.charCodeAt(f) === 93)
        break;
    }
    if (f === p + 2 || f >= u) return !1;
    f++;
    const h = l.src.slice(p + 2, f - 1);
    if (typeof l.env.footnotes.refs[`:${h}`] > "u") return !1;
    if (!d) {
      l.env.footnotes.list || (l.env.footnotes.list = []);
      let b;
      l.env.footnotes.refs[`:${h}`] < 0 ? (b = l.env.footnotes.list.length, l.env.footnotes.list[b] = { label: h, count: 0 }, l.env.footnotes.refs[`:${h}`] = b) : b = l.env.footnotes.refs[`:${h}`];
      const v = l.env.footnotes.list[b].count;
      l.env.footnotes.list[b].count++;
      const C = l.push("footnote_ref", "", 0);
      C.meta = { id: b, subId: v, label: h };
    }
    return l.pos = f, l.posMax = u, !0;
  }
  function c(l) {
    let d, u, p, f = !1;
    const h = {};
    if (!l.env.footnotes || (l.tokens = l.tokens.filter(function(v) {
      return v.type === "footnote_reference_open" ? (f = !0, u = [], p = v.meta.label, !1) : v.type === "footnote_reference_close" ? (f = !1, h[":" + p] = u, !1) : (f && u.push(v), !f);
    }), !l.env.footnotes.list))
      return;
    const b = l.env.footnotes.list;
    l.tokens.push(new l.Token("footnote_block_open", "", 1));
    for (let v = 0, C = b.length; v < C; v++) {
      const A = new l.Token("footnote_open", "", 1);
      if (A.meta = { id: v, label: b[v].label }, l.tokens.push(A), b[v].tokens) {
        d = [];
        const B = new l.Token("paragraph_open", "p", 1);
        B.block = !0, d.push(B);
        const R = new l.Token("inline", "", 0);
        R.children = b[v].tokens, R.content = b[v].content, d.push(R);
        const G = new l.Token("paragraph_close", "p", -1);
        G.block = !0, d.push(G);
      } else b[v].label && (d = h[`:${b[v].label}`]);
      d && (l.tokens = l.tokens.concat(d));
      let P;
      l.tokens[l.tokens.length - 1].type === "paragraph_close" ? P = l.tokens.pop() : P = null;
      const q = b[v].count > 0 ? b[v].count : 1;
      for (let B = 0; B < q; B++) {
        const R = new l.Token("footnote_anchor", "", 0);
        R.meta = { id: v, subId: B, label: b[v].label }, l.tokens.push(R);
      }
      P && l.tokens.push(P), l.tokens.push(new l.Token("footnote_close", "", -1));
    }
    l.tokens.push(new l.Token("footnote_block_close", "", -1));
  }
  e.block.ruler.before("reference", "footnote_def", r, { alt: ["paragraph", "reference"] }), e.inline.ruler.after("image", "footnote_inline", i), e.inline.ruler.after("footnote_inline", "footnote_ref", a), e.core.ruler.after("inline", "footnote_tail", c);
}
const zt = /^\[\^([^\]]+)\]:/;
function Kn(e) {
  return e.type.name === "paragraph" && zt.test(e.textContent);
}
function Gn(e) {
  const t = zt.exec(e.textContent);
  return t ? t[1] : "";
}
function sr(e, t) {
  const o = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), r = new RegExp(`^\\[\\^${o}\\]:`), i = e.split(/(?<=\n)/), a = [];
  let c = 0;
  for (const u of i)
    a.push(c), c += u.length;
  const l = (u) => i[u].replace(/\r?\n$/, ""), d = (u) => /^( {4,}|\t)/.test(l(u));
  for (let u = 0; u < i.length; u++) {
    if (!r.test(i[u])) continue;
    const p = a[u];
    let f = u + 1;
    for (; f < i.length; ) {
      if (l(f).trim() === "") {
        let b = f + 1;
        for (; b < i.length && l(b).trim() === ""; ) b++;
        if (b < i.length && d(b)) {
          f = b;
          continue;
        }
        break;
      }
      if (d(f)) {
        f++;
        continue;
      }
      break;
    }
    const h = f < i.length ? a[f] : e.length;
    return { start: p, end: h, raw: e.slice(p, h) };
  }
  return null;
}
const cr = {
  matches: Kn,
  keyOf: Gn,
  collect(e, t) {
    const o = [];
    return t.forEach((r) => {
      if (!Kn(r)) return;
      const i = Gn(r);
      if (!i) return;
      const a = sr(e, i);
      a && o.push({ ...a, key: i });
    }), o;
  },
  render(e, t) {
    return t(e);
  }
}, Un = /\[\^(\d+)\]/g, In = /^\[\^(\d+)\]:\s*/, ze = /* @__PURE__ */ new WeakMap();
function ur(e, t) {
  const o = [];
  Un.lastIndex = 0;
  let r;
  for (; r = Un.exec(e); ) {
    const i = r.index, a = i + r[0].length, c = r[1];
    if (i === 0) continue;
    const l = i, d = i + 2, u = a - 1, p = a;
    let f = !1;
    for (let h = l; h < d; h++)
      if (t[h]) {
        f = !0;
        break;
      }
    if (!f) {
      for (let h = u; h < p; h++)
        if (t[h]) {
          f = !0;
          break;
        }
    }
    f || (Ge(t, i, a), o.push({
      type: "footnote_ref",
      from: i,
      to: a,
      openFrom: i,
      openTo: i,
      closeFrom: a,
      closeTo: a,
      wrap: !0,
      delimRanges: [
        { from: l, to: d },
        { from: u, to: p }
      ],
      attrs: { id: c }
    }));
  }
  return o;
}
function dr(e, t) {
  let o = !1;
  return e.doc.descendants((r) => {
    if (o) return !1;
    if (r.isText) {
      for (const i of r.marks)
        if (i.type.name === "footnote_ref" && i.attrs.id === t)
          return o = !0, !1;
    }
    return !0;
  }), o;
}
function pr(e, t) {
  let o = -1;
  e.state.doc.descendants((r, i) => r.type.name === "paragraph" && r.textContent.startsWith(`[^${t}]:`) ? (o = i + r.nodeSize - 1, !1) : !0), !(o < 0) && e.dispatch(e.state.tr.setSelection(z.near(e.state.doc.resolve(o))).scrollIntoView());
}
function fr(e, t) {
  const o = e.state.schema.marks.footnote_ref;
  let r = -1;
  e.state.doc.descendants((i, a) => {
    const c = i.text;
    return c && i.isText && i.marks.some((l) => l.type === o && l.attrs.id === t) ? (r = a + c.length, !1) : !0;
  }), !(r < 0) && (e.dispatch(e.state.tr.setSelection(z.create(e.state.doc, r)).scrollIntoView()), e.focus());
}
function mr() {
  return new W({
    props: {
      decorations(e) {
        const t = [];
        return e.doc.descendants((o, r) => {
          if (o.type.name !== "paragraph") return !0;
          const i = o.textContent, a = In.exec(i);
          if (!a) return !0;
          const c = a[1], l = c.length, d = a[0].length, u = r + 1, p = u + i.length, f = e.selection.from, b = f >= u && f < p ? "syntax-hint" : "syntax-hidden";
          if (t.push(ne.inline(u, u + 2, { class: b })), t.push(ne.inline(u + 2 + l, u + d, { class: b })), t.push(ne.inline(u + 2, u + 2 + l, { class: "fn-def-num" })), dr(e, c)) {
            const v = document.createElement("span");
            v.className = "md-reverse-footnote-area", v.setAttribute("contenteditable", "false"), v.appendChild(document.createTextNode(" "));
            const C = document.createElement("a");
            C.className = "reversefootnote", C.setAttribute("href", "#"), C.setAttribute("title", "回到文档"), C.setAttribute("data-index", "0"), C.textContent = "↩", v.appendChild(C), t.push(ne.widget(r + o.nodeSize - 1, v, {
              side: 1,
              stopEvent: (A) => A.type !== "click"
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
          u && pr(e, u);
          return;
        }
        const d = c.closest(".reversefootnote");
        if (d) {
          if (a.button !== 0) return;
          a.preventDefault(), a.stopPropagation();
          const u = d.closest("p");
          if (u) {
            const p = In.exec(u.textContent ?? "");
            p && fr(e, p[1]);
          }
        }
      };
      let o = null;
      const r = (a) => {
        let c = "";
        return e.state.doc.descendants((l) => l.type.name === "paragraph" && l.textContent.startsWith(`[^${a}]:`) ? (c = l.textContent.replace(/^\[\^\d+\]:\s*/, ""), !1) : !0), c;
      }, i = (a) => {
        const c = a.target instanceof Element ? a.target : a.target.parentElement;
        if (!c) return;
        const l = c.closest("sup.footnote-ref");
        if (!l) {
          o?.remove(), o = null;
          return;
        }
        if (o) return;
        const d = l.getAttribute("data-ref");
        if (!d) return;
        const u = r(d);
        if (!u) return;
        const p = l.getBoundingClientRect(), f = document.createElement("div");
        f.className = "fn-tooltip", f.textContent = u, document.body.appendChild(f), f.style.top = `${p.bottom + 6}px`, f.style.left = `${p.left}px`, o = f;
      };
      return e.dom.addEventListener("mouseover", i), e.dom.addEventListener("mouseout", i), e.dom.addEventListener("mousedown", t, !0), {
        destroy() {
          e.dom.removeEventListener("mouseover", i), e.dom.removeEventListener("mouseout", i), e.dom.removeEventListener("mousedown", t, !0), o?.remove();
        }
      };
    }
  });
}
const hr = {
  name: "footnote",
  mdItPlugins: [(e) => e.use(ar)],
  marks: {
    footnote_ref: {
      attrs: { id: {} },
      inclusive: !1,
      parseDOM: [{ tag: "sup.footnote-ref", getAttrs: (e) => ({ id: e.getAttribute("data-ref") }) }],
      toDOM: (e) => ["sup", { class: "footnote-ref", "data-ref": e.attrs.id }, 0]
    }
  },
  parserTokens: {
    footnote_ref: (e, t, o) => {
      const r = String(t.meta?.label ?? t.content ?? "");
      r && (e.openMark(o.marks.footnote_ref.create({ id: r })), e.addText(`[^${r}]`), e.closeMarkType(o.marks.footnote_ref));
    },
    footnote_open: (e, t, o) => {
      const r = String(t.meta?.label ?? t.content ?? "");
      ze.set(e, r), e.openNode(o.nodes.paragraph), e.addText(`[^${r}]: `);
    },
    footnote_close: (e, t, o) => {
      ze.delete(e), e.closeNode();
    },
    paragraph_open: (e, t, o) => {
      ze.get(e) || e.openNode(o.nodes.paragraph);
    },
    paragraph_close: (e, t, o) => {
      ze.get(e) || e.closeNode();
    }
  },
  markDelims: {
    footnote_ref: { open: "", close: "" }
  },
  inline: {
    order: 1.1,
    derive: (e) => ur(e.text, e.consumed),
    markNames: ["footnote_ref"],
    extRanges: (e) => {
      const t = [], o = e.type.schema.marks.footnote_ref;
      if (!o) return t;
      let r = -1, i = null;
      const a = (u) => {
        r < 0 || !i || (t.push([r, u]), r = -1, i = null);
      };
      let c = 0;
      e.forEach((u) => {
        if (u.isText) {
          const p = u.marks.find((f) => f.type === o) ?? null;
          p ? r < 0 ? (r = c, i = p) : i && !p.eq(i) && (a(c), r = c, i = p) : a(c);
        }
        c += u.nodeSize;
      }), a(c);
      const l = e.textContent, d = In.exec(l);
      return d && t.push([0, d[0].length]), t;
    }
  },
  plugins: () => [mr()],
  sourceVerbatim: cr
}, gr = {
  id: "footnote",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(hr),
    e.registerExtension({
      id: "footnote.editor",
      insert: Zo,
      create() {
        return {};
      }
    })
  ]
}, on = "view", Pn = "panel";
let _e = null;
function Wn(e) {
  _e = e;
}
function Yt() {
  return _e && _e.read() === "source" ? "source" : Pn;
}
function _r(e) {
  return _e ? _e.subscribe((t) => e(t === "source" ? "source" : Pn)) : () => {
  };
}
async function br(e) {
  await _e?.write(e);
}
const kr = 300;
function yr(e) {
  if (typeof e != "string") return null;
  const t = /^(\d{4}-\d{2}-\d{2})$/.exec(e.trim());
  return t ? t[1] : null;
}
function wr(e) {
  if (typeof e != "string") return null;
  const t = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/.exec(e.trim());
  return t ? `${t[1]}T${t[2]}` : null;
}
function xr(e, t) {
  const o = e.type === "text", r = o ? document.createElement("textarea") : document.createElement("input");
  r.className = "fm-input", o && (r.rows = 1);
  let i = "text", a = e.value == null ? "" : String(e.value);
  if (e.type === "number") {
    i = "number";
    const d = Number(e.value);
    a = e.value == null || e.value === "" || !Number.isFinite(d) ? "" : String(d);
  } else if (e.type === "date") {
    const d = yr(e.value);
    d !== null && (i = "date", a = d);
  } else if (e.type === "datetime") {
    const d = wr(e.value);
    d !== null && (i = "datetime-local", a = d);
  }
  if (o || (r.type = i), r.value = a, !o) {
    const d = r.value;
    a !== "" && d === "" && (i === "date" || i === "datetime-local") ? (a = e.value == null ? "" : String(e.value), r.type = "text", r.value = a) : a = d;
  }
  if (o) {
    const d = () => {
      r.style.height = "auto", r.style.height = `${r.scrollHeight}px`;
    };
    if (r.addEventListener("input", d), typeof requestAnimationFrame == "function" ? requestAnimationFrame(d) : d(), typeof ResizeObserver == "function") {
      let u = -1;
      const p = new ResizeObserver(() => {
        if (!r.isConnected) {
          p.disconnect();
          return;
        }
        r.clientWidth !== u && (u = r.clientWidth, d());
      });
      p.observe(r);
    }
  }
  const c = () => {
    if (r.value === a) return;
    let d = r.value;
    e.type === "number" && (d = r.value === "" ? null : Number(r.value)), a = r.value, t.commit(d);
  };
  let l;
  return r.addEventListener("input", (d) => {
    d.isComposing || (l !== void 0 && clearTimeout(l), l = setTimeout(c, kr));
  }), r.addEventListener("change", c), r.addEventListener("keydown", (d) => {
    const u = d;
    u.isComposing || u.keyCode === 229 || u.key === "Enter" && (u.preventDefault(), c(), t.onEnter?.());
  }), r;
}
function vr(e, t) {
  const o = document.createElement("input");
  return o.className = "fm-checkbox", o.type = "checkbox", o.checked = e.value === !0, o.addEventListener("change", () => t.commit(o.checked)), o;
}
function Tr(e, t) {
  const o = document.createElement("div");
  o.className = "fm-chips";
  const r = Array.isArray(e.value) ? e.value.map((c) => String(c)) : [], i = (c) => t.commit(c);
  r.forEach((c, l) => {
    const d = document.createElement("span");
    d.className = "fm-chip", d.textContent = c;
    const u = document.createElement("button");
    u.type = "button", u.className = "fm-chip-x", u.textContent = "×", u.addEventListener("mousedown", (p) => p.preventDefault()), u.addEventListener("click", () => i(r.filter((p, f) => f !== l))), d.appendChild(u), o.appendChild(d);
  });
  const a = document.createElement("input");
  return a.className = "fm-add-input", a.addEventListener("keydown", (c) => {
    const l = c;
    if (!(l.isComposing || l.keyCode === 229))
      if (l.key === "Enter") {
        l.preventDefault();
        const d = a.value.trim();
        if (d === "") {
          a.value = "", t.onEmptyEnter?.();
          return;
        }
        a.value = "", i([...r, d]);
      } else l.key === "Escape" && (l.preventDefault(), a.value = "");
  }), o.appendChild(a), o;
}
function Ar(e) {
  const t = document.createElement("code");
  return t.className = "fm-raw-value", t.textContent = e.raw, t;
}
function Sr(e, t) {
  return e.complex || e.type === "raw" ? Ar(e) : e.type === "boolean" ? vr(e, t) : e.type === "list" ? Tr(e, t) : xr(e, t);
}
function Er(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var V = {}, Ye = {}, ae = {}, Xn;
function Le() {
  if (Xn) return ae;
  Xn = 1;
  function e(c) {
    return typeof c > "u" || c === null;
  }
  function t(c) {
    return typeof c == "object" && c !== null;
  }
  function o(c) {
    return Array.isArray(c) ? c : e(c) ? [] : [c];
  }
  function r(c, l) {
    if (l) {
      const d = Object.keys(l);
      for (let u = 0, p = d.length; u < p; u += 1) {
        const f = d[u];
        c[f] = l[f];
      }
    }
    return c;
  }
  function i(c, l) {
    let d = "";
    for (let u = 0; u < l; u += 1)
      d += c;
    return d;
  }
  function a(c) {
    return c === 0 && Number.NEGATIVE_INFINITY === 1 / c;
  }
  return ae.isNothing = e, ae.isObject = t, ae.toArray = o, ae.repeat = i, ae.isNegativeZero = a, ae.extend = r, ae;
}
var rn, Qn;
function Ie() {
  if (Qn) return rn;
  Qn = 1;
  function e(o, r) {
    let i = "";
    const a = o.reason || "(unknown reason)";
    return o.mark ? (o.mark.name && (i += 'in "' + o.mark.name + '" '), i += "(" + (o.mark.line + 1) + ":" + (o.mark.column + 1) + ")", !r && o.mark.snippet && (i += `

` + o.mark.snippet), a + " " + i) : a;
  }
  function t(o, r) {
    Error.call(this), this.name = "YAMLException", this.reason = o, this.mark = r, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return t.prototype = Object.create(Error.prototype), t.prototype.constructor = t, t.prototype.toString = function(r) {
    return this.name + ": " + e(this, r);
  }, rn = t, rn;
}
var ln, Zn;
function Mr() {
  if (Zn) return ln;
  Zn = 1;
  const e = Le();
  function t(i, a, c, l, d) {
    let u = "", p = "";
    const f = Math.floor(d / 2) - 1;
    return l - a > f && (u = " ... ", a = l - f + u.length), c - l > f && (p = " ...", c = l + f - p.length), {
      str: u + i.slice(a, c).replace(/\t/g, "→") + p,
      pos: l - a + u.length
      // relative position
    };
  }
  function o(i, a) {
    return e.repeat(" ", a - i.length) + i;
  }
  function r(i, a) {
    if (a = Object.create(a || null), !i.buffer) return null;
    a.maxLength || (a.maxLength = 79), typeof a.indent != "number" && (a.indent = 1), typeof a.linesBefore != "number" && (a.linesBefore = 3), typeof a.linesAfter != "number" && (a.linesAfter = 2);
    const c = /\r?\n|\r|\0/g, l = [0], d = [];
    let u, p = -1;
    for (; u = c.exec(i.buffer); )
      d.push(u.index), l.push(u.index + u[0].length), i.position <= u.index && p < 0 && (p = l.length - 2);
    p < 0 && (p = l.length - 1);
    let f = "";
    const h = Math.min(i.line + a.linesAfter, d.length).toString().length, b = a.maxLength - (a.indent + h + 3);
    for (let C = 1; C <= a.linesBefore && !(p - C < 0); C++) {
      const A = t(
        i.buffer,
        l[p - C],
        d[p - C],
        i.position - (l[p] - l[p - C]),
        b
      );
      f = e.repeat(" ", a.indent) + o((i.line - C + 1).toString(), h) + " | " + A.str + `
` + f;
    }
    const v = t(i.buffer, l[p], d[p], i.position, b);
    f += e.repeat(" ", a.indent) + o((i.line + 1).toString(), h) + " | " + v.str + `
`, f += e.repeat("-", a.indent + h + 3 + v.pos) + `^
`;
    for (let C = 1; C <= a.linesAfter && !(p + C >= d.length); C++) {
      const A = t(
        i.buffer,
        l[p + C],
        d[p + C],
        i.position - (l[p] - l[p + C]),
        b
      );
      f += e.repeat(" ", a.indent) + o((i.line + C + 1).toString(), h) + " | " + A.str + `
`;
    }
    return f.replace(/\n$/, "");
  }
  return ln = r, ln;
}
var an, Jn;
function K() {
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
  ], o = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function r(a) {
    const c = {};
    return a !== null && Object.keys(a).forEach(function(l) {
      a[l].forEach(function(d) {
        c[String(d)] = l;
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
    }, this.instanceOf = c.instanceOf || null, this.predicate = c.predicate || null, this.represent = c.represent || null, this.representName = c.representName || null, this.defaultStyle = c.defaultStyle || null, this.multi = c.multi || !1, this.styleAliases = r(c.styleAliases || null), o.indexOf(this.kind) === -1)
      throw new e('Unknown kind "' + this.kind + '" is specified for "' + a + '" YAML type.');
  }
  return an = i, an;
}
var sn, et;
function Vt() {
  if (et) return sn;
  et = 1;
  const e = Ie(), t = K();
  function o(a, c) {
    const l = [];
    return a[c].forEach(function(d) {
      let u = l.length;
      l.forEach(function(p, f) {
        p.tag === d.tag && p.kind === d.kind && p.multi === d.multi && (u = f);
      }), l[u] = d;
    }), l;
  }
  function r() {
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
    for (let l = 0, d = arguments.length; l < d; l += 1)
      arguments[l].forEach(c);
    return a;
  }
  function i(a) {
    return this.extend(a);
  }
  return i.prototype.extend = function(c) {
    let l = [], d = [];
    if (c instanceof t)
      d.push(c);
    else if (Array.isArray(c))
      d = d.concat(c);
    else if (c && (Array.isArray(c.implicit) || Array.isArray(c.explicit)))
      c.implicit && (l = l.concat(c.implicit)), c.explicit && (d = d.concat(c.explicit));
    else
      throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    l.forEach(function(p) {
      if (!(p instanceof t))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (p.loadKind && p.loadKind !== "scalar")
        throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (p.multi)
        throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), d.forEach(function(p) {
      if (!(p instanceof t))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    const u = Object.create(i.prototype);
    return u.implicit = (this.implicit || []).concat(l), u.explicit = (this.explicit || []).concat(d), u.compiledImplicit = o(u, "implicit"), u.compiledExplicit = o(u, "explicit"), u.compiledTypeMap = r(u.compiledImplicit, u.compiledExplicit), u;
  }, sn = i, sn;
}
var cn, nt;
function Kt() {
  if (nt) return cn;
  nt = 1;
  const e = K();
  return cn = new e("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(t) {
      return t !== null ? t : "";
    }
  }), cn;
}
var un, tt;
function Gt() {
  if (tt) return un;
  tt = 1;
  const e = K();
  return un = new e("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(t) {
      return t !== null ? t : [];
    }
  }), un;
}
var dn, ot;
function Ut() {
  if (ot) return dn;
  ot = 1;
  const e = K();
  return dn = new e("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(t) {
      return t !== null ? t : {};
    }
  }), dn;
}
var pn, rt;
function Wt() {
  if (rt) return pn;
  rt = 1;
  const e = Vt();
  return pn = new e({
    explicit: [
      Kt(),
      Gt(),
      Ut()
    ]
  }), pn;
}
var fn, it;
function Xt() {
  if (it) return fn;
  it = 1;
  const e = K();
  function t(i) {
    if (i === null) return !0;
    const a = i.length;
    return a === 1 && i === "~" || a === 4 && (i === "null" || i === "Null" || i === "NULL");
  }
  function o() {
    return null;
  }
  function r(i) {
    return i === null;
  }
  return fn = new e("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: t,
    construct: o,
    predicate: r,
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
  }), fn;
}
var mn, lt;
function Qt() {
  if (lt) return mn;
  lt = 1;
  const e = K();
  function t(i) {
    if (i === null) return !1;
    const a = i.length;
    return a === 4 && (i === "true" || i === "True" || i === "TRUE") || a === 5 && (i === "false" || i === "False" || i === "FALSE");
  }
  function o(i) {
    return i === "true" || i === "True" || i === "TRUE";
  }
  function r(i) {
    return Object.prototype.toString.call(i) === "[object Boolean]";
  }
  return mn = new e("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: t,
    construct: o,
    predicate: r,
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
  const e = Le(), t = K();
  function o(u) {
    return u >= 48 && u <= 57 || u >= 65 && u <= 70 || u >= 97 && u <= 102;
  }
  function r(u) {
    return u >= 48 && u <= 55;
  }
  function i(u) {
    return u >= 48 && u <= 57;
  }
  function a(u) {
    if (u === null) return !1;
    const p = u.length;
    let f = 0, h = !1;
    if (!p) return !1;
    let b = u[f];
    if ((b === "-" || b === "+") && (b = u[++f]), b === "0") {
      if (f + 1 === p) return !0;
      if (b = u[++f], b === "b") {
        for (f++; f < p; f++) {
          if (b = u[f], b !== "0" && b !== "1") return !1;
          h = !0;
        }
        return h && isFinite(c(u));
      }
      if (b === "x") {
        for (f++; f < p; f++) {
          if (!o(u.charCodeAt(f))) return !1;
          h = !0;
        }
        return h && isFinite(c(u));
      }
      if (b === "o") {
        for (f++; f < p; f++) {
          if (!r(u.charCodeAt(f))) return !1;
          h = !0;
        }
        return h && isFinite(c(u));
      }
    }
    for (; f < p; f++) {
      if (!i(u.charCodeAt(f)))
        return !1;
      h = !0;
    }
    return h ? isFinite(c(u)) : !1;
  }
  function c(u) {
    let p = u, f = 1, h = p[0];
    if ((h === "-" || h === "+") && (h === "-" && (f = -1), p = p.slice(1), h = p[0]), p === "0") return 0;
    if (h === "0") {
      if (p[1] === "b") return f * parseInt(p.slice(2), 2);
      if (p[1] === "x") return f * parseInt(p.slice(2), 16);
      if (p[1] === "o") return f * parseInt(p.slice(2), 8);
    }
    return f * parseInt(p, 10);
  }
  function l(u) {
    return c(u);
  }
  function d(u) {
    return Object.prototype.toString.call(u) === "[object Number]" && u % 1 === 0 && !e.isNegativeZero(u);
  }
  return hn = new t("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: a,
    construct: l,
    predicate: d,
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
var gn, st;
function Jt() {
  if (st) return gn;
  st = 1;
  const e = Le(), t = K(), o = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  ), r = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function i(u) {
    return u === null || !o.test(u) ? !1 : isFinite(parseFloat(u, 10)) ? !0 : r.test(u);
  }
  function a(u) {
    let p = u.toLowerCase();
    const f = p[0] === "-" ? -1 : 1;
    return "+-".indexOf(p[0]) >= 0 && (p = p.slice(1)), p === ".inf" ? f === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : p === ".nan" ? NaN : f * parseFloat(p, 10);
  }
  const c = /^[-+]?[0-9]+e/;
  function l(u, p) {
    if (isNaN(u))
      switch (p) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === u)
      switch (p) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === u)
      switch (p) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (e.isNegativeZero(u))
      return "-0.0";
    const f = u.toString(10);
    return c.test(f) ? f.replace("e", ".e") : f;
  }
  function d(u) {
    return Object.prototype.toString.call(u) === "[object Number]" && (u % 1 !== 0 || e.isNegativeZero(u));
  }
  return gn = new t("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: i,
    construct: a,
    predicate: d,
    represent: l,
    defaultStyle: "lowercase"
  }), gn;
}
var _n, ct;
function eo() {
  return ct || (ct = 1, _n = Wt().extend({
    implicit: [
      Xt(),
      Qt(),
      Zt(),
      Jt()
    ]
  })), _n;
}
var bn, ut;
function no() {
  return ut || (ut = 1, bn = eo()), bn;
}
var kn, dt;
function to() {
  if (dt) return kn;
  dt = 1;
  const e = K(), t = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), o = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function r(c) {
    return c === null ? !1 : t.exec(c) !== null || o.exec(c) !== null;
  }
  function i(c) {
    let l = 0, d = null, u = t.exec(c);
    if (u === null && (u = o.exec(c)), u === null) throw new Error("Date resolve error");
    const p = +u[1], f = +u[2] - 1, h = +u[3];
    if (!u[4])
      return new Date(Date.UTC(p, f, h));
    const b = +u[4], v = +u[5], C = +u[6];
    if (u[7]) {
      for (l = u[7].slice(0, 3); l.length < 3; )
        l += "0";
      l = +l;
    }
    if (u[9]) {
      const P = +u[10], q = +(u[11] || 0);
      d = (P * 60 + q) * 6e4, u[9] === "-" && (d = -d);
    }
    const A = new Date(Date.UTC(p, f, h, b, v, C, l));
    return d && A.setTime(A.getTime() - d), A;
  }
  function a(c) {
    return c.toISOString();
  }
  return kn = new e("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: r,
    construct: i,
    instanceOf: Date,
    represent: a
  }), kn;
}
var yn, pt;
function oo() {
  if (pt) return yn;
  pt = 1;
  const e = K();
  function t(o) {
    return o === "<<" || o === null;
  }
  return yn = new e("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: t
  }), yn;
}
var wn, ft;
function ro() {
  if (ft) return wn;
  ft = 1;
  const e = K(), t = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function o(c) {
    if (c === null) return !1;
    let l = 0;
    const d = c.length, u = t;
    for (let p = 0; p < d; p++) {
      const f = u.indexOf(c.charAt(p));
      if (!(f > 64)) {
        if (f < 0) return !1;
        l += 6;
      }
    }
    return l % 8 === 0;
  }
  function r(c) {
    const l = c.replace(/[\r\n=]/g, ""), d = l.length, u = t;
    let p = 0;
    const f = [];
    for (let b = 0; b < d; b++)
      b % 4 === 0 && b && (f.push(p >> 16 & 255), f.push(p >> 8 & 255), f.push(p & 255)), p = p << 6 | u.indexOf(l.charAt(b));
    const h = d % 4 * 6;
    return h === 0 ? (f.push(p >> 16 & 255), f.push(p >> 8 & 255), f.push(p & 255)) : h === 18 ? (f.push(p >> 10 & 255), f.push(p >> 2 & 255)) : h === 12 && f.push(p >> 4 & 255), new Uint8Array(f);
  }
  function i(c) {
    let l = "", d = 0;
    const u = c.length, p = t;
    for (let h = 0; h < u; h++)
      h % 3 === 0 && h && (l += p[d >> 18 & 63], l += p[d >> 12 & 63], l += p[d >> 6 & 63], l += p[d & 63]), d = (d << 8) + c[h];
    const f = u % 3;
    return f === 0 ? (l += p[d >> 18 & 63], l += p[d >> 12 & 63], l += p[d >> 6 & 63], l += p[d & 63]) : f === 2 ? (l += p[d >> 10 & 63], l += p[d >> 4 & 63], l += p[d << 2 & 63], l += p[64]) : f === 1 && (l += p[d >> 2 & 63], l += p[d << 4 & 63], l += p[64], l += p[64]), l;
  }
  function a(c) {
    return Object.prototype.toString.call(c) === "[object Uint8Array]";
  }
  return wn = new e("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: o,
    construct: r,
    predicate: a,
    represent: i
  }), wn;
}
var xn, mt;
function io() {
  if (mt) return xn;
  mt = 1;
  const e = K(), t = Object.prototype.hasOwnProperty, o = Object.prototype.toString;
  function r(a) {
    if (a === null) return !0;
    const c = {}, l = a;
    for (let d = 0, u = l.length; d < u; d += 1) {
      const p = l[d];
      let f = !1;
      if (o.call(p) !== "[object Object]") return !1;
      let h;
      for (h in p)
        if (t.call(p, h))
          if (!f) f = !0;
          else return !1;
      if (!f || t.call(c, h)) return !1;
      Object.defineProperty(c, h, { value: !0 });
    }
    return !0;
  }
  function i(a) {
    return a !== null ? a : [];
  }
  return xn = new e("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: r,
    construct: i
  }), xn;
}
var vn, ht;
function lo() {
  if (ht) return vn;
  ht = 1;
  const e = K(), t = Object.prototype.toString;
  function o(i) {
    if (i === null) return !0;
    const a = i, c = new Array(a.length);
    for (let l = 0, d = a.length; l < d; l += 1) {
      const u = a[l];
      if (t.call(u) !== "[object Object]") return !1;
      const p = Object.keys(u);
      if (p.length !== 1) return !1;
      c[l] = [p[0], u[p[0]]];
    }
    return !0;
  }
  function r(i) {
    if (i === null) return [];
    const a = i, c = new Array(a.length);
    for (let l = 0, d = a.length; l < d; l += 1) {
      const u = a[l], p = Object.keys(u);
      c[l] = [p[0], u[p[0]]];
    }
    return c;
  }
  return vn = new e("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: o,
    construct: r
  }), vn;
}
var Tn, gt;
function ao() {
  if (gt) return Tn;
  gt = 1;
  const e = K(), t = Object.prototype.hasOwnProperty;
  function o(i) {
    if (i === null) return !0;
    const a = i;
    for (const c in a)
      if (t.call(a, c) && a[c] !== null)
        return !1;
    return !0;
  }
  function r(i) {
    return i !== null ? i : {};
  }
  return Tn = new e("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: o,
    construct: r
  }), Tn;
}
var An, _t;
function $n() {
  return _t || (_t = 1, An = no().extend({
    implicit: [
      to(),
      oo()
    ],
    explicit: [
      ro(),
      io(),
      lo(),
      ao()
    ]
  })), An;
}
var bt;
function Cr() {
  if (bt) return Ye;
  bt = 1;
  const e = Le(), t = Ie(), o = Mr(), r = $n(), i = Object.prototype.hasOwnProperty, a = 1, c = 2, l = 3, d = 4, u = 1, p = 2, f = 3, h = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, b = /[\x85\u2028\u2029]/, v = /[,\[\]{}]/, C = /^(?:!|!!|![0-9A-Za-z-]+!)$/, A = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function P(n) {
    return Object.prototype.toString.call(n);
  }
  function q(n) {
    return n === 10 || n === 13;
  }
  function B(n) {
    return n === 9 || n === 32;
  }
  function R(n) {
    return n === 9 || n === 32 || n === 10 || n === 13;
  }
  function G(n) {
    return n === 44 || n === 91 || n === 93 || n === 123 || n === 125;
  }
  function te(n) {
    if (n >= 48 && n <= 57)
      return n - 48;
    const m = n | 32;
    return m >= 97 && m <= 102 ? m - 97 + 10 : -1;
  }
  function fe(n) {
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
  function We(n) {
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
  const Pe = new Array(256), ye = new Array(256);
  for (let n = 0; n < 256; n++)
    Pe[n] = be(n) ? 1 : 0, ye[n] = be(n);
  function Y(n, m) {
    this.input = n, this.filename = m.filename || null, this.schema = m.schema || r, this.onWarning = m.onWarning || null, this.legacy = m.legacy || !1, this.json = m.json || !1, this.listener = m.listener || null, this.maxDepth = typeof m.maxDepth == "number" ? m.maxDepth : 100, this.maxTotalMergeKeys = typeof m.maxTotalMergeKeys == "number" ? m.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = n.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
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
    return w.snippet = o(w), new t(m, w);
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
  function de(n) {
    const m = n.anchorMapTransactions.pop(), w = n.anchorMapTransactions;
    if (w.length === 0) return;
    const x = w[w.length - 1], k = Object.keys(m);
    for (let s = 0, g = k.length; s < g; s += 1) {
      const _ = k[s];
      i.call(x, _) || (x[_] = m[_]);
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
  const Oe = {
    YAML: function(m, w, x) {
      m.version !== null && I(m, "duplication of %YAML directive"), x.length !== 1 && I(m, "YAML directive accepts exactly one argument");
      const k = /^([0-9]+)\.([0-9]+)$/.exec(x[0]);
      k === null && I(m, "ill-formed argument of the YAML directive");
      const s = parseInt(k[1], 10), g = parseInt(k[2], 10);
      s !== 1 && I(m, "unacceptable YAML version of the document"), m.version = x[0], m.checkLineBreaks = g < 2, g !== 1 && g !== 2 && me(m, "unsupported YAML version of the document");
    },
    TAG: function(m, w, x) {
      let k;
      x.length !== 2 && I(m, "TAG directive accepts exactly two arguments");
      const s = x[0];
      k = x[1], C.test(s) || I(m, "ill-formed tag handle (first argument) of the TAG directive"), i.call(m.tagMap, s) && I(m, 'there is a previously declared suffix for "' + s + '" tag handle'), A.test(k) || I(m, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        k = decodeURIComponent(k);
      } catch {
        I(m, "tag prefix is malformed: " + k);
      }
      m.tagMap[s] = k;
    }
  };
  function U(n, m, w, x) {
    if (m < w) {
      const k = n.input.slice(m, w);
      if (x)
        for (let s = 0, g = k.length; s < g; s += 1) {
          const _ = k.charCodeAt(s);
          _ === 9 || _ >= 32 && _ <= 1114111 || I(n, "expected valid JSON character");
        }
      else h.test(k) && I(n, "the stream contains non-printable characters");
      n.result += k;
    }
  }
  function oe(n) {
    n.totalMergeKeys++, n.maxTotalMergeKeys !== -1 && n.totalMergeKeys > n.maxTotalMergeKeys && I(n, "merge keys exceeded maxTotalMergeKeys (" + n.maxTotalMergeKeys + ")");
  }
  function xe(n, m, w, x) {
    e.isObject(w) || I(n, "cannot merge mappings; the provided source object is unacceptable"), oe(n);
    const k = Object.keys(w);
    for (let s = 0, g = k.length; s < g; s += 1) {
      const _ = k[s];
      oe(n), i.call(m, _) || (ke(m, _, w[_]), x[_] = !0);
    }
  }
  function J(n, m, w, x, k, s, g, _, T) {
    if (Array.isArray(k)) {
      k = Array.prototype.slice.call(k);
      for (let S = 0, E = k.length; S < E; S += 1)
        Array.isArray(k[S]) && I(n, "nested arrays are not supported inside keys"), typeof k == "object" && P(k[S]) === "[object Object]" && (k[S] = "[object Object]");
    }
    if (typeof k == "object" && P(k) === "[object Object]" && (k = "[object Object]"), k = String(k), m === null && (m = {}), x === "tag:yaml.org,2002:merge")
      if (Array.isArray(s)) {
        s.length > 100 && I(n, "abnormal merge sequence size");
        for (let S = 0, E = s.length; S < E; S += 1)
          xe(n, m, s[S], w);
      } else
        xe(n, m, s, w);
    else
      !n.json && !i.call(w, k) && i.call(m, k) && (n.line = g || n.line, n.lineStart = _ || n.lineStart, n.position = T || n.position, I(n, "duplicated mapping key")), ke(m, k, s), delete w[k];
    return m;
  }
  function ve(n) {
    const m = n.input.charCodeAt(n.position);
    m === 10 ? n.position++ : m === 13 ? (n.position++, n.input.charCodeAt(n.position) === 10 && n.position++) : I(n, "a line break is expected"), n.line += 1, n.lineStart = n.position, n.firstTabInLine = -1;
  }
  function H(n, m, w) {
    let x = 0, k = n.input.charCodeAt(n.position);
    for (; k !== 0; ) {
      for (; B(k); )
        k === 9 && n.firstTabInLine === -1 && (n.firstTabInLine = n.position), k = n.input.charCodeAt(++n.position);
      if (m && k === 35)
        do
          k = n.input.charCodeAt(++n.position);
        while (k !== 10 && k !== 13 && k !== 0);
      if (q(k))
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
  function ge(n, m) {
    m === 1 ? n.result += " " : m > 1 && (n.result += e.repeat(`
`, m - 1));
  }
  function Re(n, m, w) {
    let x, k, s, g, _, T;
    const S = n.kind, E = n.result;
    let y = n.input.charCodeAt(n.position);
    if (R(y) || G(y) || y === 35 || y === 38 || y === 42 || y === 33 || y === 124 || y === 62 || y === 39 || y === 34 || y === 37 || y === 64 || y === 96)
      return !1;
    if (y === 63 || y === 45) {
      const M = n.input.charCodeAt(n.position + 1);
      if (R(M) || w && G(M))
        return !1;
    }
    for (n.kind = "scalar", n.result = "", x = k = n.position, s = !1; y !== 0; ) {
      if (y === 58) {
        const M = n.input.charCodeAt(n.position + 1);
        if (R(M) || w && G(M))
          break;
      } else if (y === 35) {
        const M = n.input.charCodeAt(n.position - 1);
        if (R(M))
          break;
      } else {
        if (n.position === n.lineStart && X(n) || w && G(y))
          break;
        if (q(y))
          if (g = n.line, _ = n.lineStart, T = n.lineIndent, H(n, !1, -1), n.lineIndent >= m) {
            s = !0, y = n.input.charCodeAt(n.position);
            continue;
          } else {
            n.position = k, n.line = g, n.lineStart = _, n.lineIndent = T;
            break;
          }
      }
      s && (U(n, x, k, !1), ge(n, n.line - g), x = k = n.position, s = !1), B(y) || (k = n.position + 1), y = n.input.charCodeAt(++n.position);
    }
    return U(n, x, k, !1), n.result ? !0 : (n.kind = S, n.result = E, !1);
  }
  function Te(n, m) {
    let w, x, k = n.input.charCodeAt(n.position);
    if (k !== 39)
      return !1;
    for (n.kind = "scalar", n.result = "", n.position++, w = x = n.position; (k = n.input.charCodeAt(n.position)) !== 0; )
      if (k === 39)
        if (U(n, w, n.position, !0), k = n.input.charCodeAt(++n.position), k === 39)
          w = n.position, n.position++, x = n.position;
        else
          return !0;
      else q(k) ? (U(n, w, x, !0), ge(n, H(n, !1, m)), w = x = n.position) : n.position === n.lineStart && X(n) ? I(n, "unexpected end of the document within a single quoted scalar") : (n.position++, B(k) || (x = n.position));
    I(n, "unexpected end of the stream within a single quoted scalar");
  }
  function De(n, m) {
    let w, x, k, s = n.input.charCodeAt(n.position);
    if (s !== 34)
      return !1;
    for (n.kind = "scalar", n.result = "", n.position++, w = x = n.position; (s = n.input.charCodeAt(n.position)) !== 0; ) {
      if (s === 34)
        return U(n, w, n.position, !0), n.position++, !0;
      if (s === 92) {
        if (U(n, w, n.position, !0), s = n.input.charCodeAt(++n.position), q(s))
          H(n, !1, m);
        else if (s < 256 && Pe[s])
          n.result += ye[s], n.position++;
        else if ((k = fe(s)) > 0) {
          let g = k, _ = 0;
          for (; g > 0; g--)
            s = n.input.charCodeAt(++n.position), (k = te(s)) >= 0 ? _ = (_ << 4) + k : I(n, "expected hexadecimal character");
          n.result += We(_), n.position++;
        } else
          I(n, "unknown escape sequence");
        w = x = n.position;
      } else q(s) ? (U(n, w, x, !0), ge(n, H(n, !1, m)), w = x = n.position) : n.position === n.lineStart && X(n) ? I(n, "unexpected end of the document within a double quoted scalar") : (n.position++, B(s) || (x = n.position));
    }
    I(n, "unexpected end of the stream within a double quoted scalar");
  }
  function Fe(n, m) {
    let w = !0, x, k, s;
    const g = n.tag;
    let _;
    const T = n.anchor;
    let S, E, y, M;
    const L = /* @__PURE__ */ Object.create(null);
    let N, O, F, $ = n.input.charCodeAt(n.position);
    if ($ === 91)
      S = 93, M = !1, _ = [];
    else if ($ === 123)
      S = 125, M = !0, _ = {};
    else
      return !1;
    for (n.anchor !== null && Z(n, n.anchor, _), $ = n.input.charCodeAt(++n.position); $ !== 0; ) {
      if (H(n, !0, m), $ = n.input.charCodeAt(n.position), $ === S)
        return n.position++, n.tag = g, n.anchor = T, n.kind = M ? "mapping" : "sequence", n.result = _, !0;
      if (w ? $ === 44 && I(n, "expected the node content, but found ','") : I(n, "missed comma between flow collection entries"), O = N = F = null, E = y = !1, $ === 63) {
        const le = n.input.charCodeAt(n.position + 1);
        R(le) && (E = y = !0, n.position++, H(n, !0, m));
      }
      x = n.line, k = n.lineStart, s = n.position, ie(n, m, a, !1, !0), O = n.tag, N = n.result, H(n, !0, m), $ = n.input.charCodeAt(n.position), (y || n.line === x) && $ === 58 && (E = !0, $ = n.input.charCodeAt(++n.position), H(n, !0, m), ie(n, m, a, !1, !0), F = n.result), M ? J(n, _, L, O, N, F, x, k, s) : E ? _.push(J(n, null, L, O, N, F, x, k, s)) : _.push(N), H(n, !0, m), $ = n.input.charCodeAt(n.position), $ === 44 ? (w = !0, $ = n.input.charCodeAt(++n.position)) : w = !1;
    }
    I(n, "unexpected end of the stream within a flow collection");
  }
  function re(n, m) {
    let w, x = u, k = !1, s = !1, g = m, _ = 0, T = !1, S, E = n.input.charCodeAt(n.position);
    if (E === 124)
      w = !1;
    else if (E === 62)
      w = !0;
    else
      return !1;
    for (n.kind = "scalar", n.result = ""; E !== 0; )
      if (E = n.input.charCodeAt(++n.position), E === 43 || E === 45)
        u === x ? x = E === 43 ? f : p : I(n, "repeat of a chomping mode identifier");
      else if ((S = ue(E)) >= 0)
        S === 0 ? I(n, "bad explicit indentation width of a block scalar; it cannot be less than one") : s ? I(n, "repeat of an indentation width identifier") : (g = m + S - 1, s = !0);
      else
        break;
    if (B(E)) {
      do
        E = n.input.charCodeAt(++n.position);
      while (B(E));
      if (E === 35)
        do
          E = n.input.charCodeAt(++n.position);
        while (!q(E) && E !== 0);
    }
    for (; E !== 0; ) {
      for (ve(n), n.lineIndent = 0, E = n.input.charCodeAt(n.position); (!s || n.lineIndent < g) && E === 32; )
        n.lineIndent++, E = n.input.charCodeAt(++n.position);
      if (!s && n.lineIndent > g && (g = n.lineIndent), q(E)) {
        _++;
        continue;
      }
      if (!s && g === 0 && I(n, "missing indentation for block scalar"), n.lineIndent < g) {
        x === f ? n.result += e.repeat(`
`, k ? 1 + _ : _) : x === u && k && (n.result += `
`);
        break;
      }
      w ? B(E) ? (T = !0, n.result += e.repeat(`
`, k ? 1 + _ : _)) : T ? (T = !1, n.result += e.repeat(`
`, _ + 1)) : _ === 0 ? k && (n.result += " ") : n.result += e.repeat(`
`, _) : n.result += e.repeat(`
`, k ? 1 + _ : _), k = !0, s = !0, _ = 0;
      const y = n.position;
      for (; !q(E) && E !== 0; )
        E = n.input.charCodeAt(++n.position);
      U(n, y, n.position, !1);
    }
    return !0;
  }
  function $e(n, m) {
    const w = n.tag, x = n.anchor, k = [];
    let s = !1;
    if (n.firstTabInLine !== -1) return !1;
    n.anchor !== null && Z(n, n.anchor, k);
    let g = n.input.charCodeAt(n.position);
    for (; g !== 0 && (n.firstTabInLine !== -1 && (n.position = n.firstTabInLine, I(n, "tab characters must not be used in indentation")), g === 45); ) {
      const _ = n.input.charCodeAt(n.position + 1);
      if (!R(_))
        break;
      if (s = !0, n.position++, H(n, !0, -1) && n.lineIndent <= m) {
        k.push(null), g = n.input.charCodeAt(n.position);
        continue;
      }
      const T = n.line;
      if (ie(n, m, l, !1, !0), k.push(n.result), H(n, !0, -1), g = n.input.charCodeAt(n.position), (n.line === T || n.lineIndent > m) && g !== 0)
        I(n, "bad indentation of a sequence entry");
      else if (n.lineIndent < m)
        break;
    }
    return s ? (n.tag = w, n.anchor = x, n.kind = "sequence", n.result = k, !0) : !1;
  }
  function qe(n, m, w) {
    let x, k, s, g;
    const _ = n.tag, T = n.anchor, S = {}, E = /* @__PURE__ */ Object.create(null);
    let y = null, M = null, L = null, N = !1, O = !1;
    if (n.firstTabInLine !== -1) return !1;
    n.anchor !== null && Z(n, n.anchor, S);
    let F = n.input.charCodeAt(n.position);
    for (; F !== 0; ) {
      !N && n.firstTabInLine !== -1 && (n.position = n.firstTabInLine, I(n, "tab characters must not be used in indentation"));
      const $ = n.input.charCodeAt(n.position + 1), le = n.line;
      if ((F === 63 || F === 58) && R($))
        F === 63 ? (N && (J(n, S, E, y, M, null, k, s, g), y = M = L = null), O = !0, N = !0, x = !0) : N ? (N = !1, x = !0) : I(n, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), n.position += 1, F = $;
      else {
        if (k = n.line, s = n.lineStart, g = n.position, !ie(n, w, c, !1, !0))
          break;
        if (n.line === le) {
          for (F = n.input.charCodeAt(n.position); B(F); )
            F = n.input.charCodeAt(++n.position);
          if (F === 58)
            F = n.input.charCodeAt(++n.position), R(F) || I(n, "a whitespace character is expected after the key-value separator within a block mapping"), N && (J(n, S, E, y, M, null, k, s, g), y = M = L = null), O = !0, N = !1, x = !1, y = n.tag, M = n.result;
          else if (O)
            I(n, "can not read an implicit mapping pair; a colon is missed");
          else
            return n.tag = _, n.anchor = T, !0;
        } else if (O)
          I(n, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return n.tag = _, n.anchor = T, !0;
      }
      if ((n.line === le || n.lineIndent > m) && (N && (k = n.line, s = n.lineStart, g = n.position), ie(n, m, d, !0, x) && (N ? M = n.result : L = n.result), N || (J(n, S, E, y, M, L, k, s, g), y = M = L = null), H(n, !0, -1), F = n.input.charCodeAt(n.position)), (n.line === le || n.lineIndent > m) && F !== 0)
        I(n, "bad indentation of a mapping entry");
      else if (n.lineIndent < m)
        break;
    }
    return N && J(n, S, E, y, M, null, k, s, g), O && (n.tag = _, n.anchor = T, n.kind = "mapping", n.result = S), O;
  }
  function je(n) {
    let m = !1, w = !1, x, k, s = n.input.charCodeAt(n.position);
    if (s !== 33) return !1;
    n.tag !== null && I(n, "duplication of a tag property"), s = n.input.charCodeAt(++n.position), s === 60 ? (m = !0, s = n.input.charCodeAt(++n.position)) : s === 33 ? (w = !0, x = "!!", s = n.input.charCodeAt(++n.position)) : x = "!";
    let g = n.position;
    if (m) {
      do
        s = n.input.charCodeAt(++n.position);
      while (s !== 0 && s !== 62);
      n.position < n.length ? (k = n.input.slice(g, n.position), s = n.input.charCodeAt(++n.position)) : I(n, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; s !== 0 && !R(s); )
        s === 33 && (w ? I(n, "tag suffix cannot contain exclamation marks") : (x = n.input.slice(g - 1, n.position + 1), C.test(x) || I(n, "named tag handle cannot contain such characters"), w = !0, g = n.position + 1)), s = n.input.charCodeAt(++n.position);
      k = n.input.slice(g, n.position), v.test(k) && I(n, "tag suffix cannot contain flow indicator characters");
    }
    k && !A.test(k) && I(n, "tag name cannot contain such characters: " + k);
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
    for (; m !== 0 && !R(m) && !G(m); )
      m = n.input.charCodeAt(++n.position);
    return n.position === w && I(n, "name of an anchor node must contain at least one character"), n.anchor = n.input.slice(w, n.position), !0;
  }
  function Ze(n) {
    let m = n.input.charCodeAt(n.position);
    if (m !== 42) return !1;
    m = n.input.charCodeAt(++n.position);
    const w = n.position;
    for (; m !== 0 && !R(m) && !G(m); )
      m = n.input.charCodeAt(++n.position);
    n.position === w && I(n, "name of an alias node must contain at least one character");
    const x = n.input.slice(w, n.position);
    return i.call(n.anchorMap, x) || I(n, 'unidentified alias "' + x + '"'), n.result = n.anchorMap[x], H(n, !0, -1), !0;
  }
  function He(n, m, w, x) {
    const k = we(n);
    return Xe(n), he(n, m), n.tag = null, n.anchor = null, n.kind = null, n.result = null, qe(n, w, x) && n.kind === "mapping" ? (de(n), !0) : (Qe(n), he(n, k), !1);
  }
  function ie(n, m, w, x, k) {
    let s, g, _ = 1, T = !1, S = !1, E = null, y, M, L;
    n.depth >= n.maxDepth && I(n, "nesting exceeded maxDepth (" + n.maxDepth + ")"), n.depth += 1, n.listener !== null && n.listener("open", n), n.tag = null, n.anchor = null, n.kind = null, n.result = null;
    const N = s = g = d === w || l === w;
    if (x && H(n, !0, -1) && (T = !0, n.lineIndent > m ? _ = 1 : n.lineIndent === m ? _ = 0 : n.lineIndent < m && (_ = -1)), _ === 1)
      for (; ; ) {
        const O = n.input.charCodeAt(n.position), F = we(n);
        if (T && (O === 33 && n.tag !== null || O === 38 && n.anchor !== null) || !je(n) && !Be(n))
          break;
        E === null && (E = F), H(n, !0, -1) ? (T = !0, g = N, n.lineIndent > m ? _ = 1 : n.lineIndent === m ? _ = 0 : n.lineIndent < m && (_ = -1)) : g = !1;
      }
    if (g && (g = T || k), _ === 1 || d === w)
      if (a === w || c === w ? M = m : M = m + 1, L = n.position - n.lineStart, _ === 1)
        if (g && ($e(n, L) || qe(n, L, M)) || Fe(n, M))
          S = !0;
        else {
          const O = n.input.charCodeAt(n.position);
          E !== null && N && !g && O !== 124 && O !== 62 && He(
            n,
            E,
            E.position - E.lineStart,
            M
          ) || s && re(n, M) || Te(n, M) || De(n, M) ? S = !0 : Ze(n) ? (S = !0, (n.tag !== null || n.anchor !== null) && I(n, "alias node should not have any properties")) : Re(n, M, a === w) && (S = !0, n.tag === null && (n.tag = "?")), n.anchor !== null && Z(n, n.anchor, n.result);
        }
      else _ === 0 && (S = g && $e(n, L));
    if (n.tag === null)
      n.anchor !== null && Z(n, n.anchor, n.result);
    else if (n.tag === "?") {
      n.result !== null && n.kind !== "scalar" && I(n, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + n.kind + '"');
      for (let O = 0, F = n.implicitTypes.length; O < F; O += 1)
        if (y = n.implicitTypes[O], y.resolve(n.result)) {
          n.result = y.construct(n.result), n.tag = y.tag, n.anchor !== null && Z(n, n.anchor, n.result);
          break;
        }
    } else if (n.tag !== "!") {
      if (i.call(n.typeMap[n.kind || "fallback"], n.tag))
        y = n.typeMap[n.kind || "fallback"][n.tag];
      else {
        y = null;
        const O = n.typeMap.multi[n.kind || "fallback"];
        for (let F = 0, $ = O.length; F < $; F += 1)
          if (n.tag.slice(0, O[F].tag.length) === O[F].tag) {
            y = O[F];
            break;
          }
      }
      y || I(n, "unknown tag !<" + n.tag + ">"), n.result !== null && y.kind !== n.kind && I(n, "unacceptable node kind for !<" + n.tag + '> tag; it should be "' + y.kind + '", not "' + n.kind + '"'), y.resolve(n.result, n.tag) ? (n.result = y.construct(n.result, n.tag), n.anchor !== null && Z(n, n.anchor, n.result)) : I(n, "cannot resolve a node with !<" + n.tag + "> explicit tag");
    }
    return n.listener !== null && n.listener("close", n), n.depth -= 1, n.tag !== null || n.anchor !== null || S;
  }
  function Je(n) {
    const m = n.position;
    let w = !1, x;
    for (n.version = null, n.checkLineBreaks = n.legacy, n.tagMap = /* @__PURE__ */ Object.create(null), n.anchorMap = /* @__PURE__ */ Object.create(null); (x = n.input.charCodeAt(n.position)) !== 0 && (H(n, !0, -1), x = n.input.charCodeAt(n.position), !(n.lineIndent > 0 || x !== 37)); ) {
      w = !0, x = n.input.charCodeAt(++n.position);
      let k = n.position;
      for (; x !== 0 && !R(x); )
        x = n.input.charCodeAt(++n.position);
      const s = n.input.slice(k, n.position), g = [];
      for (s.length < 1 && I(n, "directive name must not be less than one character in length"); x !== 0; ) {
        for (; B(x); )
          x = n.input.charCodeAt(++n.position);
        if (x === 35) {
          do
            x = n.input.charCodeAt(++n.position);
          while (x !== 0 && !q(x));
          break;
        }
        if (q(x)) break;
        for (k = n.position; x !== 0 && !R(x); )
          x = n.input.charCodeAt(++n.position);
        g.push(n.input.slice(k, n.position));
      }
      x !== 0 && ve(n), i.call(Oe, s) ? Oe[s](n, s, g) : me(n, 'unknown document directive "' + s + '"');
    }
    if (H(n, !0, -1), n.lineIndent === 0 && n.input.charCodeAt(n.position) === 45 && n.input.charCodeAt(n.position + 1) === 45 && n.input.charCodeAt(n.position + 2) === 45 ? (n.position += 3, H(n, !0, -1)) : w && I(n, "directives end mark is expected"), ie(n, n.lineIndent - 1, d, !1, !0), H(n, !0, -1), n.checkLineBreaks && b.test(n.input.slice(m, n.position)) && me(n, "non-ASCII line breaks are interpreted as content"), n.documents.push(n.result), n.position === n.lineStart && X(n)) {
      n.input.charCodeAt(n.position) === 46 && (n.position += 3, H(n, !0, -1));
      return;
    }
    n.position < n.length - 1 && I(n, "end of the stream or a document separator is expected");
  }
  function Ae(n, m) {
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
    const x = Ae(n, w);
    if (typeof m != "function")
      return x;
    for (let k = 0, s = x.length; k < s; k += 1)
      m(x[k]);
  }
  function nn(n, m) {
    const w = Ae(n, m);
    if (w.length !== 0) {
      if (w.length === 1)
        return w[0];
      throw new t("expected a single document in the stream, but found more");
    }
  }
  return Ye.loadAll = en, Ye.load = nn, Ye;
}
var Sn = {}, kt;
function Lr() {
  if (kt) return Sn;
  kt = 1;
  const e = Le(), t = Ie(), o = $n(), r = Object.prototype.toString, i = Object.prototype.hasOwnProperty, a = 65279, c = 9, l = 10, d = 13, u = 32, p = 33, f = 34, h = 35, b = 37, v = 38, C = 39, A = 42, P = 44, q = 45, B = 58, R = 61, G = 62, te = 63, fe = 64, ue = 91, be = 93, We = 96, ke = 123, Pe = 124, ye = 125, Y = {};
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
  function me(s, g) {
    if (g === null) return {};
    const _ = {}, T = Object.keys(g);
    for (let S = 0, E = T.length; S < E; S += 1) {
      let y = T[S], M = String(g[y]);
      y.slice(0, 2) === "!!" && (y = "tag:yaml.org,2002:" + y.slice(2));
      const L = s.compiledTypeMap.fallback[y];
      L && i.call(L.styleAliases, M) && (M = L.styleAliases[M]), _[y] = M;
    }
    return _;
  }
  function Z(s) {
    let g, _;
    const T = s.toString(16).toUpperCase();
    if (s <= 255)
      g = "x", _ = 2;
    else if (s <= 65535)
      g = "u", _ = 4;
    else if (s <= 4294967295)
      g = "U", _ = 8;
    else
      throw new t("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + g + e.repeat("0", _ - T.length) + T;
  }
  const Xe = 1, de = 2;
  function Qe(s) {
    this.schema = s.schema || o, this.indent = Math.max(1, s.indent || 2), this.noArrayIndent = s.noArrayIndent || !1, this.skipInvalid = s.skipInvalid || !1, this.flowLevel = e.isNothing(s.flowLevel) ? -1 : s.flowLevel, this.styleMap = me(this.schema, s.styles || null), this.sortKeys = s.sortKeys || !1, this.lineWidth = s.lineWidth || 80, this.noRefs = s.noRefs || !1, this.noCompatMode = s.noCompatMode || !1, this.condenseFlow = s.condenseFlow || !1, this.quotingType = s.quotingType === '"' ? de : Xe, this.forceQuotes = s.forceQuotes || !1, this.replacer = typeof s.replacer == "function" ? s.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function we(s, g) {
    const _ = e.repeat(" ", g);
    let T = 0, S = "";
    const E = s.length;
    for (; T < E; ) {
      let y;
      const M = s.indexOf(`
`, T);
      M === -1 ? (y = s.slice(T), T = E) : (y = s.slice(T, M + 1), T = M + 1), y.length && y !== `
` && (S += _), S += y;
    }
    return S;
  }
  function he(s, g) {
    return `
` + e.repeat(" ", s.indent * g);
  }
  function Oe(s, g) {
    for (let _ = 0, T = s.implicitTypes.length; _ < T; _ += 1)
      if (s.implicitTypes[_].resolve(g))
        return !0;
    return !1;
  }
  function U(s) {
    return s === u || s === c;
  }
  function oe(s) {
    return s >= 32 && s <= 126 || s >= 161 && s <= 55295 && s !== 8232 && s !== 8233 || s >= 57344 && s <= 65533 && s !== a || s >= 65536 && s <= 1114111;
  }
  function xe(s) {
    return oe(s) && s !== a && // - b-char
    s !== d && s !== l;
  }
  function J(s, g, _) {
    const T = xe(s), S = T && !U(s);
    return (
      // ns-plain-safe
      (_ ? T : T && // - c-flow-indicator
      s !== P && s !== ue && s !== be && s !== ke && s !== ye) && // ns-plain-char
      s !== h && // false on '#'
      !(g === B && !S) || // false on ': '
      xe(g) && !U(g) && s === h || // change to true on '[^ ]#'
      g === B && S
    );
  }
  function ve(s) {
    return oe(s) && s !== a && !U(s) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    s !== q && s !== te && s !== B && s !== P && s !== ue && s !== be && s !== ke && s !== ye && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    s !== h && s !== v && s !== A && s !== p && s !== Pe && s !== R && s !== G && s !== C && s !== f && // | “%” | “@” | “`”)
    s !== b && s !== fe && s !== We;
  }
  function H(s) {
    return !U(s) && s !== B;
  }
  function X(s, g) {
    const _ = s.charCodeAt(g);
    let T;
    return _ >= 55296 && _ <= 56319 && g + 1 < s.length && (T = s.charCodeAt(g + 1), T >= 56320 && T <= 57343) ? (_ - 55296) * 1024 + T - 56320 + 65536 : _;
  }
  function ge(s) {
    return /^\n* /.test(s);
  }
  const Re = 1, Te = 2, De = 3, Fe = 4, re = 5;
  function $e(s, g, _, T, S, E, y, M) {
    let L, N = 0, O = null, F = !1, $ = !1;
    const le = T !== -1;
    let Se = -1, Ee = ve(X(s, 0)) && H(X(s, s.length - 1));
    if (g || y)
      for (L = 0; L < s.length; N >= 65536 ? L += 2 : L++) {
        if (N = X(s, L), !oe(N))
          return re;
        Ee = Ee && J(N, O, M), O = N;
      }
    else {
      for (L = 0; L < s.length; N >= 65536 ? L += 2 : L++) {
        if (N = X(s, L), N === l)
          F = !0, le && ($ = $ || // Foldable line = too long, and not more-indented.
          L - Se - 1 > T && s[Se + 1] !== " ", Se = L);
        else if (!oe(N))
          return re;
        Ee = Ee && J(N, O, M), O = N;
      }
      $ = $ || le && L - Se - 1 > T && s[Se + 1] !== " ";
    }
    return !F && !$ ? Ee && !y && !S(s) ? Re : E === de ? re : Te : _ > 9 && ge(s) ? re : y ? E === de ? re : Te : $ ? Fe : De;
  }
  function qe(s, g, _, T, S) {
    s.dump = (function() {
      if (g.length === 0)
        return s.quotingType === de ? '""' : "''";
      if (!s.noCompatMode && (Ne.indexOf(g) !== -1 || I.test(g)))
        return s.quotingType === de ? '"' + g + '"' : "'" + g + "'";
      const E = s.indent * Math.max(1, _), y = s.lineWidth === -1 ? -1 : Math.max(Math.min(s.lineWidth, 40), s.lineWidth - E), M = T || // No block styles in flow mode.
      s.flowLevel > -1 && _ >= s.flowLevel;
      function L(N) {
        return Oe(s, N);
      }
      switch ($e(
        g,
        M,
        s.indent,
        y,
        L,
        s.quotingType,
        s.forceQuotes && !T,
        S
      )) {
        case Re:
          return g;
        case Te:
          return "'" + g.replace(/'/g, "''") + "'";
        case De:
          return "|" + je(g, s.indent) + Be(we(g, E));
        case Fe:
          return ">" + je(g, s.indent) + Be(we(Ze(g, y), E));
        case re:
          return '"' + ie(g) + '"';
        default:
          throw new t("impossible error: invalid scalar style");
      }
    })();
  }
  function je(s, g) {
    const _ = ge(s) ? String(g) : "", T = s[s.length - 1] === `
`, E = T && (s[s.length - 2] === `
` || s === `
`) ? "+" : T ? "" : "-";
    return _ + E + `
`;
  }
  function Be(s) {
    return s[s.length - 1] === `
` ? s.slice(0, -1) : s;
  }
  function Ze(s, g) {
    const _ = /(\n+)([^\n]*)/g;
    let T = (function() {
      let M = s.indexOf(`
`);
      return M = M !== -1 ? M : s.length, _.lastIndex = M, He(s.slice(0, M), g);
    })(), S = s[0] === `
` || s[0] === " ", E, y;
    for (; y = _.exec(s); ) {
      const M = y[1], L = y[2];
      E = L[0] === " ", T += M + (!S && !E && L !== "" ? `
` : "") + He(L, g), S = E;
    }
    return T;
  }
  function He(s, g) {
    if (s === "" || s[0] === " ") return s;
    const _ = / [^ ]/g;
    let T, S = 0, E, y = 0, M = 0, L = "";
    for (; T = _.exec(s); )
      M = T.index, M - S > g && (E = y > S ? y : M, L += `
` + s.slice(S, E), S = E + 1), y = M;
    return L += `
`, s.length - S > g && y > S ? L += s.slice(S, y) + `
` + s.slice(y + 1) : L += s.slice(S), L.slice(1);
  }
  function ie(s) {
    let g = "", _ = 0;
    for (let T = 0; T < s.length; _ >= 65536 ? T += 2 : T++) {
      _ = X(s, T);
      const S = Y[_];
      !S && oe(_) ? (g += s[T], _ >= 65536 && (g += s[T + 1])) : g += S || Z(_);
    }
    return g;
  }
  function Je(s, g, _) {
    let T = "";
    const S = s.tag;
    for (let E = 0, y = _.length; E < y; E += 1) {
      let M = _[E];
      s.replacer && (M = s.replacer.call(_, String(E), M)), (m(s, g, M, !1, !1) || typeof M > "u" && m(s, g, null, !1, !1)) && (T !== "" && (T += "," + (s.condenseFlow ? "" : " ")), T += s.dump);
    }
    s.tag = S, s.dump = "[" + T + "]";
  }
  function Ae(s, g, _, T) {
    let S = "";
    const E = s.tag;
    for (let y = 0, M = _.length; y < M; y += 1) {
      let L = _[y];
      s.replacer && (L = s.replacer.call(_, String(y), L)), (m(s, g + 1, L, !0, !0, !1, !0) || typeof L > "u" && m(s, g + 1, null, !0, !0, !1, !0)) && ((!T || S !== "") && (S += he(s, g)), s.dump && l === s.dump.charCodeAt(0) ? S += "-" : S += "- ", S += s.dump);
    }
    s.tag = E, s.dump = S || "[]";
  }
  function en(s, g, _) {
    let T = "";
    const S = s.tag, E = Object.keys(_);
    for (let y = 0, M = E.length; y < M; y += 1) {
      let L = "";
      T !== "" && (L += ", "), s.condenseFlow && (L += '"');
      const N = E[y];
      let O = _[N];
      s.replacer && (O = s.replacer.call(_, N, O)), m(s, g, N, !1, !1) && (s.dump.length > 1024 && (L += "? "), L += s.dump + (s.condenseFlow ? '"' : "") + ":" + (s.condenseFlow ? "" : " "), m(s, g, O, !1, !1) && (L += s.dump, T += L));
    }
    s.tag = S, s.dump = "{" + T + "}";
  }
  function nn(s, g, _, T) {
    let S = "";
    const E = s.tag, y = Object.keys(_);
    if (s.sortKeys === !0)
      y.sort();
    else if (typeof s.sortKeys == "function")
      y.sort(s.sortKeys);
    else if (s.sortKeys)
      throw new t("sortKeys must be a boolean or a function");
    for (let M = 0, L = y.length; M < L; M += 1) {
      let N = "";
      (!T || S !== "") && (N += he(s, g));
      const O = y[M];
      let F = _[O];
      if (s.replacer && (F = s.replacer.call(_, O, F)), !m(s, g + 1, O, !0, !0, !0))
        continue;
      const $ = s.tag !== null && s.tag !== "?" || s.dump && s.dump.length > 1024;
      $ && (s.dump && l === s.dump.charCodeAt(0) ? N += "?" : N += "? "), N += s.dump, $ && (N += he(s, g)), m(s, g + 1, F, !0, $) && (s.dump && l === s.dump.charCodeAt(0) ? N += ":" : N += ": ", N += s.dump, S += N);
    }
    s.tag = E, s.dump = S || "{}";
  }
  function n(s, g, _) {
    const T = _ ? s.explicitTypes : s.implicitTypes;
    for (let S = 0, E = T.length; S < E; S += 1) {
      const y = T[S];
      if ((y.instanceOf || y.predicate) && (!y.instanceOf || typeof g == "object" && g instanceof y.instanceOf) && (!y.predicate || y.predicate(g))) {
        if (_ ? y.multi && y.representName ? s.tag = y.representName(g) : s.tag = y.tag : s.tag = "?", y.represent) {
          const M = s.styleMap[y.tag] || y.defaultStyle;
          let L;
          if (r.call(y.represent) === "[object Function]")
            L = y.represent(g, M);
          else if (i.call(y.represent, M))
            L = y.represent[M](g, M);
          else
            throw new t("!<" + y.tag + '> tag resolver accepts not "' + M + '" style');
          s.dump = L;
        }
        return !0;
      }
    }
    return !1;
  }
  function m(s, g, _, T, S, E, y) {
    s.tag = null, s.dump = _, n(s, _, !1) || n(s, _, !0);
    const M = r.call(s.dump), L = T;
    T && (T = s.flowLevel < 0 || s.flowLevel > g);
    const N = M === "[object Object]" || M === "[object Array]";
    let O, F;
    if (N && (O = s.duplicates.indexOf(_), F = O !== -1), (s.tag !== null && s.tag !== "?" || F || s.indent !== 2 && g > 0) && (S = !1), F && s.usedDuplicates[O])
      s.dump = "*ref_" + O;
    else {
      if (N && F && !s.usedDuplicates[O] && (s.usedDuplicates[O] = !0), M === "[object Object]")
        T && Object.keys(s.dump).length !== 0 ? (nn(s, g, s.dump, S), F && (s.dump = "&ref_" + O + s.dump)) : (en(s, g, s.dump), F && (s.dump = "&ref_" + O + " " + s.dump));
      else if (M === "[object Array]")
        T && s.dump.length !== 0 ? (s.noArrayIndent && !y && g > 0 ? Ae(s, g - 1, s.dump, S) : Ae(s, g, s.dump, S), F && (s.dump = "&ref_" + O + s.dump)) : (Je(s, g, s.dump), F && (s.dump = "&ref_" + O + " " + s.dump));
      else if (M === "[object String]")
        s.tag !== "?" && qe(s, s.dump, g, E, L);
      else {
        if (M === "[object Undefined]")
          return !1;
        if (s.skipInvalid) return !1;
        throw new t("unacceptable kind of an object to dump " + M);
      }
      if (s.tag !== null && s.tag !== "?") {
        let $ = encodeURI(
          s.tag[0] === "!" ? s.tag.slice(1) : s.tag
        ).replace(/!/g, "%21");
        s.tag[0] === "!" ? $ = "!" + $ : $.slice(0, 18) === "tag:yaml.org,2002:" ? $ = "!!" + $.slice(18) : $ = "!<" + $ + ">", s.dump = $ + " " + s.dump;
      }
    }
    return !0;
  }
  function w(s, g) {
    const _ = [], T = [];
    x(s, _, T);
    const S = T.length;
    for (let E = 0; E < S; E += 1)
      g.duplicates.push(_[T[E]]);
    g.usedDuplicates = new Array(S);
  }
  function x(s, g, _) {
    if (s !== null && typeof s == "object") {
      const T = g.indexOf(s);
      if (T !== -1)
        _.indexOf(T) === -1 && _.push(T);
      else if (g.push(s), Array.isArray(s))
        for (let S = 0, E = s.length; S < E; S += 1)
          x(s[S], g, _);
      else {
        const S = Object.keys(s);
        for (let E = 0, y = S.length; E < y; E += 1)
          x(s[S[E]], g, _);
      }
    }
  }
  function k(s, g) {
    g = g || {};
    const _ = new Qe(g);
    _.noRefs || w(s, _);
    let T = s;
    return _.replacer && (T = _.replacer.call({ "": T }, "", T)), m(_, 0, T, !0, !0) ? _.dump + `
` : "";
  }
  return Sn.dump = k, Sn;
}
var yt;
function Ir() {
  if (yt) return V;
  yt = 1;
  const e = Cr(), t = Lr();
  function o(r, i) {
    return function() {
      throw new Error("Function yaml." + r + " is removed in js-yaml 4. Use yaml." + i + " instead, which is now safe by default.");
    };
  }
  return V.Type = K(), V.Schema = Vt(), V.FAILSAFE_SCHEMA = Wt(), V.JSON_SCHEMA = eo(), V.CORE_SCHEMA = no(), V.DEFAULT_SCHEMA = $n(), V.load = e.load, V.loadAll = e.loadAll, V.dump = t.dump, V.YAMLException = Ie(), V.types = {
    binary: ro(),
    float: Jt(),
    map: Ut(),
    null: Xt(),
    pairs: lo(),
    set: ao(),
    timestamp: to(),
    bool: Qt(),
    int: Zt(),
    merge: oo(),
    omap: io(),
    seq: Gt(),
    str: Kt()
  }, V.safeLoad = o("safeLoad", "load"), V.safeLoadAll = o("safeLoadAll", "loadAll"), V.safeDump = o("safeDump", "dump"), V;
}
var Pr = Ir();
const Nr = /* @__PURE__ */ Er(Pr), {
  Type: Nl,
  Schema: Ol,
  FAILSAFE_SCHEMA: Rl,
  JSON_SCHEMA: Or,
  CORE_SCHEMA: Dl,
  DEFAULT_SCHEMA: Fl,
  load: Rr,
  loadAll: $l,
  dump: ql,
  YAMLException: jl,
  types: Bl,
  safeLoad: Hl,
  safeLoadAll: zl,
  safeDump: Yl
} = Nr, Dr = /^([^#\s][^:\n]*?):(?:[ \t](.*))?$/, Fr = /^\d{4}-\d{2}-\d{2}$/, $r = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
function wt(e) {
  return e.startsWith(" ") || e.startsWith("	");
}
function xt(e) {
  return e.trimStart().startsWith("#");
}
function qr(e) {
  return e.includes(`\r
`) ? `\r
` : `
`;
}
function jr(e) {
  return typeof e == "boolean" ? "boolean" : typeof e == "number" ? "number" : Array.isArray(e) ? "list" : typeof e == "string" ? Fr.test(e) ? "date" : $r.test(e) ? "datetime" : "text" : "raw";
}
function vt(e, t) {
  for (let o = t; o < e.length; o++)
    if (e[o] === "#" && (o === 0 || e[o - 1] === " " || e[o - 1] === "	"))
      return e.slice(o);
}
function Br(e) {
  const t = e.search(/\S/), o = t >= 0 ? e[t] : "";
  if (o !== '"' && o !== "'") return vt(e, 0);
  const r = o;
  let i = t + 1;
  for (; i < e.length; i++) {
    const a = e[i];
    if (a === "\\" && r === '"') {
      i++;
      continue;
    }
    if (a === r) {
      if (r === "'" && e[i + 1] === "'") {
        i++;
        continue;
      }
      i++;
      break;
    }
  }
  return vt(e, i);
}
function Ve(e) {
  const t = qr(e), o = /\r?\n$/.test(e), r = e.length ? e.split(/\r?\n/) : [];
  r.length && r[r.length - 1] === "" && r.pop();
  let i = null, a = !1;
  try {
    const d = e.trim() ? Rr(e, { schema: Or }) : {};
    i = d && typeof d == "object" && !Array.isArray(d) ? d : null, i || (a = e.trim() !== "");
  } catch {
    a = !0;
  }
  const c = [];
  let l = 0;
  for (; l < r.length; ) {
    const d = r[l], u = Dr.exec(d);
    if (!u || wt(d) || xt(d)) {
      l++;
      continue;
    }
    const p = u[1].trim();
    let f = l + 1;
    for (; f < r.length && r[f].trim() !== "" && wt(r[f]); ) f++;
    const h = r.slice(l, f), b = h.join(t), v = i ? i[p] : void 0, C = a ? "raw" : jr(v), P = h.some((B) => xt(B)) || C === "raw" || h.length > 1 && C !== "list", q = Br(u[2] ?? "");
    c.push({
      key: p,
      lines: [l, f],
      raw: b,
      type: P ? "raw" : C,
      value: v,
      complex: P,
      trailingComment: q
    }), l = f;
  }
  return { entries: c, lines: r, eol: t, ok: !a, trailingNewline: o };
}
let Nn = null;
function Tt(e) {
  Nn = e;
}
const Hr = "app.textox.mkdext";
function pe(e, t) {
  if (!Nn) return t;
  const o = Nn(e);
  return !o || o === `${Hr}.${e}` ? t : o;
}
const so = [
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
], co = {
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
}, zr = {
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
}, Yr = /* @__PURE__ */ new Set([
  ...so,
  ...Object.keys(co)
]);
function uo(e) {
  const t = e.trim().toLowerCase();
  return co[t] ?? t;
}
function Vr(e) {
  return Yr.has(e.trim().toLowerCase());
}
function Kr(e) {
  return zr[uo(e)] ?? null;
}
function At(e, t) {
  if (Kr(e) !== "list") return t.type;
  if (t.type === "list" || !t.complex && t.type === "text") return "list";
  const o = t.value == null || t.value === "", r = !t.raw.includes(`
`) && t.trailingComment === void 0;
  return o && r && (t.type === "text" || t.type === "raw") ? "list" : t.type;
}
function Gr(e, t) {
  return e !== "list" || Array.isArray(t) ? t : t == null || t === "" ? [] : [String(t)];
}
const St = "http://www.w3.org/2000/svg", D = (e) => ({ tag: "path", attrs: { d: e } }), se = (e, t, o) => ({
  tag: "circle",
  attrs: { cx: String(e), cy: String(t), r: String(o) }
}), Et = (e, t, o, r, i) => ({
  tag: "rect",
  attrs: { x: String(e), y: String(t), width: String(o), height: String(r), rx: String(i) }
}), Ur = {
  title: [D("M4 7V4h16v3"), D("M9 20h6"), D("M12 4v16")],
  description: [D("M3 6h18"), D("M3 12h18"), D("M3 18h12")],
  summary: [D("M3 6h18"), D("M3 12h18"), D("M3 18h8")],
  tags: [
    D("M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"),
    se(7, 7, 1.2)
  ],
  categories: [
    D("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")
  ],
  status: [se(12, 12, 9), D("M8 12.5l2.5 2.5L16 9")],
  type: [D("M12 2 2 7l10 5 10-5z"), D("M2 17l10 5 10-5"), D("M2 12l10 5 10-5")],
  priority: [D("M5 21V4"), D("M5 5h13l-2 3.5L18 12H5")],
  date: [Et(3, 5, 18, 16, 2), D("M3 10h18M8 3v4M16 3v4")],
  created: [se(12, 12, 9), D("M12 7v5l3 2")],
  updated: [D("M21 12a9 9 0 1 1-2.6-6.4"), D("M21 4v6h-6")],
  author: [se(12, 8, 3.5), D("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5")],
  owner: [se(12, 8, 3.5), D("M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"), D("M18 5l1 1.6 1.8.4-1.4 1.4.3 1.8-1.7-.9-1.7.9.3-1.8L15 7l1.8-.4z")],
  audience: [se(9, 8, 3), D("M2 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"), se(17.5, 9, 2.2)],
  language: [
    se(12, 12, 9),
    D("M3 12h18"),
    D("M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9z")
  ],
  version: [D("M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z")],
  related: [
    D("M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"),
    D("M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1")
  ],
  keywords: [D("M4 9h16M4 15h16M10 3 8 21M16 3l-2 18")],
  project: [Et(3, 4, 8, 16, 1.5), D("M15 4h6v9h-6z")],
  aliases: [D("M7 7h11l-3-3"), D("M17 17H6l3 3")],
  slug: [D("M9 4 7 20M17 4l-2 16M4 9h16M3 15h16")],
  draft: [D("M4 20l4-1L19 8l-3-3L5 16z"), D("M14 6l3 3")]
}, Wr = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true"
};
function qn(e, t) {
  const o = document.createElementNS(St, "svg");
  o.setAttribute("class", e);
  for (const [r, i] of Object.entries(Wr)) o.setAttribute(r, i);
  for (const r of t) {
    const i = document.createElementNS(St, r.tag);
    for (const [a, c] of Object.entries(r.attrs)) i.setAttribute(a, c);
    o.appendChild(i);
  }
  return o;
}
function Xr(e) {
  return (Array.from(e.trim())[0] ?? "").toUpperCase();
}
function Qr(e) {
  const t = document.createElement("span");
  return t.className = "fm-ico fm-ico-letter", t.textContent = Xr(e), t.setAttribute("aria-hidden", "true"), t;
}
function En(e) {
  const t = Ur[uo(e)];
  return t ? qn("fm-ico", t) : Qr(e);
}
const Zr = {
  panel: [D("M16 18l6-6-6-6"), D("M8 6l-6 6 6 6")],
  source: [D("M3 5h18M3 12h18M3 19h18")]
};
function Jr(e) {
  return qn("fm-toggle-icon", Zr[e]);
}
const ei = [
  D("M3 6h18"),
  D("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"),
  D("M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
  D("M10 11v6"),
  D("M14 11v6")
];
function ni() {
  const e = qn("fm-delete-icon", ei);
  return e.setAttribute("width", "14"), e.setAttribute("height", "14"), e;
}
const Mt = 8;
function ti(e, t, o = so) {
  const r = [], i = /* @__PURE__ */ new Set([t]), a = (c) => {
    c !== "" && !i.has(c) && (i.add(c), r.push(c));
  };
  for (const c of e) a(c.key);
  for (const c of o) a(c);
  return r;
}
function oi(e, t) {
  const o = t.trim().toLowerCase();
  if (o === "") return [...e].slice(0, Mt);
  const r = [], i = [];
  for (const a of e) {
    const c = a.toLowerCase();
    c.startsWith(o) ? r.push(a) : c.includes(o) && i.push(a);
  }
  return [...r, ...i].slice(0, Mt);
}
function Ct(e, t) {
  let o = [], r = 0, i = !1, a = !1;
  const c = document.createElement("div");
  c.className = "fm-suggest", c.setAttribute("role", "listbox"), c.hidden = !0;
  const l = () => {
    i = !1, o = [], r = 0, c.hidden = !0, c.textContent = "", e.setAttribute("aria-expanded", "false");
  }, d = () => {
    const b = t.container.getBoundingClientRect(), v = e.getBoundingClientRect();
    c.style.left = `${v.left - b.left}px`, c.style.top = `${v.bottom - b.top + 2}px`, c.style.width = `${v.width}px`;
  }, u = () => {
    if (o.length === 0) {
      l();
      return;
    }
    const b = e.value.trim().toLowerCase();
    c.textContent = "", o.forEach((v, C) => {
      const A = document.createElement("div");
      A.className = C === r ? "fm-suggest-item is-active" : "fm-suggest-item", A.setAttribute("role", "option"), A.setAttribute("aria-selected", C === r ? "true" : "false");
      const P = b === "" ? -1 : v.toLowerCase().indexOf(b);
      if (P >= 0) {
        const q = document.createElement("mark");
        q.textContent = v.slice(P, P + b.length), A.append(
          document.createTextNode(v.slice(0, P)),
          q,
          document.createTextNode(v.slice(P + b.length))
        );
      } else
        A.textContent = v;
      A.addEventListener("mousedown", (q) => {
        q.preventDefault(), e.value = v, l(), t.onSubmit?.();
      }), c.appendChild(A);
    }), c.hidden = !1, i = !0, e.setAttribute("aria-expanded", "true"), d();
  }, p = () => {
    o = oi(t.candidates(), e.value), r = 0, a = !1, u();
  }, f = () => p(), h = (b) => {
    if (!(b.isComposing || b.keyCode === 229)) {
      if (b.key === "ArrowDown" || b.key === "ArrowUp") {
        if (!i || o.length === 0) return;
        if (b.preventDefault(), e.value.trim() === "" && !a) {
          a = !0, u();
          return;
        }
        a = !0;
        const v = b.key === "ArrowDown" ? 1 : o.length - 1;
        r = (r + v) % o.length, u();
        return;
      }
      if (b.key === "Enter") {
        b.preventDefault();
        const v = e.value.trim() !== "" || a;
        i && o.length > 0 && v && (e.value = o[r]), l(), t.onSubmit?.();
        return;
      }
      if (b.key === "Tab") {
        i && o.length > 0 && (b.preventDefault(), e.value = o[r]), l();
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
  return e.setAttribute("aria-autocomplete", "list"), e.setAttribute("aria-expanded", "false"), t.container.appendChild(c), e.addEventListener("input", f), e.addEventListener("keydown", h), {
    open: p,
    close: l,
    destroy() {
      e.removeEventListener("input", f), e.removeEventListener("keydown", h), e.removeAttribute("aria-autocomplete"), e.removeAttribute("aria-expanded"), c.remove(), i = !1, o = [], a = !1;
    }
  };
}
function jn(e, t) {
  if (t === "number") {
    if (e == null || e === "") return "";
    const o = Number(e);
    return Number.isFinite(o) ? String(o) : "";
  }
  return t === "boolean" ? e ? "true" : "false" : t === "date" || t === "datetime" ? String(e) : ii(String(e ?? ""));
}
function ri(e) {
  return !!(e === "" || e.trim() !== e || /[\x00-\x1f\x7f]/.test(e) || /[:#\[\]{}&*!|>'"%@`,]/.test(e) || /^[-?](\s|$)/.test(e) || /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(e) || /^(true|false|null|~|yes|no|on|off)$/i.test(e));
}
function ii(e) {
  return ri(e) ? `"${e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (o) => `\\x${o.charCodeAt(0).toString(16).padStart(2, "0")}`)}"` : e;
}
function po(e) {
  return `[${e.map((t) => jn(t, "text")).join(", ")}]`;
}
function li(e, t) {
  return e.map((o) => `${t}- ${jn(o, "text")}`);
}
function ai(e, t) {
  return e.entries.find((o) => o.key === t);
}
function si(e, t) {
  const { lines: o, eol: r } = e, i = o.slice(), a = (h, b, v) => {
    i.splice(h, b, ...v);
  }, c = (h) => {
    const b = h.join(r);
    return b === "" ? "" : b + (e.trailingNewline ? r : "");
  };
  if (t.kind === "add") {
    const h = Lt(t.value, t.type), b = `${t.key}:${h ? ` ${h}` : ""}`;
    return i.push(b), c(i);
  }
  const l = ai(e, t.key);
  if (!l) return null;
  const [d, u] = l.lines;
  if (t.kind === "rename") {
    const h = i[d], b = h.slice(h.indexOf(":"));
    return i[d] = `${t.nextKey}${b}`, c(i);
  }
  if (t.kind === "remove")
    return a(d, u - d, []), c(i);
  if (l.complex) return null;
  if (t.type === "list") {
    const h = Array.isArray(t.value) ? t.value : [];
    if (l.raw.split(r)[0].includes("["))
      i[d] = `${t.key}: ${po(h)}${l.trailingComment ? ` ${l.trailingComment}` : ""}`, u - d > 1 && a(d + 1, u - d - 1, []);
    else {
      const v = [`${t.key}:`, ...li(h, "  ")];
      l.trailingComment && (v[0] = `${t.key}: ${l.trailingComment}`), a(d, u - d, v);
    }
    return c(i);
  }
  if (u - d > 1) return null;
  const p = l.trailingComment ? ` ${l.trailingComment}` : "", f = Lt(t.value, t.type);
  return i[d] = `${t.key}:${f ? ` ${f}` : ""}${p}`, c(i);
}
function Lt(e, t) {
  return t === "list" ? po(Array.isArray(e) ? e : []) : jn(e, t);
}
let Ce = null;
function ci(e) {
  Ce = e;
}
function ui(e) {
  Ce === e && (Ce = null);
}
function di(e, t, o) {
  return new mi(e, t, o);
}
const pi = /^[^\s#:][^#:]*$/;
function It(e) {
  return e === e.trim() && e !== "" && pi.test(e);
}
function fi(e) {
  for (const t of [e, ...Array.from(e.querySelectorAll("*"))])
    t instanceof HTMLTextAreaElement ? t.readOnly = !0 : t instanceof HTMLInputElement ? t.type === "checkbox" ? t.disabled = !0 : t.readOnly = !0 : t instanceof HTMLButtonElement && (t.disabled = !0);
}
class mi {
  constructor(t, o, r) {
    this.view = o, this.getPos = r, this.node = t, this.dom = document.createElement("yaml-block"), this.deleteBtn = document.createElement("button"), this.deleteBtn.type = "button", this.deleteBtn.className = "fm-delete-block", this.deleteBtn.appendChild(ni());
    const i = pe("frontMatter.removeBlock", "Remove document properties");
    this.deleteBtn.title = i, this.deleteBtn.setAttribute("aria-label", i), this.deleteBtn.addEventListener("mousedown", (a) => a.preventDefault()), this.deleteBtn.addEventListener("click", () => this.removeBlock()), this.addBtn = document.createElement("button"), this.addBtn.type = "button", this.addBtn.className = "fm-add-btn", this.addBtn.textContent = `+ ${pe("frontMatter.addProperty", "Add property")}`, this.addBtn.addEventListener("mousedown", (a) => a.preventDefault()), this.addBtn.addEventListener("click", () => this.addPendingRow()), this.toggle = document.createElement("button"), this.toggle.type = "button", this.toggle.className = "fm-toggle", this.toggle.addEventListener("mousedown", (a) => a.preventDefault()), this.toggle.addEventListener("click", () => {
      br(this.mode === "panel" ? "source" : "panel");
    }), this.actions = document.createElement("div"), this.actions.className = "fm-actions", this.actions.setAttribute("contenteditable", "false"), this.actions.append(this.deleteBtn, this.addBtn, this.toggle), this.dom.appendChild(this.actions), this.panel = document.createElement("div"), this.panel.className = "fm-panel", this.panel.setAttribute("contenteditable", "false"), this.dom.appendChild(this.panel), this.source = document.createElement("div"), this.source.className = "fm-source", this.contentDOM = document.createElement("div"), this.contentDOM.className = "fm-source-body", this.source.appendChild(this.contentDOM), this.dom.appendChild(this.source), this.locked = this.readLocked(), typeof MutationObserver == "function" && (this.lockObserver = new MutationObserver(() => {
      const a = this.readLocked();
      a !== this.locked && (this.locked = a, this.render());
    }), this.lockObserver.observe(this.view.dom, {
      attributes: !0,
      attributeFilter: ["contenteditable"]
    })), this.mode = Yt(), this.unsubscribe = _r((a) => {
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
    const o = t.textContent !== this.node.textContent;
    return this.node = t, o && !this.silentUpdate ? this.render() : this.refreshSourceAttr(), !0;
  }
  stopEvent(t) {
    const o = t.target;
    return this.panel.contains(o) || this.actions.contains(o);
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
    this.dom.setAttribute("data-locked", this.locked ? "true" : "false"), this.addBtn.disabled = this.locked, this.toggle.disabled = this.locked, this.deleteBtn.disabled = this.locked, this.addBtn.style.display = t ? "" : "none", this.toggle.textContent = "", this.toggle.appendChild(Jr(t ? "panel" : "source")), this.toggle.setAttribute(
      "title",
      t ? pe("frontMatter.toggleToSource", "View source") : pe("frontMatter.toggleToPanel", "View properties")
    ), this.panel.style.display = t ? "" : "none", this.source.style.display = t ? "none" : "", t && this.renderPanel();
  }
  /** 删除整个 front matter 节点；跳过原子叶落笔，文档删空时补一个空段落。 */
  removeBlock() {
    if (this.readLocked()) return;
    const t = this.getPos();
    if (t == null) return;
    const o = this.node.type.schema.nodes.paragraph, r = this.view.state.tr.delete(t, t + this.node.nodeSize), i = Hn.findFrom(r.doc.resolve(t), 1, !0);
    if (i)
      r.setSelection(i);
    else {
      const a = r.doc.content.size;
      r.insert(a, o.create()), r.setSelection(z.create(r.doc, a + 1));
    }
    r.scrollIntoView(), this.view.dispatch(r), this.view.focus();
  }
  /** 面板最后一个可编辑输入行（单值输入 / tag）按 Enter：提交后把光标送到属性块下方的正文。 */
  exitBlock() {
    if (this.readLocked()) return;
    const t = this.getPos();
    if (t == null) return;
    const o = t + this.node.nodeSize, r = this.view.state.tr, i = Hn.findFrom(r.doc.resolve(o), 1, !0);
    if (i)
      r.setSelection(i);
    else {
      const a = r.doc.content.size;
      r.insert(a, this.node.type.schema.nodes.paragraph.create()), r.setSelection(z.create(r.doc, a + 1));
    }
    r.scrollIntoView(), this.view.dispatch(r), this.view.focus();
  }
  /** 消费一次性标记：新建的空块在 DOM 挂载后展开待输入行（联想浮层按真实布局定位）。 */
  openPendingRowIfRequested() {
    if (Ce !== this.view || (Ce = null, this.mode !== "panel" || this.readLocked() || this.node.textContent !== "")) return;
    const t = () => {
      !this.dom.isConnected || this.mode !== "panel" || this.readLocked() || this.addPendingRow();
    };
    typeof queueMicrotask == "function" ? queueMicrotask(t) : setTimeout(t, 0);
  }
  renderPanel() {
    const t = Ve(this.node.textContent);
    if (this.panel.textContent = "", !t.ok) {
      const a = document.createElement("div");
      a.className = "fm-panel-warn", a.textContent = pe("frontMatter.invalidYaml", "Invalid YAML — switch to source to edit"), this.panel.appendChild(a);
      return;
    }
    const o = document.createElement("div");
    o.className = "fm-list";
    const r = t.entries;
    let i = -1;
    if (r.forEach((a, c) => {
      const l = At(a.key, a);
      l !== "raw" && l !== "boolean" && (i = c);
    }), r.forEach((a, c) => {
      o.appendChild(this.buildRow(a, c === i));
    }), this.panel.appendChild(o), this.pendingListFocus !== null) {
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
    const o = Ve(this.node.textContent), r = o.ok ? o.entries : [], i = ti(r, t);
    if (t !== "") return i;
    const a = new Set(r.map((c) => c.key));
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
    const o = document.createElement("div");
    o.className = "fm-row fm-add-row", o.appendChild(En(""));
    const r = document.createElement("div");
    r.className = "fm-key";
    const i = document.createElement("input");
    i.className = "fm-key-edit", i.placeholder = pe("frontMatter.addPropertyKeyPrompt", "Property name"), i.addEventListener("input", () => {
      o.firstChild && o.replaceChild(En(i.value), o.firstChild);
    });
    let a = null;
    const c = (u = !1) => {
      a?.destroy(), a = null;
      const p = o.contains(document.activeElement);
      o.remove(), u && p && this.view.focus();
    }, l = () => {
      if (!o.isConnected) return;
      const u = i === document.activeElement;
      a?.destroy(), a = null;
      const p = i.value;
      if (p && It(p) && this.commitEdit({ kind: "add", key: p, value: "", type: "text" })) {
        u && queueMicrotask(() => this.focusValueOf(p));
        return;
      }
      c(u);
    };
    a = Ct(i, {
      container: this.panel,
      candidates: () => this.suggestKeys(""),
      onSubmit: l,
      onCancel: () => c(!0)
    }), i.addEventListener("blur", l), r.appendChild(i), o.appendChild(r);
    const d = document.createElement("div");
    d.className = "fm-val", o.appendChild(d), t.appendChild(o), i.focus(), a?.open();
  }
  /** 提交新增行后把焦点交给该 key 的值控件（防御：写回后若出现同名行，取最后一行）。 */
  focusValueOf(t) {
    const o = Array.from(this.panel.querySelectorAll(".fm-row"));
    for (let r = o.length - 1; r >= 0; r--) {
      const i = o[r];
      if (i.querySelector(".fm-key-label")?.textContent !== t) continue;
      const a = i.querySelector(
        ".fm-val .fm-input, .fm-chips .fm-add-input, .fm-checkbox"
      );
      a ? a.focus() : this.view.focus();
      return;
    }
  }
  /** 单行：类型图标 + 键名单元（默认文本，点击编辑）+ 值控件 + 删除按钮。 */
  buildRow(t, o) {
    const r = document.createElement("div");
    r.className = "fm-row";
    const i = this.locked, a = En(t.key), c = i || Vr(t.key), l = document.createElement("div");
    l.className = c ? "fm-key fm-key-locked" : "fm-key", c || (l.tabIndex = 0);
    let d = null;
    const u = () => {
      d?.destroy(), d = null, l.textContent = "";
      const A = document.createElement("span");
      A.className = "fm-key-label", A.textContent = t.key, l.appendChild(A);
    }, p = () => {
      d?.destroy(), d = null;
      const A = l.querySelector(".fm-key-edit");
      if (!A) return;
      const P = A.value;
      if (!It(P) || P === t.key) {
        u();
        return;
      }
      this.commitEdit({ kind: "rename", key: t.key, nextKey: P }) || u();
    }, f = () => {
      if (l.querySelector(".fm-key-edit")) return;
      const A = document.createElement("input");
      A.className = "fm-key-edit", A.value = t.key, d = Ct(A, {
        container: this.panel,
        candidates: () => this.suggestKeys(t.key),
        onSubmit: p,
        onCancel: u
      }), A.addEventListener("change", p), A.addEventListener("blur", () => {
        l.contains(A) && A.value === t.key && u();
      }), l.textContent = "", l.appendChild(A), A.focus(), A.select();
    };
    u(), c || (l.addEventListener("mousedown", (A) => {
      A.target.classList.contains("fm-key-edit") || A.preventDefault();
    }), l.addEventListener("click", f), l.addEventListener("focus", f));
    const h = At(t.key, t), b = {
      ...t,
      type: h,
      // 已解析为可编辑类型时清掉 complex（空值曾被推断为 raw）；raw 保持只读降级。
      complex: h === "raw",
      value: Gr(h, t.value)
    }, v = document.createElement("div");
    v.className = "fm-val";
    const C = Sr(b, {
      commit: (A) => {
        const P = { kind: "setValue", key: t.key, value: A, type: h };
        if (h === "list") {
          this.pendingListFocus = t.key, this.commitEdit(P);
          return;
        }
        this.commitValueSilent(P);
      },
      // 最后一个可编辑输入行：单值输入 Enter 提交后跳出；列表 tag 空输入 Enter 跳出。
      onEnter: o && h !== "list" ? () => this.exitBlock() : void 0,
      onEmptyEnter: o && h === "list" ? () => this.exitBlock() : void 0
    });
    if (i && fi(C), v.appendChild(C), r.append(a, l, v), !i) {
      const A = document.createElement("button");
      A.type = "button", A.className = "fm-remove", A.textContent = "×", A.title = pe("frontMatter.removeProperty", "Remove property"), A.addEventListener("mousedown", (P) => P.preventDefault()), A.addEventListener("click", () => void this.commitEdit({ kind: "remove", key: t.key })), r.appendChild(A);
    }
    return r;
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
    const o = this.getPos();
    if (o == null) return !1;
    const r = Ve(this.node.textContent), i = si(r, t);
    if (i == null || !Ve(i).ok) return !1;
    const a = o + 1, c = o + this.node.nodeSize - 1, l = this.view.state.tr.replaceWith(a, c, i ? this.node.type.schema.text(i) : []);
    return this.view.dispatch(l), !0;
  }
}
const hi = (e, t, o, r) => {
  if (t !== 0 || e.tShift[t] !== 0) return !1;
  const i = e.bMarks[t];
  if (e.eMarks[t] - i !== 3 || e.src.slice(i, i + 3) !== "---") return !1;
  let c = -1;
  for (let u = t + 1; u <= o; u++) {
    const p = e.bMarks[u], f = e.eMarks[u];
    if (e.tShift[u] === 0 && f - p === 3 && e.src.slice(p, f) === "---") {
      c = u;
      break;
    }
  }
  if (c === -1) return !1;
  if (r) return !0;
  const l = e.src.slice(e.bMarks[t + 1], e.bMarks[c]).replace(/\n$/, ""), d = e.push("front_matter", "div", 0);
  return d.content = l, d.markup = "---", d.block = !0, d.map = [t, c + 1], e.line = c + 1, !0;
}, gi = {
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
    front_matter: (e, t, o) => {
      const r = t.content, i = r ? [o.text(r)] : [];
      e.push(o.nodes.front_matter.createChecked({}, i));
    }
  },
  blockHandlers: {
    front_matter: (e, t) => {
      e.write(`---
`), e.tick("inner");
      for (const o of t.textContent)
        e.tick("inner"), o === `
` ? (e.out += `
`, e.delim && (e.out += e.delim)) : e.out += o, e.advance(1);
      e.tick("inner"), e.write(`
---`), e.closeBlock(t);
    }
  },
  plugins: () => [
    new W({
      props: {
        nodeViews: {
          front_matter: (e, t, o) => di(e, t, o)
        }
      }
    })
  ],
  keymap: (e) => ({
    Enter: (t, o, r) => {
      const i = t.selection;
      if (!i.empty) return !1;
      const a = i.$from, c = e.nodes.front_matter;
      if (a.parent.type.name === "paragraph" && a.depth === 1 && a.index(0) === 0 && a.parent.textContent === "---") {
        if (o) {
          const d = c.create(), u = a.before(), p = a.after(), f = t.tr;
          if (f.replaceWith(u, p, d), Yt() === "panel") {
            const h = u + d.nodeSize;
            h > f.doc.content.size - 2 && f.insert(h, e.nodes.paragraph.create()), f.setSelection(z.create(f.doc, h + 1));
          } else {
            const h = u + 1;
            f.setSelection(z.create(f.doc, h));
          }
          r && ci(r);
          try {
            o(f);
          } finally {
            r && ui(r);
          }
        }
        return !0;
      }
      if (a.parent.type === c) {
        const d = a.parent.textContent;
        if (a.parentOffset === d.length && d.endsWith(`
`)) {
          if (o) {
            const p = t.tr, f = a.after();
            p.delete(f - 2, f - 1);
            const h = f - 1, b = p.doc.content.size;
            if (h >= b) {
              const v = e.nodes.paragraph.create();
              p.insert(h, v);
            }
            p.setSelection(z.create(p.doc, h + 1)), o(p);
          }
          return !0;
        }
        return !1;
      }
      return !1;
    },
    ArrowDown: (t, o) => {
      const r = t.selection;
      if (!r.empty) return !1;
      const i = r.$from, a = t.schema.nodes.front_matter;
      if (i.parent.type !== a || i.parent.textContent.slice(i.parentOffset).includes(`
`)) return !1;
      if (o) {
        const d = t.tr, u = i.after(), p = d.doc.content.size;
        if (u >= p) {
          const f = t.schema.nodes.paragraph.create();
          d.insert(u, f);
        }
        d.setSelection(z.create(d.doc, u + 1)), o(d);
      }
      return !0;
    }
  })
}, _i = {
  id: "frontMatter",
  register: ({ editor: e, settings: t, t: o }) => (Wn({
    read: () => t.get(on),
    write: (i) => t.set(on, i),
    subscribe: (i) => t.onDidChange(
      (a) => i(a.values[on] === "source" ? "source" : "panel")
    ).dispose
  }), Tt((i) => o(i)), [
    e.registerSyntaxFeature(gi),
    {
      dispose() {
        Wn(null), Tt(null);
      }
    }
  ])
}, Mn = "headingTypeIndicator_focus";
function bi(e) {
  const t = new Ue("headingTypeIndicator");
  let o = !1;
  return new W({
    key: t,
    state: {
      init: () => Q.empty,
      apply: (r, i, a, c) => {
        const l = r.getMeta(Mn);
        return l !== void 0 && (o = l), o ? ki(c) : Q.empty;
      }
    },
    props: {
      decorations(r) {
        return t.getState(r);
      },
      handleDOMEvents: {
        focus: (r) => (o || r.dispatch(r.state.tr.setMeta(Mn, !0)), !1),
        blur: (r) => (o && r.dispatch(r.state.tr.setMeta(Mn, !1)), !1)
      }
    }
  });
}
function Pt(e) {
  for (let t = e.depth; t >= 0; t--) {
    const o = e.node(t);
    if (o.type.name === "heading")
      return {
        level: o.attrs.level,
        from: e.before(t),
        to: e.before(t) + o.nodeSize
      };
  }
  return null;
}
function ki(e) {
  const { $from: t, $to: o } = e.selection, r = Pt(t) ?? Pt(o);
  if (!r || r.level < 1 || r.level > 6)
    return Q.empty;
  const i = ne.node(r.from, r.to, {
    class: "heading-type-indicator",
    "data-label": `H${r.level}`
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
], Ti = vi[0], Cn = "texto-plugin-highlight-color";
function Ai(e) {
  const t = `color-mix(in oklab, ${e} 35%, transparent)`, o = `color-mix(in oklab, ${e} 50%, transparent)`;
  return `:root{--highlight-color:${t}}:root.dark{--highlight-color:${o}}`;
}
function Si(e) {
  const t = typeof e == "string" && /^#[0-9a-fA-F]{6}$/.test(e) ? e : Ti;
  let o = document.getElementById(Cn);
  return o || (o = document.createElement("style"), o.id = Cn, document.head.appendChild(o)), o.textContent = Ai(t), {
    dispose() {
      document.getElementById(Cn)?.remove();
    }
  };
}
function Ei(e) {
  function t(r, i) {
    const a = r.pos, c = r.src.charCodeAt(a);
    if (i || c !== 61)
      return !1;
    const l = r.scanDelims(r.pos, !0);
    let d = l.length;
    const u = String.fromCharCode(c);
    if (d < 2)
      return !1;
    if (d % 2) {
      const p = r.push("text", "", 0);
      p.content = u, d--;
    }
    for (let p = 0; p < d; p += 2) {
      const f = r.push("text", "", 0);
      f.content = u + u, !(!l.can_open && !l.can_close) && r.delimiters.push({
        marker: c,
        length: 0,
        // disable "rule of 3" length checks meant for emphasis
        jump: p / 2,
        // 1 delimiter = 2 characters
        token: r.tokens.length - 1,
        end: -1,
        open: l.can_open,
        close: l.can_close
      });
    }
    return r.pos += l.length, !0;
  }
  function o(r, i) {
    const a = [], c = i.length;
    for (let l = 0; l < c; l++) {
      const d = i[l];
      if (d.marker !== 61 || d.end === -1)
        continue;
      const u = i[d.end], p = r.tokens[d.token];
      p.type = "mark_open", p.tag = "mark", p.nesting = 1, p.markup = "==", p.content = "";
      const f = r.tokens[u.token];
      f.type = "mark_close", f.tag = "mark", f.nesting = -1, f.markup = "==", f.content = "", r.tokens[u.token - 1].type === "text" && r.tokens[u.token - 1].content === "=" && a.push(u.token - 1);
    }
    for (; a.length; ) {
      const l = a.pop();
      let d = l + 1;
      for (; d < r.tokens.length && r.tokens[d].type === "mark_close"; )
        d++;
      if (d--, l !== d) {
        const u = r.tokens[d];
        r.tokens[d] = r.tokens[l], r.tokens[l] = u;
      }
    }
  }
  e.inline.ruler.before("emphasis", "mark", t), e.inline.ruler2.before("emphasis", "mark", function(r) {
    let i;
    const a = r.tokens_meta, c = (r.tokens_meta || []).length;
    for (o(r, r.delimiters), i = 0; i < c; i++)
      a[i] && a[i].delimiters && o(r, a[i].delimiters);
  });
}
const Mi = {
  name: "highlight",
  marks: {
    highlight: {
      parseDOM: [{ tag: "mark" }],
      toDOM: () => ["mark", 0]
    }
  },
  mdItPlugins: [(e) => e.use(Ei)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike 的 s_open / s_close 同构，缺了会让回退路径丢掉 `==` 字面。
  parserTokens: {
    mark_open: (e, t, o) => {
      e.addText(t.markup), e.openMark(o.marks.highlight.create());
    },
    mark_close: (e, t, o) => {
      e.closeMarkType(o.marks.highlight), e.addText(t.markup);
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
    extRanges: (e) => Me(e, "highlight", 2)
  }
}, Ci = {
  id: "highlight",
  register: ({ editor: e, settings: t }) => [
    e.registerSyntaxFeature(Mi),
    e.registerFormatToolbarItem(xi),
    // 颜色样式表随特性一起释放：关闭高亮（或改色触发重装）时先移除再重建
    Si(t.get("highlightColor"))
  ]
}, On = /* @__PURE__ */ new Set();
function Li(e) {
  return On.add(e), () => On.delete(e);
}
function Ii() {
  for (const e of On) e();
}
const Pi = /* @__PURE__ */ new Set([
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
function fo(e) {
  if (/^\s{0,3}<!--$/.test(e)) return { tag: "!" };
  const t = e.match(/^\s{0,3}<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)>?$/);
  if (!t || t[1] === "/") return null;
  const o = (t[2] ?? "").toLowerCase(), r = Ni.has(o);
  return !Pi.has(o) && !r || !e.trimEnd().endsWith(">") && !r ? null : { tag: o };
}
const mo = /* @__PURE__ */ new Set([
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
function Oi(e) {
  const t = {}, o = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let r;
  for (; r = o.exec(e); ) {
    const i = r[2] ?? r[3] ?? r[4] ?? "";
    i && (t[r[1]] = i);
  }
  return t;
}
function Nt(e, t) {
  const o = [];
  let r = 0;
  for (; r < e.length; ) {
    if (t[r] || e[r] !== "<") {
      r++;
      continue;
    }
    const i = e[r + 1];
    if (!i || i === "/" || i === "!") {
      r++;
      continue;
    }
    const a = r + 1;
    let c = a;
    for (; c < e.length && /[a-zA-Z]/.test(e[c]); ) c++;
    if (c === a) {
      r++;
      continue;
    }
    const l = e.slice(a, c).toLowerCase();
    if (!mo.has(l)) {
      r++;
      continue;
    }
    const d = c;
    let u = -1, p = !1;
    for (let R = d; R < e.length; R++) {
      if (t[R]) {
        p = !0;
        break;
      }
      if (e[R] === ">") {
        u = R + 1;
        break;
      }
    }
    if (p || u === -1) {
      r = u > 0 ? u : c;
      continue;
    }
    for (let R = r; R < u; R++)
      if (t[R]) {
        p = !0;
        break;
      }
    if (p) {
      r = u;
      continue;
    }
    const f = e.slice(d, u - 1).trim(), h = Oi(f), b = `</${l}>`;
    let v = -1;
    for (let R = u; R < e.length; R++)
      if (!t[R] && e.startsWith(b, R)) {
        v = R;
        break;
      }
    if (v === -1) {
      r = u;
      continue;
    }
    const C = v + b.length;
    for (let R = v; R < C; R++)
      if (t[R]) {
        p = !0;
        break;
      }
    if (p) {
      r = C;
      continue;
    }
    const A = u, P = v;
    if (A >= P) {
      r = C;
      continue;
    }
    Ge(t, r, u), Ge(t, v, C);
    const q = u - r, B = C - v;
    o.push({
      type: "html_inline",
      from: A,
      to: P,
      openFrom: r,
      openTo: u,
      closeFrom: v,
      closeTo: C,
      attrs: { tag: l, htmlAttrs: h, openLen: q, closeLen: B }
    }), r = C;
  }
  return o;
}
function Ri(e) {
  return _o({
    match: (t) => {
      const o = fo(t);
      return o ? { data: o, prefixLen: t.match(/^\s*/)?.[0].length ?? 0 } : null;
    },
    draftClass: () => "html-block-draft",
    commit: (t, o, r, i) => {
      const a = i.tag === "!" ? "<!--" : r.textContent.trim(), c = i.tag === "!" ? "-->" : `</${i.tag}>`, l = e.nodes.html_block.create(
        null,
        e.text(a + `
` + c)
      );
      t.replaceWith(o, o + r.nodeSize, l);
    }
  });
}
function Di() {
  return new W({
    props: {
      nodeViews: {
        html_block: (e, t, o) => {
          const r = document.createElement("html-block"), i = document.createElement("div");
          i.className = "html-block-code", r.setAttribute("data-export", "html"), i.setAttribute("data-export-source", ""), r.appendChild(i);
          const a = document.createElement("div");
          a.className = "html-block-render", a.contentEditable = "false", a.style.display = "none", r.appendChild(a);
          let c = null, l = !1, d = e;
          return Promise.resolve().then(() => Ml).then(({ createHtmlBlockView: u }) => {
            l || (c = u({ dom: r, contentDOM: i, renderContainer: a, view: t, getPos: o, node: d }), c.update(d));
          }).catch(() => {
          }), {
            dom: r,
            contentDOM: i,
            update(u) {
              return d = u, c ? c.update(u) : !0;
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
  const e = new Ue("htmlBlockSelectionWatcher");
  return new W({
    key: e,
    view: () => ({
      update: (t, o) => {
        const r = o.selection, i = t.state.selection;
        (r.from !== i.from || r.to !== i.to) && Ii();
      }
    })
  });
}
const $i = {
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
      for (const o of t.textContent)
        e.tick("inner"), o === `
` ? (e.out += `
`, e.delim && (e.out += e.delim)) : e.out += o, e.advance(1);
      e.tick("inner"), e.closeBlock(t);
    }
  },
  plugins: (e) => [
    Ri(e).plugin,
    Di(),
    Fi()
  ],
  keymap: (e) => ({
    Enter: (t, o) => {
      const r = t.selection;
      if (!r.empty) return !1;
      const i = r.$from, a = i.parent;
      if (a.type.name !== "paragraph") return !1;
      const c = fo(a.textContent);
      if (!c) return !1;
      if (o) {
        const l = c.tag === "!" ? "<!--" : a.textContent.trim(), d = c.tag === "!" ? "-->" : `</${c.tag}>`, u = i.before(), p = e.nodes.html_block.create(null, e.text(l + `
` + d)), f = t.tr.replaceWith(u, u + a.nodeSize, p);
        f.setSelection(z.create(f.doc, u + 1 + l.length + 1)), o(f);
      }
      return !0;
    },
    Backspace: (t, o) => {
      const r = t.selection;
      if (!r.empty) return !1;
      const i = r.$from;
      if (i.parent.type.name !== "html_block" || i.parent.content.size > 0) return !1;
      if (o) {
        const a = i.before(), c = i.parent.nodeSize, l = t.tr.delete(a, a + c);
        if (l.doc.content.size === 0) {
          const d = e.nodes.paragraph.createAndFill();
          d && l.insert(0, d);
        }
        o(l);
      }
      return !0;
    },
    ArrowDown: (t, o) => {
      const r = t.selection;
      if (!r.empty) return !1;
      const i = r.$from, a = t.schema.nodes.html_block;
      if (i.parent.type === a) {
        if (i.parent.textContent.slice(i.parentOffset).includes(`
`)) return !1;
        if (o) {
          const f = t.tr, h = i.after(), b = f.doc.content.size;
          if (h >= b) {
            const v = t.schema.nodes.paragraph.create();
            f.insert(h, v);
          }
          f.setSelection(z.create(f.doc, h + 1)), o(f);
        }
        return !0;
      }
      if (!i.parent.isTextblock || i.parent.textContent.slice(i.parentOffset).includes(`
`)) return !1;
      const d = t.doc.nodeAt(i.after());
      return !d || d.type !== a || d.textContent.trim() === "" ? !1 : (o && o(t.tr.setSelection(z.create(t.tr.doc, i.after() + 1))), !0);
    },
    ArrowUp: (t, o) => {
      const r = t.selection;
      if (!r.empty) return !1;
      const i = r.$from, a = t.schema.nodes.html_block;
      if (!i.parent.isTextblock || i.parent.textContent.slice(0, i.parentOffset).includes(`
`)) return !1;
      const u = t.doc.resolve(i.before()).nodeBefore;
      return !u || u.type !== a || u.textContent.trim() === "" ? !1 : (o && o(t.tr.setSelection(z.create(t.tr.doc, i.before() - 1))), !0);
    }
  }),
  parserTokens: {
    html_block: (e, t, o) => {
      const r = t.content.replace(/\n$/, ""), i = r ? [o.text(r)] : [];
      e.push(o.nodes.html_block.create(null, i));
    }
  }
}, Ot = /<!--([\s\S]*?)-->/g;
function qi(e, t) {
  const o = [];
  Ot.lastIndex = 0;
  let r;
  for (; r = Ot.exec(e); ) {
    const i = r.index, a = i + r[0].length;
    let c = !1;
    for (let l = i; l < a; l++)
      if (t[l]) {
        c = !0;
        break;
      }
    c || (Ge(t, i, a), o.push({
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
  return o;
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
    derive: (e) => qi(e.text, e.consumed),
    markNames: ["html_comment"],
    extRanges: (e) => {
      const t = [], o = e.type.schema.marks.html_comment;
      if (!o) return t;
      let r = -1, i = 0;
      const a = (c) => {
        r >= 0 && t.push([r, c]), r = -1;
      };
      return e.forEach((c) => {
        c.isText && (c.marks.some((d) => d.type === o) ? r < 0 && (r = i) : a(i)), i += c.nodeSize;
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
          const t = e, o = t.tagName.toLowerCase();
          if (!mo.has(o)) return !1;
          const r = {};
          for (const i of t.attributes)
            i.name.startsWith("data-") || (r[i.name] = i.value);
          return { tag: o, htmlAttrs: r, openLen: 0, closeLen: 0 };
        }
      }],
      toDOM: (e) => {
        const { tag: t, htmlAttrs: o } = e.attrs;
        return [t, o, 0];
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
      const t = [], o = e.type.schema.marks.html_inline;
      if (!o) return t;
      let r = -1, i = 0, a = 0, c = 0;
      const l = (d) => {
        r >= 0 && t.push([r - i, d + a]), r = -1;
      };
      return e.forEach((d) => {
        if (d.isText) {
          const u = d.marks.find((p) => p.type === o);
          if (u && r < 0) {
            r = c;
            const p = u.attrs;
            i = p.openLen ?? 0, a = p.closeLen ?? 0;
          } else u || l(c);
        }
        c += d.nodeSize;
      }), l(c), t;
    }
  },
  parserPostProcess: (e) => {
    const t = e.type.schema.marks.html_inline;
    if (!t) return e;
    const o = new yo(e);
    let r = !1;
    return e.descendants((i, a) => {
      if (!i.isTextblock || i.type.name === "code_block") return !0;
      const c = i.textContent, l = Nt(c, new Uint8Array(c.length));
      if (l.length === 0) return !0;
      const d = a + 1;
      for (const u of l)
        u.type === "html_inline" && (o.addMark(d + u.from, d + u.to, t.create(u.attrs)), r = !0);
      return !1;
    }), r ? o.doc : e;
  }
}, Hi = {
  name: "html:md-config",
  mdItPlugins: [
    (e) => {
      e.set({ html: !0 }), e.inline.ruler.disable(["html_inline"]);
    }
  ]
}, zi = {
  id: "html",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(Hi),
    e.registerSyntaxFeature($i),
    e.registerSyntaxFeature(Bi),
    e.registerSyntaxFeature(ji)
  ]
}, Yi = ["latex", "math"], Vi = {
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
}, Ki = [["path", "M18 7V4H6l6 8-6 8h12v-3"]], Gi = {
  // 裸 slug：宿主按 id 去重，且须与原生菜单项 / 快捷键 / 命令分发的 action id 一致。
  id: "math_block",
  keyword: "math",
  labelKey: "math.mathBlock",
  descriptionKey: "math.mathBlockDesc",
  icon: Ki,
  defaultShortcut: "Cmd+Shift+M",
  category: "paragraph",
  order: 3,
  insert(e) {
    const o = e.state.schema.nodes.code_block;
    if (!o) return;
    const { $from: r } = e.state.selection, i = e.state.tr.replaceWith(
      r.before(),
      r.after(),
      o.create({ lang: "latex" })
    );
    e.dispatch(i), e.focus();
  }
};
function Ui(e) {
  const t = document.createElement("div");
  t.className = "math-preview";
  let o = 0;
  return {
    dom: t,
    update(r, i) {
      const a = ++o, c = r.textContent;
      if (!c.trim()) {
        t.innerHTML = '<div class="cb-render-empty">Empty formula</div>';
        return;
      }
      t.innerHTML = '<div class="cb-render-loading">Rendering...</div>', $t(c, {
        mode: "display",
        decorate: (l) => {
          l.style.maxWidth = "100%", l.style.height = "auto";
        }
      }).then((l) => {
        a === o && (t.innerHTML = `<div class="math-svg-container">${l}</div>`);
      }).catch((l) => {
        a === o && i.onError(l?.message ?? String(l));
      });
    },
    destroy() {
      o += 1;
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
function Wi({
  text: e,
  pos: t,
  token: o
}) {
  const r = Bn(o.markup);
  if (!r) return null;
  const i = o.content, a = t, c = a + o.markup.length;
  if (!e.startsWith(o.markup, a) || !e.startsWith(i, c)) return null;
  const l = c + i.length;
  if (!e.startsWith(r.close, l)) return null;
  const d = l + r.close.length;
  let u = c, p = l;
  for (; u < p && /\s/.test(e[u]); ) u++;
  for (; p > u && /\s/.test(e[p - 1]); ) p--;
  const f = e.slice(u, p), h = {
    type: "inline_math",
    from: u,
    to: p,
    openFrom: a,
    openTo: c,
    closeFrom: l,
    closeTo: d,
    attrs: { latex: f },
    opaque: !0,
    delimRanges: [
      { from: a, to: c, ...r.openClass ? { className: r.openClass } : {} },
      { from: u, to: p, softInside: !0 },
      { from: l, to: d, ...r.closeClass ? { className: r.closeClass } : {} }
    ]
  };
  return f && (h.widgetDecorations = [
    { pos: u, when: "outside", kind: "math-render", attrs: { latex: f }, side: -1 }
  ]), h;
}
function Xi(e, t, o) {
  if (o.type !== "math_inline") return null;
  const r = Bn(o.markup);
  if (!r || !e.startsWith(o.markup, t)) return null;
  const i = t + o.markup.length;
  if (!e.startsWith(o.content, i)) return null;
  const a = i + o.content.length;
  return e.startsWith(r.close, a) ? a + r.close.length - t : null;
}
function Qi(e) {
  const t = [];
  for (const o of e.tokens) {
    if (o.token.type !== "math_inline" || !o.exact) continue;
    const r = Wi({
      text: e.text,
      pos: o.pos,
      token: o.token
    });
    r && t.push(r);
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
    attributeChangedCallback(t, o, r) {
      o !== r && t === "data-formula" && r && this.removeAttribute("data-rendered");
    }
  }
);
const Dt = /* @__PURE__ */ new Map(), Zi = "v1";
let Ke = null;
function Ft() {
  return Ke || (Ke = new IntersectionObserver(
    (e) => {
      e.forEach((t) => {
        if (t.isIntersecting) {
          const o = t.target, r = o.getAttribute("data-formula");
          r && !o.hasAttribute("data-rendered") && (o.setAttribute("data-rendered", "true"), Ji(r).then((i) => {
            i && o.isConnected ? o.innerHTML = i : o.isConnected && (o.textContent = r);
          })), Ke?.unobserve(o);
        }
      });
    },
    { root: null, rootMargin: "100px", threshold: 0 }
  )), Ke;
}
async function Ji(e) {
  const t = `${Zi}:${e}`, o = Dt.get(t);
  if (o) return o;
  try {
    const r = await $t(e, {
      mode: "inline",
      decorate: (i) => {
        const a = i.getAttribute("viewBox");
        (a ? a.split(" ").map(Number).filter((l) => !Number.isNaN(l)) : []).length !== 4 && i.setAttribute("viewBox", "0 -700 1000 1400"), i.style.pointerEvents = "none";
      }
    });
    return Dt.set(t, r), r;
  } catch (r) {
    return console.error("Math render error:", r), null;
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
function ho(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function j(e, t) {
  const o = j.mergeDelimiters(t && t.delimiters), r = t && t.outerSpace || !1, i = t && t.katexOptions || {};
  i.throwOnError = i.throwOnError || !1, i.macros = i.macros || t && t.macros, j.katex || (t && typeof t.engine == "object" ? j.katex = t.engine : j.katex = { renderToString() {
    return "No math renderer found.";
  } });
  for (const a of o.inline)
    r && "outerSpace" in a && (a.outerSpace = !0), e.inline.ruler.before("escape", a.name, j.inline(a)), e.renderer.rules[a.name] = (c, l) => a.tmpl.replace(/\$1/, j.render(c[l].content, !!a.displayMode, i));
  for (const a of o.block)
    e.block.ruler.before("fence", a.name, j.block(a)), e.renderer.rules[a.name] = (c, l) => a.tmpl.replace(/\$2/, ho(c[l].info)).replace(/\$1/, j.render(c[l].content, !0, i));
}
j.mergeDelimiters = function(e) {
  const t = Array.isArray(e) ? e : typeof e == "string" ? [e] : ["dollars"], o = { inline: [], block: [] };
  for (const r of t)
    r in j.rules && (o.inline.push(...j.rules[r].inline), o.block.push(...j.rules[r].block));
  return o;
};
j.inline = (e) => function(t, o) {
  const r = t.pos, i = t.src, c = i.startsWith(e.tag, e.rex.lastIndex = r) && (!e.pre || e.pre(i, e.outerSpace, r)) && e.rex.exec(i), l = !!c && r < e.rex.lastIndex && (!e.post || e.post(i, e.outerSpace, e.rex.lastIndex - 1));
  if (l) {
    if (!o) {
      const d = t.push(e.name, "math", 0);
      d.content = c[1], d.markup = e.tag;
    }
    t.pos = e.rex.lastIndex;
  }
  return l;
};
j.block = (e) => function(o, r, i, a) {
  const c = o.bMarks[r] + o.tShift[r], l = o.src, u = l.startsWith(e.tag, e.rex.lastIndex = c) && (!e.pre || e.pre(l, !1, c)) && e.rex.exec(l), p = !!u && c < e.rex.lastIndex && (!e.post || e.post(l, !1, e.rex.lastIndex - 1));
  if (p && !a) {
    const f = e.rex.lastIndex - 1;
    let h;
    for (h = r; h < i && !(f >= o.bMarks[h] + o.tShift[h] && f <= o.eMarks[h]); h++)
      ;
    const b = o.lineMax, v = o.parentType;
    o.lineMax = h, o.parentType = "math", v === "blockquote" && (u[1] = u[1].replace(/(\n*?^(?:\s*>)+)/gm, ""));
    let C = o.push(e.name, "math", 0);
    C.block = !0, C.tag = e.tag, C.markup = "", C.content = u[1], C.info = u[u.length - 1], C.map = [r, h + 1], o.parentType = v, o.lineMax = b, o.line = h + 1;
  }
  return p;
};
j.render = function(e, t, o) {
  o.displayMode = t;
  let r;
  try {
    r = j.katex.renderToString(e, o);
  } catch (i) {
    r = ho(`${e}:${i.message}`);
  }
  return r;
};
j.use = function(e) {
  return j.katex = e, j;
};
j.inlineRuleNames = ["math_inline", "math_inline_double"];
j.blockRuleNames = ["math_block", "math_block_eqno"];
j.$_pre = (e, t, o) => {
  const r = o > 0 ? e[o - 1].charCodeAt(0) : !1;
  return t ? !r || r === 32 : !r || r !== 92 && (r < 48 || r > 57);
};
j.$_post = (e, t, o) => {
  const r = e[o + 1] && e[o + 1].charCodeAt(0);
  return t ? !r || r === 32 || r === 46 || r === 44 || r === 59 : !r || r < 48 || r > 57;
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
const ol = {
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
    math_inline: (e, t, o) => {
      const r = t.content;
      if (!r) return;
      const i = Bn(t.markup);
      if (!i) {
        e.addText(t.markup + r + t.markup);
        return;
      }
      const a = o.marks.inline_math.create({ latex: r });
      e.addText(t.markup), e.openMark(a), e.addText(r), e.closeMarkType(o.marks.inline_math), e.addText(i.close);
    },
    math_block: (e, t, o) => {
      const r = t.content.replace(/^\n+|\n+$/g, ""), i = r ? [o.text(r)] : [];
      e.push(o.nodes.code_block.createChecked({ lang: "latex" }, i));
    }
  },
  inline: {
    order: -1,
    derive: Qi,
    tokenAdvance: Xi,
    markNames: ["inline_math"],
    extRanges: (e) => Me(e, "inline_math", 1, 1),
    suppressFormatToolbar: !0,
    decorationWidgets: {
      "math-render": nl
    }
  }
}, rl = ["latex", "math"], il = {
  id: "math",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(ol),
    e.registerExtension(
      bo({
        id: "math.renderer",
        languages: rl,
        createPreview: Ui
      })
    ),
    e.registerInsertCommand(Gi),
    e.registerContextMenuItem(Vi)
  ]
}, ll = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function al(e, t) {
  const o = e.posMax, r = e.pos;
  if (e.src.charCodeAt(r) !== 126 || t || r + 2 >= o)
    return !1;
  e.pos = r + 1;
  let i = !1;
  for (; e.pos < o; ) {
    if (e.src.charCodeAt(e.pos) === 126) {
      i = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!i || r + 1 === e.pos)
    return e.pos = r, !1;
  const a = e.src.slice(r + 1, e.pos);
  if (a.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = r, !1;
  e.posMax = e.pos, e.pos = r + 1;
  const c = e.push("sub_open", "sub", 1);
  c.markup = "~";
  const l = e.push("text", "", 0);
  l.content = a.replace(ll, "$1");
  const d = e.push("sub_close", "sub", -1);
  return d.markup = "~", e.pos = e.posMax + 1, e.posMax = o, !0;
}
function sl(e) {
  e.inline.ruler.after("emphasis", "sub", al);
}
const cl = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function ul(e, t) {
  const o = e.posMax, r = e.pos;
  if (e.src.charCodeAt(r) !== 94 || t || r + 2 >= o)
    return !1;
  e.pos = r + 1;
  let i = !1;
  for (; e.pos < o; ) {
    if (e.src.charCodeAt(e.pos) === 94) {
      i = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!i || r + 1 === e.pos)
    return e.pos = r, !1;
  const a = e.src.slice(r + 1, e.pos);
  if (a.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = r, !1;
  e.posMax = e.pos, e.pos = r + 1;
  const c = e.push("sup_open", "sup", 1);
  c.markup = "^";
  const l = e.push("text", "", 0);
  l.content = a.replace(cl, "$1");
  const d = e.push("sup_close", "sup", -1);
  return d.markup = "^", e.pos = e.posMax + 1, e.posMax = o, !0;
}
function dl(e) {
  e.inline.ruler.after("emphasis", "sup", ul);
}
const pl = {
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
  mdItPlugins: [(e) => e.use(sl).use(dl)],
  // 源码组装失败时的逐 token 回退路径（parser.ts 的 handleInline）：
  // 与 strike / highlight 的 s_* / mark_* 同构，分隔符取自 tok.markup。
  parserTokens: {
    sub_open: (e, t, o) => {
      e.addText(t.markup), e.openMark(o.marks.sub.create());
    },
    sub_close: (e, t, o) => {
      e.closeMarkType(o.marks.sub), e.addText(t.markup);
    },
    sup_open: (e, t, o) => {
      e.addText(t.markup), e.openMark(o.marks.sup.create());
    },
    sup_close: (e, t, o) => {
      e.closeMarkType(o.marks.sup), e.addText(t.markup);
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
      ...Me(e, "sub", 1),
      ...Me(e, "sup", 1)
    ]
  }
}, fl = {
  id: "subSup",
  register: ({ editor: e }) => [e.registerSyntaxFeature(pl)]
}, Rn = /* @__PURE__ */ new Set();
class ml {
  dom;
  view;
  // Cache the last rendered (doc, items) so the refresh plugin bails out fast
  // when nothing relevant to the TOC changed (refresh fires on every tx).
  lastDoc = null;
  lastSig = "";
  constructor(t, o) {
    this.view = o, this.dom = document.createElement("div"), this.dom.className = "toc", this.dom.setAttribute("contenteditable", "false"), this.render(), Rn.add(this);
  }
  render() {
    const t = this.view.state.doc;
    if (t === this.lastDoc) return;
    const o = [];
    t.descendants((a, c) => {
      a.type.name === "heading" && o.push({
        level: a.attrs.level,
        text: a.textContent,
        pos: c
      });
    });
    const r = o.map((a) => `${a.pos}	${a.level}	${a.text}`).join(`
`);
    if (r === this.lastSig && this.lastDoc !== null) {
      this.lastDoc = t;
      return;
    }
    if (this.lastDoc = t, this.lastSig = r, this.dom.innerHTML = "", o.length === 0) {
      const a = document.createElement("div");
      a.className = "toc-empty", a.textContent = "(no headings yet)", this.dom.appendChild(a);
      return;
    }
    const i = document.createElement("ul");
    i.className = "toc-list";
    for (const a of o) {
      const c = document.createElement("li");
      c.className = `toc-item toc-h${a.level}`, c.textContent = a.text || "(empty heading)", c.addEventListener("mousedown", (l) => {
        l.preventDefault();
      }), c.addEventListener("click", () => this.jumpTo(a.pos)), i.appendChild(c);
    }
    this.dom.appendChild(i);
  }
  jumpTo(t) {
    const o = this.view.state.tr;
    o.setSelection(z.near(o.doc.resolve(t + 1))), this.view.dispatch(o), this.view.nodeDOM(t)?.scrollIntoView({ block: "start", behavior: "smooth" }), this.view.focus();
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
  return new W({
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
const gl = {
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
    new W({
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
      const o = e.selection;
      if (!o.empty) return !1;
      const r = o.$from;
      if (r.parent.type.name !== "paragraph") return !1;
      const i = r.parent.textContent;
      if (i !== "[toc]" && i !== "[TOC]") return !1;
      if (t) {
        const a = e.schema, c = a.nodes.toc.create(), l = r.before(), d = r.after(), u = e.tr;
        u.replaceWith(l, d, [
          c,
          a.nodes.paragraph.create()
        ]);
        const p = l + c.nodeSize + 1;
        u.setSelection(z.create(u.doc, p)), t(u);
      }
      return !0;
    }
  }),
  parserPostProcess: (e) => {
    const t = [];
    let o = !1;
    const r = e.type.schema.nodes.toc;
    return !r || (e.forEach((i) => {
      i.type.name === "paragraph" && (i.textContent === "[toc]" || i.textContent === "[TOC]") ? (t.push(r.create()), o = !0) : t.push(i);
    }), !o) ? e : e.type.create(e.attrs, t, e.marks);
  },
  blockHandlers: {
    toc: (e, t) => {
      e.write("[toc]"), e.closeBlock(t);
    }
  }
}, _l = {
  id: "toc",
  register: ({ editor: e }) => [e.registerSyntaxFeature(gl)]
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
  const o = [], i = "</u>";
  for (let a = 0; a < e.length; ) {
    if (t[a] || !e.startsWith("<u>", a)) {
      a++;
      continue;
    }
    const c = a, l = a + 3, d = l;
    let u = -1;
    for (let h = d; h < e.length; h++)
      if (!t[h] && e.startsWith(i, h)) {
        u = h;
        break;
      }
    if (u === -1) break;
    const p = u + i.length, f = u;
    if (d >= f) {
      a = p;
      continue;
    }
    if (/\s/.test(e[d]) || /\s/.test(e[f - 1])) {
      a = d;
      continue;
    }
    for (let h = c; h < p; h++) t[h] = 1;
    o.push({ type: "underline", from: d, to: f, openFrom: c, openTo: l, closeFrom: u, closeTo: p, wrap: !0 }), a = p;
  }
  return o;
}
function yl() {
  return (e, t) => {
    const { from: o, to: r, empty: i } = e.selection;
    if (i) return !1;
    const a = e.doc, c = "<u>", l = "</u>", d = c.length, u = l.length, p = o >= d ? a.textBetween(o - d, o) : "", f = r + u <= a.content.size ? a.textBetween(r, r + u) : "";
    if (p === c && f === l)
      return t && t(e.tr.delete(r, r + u).delete(o - d, o)), !0;
    if (t) {
      const h = a.textBetween(o, r), b = e.tr.replaceWith(o, r, e.schema.text(c + h + l));
      b.setSelection(z.create(b.doc, o + d, o + d + h.length)), t(b);
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
    extRanges: (e) => Me(e, "underline", 3, 4)
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
  Ao,
  fl,
  xl,
  Wo,
  Po,
  wi,
  _l,
  Ci,
  zi,
  il,
  gr,
  _i
], Tl = "en-US", Al = {
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
  },
  "zh-TW": {
    name: "Markdown 外掛",
    description: "以單一外掛形式提供的編輯器原生 Markdown 語法擴充功能。",
    groups: { editor: "編輯" },
    alert: {
      label: "提示方塊",
      description: "GitHub 風格的提示方塊，使用引用語法，如 > [!NOTE]"
    },
    subSup: {
      label: "下標與上標",
      description: "用 ~sub~ 與 ^sup^ 為文字加上下標與上標"
    },
    underline: {
      label: "底線",
      description: "用 <u>…</u> 為選取的文字加上底線"
    },
    emoji: {
      label: "表情符號",
      description: "輸入 :smile: 等簡碼即可插入表情符號"
    },
    autoPair: {
      label: "自動配對",
      description: "輸入時自動補上成對的括號"
    },
    headingIndicator: {
      label: "標題角標",
      description: "在游標所在的標題旁顯示標題層級（H1–H6）"
    },
    toc: {
      label: "目錄",
      description: "輸入 [toc] 產生隨文件標題即時更新的目錄區塊"
    },
    highlight: {
      label: "螢光標示",
      description: "用 == 括住文字即可加上螢光標示背景",
      color: {
        label: "螢光標示顏色",
        description: "螢光標示文字的背景顏色"
      }
    },
    html: {
      label: "HTML 支援",
      description: "轉譯 GFM HTML 區塊、行內標籤與註解"
    },
    math: {
      label: "數學公式",
      description: "轉譯行內與程式碼區塊中的 LaTeX 數學公式",
      copyLatex: "複製 LaTeX 原始碼",
      mathBlock: "數學公式",
      mathBlockDesc: "插入數學公式區塊"
    },
    footnote: {
      label: "註腳",
      description: "插入含參照與定義的註腳"
    },
    frontMatter: {
      label: "文件屬性",
      description: "文件開頭的 YAML 中繼資料區塊，以 --- 包住",
      defaultView: "預設檢視",
      defaultViewDesc: "開啟檔案時文件屬性的顯示方式",
      viewPanel: "屬性面板",
      viewSource: "原始 YAML",
      panelTitle: "文件屬性",
      toggleToSource: "檢視原始碼",
      toggleToPanel: "檢視屬性",
      addProperty: "新增屬性",
      addPropertyKeyPrompt: "屬性名稱",
      removeProperty: "移除屬性",
      removeBlock: "移除文件屬性",
      invalidYaml: "YAML 無效 — 請切換到原始碼編輯"
    }
  },
  "ja-JP": {
    name: "Markdown 拡張",
    description: "エディタにネイティブ統合された Markdown 構文拡張を 1 つのプラグインにまとめたものです。",
    groups: { editor: "編集" },
    alert: {
      label: "コールアウト",
      description: "GitHub 形式のコールアウトを引用構文で記述します（例: > [!NOTE]）"
    },
    subSup: {
      label: "下付き・上付き文字",
      description: "~sub~ と ^sup^ で文字を下付き・上付きにします"
    },
    underline: {
      label: "下線",
      description: "選択したテキストを <u>…</u> で囲みます"
    },
    emoji: {
      label: "絵文字",
      description: ":smile: のようなショートコードを入力して絵文字を挿入します"
    },
    autoPair: {
      label: "自動補完",
      description: "入力時に括弧やかっこを自動で閉じます"
    },
    headingIndicator: {
      label: "見出しバッジ",
      description: "カーソル位置の見出しの横に見出しレベル（H1–H6）を表示します"
    },
    toc: {
      label: "目次",
      description: "[toc] で見出しからなる目次を生成し、常に最新の状態に保ちます"
    },
    highlight: {
      label: "ハイライト",
      description: "テキストを == で囲むとハイライト背景が付きます",
      color: {
        label: "ハイライト色",
        description: "ハイライトしたテキストの背景色"
      }
    },
    html: {
      label: "HTML 対応",
      description: "GFM の HTML ブロック、インラインタグ、コメントを描画します"
    },
    math: {
      label: "数式",
      description: "LaTeX の数式を行内およびコードブロック内で描画します",
      copyLatex: "LaTeX ソースをコピー",
      mathBlock: "数式ブロック",
      mathBlockDesc: "数式ブロックを挿入"
    },
    footnote: {
      label: "脚注",
      description: "参照と定義を伴う脚注を挿入します"
    },
    frontMatter: {
      label: "文書プロパティ",
      description: "文書冒頭に --- で囲んで記述する YAML メタデータブロック",
      defaultView: "既定の表示",
      defaultViewDesc: "ファイルを開いたときの文書プロパティの表示方法",
      viewPanel: "プロパティパネル",
      viewSource: "YAML をそのまま表示",
      panelTitle: "文書プロパティ",
      toggleToSource: "ソースを表示",
      toggleToPanel: "プロパティを表示",
      addProperty: "プロパティを追加",
      addPropertyKeyPrompt: "プロパティ名",
      removeProperty: "プロパティを削除",
      removeBlock: "文書プロパティを削除",
      invalidYaml: "YAML が無効です。ソース表示に切り替えて編集してください"
    }
  },
  "ko-KR": {
    name: "Markdown 확장",
    description: "에디터에 기본 내장된 Markdown 문법 확장을 하나의 플러그인으로 묶었습니다.",
    groups: { editor: "편집" },
    alert: {
      label: "콜아웃",
      description: "인용 문법으로 GitHub 스타일 콜아웃을 만듭니다. 예: > [!NOTE]"
    },
    subSup: {
      label: "아래첨자·위첨자",
      description: "~sub~ 와 ^sup^ 로 텍스트를 아래첨자나 위첨자로 표시합니다"
    },
    underline: {
      label: "밑줄",
      description: "선택한 텍스트를 <u>…</u> 로 감쌉니다"
    },
    emoji: {
      label: "이모지",
      description: ":smile: 같은 단축 코드를 입력해 이모지를 삽입합니다"
    },
    autoPair: {
      label: "자동 닫기",
      description: "입력할 때 괄호와 대괄호를 자동으로 닫습니다"
    },
    headingIndicator: {
      label: "제목 배지",
      description: "현재 제목 옆에 제목 수준(H1–H6)을 표시합니다"
    },
    toc: {
      label: "목차",
      description: "[toc] 로 문서 제목의 목차를 만들고 항상 최신 상태로 유지합니다"
    },
    highlight: {
      label: "형광펜",
      description: "텍스트를 == 로 감싸 형광펜 배경을 추가합니다",
      color: {
        label: "형광펜 색상",
        description: "형광펜으로 표시된 텍스트의 배경색"
      }
    },
    html: {
      label: "HTML 지원",
      description: "GFM HTML 블록, 인라인 태그, 주석을 렌더링합니다"
    },
    math: {
      label: "수식",
      description: "LaTeX 수식을 인라인과 코드 블록에서 렌더링합니다",
      copyLatex: "LaTeX 원본 복사",
      mathBlock: "수식 블록",
      mathBlockDesc: "수식 블록 삽입"
    },
    footnote: {
      label: "각주",
      description: "참조와 정의가 있는 각주를 삽입합니다"
    },
    frontMatter: {
      label: "문서 속성",
      description: "문서 맨 위에 --- 로 감싸는 YAML 메타데이터 블록",
      defaultView: "기본 보기",
      defaultViewDesc: "파일을 열 때 문서 속성을 표시하는 방식",
      viewPanel: "속성 패널",
      viewSource: "YAML 원본",
      panelTitle: "문서 속성",
      toggleToSource: "원본 보기",
      toggleToPanel: "속성 보기",
      addProperty: "속성 추가",
      addPropertyKeyPrompt: "속성 이름",
      removeProperty: "속성 삭제",
      removeBlock: "문서 속성 삭제",
      invalidYaml: "YAML이 올바르지 않습니다. 원본 보기로 전환해 편집하세요"
    }
  },
  "de-DE": {
    name: "Markdown-Erweiterungen",
    description: "Editor-native Markdown-Syntaxerweiterungen als ein einziges Plugin.",
    groups: { editor: "Bearbeiten" },
    alert: {
      label: "Hinweisboxen",
      description: "Hinweisboxen im GitHub-Stil über Blockzitate, z. B. > [!NOTE]"
    },
    subSup: {
      label: "Tief- und Hochstellung",
      description: "Mit ~sub~ und ^sup^ Text tiefer oder höher setzen"
    },
    underline: {
      label: "Unterstrichen",
      description: "Ausgewählten Text in <u>…</u> einschließen"
    },
    emoji: {
      label: "Emoji",
      description: "Kurzwörter wie :smile: eingeben, um Emoji einzufügen"
    },
    autoPair: {
      label: "Automatisch schließen",
      description: "Klammern beim Tippen automatisch schließen"
    },
    headingIndicator: {
      label: "Überschriften-Marke",
      description: "Überschriftenebene (H1–H6) neben der aktiven Überschrift anzeigen"
    },
    toc: {
      label: "Inhaltsverzeichnis",
      description: "Mit [toc] eine automatisch aktualisierte Gliederung der Überschriften erstellen"
    },
    highlight: {
      label: "Hervorheben",
      description: "Text in == einschließen, um einen Hervorhebungshintergrund hinzuzufügen",
      color: {
        label: "Hervorhebungsfarbe",
        description: "Hintergrundfarbe für hervorgehobenen Text"
      }
    },
    html: {
      label: "HTML-Unterstützung",
      description: "GFM-HTML-Blöcke, Inline-Tags und Kommentare rendern"
    },
    math: {
      label: "Formeln",
      description: "LaTeX-Formeln inline und in Codeblöcken rendern",
      copyLatex: "LaTeX-Quelltext kopieren",
      mathBlock: "Formelblock",
      mathBlockDesc: "Formelblock einfügen"
    },
    footnote: {
      label: "Fußnote",
      description: "Fußnoten mit Verweisen und Definitionen einfügen"
    },
    frontMatter: {
      label: "Dokumenteigenschaften",
      description: "Ein YAML-Metadatenblock am Dokumentanfang, eingefasst mit ---",
      defaultView: "Standardansicht",
      defaultViewDesc: "Wie Dokumenteigenschaften beim Öffnen einer Datei angezeigt werden",
      viewPanel: "Eigenschaftenbereich",
      viewSource: "Rohes YAML",
      panelTitle: "Dokumenteigenschaften",
      toggleToSource: "Quelltext anzeigen",
      toggleToPanel: "Eigenschaften anzeigen",
      addProperty: "Eigenschaft hinzufügen",
      addPropertyKeyPrompt: "Name der Eigenschaft",
      removeProperty: "Eigenschaft entfernen",
      removeBlock: "Dokumenteigenschaften entfernen",
      invalidYaml: "Ungültiges YAML – zum Bearbeiten zur Quellansicht wechseln"
    }
  },
  "fr-FR": {
    name: "Extensions Markdown",
    description: "Extensions de syntaxe Markdown intégrées à l’éditeur, réunies dans un seul plugin.",
    groups: { editor: "Édition" },
    alert: {
      label: "Encadrés d’alerte",
      description: "Encadrés d’alerte façon GitHub avec la syntaxe de citation, par ex. > [!NOTE]"
    },
    subSup: {
      label: "Indice et exposant",
      description: "Écrivez ~sub~ et ^sup^ pour mettre le texte en indice ou en exposant"
    },
    underline: {
      label: "Soulignement",
      description: "Entoure le texte sélectionné de <u>…</u>"
    },
    emoji: {
      label: "Émoji",
      description: "Tapez des codes comme :smile: pour insérer un émoji"
    },
    autoPair: {
      label: "Fermeture automatique",
      description: "Ferme automatiquement les crochets et parenthèses pendant la saisie"
    },
    headingIndicator: {
      label: "Badge de titre",
      description: "Affiche le niveau du titre (H1–H6) à côté du titre actif"
    },
    toc: {
      label: "Table des matières",
      description: "Génère avec [toc] un sommaire des titres du document, toujours à jour"
    },
    highlight: {
      label: "Surlignage",
      description: "Entoure le texte de == pour ajouter un fond de surlignage",
      color: {
        label: "Couleur de surlignage",
        description: "Couleur de fond du texte surligné"
      }
    },
    html: {
      label: "Prise en charge HTML",
      description: "Affiche les blocs HTML GFM, les balises en ligne et les commentaires"
    },
    math: {
      label: "Formules",
      description: "Affiche les formules LaTeX en ligne et dans les blocs de code",
      copyLatex: "Copier la source LaTeX",
      mathBlock: "Bloc de formule",
      mathBlockDesc: "Insérer un bloc de formule"
    },
    footnote: {
      label: "Note de bas de page",
      description: "Insère des notes de bas de page avec appels et définitions"
    },
    frontMatter: {
      label: "Propriétés du document",
      description: "Bloc de métadonnées YAML en tête du document, délimité par ---",
      defaultView: "Vue par défaut",
      defaultViewDesc: "Mode d’affichage des propriétés du document à l’ouverture d’un fichier",
      viewPanel: "Panneau des propriétés",
      viewSource: "YAML brut",
      panelTitle: "Propriétés du document",
      toggleToSource: "Voir la source",
      toggleToPanel: "Voir les propriétés",
      addProperty: "Ajouter une propriété",
      addPropertyKeyPrompt: "Nom de la propriété",
      removeProperty: "Supprimer la propriété",
      removeBlock: "Supprimer les propriétés du document",
      invalidYaml: "YAML invalide — passez à la source pour modifier"
    }
  },
  "es-ES": {
    name: "Extensiones de Markdown",
    description: "Extensiones de sintaxis Markdown integradas en el editor, empaquetadas como un único plugin.",
    groups: { editor: "Edición" },
    alert: {
      label: "Cuadros de aviso",
      description: "Cuadros de aviso estilo GitHub con sintaxis de cita, p. ej. > [!NOTE]"
    },
    subSup: {
      label: "Subíndice y superíndice",
      description: "Escribe ~sub~ y ^sup^ para bajar o subir texto"
    },
    underline: {
      label: "Subrayado",
      description: "Envuelve el texto seleccionado en <u>…</u>"
    },
    emoji: {
      label: "Emoji",
      description: "Escribe códigos como :smile: para insertar emoji"
    },
    autoPair: {
      label: "Cierre automático",
      description: "Cierra automáticamente corchetes y paréntesis al escribir"
    },
    headingIndicator: {
      label: "Etiqueta de encabezado",
      description: "Muestra el nivel del encabezado (H1–H6) junto al encabezado activo"
    },
    toc: {
      label: "Tabla de contenidos",
      description: "Genera con [toc] un índice de los encabezados del documento siempre actualizado"
    },
    highlight: {
      label: "Resaltado",
      description: "Envuelve el texto en == para añadir un fondo de resaltado",
      color: {
        label: "Color de resaltado",
        description: "Color de fondo del texto resaltado"
      }
    },
    html: {
      label: "Compatibilidad con HTML",
      description: "Renderiza bloques HTML de GFM, etiquetas en línea y comentarios"
    },
    math: {
      label: "Fórmulas",
      description: "Renderiza fórmulas LaTeX en línea y en bloques de código",
      copyLatex: "Copiar código LaTeX",
      mathBlock: "Bloque de fórmula",
      mathBlockDesc: "Insertar bloque de fórmula"
    },
    footnote: {
      label: "Nota al pie",
      description: "Inserta notas al pie con referencias y definiciones"
    },
    frontMatter: {
      label: "Propiedades del documento",
      description: "Bloque de metadatos YAML al inicio del documento, delimitado por ---",
      defaultView: "Vista predeterminada",
      defaultViewDesc: "Cómo se muestran las propiedades del documento al abrir un archivo",
      viewPanel: "Panel de propiedades",
      viewSource: "YAML sin formato",
      panelTitle: "Propiedades del documento",
      toggleToSource: "Ver código",
      toggleToPanel: "Ver propiedades",
      addProperty: "Añadir propiedad",
      addPropertyKeyPrompt: "Nombre de la propiedad",
      removeProperty: "Eliminar propiedad",
      removeBlock: "Eliminar propiedades del documento",
      invalidYaml: "YAML no válido: cambia al código para editarlo"
    }
  },
  "it-IT": {
    name: "Estensioni Markdown",
    description: "Estensioni di sintassi Markdown native dell’editor, raccolte in un unico plugin.",
    groups: { editor: "Modifica" },
    alert: {
      label: "Riquadri di avviso",
      description: "Riquadri di avviso in stile GitHub con sintassi di citazione, ad es. > [!NOTE]"
    },
    subSup: {
      label: "Pedice e apice",
      description: "Scrivi ~sub~ e ^sup^ per abbassare o alzare il testo"
    },
    underline: {
      label: "Sottolineato",
      description: "Racchiude il testo selezionato in <u>…</u>"
    },
    emoji: {
      label: "Emoji",
      description: "Digita codici come :smile: per inserire emoji"
    },
    autoPair: {
      label: "Chiusura automatica",
      description: "Chiude automaticamente parentesi quadre e tonde durante la digitazione"
    },
    headingIndicator: {
      label: "Badge del titolo",
      description: "Mostra il livello del titolo (H1–H6) accanto al titolo attivo"
    },
    toc: {
      label: "Indice",
      description: "Crea con [toc] un indice dei titoli del documento sempre aggiornato"
    },
    highlight: {
      label: "Evidenziazione",
      description: "Racchiude il testo tra == per aggiungere uno sfondo evidenziato",
      color: {
        label: "Colore di evidenziazione",
        description: "Colore di sfondo del testo evidenziato"
      }
    },
    html: {
      label: "Supporto HTML",
      description: "Visualizza blocchi HTML GFM, tag inline e commenti"
    },
    math: {
      label: "Formule",
      description: "Visualizza formule LaTeX in linea e nei blocchi di codice",
      copyLatex: "Copia sorgente LaTeX",
      mathBlock: "Blocco formula",
      mathBlockDesc: "Inserisci blocco formula"
    },
    footnote: {
      label: "Nota a piè di pagina",
      description: "Inserisce note a piè di pagina con richiami e definizioni"
    },
    frontMatter: {
      label: "Proprietà del documento",
      description: "Blocco di metadati YAML all’inizio del documento, delimitato da ---",
      defaultView: "Vista predefinita",
      defaultViewDesc: "Come vengono mostrate le proprietà del documento all’apertura di un file",
      viewPanel: "Pannello proprietà",
      viewSource: "YAML grezzo",
      panelTitle: "Proprietà del documento",
      toggleToSource: "Mostra sorgente",
      toggleToPanel: "Mostra proprietà",
      addProperty: "Aggiungi proprietà",
      addPropertyKeyPrompt: "Nome proprietà",
      removeProperty: "Rimuovi proprietà",
      removeBlock: "Rimuovi proprietà del documento",
      invalidYaml: "YAML non valido: passa alla sorgente per modificare"
    }
  },
  "pt-PT": {
    name: "Extensões Markdown",
    description: "Extensões de sintaxe Markdown nativas do editor, reunidas num único plugin.",
    groups: { editor: "Edição" },
    alert: {
      label: "Caixas de aviso",
      description: "Caixas de aviso ao estilo GitHub com sintaxe de citação, por ex. > [!NOTE]"
    },
    subSup: {
      label: "Subscrito e sobrescrito",
      description: "Escreva ~sub~ e ^sup^ para baixar ou elevar o texto"
    },
    underline: {
      label: "Sublinhado",
      description: "Envolve o texto selecionado em <u>…</u>"
    },
    emoji: {
      label: "Emoji",
      description: "Escreva códigos como :smile: para inserir emoji"
    },
    autoPair: {
      label: "Fecho automático",
      description: "Fecha automaticamente parênteses e chavetas ao escrever"
    },
    headingIndicator: {
      label: "Etiqueta de título",
      description: "Mostra o nível do título (H1–H6) junto ao título ativo"
    },
    toc: {
      label: "Índice",
      description: "Cria com [toc] um índice dos títulos do documento sempre atualizado"
    },
    highlight: {
      label: "Realce",
      description: "Envolve o texto em == para adicionar um fundo de realce",
      color: {
        label: "Cor de realce",
        description: "Cor de fundo do texto realçado"
      }
    },
    html: {
      label: "Suporte HTML",
      description: "Renderiza blocos HTML GFM, etiquetas em linha e comentários"
    },
    math: {
      label: "Fórmulas",
      description: "Renderiza fórmulas LaTeX em linha e em blocos de código",
      copyLatex: "Copiar código LaTeX",
      mathBlock: "Bloco de fórmula",
      mathBlockDesc: "Inserir bloco de fórmula"
    },
    footnote: {
      label: "Nota de rodapé",
      description: "Insere notas de rodapé com referências e definições"
    },
    frontMatter: {
      label: "Propriedades do documento",
      description: "Bloco de metadados YAML no início do documento, delimitado por ---",
      defaultView: "Vista predefinida",
      defaultViewDesc: "Como as propriedades do documento são apresentadas ao abrir um ficheiro",
      viewPanel: "Painel de propriedades",
      viewSource: "YAML em bruto",
      panelTitle: "Propriedades do documento",
      toggleToSource: "Ver código",
      toggleToPanel: "Ver propriedades",
      addProperty: "Adicionar propriedade",
      addPropertyKeyPrompt: "Nome da propriedade",
      removeProperty: "Remover propriedade",
      removeBlock: "Remover propriedades do documento",
      invalidYaml: "YAML inválido — mude para o código para editar"
    }
  },
  "ru-RU": {
    name: "Расширения Markdown",
    description: "Встроенные в редактор расширения синтаксиса Markdown в одном плагине.",
    groups: { editor: "Редактирование" },
    alert: {
      label: "Блоки-выноски",
      description: "Выноски в стиле GitHub через синтаксис цитаты, например > [!NOTE]"
    },
    subSup: {
      label: "Нижний и верхний индекс",
      description: "Пишите ~sub~ и ^sup^, чтобы опустить или поднять текст"
    },
    underline: {
      label: "Подчёркивание",
      description: "Оборачивает выделенный текст в <u>…</u>"
    },
    emoji: {
      label: "Эмодзи",
      description: "Вводите код вроде :smile:, чтобы вставить эмодзи"
    },
    autoPair: {
      label: "Автозакрытие",
      description: "Автоматически закрывает скобки при вводе"
    },
    headingIndicator: {
      label: "Метка заголовка",
      description: "Показывает уровень заголовка (H1–H6) рядом с текущим заголовком"
    },
    toc: {
      label: "Оглавление",
      description: "Создаёт по [toc] оглавление заголовков документа, которое обновляется автоматически"
    },
    highlight: {
      label: "Выделение",
      description: "Оборачивает текст в ==, чтобы добавить фон выделения",
      color: {
        label: "Цвет выделения",
        description: "Цвет фона выделенного текста"
      }
    },
    html: {
      label: "Поддержка HTML",
      description: "Отображает HTML-блоки GFM, встроенные теги и комментарии"
    },
    math: {
      label: "Формулы",
      description: "Отображает формулы LaTeX в строке и в блоках кода",
      copyLatex: "Копировать исходник LaTeX",
      mathBlock: "Блок формулы",
      mathBlockDesc: "Вставить блок формулы"
    },
    footnote: {
      label: "Сноска",
      description: "Вставляет сноски со ссылками и определениями"
    },
    frontMatter: {
      label: "Свойства документа",
      description: "Блок метаданных YAML в начале документа, ограниченный ---",
      defaultView: "Представление по умолчанию",
      defaultViewDesc: "Как показывать свойства документа при открытии файла",
      viewPanel: "Панель свойств",
      viewSource: "Исходный YAML",
      panelTitle: "Свойства документа",
      toggleToSource: "Показать исходник",
      toggleToPanel: "Показать свойства",
      addProperty: "Добавить свойство",
      addPropertyKeyPrompt: "Имя свойства",
      removeProperty: "Удалить свойство",
      removeBlock: "Удалить свойства документа",
      invalidYaml: "Недопустимый YAML — переключитесь на исходник для правки"
    }
  },
  "ar-SA": {
    name: "ملحقات Markdown",
    description: "ملحقات صياغة Markdown مدمجة في المحرر ومجمّعة في مكوّن إضافي واحد.",
    groups: { editor: "التحرير" },
    alert: {
      label: "مربعات التنبيه",
      description: "مربعات تنبيه بنمط GitHub عبر صياغة الاقتباس، مثل > [!NOTE]"
    },
    subSup: {
      label: "الخط السفلي والعلوي",
      description: "اكتب ~sub~ و ^sup^ لخفض النص أو رفعه"
    },
    underline: {
      label: "التسطير",
      description: "يحيط النص المحدد بـ <u>…</u>"
    },
    emoji: {
      label: "الإيموجي",
      description: "اكتب رموزًا مثل :smile: لإدراج إيموجي"
    },
    autoPair: {
      label: "الإغلاق التلقائي",
      description: "يغلق الأقواس تلقائيًا أثناء الكتابة"
    },
    headingIndicator: {
      label: "شارة العنوان",
      description: "يعرض مستوى العنوان (H1–H6) بجانب العنوان النشط"
    },
    toc: {
      label: "جدول المحتويات",
      description: "ينشئ عبر [toc] فهرسًا حيًّا لعناوين المستند"
    },
    highlight: {
      label: "الإبراز",
      description: "أحط النص بـ == لإضافة خلفية إبراز",
      color: {
        label: "لون الإبراز",
        description: "لون خلفية النص المبرز"
      }
    },
    html: {
      label: "دعم HTML",
      description: "يعرض كتل HTML بصيغة GFM والوسوم السطرية والتعليقات"
    },
    math: {
      label: "المعادلات",
      description: "يعرض معادلات LaTeX سطريًا وداخل كتل الشيفرة",
      copyLatex: "نسخ شيفرة LaTeX",
      mathBlock: "كتلة معادلة",
      mathBlockDesc: "إدراج كتلة معادلة"
    },
    footnote: {
      label: "الحاشية",
      description: "يدرج حواشي مع مراجع وتعريفات"
    },
    frontMatter: {
      label: "خصائص المستند",
      description: "كتلة بيانات وصفية بصيغة YAML في أعلى المستند، محاطة بـ ---",
      defaultView: "العرض الافتراضي",
      defaultViewDesc: "كيفية عرض خصائص المستند عند فتح ملف",
      viewPanel: "لوحة الخصائص",
      viewSource: "YAML خام",
      panelTitle: "خصائص المستند",
      toggleToSource: "عرض الشيفرة",
      toggleToPanel: "عرض الخصائص",
      addProperty: "إضافة خاصية",
      addPropertyKeyPrompt: "اسم الخاصية",
      removeProperty: "إزالة الخاصية",
      removeBlock: "إزالة خصائص المستند",
      invalidYaml: "YAML غير صالح — انتقل إلى الشيفرة للتحرير"
    }
  },
  "hi-IN": {
    name: "Markdown एक्सटेंशन",
    description: "एडिटर में मूल रूप से मिलने वाले Markdown सिंटैक्स एक्सटेंशन, एक ही प्लगइन में।",
    groups: { editor: "संपादन" },
    alert: {
      label: "कॉलआउट बॉक्स",
      description: "ब्लॉककोट सिंटैक्स से GitHub शैली के कॉलआउट, जैसे > [!NOTE]"
    },
    subSup: {
      label: "सबस्क्रिप्ट और सुपरस्क्रिप्ट",
      description: "टेक्स्ट को नीचे या ऊपर लाने के लिए ~sub~ और ^sup^ लिखें"
    },
    underline: {
      label: "रेखांकन",
      description: "चयनित टेक्स्ट को <u>…</u> में लपेटें"
    },
    emoji: {
      label: "इमोजी",
      description: "इमोजी डालने के लिए :smile: जैसे शॉर्टकोड टाइप करें"
    },
    autoPair: {
      label: "स्वतः जोड़ी",
      description: "टाइप करते समय ब्रैकेट और कोष्ठक स्वतः बंद करता है"
    },
    headingIndicator: {
      label: "शीर्षक बैज",
      description: "सक्रिय शीर्षक के पास शीर्षक स्तर (H1–H6) दिखाएँ"
    },
    toc: {
      label: "विषय-सूची",
      description: "[toc] से दस्तावेज़ के शीर्षकों की लाइव सूची बनाएँ"
    },
    highlight: {
      label: "हाइलाइट",
      description: "हाइलाइट पृष्ठभूमि जोड़ने के लिए टेक्स्ट को == में लपेटें",
      color: {
        label: "हाइलाइट रंग",
        description: "हाइलाइट किए गए टेक्स्ट की पृष्ठभूमि का रंग"
      }
    },
    html: {
      label: "HTML समर्थन",
      description: "GFM HTML ब्लॉक, इनलाइन टैग और टिप्पणियाँ रेंडर करें"
    },
    math: {
      label: "गणित",
      description: "LaTeX सूत्र इनलाइन और कोड ब्लॉक में रेंडर करें",
      copyLatex: "LaTeX स्रोत कॉपी करें",
      mathBlock: "गणित ब्लॉक",
      mathBlockDesc: "गणित ब्लॉक डालें"
    },
    footnote: {
      label: "फ़ुटनोट",
      description: "संदर्भों और परिभाषाओं के साथ फ़ुटनोट डालें"
    },
    frontMatter: {
      label: "दस्तावेज़ गुण",
      description: "दस्तावेज़ के शीर्ष पर --- से घिरा YAML मेटाडेटा ब्लॉक",
      defaultView: "डिफ़ॉल्ट दृश्य",
      defaultViewDesc: "फ़ाइल खुलने पर दस्तावेज़ गुण कैसे दिखें",
      viewPanel: "गुण पैनल",
      viewSource: "कच्चा YAML",
      panelTitle: "दस्तावेज़ गुण",
      toggleToSource: "स्रोत देखें",
      toggleToPanel: "गुण देखें",
      addProperty: "गुण जोड़ें",
      addPropertyKeyPrompt: "गुण का नाम",
      removeProperty: "गुण हटाएँ",
      removeBlock: "दस्तावेज़ गुण हटाएँ",
      invalidYaml: "अमान्य YAML — संपादन के लिए स्रोत पर जाएँ"
    }
  },
  "th-TH": {
    name: "ส่วนขยาย Markdown",
    description: "ส่วนขยายไวยากรณ์ Markdown ที่ผสานในตัวแก้ไข รวมไว้ในปลั๊กอินเดียว",
    groups: { editor: "การแก้ไข" },
    alert: {
      label: "กล่องข้อความเน้น",
      description: "กล่องข้อความเน้นสไตล์ GitHub ด้วยไวยากรณ์อ้างอิง เช่น > [!NOTE]"
    },
    subSup: {
      label: "ตัวห้อยและตัวยก",
      description: "พิมพ์ ~sub~ และ ^sup^ เพื่อทำข้อความเป็นตัวห้อยหรือตัวยก"
    },
    underline: {
      label: "ขีดเส้นใต้",
      description: "ล้อมข้อความที่เลือกด้วย <u>…</u>"
    },
    emoji: {
      label: "อีโมจิ",
      description: "พิมพ์รหัสย่อ เช่น :smile: เพื่อแทรกอีโมจิ"
    },
    autoPair: {
      label: "ปิดวงเล็บอัตโนมัติ",
      description: "ปิดวงเล็บและวงเล็บโค้งให้อัตโนมัติขณะพิมพ์"
    },
    headingIndicator: {
      label: "ป้ายหัวเรื่อง",
      description: "แสดงระดับหัวเรื่อง (H1–H6) ข้างหัวเรื่องที่ใช้งานอยู่"
    },
    toc: {
      label: "สารบัญ",
      description: "สร้างสารบัญจากหัวเรื่องในเอกสารด้วย [toc] และอัปเดตตลอดเวลา"
    },
    highlight: {
      label: "ไฮไลต์",
      description: "ล้อมข้อความด้วย == เพื่อเพิ่มพื้นหลังไฮไลต์",
      color: {
        label: "สีไฮไลต์",
        description: "สีพื้นหลังของข้อความที่ไฮไลต์"
      }
    },
    html: {
      label: "รองรับ HTML",
      description: "แสดงบล็อก HTML แบบ GFM แท็กในบรรทัด และความคิดเห็น"
    },
    math: {
      label: "สูตรคณิตศาสตร์",
      description: "แสดงสูตร LaTeX ทั้งในบรรทัดและในบล็อกโค้ด",
      copyLatex: "คัดลอกซอร์ส LaTeX",
      mathBlock: "บล็อกสูตร",
      mathBlockDesc: "แทรกบล็อกสูตร"
    },
    footnote: {
      label: "เชิงอรรถ",
      description: "แทรกเชิงอรรถพร้อมการอ้างอิงและคำนิยาม"
    },
    frontMatter: {
      label: "คุณสมบัติเอกสาร",
      description: "บล็อกเมทาดาทา YAML ที่ต้นเอกสาร ล้อมด้วย ---",
      defaultView: "มุมมองเริ่มต้น",
      defaultViewDesc: "วิธีแสดงคุณสมบัติเอกสารเมื่อเปิดไฟล์",
      viewPanel: "แผงคุณสมบัติ",
      viewSource: "YAML ดิบ",
      panelTitle: "คุณสมบัติเอกสาร",
      toggleToSource: "ดูซอร์ส",
      toggleToPanel: "ดูคุณสมบัติ",
      addProperty: "เพิ่มคุณสมบัติ",
      addPropertyKeyPrompt: "ชื่อคุณสมบัติ",
      removeProperty: "ลบคุณสมบัติ",
      removeBlock: "ลบคุณสมบัติเอกสาร",
      invalidYaml: "YAML ไม่ถูกต้อง — สลับไปที่ซอร์สเพื่อแก้ไข"
    }
  },
  "vi-VN": {
    name: "Tiện ích Markdown",
    description: "Các tiện ích mở rộng cú pháp Markdown tích hợp sẵn trong trình soạn thảo, gói trong một plugin duy nhất.",
    groups: { editor: "Chỉnh sửa" },
    alert: {
      label: "Hộp chú thích",
      description: "Hộp chú thích kiểu GitHub bằng cú pháp trích dẫn, ví dụ > [!NOTE]"
    },
    subSup: {
      label: "Chỉ số dưới và trên",
      description: "Viết ~sub~ và ^sup^ để hạ thấp hoặc nâng cao chữ"
    },
    underline: {
      label: "Gạch chân",
      description: "Bọc đoạn văn bản đã chọn trong <u>…</u>"
    },
    emoji: {
      label: "Biểu tượng cảm xúc",
      description: "Gõ mã ngắn như :smile: để chèn biểu tượng cảm xúc"
    },
    autoPair: {
      label: "Tự động đóng cặp",
      description: "Tự động đóng ngoặc vuông và ngoặc tròn khi gõ"
    },
    headingIndicator: {
      label: "Nhãn tiêu đề",
      description: "Hiển thị cấp tiêu đề (H1–H6) bên cạnh tiêu đề đang hoạt động"
    },
    toc: {
      label: "Mục lục",
      description: "Tạo mục lục trực tiếp từ các tiêu đề trong tài liệu bằng [toc]"
    },
    highlight: {
      label: "Đánh dấu",
      description: "Bọc văn bản trong == để thêm nền đánh dấu",
      color: {
        label: "Màu đánh dấu",
        description: "Màu nền cho đoạn văn bản được đánh dấu"
      }
    },
    html: {
      label: "Hỗ trợ HTML",
      description: "Hiển thị khối HTML theo GFM, thẻ nội tuyến và chú thích"
    },
    math: {
      label: "Công thức",
      description: "Hiển thị công thức LaTeX trong dòng và trong khối mã",
      copyLatex: "Sao chép mã LaTeX",
      mathBlock: "Khối công thức",
      mathBlockDesc: "Chèn khối công thức"
    },
    footnote: {
      label: "Chú thích cuối trang",
      description: "Chèn chú thích cuối trang kèm tham chiếu và định nghĩa"
    },
    frontMatter: {
      label: "Thuộc tính tài liệu",
      description: "Khối siêu dữ liệu YAML ở đầu tài liệu, bao bởi ---",
      defaultView: "Chế độ xem mặc định",
      defaultViewDesc: "Cách hiển thị thuộc tính tài liệu khi mở tệp",
      viewPanel: "Bảng thuộc tính",
      viewSource: "YAML thô",
      panelTitle: "Thuộc tính tài liệu",
      toggleToSource: "Xem mã nguồn",
      toggleToPanel: "Xem thuộc tính",
      addProperty: "Thêm thuộc tính",
      addPropertyKeyPrompt: "Tên thuộc tính",
      removeProperty: "Xóa thuộc tính",
      removeBlock: "Xóa thuộc tính tài liệu",
      invalidYaml: "YAML không hợp lệ — chuyển sang mã nguồn để sửa"
    }
  }
}, Sl = /* @__PURE__ */ new Set(["view"]);
class Kl extends ko {
  featureResources = [];
  /** 上次装配时的设置签名；显示偏好变化不参与比较。 */
  lastSettingsSignature = null;
  onload() {
    this.addMessages(Al, Tl), this.syncFeatures(), this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }
  onunload() {
    this.disposeFeatures(), this.lastSettingsSignature = null;
  }
  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  syncFeatures() {
    const t = this.settingsSignature();
    if (t !== this.lastSettingsSignature) {
      this.lastSettingsSignature = t, this.disposeFeatures();
      for (const o of vl)
        if (this.settings.get(o.id) !== !1)
          try {
            const r = o.register({
              editor: this.app.editor,
              settings: this.settings,
              t: (i) => this.t(i)
            });
            this.featureResources.push(...Array.isArray(r) ? r : [r]);
          } catch (r) {
            this.app.log.error(`feature ${o.id} failed to load`, r);
          }
    }
  }
  /**
   * 特性装配相关的设置签名：取全量配置、跳过纯显示偏好、按 key 排序，
   * `undefined` 归一为 `null` 以免 `JSON.stringify` 丢键造成签名碰撞。
   */
  settingsSignature() {
    const t = this.settings.all().values, o = Object.keys(t).filter((r) => !Sl.has(r)).sort().map((r) => [r, t[r] === void 0 ? null : t[r]]);
    return JSON.stringify(o);
  }
  disposeFeatures() {
    for (const t of this.featureResources)
      try {
        t.dispose();
      } catch (o) {
        this.app.log.warn("feature dispose failed", o);
      }
    this.featureResources = [];
  }
}
function El(e) {
  const { dom: t, contentDOM: o, renderContainer: r, view: i, getPos: a } = e;
  let c = e.node, l = "code", d = null;
  const u = (A) => {
    if (A.button !== 0) {
      A.button === 2 && A.preventDefault();
      return;
    }
    if (!i.editable) return;
    A.preventDefault();
    const P = a();
    if (P == null) return;
    const q = P + 1, B = i.state.tr.setSelection(z.create(i.state.doc, q)).scrollIntoView();
    i.dispatch(B), i.focus();
  };
  r.addEventListener("mousedown", u);
  const p = () => {
    const A = a();
    if (A == null) return !1;
    const P = i.state.selection;
    return P.from > A && P.from < A + c.nodeSize;
  }, f = () => {
    l !== "code" && (l = "code", o.style.display = "", r.style.display = "none", t.classList.remove("html-block-render-mode"));
  }, h = () => {
    l !== "render" && (l = "render", o.style.display = "none", r.style.display = "", t.classList.add("html-block-render-mode"));
  }, b = (A) => {
    const P = A.trim();
    return P.startsWith("<!--") && P.endsWith("-->");
  }, v = () => {
    const A = c.textContent, P = b(A);
    if (t.classList.toggle("html-block-comment", P), P) {
      d = null, f();
      return;
    }
    !p() && A.trim() !== "" ? ((l !== "render" || d !== A) && (r.innerHTML = A, d = A), h()) : (d = null, f());
  }, C = Li(v);
  return {
    update(A) {
      return A.type.name !== "html_block" ? !1 : (c = A, v(), !0);
    },
    destroy() {
      C(), r.removeEventListener("mousedown", u);
    },
    stopEvent(A) {
      return r.contains(A.target) && l === "render";
    },
    ignoreMutation(A) {
      return !!(r.contains(A.target) || A.type === "attributes" && (A.target === t || A.target === o));
    }
  };
}
const Ml = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createHtmlBlockView: El
}, Symbol.toStringTag, { value: "Module" }));
export {
  Kl as default
};
