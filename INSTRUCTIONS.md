# HealthAction Project - Submission Guide

This project is an AI-powered Health Assistant named HealthAction, designed to provide guidance on vaccinations, symptoms, and maternal/child health.

## 🚀 How to Run the Project

Follow these steps to get the project running on your local machine:

### 1. Prerequisites
Ensure you have **Node.js** (version 18 or higher) installed on your system.

### 2. Setup Environment Variables
Create a file named `.env` in the root directory and add the following keys (you can use the values from the student's setup):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```

### 4. Start the Development Server
Run the following command to start the app:
```bash
npm run dev
```
The app will be available at `http://localhost:8080`.

## 🛠️ Key Features
- **AI Health Assistant**: Powered by Google Gemini for accurate health guidance.
- **Human-like Voice**: Integrated text-to-speech with natural pronunciation and flow.
- **Health Guides**: Structured professional information for maternal and child care.
- **Disease Awareness**: Up-to-date info on disease prevention and vaccination schedules.
- **Nearby Centers**: Guidance for finding healthcare facilities.

## 🏗️ Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase
- **AI**: Google Generative AI (Gemini Pro)

---
*Created as part of the HealthAction health awareness initiative.*
