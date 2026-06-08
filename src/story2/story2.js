/**
 * "The Robot's City Adventure" — Scene 2, ~28s automated story.
 *
 * Beats:
 *   0–3s   Robot arrives at a city intersection. A big city hums around it.
 *   3–8s   Walks down the road. Streetlights flicker on.
 *   8–14s  Meets a Bird on a bench. They chat.
 *   14–20s Passes the bus stop. A Bee buzzes over with a warning.
 *   20–28s Reaches the tall building. An Elephant is waiting at the entrance.
 */

export const LAYOUT2 = {
  heroStart: { x: 0,    z: 10  },
  wp1:       { x: 0,    z: 4.5 }, // near bird's bench
  wp2:       { x: 0,    z: -1  }, // near bus stop
  wp3:       { x: 0,    z: -7  }, // near building entrance
  bird:      { x: 2.5,  z: 3.5 }, // on bench
  bee:       { x: -2.5, z: -2  }, // by bus stop
  elephant:  { x: 1.5,  z: -9  }, // at building door
};

const HERO     = { name: "Robo",     color: "#ff7043", headY: 2.05 };
const BIRD_NPC = { name: "Bird",     color: "#42a5f5", headY: 1.4  };
const BEE_NPC  = { name: "Buzz",     color: "#ffca28", headY: 1.2  };
const ELEPH    = { name: "Eli",      color: "#78909c", headY: 2.8  };

const camFollow = (wp, { side = 2, dist = 5, height = 2.8 } = {}) => ({
  pos:    { x: wp.x + side, y: height, z: wp.z + dist },
  target: { x: wp.x,        y: 1.0,   z: wp.z         },
});

const camTwo = (a, b, { height = 2.0, pull = 3.5 } = {}) => {
  const mx = (a.x + b.x) / 2;
  const mz = (a.z + b.z) / 2;
  return {
    pos:    { x: mx + pull, y: height, z: mz + pull },
    target: { x: mx,        y: 1.1,   z: mz         },
  };
};

export function buildStory2(d, actors, ui) {
  const { hero, bird, bee, elephant } = actors;
  const L = LAYOUT2;

  // ── 0–3s: arrival ──────────────────────────────────────────────────────────
  d.cue(() => ui.showTitle("The Robot's City Adventure"), { start: 0 });
  const intro = camFollow(L.heroStart, { side: 0, dist: 6.5, height: 4 });
  d.cameraTo(intro.pos, intro.target, { start: 0, duration: 0.01 });
  const pullIn = camFollow(L.heroStart, { side: 1.5, dist: 5, height: 3 });
  d.cameraTo(pullIn.pos, pullIn.target, { start: 0.3, duration: 2.7 });
  d.cue(() => ui.hideTitle(), { start: 2.8 });
  d.say(hero, "Wow… a whole city!", { start: 1.0, duration: 2.0, ...HERO });

  // ── 3–8s: walk down the road ────────────────────────────────────────────────
  d.walk(hero, L.wp1, { start: 3, duration: 4.5 });
  const follow1 = camFollow(L.wp1, { side: 2.2 });
  d.cameraTo(follow1.pos, follow1.target, { start: 3, duration: 4.5 });
  d.say(hero, "Where should I go first?", { start: 4.5, duration: 2.0, ...HERO });

  // ── 8–14s: meet the bird ────────────────────────────────────────────────────
  d.faceTo(hero, L.bird,  { start: 7.8, duration: 0.5 });
  d.faceTo(bird, L.wp1,   { start: 7.8, duration: 0.5 });
  const meet1 = camTwo(L.wp1, L.bird, { pull: 3.2 });
  d.cameraTo(meet1.pos, meet1.target, { start: 7.8, duration: 1.0 });
  d.hop(bird, { start: 8.2, duration: 0.5, height: 0.3 });
  d.say(bird, "Hey robot! The park's lovely today.", {
    start: 8.3, duration: 2.4, ...BIRD_NPC,
  });
  d.say(hero, "Good to know! I'm exploring.", {
    start: 11.0, duration: 2.0, ...HERO,
  });
  d.hop(bird, { start: 13.0, duration: 0.4, height: 0.2 });
  d.say(bird, "Watch out — Buzz has a warning!", {
    start: 13.1, duration: 1.6, ...BIRD_NPC,
  });

  // ── 14–20s: pass bus stop, meet bee ─────────────────────────────────────────
  d.walk(hero, L.wp2, { start: 15.0, duration: 3.8 });
  const follow2 = camFollow(L.wp2, { side: -2.2 });
  d.cameraTo(follow2.pos, follow2.target, { start: 15.0, duration: 3.8 });

  d.faceTo(hero, L.bee, { start: 18.8, duration: 0.4 });
  d.faceTo(bee,  L.wp2, { start: 18.8, duration: 0.4 });
  const meet2 = camTwo(L.wp2, L.bee, { pull: 2.8, height: 1.6 });
  d.cameraTo(meet2.pos, meet2.target, { start: 18.8, duration: 0.9 });
  d.hop(bee, { start: 19.2, duration: 0.4, height: 0.35 });
  d.say(bee, "Bzzt! The big building holds a secret!", {
    start: 19.3, duration: 2.5, ...BEE_NPC,
  });
  d.say(hero, "A secret? I have to see this.", {
    start: 22.0, duration: 2.0, ...HERO,
  });

  // ── 24–28s: reach the building, meet elephant ───────────────────────────────
  d.walk(hero, L.wp3, { start: 24.2, duration: 3.5 });
  d.faceTo(elephant, L.wp3, { start: 24.2, duration: 0.6 });
  const follow3 = camFollow(L.wp3, { side: 2.5, dist: 5.2 });
  d.cameraTo(follow3.pos, follow3.target, { start: 24.2, duration: 2.8 });

  d.hop(elephant, { start: 27.0, duration: 0.7, height: 0.25 });
  d.say(elephant, "Welcome! The city has been waiting for you.", {
    start: 27.1, duration: 2.6, ...ELEPH,
  });

  const wide = {
    pos:    { x: 7,  y: 5.5, z: -2  },
    target: { x: 0.5, y: 1.5, z: -7  },
  };
  d.cameraTo(wide.pos, wide.target, { start: 27.8, duration: 1.4 });
  d.cue(() => ui.showEnd("The city welcomes Robo."), { start: 28.5 });
}
