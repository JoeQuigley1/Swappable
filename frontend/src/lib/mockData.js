export const featuredItems = [
  {
    id: 1,
    title: 'Mountain Bike',
    description: 'Trek 820, great condition, barely used. Perfect for trails or commuting.',
    category: 'Sports',
    condition: 'Good',
    owner: 'Alex M.',
    location: 'Dublin',
  },
  {
    id: 2,
    title: 'DSLR Camera',
    description: 'Canon EOS 200D with 18-55mm kit lens and carrying case included.',
    category: 'Electronics',
    condition: 'Like New',
    owner: 'Sarah K.',
    location: 'Cork',
  },
  {
    id: 3,
    title: 'Acoustic Guitar',
    description: 'Yamaha F310 full size, perfect for beginners. Comes with bag and capo.',
    category: 'Music',
    condition: 'Fair',
    owner: 'James O.',
    location: 'Galway',
  },
  {
    id: 4,
    title: 'Vintage Record Player',
    description: 'Fully functional turntable with built-in speakers, great sound quality.',
    category: 'Electronics',
    condition: 'Good',
    owner: 'Emma D.',
    location: 'Limerick',
  },
  {
    id: 5,
    title: 'Snowboard Set',
    description: 'Complete set: board, boots (size 10), and bindings. Used one season.',
    category: 'Sports',
    condition: 'Good',
    owner: 'Ryan C.',
    location: 'Dublin',
  },
  {
    id: 6,
    title: 'Espresso Machine',
    description: "De'Longhi ECP31.21, 6 months old, barely used. Includes milk frother.",
    category: 'Kitchen',
    condition: 'Like New',
    owner: 'Niamh B.',
    location: 'Waterford',
  },
]

export const categories = [
  { id: 1, name: 'Electronics', icon: 'bi-laptop', count: 124 },
  { id: 2, name: 'Sports', icon: 'bi-bicycle', count: 89 },
  { id: 3, name: 'Music', icon: 'bi-music-note-beamed', count: 56 },
  { id: 4, name: 'Books', icon: 'bi-book', count: 203 },
  { id: 5, name: 'Kitchen', icon: 'bi-cup-hot', count: 71 },
  { id: 6, name: 'Gaming', icon: 'bi-controller', count: 98 },
  { id: 7, name: 'Clothing', icon: 'bi-bag', count: 145 },
  { id: 8, name: 'Tools', icon: 'bi-tools', count: 62 },
]

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
    description: 'Agree on the swap, meet up safely, and exchange items. No money needed!',
    icon: 'bi-arrow-left-right',
  },
]

// richer version of the steps above, used by the dedicated How It Works page.
export const howItWorksDetailedSteps = [
  {
    step: 1,
    icon: 'bi-camera',
    title: 'Post Your Item',
    description:
      'Snap a photo of something you no longer need, add a short description, pick a category and set its condition. Listing is completely free and takes less than two minutes.',
    points: ['Free to list', 'Add photos of your item', 'Choose a category & condition'],
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
]

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
]
