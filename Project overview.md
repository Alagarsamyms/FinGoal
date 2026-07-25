# FinGoal OS - Project Overview

## Problem – What problem does it solve?
Managing personal finances is often fragmented. Users typically track their daily expenses in one app, monitor their investment portfolios in another, and use complex spreadsheets for long-term goals like Financial Independence, Retire Early (FIRE). This fragmentation makes it difficult to get a holistic view of one's financial health, understand how current debt impacts future goals, or simulate different financial scenarios effectively. FinGoal solves this by providing a unified, comprehensive dashboard.

## Product Vision – Why build it?
The vision for FinGoal OS is to create a centralized, intelligent "Operating System" for personal finance. It aims to empower users to seamlessly track their net worth, manage debts, set and monitor life goals, and plan for early retirement (FIRE) all in one place. By integrating data visualization and scenario simulation, FinGoal helps users make informed, data-driven decisions about their financial future without relying on third-party servers, ensuring privacy through local storage and personal cloud sync.

## Your Role
- **Product Manager**: Defining the core feature set (Dashboard, FIRE tracking, Goal management), designing the user flow, and ensuring the interface is intuitive, modern, and accessible.
- **Business Analyst**: Formulating the financial logic behind the scenes—such as calculating FIRE numbers, debt payoff trajectories, cash flow funnels, and portfolio diversification metrics.
- **AI Developer/Assistant**: Rapidly scaffolding the application architecture, implementing React components, styling with Tailwind CSS, integrating charting libraries, and handling complex state management and Google Drive synchronization.

## Key Features – What makes it valuable?
- **Executive Dashboard**: A high-level overview of net worth, cash flow funnels, and asset allocation.
- **Accounts & Debt Management**: Track various accounts and visualize debt payoff strategies.
- **Goal Tracker**: Set specific financial milestones (e.g., buying a house, vacation) and monitor progress over time.
- **FIRE Dashboard**: Specialized tracking for Financial Independence, Retire Early, calculating target numbers and projecting timelines.
- **Protection & Risk**: Manage insurance policies and emergency funds to ensure a safety net.
- **Scenario Simulation**: Model different financial scenarios (e.g., market downturns, salary changes) to see their impact on long-term goals.
- **Data Privacy & Portability**: Local state management with Google Drive sync (`gdrive.js`) and Excel export capabilities (`exportExcel.js`).

## Business Impact / Learning – Outcome or insight.
- **Business Impact**: Provides users with a powerful, private tool that replaces expensive subscriptions or clunky spreadsheets, leading to better financial literacy and peace of mind. 
- **Learning Outcomes**: 
  - Mastery of modern React (v19) concepts and Context API for global state management.
  - Advanced data visualization techniques using Recharts.
  - Implementation of local-first architectures with cloud backup (Google Drive integration).
  - Building responsive, premium user interfaces using Tailwind CSS v4 and Lucide icons.

## Technical Overview (End-to-End)
- **Frontend Framework**: React 19 powered by Vite for lightning-fast development (HMR) and optimized production builds.
- **Styling**: Tailwind CSS v4 for utility-first, responsive, and customizable design, supporting both light and dark modes.
- **Icons & UI**: Lucide React for consistent, crisp iconography.
- **State Management**: React Context API (`AppStateProvider`) to manage global user data, settings, and financial metrics across the app.
- **Data Visualization**: Recharts library to render interactive pie charts, line graphs, and bar charts for the dashboards and simulations.
- **Data Persistence & Sync**: 
  - Local state is the primary source of truth.
  - `utils/gdrive.js` handles synchronization with the user's personal Google Drive to persist data securely across devices.
  - `exportExcel.js` (using the `xlsx` library) allows users to download their financial data for offline analysis.
- **PWA Capabilities**: Configured with `vite-plugin-pwa` to allow users to install FinGoal OS as a standalone app on their devices for a native-like experience.
