
# Face Recognition Platform with Real-Time AI Q&A using RAG

A modern browser-based face recognition platform with real-time AI-powered Q&A capabilities using Retrieval-Augmented Generation (RAG) technology.

This project is a part of a hackathon run by https://katomaran.com

## 🎯 Features

- **Face Registration**: Capture and register faces with webcam integration
- **Live Recognition**: Real-time face detection and recognition with bounding boxes and name overlays
- **AI ChatBot**: RAG-powered Q&A system for querying face registration data
- **Dark Theme**: Minimalist black theme with modern UI/UX
- **Responsive Design**: Mobile-friendly interface with clean navigation tabs

## 🏗️ Architecture

### Frontend (React.js)
- Tab-based interface using React Router
- Webcam integration via react-webcam
- Real-time video processing with face overlays
- Dark minimalist theme with Tailwind CSS
- Responsive design with shadcn/ui components

### Backend (Supabase)
- PostgreSQL database for storing face encodings and metadata
- Real-time subscriptions for chat functionality
- Row Level Security (RLS) for data protection
- RESTful API endpoints for face registration and chat

### AI Integration
- Simulated face recognition processing (ready for ML integration)
- RAG-powered chatbot for natural language queries
- Context-aware responses about registration data

## 📋 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Modern web browser with webcam support
- Supabase account (for database and backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd face-recognition-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (SQL schema provided)
   - Configure environment variables with your Supabase credentials

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173 in your browser
   - Allow webcam permissions when prompted

## 🎮 Usage

### 1. Face Registration
- Navigate to the "Registration" tab
- Enter the person's full name
- Start the camera and capture a photo
- Click "Register Face" to save to database

### 2. Live Recognition
- Go to the "Live Recognition" tab
- Click "Start Recognition" to begin real-time detection
- The system will display bounding boxes and names for recognized faces
- View detection statistics and confidence scores

### 3. AI ChatBot Q&A
- Open the "ChatBot Q&A" tab
- Ask natural language questions about registered faces:
  - "Who was the last person registered?"
  - "How many people are currently registered?"
  - "When was [Name] registered?"
  - "List all registered people"

## 🛠️ Technical Implementation

### Database Schema
```sql
-- Face registrations table
face_registrations (
  id: UUID (Primary Key)
  name: TEXT
  face_encoding: TEXT (Base64 encoded)
  timestamp: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- Chat messages table
chat_messages (
  id: UUID (Primary Key)
  query: TEXT
  response: TEXT
  timestamp: TIMESTAMP
)
```

### Key Components
- `FaceRegistration.tsx`: Webcam capture and face registration
- `LiveRecognition.tsx`: Real-time face detection simulation
- `ChatBot.tsx`: RAG-powered Q&A interface
- `Dashboard.tsx`: Main tab-based navigation

## 🔮 Future Enhancements

### Planned Features
- **Real Face Recognition**: Integration with face_recognition library or MediaPipe
- **Advanced RAG**: OpenAI GPT-4 integration with FAISS vector storage
- **WebSocket Integration**: Real-time communication between frontend and Python modules
- **User Authentication**: Multi-user support with secure access
- **Export/Import**: Backup and restore face registration data

### ML Integration Ready
The codebase is structured to easily integrate:
- Python face recognition modules (face_recognition, dlib, MediaPipe)
- LangChain + FAISS for advanced RAG capabilities
- WebSocket server for real-time ML processing
- OpenAI API for enhanced natural language understanding

## 🎥 Demo

[Loom Video Demo](https://your-loom-video-link-here)

## 📊 Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React.js      │    │   Supabase       │    │   Future:       │
│   Frontend      │◄──►│   Backend        │◄──►│   Python ML     │
│                 │    │                  │    │   Modules       │
│ • Registration  │    │ • PostgreSQL     │    │ • Face Recog.   │
│ • Live Camera   │    │ • Real-time API  │    │ • RAG Engine    │
│ • ChatBot UI    │    │ • Row Level Sec. │    │ • OpenAI GPT-4  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🤝 Assumptions Made

1. **Browser Compatibility**: Modern browsers with webcam API support
2. **Permissions**: Users will grant webcam access permissions
3. **Network**: Stable internet connection for Supabase operations
4. **Development Focus**: Current implementation focuses on UI/UX and data flow
5. **ML Integration**: Face recognition logic is simulated, ready for real ML integration
6. **Security**: Demo-level security implementation (production would need enhanced auth)

## 📜 License

This project is part of a hackathon run by https://katomaran.com

## 🚀 Development

### Tech Stack
- **Frontend**: React.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Build Tool**: Vite
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Camera**: react-webcam

### Code Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main page components
├── integrations/       # Supabase integration
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

---

**Built with ❤️ for the hackathon at https://katomaran.com**
