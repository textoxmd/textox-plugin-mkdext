import { wholeTokenSpan as pe, markConsumed as I, markExtRanges as M, pairMarks as N, leaveLineDraft as fe, renderFormulaToSVG as ae, defineCodeBlockExtension as he, Plugin as ge } from "@textox/plugin-sdk";
import { Plugin as v, PluginKey as D, TextSelection as w } from "prosemirror-state";
import { Decoration as S, DecorationSet as T } from "prosemirror-view";
import { Transform as be } from "prosemirror-transform";
const B = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, se = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
};
function ke(e) {
  const t = document.createElement("span");
  return t.className = "alert-label", t.contentEditable = "false", t.textContent = se[e] ?? e, t;
}
function ye(e, t) {
  const o = [];
  return e.descendants((n, a) => {
    if (n.type.name !== "blockquote") return !0;
    const s = n.firstChild;
    if (!s || s.type.name !== "paragraph") return !1;
    const i = s.firstChild;
    if (!i?.isText) return !1;
    const r = i.text?.match(B);
    if (!r) return !1;
    const c = r[1].toLowerCase();
    if (!se[c]) return !1;
    o.push(
      S.node(a, a + n.nodeSize, { class: `alert alert-${c}` })
    );
    const l = a + 2, _ = l + r[0].length;
    return t >= l && t <= _ || (o.push(S.inline(l, _, { class: "syntax-hidden" })), o.push(S.widget(l, ke(c), { side: -1 }))), !1;
  }), o;
}
function we(e) {
  e.core.ruler.push("alert_split", (t) => {
    const o = t.tokens;
    for (let n = 0; n < o.length; n++) {
      if (o[n]?.type !== "blockquote_open") continue;
      let a = 1, s = -1;
      for (let h = n + 1; h < o.length && a > 0; h++) {
        const f = o[h];
        if (f.type === "blockquote_open") {
          a++;
          continue;
        }
        if (f.type === "blockquote_close") {
          a--;
          continue;
        }
        a === 1 && f.type === "inline" && s < 0 && (s = h);
      }
      if (s < 0) continue;
      const i = o[s], r = i.content;
      if (!r.match(B)) continue;
      const l = r.indexOf(`
`);
      if (l < 0) continue;
      const _ = r.slice(0, l), u = r.slice(l + 1);
      i.content = _, i.children = [new t.Token("text", "", 0)], i.children[0].content = _;
      const m = [];
      m.push(new t.Token("paragraph_close", "p", -1));
      const d = new t.Token("paragraph_open", "p", 1);
      d.block = !0, m.push(d);
      const p = new t.Token("inline", "", 0);
      p.content = u, p.children = [new t.Token("text", "", 0)], p.children[0].content = u, p.block = !0, m.push(p), m.push(new t.Token("paragraph_close", "p", -1)), o.splice(s + 1, 1, ...m), n = s + m.length;
    }
    return !0;
  });
}
const xe = {
  name: "alert",
  mdItPlugins: [we],
  inline: {
    markNames: [],
    extRanges: (e) => {
      if (e.type.name !== "paragraph") return [];
      const t = e.textContent.match(B);
      return t ? [[0, t[0].length]] : [];
    }
  },
  plugins: (e) => [
    new v({
      key: new D("alert-decoration"),
      props: {
        decorations(t) {
          const o = ye(t.doc, t.selection.$head.pos);
          return o.length > 0 ? T.create(t.doc, o) : T.empty;
        }
      }
    })
  ]
}, ve = {
  id: "alert",
  register: ({ editor: e }) => [e.registerSyntaxFeature(xe)]
}, Te = { "[": "]", "(": ")" }, $e = /* @__PURE__ */ new Set(["]", ")"]);
function Se(e) {
  return e.length === 0 || /^\s/.test(e);
}
function Ee() {
  return new v({
    props: {
      handleTextInput(e, t, o, n) {
        if (e.editable === !1) return !0;
        if (t !== o) return !1;
        const a = e.state.doc.resolve(t);
        if (!a.parent.isTextblock) return !1;
        const s = a.parentOffset, i = a.parent.content.size, r = s < i ? a.parent.textBetween(s, s + 1) : "";
        if ($e.has(n) && r === n) {
          const u = e.state.tr.setSelection(
            w.create(e.state.doc, t + 1)
          );
          return e.dispatch(u), !0;
        }
        const c = Te[n];
        if (!c) return !1;
        const l = a.parent.textBetween(s, i);
        if (!Se(l)) return !1;
        const _ = e.state.tr.insertText(n + c, t, o);
        return _.setSelection(w.create(_.doc, t + 1)), e.dispatch(_), !0;
      }
    }
  });
}
const Ce = (e, t) => {
  const o = e.selection;
  if (!o.empty) return !1;
  const n = e.doc.resolve(o.from);
  if (!n.parent.isTextblock) return !1;
  const a = n.parentOffset, s = n.parent.content.size;
  if (a === 0 || a === s) return !1;
  const i = n.parent.textBetween(a - 1, a), r = n.parent.textBetween(a, a + 1);
  return i === "[" && r === "]" || i === "(" && r === ")" ? (t && t(e.tr.delete(o.from - 1, o.from + 1)), !0) : !1;
}, Me = {
  name: "auto_pair",
  plugins: () => [Ee()],
  keymap: (e) => ({
    Backspace: Ce
  })
}, Ae = {
  id: "autoPair",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Me)]
};
function qe(e, t) {
  return e[t].content;
}
function je(e, t, o, n, a) {
  const s = e.utils.arrayReplaceAt, i = e.utils.lib.ucmicro, r = new RegExp([i.Z.source, i.P.source, i.Cc.source].join("|"));
  function c(l, _, u) {
    let m = 0;
    const d = [];
    if (l.replace(a, function(p, h, f) {
      let b;
      if (Object.prototype.hasOwnProperty.call(o, p)) {
        if (b = o[p], h > 0 && !r.test(f[h - 1]) || h + p.length < f.length && !r.test(f[h + p.length]))
          return;
      } else
        b = p.slice(1, -1);
      if (h > m) {
        const y = new u("text", "", 0);
        y.content = l.slice(m, h), d.push(y);
      }
      const x = new u("emoji", "", 0);
      x.markup = b, x.content = t[b], d.push(x), m = h + p.length;
    }), m < l.length) {
      const p = new u("text", "", 0);
      p.content = l.slice(m), d.push(p);
    }
    return d;
  }
  return function(_) {
    let u;
    const m = _.tokens;
    let d = 0;
    for (let p = 0, h = m.length; p < h; p++) {
      if (m[p].type !== "inline")
        continue;
      let f = m[p].children;
      for (let b = f.length - 1; b >= 0; b--)
        u = f[b], (u.type === "link_open" || u.type === "link_close") && u.info === "auto" && (d -= u.nesting), u.type === "text" && d === 0 && n.test(u.content) && (m[p].children = f = s(
          f,
          b,
          c(u.content, u.level, _.Token)
        ));
    }
  };
}
function Ie(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
function De(e) {
  let t = e.defs;
  e.enabled.length && (t = Object.keys(t).reduce((r, c) => (e.enabled.indexOf(c) >= 0 && (r[c] = t[c]), r), {}));
  const o = Object.keys(e.shortcuts).reduce((r, c) => t[c] ? Array.isArray(e.shortcuts[c]) ? (e.shortcuts[c].forEach((l) => {
    r[l] = c;
  }), r) : (r[e.shortcuts[c]] = c, r) : r, {}), n = Object.keys(t);
  let a;
  n.length === 0 ? a = "^$" : a = n.map((r) => `:${r}:`).concat(Object.keys(o)).sort().reverse().map((r) => Ie(r)).join("|");
  const s = RegExp(a), i = RegExp(a, "g");
  return {
    defs: t,
    shortcuts: o,
    scanRE: s,
    replaceRE: i
  };
}
function Fe(e, t) {
  const n = De(Object.assign({}, {
    defs: {},
    shortcuts: {},
    enabled: []
  }, t || {}));
  e.renderer.rules.emoji = qe, e.core.ruler.after(
    "linkify",
    "emoji",
    je(e, n.defs, n.shortcuts, n.scanRE, n.replaceRE)
  );
}
const ze = {
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
}, H = ze, V = Object.keys(H).sort();
function ie(e, t) {
  let o = 0;
  for (; e[t + o] === "\\"; ) o++;
  return o;
}
const Re = (e, t, o) => {
  if (o.type !== "emoji") return null;
  const n = ie(e, t), a = `:${o.markup}:`;
  return e.startsWith(a, t + n) ? n + a.length : null;
};
function le(e, t) {
  let o = 0;
  for (let n = t - 1; n >= 0 && e[n] === "\\"; n--) o++;
  return o % 2 === 1;
}
function Ne(e) {
  const t = [];
  for (const o of e.tokens) {
    if (o.token.type !== "emoji" || !o.exact) continue;
    const n = o.pos + ie(e.text, o.pos);
    if (le(e.text, n)) continue;
    const a = `:${o.token.markup}:`;
    if (n + a.length !== o.end) continue;
    const s = pe(
      { token: o.token, pos: n, end: o.end, exact: !0, verified: !0 },
      {
        type: "emoji",
        widget: {
          kind: "emoji",
          // `len` 是 `:name:` 的长度（不含前置反斜杠串），点击后落到 span 尾部。
          attrs: { glyph: o.token.content, len: String(a.length) },
          when: "always",
          side: -1,
          stopEvents: !0
        }
      }
    );
    s && t.push(s);
  }
  return t;
}
const Oe = /\B:([a-z0-9_+\-]+)$/, F = 8, E = {
  open: !1,
  partial: "",
  matches: [],
  selected: 0,
  dismissedFor: "",
  from: 0,
  to: 0
}, $ = new D("emoji-autocomplete");
function Le(e) {
  const t = [];
  for (const o of V)
    if (o.startsWith(e) && t.push(o), t.length >= F) return t;
  if (t.length < F) {
    for (const o of V)
      if (!t.includes(o) && (o.includes(e) && t.push(o), t.length >= F))
        break;
  }
  return t;
}
function K(e, t) {
  const o = e.selection;
  if (!o.empty) return E;
  const n = o.$from;
  if (!n.parent.isTextblock) return E;
  const a = n.parent.textBetween(0, n.parentOffset, `
`, `
`), s = Oe.exec(a);
  if (!s || le(a, s.index)) return E;
  const i = s[1];
  if (t.dismissedFor === i)
    return { ...E, dismissedFor: i };
  const r = Le(i);
  if (r.length === 0) return E;
  const c = n.pos, _ = t.open && t.partial === i && t.matches.length === r.length ? Math.min(t.selected, r.length - 1) : 0;
  return {
    open: !0,
    partial: i,
    matches: r,
    selected: _,
    dismissedFor: "",
    from: c - i.length - 1,
    // points at `:`
    to: c
  };
}
function ce(e, t, o) {
  const n = `:${t}: `, a = e.state.tr.insertText(n, o.from, o.to), s = o.from + n.length;
  a.setSelection(w.create(a.doc, s)), e.dispatch(a);
}
function Pe() {
  return new v({
    key: $,
    state: {
      init: (e, t) => K(t, E),
      apply(e, t, o, n) {
        const a = e.getMeta($);
        if (a?.type === "select") {
          if (!t.open) return t;
          const s = t.matches.length - 1, i = Math.max(0, Math.min(s, a.index));
          return { ...t, selected: i };
        }
        return a?.type === "dismiss" ? { ...E, dismissedFor: t.partial } : K(n, t);
      }
    },
    props: {
      decorations(e) {
        const t = $.getState(e);
        if (!t?.open) return T.empty;
        const o = Be(t);
        return T.create(e.doc, [
          S.widget(t.to, o, {
            side: 1,
            key: `emoji-auto@${t.partial}@${t.selected}`,
            ignoreSelection: !0,
            stopEvent: () => !0
          })
        ]);
      },
      handleKeyDown(e, t) {
        const o = $.getState(e.state);
        if (!o?.open) return !1;
        if (t.key === "ArrowDown")
          return e.dispatch(
            e.state.tr.setMeta($, { type: "select", index: o.selected + 1 })
          ), t.preventDefault(), !0;
        if (t.key === "ArrowUp")
          return e.dispatch(
            e.state.tr.setMeta($, { type: "select", index: o.selected - 1 })
          ), t.preventDefault(), !0;
        if (t.key === "Enter" || t.key === "Tab") {
          const n = o.matches[o.selected];
          return n ? (ce(e, n, o), t.preventDefault(), !0) : !1;
        }
        return t.key === "Escape" ? (e.dispatch(e.state.tr.setMeta($, { type: "dismiss" })), t.preventDefault(), !0) : !1;
      }
    },
    // Position the popup below the cursor after every update. It uses
    // `position: fixed` with viewport coords from `coordsAtPos`, but the
    // widget lives inside the editor's DOM — if an ancestor is a fixed
    // containing block (via `contain: layout`, transform, etc.) the
    // coords must be rebased to that block (see reposition below).
    view(e) {
      const t = () => {
        const o = $.getState(e.state);
        if (!o?.open) return;
        const n = e.dom.querySelector(".emoji-completion");
        if (!n) return;
        const a = e.coordsAtPos(o.to, -1), i = n.offsetParent?.getBoundingClientRect() ?? { top: 0, left: 0 };
        n.style.top = `${a.bottom + 2 - i.top}px`, n.style.left = `${a.left - i.left}px`;
        const r = n.querySelector(".emoji-completion-row.selected");
        if (r) {
          const c = n.getBoundingClientRect(), l = r.getBoundingClientRect();
          l.top < c.top ? n.scrollTop -= c.top - l.top : l.bottom > c.bottom && (n.scrollTop += l.bottom - c.bottom);
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
function Be(e) {
  const t = document.createElement("div");
  t.className = "emoji-completion", t.setAttribute("contenteditable", "false"), t.addEventListener("mousedown", (o) => o.preventDefault());
  for (let o = 0; o < e.matches.length; o++) {
    const n = e.matches[o], a = document.createElement("div");
    a.className = "emoji-completion-row", o === e.selected && a.classList.add("selected"), a.dataset.name = n;
    const s = document.createElement("span");
    s.className = "emoji-completion-glyph", s.textContent = H[n] ?? "";
    const i = document.createElement("span");
    i.className = "emoji-completion-name", i.textContent = `:${n}:`, a.appendChild(s), a.appendChild(i), a.addEventListener("click", () => {
      t.dispatchEvent(
        new CustomEvent("emoji-autocomplete-pick", {
          bubbles: !0,
          detail: { name: n }
        })
      );
    }), t.appendChild(a);
  }
  return t;
}
function He() {
  return new v({
    view(e) {
      const t = (o) => {
        const n = o, a = $.getState(e.state);
        a?.open && ce(e, n.detail.name, a);
      };
      return e.dom.addEventListener("emoji-autocomplete-pick", t), {
        destroy() {
          e.dom.removeEventListener("emoji-autocomplete-pick", t);
        }
      };
    }
  });
}
function We() {
  return new v({
    props: {
      handleClick(e, t, o) {
        const a = o.target?.closest(".emoji-glyph");
        if (!a) return !1;
        const s = Number(a.getAttribute("data-len") ?? "0");
        if (!s) return !1;
        const i = e.posAtDOM(a, 0);
        if (i < 0) return !1;
        const r = i + s;
        return r > e.state.doc.content.size ? !1 : (o.preventDefault(), e.dispatch(
          e.state.tr.setSelection(w.create(e.state.doc, r))
        ), e.focus(), !0);
      }
    }
  });
}
const Ge = (e) => {
  const t = document.createElement("span");
  return t.className = "emoji-glyph", t.textContent = e.glyph ?? "", e.len && t.setAttribute("data-len", e.len), t;
}, Ue = {
  name: "emoji",
  // No mark, no node — pure decoration. The source chars are valid plain
  // text in md (no escape needed for `:`), so serialization is automatic.
  // `bare` installs the core replacement rule with only the shortcode table
  // (no `:)`-style shortcuts; those must stay plain text).
  mdItPlugins: [(e) => e.use(Fe, { defs: H, shortcuts: {} })],
  // Fallback for the legacy per-token load path: keep the source spelling.
  // 依赖 `shortcuts: {}`：shortcut 的 markup 是规范名而非源码短码，若启用
  // shortcuts 这里会把 `:)` 改写成 `:smile:`。
  parserTokens: {
    emoji: (e, t) => {
      e.addText(`:${t.markup}:`);
    }
  },
  plugins: () => [Pe(), He(), We()],
  inline: {
    // 四个迁移特性（highlight / sub-sup / math / emoji）都是 `order: -1`，
    // 组内次序由注册序决定；emoji 的 span 是原子（无 mark），先认领先占用，
    // 其余特性不得再认领其区间。
    order: -1,
    derive: Ne,
    tokenAdvance: Re,
    markNames: [],
    extRanges: () => [],
    decorationWidgets: { emoji: Ge }
  }
}, Ve = {
  id: "emoji",
  register: ({ editor: e }) => [e.registerSyntaxFeature(Ue)]
}, Ke = [
  ["path", "M7 4h4l3 8 3-8h4"],
  ["line", 4, 16, 10, 16],
  ["circle", 18, 6, 2]
], Z = /\[\^(\d+)\]/g;
function Ze(e) {
  let t = 0;
  return e.descendants((o) => {
    if (!o.isTextblock) return !0;
    const n = o.textContent;
    Z.lastIndex = 0;
    let a;
    for (; a = Z.exec(n); ) t = Math.max(t, parseInt(a[1], 10));
    return !0;
  }), t + 1;
}
const Xe = {
  id: "footnote",
  keyword: "footnote",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.footnote.label`）
  labelKey: "footnote.label",
  descriptionKey: "footnote.description",
  icon: Ke,
  defaultShortcut: "Cmd+Opt+F",
  category: "paragraph",
  order: 2,
  insert(e) {
    const t = e.state.schema, o = t.marks.footnote_ref;
    if (!o || !t.nodes.paragraph) return;
    const n = String(Ze(e.state.doc)), a = `[^${n}]`, { from: s, to: i } = e.state.selection, r = e.state.tr.insertText(a, s, i);
    r.addMark(s, s + a.length, o.create({ id: n }));
    const c = t.nodes.paragraph.create(null, t.text(`[^${n}]: `));
    r.insert(r.doc.content.size, c), e.dispatch(r), e.focus();
  }
};
function Je(e, t, o, n) {
  const a = Number(e[t].meta.id + 1).toString();
  let s = "";
  return typeof n.docId == "string" && (s = `-${n.docId}-`), s + a;
}
function Ye(e, t) {
  let o = Number(e[t].meta.id + 1).toString();
  return e[t].meta.subId > 0 && (o += `:${e[t].meta.subId}`), `[${o}]`;
}
function Qe(e, t, o, n, a) {
  const s = a.rules.footnote_anchor_name(e, t, o, n, a), i = a.rules.footnote_caption(e, t, o, n, a);
  let r = s;
  return e[t].meta.subId > 0 && (r += `:${e[t].meta.subId}`), `<sup class="footnote-ref"><a href="#fn${s}" id="fnref${r}">${i}</a></sup>`;
}
function et(e, t, o) {
  return (o.xhtmlOut ? `<hr class="footnotes-sep" />
` : `<hr class="footnotes-sep">
`) + `<section class="footnotes">
<ol class="footnotes-list">
`;
}
function tt() {
  return `</ol>
</section>
`;
}
function nt(e, t, o, n, a) {
  let s = a.rules.footnote_anchor_name(e, t, o, n, a);
  return e[t].meta.subId > 0 && (s += `:${e[t].meta.subId}`), `<li id="fn${s}" class="footnote-item">`;
}
function ot() {
  return `</li>
`;
}
function rt(e, t, o, n, a) {
  let s = a.rules.footnote_anchor_name(e, t, o, n, a);
  return e[t].meta.subId > 0 && (s += `:${e[t].meta.subId}`), ` <a href="#fnref${s}" class="footnote-backref">↩︎</a>`;
}
function at(e) {
  const t = e.helpers.parseLinkLabel, o = e.utils.isSpace;
  e.renderer.rules.footnote_ref = Qe, e.renderer.rules.footnote_block_open = et, e.renderer.rules.footnote_block_close = tt, e.renderer.rules.footnote_open = nt, e.renderer.rules.footnote_close = ot, e.renderer.rules.footnote_anchor = rt, e.renderer.rules.footnote_caption = Ye, e.renderer.rules.footnote_anchor_name = Je;
  function n(r, c, l, _) {
    const u = r.bMarks[c] + r.tShift[c], m = r.eMarks[c];
    if (u + 4 > m || r.src.charCodeAt(u) !== 91 || r.src.charCodeAt(u + 1) !== 94) return !1;
    let d;
    for (d = u + 2; d < m; d++) {
      if (r.src.charCodeAt(d) === 32) return !1;
      if (r.src.charCodeAt(d) === 93)
        break;
    }
    if (d === u + 2 || d + 1 >= m || r.src.charCodeAt(++d) !== 58) return !1;
    if (_) return !0;
    d++, r.env.footnotes || (r.env.footnotes = {}), r.env.footnotes.refs || (r.env.footnotes.refs = {});
    const p = r.src.slice(u + 2, d - 2);
    r.env.footnotes.refs[`:${p}`] = -1;
    const h = new r.Token("footnote_reference_open", "", 1);
    h.meta = { label: p }, h.level = r.level++, r.tokens.push(h);
    const f = r.bMarks[c], b = r.tShift[c], x = r.sCount[c], y = r.parentType, k = d, C = r.sCount[c] + d - (r.bMarks[c] + r.tShift[c]);
    let A = C;
    for (; d < m; ) {
      const U = r.src.charCodeAt(d);
      if (o(U))
        U === 9 ? A += 4 - A % 4 : A++;
      else
        break;
      d++;
    }
    r.tShift[c] = d - k, r.sCount[c] = A - C, r.bMarks[c] = k, r.blkIndent += 4, r.parentType = "footnote", r.sCount[c] < r.blkIndent && (r.sCount[c] += r.blkIndent), r.md.block.tokenize(r, c, l, !0), r.parentType = y, r.blkIndent -= 4, r.tShift[c] = b, r.sCount[c] = x, r.bMarks[c] = f;
    const G = new r.Token("footnote_reference_close", "", -1);
    return G.level = --r.level, r.tokens.push(G), !0;
  }
  function a(r, c) {
    const l = r.posMax, _ = r.pos;
    if (_ + 2 >= l || r.src.charCodeAt(_) !== 94 || r.src.charCodeAt(_ + 1) !== 91) return !1;
    const u = _ + 2, m = t(r, _ + 1);
    if (m < 0) return !1;
    if (!c) {
      r.env.footnotes || (r.env.footnotes = {}), r.env.footnotes.list || (r.env.footnotes.list = []);
      const d = r.env.footnotes.list.length, p = [];
      r.md.inline.parse(
        r.src.slice(u, m),
        r.md,
        r.env,
        p
      );
      const h = r.push("footnote_ref", "", 0);
      h.meta = { id: d }, r.env.footnotes.list[d] = {
        content: r.src.slice(u, m),
        tokens: p
      };
    }
    return r.pos = m + 1, r.posMax = l, !0;
  }
  function s(r, c) {
    const l = r.posMax, _ = r.pos;
    if (_ + 3 > l || !r.env.footnotes || !r.env.footnotes.refs || r.src.charCodeAt(_) !== 91 || r.src.charCodeAt(_ + 1) !== 94) return !1;
    let u;
    for (u = _ + 2; u < l; u++) {
      if (r.src.charCodeAt(u) === 32 || r.src.charCodeAt(u) === 10) return !1;
      if (r.src.charCodeAt(u) === 93)
        break;
    }
    if (u === _ + 2 || u >= l) return !1;
    u++;
    const m = r.src.slice(_ + 2, u - 1);
    if (typeof r.env.footnotes.refs[`:${m}`] > "u") return !1;
    if (!c) {
      r.env.footnotes.list || (r.env.footnotes.list = []);
      let d;
      r.env.footnotes.refs[`:${m}`] < 0 ? (d = r.env.footnotes.list.length, r.env.footnotes.list[d] = { label: m, count: 0 }, r.env.footnotes.refs[`:${m}`] = d) : d = r.env.footnotes.refs[`:${m}`];
      const p = r.env.footnotes.list[d].count;
      r.env.footnotes.list[d].count++;
      const h = r.push("footnote_ref", "", 0);
      h.meta = { id: d, subId: p, label: m };
    }
    return r.pos = u, r.posMax = l, !0;
  }
  function i(r) {
    let c, l, _, u = !1;
    const m = {};
    if (!r.env.footnotes || (r.tokens = r.tokens.filter(function(p) {
      return p.type === "footnote_reference_open" ? (u = !0, l = [], _ = p.meta.label, !1) : p.type === "footnote_reference_close" ? (u = !1, m[":" + _] = l, !1) : (u && l.push(p), !u);
    }), !r.env.footnotes.list))
      return;
    const d = r.env.footnotes.list;
    r.tokens.push(new r.Token("footnote_block_open", "", 1));
    for (let p = 0, h = d.length; p < h; p++) {
      const f = new r.Token("footnote_open", "", 1);
      if (f.meta = { id: p, label: d[p].label }, r.tokens.push(f), d[p].tokens) {
        c = [];
        const y = new r.Token("paragraph_open", "p", 1);
        y.block = !0, c.push(y);
        const k = new r.Token("inline", "", 0);
        k.children = d[p].tokens, k.content = d[p].content, c.push(k);
        const C = new r.Token("paragraph_close", "p", -1);
        C.block = !0, c.push(C);
      } else d[p].label && (c = m[`:${d[p].label}`]);
      c && (r.tokens = r.tokens.concat(c));
      let b;
      r.tokens[r.tokens.length - 1].type === "paragraph_close" ? b = r.tokens.pop() : b = null;
      const x = d[p].count > 0 ? d[p].count : 1;
      for (let y = 0; y < x; y++) {
        const k = new r.Token("footnote_anchor", "", 0);
        k.meta = { id: p, subId: y, label: d[p].label }, r.tokens.push(k);
      }
      b && r.tokens.push(b), r.tokens.push(new r.Token("footnote_close", "", -1));
    }
    r.tokens.push(new r.Token("footnote_block_close", "", -1));
  }
  e.block.ruler.before("reference", "footnote_def", n, { alt: ["paragraph", "reference"] }), e.inline.ruler.after("image", "footnote_inline", a), e.inline.ruler.after("footnote_inline", "footnote_ref", s), e.core.ruler.after("inline", "footnote_tail", i);
}
const ue = /^\[\^([^\]]+)\]:/;
function X(e) {
  return e.type.name === "paragraph" && ue.test(e.textContent);
}
function J(e) {
  const t = ue.exec(e.textContent);
  return t ? t[1] : "";
}
function st(e, t) {
  const o = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), n = new RegExp(`^\\[\\^${o}\\]:`), a = e.split(/(?<=\n)/), s = [];
  let i = 0;
  for (const l of a)
    s.push(i), i += l.length;
  const r = (l) => a[l].replace(/\r?\n$/, ""), c = (l) => /^( {4,}|\t)/.test(r(l));
  for (let l = 0; l < a.length; l++) {
    if (!n.test(a[l])) continue;
    const _ = s[l];
    let u = l + 1;
    for (; u < a.length; ) {
      if (r(u).trim() === "") {
        let d = u + 1;
        for (; d < a.length && r(d).trim() === ""; ) d++;
        if (d < a.length && c(d)) {
          u = d;
          continue;
        }
        break;
      }
      if (c(u)) {
        u++;
        continue;
      }
      break;
    }
    const m = u < a.length ? s[u] : e.length;
    return { start: _, end: m, raw: e.slice(_, m) };
  }
  return null;
}
const it = {
  matches: X,
  keyOf: J,
  collect(e, t) {
    const o = [];
    return t.forEach((n) => {
      if (!X(n)) return;
      const a = J(n);
      if (!a) return;
      const s = st(e, a);
      s && o.push({ ...s, key: a });
    }), o;
  },
  render(e, t) {
    return t(e);
  }
}, Y = /\[\^(\d+)\]/g, O = /^\[\^(\d+)\]:\s*/, q = /* @__PURE__ */ new WeakMap();
function lt(e, t) {
  const o = [];
  Y.lastIndex = 0;
  let n;
  for (; n = Y.exec(e); ) {
    const a = n.index, s = a + n[0].length, i = n[1];
    if (a === 0) continue;
    const r = a, c = a + 2, l = s - 1, _ = s;
    let u = !1;
    for (let m = r; m < c; m++)
      if (t[m]) {
        u = !0;
        break;
      }
    if (!u) {
      for (let m = l; m < _; m++)
        if (t[m]) {
          u = !0;
          break;
        }
    }
    u || (I(t, a, s), o.push({
      type: "footnote_ref",
      from: a,
      to: s,
      openFrom: a,
      openTo: a,
      closeFrom: s,
      closeTo: s,
      wrap: !0,
      delimRanges: [
        { from: r, to: c },
        { from: l, to: _ }
      ],
      attrs: { id: i }
    }));
  }
  return o;
}
function ct(e, t) {
  let o = !1;
  return e.doc.descendants((n) => {
    if (o) return !1;
    if (n.isText) {
      for (const a of n.marks)
        if (a.type.name === "footnote_ref" && a.attrs.id === t)
          return o = !0, !1;
    }
    return !0;
  }), o;
}
function ut(e, t) {
  let o = -1;
  e.state.doc.descendants((n, a) => n.type.name === "paragraph" && n.textContent.startsWith(`[^${t}]:`) ? (o = a + n.nodeSize - 1, !1) : !0), !(o < 0) && e.dispatch(e.state.tr.setSelection(w.near(e.state.doc.resolve(o))).scrollIntoView());
}
function _t(e, t) {
  const o = e.state.schema.marks.footnote_ref;
  let n = -1;
  e.state.doc.descendants((a, s) => {
    const i = a.text;
    return i && a.isText && a.marks.some((r) => r.type === o && r.attrs.id === t) ? (n = s + i.length, !1) : !0;
  }), !(n < 0) && (e.dispatch(e.state.tr.setSelection(w.create(e.state.doc, n)).scrollIntoView()), e.focus());
}
function mt() {
  return new v({
    props: {
      decorations(e) {
        const t = [];
        return e.doc.descendants((o, n) => {
          if (o.type.name !== "paragraph") return !0;
          const a = o.textContent, s = O.exec(a);
          if (!s) return !0;
          const i = s[1], r = i.length, c = s[0].length, l = n + 1, _ = l + a.length, u = e.selection.from, d = u >= l && u < _ ? "syntax-hint" : "syntax-hidden";
          if (t.push(S.inline(l, l + 2, { class: d })), t.push(S.inline(l + 2 + r, l + c, { class: d })), t.push(S.inline(l + 2, l + 2 + r, { class: "fn-def-num" })), ct(e, i)) {
            const p = document.createElement("span");
            p.className = "md-reverse-footnote-area", p.setAttribute("contenteditable", "false"), p.appendChild(document.createTextNode(" "));
            const h = document.createElement("a");
            h.className = "reversefootnote", h.setAttribute("href", "#"), h.setAttribute("title", "回到文档"), h.setAttribute("data-index", "0"), h.textContent = "↩", p.appendChild(h), t.push(S.widget(n + o.nodeSize - 1, p, {
              side: 1,
              stopEvent: (f) => f.type !== "click"
            }));
          }
          return !0;
        }), t.length ? T.create(e.doc, t) : T.empty;
      }
    },
    view(e) {
      const t = (s) => {
        const i = s.target instanceof Element ? s.target : s.target.parentElement;
        if (!i) return;
        const r = i.closest("sup.footnote-ref");
        if (r && (s.metaKey || s.ctrlKey)) {
          s.preventDefault(), s.stopPropagation();
          const l = r.getAttribute("data-ref");
          l && ut(e, l);
          return;
        }
        const c = i.closest(".reversefootnote");
        if (c) {
          if (s.button !== 0) return;
          s.preventDefault(), s.stopPropagation();
          const l = c.closest("p");
          if (l) {
            const _ = O.exec(l.textContent ?? "");
            _ && _t(e, _[1]);
          }
        }
      };
      let o = null;
      const n = (s) => {
        let i = "";
        return e.state.doc.descendants((r) => r.type.name === "paragraph" && r.textContent.startsWith(`[^${s}]:`) ? (i = r.textContent.replace(/^\[\^\d+\]:\s*/, ""), !1) : !0), i;
      }, a = (s) => {
        const i = s.target instanceof Element ? s.target : s.target.parentElement;
        if (!i) return;
        const r = i.closest("sup.footnote-ref");
        if (!r) {
          o?.remove(), o = null;
          return;
        }
        if (o) return;
        const c = r.getAttribute("data-ref");
        if (!c) return;
        const l = n(c);
        if (!l) return;
        const _ = r.getBoundingClientRect(), u = document.createElement("div");
        u.className = "fn-tooltip", u.textContent = l, document.body.appendChild(u), u.style.top = `${_.bottom + 6}px`, u.style.left = `${_.left}px`, o = u;
      };
      return e.dom.addEventListener("mouseover", a), e.dom.addEventListener("mouseout", a), e.dom.addEventListener("mousedown", t, !0), {
        destroy() {
          e.dom.removeEventListener("mouseover", a), e.dom.removeEventListener("mouseout", a), e.dom.removeEventListener("mousedown", t, !0), o?.remove();
        }
      };
    }
  });
}
const dt = {
  name: "footnote",
  mdItPlugins: [(e) => e.use(at)],
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
      const n = String(t.meta?.label ?? t.content ?? "");
      n && (e.openMark(o.marks.footnote_ref.create({ id: n })), e.addText(`[^${n}]`), e.closeMarkType(o.marks.footnote_ref));
    },
    footnote_open: (e, t, o) => {
      const n = String(t.meta?.label ?? t.content ?? "");
      q.set(e, n), e.openNode(o.nodes.paragraph), e.addText(`[^${n}]: `);
    },
    footnote_close: (e, t, o) => {
      q.delete(e), e.closeNode();
    },
    paragraph_open: (e, t, o) => {
      q.get(e) || e.openNode(o.nodes.paragraph);
    },
    paragraph_close: (e, t, o) => {
      q.get(e) || e.closeNode();
    }
  },
  markDelims: {
    footnote_ref: { open: "", close: "" }
  },
  inline: {
    order: 1.1,
    derive: (e) => lt(e.text, e.consumed),
    markNames: ["footnote_ref"],
    extRanges: (e) => {
      const t = [], o = e.type.schema.marks.footnote_ref;
      if (!o) return t;
      let n = -1, a = null;
      const s = (l) => {
        n < 0 || !a || (t.push([n, l]), n = -1, a = null);
      };
      let i = 0;
      e.forEach((l) => {
        if (l.isText) {
          const _ = l.marks.find((u) => u.type === o) ?? null;
          _ ? n < 0 ? (n = i, a = _) : a && !_.eq(a) && (s(i), n = i, a = _) : s(i);
        }
        i += l.nodeSize;
      }), s(i);
      const r = e.textContent, c = O.exec(r);
      return c && t.push([0, c[0].length]), t;
    }
  },
  plugins: () => [mt()],
  sourceVerbatim: it
}, pt = {
  id: "footnote",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(dt),
    e.registerExtension({
      id: "footnote.editor",
      insert: Xe,
      create() {
        return {};
      }
    })
  ]
}, z = "headingTypeIndicator_focus";
function ft(e) {
  const t = new D("headingTypeIndicator");
  let o = !1;
  return new v({
    key: t,
    state: {
      init: () => T.empty,
      apply: (n, a, s, i) => {
        const r = n.getMeta(z);
        return r !== void 0 && (o = r), o ? ht(i) : T.empty;
      }
    },
    props: {
      decorations(n) {
        return t.getState(n);
      },
      handleDOMEvents: {
        focus: (n) => (o || n.dispatch(n.state.tr.setMeta(z, !0)), !1),
        blur: (n) => (o && n.dispatch(n.state.tr.setMeta(z, !1)), !1)
      }
    }
  });
}
function Q(e) {
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
function ht(e) {
  const { $from: t, $to: o } = e.selection, n = Q(t) ?? Q(o);
  if (!n || n.level < 1 || n.level > 6)
    return T.empty;
  const a = S.node(n.from, n.to, {
    class: "heading-type-indicator",
    "data-label": `H${n.level}`
  });
  return T.create(e.doc, [a]);
}
const gt = {
  name: "heading-type-indicator",
  plugins: (e) => [ft()]
}, bt = {
  id: "headingIndicator",
  register: ({ editor: e }) => [e.registerSyntaxFeature(gt)]
}, kt = {
  id: "highlight",
  markName: "highlight",
  delim: "==",
  labelKey: "highlight.label",
  icon: "highlighter",
  order: 3
}, yt = [
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
], wt = yt[0], R = "texto-plugin-highlight-color";
function xt(e) {
  const t = `color-mix(in oklab, ${e} 35%, transparent)`, o = `color-mix(in oklab, ${e} 50%, transparent)`;
  return `:root{--highlight-color:${t}}:root.dark{--highlight-color:${o}}`;
}
function vt(e) {
  const t = typeof e == "string" && /^#[0-9a-fA-F]{6}$/.test(e) ? e : wt;
  let o = document.getElementById(R);
  return o || (o = document.createElement("style"), o.id = R, document.head.appendChild(o)), o.textContent = xt(t), {
    dispose() {
      document.getElementById(R)?.remove();
    }
  };
}
function Tt(e) {
  function t(n, a) {
    const s = n.pos, i = n.src.charCodeAt(s);
    if (a || i !== 61)
      return !1;
    const r = n.scanDelims(n.pos, !0);
    let c = r.length;
    const l = String.fromCharCode(i);
    if (c < 2)
      return !1;
    if (c % 2) {
      const _ = n.push("text", "", 0);
      _.content = l, c--;
    }
    for (let _ = 0; _ < c; _ += 2) {
      const u = n.push("text", "", 0);
      u.content = l + l, !(!r.can_open && !r.can_close) && n.delimiters.push({
        marker: i,
        length: 0,
        // disable "rule of 3" length checks meant for emphasis
        jump: _ / 2,
        // 1 delimiter = 2 characters
        token: n.tokens.length - 1,
        end: -1,
        open: r.can_open,
        close: r.can_close
      });
    }
    return n.pos += r.length, !0;
  }
  function o(n, a) {
    const s = [], i = a.length;
    for (let r = 0; r < i; r++) {
      const c = a[r];
      if (c.marker !== 61 || c.end === -1)
        continue;
      const l = a[c.end], _ = n.tokens[c.token];
      _.type = "mark_open", _.tag = "mark", _.nesting = 1, _.markup = "==", _.content = "";
      const u = n.tokens[l.token];
      u.type = "mark_close", u.tag = "mark", u.nesting = -1, u.markup = "==", u.content = "", n.tokens[l.token - 1].type === "text" && n.tokens[l.token - 1].content === "=" && s.push(l.token - 1);
    }
    for (; s.length; ) {
      const r = s.pop();
      let c = r + 1;
      for (; c < n.tokens.length && n.tokens[c].type === "mark_close"; )
        c++;
      if (c--, r !== c) {
        const l = n.tokens[c];
        n.tokens[c] = n.tokens[r], n.tokens[r] = l;
      }
    }
  }
  e.inline.ruler.before("emphasis", "mark", t), e.inline.ruler2.before("emphasis", "mark", function(n) {
    let a;
    const s = n.tokens_meta, i = (n.tokens_meta || []).length;
    for (o(n, n.delimiters), a = 0; a < i; a++)
      s[a] && s[a].delimiters && o(n, s[a].delimiters);
  });
}
const $t = {
  name: "highlight",
  marks: {
    highlight: {
      parseDOM: [{ tag: "mark" }],
      toDOM: () => ["mark", 0]
    }
  },
  mdItPlugins: [(e) => e.use(Tt)],
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
    derive: (e) => N(e, { open: "mark_open", close: "mark_close", mark: "highlight" }),
    markNames: ["highlight"],
    extRanges: (e) => M(e, "highlight", 2)
  }
}, St = {
  id: "highlight",
  register: ({ editor: e, settings: t }) => [
    e.registerSyntaxFeature($t),
    e.registerFormatToolbarItem(kt),
    // 颜色样式表随特性一起释放：关闭高亮（或改色触发重装）时先移除再重建
    vt(t.get("highlightColor"))
  ]
}, L = /* @__PURE__ */ new Set();
function Et(e) {
  return L.add(e), () => L.delete(e);
}
function Ct() {
  for (const e of L) e();
}
const Mt = /* @__PURE__ */ new Set([
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
]), At = /* @__PURE__ */ new Set(["script", "pre", "style", "textarea"]);
function _e(e) {
  if (/^\s{0,3}<!--$/.test(e)) return { tag: "!" };
  const t = e.match(/^\s{0,3}<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)>?$/);
  if (!t || t[1] === "/") return null;
  const o = (t[2] ?? "").toLowerCase(), n = At.has(o);
  return !Mt.has(o) && !n || !e.trimEnd().endsWith(">") && !n ? null : { tag: o };
}
const me = /* @__PURE__ */ new Set([
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
function qt(e) {
  const t = {}, o = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let n;
  for (; n = o.exec(e); ) {
    const a = n[2] ?? n[3] ?? n[4] ?? "";
    a && (t[n[1]] = a);
  }
  return t;
}
function ee(e, t) {
  const o = [];
  let n = 0;
  for (; n < e.length; ) {
    if (t[n] || e[n] !== "<") {
      n++;
      continue;
    }
    const a = e[n + 1];
    if (!a || a === "/" || a === "!") {
      n++;
      continue;
    }
    const s = n + 1;
    let i = s;
    for (; i < e.length && /[a-zA-Z]/.test(e[i]); ) i++;
    if (i === s) {
      n++;
      continue;
    }
    const r = e.slice(s, i).toLowerCase();
    if (!me.has(r)) {
      n++;
      continue;
    }
    const c = i;
    let l = -1, _ = !1;
    for (let k = c; k < e.length; k++) {
      if (t[k]) {
        _ = !0;
        break;
      }
      if (e[k] === ">") {
        l = k + 1;
        break;
      }
    }
    if (_ || l === -1) {
      n = l > 0 ? l : i;
      continue;
    }
    for (let k = n; k < l; k++)
      if (t[k]) {
        _ = !0;
        break;
      }
    if (_) {
      n = l;
      continue;
    }
    const u = e.slice(c, l - 1).trim(), m = qt(u), d = `</${r}>`;
    let p = -1;
    for (let k = l; k < e.length; k++)
      if (!t[k] && e.startsWith(d, k)) {
        p = k;
        break;
      }
    if (p === -1) {
      n = l;
      continue;
    }
    const h = p + d.length;
    for (let k = p; k < h; k++)
      if (t[k]) {
        _ = !0;
        break;
      }
    if (_) {
      n = h;
      continue;
    }
    const f = l, b = p;
    if (f >= b) {
      n = h;
      continue;
    }
    I(t, n, l), I(t, p, h);
    const x = l - n, y = h - p;
    o.push({
      type: "html_inline",
      from: f,
      to: b,
      openFrom: n,
      openTo: l,
      closeFrom: p,
      closeTo: h,
      attrs: { tag: r, htmlAttrs: m, openLen: x, closeLen: y }
    }), n = h;
  }
  return o;
}
function jt(e) {
  return fe({
    match: (t) => {
      const o = _e(t);
      return o ? { data: o, prefixLen: t.match(/^\s*/)?.[0].length ?? 0 } : null;
    },
    draftClass: () => "html-block-draft",
    commit: (t, o, n, a) => {
      const s = a.tag === "!" ? "<!--" : n.textContent.trim(), i = a.tag === "!" ? "-->" : `</${a.tag}>`, r = e.nodes.html_block.create(
        null,
        e.text(s + `
` + i)
      );
      t.replaceWith(o, o + n.nodeSize, r);
    }
  });
}
function It() {
  return new v({
    props: {
      nodeViews: {
        html_block: (e, t, o) => {
          const n = document.createElement("html-block"), a = document.createElement("div");
          a.className = "html-block-code", n.setAttribute("data-export", "html"), a.setAttribute("data-export-source", ""), n.appendChild(a);
          const s = document.createElement("div");
          s.className = "html-block-render", s.contentEditable = "false", s.style.display = "none", n.appendChild(s);
          let i = null, r = !1, c = e;
          return Promise.resolve().then(() => $n).then(({ createHtmlBlockView: l }) => {
            r || (i = l({ dom: n, contentDOM: a, renderContainer: s, view: t, getPos: o, node: c }), i.update(c));
          }).catch(() => {
          }), {
            dom: n,
            contentDOM: a,
            update(l) {
              return c = l, i ? i.update(l) : !0;
            },
            destroy() {
              r = !0, i?.destroy();
            },
            stopEvent(l) {
              return i?.stopEvent(l) ?? !1;
            },
            ignoreMutation(l) {
              return i?.ignoreMutation(l) ?? !1;
            }
          };
        }
      }
    }
  });
}
function Dt() {
  const e = new D("htmlBlockSelectionWatcher");
  return new v({
    key: e,
    view: () => ({
      update: (t, o) => {
        const n = o.selection, a = t.state.selection;
        (n.from !== a.from || n.to !== a.to) && Ct();
      }
    })
  });
}
const Ft = {
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
    jt(e).plugin,
    It(),
    Dt()
  ],
  keymap: (e) => ({
    Enter: (t, o) => {
      const n = t.selection;
      if (!n.empty) return !1;
      const a = n.$from, s = a.parent;
      if (s.type.name !== "paragraph") return !1;
      const i = _e(s.textContent);
      if (!i) return !1;
      if (o) {
        const r = i.tag === "!" ? "<!--" : s.textContent.trim(), c = i.tag === "!" ? "-->" : `</${i.tag}>`, l = a.before(), _ = e.nodes.html_block.create(null, e.text(r + `
` + c)), u = t.tr.replaceWith(l, l + s.nodeSize, _);
        u.setSelection(w.create(u.doc, l + 1 + r.length + 1)), o(u);
      }
      return !0;
    },
    Backspace: (t, o) => {
      const n = t.selection;
      if (!n.empty) return !1;
      const a = n.$from;
      if (a.parent.type.name !== "html_block" || a.parent.content.size > 0) return !1;
      if (o) {
        const s = a.before(), i = a.parent.nodeSize, r = t.tr.delete(s, s + i);
        if (r.doc.content.size === 0) {
          const c = e.nodes.paragraph.createAndFill();
          c && r.insert(0, c);
        }
        o(r);
      }
      return !0;
    },
    ArrowDown: (t, o) => {
      const n = t.selection;
      if (!n.empty) return !1;
      const a = n.$from, s = t.schema.nodes.html_block;
      if (a.parent.type === s) {
        if (a.parent.textContent.slice(a.parentOffset).includes(`
`)) return !1;
        if (o) {
          const u = t.tr, m = a.after(), d = u.doc.content.size;
          if (m >= d) {
            const p = t.schema.nodes.paragraph.create();
            u.insert(m, p);
          }
          u.setSelection(w.create(u.doc, m + 1)), o(u);
        }
        return !0;
      }
      if (!a.parent.isTextblock || a.parent.textContent.slice(a.parentOffset).includes(`
`)) return !1;
      const c = t.doc.nodeAt(a.after());
      return !c || c.type !== s || c.textContent.trim() === "" ? !1 : (o && o(t.tr.setSelection(w.create(t.tr.doc, a.after() + 1))), !0);
    },
    ArrowUp: (t, o) => {
      const n = t.selection;
      if (!n.empty) return !1;
      const a = n.$from, s = t.schema.nodes.html_block;
      if (!a.parent.isTextblock || a.parent.textContent.slice(0, a.parentOffset).includes(`
`)) return !1;
      const l = t.doc.resolve(a.before()).nodeBefore;
      return !l || l.type !== s || l.textContent.trim() === "" ? !1 : (o && o(t.tr.setSelection(w.create(t.tr.doc, a.before() - 1))), !0);
    }
  }),
  parserTokens: {
    html_block: (e, t, o) => {
      const n = t.content.replace(/\n$/, ""), a = n ? [o.text(n)] : [];
      e.push(o.nodes.html_block.create(null, a));
    }
  }
}, te = /<!--([\s\S]*?)-->/g;
function zt(e, t) {
  const o = [];
  te.lastIndex = 0;
  let n;
  for (; n = te.exec(e); ) {
    const a = n.index, s = a + n[0].length;
    let i = !1;
    for (let r = a; r < s; r++)
      if (t[r]) {
        i = !0;
        break;
      }
    i || (I(t, a, s), o.push({
      type: "html_comment",
      from: a,
      to: s,
      openFrom: a,
      openTo: a,
      closeFrom: s,
      closeTo: s,
      opaque: !0
    }));
  }
  return o;
}
const Rt = {
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
    derive: (e) => zt(e.text, e.consumed),
    markNames: ["html_comment"],
    extRanges: (e) => {
      const t = [], o = e.type.schema.marks.html_comment;
      if (!o) return t;
      let n = -1, a = 0;
      const s = (i) => {
        n >= 0 && t.push([n, i]), n = -1;
      };
      return e.forEach((i) => {
        i.isText && (i.marks.some((c) => c.type === o) ? n < 0 && (n = a) : s(a)), a += i.nodeSize;
      }), s(a), t;
    }
  }
}, Nt = {
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
          if (!me.has(o)) return !1;
          const n = {};
          for (const a of t.attributes)
            a.name.startsWith("data-") || (n[a.name] = a.value);
          return { tag: o, htmlAttrs: n, openLen: 0, closeLen: 0 };
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
    derive: (e) => ee(e.text, e.consumed),
    markNames: ["html_inline"],
    extRanges: (e) => {
      const t = [], o = e.type.schema.marks.html_inline;
      if (!o) return t;
      let n = -1, a = 0, s = 0, i = 0;
      const r = (c) => {
        n >= 0 && t.push([n - a, c + s]), n = -1;
      };
      return e.forEach((c) => {
        if (c.isText) {
          const l = c.marks.find((_) => _.type === o);
          if (l && n < 0) {
            n = i;
            const _ = l.attrs;
            a = _.openLen ?? 0, s = _.closeLen ?? 0;
          } else l || r(i);
        }
        i += c.nodeSize;
      }), r(i), t;
    }
  },
  parserPostProcess: (e) => {
    const t = e.type.schema.marks.html_inline;
    if (!t) return e;
    const o = new be(e);
    let n = !1;
    return e.descendants((a, s) => {
      if (!a.isTextblock || a.type.name === "code_block") return !0;
      const i = a.textContent, r = ee(i, new Uint8Array(i.length));
      if (r.length === 0) return !0;
      const c = s + 1;
      for (const l of r)
        l.type === "html_inline" && (o.addMark(c + l.from, c + l.to, t.create(l.attrs)), n = !0);
      return !1;
    }), n ? o.doc : e;
  }
}, Ot = {
  name: "html:md-config",
  mdItPlugins: [
    (e) => {
      e.set({ html: !0 }), e.inline.ruler.disable(["html_inline"]);
    }
  ]
}, Lt = {
  id: "html",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(Ot),
    e.registerSyntaxFeature(Ft),
    e.registerSyntaxFeature(Nt),
    e.registerSyntaxFeature(Rt)
  ]
}, Pt = ["latex", "math"], Bt = {
  id: "math.copy-latex",
  labelKey: "math.copyLatex",
  requires: ["block"],
  order: 10,
  when: (e) => {
    const t = e.block?.node;
    return t?.type.name === "code_block" && Pt.includes(t.attrs.lang);
  },
  run: (e) => {
    const t = e.block?.node;
    if (t)
      return navigator.clipboard.writeText(t.textContent);
  }
}, Ht = [["path", "M18 7V4H6l6 8-6 8h12v-3"]], Wt = {
  // 裸 slug：宿主按 id 去重，且与快捷键/命令分发保持一致。
  id: "math.insert",
  keyword: "math",
  labelKey: "math.mathBlock",
  descriptionKey: "math.mathBlockDesc",
  icon: Ht,
  defaultShortcut: "Cmd+Shift+M",
  category: "paragraph",
  order: 3,
  insert(e) {
    const o = e.state.schema.nodes.code_block;
    if (!o) return;
    const { $from: n } = e.state.selection, a = e.state.tr.replaceWith(
      n.before(),
      n.after(),
      o.create({ lang: "latex" })
    );
    e.dispatch(a), e.focus();
  }
};
function Gt(e) {
  const t = document.createElement("div");
  t.className = "math-preview";
  let o = 0;
  return {
    dom: t,
    update(n, a) {
      const s = ++o, i = n.textContent;
      if (!i.trim()) {
        t.innerHTML = '<div class="cb-render-empty">Empty formula</div>';
        return;
      }
      t.innerHTML = '<div class="cb-render-loading">Rendering...</div>', ae(i, {
        mode: "display",
        decorate: (r) => {
          r.style.maxWidth = "100%", r.style.height = "auto";
        }
      }).then((r) => {
        s === o && (t.innerHTML = `<div class="math-svg-container">${r}</div>`);
      }).catch((r) => {
        s === o && a.onError(r?.message ?? String(r));
      });
    },
    destroy() {
      o += 1;
    }
  };
}
const ne = {
  $: { close: "$" },
  "\\(": { close: "\\)", openClass: "math-delim-open", closeClass: "math-delim-close" }
};
function W(e) {
  return Object.prototype.hasOwnProperty.call(ne, e) ? ne[e] : null;
}
function Ut({
  text: e,
  pos: t,
  token: o
}) {
  const n = W(o.markup);
  if (!n) return null;
  const a = o.content, s = t, i = s + o.markup.length;
  if (!e.startsWith(o.markup, s) || !e.startsWith(a, i)) return null;
  const r = i + a.length;
  if (!e.startsWith(n.close, r)) return null;
  const c = r + n.close.length;
  let l = i, _ = r;
  for (; l < _ && /\s/.test(e[l]); ) l++;
  for (; _ > l && /\s/.test(e[_ - 1]); ) _--;
  const u = e.slice(l, _), m = {
    type: "inline_math",
    from: l,
    to: _,
    openFrom: s,
    openTo: i,
    closeFrom: r,
    closeTo: c,
    attrs: { latex: u },
    opaque: !0,
    delimRanges: [
      { from: s, to: i, ...n.openClass ? { className: n.openClass } : {} },
      { from: l, to: _, softInside: !0 },
      { from: r, to: c, ...n.closeClass ? { className: n.closeClass } : {} }
    ]
  };
  return u && (m.widgetDecorations = [
    { pos: l, when: "outside", kind: "math-render", attrs: { latex: u }, side: -1 }
  ]), m;
}
function Vt(e, t, o) {
  if (o.type !== "math_inline") return null;
  const n = W(o.markup);
  if (!n || !e.startsWith(o.markup, t)) return null;
  const a = t + o.markup.length;
  if (!e.startsWith(o.content, a)) return null;
  const s = a + o.content.length;
  return e.startsWith(n.close, s) ? s + n.close.length - t : null;
}
function Kt(e) {
  const t = [];
  for (const o of e.tokens) {
    if (o.token.type !== "math_inline" || !o.exact) continue;
    const n = Ut({
      text: e.text,
      pos: o.pos,
      token: o.token
    });
    n && t.push(n);
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
      this.style.display = "inline-block", this.style.verticalAlign = "middle", this.style.lineHeight = "1", this.hasAttribute("data-render") && re().observe(this);
    }
    disconnectedCallback() {
      re().unobserve(this);
    }
    static get observedAttributes() {
      return ["latex", "data-formula"];
    }
    attributeChangedCallback(t, o, n) {
      o !== n && t === "data-formula" && n && this.removeAttribute("data-rendered");
    }
  }
);
const oe = /* @__PURE__ */ new Map(), Zt = "v1";
let j = null;
function re() {
  return j || (j = new IntersectionObserver(
    (e) => {
      e.forEach((t) => {
        if (t.isIntersecting) {
          const o = t.target, n = o.getAttribute("data-formula");
          n && !o.hasAttribute("data-rendered") && (o.setAttribute("data-rendered", "true"), Xt(n).then((a) => {
            a && o.isConnected ? o.innerHTML = a : o.isConnected && (o.textContent = n);
          })), j?.unobserve(o);
        }
      });
    },
    { root: null, rootMargin: "100px", threshold: 0 }
  )), j;
}
async function Xt(e) {
  const t = `${Zt}:${e}`, o = oe.get(t);
  if (o) return o;
  try {
    const n = await ae(e, {
      mode: "inline",
      decorate: (a) => {
        const s = a.getAttribute("viewBox");
        (s ? s.split(" ").map(Number).filter((r) => !Number.isNaN(r)) : []).length !== 4 && a.setAttribute("viewBox", "0 -700 1000 1400"), a.style.pointerEvents = "none";
      }
    });
    return oe.set(t, n), n;
  } catch (n) {
    return console.error("Math render error:", n), null;
  }
}
function Jt(e) {
  const t = document.createElement("math-jax");
  return t.setAttribute("latex", e), t.setAttribute("data-formula", e), t.setAttribute("contenteditable", "false"), t.textContent = e, t;
}
const Yt = (e) => {
  const t = Jt(e.latex ?? "");
  return t.setAttribute("data-render", "1"), t;
};
function de(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function g(e, t) {
  const o = g.mergeDelimiters(t && t.delimiters), n = t && t.outerSpace || !1, a = t && t.katexOptions || {};
  a.throwOnError = a.throwOnError || !1, a.macros = a.macros || t && t.macros, g.katex || (t && typeof t.engine == "object" ? g.katex = t.engine : g.katex = { renderToString() {
    return "No math renderer found.";
  } });
  for (const s of o.inline)
    n && "outerSpace" in s && (s.outerSpace = !0), e.inline.ruler.before("escape", s.name, g.inline(s)), e.renderer.rules[s.name] = (i, r) => s.tmpl.replace(/\$1/, g.render(i[r].content, !!s.displayMode, a));
  for (const s of o.block)
    e.block.ruler.before("fence", s.name, g.block(s)), e.renderer.rules[s.name] = (i, r) => s.tmpl.replace(/\$2/, de(i[r].info)).replace(/\$1/, g.render(i[r].content, !0, a));
}
g.mergeDelimiters = function(e) {
  const t = Array.isArray(e) ? e : typeof e == "string" ? [e] : ["dollars"], o = { inline: [], block: [] };
  for (const n of t)
    n in g.rules && (o.inline.push(...g.rules[n].inline), o.block.push(...g.rules[n].block));
  return o;
};
g.inline = (e) => function(t, o) {
  const n = t.pos, a = t.src, i = a.startsWith(e.tag, e.rex.lastIndex = n) && (!e.pre || e.pre(a, e.outerSpace, n)) && e.rex.exec(a), r = !!i && n < e.rex.lastIndex && (!e.post || e.post(a, e.outerSpace, e.rex.lastIndex - 1));
  if (r) {
    if (!o) {
      const c = t.push(e.name, "math", 0);
      c.content = i[1], c.markup = e.tag;
    }
    t.pos = e.rex.lastIndex;
  }
  return r;
};
g.block = (e) => function(o, n, a, s) {
  const i = o.bMarks[n] + o.tShift[n], r = o.src, l = r.startsWith(e.tag, e.rex.lastIndex = i) && (!e.pre || e.pre(r, !1, i)) && e.rex.exec(r), _ = !!l && i < e.rex.lastIndex && (!e.post || e.post(r, !1, e.rex.lastIndex - 1));
  if (_ && !s) {
    const u = e.rex.lastIndex - 1;
    let m;
    for (m = n; m < a && !(u >= o.bMarks[m] + o.tShift[m] && u <= o.eMarks[m]); m++)
      ;
    const d = o.lineMax, p = o.parentType;
    o.lineMax = m, o.parentType = "math", p === "blockquote" && (l[1] = l[1].replace(/(\n*?^(?:\s*>)+)/gm, ""));
    let h = o.push(e.name, "math", 0);
    h.block = !0, h.tag = e.tag, h.markup = "", h.content = l[1], h.info = l[l.length - 1], h.map = [n, m + 1], o.parentType = p, o.lineMax = d, o.line = m + 1;
  }
  return _;
};
g.render = function(e, t, o) {
  o.displayMode = t;
  let n;
  try {
    n = g.katex.renderToString(e, o);
  } catch (a) {
    n = de(`${e}:${a.message}`);
  }
  return n;
};
g.use = function(e) {
  return g.katex = e, g;
};
g.inlineRuleNames = ["math_inline", "math_inline_double"];
g.blockRuleNames = ["math_block", "math_block_eqno"];
g.$_pre = (e, t, o) => {
  const n = o > 0 ? e[o - 1].charCodeAt(0) : !1;
  return t ? !n || n === 32 : !n || n !== 92 && (n < 48 || n > 57);
};
g.$_post = (e, t, o) => {
  const n = e[o + 1] && e[o + 1].charCodeAt(0);
  return t ? !n || n === 32 || n === 46 || n === 44 || n === 59 : !n || n < 48 || n > 57;
};
g.rules = {
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
        pre: g.$_pre,
        post: g.$_post
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
        pre: g.$_pre,
        post: g.$_post
      },
      {
        name: "math_inline",
        rex: /\$((?:[^\s\\])|(?:\S.*?[^\s\\]))\$/gy,
        tmpl: "<eq>$1</eq>",
        tag: "$",
        outerSpace: !1,
        pre: g.$_pre,
        post: g.$_post
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
function Qt(e) {
  e.use(g, {
    engine: { renderToString: (t) => t },
    delimiters: "dollars"
  });
  for (const t of g.rules.brackets.inline)
    e.inline.ruler.before("escape", t.name, g.inline(t));
}
const en = {
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
  mdItPlugins: [Qt],
  parserTokens: {
    math_inline: (e, t, o) => {
      const n = t.content;
      if (!n) return;
      const a = W(t.markup);
      if (!a) {
        e.addText(t.markup + n + t.markup);
        return;
      }
      const s = o.marks.inline_math.create({ latex: n });
      e.addText(t.markup), e.openMark(s), e.addText(n), e.closeMarkType(o.marks.inline_math), e.addText(a.close);
    },
    math_block: (e, t, o) => {
      const n = t.content.replace(/^\n+|\n+$/g, ""), a = n ? [o.text(n)] : [];
      e.push(o.nodes.code_block.createChecked({ lang: "latex" }, a));
    }
  },
  inline: {
    order: -1,
    derive: Kt,
    tokenAdvance: Vt,
    markNames: ["inline_math"],
    extRanges: (e) => M(e, "inline_math", 1, 1),
    suppressFormatToolbar: !0,
    decorationWidgets: {
      "math-render": Yt
    }
  }
}, tn = ["latex", "math"], nn = {
  id: "math",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(en),
    e.registerExtension(
      he({
        id: "math.renderer",
        languages: tn,
        createPreview: Gt
      })
    ),
    e.registerInsertCommand(Wt),
    e.registerContextMenuItem(Bt)
  ]
}, on = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function rn(e, t) {
  const o = e.posMax, n = e.pos;
  if (e.src.charCodeAt(n) !== 126 || t || n + 2 >= o)
    return !1;
  e.pos = n + 1;
  let a = !1;
  for (; e.pos < o; ) {
    if (e.src.charCodeAt(e.pos) === 126) {
      a = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!a || n + 1 === e.pos)
    return e.pos = n, !1;
  const s = e.src.slice(n + 1, e.pos);
  if (s.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = n, !1;
  e.posMax = e.pos, e.pos = n + 1;
  const i = e.push("sub_open", "sub", 1);
  i.markup = "~";
  const r = e.push("text", "", 0);
  r.content = s.replace(on, "$1");
  const c = e.push("sub_close", "sub", -1);
  return c.markup = "~", e.pos = e.posMax + 1, e.posMax = o, !0;
}
function an(e) {
  e.inline.ruler.after("emphasis", "sub", rn);
}
const sn = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g;
function ln(e, t) {
  const o = e.posMax, n = e.pos;
  if (e.src.charCodeAt(n) !== 94 || t || n + 2 >= o)
    return !1;
  e.pos = n + 1;
  let a = !1;
  for (; e.pos < o; ) {
    if (e.src.charCodeAt(e.pos) === 94) {
      a = !0;
      break;
    }
    e.md.inline.skipToken(e);
  }
  if (!a || n + 1 === e.pos)
    return e.pos = n, !1;
  const s = e.src.slice(n + 1, e.pos);
  if (s.match(/(^|[^\\])(\\\\)*\s/))
    return e.pos = n, !1;
  e.posMax = e.pos, e.pos = n + 1;
  const i = e.push("sup_open", "sup", 1);
  i.markup = "^";
  const r = e.push("text", "", 0);
  r.content = s.replace(sn, "$1");
  const c = e.push("sup_close", "sup", -1);
  return c.markup = "^", e.pos = e.posMax + 1, e.posMax = o, !0;
}
function cn(e) {
  e.inline.ruler.after("emphasis", "sup", ln);
}
const un = {
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
  mdItPlugins: [(e) => e.use(an).use(cn)],
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
      ...N(e, { open: "sub_open", close: "sub_close", mark: "sub" }),
      ...N(e, { open: "sup_open", close: "sup_close", mark: "sup" })
    ],
    markNames: ["sub", "sup"],
    extRanges: (e) => [
      ...M(e, "sub", 1),
      ...M(e, "sup", 1)
    ]
  }
}, _n = {
  id: "subSup",
  register: ({ editor: e }) => [e.registerSyntaxFeature(un)]
}, P = /* @__PURE__ */ new Set();
class mn {
  dom;
  view;
  // Cache the last rendered (doc, items) so the refresh plugin bails out fast
  // when nothing relevant to the TOC changed (refresh fires on every tx).
  lastDoc = null;
  lastSig = "";
  constructor(t, o) {
    this.view = o, this.dom = document.createElement("div"), this.dom.className = "toc", this.dom.setAttribute("contenteditable", "false"), this.render(), P.add(this);
  }
  render() {
    const t = this.view.state.doc;
    if (t === this.lastDoc) return;
    const o = [];
    t.descendants((s, i) => {
      s.type.name === "heading" && o.push({
        level: s.attrs.level,
        text: s.textContent,
        pos: i
      });
    });
    const n = o.map((s) => `${s.pos}	${s.level}	${s.text}`).join(`
`);
    if (n === this.lastSig && this.lastDoc !== null) {
      this.lastDoc = t;
      return;
    }
    if (this.lastDoc = t, this.lastSig = n, this.dom.innerHTML = "", o.length === 0) {
      const s = document.createElement("div");
      s.className = "toc-empty", s.textContent = "(no headings yet)", this.dom.appendChild(s);
      return;
    }
    const a = document.createElement("ul");
    a.className = "toc-list";
    for (const s of o) {
      const i = document.createElement("li");
      i.className = `toc-item toc-h${s.level}`, i.textContent = s.text || "(empty heading)", i.addEventListener("mousedown", (r) => {
        r.preventDefault();
      }), i.addEventListener("click", () => this.jumpTo(s.pos)), a.appendChild(i);
    }
    this.dom.appendChild(a);
  }
  jumpTo(t) {
    const o = this.view.state.tr;
    o.setSelection(w.near(o.doc.resolve(t + 1))), this.view.dispatch(o), this.view.nodeDOM(t)?.scrollIntoView({ block: "start", behavior: "smooth" }), this.view.focus();
  }
  // The node never changes (atom, no attrs/content); the refresh plugin calls
  // render() externally. Returning true tells PM "we handled it".
  update() {
    return !0;
  }
  destroy() {
    P.delete(this);
  }
  // Atom block — selectable and PM should treat the whole node as a unit.
  stopEvent() {
    return !1;
  }
  ignoreMutation() {
    return !0;
  }
}
function dn() {
  return new v({
    view() {
      const e = () => {
        for (const t of P) t.render();
      };
      return e(), {
        update() {
          e();
        }
      };
    }
  });
}
const pn = {
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
    dn(),
    new v({
      props: {
        nodeViews: {
          toc: (e, t) => new mn(e, t)
        }
      }
    })
  ],
  keymap: () => ({
    // Convert paragraph `[toc]` / `[TOC]` to a toc node on Enter.
    Enter: (e, t) => {
      const o = e.selection;
      if (!o.empty) return !1;
      const n = o.$from;
      if (n.parent.type.name !== "paragraph") return !1;
      const a = n.parent.textContent;
      if (a !== "[toc]" && a !== "[TOC]") return !1;
      if (t) {
        const s = e.schema, i = s.nodes.toc.create(), r = n.before(), c = n.after(), l = e.tr;
        l.replaceWith(r, c, [
          i,
          s.nodes.paragraph.create()
        ]);
        const _ = r + i.nodeSize + 1;
        l.setSelection(w.create(l.doc, _)), t(l);
      }
      return !0;
    }
  }),
  parserPostProcess: (e) => {
    const t = [];
    let o = !1;
    const n = e.type.schema.nodes.toc;
    return !n || (e.forEach((a) => {
      a.type.name === "paragraph" && (a.textContent === "[toc]" || a.textContent === "[TOC]") ? (t.push(n.create()), o = !0) : t.push(a);
    }), !o) ? e : e.type.create(e.attrs, t, e.marks);
  },
  blockHandlers: {
    toc: (e, t) => {
      e.write("[toc]"), e.closeBlock(t);
    }
  }
}, fn = {
  id: "toc",
  register: ({ editor: e }) => [e.registerSyntaxFeature(pn)]
}, hn = {
  id: "underline",
  markName: "underline",
  delim: "<u>",
  closeDelim: "</u>",
  // 裸 key：宿主桥接层会补上插件 id 前缀（`app.textox.mkdext.underline.label`）
  labelKey: "underline.label",
  icon: "underline",
  order: 4
};
function gn(e, t) {
  const o = [], a = "</u>";
  for (let s = 0; s < e.length; ) {
    if (t[s] || !e.startsWith("<u>", s)) {
      s++;
      continue;
    }
    const i = s, r = s + 3, c = r;
    let l = -1;
    for (let m = c; m < e.length; m++)
      if (!t[m] && e.startsWith(a, m)) {
        l = m;
        break;
      }
    if (l === -1) break;
    const _ = l + a.length, u = l;
    if (c >= u) {
      s = _;
      continue;
    }
    if (/\s/.test(e[c]) || /\s/.test(e[u - 1])) {
      s = c;
      continue;
    }
    for (let m = i; m < _; m++) t[m] = 1;
    o.push({ type: "underline", from: c, to: u, openFrom: i, openTo: r, closeFrom: l, closeTo: _, wrap: !0 }), s = _;
  }
  return o;
}
function bn() {
  return (e, t) => {
    const { from: o, to: n, empty: a } = e.selection;
    if (a) return !1;
    const s = e.doc, i = "<u>", r = "</u>", c = i.length, l = r.length, _ = o >= c ? s.textBetween(o - c, o) : "", u = n + l <= s.content.size ? s.textBetween(n, n + l) : "";
    if (_ === i && u === r)
      return t && t(e.tr.delete(n, n + l).delete(o - c, o)), !0;
    if (t) {
      const m = s.textBetween(o, n), d = e.tr.replaceWith(o, n, e.schema.text(i + m + r));
      d.setSelection(w.create(d.doc, o + c, o + c + m.length)), t(d);
    }
    return !0;
  };
}
const kn = {
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
    derive: (e) => gn(e.text, e.consumed),
    markNames: ["underline"],
    extRanges: (e) => M(e, "underline", 3, 4)
  },
  keymap: () => ({
    "Mod-u": bn()
  })
}, yn = {
  id: "underline",
  register: ({ editor: e }) => [
    e.registerSyntaxFeature(kn),
    e.registerFormatToolbarItem(hn)
  ]
}, wn = [
  ve,
  _n,
  yn,
  Ve,
  Ae,
  bt,
  fn,
  St,
  Lt,
  nn,
  pt
], xn = "en-US", vn = {
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
    }
  }
};
class qn extends ge {
  featureResources = [];
  onload() {
    this.addMessages(vn, xn), this.syncFeatures(), this.disposables.add(this.settings.onDidChange(() => this.syncFeatures()));
  }
  onunload() {
    this.disposeFeatures();
  }
  /** 按当前设置重装特性：先全部释放，再装配启用项。 */
  syncFeatures() {
    this.disposeFeatures();
    for (const t of wn)
      if (this.settings.get(t.id) !== !1)
        try {
          const o = t.register({
            editor: this.app.editor,
            settings: this.settings,
            t: (n) => this.t(n)
          });
          this.featureResources.push(...Array.isArray(o) ? o : [o]);
        } catch (o) {
          this.app.log.error(`feature ${t.id} failed to load`, o);
        }
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
function Tn(e) {
  const { dom: t, contentDOM: o, renderContainer: n, view: a, getPos: s } = e;
  let i = e.node, r = "code", c = null;
  const l = (f) => {
    if (f.button !== 0) {
      f.button === 2 && f.preventDefault();
      return;
    }
    if (!a.editable) return;
    f.preventDefault();
    const b = s();
    if (b == null) return;
    const x = b + 1, y = a.state.tr.setSelection(w.create(a.state.doc, x)).scrollIntoView();
    a.dispatch(y), a.focus();
  };
  n.addEventListener("mousedown", l);
  const _ = () => {
    const f = s();
    if (f == null) return !1;
    const b = a.state.selection;
    return b.from > f && b.from < f + i.nodeSize;
  }, u = () => {
    r !== "code" && (r = "code", o.style.display = "", n.style.display = "none", t.classList.remove("html-block-render-mode"));
  }, m = () => {
    r !== "render" && (r = "render", o.style.display = "none", n.style.display = "", t.classList.add("html-block-render-mode"));
  }, d = (f) => {
    const b = f.trim();
    return b.startsWith("<!--") && b.endsWith("-->");
  }, p = () => {
    const f = i.textContent, b = d(f);
    if (t.classList.toggle("html-block-comment", b), b) {
      c = null, u();
      return;
    }
    !_() && f.trim() !== "" ? ((r !== "render" || c !== f) && (n.innerHTML = f, c = f), m()) : (c = null, u());
  }, h = Et(p);
  return {
    update(f) {
      return f.type.name !== "html_block" ? !1 : (i = f, p(), !0);
    },
    destroy() {
      h(), n.removeEventListener("mousedown", l);
    },
    stopEvent(f) {
      return n.contains(f.target) && r === "render";
    },
    ignoreMutation(f) {
      return !!(n.contains(f.target) || f.type === "attributes" && (f.target === t || f.target === o));
    }
  };
}
const $n = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createHtmlBlockView: Tn
}, Symbol.toStringTag, { value: "Module" }));
export {
  qn as default
};
