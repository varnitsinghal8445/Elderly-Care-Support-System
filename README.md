# ElderCare - Medicine Tracker

A comprehensive medicine management system built with React for tracking medications, schedules, stock, and intake logs.

## Technologies Used

### Frontend Framework & Libraries
- **React 18.2** - UI library
- **React Router DOM 6.20** - Client-side routing
- **Vite 5.0** - Build tool and dev server

### State Management & Data Fetching
- **TanStack Query (React Query) 5.14** - Server state management and caching

### Styling
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

### UI Components
- **shadcn/ui** - Re-usable component library
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx & tailwind-merge** - Conditional class merging

### Date Handling
- **date-fns 3.0** - Date formatting and manipulation

### Backend/API
- **Base44 Client** - Custom API client (currently mocked with localStorage)

## Project Structure

```
project DBMS/
├── src/
│   ├── api/              # API client configuration
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── medicines/   # Medicine-specific components
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   ├── index.css        # Global styles
│   └── utils.js         # Utility functions
├── pages/               # Page components
├── componets/           # Feature components (typo in original)
├── layouts/             # Layout components
├── entities/            # Data models (JSON schemas)
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Dependencies

```

## Features

- **Dashboard** - Overview of medicines, schedules, and statistics
- **Medicine Management** - Add, edit, delete medicines
- **Schedule Management** - Set up medication reminders
- **Auto Reminders** - Automated reminder system
- **Stock Tracking** - Monitor medicine inventory with low stock alerts
- **Intake Logs** - Track medication intake history
- **Notifications** - Real-time alerts and notifications
- **Reports** - Generate medication reports
- **Profile** - User profile management

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Development

- **Dev Server**: Vite dev server with hot module replacement
- **Port**: 3000 (configured in vite.config.js)
- **Auto-open**: Browser opens automatically on dev server start

## Notes

- The Base44 API client is currently mocked using localStorage
- Replace `src/api/base44Client.js` with actual API implementation
- All data is stored in browser localStorage for demo purposes
- The project uses path aliases (`@/`) configured in vite.config.js

## Browser Support

Modern browsers with ES6+ support
# Elderly-Care-Support-System
# Elderly-Care-Support-System
# Elderly-Care-Support-System
