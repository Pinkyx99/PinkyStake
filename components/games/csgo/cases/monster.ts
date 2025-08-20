import { CSGOCase } from '../../../../types';

export const monsterCase: CSGOCase = {
  id: 'monster',
  name: 'Monster',
  price: 19.08,
  imageUrl: 'https://csgo-oss.funcs2.com/uploadfile/20250811/813415756111831040.png',
  category: 'Official',
  items: [
    // 1. AK-47 | Fire Serpent (0.060%)
    {
      id: 'mo-ak47-fireserpent-bs',
      weapon: 'AK-47', skin: 'Fire Serpent', rarity: 'Covert', condition: 'BS', statTrak: false, price: 808.33,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QUstNDcgfCBGaXJlIFNlcnBlbnQgKEJhdHRsZS1TY2FycmVkKQ==.png',
      odds: 0.060,
      groupId: 'mo-ak47-fireserpent'
    },
    // 2. ★ Falchion Knife | Fade (0.100%)
    {
      id: 'mo-falchion-fade-fn',
      weapon: '★ Falchion Knife', skin: 'Fade', rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 530.02,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/4piFIEZhbGNoaW9uIEtuaWZlIHwgRmFkZSAoRmFjdG9yeSBOZXcp.png',
      odds: 0.100,
      groupId: 'mo-falchion-fade'
    },
    // 3. ★ Bayonet | Bright Water (0.140%)
    {
      id: 'mo-bayonet-brightwater-ft',
      weapon: '★ Bayonet', skin: 'Bright Water', rarity: 'Extraordinary', condition: 'FT', statTrak: false, price: 357.92,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/4piFIEJheW9uZXQgfCBCcmlnaHQgV2F0ZXIgKEZpZWxkLVRlc3RlZCk=.png',
      odds: 0.140,
      groupId: 'mo-bayonet-brightwater'
    },
    // 4. AK-47 | Vulcan (0.180%)
    {
      id: 'mo-ak47-vulcan-mw',
      weapon: 'AK-47', skin: 'Vulcan', rarity: 'Covert', condition: 'MW', statTrak: false, price: 766.58,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QUstNDcgfCBWdWxjYW4gKE1pbmltYWwgV2Vhcik=.png',
      odds: 0.070,
      groupId: 'mo-ak47-vulcan'
    },
    {
      id: 'mo-ak47-vulcan-ft',
      weapon: 'AK-47', skin: 'Vulcan', rarity: 'Covert', condition: 'FT', statTrak: false, price: 433.94,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QUstNDcgfCBWdWxjYW4gKE1pbmltYWwgV2Vhcik=.png',
      odds: 0.110,
      groupId: 'mo-ak47-vulcan'
    },
    // 5. ★ Huntsman Knife | Crimson Web (0.200%)
    {
      id: 'mo-huntsman-crimsonweb-ft',
      weapon: '★ Huntsman Knife', skin: 'Crimson Web', rarity: 'Extraordinary', condition: 'FT', statTrak: false, price: 256.71,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/4piFIEh1bnRzbWFuIEtuaWZlIHwgQ3JpbXNvbiBXZWIgKEZpZWxkLVRlc3RlZCk=.png',
      odds: 0.200,
      groupId: 'mo-huntsman-crimsonweb'
    },
    // 6. M4A4 | Asiimov (0.210%)
    {
      id: 'mo-m4a4-asiimov-ft',
      weapon: 'M4A4', skin: 'Asiimov', rarity: 'Covert', condition: 'FT', statTrak: false, price: 284.34,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/TTRBNCB8IEFzaWltb3YgKEZpZWxkLVRlc3RlZCk=.png',
      odds: 0.210,
      groupId: 'mo-m4a4-asiimov'
    },
    // 7. ★ Shadow Daggers | Marble Fade (0.220%)
    {
      id: 'mo-daggers-marblefade-fn',
      weapon: '★ Shadow Daggers', skin: 'Marble Fade', rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 248.44,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/4piFIFNoYWRvdyBEYWdnZXJzIHwgTWFyYmxlIEZhZGUgKEZhY3RvcnkgTmV3KQ==.png',
      odds: 0.220,
      groupId: 'mo-daggers-marblefade'
    },
    // 8. AWP | Asiimov (0.440%)
    {
      id: 'mo-awp-asiimov-ww',
      weapon: 'AWP', skin: 'Asiimov', rarity: 'Covert', condition: 'WW', statTrak: false, price: 126.37,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QVdQIHwgQXNpaW1vdiAoV2VsbC1Xb3JuKQ==.png',
      odds: 0.440,
      groupId: 'mo-awp-asiimov'
    },
    // 9. AWP | Corticera (0.800%)
    {
      id: 'mo-awp-corticera-fn',
      weapon: 'AWP', skin: 'Corticera', rarity: 'Classified', condition: 'FN', statTrak: false, price: 131.48,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QVdQIHwgQ29ydGljZXJhIChGYWN0b3J5IE5ldyk=.png',
      odds: 0.800,
      groupId: 'mo-awp-corticera'
    },
    // 10. AWP | Man-o'-war (1.300%)
    {
      id: 'mo-awp-manowar-ft',
      weapon: 'AWP', skin: 'Man-o\'-war', rarity: 'Classified', condition: 'FT', statTrak: false, price: 67.30,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QVdQIHwgTWFuLW8nLXdhciAoRmllbGQtVGVzdGVkKQ==.png',
      odds: 1.300,
      groupId: 'mo-awp-manowar'
    },
    // 11. AWP | Redline (1.550%)
    {
      id: 'mo-awp-redline-mw',
      weapon: 'AWP', skin: 'Redline', rarity: 'Classified', condition: 'MW', statTrak: false, price: 147.24,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QVdQIHwgUmVkbGluZSAoTWluaW1hbCBXZWFyKQ==.png',
      odds: 0.550,
      groupId: 'mo-awp-redline'
    },
    {
      id: 'mo-awp-redline-ft',
      weapon: 'AWP', skin: 'Redline', rarity: 'Classified', condition: 'FT', statTrak: false, price: 60.37,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QVdQIHwgUmVkbGluZSAoTWluaW1hbCBXZWFyKQ==.png',
      odds: 1.000,
      groupId: 'mo-awp-redline'
    },
    // 12. AK-47 | Aquamarine Revenge (1.800%)
    {
      id: 'mo-ak47-aquamarine-ww',
      weapon: 'AK-47', skin: 'Aquamarine Revenge', rarity: 'Covert', condition: 'WW', statTrak: false, price: 39.30,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QUstNDcgfCBBcXVhbWFyaW5lIFJldmVuZ2UgKFdlbGwtV29ybik=.png',
      odds: 1.800,
      groupId: 'mo-ak47-aquamarine'
    },
    // 13. M4A1-S | Chantico's Fire (4.700%)
    {
      id: 'mo-m4a1s-chanticos-mw',
      weapon: 'M4A1-S', skin: 'Chantico\'s Fire', rarity: 'Covert', condition: 'MW', statTrak: false, price: 93.07,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/TTRBMS1TIHwgQ2hhbnRpY28ncyBGaXJlIChNaW5pbWFsIFdlYXIp.png',
      odds: 0.700,
      groupId: 'mo-m4a1s-chanticos'
    },
    {
      id: 'mo-m4a1s-chanticos-ft',
      weapon: 'M4A1-S', skin: 'Chantico\'s Fire', rarity: 'Covert', condition: 'FT', statTrak: false, price: 25.97,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/TTRBMS1TIHwgQ2hhbnRpY28ncyBGaXJlIChNaW5pbWFsIFdlYXIp.png',
      odds: 4.000,
      groupId: 'mo-m4a1s-chanticos'
    },
    // 14. AK-47 | Frontside Misty (8.800%)
    {
      id: 'mo-ak47-frontside-bs',
      weapon: 'AK-47', skin: 'Frontside Misty', rarity: 'Classified', condition: 'BS', statTrak: false, price: 17.91,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/QUstNDcgfCBGcm9udHNpZGUgTWlzdHkgKEJhdHRsZS1TY2FycmVkKQ==.png',
      odds: 8.800,
      groupId: 'mo-ak47-frontside'
    },
    // 15. M4A4 | Spider Lily (12.000%)
    {
      id: 'mo-m4a4-spiderlily-mw',
      weapon: 'M4A4', skin: 'Spider Lily', rarity: 'Restricted', condition: 'MW', statTrak: false, price: 18.49,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/TTRBNCB8IFNwaWRlciBMaWx5IChNaW5pbWFsIFdlYXIp.png',
      odds: 12.000,
      groupId: 'mo-m4a4-spiderlily'
    },
    // 16. M4A4 | Desolate Space (14.000%)
    {
      id: 'mo-m4a4-desolate-ft',
      weapon: 'M4A4', skin: 'Desolate Space', rarity: 'Classified', condition: 'FT', statTrak: false, price: 11.04,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/TTRBNCB8IERlc29sYXRlIFNwYWNlIChGaWVsZC1UZXN0ZWQp.png',
      odds: 14.000,
      groupId: 'mo-m4a4-desolate'
    },
    // 17. M4A4 | Tooth Fairy (16.000%)
    {
      id: 'mo-m4a4-toothfairy-ft',
      weapon: 'M4A4', skin: 'Tooth Fairy', rarity: 'Restricted', condition: 'FT', statTrak: false, price: 3.03,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/TTRBNCB8IFRvb3RoIEZhaXJ5IChGaWVsZC1UZXN0ZWQp.png',
      odds: 16.000,
      groupId: 'mo-m4a4-toothfairy'
    },
    // 18. USP-S | Cortex (18.000%)
    {
      id: 'mo-usps-cortex-ft',
      weapon: 'USP-S', skin: 'Cortex', rarity: 'Restricted', condition: 'FT', statTrak: false, price: 3.30,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/VVNQLVMgfCBDb3J0ZXggKEZpZWxkLVRlc3RlZCk=.png',
      odds: 18.000,
      groupId: 'mo-usps-cortex'
    },
    // 19. Dual Berettas | Melondrama (19.500%)
    {
      id: 'mo-duals-melondrama-ft',
      weapon: 'Dual Berettas', skin: 'Melondrama', rarity: 'Mil-Spec', condition: 'FT', statTrak: false, price: 1.43,
      imageUrl: 'https://csgo-oss.funcs2.com/e/steam/item/730/RHVhbCBCZXJldHRhcyB8IE1lbG9uZHJhbWEgKEZpZWxkLVRlc3RlZCk=.png',
      odds: 19.500,
      groupId: 'mo-duals-melondrama'
    },
  ]
};