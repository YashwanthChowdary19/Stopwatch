# 🕐 ZenTimer

A modern, feature-rich stopwatch application built with Flask and designed for Indian Standard Time (IST) with automatic daily reset, session tracking, and beautiful glassmorphism UI.

![IST Stopwatch](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.3-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### 🎯 Core Functionality
- **Automatic Daily Reset**: Resets at 12:00 AM IST daily
- **Persistent Sessions**: Start/stop with cumulative time tracking
- **IST Timezone**: Built specifically for Indian Standard Time
- **JSON Storage**: Lightweight local data storage

### 📊 Time Tracking & Reports
- **Today's Total**: Current day's accumulated time
- **Weekly Report**: Past 7 days total
- **Monthly Report**: Current month total
- **Yearly Report**: Current year total
- **Session History**: Complete log with start/stop times

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful translucent cards
- **Lexend Typography**: Modern, readable font
- **Responsive Layout**: Works on desktop and mobile
- **Dark Theme**: Eye-friendly gradient background
- **Circular Timer**: Visual progress indicator
- **Hover Animations**: Interactive elements

### 🔧 Advanced Features
- **Mini Overlay**: Draggable floating timer for multitasking
- **Date Search**: Filter sessions by specific dates
- **Collapsible History**: Toggle session history view
- **Real-time Updates**: Live timer synchronization
- **Auto-save**: Persistent data across sessions

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ist-stopwatch.git
cd ist-stopwatch
```

2. **Create virtual environment**
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the application**
```bash
python app.py
```

5. **Open in browser**
```
http://localhost:5000
```

## 📖 Usage Guide

### Basic Timer Operations
- **Start**: Click the green "Start" button to begin timing
- **Stop**: Click the red "Stop" button to pause and save session
- **Reset (UI)**: Reset the display (data remains intact)
- **Mini**: Open a draggable floating timer overlay

### Session Management
- **View History**: Click "Show History" to see all sessions
- **Date Filter**: Use the date picker to filter sessions by date
- **Time Format**: Sessions show "Date: YYYY-MM-DD, Time: HH:MM:SS"

### Mini Overlay
- **Drag**: Click and drag the header to move the overlay
- **Close**: Click the × button to close the mini timer
- **Always Visible**: Stays on top of other windows

## 🏗️ Project Structure

```
ist-stopwatch/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── storage.json          # Session data storage
├── README.md            # This file
├── templates/
│   └── index.html       # Main HTML template
└── static/
    ├── style.css        # CSS styles and animations
    └── app.js          # JavaScript functionality
```

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Main application page
- `GET /health` - Health check endpoint
- `POST /api/start` - Start timer session
- `POST /api/stop` - Stop timer session
- `GET /api/status` - Get current timer status
- `GET /api/reports` - Get time reports (today/week/month/year)

### Response Format
```json
{
  "running": true,
  "current_start": "2024-01-15T10:30:00+05:30",
  "sessions": [...],
  "base_elapsed_ms": 3600000,
  "running_elapsed_ms": 120000,
  "server_now": "2024-01-15T11:30:00+05:30"
}
```

## 🎨 UI Components

### Timer Circle
- **Progress Ring**: Visual indicator of daily progress
- **Large Display**: Clear time reading (HH:MM:SS)
- **Hover Effects**: Interactive glow animations

### Statistics Cards
- **Glass Effect**: Translucent background with blur
- **Gradient Text**: Modern typography styling
- **Hover Animations**: Subtle lift effects

### History Table
- **Collapsible**: Toggle visibility with button
- **Date Filtering**: Search by specific dates
- **Responsive**: Scrollable on mobile devices








## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Lexend Font**: Modern typography by Google Fonts
- **Glassmorphism Design**: Inspired by modern UI trends
- **Flask Framework**: Python web framework
- **IST Timezone**: Indian Standard Time support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ist-stopwatch/issues)
- **Email**: your-email@example.com
- **Documentation**: [Wiki](https://github.com/your-username/ist-stopwatch/wiki)

---

⭐ **Star this repository if you found it helpful!**
