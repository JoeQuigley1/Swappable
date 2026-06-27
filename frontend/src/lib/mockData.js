export const howItWorksSteps = [
  {
    step: 1,
    title: 'Post Your Item',
    description:
      "Take a photo and list an item you no longer need. It's free and takes less than 2 minutes.",
    icon: 'bi-camera',
  },
  {
    step: 2,
    title: 'Browse & Connect',
    description:
      'Browse items others have listed and send a swap request when you find something you like.',
    icon: 'bi-search',
  },
  {
    step: 3,
    title: 'Swap!',
    description:
      'Agree on the swap, meet up safely, and exchange items. No money needed!',
    icon: 'bi-arrow-left-right',
  },
];

// richer version of the steps above, used by the dedicated How It Works page.
export const howItWorksDetailedSteps = [
  {
    step: 1,
    icon: 'bi-camera',
    title: 'Post Your Item',
    description:
      'Snap a photo of something you no longer need, add a short description, pick a category and set its condition. Listing is completely free and takes less than two minutes.',
    points: [
      'Free to list',
      'Add photos of your item',
      'Choose a category & condition',
    ],
  },
  {
    step: 2,
    icon: 'bi-search',
    title: 'Browse & Connect',
    description:
      'Explore items listed by people near you. When you spot something you like, send a swap request and start a conversation with the owner.',
    points: ['Filter by category', 'See items near you', 'Send a swap request'],
  },
  {
    step: 3,
    icon: 'bi-arrow-left-right',
    title: 'Make the Swap',
    description:
      'Agree on the details, arrange a safe place to meet, and exchange your items. No cash changes hands, just two happy swappers.',
    points: ['Agree on the trade', 'Meet up safely', 'Enjoy your new item'],
  },
];

// frequently asked questions shown on the How It Works page.
export const howItWorksFaqs = [
  {
    q: 'Does it cost anything to use Swappable?',
    a: 'No. Listing items, browsing and swapping are all completely free. Swappable is about trading what you have. No money ever changes hands.',
  },
  {
    q: 'How do I know an item is in good condition?',
    a: 'Every listing includes a condition rating and photos from the owner. You can also message the owner with any questions before agreeing to a swap.',
  },
  {
    q: 'Where do swaps take place?',
    a: 'You arrange that with the other swapper. We always recommend meeting in a safe, public place during daylight hours.',
  },
  {
    q: 'What can I list?',
    a: 'Almost anything you own and no longer need: electronics, books, clothing, sports gear, furniture and more. Just pick the category that fits best.',
  },
  {
    q: 'What if I change my mind about a swap?',
    a: 'No problem. Nothing is final until you and the other person meet and agree. You can decline or cancel a swap request at any time before then.',
  },
];
