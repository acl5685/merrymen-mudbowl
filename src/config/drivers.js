// Drivers (personas), keyed by Sleeper owner_id, not roster_id. Trucks are original designs inspired by each theme.
export const DRIVERS = {
  '993641976593432576': { persona: 'Rage Cage Kyle',              short: 'Kyle',      teamName: "Beaker's Secret Potion",    theme: 'spots',  color: '#cfc9bb' }, // TROKNASTY
  '471892635900964864': { persona: 'Max Pelle-D',                 short: 'Max',       teamName: 'Joe Scarey',                theme: 'spikes', color: '#f0a020' }, // apelle
  '995779307970580480': { persona: 'Whip-It-Out Arry',            short: 'Arry',      teamName: '',                          theme: 'royal',  color: '#5b8ff0' }, // TDsTease
  '996103341207822336': { persona: 'Dragon Lord Grigy Grigs',     short: 'Grigs',     teamName: '',                          theme: 'dragon', color: '#3db37a' }, // GrigasM
  '997177091319771136': { persona: 'Captain Byronious the Cursed', short: 'Byronious', teamName: "Beaker's SecretCommotion",  theme: 'pirate', color: '#d93c5c' }, // Byronious0726
  '998726733442596864': { persona: 'Dawg Pound Dilly Willy',      short: 'Dilly',     teamName: 'Dill Went Off',             theme: 'dawg',   color: '#9b6a3e' }  // DillWentOff
};

const THEMES = ['spots', 'spikes', 'royal', 'dragon', 'pirate', 'dawg'];
const COLORS = ['#cfc9bb', '#f0a020', '#5b8ff0', '#3db37a', '#d93c5c', '#9b6a3e'];

// Anyone not in the table (a new owner, a swapped roster) still gets a truck.
export function driverFor(ownerId, index, user) {
  if (DRIVERS[ownerId]) return DRIVERS[ownerId];
  const name = (user && user.display_name) || 'Driver ' + (index + 1);
  return { persona: name, short: name.slice(0, 9), teamName: '', theme: THEMES[index % 6], color: COLORS[index % 6] };
}
