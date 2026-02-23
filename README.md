
📌 AniSpin – Anime Decision Engine

## 🎯 Overview

AniSpin is a curated anime discovery and decision engine designed to eliminate choice overload. Instead of endlessly scrolling through streaming platforms, users can apply filters and spin an interactive wheel to receive a structured, meaningful recommendation.

The platform blends deterministic logic with dynamic UI interaction to provide an engaging and practical browsing experience.

Live: [https://anispin.vercel.app](https://anispin.vercel.app)
Repo: [https://github.com/ayush834-git/anispin](https://github.com/ayush834-git/anispin)

---

## 🚀 Core Features

### 🎡 Deterministic Spin Wheel

* Random selection based on active filters
* Mathematically aligned segment-to-pointer logic
* Highlight always matches selected result
* GPU-accelerated animation for smooth mobile performance
* Duplicate and sequel filtering to maintain diversity

### 🔎 Smart Filtering System

* Genre-based filtering
* Status filtering (Airing, Completed, Seasonal, Classic)
* Length filtering (Short, Medium, Long, Saga)
* Franchise-aware filtering to prevent repetitive sequels

### 🎬 Description Page

* Banner + Poster layout
* Score and simplified commitment indicator
* YouTube trailer thumbnail with direct open
* Related seasons and movies (properly validated)
* Streaming platform search button
* Season clarity instead of unreliable total runtime

### 📚 Browse Section

Curated horizontal categories including:

* Beginner Friendly
* Action
* Romance
* Slice of Life
* Psychological
* Comedy

Each category:

* Limited to curated selections
* Duplicate-safe
* Optimized for clean horizontal scroll

### 📱 Fully Responsive

* Desktop horizontal navbar
* Mobile collapsible navigation menu
* Optimized wheel performance on mobile
* Scroll performance improvements
* Lazy image loading

---

## 🧠 Architecture Decisions

### Deterministic Spin Logic

Winner is selected first.
Rotation animation is calculated to land precisely on that segment.
No index derived from rotation to prevent floating-point mismatch.

### Franchise Control

Season duplicates removed where necessary to maintain content diversity.

### Performance Optimization

* GPU acceleration (transform + translateZ)
* Reduced repaint effects
* Lazy image loading
* Controlled state updates
* Scroll-lock during spin

---

## 🛠️ Tech Stack

* Next.js (App Router)
* React
* Tailwind CSS
* AniList GraphQL API
* Vercel Deployment

---

## ⚙️ Local Setup

```bash
git clone https://github.com/ayush834-git/anispin.git
cd anispin
npm install
npm run dev
```

Create a `.env.local` file:

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🧪 Challenges Solved

* Correct geometric alignment of radial wheel segments
* Floating-point precision mismatch in animation
* Mobile performance jitter
* Responsive navbar overflow
* Incorrect related anime linking
* Popularity classification inconsistencies

---

## 📈 Project Scope

AniSpin is currently a frontend-heavy discovery engine using public API data.

Future improvements may include:

* Authentication
* Saved recommendations
* Advanced ranking logic
* Personalized preference memory

---

## 🎓 What This Project Demonstrates

* Interactive UI logic
* Deterministic randomness
* API integration
* State management discipline
* Performance optimization
* Responsive design handling


---

## 🧩 Status

Feature complete for current scope.
Minor refinements and polish ongoing.



