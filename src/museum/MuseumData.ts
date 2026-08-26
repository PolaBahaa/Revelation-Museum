/// <reference types="vite/client" />
import { Hall, Artwork, WallSlot } from '../types';
import rawDiscoveredPaintings from './discoveredPaintings.json';

export type { WallSlot };

/**
 * CANONICAL MUSEUM CAPACITY: Exactly 84 real, valid physical wall display slots.
 * Derived from the verified architectural audit (48 original slots + 36 additional verified slots = 84 total).
 */
export const MAX_ARTWORKS = 84;

export interface DiscoveredPaintingFile {
  filename: string;
  number: number;
  url: string;
}

// 1. Static/compiled manifest from discoveredPaintings.json (clamped to MAX_ARTWORKS)
const rawList = (rawDiscoveredPaintings as DiscoveredPaintingFile[]).filter(
  d => d.number >= 1 && d.number <= MAX_ARTWORKS
);
const discoveredList: DiscoveredPaintingFile[] = [...rawList];

// 2. Vite compile-time discovery fallback scanning /public/paintings/ and relative paths
const globFiles1: Record<string, unknown> = typeof import.meta.glob === 'function'
  ? import.meta.glob<{ default: string }>(
      ['/public/paintings/*.png', '/public/paintings/*.PNG', '/public/paintings/*.jpg', '/public/paintings/*.jpeg', '/public/paintings/*.webp'],
      { eager: true }
    )
  : {};

const globFiles2: Record<string, unknown> = typeof import.meta.glob === 'function'
  ? import.meta.glob<{ default: string }>(
      ['../../public/paintings/*.png', '../../public/paintings/*.PNG', '../../public/paintings/*.jpg', '../../public/paintings/*.jpeg', '../../public/paintings/*.webp'],
      { eager: true }
    )
  : {};

const allGlobKeys = [...Object.keys(globFiles1), ...Object.keys(globFiles2)];

for (const key of allGlobKeys) {
  const filename = key.split('/').pop() || '';
  const match = filename.match(/^0*(\d+)\.(png|PNG|jpg|jpeg|webp)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0 && num <= MAX_ARTWORKS && !discoveredList.some(d => d.number === num)) {
      discoveredList.push({
        filename,
        number: num,
        url: `/paintings/${filename}`
      });
    }
  }
}

// 3. Direct Node.js runtime fallback if running in a Node / test / script environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const paintingsDir = path.resolve(process.cwd(), 'public/paintings');
    if (fs.existsSync(paintingsDir)) {
      const files: string[] = fs.readdirSync(paintingsDir);
      for (const file of files) {
        const match = file.match(/^0*(\d+)\.(png|PNG|jpg|jpeg|webp)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > 0 && num <= MAX_ARTWORKS && !discoveredList.some(d => d.number === num)) {
            discoveredList.push({
              filename: file,
              number: num,
              url: `/paintings/${file}`
            });
          }
        }
      }
    }
  } catch {
    // sandboxed or browser environment
  }
}

discoveredList.sort((a, b) => a.number - b.number);

export const MUSEUM_HALLS: Hall[] = [
  {
    id: 'hall_01',
    code: 'Hall 01',
    title: 'Classical Masterworks Gallery',
    subTitle: 'First Exhibition Wing',
    theme: 'Classical Masterworks & Illumination',
    description: 'A distinguished gallery presenting illuminated fine art masterworks and classical compositions.',
    center: [-30, 0, 10],
    size: [20, 6, 20],
    artworks: [] // Populated below
  },
  {
    id: 'hall_02',
    code: 'Hall 02',
    title: 'Historic Heritage Gallery',
    subTitle: 'Second Exhibition Wing',
    theme: 'Historic Narratives & Fine Arts',
    description: 'Featuring dramatic thematic collections and historic narrative visual art.',
    center: [-30, 0, -15],
    size: [20, 6, 20],
    artworks: []
  },
  {
    id: 'hall_03',
    code: 'Hall 03',
    title: 'Grand Luminary Gallery',
    subTitle: 'Third Exhibition Wing',
    theme: 'Luminous Compositions & Celestial Light',
    description: 'Dedicated to luminous masterworks and celestial aesthetic compositions.',
    center: [30, 0, 10],
    size: [20, 6, 20],
    artworks: []
  },
  {
    id: 'hall_04',
    code: 'Hall 04',
    title: 'Sovereign Heritage Gallery',
    subTitle: 'Fourth Exhibition Wing',
    theme: 'Expressive Studies & Grand Contrast',
    description: 'Displaying expressive fine art pieces and high-contrast dramatic visual studies.',
    center: [30, 0, -15],
    size: [20, 6, 20],
    artworks: []
  },
  {
    id: 'hall_05',
    code: 'Hall 05',
    title: 'Royal Masterpiece Gallery',
    subTitle: 'Fifth Exhibition Wing',
    theme: 'Monumental Fine Art & Triumph',
    description: 'Showcasing grand monumental compositions and historic fine art collections.',
    center: [-15, 0, -38],
    size: [22, 6, 20],
    artworks: []
  },
  {
    id: 'hall_06',
    code: 'Hall 06',
    title: 'Imperial Dawn Gallery',
    subTitle: 'Sixth Exhibition Wing',
    theme: 'Architectural Splendor & Radiance',
    description: 'Immersing visitors in illuminated architectural perspectives and golden radiance fine art.',
    center: [15, 0, -38],
    size: [22, 6, 20],
    artworks: []
  },
  {
    id: 'final_hall',
    code: 'Throne Hall',
    title: 'The Grand Sovereign Hall',
    subTitle: 'Culmination Gallery of Eternity',
    theme: 'Everlasting Sovereignty & Grandeur',
    description: 'The supreme sanctuary at the northern culmination of the palace, enshrining majestic fine art masterworks.',
    center: [0, 0, -68],
    size: [24, 7, 18],
    artworks: []
  }
];

