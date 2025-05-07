# Prompt-Optimizer-AI

An AI-powered tool for optimizing prompts by analyzing project files and providing industry-specific suggestions.

## Features

- **File Analysis**: Upload and analyze multiple file types (TXT, CSV, JSON, PDF, XLSX, DOCX, PPTX, MPP)
- **Industry-Specific Optimization**: Tailored suggestions for different industries
- **Interactive Chat Interface**: Real-time feedback and customization
- **Progress Tracking**: Visual progress indicators for each step
- **Modern UI**: Built with Next.js and Tailwind CSS

## Supported Industries

- Construction
- Software Development
- Healthcare
- Marketing
- General Business

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fisapool/Prompt-Optimizer-AI.git
cd Prompt-Optimizer-AI
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Firebase configuration.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Prompt-Optimizer-AI/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── ui/             # UI component library
│   │   └── ...             # Feature components
│   ├── ai/                 # AI processing flows
│   ├── hooks/              # Custom React hooks
│   └── services/           # Service utilities
├── public/                 # Static assets
└── docs/                   # Documentation
```

## Core Components

### File Upload
- Drag-and-drop interface
- Multiple file support
- File type validation
- Progress tracking

### Industry Selector
- Industry-specific icons
- Dropdown selection
- Type-safe implementation

### Chat Interface
- Real-time messaging
- AI suggestions
- Industry-specific prompts
- Customization mode

### Progress Tracker
- Visual progress indicators
- Stage status tracking
- Interactive stages

## AI Processing Pipeline

1. **File Analysis**
   - Content extraction
   - File type validation
   - Text processing

2. **Project Summarization**
   - Industry-specific analysis
   - Key point extraction
   - Summary generation

3. **Prompt Suggestions**
   - AI-generated recommendations
   - Industry-specific customizations
   - Best practices

4. **Final Optimization**
   - Customization integration
   - Format optimization
   - Quality checks

## Development

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

### Testing
```bash
npm run test
# or
yarn test
```

### Building
```bash
npm run build
# or
yarn build
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Firebase for hosting and backend services
- All contributors who have helped shape this project
