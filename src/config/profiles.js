/* Driver profiles: the made-up monster-truck history for each persona, plus one-liners that model/bios.js
   picks from based on the live stats. Everything here is fiction. Names are original, no real trucks, drivers
   or brands, and no pronouns, since nobody's have been stated.

   quips are chosen by stat:
     leader / contender / chaser / cellar  standings rank (1st, 2nd-3rd, 4th-5th, last)
     lucky / unlucky   luck (actual wins vs. what the all-play record predicts)
     wild / steady     highest / lowest week-to-week swing in the league
     hot / cold        current win / loss streak of 2 or more
     crown             most weeks with the league's top score (2 or more)
     flat              owns the season-low score
     preseason         nothing has been played yet */
export const PROFILES = {
  '993641976593432576': { // Rage Cage Kyle
    truck: 'Polka Dot Panic', hometown: 'Gravel Gulch', catchphrase: '"Spots on, brain off."',
    tagline: 'Fully spotted. Fully furious.',
    era: [
      { y: 2011, t: 'Drove a rusted pickup into a ditch on purpose and called it a debut. The first spot of mud landed on the hood and Kyle decided every surface should have one.' },
      { y: 2015, t: 'Hand-painted exactly 46 black spots on the Panic. Tried for 47. The 47th became a dent, which also counts as a spot.' },
      { y: 2019, t: 'Earned the name "Rage Cage" after getting stuck in the roll cage during a victory lap and refusing all help. The lap lasted nine minutes.' },
      { y: 2023, t: 'Won a plastic fire hydrant at the Tri-County Mud Run. It rides on the dash and is not up for discussion.' },
      { y: 2026, t: 'Rolls into the Mudbowl with the cleanest spots in the field. That will last until about Week 2.' }
    ],
    quips: {
      leader: 'Kyle sits on top of the standings and the spots have never looked so proud.',
      contender: 'Kyle is sniffing around the podium with the engine barking.',
      chaser: 'Kyle is back in the pack, spots caked over and temper rising.',
      cellar: 'Kyle is in the doghouse at the bottom, and the cage is rattling.',
      lucky: 'The schedule keeps tossing Kyle treats.',
      unlucky: 'The schedule keeps rolling the bone just out of reach.',
      wild: 'Scores swing like a leash that just spotted a squirrel.',
      steady: 'Steady as a porch dog at noon.',
      hot: 'Win streak running, tail wagging at full tilt.',
      cold: 'Losing streak, and the chase is mostly after its own tail.',
      crown: 'Leads the league in weekly top scores. The cage is holding.',
      flat: 'Owns the season-low score, and the mud is taking credit.',
      preseason: 'No laps yet. The spots are clean, which will not last.'
    }
  },
  '471892635900964864': { // Max Pelle-D
    truck: 'Rivet Riot', hometown: 'Pointe Dull', catchphrase: '"If it is not sharp, it is not finished."',
    tagline: 'Maximum steel. Maximum spikes.',
    era: [
      { y: 2009, t: 'Bolted the first spike to a lawn tractor to deter the neighbors. It deterred the neighbors and the lawn.' },
      { y: 2013, t: 'Built the Riot\'s frame in a garage whose main safety feature was a laminated sign reading "Probably Fine".' },
      { y: 2018, t: 'Won a regional crush-off by being too heavy for the judges\' scale. The rules were amended, and the amendment is unofficially named after Max.' },
      { y: 2022, t: 'Set the unofficial record for most spikes on a vehicle that is also a legal road hazard.' },
      { y: 2026, t: 'Enters the Mudbowl with a truck that sets off metal detectors three towns away.' }
    ],
    quips: {
      leader: 'Max is on top of the standings, and the spikes are glinting.',
      contender: 'Max is circling the top spots, and everything about the approach is pointy.',
      chaser: 'Max is stuck behind the leaders with the spikes dulled by mud.',
      cellar: 'Max is at the bottom of the standings, and even the spikes look embarrassed.',
      lucky: 'The wins keep arriving, possibly because the scoreboard is afraid of the spikes.',
      unlucky: 'Plenty of points and a schedule that keeps flattening the tires.',
      wild: 'Scores jump around like a spike through a tire.',
      steady: 'Consistent as a row of rivets.',
      hot: 'Win streak running. Spikes forward.',
      cold: 'Losing streak, with the tires going soft one week at a time.',
      crown: 'Tops the weekly scoreboard more than anyone, and the spikes are not subtle about it.',
      flat: 'Owns the season-low score. A flat tire is just a spike pointing inward.',
      preseason: 'No laps yet. The spikes are freshly sharpened.'
    }
  },
  '995779307970580480': { // Whip-It-Out Arry
    truck: 'Lash Royale', hometown: 'Throne Heights', catchphrase: '"Bow, then buckle up."',
    tagline: 'Crown on. Whip out. Rules optional.',
    era: [
      { y: 2010, t: 'Crowned Homecoming Champion of a tractor pull, a title that was never formally awarded and never formally revoked.' },
      { y: 2014, t: 'Added the whip to the roof "for flag purposes". The flag has never been seen. The whip has.' },
      { y: 2017, t: 'Took a victory lap waving a scepter at the crowd and steering with both knees. Won the lap and a stern letter.' },
      { y: 2021, t: 'Received a formal warning from the Tri-County Pit Committee for "excessive regal behavior" (Section 4, the Whip Clause).' },
      { y: 2026, t: 'Arrives at the Mudbowl with the biggest crown in the field and a speech nobody asked for.' }
    ],
    quips: {
      leader: 'Arry is on the throne at the top of the standings, and the crown fits.',
      contender: 'Arry is eyeing the throne from a few steps below it.',
      chaser: 'Arry is a deposed monarch plotting a comeback from the cheap seats.',
      cellar: 'Arry is in the dungeon of the standings, with the crown on loan to the mud.',
      lucky: 'Fate keeps bowing to Arry\'s schedule.',
      unlucky: 'The kingdom\'s schedule is conspiring against the crown.',
      wild: 'Scores crack like a whip in a windstorm.',
      steady: 'Royally steady. Not a hair out of place under the crown.',
      hot: 'Win streak running, and the whip is cracking.',
      cold: 'Losing streak, and the crown is slipping over one ear.',
      crown: 'Most weekly top scores in the league. Decrees are being issued.',
      flat: 'Owns the season-low score. The whip stayed at the castle that week.',
      preseason: 'No laps yet. The crown is polished and the speech is ready.'
    }
  },
  '996103341207822336': { // Dragon Lord Grigy Grigs
    truck: 'Scalewing', hometown: 'Cinder Hollow', catchphrase: '"I do not need a runway."',
    tagline: 'Breathes fire. Needs a tow.',
    era: [
      { y: 2008, t: 'Hatched (according to the official bio) at a county fair monster-truck rally. The fair has no record of this.' },
      { y: 2012, t: 'First wing mod: two cardboard wings bolted to the roof. The wings are steel now. The cardboard is in a shrine.' },
      { y: 2016, t: 'Declared Dragon Lord after winning a tiebreaker by flapping at the judges.' },
      { y: 2020, t: 'The fire-breathing exhaust failed inspection three times. It passed on the fourth after being reclassified as "ambient warmth".' },
      { y: 2024, t: 'Learned that wings do not provide lift. The bruises were considerable.' },
      { y: 2026, t: 'Enters the Mudbowl with polished scales, flapping wings, and a hoard that still needs building.' }
    ],
    quips: {
      leader: 'Grigs sits atop the hoard of the standings, scales gleaming.',
      contender: 'Grigs circles above the leaders with smoke curling.',
      chaser: 'Grigs is smoldering in the middle of the pack with fire still in reserve.',
      cellar: 'Grigs is in the cave at the bottom of the standings, hoard empty, ember barely glowing.',
      lucky: 'Even the schedule seems to like the look of the scales.',
      unlucky: 'The schedule keeps dousing the flame.',
      wild: 'Scores flap up and down like wings that do not quite work.',
      steady: 'Steady as a sleeping dragon.',
      hot: 'Win streak running, breathing fire.',
      cold: 'Losing streak, and the tank is running low on fire.',
      crown: 'Most weekly top scores in the league. The hoard is growing.',
      flat: 'Owns the season-low score. The fire went out for a week.',
      preseason: 'No laps yet. The scales are polished and the wings are untested.'
    }
  },
  '997177091319771136': { // Captain Byronious the Cursed
    truck: 'The Cursed Doubloon', hometown: 'Muddy Harbor', catchphrase: '"The curse is only a rumor. A loud one."',
    tagline: 'Cursed, allegedly. Dangerous, definitely.',
    era: [
      { y: 2007, t: 'Signed on as cabin boy aboard a barge in the Muddy Harbor Regatta, and was promoted to captain once it was the only barge left floating.' },
      { y: 2011, t: 'Lost an eye patch, a parrot and a transmission in a single afternoon. Replaced two of the three.' },
      { y: 2015, t: 'Raised the skull flag on the roof, then spent an hour explaining to track officials that it is "purely decorative".' },
      { y: 2019, t: 'A fan swore the truck would never win on a Friday. It won on a Thursday. The curse has been renegotiated.' },
      { y: 2024, t: 'Reached a title run with a crew of six and a bag of doubloons that spend nowhere.' },
      { y: 2026, t: 'Sails into the Mudbowl with the flag up, the curse in the cargo hold, and the treasure map upside down.' }
    ],
    quips: {
      leader: 'Captain Byronious flies the flag at the top of the standings.',
      contender: 'Captain Byronious has the top spots in the spyglass.',
      chaser: 'Captain Byronious is adrift in the middle, hunting for wind.',
      cellar: 'Captain Byronious is walking the plank at the bottom of the standings.',
      lucky: 'The curse is being kind, for once.',
      unlucky: 'The curse is working overtime, and wins keep sinking.',
      wild: 'Scores roll like waves in a storm.',
      steady: 'Calm seas and steady scoring.',
      hot: 'Win streak running, with wind in the sails.',
      cold: 'Losing streak, and the curse is back at the helm.',
      crown: 'Most weekly top scores in the league. The treasure is piling up.',
      flat: 'Owns the season-low score. The curse had a Thursday.',
      preseason: 'No laps yet. The flag is up and the map is upside down.'
    }
  },
  '998726733442596864': { // Dawg Pound Dilly Willy
    truck: 'Bone Rattler', hometown: 'Scrapyard Flats', catchphrase: '"Bark loud. Dig deep."',
    tagline: 'Bark loud. Dig deep. Bring a bone.',
    era: [
      { y: 2010, t: 'Started in a junkyard hauling parts. It was the only place that accepted "Dawg Pound" as a credential.' },
      { y: 2014, t: 'Welded a giant bone to the roof as a mascot. It has since served as a tow bar, a bat, and a very large toothpick.' },
      { y: 2018, t: 'Won the Scrapyard Showdown, mostly by being the only entry that arrived with its own spare parts.' },
      { y: 2022, t: 'Chewed through three steering columns and one mud flap, and insists that is a feature, not a bug.' },
      { y: 2026, t: 'Joins the Mudbowl with a bark audible from the cheap seats and a junkyard\'s worth of hope.' }
    ],
    quips: {
      leader: 'Dilly is on top of the standings, and the bone is raised high.',
      contender: 'Dilly is sniffing at the podium with the whole pound barking behind.',
      chaser: 'Dilly is digging in the middle of the pack and has not found the bone yet.',
      cellar: 'Dilly is at the bottom of the standings, which is exactly where junkyard dogs find the good parts.',
      lucky: 'The schedule keeps tossing Dilly a bone.',
      unlucky: 'The schedule keeps burying the bone where Dilly cannot dig.',
      wild: 'Scores swing like a chain on a junkyard gate.',
      steady: 'Steady as a dog guarding the same fence for years.',
      hot: 'Win streak running, tail wagging at the gate.',
      cold: 'Losing streak, and the bone is nowhere to be found.',
      crown: 'Most weekly top scores in the league. The pound is loud.',
      flat: 'Owns the season-low score. Somebody buried it in the yard.',
      preseason: 'No laps yet. The bone is polished and the bark is warmed up.'
    }
  }
};

const GENERIC = {
  truck: 'Mystery Machine', hometown: 'Parts Unknown', catchphrase: '"Watch this."', tagline: 'New to the arena.',
  era: [{ y: 2026, t: 'Appears at the Mudbowl with a truck, a plan, and no paperwork. The history is still being written.' }],
  quips: {
    leader: 'Leads the standings.', contender: 'Is in the hunt near the top.', chaser: 'Is chasing from mid-pack.', cellar: 'Is at the bottom of the standings.',
    lucky: 'The schedule has been kind.', unlucky: 'The schedule has been cruel.', wild: 'Scores are all over the place.', steady: 'Scores barely move.',
    hot: 'Win streak running.', cold: 'Losing streak running.', crown: 'Most weekly top scores.', flat: 'Owns the season low.', preseason: 'No laps yet.'
  }
};

export function profileFor(ownerId) {
  return PROFILES[ownerId] || GENERIC;
}