const MANUAL_ARTWORKS: Artwork[] = [
  // ==========================================
  // HALL 01: THE SEVEN SEALS (Artworks 1 to 6)
  // ==========================================
  {
    id: 'art_01',
    number: 1,
    title: 'Vision of the Son of Man',
    subTitle: 'Standing Among Seven Golden Lampstands',
    scripture: 'Revelation 1:12-16',
    passage: 'I turned around to see the voice that was speaking to me. And when I turned I saw seven golden lampstands, and among the lampstands was someone like a son of man, dressed in a robe reaching down to his feet and with a golden sash around his chest.',
    description: 'Depicting the glorified Christ standing amidst seven burning golden lampstands, holding seven stars in His right hand, eyes flaming like fire, and a voice like roaring waters.',
    hallId: 'hall_01',
    hallName: 'Hall 01: The Seven Seals',
    canvasColorPrimary: '#1e1b4b',
    canvasColorSecondary: '#fbbf24',
    symbolism: 'Seven Lampstands, Seven Stars, Robe of Royal Priesthood'
  },
  {
    id: 'art_02',
    number: 2,
    title: 'The Heavenly Throne Room',
    subTitle: 'Surrounded by Emerald Rainbow & 24 Elders',
    scripture: 'Revelation 4:2-4',
    passage: 'At once I was in the Spirit, and there before me was a throne in heaven with someone sitting on it. A rainbow that shone like an emerald encircled the throne.',
    description: 'A majestic vision of the Throne of God surrounded by twenty-four elders crowned in gold, casting their crowns before the crystal sea of glass.',
    hallId: 'hall_01',
    hallName: 'Hall 01: The Seven Seals',
    canvasColorPrimary: '#064e3b',
    canvasColorSecondary: '#a7f3d0',
    symbolism: 'Emerald Rainbow, Sea of Glass, Golden Crowns'
  },
  {
    id: 'art_03',
    number: 3,
    title: 'The Scroll Sealed with Seven Seals',
    subTitle: 'Worthy is the Lamb Who Was Slain',
    scripture: 'Revelation 5:1-7',
    passage: 'Then I saw in the right hand of him who sat on the throne a scroll with writing on both sides and sealed with seven seals... Then I saw a Lamb, looking as if it had been slain, standing at the center of the throne.',
    description: 'The ancient parchment scroll containing the destiny of creation, which none in heaven or earth could open except the Lion of Judah, the slain Lamb of God.',
    hallId: 'hall_01',
    hallName: 'Hall 01: The Seven Seals',
    canvasColorPrimary: '#78350f',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Seven-Sealed Scroll, Lion of Judah, Slain Lamb'
  },
  {
    id: 'art_04',
    number: 4,
    title: 'The Four Horsemen',
    subTitle: 'Conquest, War, Famine, and Death',
    scripture: 'Revelation 6:1-8',
    passage: 'I looked, and there before me was a white horse! Its rider held a bow, and he was given a crown... then a red horse, a black horse with scales, and a pale horse named Death.',
    description: 'The iconic chiaroscuro composition representing the unveiling of the first four seals: the crowned archer on the white horse, the sword-bearer on the red horse, the balance-holder on the black horse, and Hades following Death.',
    hallId: 'hall_01',
    hallName: 'Hall 01: The Seven Seals',
    canvasColorPrimary: '#450a0a',
    canvasColorSecondary: '#dc2626',
    symbolism: 'White Bow, Red Sword, Black Balances, Pale Horse'
  },
  {
    id: 'art_05',
    number: 5,
    title: 'The Souls Beneath the Altar',
    subTitle: 'The Fifth Seal & The White Robes',
    scripture: 'Revelation 6:9-11',
    passage: 'When he opened the fifth seal, I saw under the altar the souls of those who had been slain because of the word of God... Each of them was given a white robe.',
    description: 'An evocative Baroque painting portraying martyrs in luminous white robes beneath the heavenly altar, receiving the promise of ultimate vindication.',
    hallId: 'hall_01',
    hallName: 'Hall 01: The Seven Seals',
    canvasColorPrimary: '#312e81',
    canvasColorSecondary: '#e0e7ff',
    symbolism: 'White Robes, Golden Altar, Divine Vindication'
  },
  {
    id: 'art_06',
    number: 6,
    title: 'The Great Cosmic Tremor',
    subTitle: 'The Sixth Seal: Sun Turned Black & Moon to Blood',
    scripture: 'Revelation 6:12-14',
    passage: 'I watched as he opened the sixth seal. There was a great earthquake. The sun turned black like sackcloth made of goat hair, the whole moon turned blood red, and the stars in the sky fell to earth.',
    description: 'A dramatic landscape depicting celestial tremors, the darkened sun, blood moon, and shifting firmament signaling the onset of divine majesty.',
    hallId: 'hall_01',
    hallName: 'Hall 01: The Seven Seals',
    canvasColorPrimary: '#0f172a',
    canvasColorSecondary: '#b91c1c',
    symbolism: 'Blood Moon, Darkened Sun, Falling Stars'
  },

  // =============================================
  // HALL 02: THE SEVEN TRUMPETS (Artworks 7 to 12)
  // =============================================
  {
    id: 'art_07',
    number: 7,
    title: 'Sealing of the 144,000',
    subTitle: 'Servants Sealed on Their Foreheads',
    scripture: 'Revelation 7:2-4',
    passage: 'Then I saw another angel coming up from the east, having the seal of the living God. He called out in a loud voice to the four angels... Do not harm the land until we put a seal on the foreheads of the servants of our God.',
    description: 'Golden light beams marking the redeemed with divine protection before the tempestuous wind angels release their hold upon the earth.',
    hallId: 'hall_02',
    hallName: 'Hall 02: The Seven Trumpets',
    canvasColorPrimary: '#1e3a8a',
    canvasColorSecondary: '#f59e0b',
    symbolism: 'Divine Seal, Four Winds, Radiant Sunrise'
  },
  {
    id: 'art_08',
    number: 8,
    title: 'The Great Multitude in White',
    subTitle: 'Palm Branches & The Shepherd Lamb',
    scripture: 'Revelation 7:9-14',
    passage: 'After this I looked, and there before me was a great multitude that no one could count, from every nation, tribe, people and language, standing before the throne and before the Lamb. They were wearing white robes and were holding palm branches.',
    description: 'An uplifting panoramic canvas overflowing with an international crowd carrying green palm branches, worshipping in eternal joy.',
    hallId: 'hall_02',
    hallName: 'Hall 02: The Seven Trumpets',
    canvasColorPrimary: '#047857',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Palm Branches, Multitude of Nations, Living Fountains'
  },
  {
    id: 'art_09',
    number: 9,
    title: 'The Incense & Silence in Heaven',
    subTitle: 'The Seventh Seal & Golden Censer',
    scripture: 'Revelation 8:1-5',
    passage: 'When he opened the seventh seal, there was silence in heaven for about half an hour... The angel took the censer, filled it with fire from the altar, and hurled it on the earth.',
    description: 'A quiet, solemn painting capturing the 30-minute sacred silence in heaven before an angel offers golden incense with prayers on the altar.',
    hallId: 'hall_02',
    hallName: 'Hall 02: The Seven Trumpets',
    canvasColorPrimary: '#4c1d95',
    canvasColorSecondary: '#fbbf24',
    symbolism: 'Golden Censer, Fragrant Incense, Sacred Silence'
  },
  {
    id: 'art_10',
    number: 10,
    title: 'The Blare of the First Trumpets',
    subTitle: 'Hail, Fire, and the Blazing Mountain',
    scripture: 'Revelation 8:7-8',
    passage: 'The first angel sounded his trumpet, and there came hail and fire mixed with blood... The second angel sounded his trumpet, and something like a huge mountain, all ablaze, was thrown into the sea.',
    description: 'Powerful atmospheric study of atmospheric alarms, celestial hail, and a blazing mountain plummeting into the deep ocean waters.',
    hallId: 'hall_02',
    hallName: 'Hall 02: The Seven Trumpets',
    canvasColorPrimary: '#7c2d12',
    canvasColorSecondary: '#f97316',
    symbolism: 'Trumpet Alarms, Blazing Mountain, Ocean Waters'
  },
  {
    id: 'art_11',
    number: 11,
    title: 'The Angel with the Little Scroll',
    subTitle: 'Swearing by Him Who Lives Forever',
    scripture: 'Revelation 10:1-6',
    passage: 'Then I saw another mighty angel coming down from heaven... He was holding a little scroll, which lay open in his hand. He set his right foot on the sea and his left foot on the land.',
    description: 'A colossal angel shrouded in clouds with a rainbow halo above his head, planting feet upon sea and land, proclaiming that time shall be no more.',
    hallId: 'hall_02',
    hallName: 'Hall 02: The Seven Trumpets',
    canvasColorPrimary: '#0284c7',
    canvasColorSecondary: '#fde047',
    symbolism: 'Rainbow Halo, Pillar Legs, Open Little Scroll'
  },
  {
    id: 'art_12',
    number: 12,
    title: 'The Two Witnesses',
    subTitle: 'Fire from Their Mouths & Ascension to Heaven',
    scripture: 'Revelation 11:3-12',
    passage: 'And I will appoint my two witnesses, and they will prophesy for 1,260 days, clothed in sackcloth... They stood on their feet, and terror struck those who saw them. Then they heard a loud voice from heaven saying, "Come up here."',
    description: 'The two prophetic olive trees and lampstands witnessing with power before ascending into the clouds amidst heavenly light.',
    hallId: 'hall_02',
    hallName: 'Hall 02: The Seven Trumpets',
    canvasColorPrimary: '#3f6212',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Two Olive Trees, Two Golden Lampstands, Heavenly Cloud'
  },

  // ==============================================
  // HALL 03: THE HEAVENLY VISION (Artworks 13 to 18)
  // ==============================================
  {
    id: 'art_13',
    number: 13,
    title: 'The Woman Clothed with the Sun',
    subTitle: 'A Great Sign in Heaven',
    scripture: 'Revelation 12:1-2',
    passage: 'A great sign appeared in heaven: a woman clothed with the sun, with the moon under her feet and a crown of twelve stars on her head.',
    description: 'A breathtaking masterpiece depicting the radiant woman enveloped in solar light, standing on the crescent moon with a twelve-star crown.',
    hallId: 'hall_03',
    hallName: 'Hall 03: The Heavenly Vision',
    canvasColorPrimary: '#1e1b4b',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Solar Rays, Crescent Moon, Twelve Stars'
  },
  {
    id: 'art_14',
    number: 14,
    title: 'War in Heaven',
    subTitle: 'Archangel Michael Overcoming the Dragon',
    scripture: 'Revelation 12:7-9',
    passage: 'Then war broke out in heaven. Michael and his angels fought against the dragon, and the dragon and his angels fought back. But he was not strong enough... The great dragon was hurled down.',
    description: 'Classic Renaissance-style battle scene showing Archangel Michael in armored gold casting down the ancient serpent dragon.',
    hallId: 'hall_03',
    hallName: 'Hall 03: The Heavenly Vision',
    canvasColorPrimary: '#831843',
    canvasColorSecondary: '#facc15',
    symbolism: 'Archangel Armor, Flaming Spear, Fallen Serpent'
  },
  {
    id: 'art_15',
    number: 15,
    title: 'The Wings of the Eagle',
    subTitle: 'Preservation in the Wilderness',
    scripture: 'Revelation 12:13-14',
    passage: 'The woman was given the two wings of a great eagle, so that she might fly to the place prepared for her in the wilderness.',
    description: 'Surreal and spiritual canvas illustrating golden eagle wings carrying the sanctuary woman across desert canyons to safety.',
    hallId: 'hall_03',
    hallName: 'Hall 03: The Heavenly Vision',
    canvasColorPrimary: '#701a75',
    canvasColorSecondary: '#fbcfe8',
    symbolism: 'Great Eagle Wings, Wilderness Refuge, Divine Flight'
  },
  {
    id: 'art_16',
    number: 16,
    title: 'The Lamb on Mount Zion',
    subTitle: 'The 144,000 Singing a New Song',
    scripture: 'Revelation 14:1-3',
    passage: 'Then I looked, and there before me was the Lamb, standing on Mount Zion, and with him 144,000 who had his name and his Father\'s name written on their foreheads.',
    description: 'A serene mountain sanctuary painting bathed in morning sunlight, with the Lamb standing at the peak amidst worshippers.',
    hallId: 'hall_03',
    hallName: 'Hall 03: The Heavenly Vision',
    canvasColorPrimary: '#065f46',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Mount Zion, Pure Lamb, New Song Harps'
  },
  {
    id: 'art_17',
    number: 17,
    title: 'The Three Angelic Messages',
    subTitle: 'Flying Through Midair with Everlasting Gospel',
    scripture: 'Revelation 14:6-7',
    passage: 'Then I saw another angel flying in midair, and he had the everlasting gospel to proclaim to those who live on the earth... He said in a loud voice, "Fear God and give him glory."',
    description: 'Three majestic celestial heralds winging across twilight skies bearing the eternal gospel to every tribe and language.',
    hallId: 'hall_03',
    hallName: 'Hall 03: The Heavenly Vision',
    canvasColorPrimary: '#0369a1',
    canvasColorSecondary: '#bae6fd',
    symbolism: 'Everlasting Gospel, Celestial Trumpets, Flight of Hope'
  },
  {
    id: 'art_18',
    number: 18,
    title: 'The Harvest of the Earth',
    subTitle: 'Golden Sickle & The Vintage Winepress',
    scripture: 'Revelation 14:14-16',
    passage: 'I looked, and there before me was a white cloud, and seated on the cloud was one like a son of man with a crown of gold on his head and a sharp sickle in his hand.',
    description: 'An allegorical painting showcasing the golden harvest sickle gleaming against white cloud banks as the earth reaps its appointed season.',
    hallId: 'hall_03',
    hallName: 'Hall 03: The Heavenly Vision',
    canvasColorPrimary: '#9a3412',
    canvasColorSecondary: '#fed7aa',
    symbolism: 'Golden Sickle, White Cloud, Ripe Harvest'
  },

  // ==========================================
  // HALL 04: THE SEVEN BOWLS (Artworks 19 to 24)
  // ==========================================
  {
    id: 'art_19',
    number: 19,
    title: 'The Sea of Glass Mixed with Fire',
    subTitle: 'The Song of Moses and the Lamb',
    scripture: 'Revelation 15:2-3',
    passage: 'And I saw what looked like a sea of glass glowing with fire and, standing beside the sea, those who had been victorious... They held harps given them by God and sang the song of God\'s servant Moses.',
    description: 'A stunning reflective canvas displaying victorious believers holding golden harps beside a crystalline sea glowing with fiery embers.',
    hallId: 'hall_03',
    hallName: 'Hall 04: The Seven Bowls',
    canvasColorPrimary: '#15803d',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Golden Harps, Crystalline Sea, Song of Redemption'
  },
  {
    id: 'art_20',
    number: 20,
    title: 'Seven Angels with Seven Golden Bowls',
    subTitle: 'Clothed in Pure White Linen with Golden Sashes',
    scripture: 'Revelation 15:6-7',
    passage: 'Out of the temple came the seven angels with the seven plagues. They were dressed in clean, shining linen and wore golden sashes around their chests... Then one of the four living creatures gave to the seven angels seven golden bowls.',
    description: 'Luminous angels emerging from the heavenly temple, holding glowing golden chalices filled with divine righteousness.',
    hallId: 'hall_04',
    hallName: 'Hall 04: The Seven Bowls',
    canvasColorPrimary: '#854d0e',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Shining Linen, Golden Bowls, Heavenly Temple'
  },
  {
    id: 'art_21',
    number: 21,
    title: 'Drying of the Great River Euphrates',
    subTitle: 'Preparing the Way for Kings of the East',
    scripture: 'Revelation 16:12',
    passage: 'The sixth angel poured out his bowl on the great river Euphrates, and its water was dried up to prepare the way for the kings from the East.',
    description: 'A moody, dramatic riverbed landscape where ancient waters recede to expose golden sandbanks beneath distant mountain horizons.',
    hallId: 'hall_04',
    hallName: 'Hall 04: The Seven Bowls',
    canvasColorPrimary: '#78350f',
    canvasColorSecondary: '#fde047',
    symbolism: 'Euphrates Riverbed, Sunset Horizon, Eastern Kings'
  },
  {
    id: 'art_22',
    number: 22,
    title: 'It is Done!',
    subTitle: 'The Seventh Bowl Outpoured into the Air',
    scripture: 'Revelation 16:17-18',
    passage: 'The seventh angel poured out his bowl into the air, and out of the temple came a loud voice from the throne, saying, "It is done!" Then there came flashes of lightning, rumblings, peals of thunder.',
    description: 'A high-contrast lightning sky study illustrating the climax of the bowl judgments and the reverberating divine decree.',
    hallId: 'hall_04',
    hallName: 'Hall 04: The Seven Bowls',
    canvasColorPrimary: '#1e1b4b',
    canvasColorSecondary: '#38bdf8',
    symbolism: 'Lightning Flashes, Voice from Throne, Final Decree'
  },
  {
    id: 'art_23',
    number: 23,
    title: 'Fallen is Babylon the Great',
    subTitle: 'The Collapse of Worldly Pride',
    scripture: 'Revelation 18:1-3',
    passage: 'After this I saw another angel coming down from heaven... He cried out with a mighty voice: "Fallen, fallen is Babylon the great! She has become a dwelling place for demons."',
    description: 'An architectural ruin landscape reminiscent of Turner or Cole, contrasting crumbling marble towers with angelic rays from above.',
    hallId: 'hall_04',
    hallName: 'Hall 04: The Seven Bowls',
    canvasColorPrimary: '#451a03',
    canvasColorSecondary: '#fb923c',
    symbolism: 'Crumbling Columns, Angelic Illumination, Dust & Ashes'
  },
  {
    id: 'art_24',
    number: 24,
    title: 'The Great Millstone Cast into the Sea',
    subTitle: 'Never to Be Found Again',
    scripture: 'Revelation 18:21',
    passage: 'Then a mighty angel picked up a boulder the size of a large millstone and threw it into the sea, and said, "With such violence the great city of Babylon will be thrown down, never to be found again."',
    description: 'Dynamic splash painting capturing the moment a massive millstone strikes ocean waves under tempestuous skies.',
    hallId: 'hall_04',
    hallName: 'Hall 04: The Seven Bowls',
    canvasColorPrimary: '#0f172a',
    canvasColorSecondary: '#94a3b8',
    symbolism: 'Mighty Millstone, Ocean Surge, Irreversible Decree'
  },

  // ==============================================
  // HALL 05: THE FINAL VICTORY (Artworks 25 to 30)
  // ==============================================
  {
    id: 'art_25',
    number: 25,
    title: 'The Heavenly Hallelujah Chorus',
    subTitle: 'Salvation, Glory, and Power Belong to Our God',
    scripture: 'Revelation 19:1-3',
    passage: 'After this I heard what sounded like the roar of a great multitude in heaven shouting: "Hallelujah! Salvation and glory and power belong to our God."',
    description: 'A luminous choral canvas filled with heavenly hosts singing praises in radiant golden robes around the throne.',
    hallId: 'hall_05',
    hallName: 'Hall 05: The Final Victory',
    canvasColorPrimary: '#854d0e',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Roar of Multitude, Golden Harps, Eternal Praise'
  },
  {
    id: 'art_26',
    number: 26,
    title: 'The Marriage Supper of the Lamb',
    subTitle: 'Blessed Are Those Invited to the Banquet',
    scripture: 'Revelation 19:7-9',
    passage: 'Let us rejoice and be glad and give him glory! For the wedding of the Lamb has come, and his bride has made herself ready. Fine linen, bright and clean, was given her to wear.',
    description: 'A banquet scene of royal splendor showcasing golden tables laden with fruit and wine, lit by soft chandeliers of light.',
    hallId: 'hall_05',
    hallName: 'Hall 05: The Final Victory',
    canvasColorPrimary: '#581c87',
    canvasColorSecondary: '#fde047',
    symbolism: 'Fine White Linen, Royal Banquet Table, Wedding Feast'
  },
  {
    id: 'art_27',
    number: 27,
    title: 'Rider on the White Horse',
    subTitle: 'Faithful and True, Eyes Like Flames of Fire',
    scripture: 'Revelation 19:11-13',
    passage: 'I saw heaven standing open and there before me was a white horse, whose rider is called Faithful and True... On his head are many crowns. He is dressed in a robe dipped in blood, and his name is the Word of God.',
    description: 'An impressive central heroic painting: The King of Kings mounted on a majestic white steed descending through open skies with heavenly armies.',
    hallId: 'hall_05',
    hallName: 'Hall 05: The Final Victory',
    canvasColorPrimary: '#1e3a8a',
    canvasColorSecondary: '#ffffff',
    symbolism: 'White Steed, Diadem Crowns, Sword of Truth'
  },
  {
    id: 'art_28',
    number: 28,
    title: 'The Armies of Heaven',
    subTitle: 'Dressed in Fine Linen, White and Clean',
    scripture: 'Revelation 19:14',
    passage: 'The armies of heaven were following him, riding on white horses and dressed in fine linen, white and clean.',
    description: 'An expansive cavalry painting depicting thousands of glorious riders on white steeds clad in pure bright linen.',
    hallId: 'hall_05',
    hallName: 'Hall 05: The Final Victory',
    canvasColorPrimary: '#0369a1',
    canvasColorSecondary: '#f0f9ff',
    symbolism: 'White Steeds, Unblemished Linen, Celestial Hosts'
  },
  {
    id: 'art_29',
    number: 29,
    title: 'King of Kings & Lord of Lords',
    subTitle: 'The Name Written on His Robe and Thigh',
    scripture: 'Revelation 19:16',
    passage: 'On his robe and on his thigh he has this name written: KING OF KINGS AND LORD OF LORDS.',
    description: 'Detailed portrait highlighting the royal golden sash and embroidered robe bearing the supreme title in glittering typography.',
    hallId: 'hall_05',
    hallName: 'Hall 05: The Final Victory',
    canvasColorPrimary: '#701a75',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Royal Sash, Embroidered Inscription, Sovereign Majesty'
  },
  {
    id: 'art_30',
    number: 30,
    title: 'The Great White Throne',
    subTitle: 'Earth and Sky Fled from His Presence',
    scripture: 'Revelation 20:11-12',
    passage: 'Then I saw a great white throne and him who was seated on it. From his presence earth and sky fled away, and there was no place for them... And the dead were judged according to what they had done as recorded in the books.',
    description: 'A sublime composition centered on a gleaming white marble throne from which rays of pure light radiate into infinity.',
    hallId: 'hall_05',
    hallName: 'Hall 05: The Final Victory',
    canvasColorPrimary: '#0f172a',
    canvasColorSecondary: '#f8fafc',
    symbolism: 'Pure White Throne, Open Books of Life, Infinity Rays'
  },

  // ==============================================
  // HALL 06: THE NEW JERUSALEM (Artworks 31 to 36)
  // ==============================================
  {
    id: 'art_31',
    number: 31,
    title: 'New Heaven and New Earth',
    subTitle: 'The First Things Have Passed Away',
    scripture: 'Revelation 21:1-2',
    passage: 'Then I saw a new heaven and a new earth, for the first heaven and the first earth had passed away, and there was no longer any sea. I saw the Holy City, the new Jerusalem, coming down out of heaven from God.',
    description: 'A serene pristine landscape showcasing a revitalized creation under crystal blue skies with the Holy City descending.',
    hallId: 'hall_06',
    hallName: 'Hall 06: The New Jerusalem',
    canvasColorPrimary: '#0284c7',
    canvasColorSecondary: '#fde047',
    symbolism: 'Pristine Creation, Descending Holy City, Morning Light'
  },
  {
    id: 'art_32',
    number: 32,
    title: 'God Dwelling with Humanity',
    subTitle: 'He Will Wipe Every Tear from Their Eyes',
    scripture: 'Revelation 21:3-4',
    passage: 'God’s dwelling place is now among the people, and he will dwell with them. They will be his people, and God himself will be with them... He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.',
    description: 'A warm tender painting depicting gentle golden hands wiping tears, bringing comfort and eternal joy to humanity.',
    hallId: 'hall_06',
    hallName: 'Hall 06: The New Jerusalem',
    canvasColorPrimary: '#15803d',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Tearless Comfort, Golden Sanctuary, Divine Presence'
  },
  {
    id: 'art_33',
    number: 33,
    title: 'The City of Pure Gold & Jasper Wall',
    subTitle: 'Shining with the Glory of God',
    scripture: 'Revelation 21:10-11, 18',
    passage: 'He carried me away in the Spirit to a mountain great and high, and showed me the Holy City, Jerusalem... It shone with the glory of God, and its brilliance was like that of a very precious jewel, like a jasper, clear as crystal.',
    description: 'An architectural fantasy canvas illustrating golden city towers, jasper walls, and pearl gates reflecting rainbow brilliance.',
    hallId: 'hall_06',
    hallName: 'Hall 06: The New Jerusalem',
    canvasColorPrimary: '#b45309',
    canvasColorSecondary: '#fde047',
    symbolism: 'Jasper Walls, Clear Gold Street, Pearly Gates'
  },
  {
    id: 'art_34',
    number: 34,
    title: 'Twelve Foundations of Precious Stones',
    subTitle: 'Sapphire, Emerald, Topaz, and Amethyst',
    scripture: 'Revelation 21:19-21',
    passage: 'The foundations of the city walls were decorated with every kind of precious stone. The first foundation was jasper, the second sapphire, the third agate, the fourth emerald...',
    description: 'A vibrant gemological artwork showcasing twelve layers of glowing precious jewels forming the unbreakable foundation of the city.',
    hallId: 'hall_06',
    hallName: 'Hall 06: The New Jerusalem',
    canvasColorPrimary: '#1e1b4b',
    canvasColorSecondary: '#38bdf8',
    symbolism: 'Twelve Gem Foundations, Sapphire & Emerald, Pearl Portals'
  },
  {
    id: 'art_35',
    number: 35,
    title: 'The River of the Water of Life',
    subTitle: 'Clear as Crystal, Flowing from the Throne',
    scripture: 'Revelation 22:1-2',
    passage: 'Then the angel showed me the river of the water of life, as clear as crystal, flowing from the throne of God and of the Lamb down the middle of the great street of the city.',
    description: 'A tranquil river scene with crystal-clear waters winding down a avenue of gold, reflecting the light of the Lamb.',
    hallId: 'hall_06',
    hallName: 'Hall 06: The New Jerusalem',
    canvasColorPrimary: '#0891b2',
    canvasColorSecondary: '#a5f3fc',
    symbolism: 'Crystal River, Golden Street, Eternal Refreshment'
  },
  {
    id: 'art_36',
    number: 36,
    title: 'The Tree of Life',
    subTitle: 'Bearing Twelve Crops of Fruit for Healing of Nations',
    scripture: 'Revelation 22:2-5',
    passage: 'On each side of the river stood the tree of life, bearing twelve crops of fruit, yielding its fruit every month. And the leaves of the tree are for the healing of the nations. There will be no more curse.',
    description: 'The triumphant final masterpiece: The lush Tree of Life blossoming with golden fruit beside the river, illuminated by God\'s eternal glory.',
    hallId: 'hall_06',
    hallName: 'Hall 06: The New Jerusalem',
    canvasColorPrimary: '#166534',
    canvasColorSecondary: '#fef08a',
    symbolism: 'Tree of Life, Healing Leaves, Eternal Light'
  },
  {
    id: 'art_37',
    number: 37,
    title: 'The Sovereign Throne of Eternity',
    subTitle: 'The Sovereign Alpha and Omega in Unapproachable Light',
    scripture: 'Revelation 20:11; 21:5-6',
    passage: 'Then I saw a great white throne and him who was seated on it. The earth and the heavens fled from his presence... He who was seated on the throne said, "I am making everything new! I am the Alpha and the Omega, the Beginning and the End."',
    description: 'The monumental culmination masterpiece in the Final Throne Gallery: The eternal throne surrounded by celestial radiance and the renewal of all creation.',
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    canvasColorPrimary: '#4a044e',
    canvasColorSecondary: '#fde047',
    symbolism: 'White Throne, Alpha and Omega, Celestial Splendor'
  },
  {
    id: 'art_38',
    number: 38,
    title: 'Artwork 38',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/38.png'
  },
  {
    id: 'art_39',
    number: 39,
    title: 'Artwork 39',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/39.png'
  },
  {
    id: 'art_40',
    number: 40,
    title: 'Artwork 40',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/40.png'
  },
  {
    id: 'art_41',
    number: 41,
    title: 'Artwork 41',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/41.png'
  },
  {
    id: 'art_42',
    number: 42,
    title: 'Artwork 42',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/42.png'
  },
  {
    id: 'art_43',
    number: 43,
    title: 'Artwork 43',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'lobby',
    hallName: 'Grand Reception Lobby',
    textureUrl: '/paintings/43.png'
  },
  {
    id: 'art_44',
    number: 44,
    title: 'Artwork 44',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'lobby',
    hallName: 'Grand Reception Lobby',
    textureUrl: '/paintings/44.png'
  },
  {
    id: 'art_45',
    number: 45,
    title: 'Artwork 45',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/45.png'
  },
  {
    id: 'art_46',
    number: 46,
    title: 'Artwork 46',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/46.png'
  },
  {
    id: 'art_47',
    number: 47,
    title: 'Artwork 47',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/47.png'
  },
  {
    id: 'art_48',
    number: 48,
    title: 'Artwork 48',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/48.png'
  },
  {
    id: 'art_49',
    number: 49,
    title: 'Artwork 49',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_south',
    hallName: 'Royal Processional Gallery',
    textureUrl: '/paintings/49.png'
  },
  {
    id: 'art_50',
    number: 50,
    title: 'Artwork 50',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_south',
    hallName: 'Royal Processional Gallery',
    textureUrl: '/paintings/50.png'
  },
  {
    id: 'art_51',
    number: 51,
    title: 'Artwork 51',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_south',
    hallName: 'Royal Processional Gallery',
    textureUrl: '/paintings/51.png'
  },
  {
    id: 'art_52',
    number: 52,
    title: 'Artwork 52',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_south',
    hallName: 'Royal Processional Gallery',
    textureUrl: '/paintings/52.png'
  },
  {
    id: 'art_53',
    number: 53,
    title: 'Artwork 53',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'lobby',
    hallName: 'Grand Reception Lobby',
    textureUrl: '/paintings/53.png'
  },
  {
    id: 'art_54',
    number: 54,
    title: 'Artwork 54',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'lobby',
    hallName: 'Grand Reception Lobby',
    textureUrl: '/paintings/54.png'
  },
  {
    id: 'art_55',
    number: 55,
    title: 'Artwork 55',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/55.png'
  },
  {
    id: 'art_56',
    number: 56,
    title: 'Artwork 56',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/56.png'
  },
  {
    id: 'art_57',
    number: 57,
    title: 'Artwork 57',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/57.png'
  },
  {
    id: 'art_58',
    number: 58,
    title: 'Artwork 58',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'rotunda',
    hallName: 'Central Rotunda',
    textureUrl: '/paintings/58.png'
  },
  {
    id: 'art_59',
    number: 59,
    title: 'Artwork 59',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_west',
    hallName: 'West Gallery Corridor',
    textureUrl: '/paintings/59.png'
  },
  {
    id: 'art_60',
    number: 60,
    title: 'Artwork 60',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_west',
    hallName: 'West Gallery Corridor',
    textureUrl: '/paintings/60.png'
  },
  {
    id: 'art_61',
    number: 61,
    title: 'Artwork 61',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_west',
    hallName: 'West Gallery Corridor',
    textureUrl: '/paintings/61.png'
  },
  {
    id: 'art_62',
    number: 62,
    title: 'Artwork 62',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_west',
    hallName: 'West Gallery Corridor',
    textureUrl: '/paintings/62.png'
  },
  {
    id: 'art_63',
    number: 63,
    title: 'Artwork 63',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_west',
    hallName: 'West Gallery Corridor',
    textureUrl: '/paintings/63.png'
  },
  {
    id: 'art_64',
    number: 64,
    title: 'Artwork 64',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_east',
    hallName: 'East Gallery Corridor',
    textureUrl: '/paintings/64.png'
  },
  {
    id: 'art_65',
    number: 65,
    title: 'Artwork 65',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_east',
    hallName: 'East Gallery Corridor',
    textureUrl: '/paintings/64.png'
  },
  {
    id: 'art_66',
    number: 66,
    title: 'Artwork 66',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_east',
    hallName: 'East Gallery Corridor',
    textureUrl: '/paintings/66.png'
  },
  {
    id: 'art_67',
    number: 67,
    title: 'Artwork 67',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_east',
    hallName: 'East Gallery Corridor',
    textureUrl: '/paintings/67.png'
  },
  {
    id: 'art_68',
    number: 68,
    title: 'Artwork 68',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_east',
    hallName: 'East Gallery Corridor',
    textureUrl: '/paintings/68.png'
  },
  {
    id: 'art_69',
    number: 69,
    title: 'Artwork 69',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_north',
    hallName: 'State North Hallway',
    textureUrl: '/paintings/69.png'
  },
  {
    id: 'art_70',
    number: 70,
    title: 'Artwork 70',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_north',
    hallName: 'State North Hallway',
    textureUrl: '/paintings/70.png'
  },
  {
    id: 'art_71',
    number: 71,
    title: 'Artwork 71',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_north',
    hallName: 'State North Hallway',
    textureUrl: '/paintings/71.png'
  },
  {
    id: 'art_72',
    number: 72,
    title: 'Artwork 72',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'corridor_north',
    hallName: 'State North Hallway',
    textureUrl: '/paintings/72.png'
  },
  {
    id: 'art_73',
    number: 73,
    title: 'Artwork 73',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'passage_final',
    hallName: 'Grand Sovereign Corridor',
    textureUrl: '/paintings/73.png'
  },
  {
    id: 'art_74',
    number: 74,
    title: 'Artwork 74',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'passage_final',
    hallName: 'Grand Sovereign Corridor',
    textureUrl: '/paintings/74.png'
  },
  {
    id: 'art_75',
    number: 75,
    title: 'Artwork 75',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'passage_final',
    hallName: 'Grand Sovereign Corridor',
    textureUrl: '/paintings/75.png'
  },
  {
    id: 'art_76',
    number: 76,
    title: 'Artwork 76',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'passage_final',
    hallName: 'Grand Sovereign Corridor',
    textureUrl: '/paintings/76.png'
  },
  {
    id: 'art_77',
    number: 77,
    title: 'Artwork 77',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/77.png'
  },
  {
    id: 'art_78',
    number: 78,
    title: 'Artwork 78',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'final_hall',
    hallName: 'The Grand Sovereign Hall',
    textureUrl: '/paintings/78.png'
  },
  {
    id: 'art_79',
    number: 79,
    title: 'Artwork 79',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'hall_01',
    hallName: 'Hall 01: Classical Masterworks',
    textureUrl: '/paintings/79.png'
  },
  {
    id: 'art_80',
    number: 80,
    title: 'Artwork 80',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'hall_02',
    hallName: 'Hall 02: Historic Heritage',
    textureUrl: '/paintings/80.png'
  },
  {
    id: 'art_81',
    number: 81,
    title: 'Artwork 81',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'hall_03',
    hallName: 'Hall 03: Grand Luminary',
    textureUrl: '/paintings/81.png'
  },
  {
    id: 'art_82',
    number: 82,
    title: 'Artwork 82',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'hall_04',
    hallName: 'Hall 04: Sovereign Heritage',
    textureUrl: '/paintings/82.png'
  },
  {
    id: 'art_83',
    number: 83,
    title: 'Artwork 83',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'hall_05',
    hallName: 'Hall 05: Royal Masterpiece',
    textureUrl: '/paintings/83.png'
  },
  {
    id: 'art_84',
    number: 84,
    title: 'Artwork 84',
    subTitle: undefined,
    scripture: undefined,
    passage: undefined,
    description: undefined,
    hallId: 'hall_06',
    hallName: 'Hall 06: Imperial Dawn',
    textureUrl: '/paintings/84.png'
  }
];

