<div align="center">

# 🤖 Attend-II: AI-Powered Face Recognition Attendance System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/OpenCV-27338E?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/Version-2.0-blue.svg?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Maintained-Yes-green.svg?style=flat-square" alt="Maintained">
</p>

<h3 align="center">🚀 Advanced AI-powered attendance system with real-time face recognition</h3>
<p align="center">Built with modern AI + web technologies for seamless user experience</p>

</div>

---

## 📋 Table of Contents

<details>
<summary>📖 Expand Navigation</summary>

- [🎯 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🎬 Demo & Screenshots](#-demo--screenshots)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [📋 How to Use](#-how-to-use)
- [🛠️ Technology Stack](#️-technology-stack)
- [📊 API Endpoints](#-api-endpoints)
- [📁 Project Structure](#-project-structure)
- [🔧 System Requirements](#-system-requirements)
- [🎛️ Configuration Options](#️-configuration-options)
- [📊 Performance Metrics](#-performance-metrics)
- [🔍 Troubleshooting](#-troubleshooting)
- [📈 Performance Optimization](#-performance-optimization)
- [🔒 Security Features](#-security-features)
- [🚀 Future Enhancements](#-future-enhancements)
- [📞 Support & Contribution](#-support--contribution)
- [📄 License](#-license)

</details>

---

## 🎯 Project Overview

**Attend-II** is an AI-powered face recognition attendance system that combines **deep learning (CNNs)** with a modern **Next.js frontend** and **FastAPI backend**.  
It supports **real-time recognition**, **automatic retraining**, and **daily attendance tracking**, all within a clean, responsive UI.

---

## ✨ Key Features

<table>
<tr>
<td width="33%">

### 🧠 AI & Machine Learning
- 🎯 CNN-based face recognition (TensorFlow/Keras)  
- 🔄 Auto-retraining when new users are added  
- 📈 Confidence scoring (70%+ threshold)  
- 🔧 Data augmentation for robustness  

</td>
<td width="33%">

### 🖥️ User Interface
- 📷 Webcam + file upload registration  
- ⚡ Real-time recognition from camera  
- 🎨 Tailwind CSS modern design  
- 📊 Attendance dashboard with live updates  

</td>
<td width="33%">

### 📊 Attendance Management
- 🚫 Duplicate prevention (1 entry/day)  
- ✅ Live attendance summary  
- 📅 Historical records & analytics  
- 📈 Export-ready structure (CSV/PDF planned)  

</td>
</tr>
</table>

---

## 🚀 Quick Start Guide

<div align="center">

### 🎯 Get Your AI Attendance System Running in 60 Seconds!

</div>

### 🚀 **Method 1: One-Click Launch (Recommended)**

Simply navigate to your project directory and run the launch script:

```bash
# Open PowerShell/Command Prompt in the project folder
cd D:\attend-ii

# Launch the entire system with one command
./LAUNCH_SYSTEM.bat
```

> **💡 What this does:**
> - Starts the **FastAPI backend** server on `http://localhost:8001`
> - Launches the **Next.js frontend** on `http://localhost:3001`  
> - Opens both in separate terminal windows
> - **No manual setup required!**

### ⚙️ **Method 2: Manual Start (For Development)**

If you prefer to start services separately:

```bash
# Terminal 1 - Start Backend
cd D:\attend-ii
start_backend.bat

# Terminal 2 - Start Frontend  
cd D:\attend-ii
start_frontend.bat
```

### 🌐 **Access Your Application**

Once launched, open your browser and go to:

| Service | URL | Purpose |
|---------|-----|---------|
| 🎯 **Main App** | `http://localhost:3001` | User interface & face recognition |
| ⚡ **API Server** | `http://localhost:8001` | Backend REST API |
| 📚 **API Docs** | `http://localhost:8001/docs` | Interactive API documentation |

### ✅ **Verify Installation**

After launching, you should see:
- ✅ **Backend**: Terminal showing "Uvicorn running on http://127.0.0.1:8001"
- ✅ **Frontend**: Browser opening with the Attend-II interface
- ✅ **No errors** in either terminal window

### 🎯 **First Steps**

1. **Register Users**: Click "Register User" tab → Add face photos
2. **Train AI**: System automatically trains when you add 2+ users  
3. **Mark Attendance**: Click "Face Recognition" tab → Capture face
4. **View Results**: See real-time attendance in the dashboard

---

## 🏗️ System Architecture

```
┌─────────────────────────┐    ┌──────────────────────────────┐    ┌─────────────────┐
│   Frontend (Next.js)    │    │     Backend (FastAPI)        │    │   AI Engine     │
├─────────────────────────┤    ├──────────────────────────────┤    ├─────────────────┤
│ • User Registration     │◄──►│ • REST API Endpoints         │◄──►│ • Face Detection│
│ • Face Recognition      │    │ • Image Processing           │    │ • Feature Extract│
│ • Attendance Dashboard  │    │ • Model Training             │    │ • CNN Recognition│
│ • Real-time Updates     │    │ • Data Storage (JSON)        │    │ • Auto-Retrain  │
└─────────────────────────┘    └──────────────────────────────┘    └─────────────────┘
```

---

## 🛠️ Technology Stack

<table>
<tr>
<td width="50%">

### 🐍 **Backend Technologies**
- **FastAPI**: Modern Python web framework
- **OpenCV**: Computer vision & image processing
- **NumPy**: Numerical computing & feature vectors  
- **Uvicorn**: High-performance ASGI server
- **JSON**: Lightweight data storage

</td>
<td width="50%">

### ⚛️ **Frontend Technologies**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Webcam**: Browser camera integration
- **Lucide React**: Modern icon library

</td>
</tr>
</table>

---

## 🔧 System Requirements

### 📋 **Prerequisites**
- **Python 3.8+**: For backend processing
- **Node.js 16+**: For frontend development  
- **Modern Browser**: Chrome/Firefox/Safari/Edge
- **Webcam**: Built-in or external camera

### 💻 **Hardware Recommendations**
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for dependencies
- **CPU**: Multi-core processor for faster training
- **Network**: Internet connection for initial setup

---

## 🔍 Troubleshooting

### ❌ **Common Issues & Solutions**

#### **Issue: `./LAUNCH_SYSTEM.bat` doesn't work**

**Windows PowerShell:**
```powershell
# Method 1: Run directly
.\LAUNCH_SYSTEM.bat

# Method 2: If execution policy blocks it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\LAUNCH_SYSTEM.bat

# Method 3: Run from Command Prompt instead
cmd /c "LAUNCH_SYSTEM.bat"
```

#### **Issue: "Python not found" error**
```bash
# Check if Python is installed
python --version

# If not installed, download from python.org
# Or install via Microsoft Store (Windows)
```

#### **Issue: "Node.js not found" error**  
```bash
# Check Node.js installation
node --version

# If not installed, download from nodejs.org
# Minimum version required: Node.js 16+
```

#### **Issue: Ports already in use**
```bash
# Check what's using the ports
netstat -ano | findstr :3001
netstat -ano | findstr :8001

# Kill processes if needed (replace PID)
taskkill /PID <process_id> /F
```

#### **Issue: Camera not working**
- **Chrome/Edge**: Allow camera permissions when prompted
- **Firefox**: Check site permissions in address bar
- **Windows**: Ensure camera privacy settings allow browser access

#### **Issue: Face not recognized**
- **Lighting**: Ensure good lighting conditions
- **Distance**: Position face 2-3 feet from camera  
- **Training**: Register at least 2 users to train the AI model
- **Quality**: Use clear, high-quality face photos

---

## 📊 Performance Metrics

<div align="center">

| Metric | Performance | Description |
|--------|-------------|-------------|
| 🎯 **Recognition Accuracy** | **90%+** | High-precision face matching |
| ⚡ **Response Time** | **<2 seconds** | Fast recognition processing |
| 🚀 **Startup Time** | **<30 seconds** | Quick system initialization |
| 💾 **Memory Usage** | **<500MB** | Efficient resource utilization |
| 📱 **Browser Support** | **99%+** | Works on all modern browsers |

</div>

