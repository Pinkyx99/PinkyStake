import { CSGOCase } from '../../../../types';

export const zombieApocalypseCase: CSGOCase = {
  id: 'zombie-apocalypse',
  name: 'Zombie Apocalypse',
  price: 1.00,
  imageUrl: 'https://i.imgur.com/g1n2wMS.png',
  category: 'Official',
  items: [
    // Covert (Red)
    {
      id: 'za-covert-1',
      weapon: 'AK-47', skin: 'Headshot',
      rarity: 'Covert', condition: 'FN', statTrak: true,
      price: 150.55,
      imageUrl: 'https://i.imgur.com/8z8ZQ2M.png',
      odds: 0.16,
    },
    {
      id: 'za-covert-2',
      weapon: 'M4A4', skin: 'The Cure',
      rarity: 'Covert', condition: 'FN', statTrak: false,
      price: 120.80,
      imageUrl: 'https://i.imgur.com/fLz1gYF.png',
      odds: 0.48,
    },
    // Classified (Pink)
    {
      id: 'za-classified-1',
      weapon: 'Glock-18', skin: 'Bio-Hazard',
      rarity: 'Classified', condition: 'MW', statTrak: true,
      price: 45.20,
      imageUrl: 'https://i.imgur.com/a930BHp.png',
      odds: 0.8,
    },
    {
      id: 'za-classified-2',
      weapon: 'USP-S', skin: 'Survivor',
      rarity: 'Classified', condition: 'FT', statTrak: false,
      price: 30.15,
      imageUrl: 'https://i.imgur.com/gKS2x2s.png',
      odds: 2.4,
    },
    // Restricted (Purple)
    {
      id: 'za-restricted-1',
      weapon: 'XM1014', skin: 'Zombie Offensive',
      rarity: 'Restricted', condition: 'FN', statTrak: true,
      price: 10.55,
      imageUrl: 'https://i.imgur.com/uF1pT3I.png',
      odds: 3,
    },
    {
      id: 'za-restricted-2',
      weapon: 'Sawed-Off', skin: 'Apocalypto',
      rarity: 'Restricted', condition: 'MW', statTrak: false,
      price: 7.88,
      imageUrl: 'https://i.imgur.com/pA7x32F.png',
      odds: 4,
    },
     {
      id: 'za-restricted-3',
      weapon: 'P250', skin: 'Infection',
      rarity: 'Restricted', condition: 'FT', statTrak: false,
      price: 6.90,
      imageUrl: 'https://i.imgur.com/uR1Fz8W.png',
      odds: 8.95,
    },
    // Mil-Spec (Blue)
    {
      id: 'za-milspec-1',
      weapon: 'SSG 08', skin: 'Ghost Crusader',
      rarity: 'Mil-Spec', condition: 'FT', statTrak: false,
      price: 0.66,
      imageUrl: 'https://i.imgur.com/0fS1Y1a.png',
      odds: 20,
    },
    {
      id: 'za-milspec-2',
      weapon: 'MP9', skin: 'Bioleak',
      rarity: 'Mil-Spec', condition: 'MW', statTrak: true,
      price: 0.95,
      imageUrl: 'https://i.imgur.com/c4o82gA.png',
      odds: 20,
    },
    {
      id: 'za-milspec-3',
      weapon: 'Five-SeveN', skin: 'Night Terrors',
      rarity: 'Mil-Spec', condition: 'WW', statTrak: false,
      price: 0.45,
      imageUrl: 'https://i.imgur.com/s4qP1jG.png',
      odds: 40.21,
    },
  ],
};