export const CANONICAL_WALL_SLOTS: WallSlot[] = [
  // -----------------------------------------------------------------
  // HALL 01: CLASSICAL MASTERWORKS (Slots 1 - 6)
  // Bounds X: [-40, -20], Z: [0, 20]
  // -----------------------------------------------------------------
  { id: 'hall_01_slot_01', slotIndex: 1, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'North Wall Bay 1', pos: [-34.0, 2.6, 0.22], rotY: 0 },
  { id: 'hall_01_slot_02', slotIndex: 2, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'North Wall Bay 2', pos: [-26.0, 2.6, 0.22], rotY: 0 },
  { id: 'hall_01_slot_03', slotIndex: 3, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'South Wall Bay 1', pos: [-34.0, 2.6, 19.78], rotY: Math.PI },
  { id: 'hall_01_slot_04', slotIndex: 4, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'South Wall Bay 2', pos: [-26.0, 2.6, 19.78], rotY: Math.PI },
  { id: 'hall_01_slot_05', slotIndex: 5, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'West Wall Bay 1', pos: [-39.78, 2.6, 6.0], rotY: Math.PI / 2 },
  { id: 'hall_01_slot_06', slotIndex: 6, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'West Wall Bay 2', pos: [-39.78, 2.6, 14.0], rotY: Math.PI / 2 },

  // -----------------------------------------------------------------
  // HALL 02: HISTORIC HERITAGE (Slots 7 - 12)
  // Bounds X: [-40, -20], Z: [-25, -5]
  // -----------------------------------------------------------------
  { id: 'hall_02_slot_01', slotIndex: 7, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'North Wall Bay 1', pos: [-34.0, 2.6, -24.78], rotY: 0 },
  { id: 'hall_02_slot_02', slotIndex: 8, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'North Wall Bay 2', pos: [-26.0, 2.6, -24.78], rotY: 0 },
  { id: 'hall_02_slot_03', slotIndex: 9, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'South Wall Bay 1', pos: [-34.0, 2.6, -5.22], rotY: Math.PI },
  { id: 'hall_02_slot_04', slotIndex: 10, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'South Wall Bay 2', pos: [-26.0, 2.6, -5.22], rotY: Math.PI },
  { id: 'hall_02_slot_05', slotIndex: 11, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'West Wall Bay 1', pos: [-39.78, 2.6, -19.0], rotY: Math.PI / 2 },
  { id: 'hall_02_slot_06', slotIndex: 12, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'West Wall Bay 2', pos: [-39.78, 2.6, -11.0], rotY: Math.PI / 2 },

  // -----------------------------------------------------------------
  // HALL 03: GRAND LUMINARY (Slots 13 - 18)
  // Bounds X: [20, 40], Z: [0, 20]
  // -----------------------------------------------------------------
  { id: 'hall_03_slot_01', slotIndex: 13, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'North Wall Bay 1', pos: [26.0, 2.6, 0.22], rotY: 0 },
  { id: 'hall_03_slot_02', slotIndex: 14, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'North Wall Bay 2', pos: [34.0, 2.6, 0.22], rotY: 0 },
  { id: 'hall_03_slot_03', slotIndex: 15, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'South Wall Bay 1', pos: [26.0, 2.6, 19.78], rotY: Math.PI },
  { id: 'hall_03_slot_04', slotIndex: 16, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'South Wall Bay 2', pos: [34.0, 2.6, 19.78], rotY: Math.PI },
  { id: 'hall_03_slot_05', slotIndex: 17, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'East Wall Bay 1', pos: [39.78, 2.6, 6.0], rotY: -Math.PI / 2 },
  { id: 'hall_03_slot_06', slotIndex: 18, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'East Wall Bay 2', pos: [39.78, 2.6, 14.0], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // HALL 04: SOVEREIGN HERITAGE (Slots 19 - 24)
  // Bounds X: [20, 40], Z: [-25, -5]
  // -----------------------------------------------------------------
  { id: 'hall_04_slot_01', slotIndex: 19, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'North Wall Bay 1', pos: [26.0, 2.6, -24.78], rotY: 0 },
  { id: 'hall_04_slot_02', slotIndex: 20, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'North Wall Bay 2', pos: [34.0, 2.6, -24.78], rotY: 0 },
  { id: 'hall_04_slot_03', slotIndex: 21, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'South Wall Bay 1', pos: [26.0, 2.6, -5.22], rotY: Math.PI },
  { id: 'hall_04_slot_04', slotIndex: 22, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'South Wall Bay 2', pos: [34.0, 2.6, -5.22], rotY: Math.PI },
  { id: 'hall_04_slot_05', slotIndex: 23, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'East Wall Bay 1', pos: [39.78, 2.6, -19.0], rotY: -Math.PI / 2 },
  { id: 'hall_04_slot_06', slotIndex: 24, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'East Wall Bay 2', pos: [39.78, 2.6, -11.0], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // HALL 05: ROYAL MASTERPIECE (Slots 25 - 30)
  // Bounds X: [-26, -4], Z: [-47, -29]
  // -----------------------------------------------------------------
  { id: 'hall_05_slot_01', slotIndex: 25, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'North Wall Bay 1', pos: [-20.5, 2.6, -46.78], rotY: 0 },
  { id: 'hall_05_slot_02', slotIndex: 26, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'North Wall Bay 2', pos: [-9.5, 2.6, -46.78], rotY: 0 },
  { id: 'hall_05_slot_03', slotIndex: 27, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'South Wall Bay 1', pos: [-20.5, 2.6, -29.22], rotY: Math.PI },
  { id: 'hall_05_slot_04', slotIndex: 28, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'South Wall Bay 2', pos: [-9.5, 2.6, -29.22], rotY: Math.PI },
  { id: 'hall_05_slot_05', slotIndex: 29, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'West Wall Bay 1', pos: [-25.78, 2.6, -42.0], rotY: Math.PI / 2 },
  { id: 'hall_05_slot_06', slotIndex: 30, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'West Wall Bay 2', pos: [-25.78, 2.6, -34.0], rotY: Math.PI / 2 },

  // -----------------------------------------------------------------
  // HALL 06: IMPERIAL DAWN (Slots 31 - 36)
  // Bounds X: [4, 26], Z: [-47, -29]
  // -----------------------------------------------------------------
  { id: 'hall_06_slot_01', slotIndex: 31, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'North Wall Bay 1', pos: [9.5, 2.6, -46.78], rotY: 0 },
  { id: 'hall_06_slot_02', slotIndex: 32, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'North Wall Bay 2', pos: [20.5, 2.6, -46.78], rotY: 0 },
  { id: 'hall_06_slot_03', slotIndex: 33, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'South Wall Bay 1', pos: [9.5, 2.6, -29.22], rotY: Math.PI },
  { id: 'hall_06_slot_04', slotIndex: 34, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'South Wall Bay 2', pos: [20.5, 2.6, -29.22], rotY: Math.PI },
  { id: 'hall_06_slot_05', slotIndex: 35, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'East Wall Bay 1', pos: [25.78, 2.6, -42.0], rotY: -Math.PI / 2 },
  { id: 'hall_06_slot_06', slotIndex: 36, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'East Wall Bay 2', pos: [25.78, 2.6, -34.0], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // THE GRAND SOVEREIGN HALL (Slots 37 - 42)
  // Center: [0, 0, -68], Size: [24, 7, 18], Bounds X: [-12, 12], Z: [-77, -59]
  // -----------------------------------------------------------------
  { id: 'final_hall_slot_01', slotIndex: 37, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'West Wall Bay 1', pos: [-11.78, 2.6, -72.0], rotY: Math.PI / 2 },
  { id: 'final_hall_slot_02', slotIndex: 38, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'West Wall Bay 2', pos: [-11.78, 2.6, -64.0], rotY: Math.PI / 2 },
  { id: 'final_hall_slot_03', slotIndex: 39, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'East Wall Bay 1', pos: [11.78, 2.6, -72.0], rotY: -Math.PI / 2 },
  { id: 'final_hall_slot_04', slotIndex: 40, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'East Wall Bay 2', pos: [11.78, 2.6, -64.0], rotY: -Math.PI / 2 },
  { id: 'final_hall_slot_05', slotIndex: 41, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'North Wall Bay 1', pos: [-7.0, 2.6, -76.78], rotY: 0 },
  { id: 'final_hall_slot_06', slotIndex: 42, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'North Wall Bay 2', pos: [7.0, 2.6, -76.78], rotY: 0 },

  // -----------------------------------------------------------------
  // GRAND RECEPTION LOBBY (Slots 43 - 44)
  // Pruned: Invalid slots 43-46 (niche_lobby_w1/w2/e1/e2) per architectural audit.
  // Preserved: 2 valid South wall display slots.
  // -----------------------------------------------------------------
  { id: 'lobby_slot_05', slotIndex: 43, hallId: 'lobby', hallName: 'Grand Reception Lobby', wallDescription: 'South Wall Bay 1', pos: [-7.0, 2.6, 20.22], rotY: 0 },
  { id: 'lobby_slot_06', slotIndex: 44, hallId: 'lobby', hallName: 'Grand Reception Lobby', wallDescription: 'South Wall Bay 2', pos: [7.0, 2.6, 20.22], rotY: 0 },

  // -----------------------------------------------------------------
  // SOVEREIGN CENTRAL ROTUNDA (Slots 45 - 48)
  // Center: [0, 0, 0], Size: [26, 8, 22], Bounds X: [-13, 13], Z: [-11, 11]
  // -----------------------------------------------------------------
  { id: 'rotunda_slot_01', slotIndex: 45, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'West Wall Bay 1', pos: [-12.78, 2.6, 7.0], rotY: Math.PI / 2 },
  { id: 'rotunda_slot_02', slotIndex: 46, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'West Wall Bay 2', pos: [-12.78, 2.6, -7.0], rotY: Math.PI / 2 },
  { id: 'rotunda_slot_03', slotIndex: 47, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'East Wall Bay 1', pos: [12.78, 2.6, 7.0], rotY: -Math.PI / 2 },
  { id: 'rotunda_slot_04', slotIndex: 48, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'East Wall Bay 2', pos: [12.78, 2.6, -7.0], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // GROUP A: ROYAL PROCESSIONAL GALLERY (Slots 49 - 52)
  // Hall: corridor_south, Center: [0, 0, 15], Size: [12, 6, 10]
  // -----------------------------------------------------------------
  { id: 'corridor_south_slot_01', slotIndex: 49, hallId: 'corridor_south', hallName: 'Royal Processional Gallery', wallDescription: 'West Wall South Bay', pos: [-5.78, 2.6, 17.5], rotY: Math.PI / 2 },
  { id: 'corridor_south_slot_02', slotIndex: 50, hallId: 'corridor_south', hallName: 'Royal Processional Gallery', wallDescription: 'West Wall North Bay', pos: [-5.78, 2.6, 13.5], rotY: Math.PI / 2 },
  { id: 'corridor_south_slot_03', slotIndex: 51, hallId: 'corridor_south', hallName: 'Royal Processional Gallery', wallDescription: 'East Wall South Bay', pos: [5.78, 2.6, 17.5], rotY: -Math.PI / 2 },
  { id: 'corridor_south_slot_04', slotIndex: 52, hallId: 'corridor_south', hallName: 'Royal Processional Gallery', wallDescription: 'East Wall North Bay', pos: [5.78, 2.6, 13.5], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // GROUP B: GRAND RECEPTION LOBBY (Slots 53 - 54)
  // Hall: lobby, Center: [0, 0, 32], Size: [28, 7, 24]
  // -----------------------------------------------------------------
  { id: 'lobby_slot_01', slotIndex: 53, hallId: 'lobby', hallName: 'Grand Reception Lobby', wallDescription: 'North Wall West Bay', pos: [-10.0, 2.6, 43.78], rotY: Math.PI },
  { id: 'lobby_slot_02', slotIndex: 54, hallId: 'lobby', hallName: 'Grand Reception Lobby', wallDescription: 'North Wall East Bay', pos: [10.0, 2.6, 43.78], rotY: Math.PI },

  // -----------------------------------------------------------------
  // GROUP C: SOVEREIGN CENTRAL ROTUNDA (Slots 55 - 58)
  // Hall: rotunda, Center: [0, 0, 0], Size: [26, 8, 22]
  // -----------------------------------------------------------------
  { id: 'rotunda_slot_05', slotIndex: 55, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'North Wall West Bay', pos: [-8.0, 2.6, -10.78], rotY: Math.PI },
  { id: 'rotunda_slot_06', slotIndex: 56, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'North Wall East Bay', pos: [8.0, 2.6, -10.78], rotY: Math.PI },
  { id: 'rotunda_slot_07', slotIndex: 57, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'South Wall West Bay', pos: [-9.5, 2.6, 10.78], rotY: 0 },
  { id: 'rotunda_slot_08', slotIndex: 58, hallId: 'rotunda', hallName: 'Central Rotunda', wallDescription: 'South Wall East Bay', pos: [9.5, 2.6, 10.78], rotY: 0 },

  // -----------------------------------------------------------------
  // GROUP D: WEST GALLERY CORRIDOR (Slots 59 - 63)
  // Hall: corridor_west, Center: [-15, 0, -2.5], Size: [4, 6, 45]
  // -----------------------------------------------------------------
  { id: 'corridor_west_slot_01', slotIndex: 59, hallId: 'corridor_west', hallName: 'West Gallery Corridor', wallDescription: 'North End Cap Wall', pos: [-16.5, 2.6, 19.78], rotY: Math.PI },
  { id: 'corridor_west_slot_02', slotIndex: 60, hallId: 'corridor_west', hallName: 'West Gallery Corridor', wallDescription: 'South End Cap Wall', pos: [-16.5, 2.6, -24.78], rotY: 0 },
  { id: 'corridor_west_slot_03', slotIndex: 61, hallId: 'corridor_west', hallName: 'West Gallery Corridor', wallDescription: 'East Wall North Bay', pos: [-13.22, 2.6, 15.5], rotY: -Math.PI / 2 },
  { id: 'corridor_west_slot_04', slotIndex: 62, hallId: 'corridor_west', hallName: 'West Gallery Corridor', wallDescription: 'East Wall South Bay 1', pos: [-13.22, 2.6, -15.0], rotY: -Math.PI / 2 },
  { id: 'corridor_west_slot_05', slotIndex: 63, hallId: 'corridor_west', hallName: 'West Gallery Corridor', wallDescription: 'East Wall South Bay 2', pos: [-13.22, 2.6, -21.0], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // GROUP E: EAST GALLERY CORRIDOR (Slots 64 - 68)
  // Hall: corridor_east, Center: [15, 0, -2.5], Size: [4, 6, 45]
  // -----------------------------------------------------------------
  { id: 'corridor_east_slot_01', slotIndex: 64, hallId: 'corridor_east', hallName: 'East Gallery Corridor', wallDescription: 'North End Cap Wall', pos: [16.5, 2.6, 19.78], rotY: Math.PI },
  { id: 'corridor_east_slot_02', slotIndex: 65, hallId: 'corridor_east', hallName: 'East Gallery Corridor', wallDescription: 'South End Cap Wall', pos: [16.5, 2.6, -24.78], rotY: 0 },
  { id: 'corridor_east_slot_03', slotIndex: 66, hallId: 'corridor_east', hallName: 'East Gallery Corridor', wallDescription: 'West Wall North Bay', pos: [13.22, 2.6, 15.5], rotY: Math.PI / 2 },
  { id: 'corridor_east_slot_04', slotIndex: 67, hallId: 'corridor_east', hallName: 'East Gallery Corridor', wallDescription: 'West Wall South Bay 1', pos: [13.22, 2.6, -15.0], rotY: Math.PI / 2 },
  { id: 'corridor_east_slot_05', slotIndex: 68, hallId: 'corridor_east', hallName: 'East Gallery Corridor', wallDescription: 'West Wall South Bay 2', pos: [13.22, 2.6, -21.0], rotY: Math.PI / 2 },

  // -----------------------------------------------------------------
  // GROUP F: STATE NORTH HALLWAY (Slots 69 - 72)
  // Hall: corridor_north, Center: [0, 0, -20], Size: [12, 6, 18]
  // -----------------------------------------------------------------
  { id: 'corridor_north_slot_01', slotIndex: 69, hallId: 'corridor_north', hallName: 'State North Hallway', wallDescription: 'West Wall South Bay', pos: [-5.78, 2.6, -13.5], rotY: Math.PI / 2 },
  { id: 'corridor_north_slot_02', slotIndex: 70, hallId: 'corridor_north', hallName: 'State North Hallway', wallDescription: 'West Wall North Bay', pos: [-5.78, 2.6, -26.5], rotY: Math.PI / 2 },
  { id: 'corridor_north_slot_03', slotIndex: 71, hallId: 'corridor_north', hallName: 'State North Hallway', wallDescription: 'East Wall South Bay', pos: [5.78, 2.6, -13.5], rotY: -Math.PI / 2 },
  { id: 'corridor_north_slot_04', slotIndex: 72, hallId: 'corridor_north', hallName: 'State North Hallway', wallDescription: 'East Wall North Bay', pos: [5.78, 2.6, -26.5], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // GROUP G: GRAND SOVEREIGN CORRIDOR (Slots 73 - 76)
  // Hall: passage_final, Center: [0, 0, -53], Size: [12, 6, 12]
  // -----------------------------------------------------------------
  { id: 'passage_final_slot_01', slotIndex: 73, hallId: 'passage_final', hallName: 'Grand Sovereign Corridor', wallDescription: 'West Wall South Bay', pos: [-5.78, 2.6, -56.0], rotY: Math.PI / 2 },
  { id: 'passage_final_slot_02', slotIndex: 74, hallId: 'passage_final', hallName: 'Grand Sovereign Corridor', wallDescription: 'West Wall North Bay', pos: [-5.78, 2.6, -50.0], rotY: Math.PI / 2 },
  { id: 'passage_final_slot_03', slotIndex: 75, hallId: 'passage_final', hallName: 'Grand Sovereign Corridor', wallDescription: 'East Wall South Bay', pos: [5.78, 2.6, -56.0], rotY: -Math.PI / 2 },
  { id: 'passage_final_slot_04', slotIndex: 76, hallId: 'passage_final', hallName: 'Grand Sovereign Corridor', wallDescription: 'East Wall North Bay', pos: [5.78, 2.6, -50.0], rotY: -Math.PI / 2 },

  // -----------------------------------------------------------------
  // GROUP H: GRAND SOVEREIGN HALL / THRONE GALLERY (Slots 77 - 78)
  // Hall: final_hall, Center: [0, 0, -68], Size: [24, 7, 18]
  // -----------------------------------------------------------------
  { id: 'final_hall_slot_07', slotIndex: 77, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'South Wall West Bay', pos: [-8.0, 2.6, -59.22], rotY: 0 },
  { id: 'final_hall_slot_08', slotIndex: 78, hallId: 'final_hall', hallName: 'The Grand Sovereign Hall', wallDescription: 'South Wall East Bay', pos: [8.0, 2.6, -59.22], rotY: 0 },

  // -----------------------------------------------------------------
  // GROUP I: EXHIBITION HALL PORTAL RETURN WALL PIERS (Slots 79 - 84)
  // -----------------------------------------------------------------
  { id: 'hall_01_slot_07', slotIndex: 79, hallId: 'hall_01', hallName: 'Hall 01: Classical Masterworks', wallDescription: 'East Wall Return Pier', pos: [-20.22, 2.6, 17.0], rotY: -Math.PI / 2 },
  { id: 'hall_02_slot_07', slotIndex: 80, hallId: 'hall_02', hallName: 'Hall 02: Historic Heritage', wallDescription: 'East Wall Return Pier', pos: [-20.22, 2.6, -8.0], rotY: -Math.PI / 2 },
  { id: 'hall_03_slot_07', slotIndex: 81, hallId: 'hall_03', hallName: 'Hall 03: Grand Luminary', wallDescription: 'West Wall Return Pier', pos: [20.22, 2.6, 17.0], rotY: Math.PI / 2 },
  { id: 'hall_04_slot_07', slotIndex: 82, hallId: 'hall_04', hallName: 'Hall 04: Sovereign Heritage', wallDescription: 'West Wall Return Pier', pos: [20.22, 2.6, -8.0], rotY: Math.PI / 2 },
  { id: 'hall_05_slot_07', slotIndex: 83, hallId: 'hall_05', hallName: 'Hall 05: Royal Masterpiece', wallDescription: 'East Wall Return Pier', pos: [-4.22, 2.6, -31.5], rotY: -Math.PI / 2 },
  { id: 'hall_06_slot_07', slotIndex: 84, hallId: 'hall_06', hallName: 'Hall 06: Imperial Dawn', wallDescription: 'West Wall Return Pier', pos: [4.22, 2.6, -31.5], rotY: Math.PI / 2 }
];

// =================================================================
// AUTOMATIC DISCOVERY & CANONICAL MERGE
// =================================================================
const manualMap = new Map<number, Artwork>();
MANUAL_ARTWORKS.forEach(art => {
  if (art.number >= 1 && art.number <= MAX_ARTWORKS) {
    manualMap.set(art.number, art);
  }
});

const combinedArtworks: Artwork[] = [];

for (let num = 1; num <= MAX_ARTWORKS; num++) {
  const manual = manualMap.get(num);
  const discovered = discoveredList.find(f => f.number === num);
  const numStr = String(num).padStart(2, '0');
  const defaultTextureUrl = discovered ? discovered.url : `/paintings/${numStr}.png`;

  if (manual) {
    // Preserve 100% of manual metadata
    combinedArtworks.push({
      ...manual,
      textureUrl: manual.textureUrl || defaultTextureUrl
    });
  } else {
    // Clean neutral auto-discovered entry without invented text
    combinedArtworks.push({
      id: `art_${num}`,
      number: num,
      title: `Artwork ${num}`,
      subTitle: undefined,
      scripture: undefined,
      passage: undefined,
      description: undefined,
      symbolism: undefined,
      hallId: '',
      hallName: '',
      textureUrl: defaultTextureUrl
    });
  }
}

export const FINAL_ARTWORKS: Artwork[] = combinedArtworks;
export const ALL_ARTWORKS: Artwork[] = FINAL_ARTWORKS;

// -----------------------------------------------------------------
// PHYSICAL DISPLAY SLOT ALLOCATION
// -----------------------------------------------------------------
const occupiedSlotIds = new Set<string>();

// Pass 1: Assign artworks that have explicit slotId or matching slotIndex
for (const art of FINAL_ARTWORKS) {
  let targetSlot: WallSlot | undefined;
  if (art.slotId) {
    targetSlot = CANONICAL_WALL_SLOTS.find(s => s.id === art.slotId && !occupiedSlotIds.has(s.id));
  }
  if (!targetSlot) {
    targetSlot = CANONICAL_WALL_SLOTS.find(s => s.slotIndex === art.number && !occupiedSlotIds.has(s.id));
  }
  if (targetSlot) {
    occupiedSlotIds.add(targetSlot.id);
    art.slotId = targetSlot.id;
    art.position = targetSlot.pos;
    art.rotation = [0, targetSlot.rotY, 0];
    art.hallId = targetSlot.hallId;
    art.hallName = targetSlot.hallName;
  }
}

// Pass 2: Assign remaining unassigned artworks to first available free slots
for (const art of FINAL_ARTWORKS) {
  if (!art.slotId) {
    const freeSlot = CANONICAL_WALL_SLOTS.find(s => !occupiedSlotIds.has(s.id));
    if (freeSlot) {
      occupiedSlotIds.add(freeSlot.id);
      art.slotId = freeSlot.id;
      art.position = freeSlot.pos;
      art.rotation = [0, freeSlot.rotY, 0];
      art.hallId = freeSlot.hallId;
      art.hallName = freeSlot.hallName;
    } else {
      // Physical capacity reached: Leave unmounted with NO fake coordinates
      art.slotId = undefined;
      art.position = undefined;
      art.rotation = undefined;
    }
  }
}

// Populate hall artworks array with artworks that have legitimate physical slots
MUSEUM_HALLS.forEach(hall => {
  hall.artworks = FINAL_ARTWORKS.filter(art => art.hallId === hall.id && art.slotId !== undefined);
});

/**
 * Resolves a legitimate physical display slot for an artwork.
 * Returns null if no slot is assigned or available (NEVER creates fake procedural coordinates).
 */
export function getSlotForArtwork(art: Artwork): WallSlot | null {
  if (art.slotId) {
    const slotById = CANONICAL_WALL_SLOTS.find(s => s.id === art.slotId);
    if (slotById) return slotById;
  }
  return null;
}

export function getArtworkByNumber(num: number): Artwork | undefined {
  if (num < 1 || num > MAX_ARTWORKS) return undefined;
  return FINAL_ARTWORKS.find(a => a.number === num);
}

export function getArtworkCount(): number {
  return FINAL_ARTWORKS.length;
}

export function getMaxArtworkNumber(): number {
  return MAX_ARTWORKS;
}

/**
 * Derives real-time capacity and display metrics for the museum without hardcoded numbers.
 */
export function getMuseumCapacityStats() {
  const totalSlots = CANONICAL_WALL_SLOTS.length;
  const totalArtworks = FINAL_ARTWORKS.length;
  const mountedArtworks = FINAL_ARTWORKS.filter(art => getSlotForArtwork(art) !== null);
  const unmountedArtworks = FINAL_ARTWORKS.filter(art => getSlotForArtwork(art) === null);

  return {
    totalSlots,
    totalArtworks,
    mountedCount: mountedArtworks.length,
    availableEmptySlotCount: Math.max(0, totalSlots - mountedArtworks.length),
    unmountedCount: unmountedArtworks.length,
    isAtCapacity: mountedArtworks.length >= totalSlots
  };
}

