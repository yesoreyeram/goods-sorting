# Goods Sorting Game

A fun and challenging goods sorting puzzle game built with Next.js, TypeScript, and TailwindCSS.

## 🎮 About

Goods Sorting is a puzzle game where you need to sort various products (soda, milk, chips, jam, etc.) on shelves by matching three of the same items. The game features multiple levels with increasing difficulty and various constraints like time limits, move limits, and special items.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yesoreyeram/goods-sorting.git
cd goods-sorting
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to play the game!

### Build for Production

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **TailwindCSS v4** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React 19** - Latest React features

## 🎯 Game Features

- 50 progressively challenging levels
- Multiple game constraints:
  - Time limits
  - Move limits
  - Bomb timers (clear before they explode!)
  - Ice cream shelves (freeze when cleared)
  - Fragile items (limited moves)
- Lives and coins system
- Local storage persistence
- Responsive design
- Touch and mouse support

## 📁 Project Structure

```
goods-sorting/
├── app/
│   ├── globals.css       # Global styles with TailwindCSS
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── Game.tsx          # Main game component
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # TailwindCSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
