/**
 * "The Little Robot's Journey" — a ~25 second automated story.
 *
 * Beats:
 *   0–3s   A little robot wakes in a pastel meadow. Camera drifts in.
 *   3–7s   It rolls along the path and meets a kindly Wanderer.
 *   7–13s  They greet and talk; the Wanderer points the way.
 *   13–19s It rolls on, passes the trees, and meets a cheerful child, Pip.
 *   19–25s It reaches its friend the Mage at journey's end. Celebration, pull-back.
 */

export const LAYOUT = {
  heroStart: { x: 0, z: 6 },
  wp1: { x: 0.9, z: 2.7 }, // beside the Wanderer
  wp2: { x: -1.0, z: -2.2 }, // beside Pip
  wp3: { x: 0.7, z: -6.4 }, // beside the Mage
  wanderer: { x: 2.4, z: 1.9 },
  child: { x: -2.5, z: -3.3 },
  friend: { x: 2.0, z: -8.0 },
};

const HERO = { name: "Robo", color: "#ff7043", headY: 2.05 };
const WANDERER = { name: "Wanderer", color: "#26a69a", headY: 2.0 };
const PIP = { name: "Pip", color: "#ffb300", headY: 1.45 };
const MAGE = { name: "Mage", color: "#7c4dff", headY: 2.05 };

const camBehind = (wp, { side = 2.0, dist = 4.6, height = 2.6 } = {}) => ({
  pos: { x: wp.x * 0.5 + side, y: height, z: wp.z + dist },
  target: { x: wp.x, y: 1.0, z: wp.z },
});

// A two-shot framing between two points (for conversations).
const camTwoShot = (a, b, { height = 1.9, pull = 3.6 } = {}) => {
  const mx = (a.x + b.x) / 2;
  const mz = (a.z + b.z) / 2;
  return {
    pos: { x: mx + pull, y: height, z: mz + pull },
    target: { x: mx, y: 1.1, z: mz },
  };
};

export function buildStory(d, actors, ui) {
  const { hero, wanderer, child, friend } = actors;
  const L = LAYOUT;

  // ── 0–3s: wake + camera drift in ───────────────────────────────────────────
  d.cue(() => ui.showTitle("The Little Robot's Journey"), { start: 0 });
  const intro = camBehind(L.heroStart, { side: 0.0, dist: 6.5, height: 3.6 });
  d.cameraTo(intro.pos, intro.target, { start: 0, duration: 0.01 });
  const afterIntro = camBehind(L.heroStart, { dist: 5.0, height: 2.7 });
  d.cameraTo(afterIntro.pos, afterIntro.target, { start: 0.4, duration: 2.6 });
  d.cue(() => ui.hideTitle(), { start: 2.6 });
  d.say(hero, "...where am I?", {
    start: 1.3, duration: 1.6, ...HERO,
  });

  // ── 3–6.5s: roll to the Wanderer ────────────────────────────────────────────
  d.walk(hero, L.wp1, { start: 3.0, duration: 3.4 });
  const follow1 = camBehind(L.wp1);
  d.cameraTo(follow1.pos, follow1.target, { start: 3.0, duration: 3.4 });

  // ── 6.5–13s: greet + talk ───────────────────────────────────────────────────
  d.faceTo(hero, L.wanderer, { start: 6.5, duration: 0.5 });
  d.faceTo(wanderer, L.wp1, { start: 6.5, duration: 0.5 });
  const meet1 = camTwoShot(L.wp1, L.wanderer, { pull: 3.4 });
  d.cameraTo(meet1.pos, meet1.target, { start: 6.5, duration: 1.0 });

  d.hop(wanderer, { start: 6.9, duration: 0.6, height: 0.22 });
  d.say(wanderer, "Welcome, traveler! Lost your way?", {
    start: 6.9, duration: 2.1, ...WANDERER,
  });
  d.say(hero, "Yes... I'm trying to get home.", { start: 9.2, duration: 2.0, ...HERO });
  d.faceTo(wanderer, L.child, { start: 11.3, duration: 0.5 });
  d.say(wanderer, "Home's past the trees — Pip will lead you!", {
    start: 11.4, duration: 2.2, ...WANDERER,
  });

  // ── 13–19s: roll on and meet Pip ────────────────────────────────────────────
  d.walk(hero, L.wp2, { start: 13.8, duration: 3.4 });
  const follow2 = camBehind(L.wp2, { side: -2.2 });
  d.cameraTo(follow2.pos, follow2.target, { start: 13.8, duration: 3.4 });

  d.faceTo(hero, L.child, { start: 17.2, duration: 0.4 });
  d.faceTo(child, L.wp2, { start: 17.2, duration: 0.4 });
  const meet2 = camTwoShot(L.wp2, L.child, { pull: 3.0, height: 1.7 });
  d.cameraTo(meet2.pos, meet2.target, { start: 17.2, duration: 0.9 });
  d.hop(child, { start: 17.4, duration: 0.5, height: 0.3 });
  d.say(child, "This way! Follow me!", { start: 17.4, duration: 1.9, ...PIP });
  d.say(hero, "Thank you, Pip!", { start: 19.4, duration: 1.5, ...HERO });

  // ── 19–25s: reach the Mage, pull back ────────────────────────────────────────
  d.walk(hero, L.wp3, { start: 21.0, duration: 3.0 });
  d.faceTo(friend, L.wp3, { start: 21.0, duration: 0.6 });
  const follow3 = camBehind(L.wp3, { side: 2.4, dist: 4.8 });
  d.cameraTo(follow3.pos, follow3.target, { start: 21.0, duration: 2.4 });

  d.hop(friend, { start: 23.2, duration: 0.6, height: 0.28 });
  d.say(friend, "Robo! You found us at last!", { start: 23.0, duration: 2.0, ...MAGE });

  const wide = {
    pos: { x: 6.5, y: 4.6, z: -2.5 },
    target: { x: 0.5, y: 1.2, z: -5.5 },
  };
  d.cameraTo(wide.pos, wide.target, { start: 23.6, duration: 1.4 });
  d.cue(() => ui.showEnd("I found my way."), { start: 24.2 });
}
