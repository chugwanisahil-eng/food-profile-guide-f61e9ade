Welcome to AuraScan

#🧠 AI-Powered Personalized Food Analyzer

> **Scan food. Get instant, personalized health insights.**

## 🚀 Overview

The  **AI-Powered Personalized Food Analyzer** is a smart web application that helps users make **safer and smarter food choices**. By scanning food products using **barcode or image**, the system analyzes nutritional data and provides **personalized recommendations** based on individual health profiles, dietary preferences, fitness goals, and allergies.

## 🎯 Problem Statement

Millions of people consume packaged food daily without understanding its true nutritional impact. Nutrition labels are often complex, generic, and difficult to interpret, making it hard for users to make informed decisions in real time.

## 💡 Solution

This application uses **AI + OCR + Barcode Scanning** to:

. Extract food product data
. Analyze nutritional values
. Detect allergens
. Provide personalized recommendations

## ✨ Features

### 📸 Smart Food Scanning
> Scan food using **barcode or image upload**
> Instant data extraction using OCR

### 🧠 Personalized AI Insights
* Recommendations based on:

  1.Health conditions
  2.Fitness goals
  3.Dietary preferences
  4.Easy-to-understand explanations

### ⚠️ Allergy & Risk Detection

.Identifies allergens in ingredients
.Highlights potential health risks

### 📊 Intelligent Results Dashboard

* Verdict:

  * ✅ Suitable
  * ⚠ Moderate
  * ❌ Not Recommended
* Nutritional highlights (calories, sugar, protein)
* Clear reasoning and suggestions

### 🤖 AI Assistant

* Chat-based interaction
* Ask questions like:

  * “Can I eat this daily?”
  * “Suggest healthier alternatives”

### 📈 Additional Features

* Confidence score (High / Medium)
* Data source indicator (Verified / Estimated)
* Suggested alternatives
* Save / bookmark products


🧩 Tech Stack

**Frontend**

* React / Next.js (or similar)
* Tailwind CSS
* Framer Motion (animations)

**Backend**

* Flask / Node.js
* REST APIs

**Database**

* SQLite / MongoDB

**AI & Processing**

* OpenAI API (analysis & chat)
* Tesseract OCR (text extraction)
* Barcode API (OpenFoodFacts)


 🏗️ System Architecture

```
User → Scan Image/Barcode
        ↓
OCR / Barcode API
        ↓
Nutrition Data Extraction
        ↓
AI Analysis Engine
        ↓
Personalized Recommendation
        ↓
Frontend UI (Results + Chat)
```

📱 UI/UX Highlights

* Minimal, modern, and premium design
* Glassmorphism cards with soft gradients
* Mobile-first responsive layout
* Clean typography and spacing
* Smooth animations and transitions
* Focus on clarity and personalization

 ⚙️ Installation & Setup(**PYTHON 3.13 IS REQUIRED**)

 1. Clone the repository

```bash
git clone https://github.com/your-username/food-analyzer.git
cd food-analyzer
```

 2. Backend Setup

```bash
cd aurascan-backend
pip install -r requirements.txt
python app.py
```

 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

🔑 Environment Variables

Create a `.env` file:

```
Gemini_API_KEY=your_api_key
```

🧪 API Endpoints

| Endpoint         | Method | Description       |
| ---------------- | ------ | ----------------- |
| `/api/user`      | POST   | Save user profile |
| `/api/user/<id>` | GET    | Get user profile  |
| `/api/analyze`   | POST   | Analyze food      |
| `/api/chat`      | POST   | AI assistant      |

---

🏆 Future Enhancements

. 📸 Advanced image recognition for food items
. 🧠 Improved nutrition parsing with ML
. 📊 Health tracking dashboard
. 🔐 User authentication (JWT)
. 🌍 Multi-language support


 🌍 Impact

This solution promotes **preventive healthcare** by enabling users to:

 Make informed dietary choices
 Avoid harmful ingredients
 Maintain personalized nutrition habits

👥 Team VIGILANTES
SAGAR SINGH
NIRUPAM SINGH
YASH MISHRA
SAHIL CHUGWANI

COLLEGE:BMS INSTITUTE OF TECHNOLOGY



 ⭐ If you like this project, give it a star!


👉 make a **GitHub project description (short one-liner)**
👉 or add **screenshots section (very important for judges)** 🚀
