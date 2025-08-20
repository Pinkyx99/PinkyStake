import { CSGOCase } from '../../../../types';

// Original odds sum to 81. Normalization factor is 100/81 = 1.2345679
const norm = (val: number) => val * 100 / 81;

export const billionaireCase: CSGOCase = {
  id: 'billionaire',
  name: 'Billionaire',
  price: 24064.00,
  imageUrl: 'https://csgobig.com/assets/img/cases/case_357.png',
  category: 'Official',
  items: [
    {
      id: 'b-01', weapon: 'Souvenir AWP', skin: 'Dragon Lore',
      rarity: 'Covert', condition: 'MW', statTrak: false, price: 250000.00,
      imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g/360fx360f',
      odds: norm(1),
    },
    {
      id: 'b-02', weapon: '★ Karambit', skin: 'Case Hardened',
      rarity: 'Extraordinary', condition: 'FT', statTrak: false, price: 200000.00,
      imageUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlZG0mP74Nr_ummJW4NFOhujT8om73Qay8kFuaj3xLYCVJAM7ZF-B8li9kOfm1sW6u5SfyHNru3Im7SvUlwv330-EAAozoQ/360fx360f',
      odds: norm(1),
    },
    {
      id: 'b-03', weapon: 'AK-47', skin: 'Fire Serpent - 4x IBP',
      rarity: 'Covert', condition: 'FN', statTrak: false, price: 150000.00,
      imageUrl: 'https://csgobig.com/assets/img/custom/serp_ibp.png',
      odds: norm(2),
    },
    {
      id: 'b-04', weapon: 'M4A4', skin: 'Howl - 4x IBP',
      rarity: 'Contraband', condition: 'FN', statTrak: false, price: 100000.00,
      imageUrl: 'https://csgobig.com/assets/img/custom/howl_ibp.png',
      odds: norm(2),
    },
    {
      id: 'b-05', weapon: 'Sticker', skin: 'Titan (Holo) | Katowice 2014',
      rarity: 'Extraordinary', condition: 'N/A', statTrak: false, price: 75000.00,
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXQ9QVcJY8gulRYQV_bRvCiwMbQVg8kdFAYorOxKglf2_zEfnNA7oiyx9jdzqanZb3Txj8F7cZwie3CrNTwiVbl-hdrMj30dY-VewA5fxiOrQhGIm55/360fx360f',
      odds: norm(2),
    },
    {
      id: 'b-06', weapon: '★ Sport Gloves', skin: 'Pandora\'s Box',
      rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 55000.00,
      imageUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DAQ1JmMR1osbaqPQJz7ODYfi9W9eOmgZKbm_LLP7LWnn9u5MRjjeyPoNr0jQG1r0RtYzzzIo_DcgI-NVDWqQDvxLi-1p-5vsudync36HUm7WGdwUJKXesLsw/360fx360f',
      odds: norm(3),
    },
    {
      id: 'b-07', weapon: 'Souvenir AWP', skin: 'Dragon Lore',
      rarity: 'Covert', condition: 'FT', statTrak: false, price: 45000.00,
      imageUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5cB1g_zMyoD0mlOx5UM5ZWClcYCUdgU3Z1rQ_FK-xezngZO46MzOziQ1vSMmtCmIyxfkgx5SLrs4SgJFJKs/360fx360f',
      odds: norm(4),
    },
    {
      id: 'b-08', weapon: 'Sticker', skin: 'Vox Eminor (Holo) | Katowice 2014',
      rarity: 'Extraordinary', condition: 'N/A', statTrak: false, price: 38000.00,
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXQ9QVcJY8gulRYQV_bRvCiwMbQVg8kdFAYoLW9Lgpp3fzaTjVN4NP4x4XflKClY-3TxGpUu5RwiOqW8disigzj_kJrZGDzI9PGe1BoMFqF-U_-n7nr30_udQ/360fx360f',
      odds: norm(4),
    },
    {
      id: 'b-09', weapon: 'Souvenir AWP', skin: 'Dragon Lore',
      rarity: 'Covert', condition: 'BS', statTrak: false, price: 25000.00,
      imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g/360fx360f',
      odds: norm(5),
    },
    {
      id: 'b-10', weapon: '★ Sport Gloves', skin: 'Vice',
      rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 17000.00,
      imageUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DAQ1JmMR1osbaqPQJz7ODYfi9W9eO0mJWOqOf9PbDummJW4NFOhujT8om72FC1_Bc_MD-ncYaRcAA2MFzS8ljvleq9g8W8vMzLyiNiuCRz433Zygv3308allD_ww/360fx360f',
      odds: norm(5),
    },
    {
      id: 'b-11', weapon: '★ Butterfly Knife', skin: 'Gamma Doppler',
      rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 14000.00,
      imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqPL5NqnQmm9u5cRjiOXE_JbwjGu4ohQ0J3f6JtPEegNrMwvUrwe6kLjsjcPtuJXJmnFguCMn5i7enkDkiRFIabM7m7XAHtBCTvK7/360fx360f',
      odds: norm(6),
    },
    {
      id: 'b-12', weapon: '★ M9 Bayonet', skin: 'Gamma Doppler',
      rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 12000.00,
      imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjxPr7Dl2dV18hwmOvN8IXvjVCLpxo7Oy3tIdLEdgdqNAmBqFa_kO3mh8K9uJqbyiMy7HIn5H3VzUPl1B0dO7M7hOveFwvYitsMFw/360fx360f',
      odds: norm(7),
    },
    {
      id: 'b-13', weapon: '★ M9 Bayonet', skin: 'Doppler - Ruby',
      rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 10000.00,
      imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjmJrnIqWZQ-sd9j-Db8IjKhF2zowdyYzjyLIGSIAA8YguCqVK9lOa-1JW5vprBz3EyviB07SveyhfkhklNP_sv26JLM0iiyQ/360fx360f',
      odds: norm(8),
    },
    {
      id: 'b-14', weapon: 'M4A4', skin: 'Howl',
      rarity: 'Contraband', condition: 'FN', statTrak: false, price: 5600.00,
      imageUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLP7LWnn9u5MRjjeyP9tqhiQ2yqEo6Mmn3doPBcwZqZQrRr1O-we_sgMO5tZ_BzCFr6ycltmGdwULa1vGJFg/360fx360f',
      odds: norm(9),
    },
    {
      id: 'b-15', weapon: '★ Flip Knife', skin: 'Doppler - Sapphire',
      rarity: 'Extraordinary', condition: 'FN', statTrak: false, price: 2500.00,
      imageUrl: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1f_BYQJD4eOllZCbn_7mNoTcl3lT5MB4kOzFyoD8j1yg5UBuazj3cYKQJwA5ZwnVrla_yLi5hcPp6szPwHZqvnVx5n_Vyhzjgh1SLrs4EHv5ZcQ/360fx360f',
      odds: norm(9),
    },
    {
      id: 'b-16', weapon: 'AK-47', skin: 'X-Ray',
      rarity: 'Classified', condition: 'FN', statTrak: false, price: 1600.00,
      imageUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJegJa_t2vq4yCkP_gDLfQhGxUpsQg3LuQoI733APlrxI_azqgJoOSIQc9NQqD-lLrw-rqhJLtu8vJyHp9-n51JfbHn_c/360fx360f',
      odds: norm(13),
    },
  ],
};