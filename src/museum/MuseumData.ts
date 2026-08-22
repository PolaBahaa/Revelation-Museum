import { Hall, Artwork } from '../types';

export const MUSEUM_HALLS: Hall[] = [
  {
    id: 'hall_01',
    code: 'Hall 01',
    title: 'The Seven Seals',
    subTitle: 'The Scroll of Revelation & Heavenly Worship',
    theme: 'Proclamation & Divine Sovereignty',
    description: 'Exhibiting the dramatic visions of Revelation chapters 1 through 6: The Vision of the Glorified Son of Man, the Throne Room of Heaven, and the Opening of the Seven Seals.',
    center: [-30, 0, 10],
    size: [20, 6, 20],
    artworks: [] // Populated below
  },
  {
    id: 'hall_02',
    code: 'Hall 02',
    title: 'The Seven Trumpets',
    subTitle: 'Cosmic Warnings & The Angelic Censer',
    theme: 'Judgement & Warning',
    description: 'Exploring Revelation chapters 7 through 11: The Sealing of the 144,000, the Golden Censer at the Altar, the Blare of the Seven Trumpets, and the Two Witnesses.',
    center: [-30, 0, -15],
    size: [20, 6, 20],
    artworks: []
  },
  {
    id: 'hall_03',
    code: 'Hall 03',
    title: 'The Heavenly Vision',
    subTitle: 'The Woman Clothed with the Sun & The War in Heaven',
    theme: 'Cosmic Conflict & Victory',
    description: 'Dedicated to Revelation chapters 12 through 14: The Woman Clothed with the Sun, Michael Casting Down the Dragon, and the Lamb on Mount Zion.',
    center: [30, 0, 10],
    size: [20, 6, 20],
    artworks: []
  },
  {
    id: 'hall_04',
    code: 'Hall 04',
    title: 'The Seven Bowls',
    subTitle: 'The Wrath of God & The Fall of Babylon',
    theme: 'Righteous Judgment & Redemption',
    description: 'Displaying Revelation chapters 15 through 18: The Sea of Glass, the Seven Golden Bowls poured upon the earth, and the Collapse of Babylon.',
    center: [30, 0, -15],
    size: [20, 6, 20],
    artworks: []
  },
  {
    id: 'hall_05',
    code: 'Hall 05',
    title: 'The Final Victory',
    subTitle: 'The Marriage Supper & The Rider on the White Horse',
    theme: 'Triumph of the King',
    description: 'Showcasing Revelation chapters 19 and 20: The Heavenly Hallelujah Chorus, the Marriage Supper of the Lamb, the Rider Named Faithful and True, and the Great White Throne.',
    center: [-15, 0, -38],
    size: [22, 6, 20],
    artworks: []
  },
  {
    id: 'hall_06',
    code: 'Hall 06',
    title: 'The New Jerusalem',
    subTitle: 'The Holy City, River of Life & Eternal Renewal',
    theme: 'Eternal Glory & Hope',
    description: 'Immersing visitors in Revelation chapters 21 and 22: The New Heaven and New Earth, the Descending Holy City of Gold, the River of the Water of Life, and the Tree of Life.',
    center: [15, 0, -38],
    size: [22, 6, 20],
    artworks: []
  }
];

export const ALL_ARTWORKS: Artwork[] = [
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
  }
];

// Populate hall artworks array
MUSEUM_HALLS.forEach(hall => {
  hall.artworks = ALL_ARTWORKS.filter(art => art.hallId === hall.id);
});
