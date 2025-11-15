# Design Guidelines: Intelligent Cloud Platform for Smart Homes

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern enterprise dashboards like **Linear**, **Vercel**, and **Datadog**, combined with the professional aesthetic shown in your UI mockups. This approach prioritizes clarity, data density, and operational efficiency for a monitoring platform.

## Core Design Principles

1. **Information Hierarchy**: Critical alerts and metrics are immediately visible
2. **Role-Based Clarity**: Each user role sees relevant data without cognitive overload
3. **Operational Efficiency**: Quick access to actions (acknowledge alerts, control devices, export data)
4. **Professional Restraint**: Clean, corporate aesthetic appropriate for senior care monitoring

---

## Typography

**Font Stack**: Inter (primary), SF Pro (fallback)
- **Headings**: 
  - H1: 2xl font-semibold (dashboard titles)
  - H2: xl font-semibold (section headers)
  - H3: lg font-medium (card titles)
- **Body**: base font-normal (tables, descriptions)
- **Labels**: sm font-medium (form labels, badges)
- **Metrics**: 3xl font-bold (KPI numbers)
- **Data Tables**: sm font-mono (device IDs, timestamps)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8** consistently
- Component padding: `p-6` (cards), `p-4` (smaller elements)
- Section spacing: `space-y-6` (vertical stacking)
- Grid gaps: `gap-4` or `gap-6`
- Page margins: `px-8 py-6`

**Grid Structure**:
- Sidebar: `w-64` fixed width
- Main content: `flex-1` with `max-w-7xl mx-auto`
- Card grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Stat cards: `grid-cols-2 lg:grid-cols-4`

---

## Component Library

### Navigation
- **Sidebar**: Fixed left navigation with icon + label, active state indicator
- **Top Bar**: User profile, notifications bell, global search
- **Breadcrumbs**: For deep navigation (Device Manager > House A > Living Room)

### Data Display
- **KPI Cards**: Metric value + label + trend indicator (↑/↓ with percentage)
- **Tables**: Sticky headers, alternating row backgrounds, action buttons per row
- **Charts**: Use Chart.js or Recharts - line charts (trends), bar charts (comparisons), donut charts (status distribution)
- **Status Badges**: Pill-shaped with dot indicator (Online/Offline/Critical/Warning)

### Forms & Controls
- **Input Fields**: Full-width with labels above, helper text below
- **Dropdowns**: Native select with chevron icon
- **Toggle Switches**: For binary settings (Enable/Disable)
- **Action Buttons**: Primary (solid), Secondary (outline), Danger (for critical actions)

### Alerts & Notifications
- **Alert Cards**: Severity icon + timestamp + message + action buttons (Acknowledge/Dismiss)
- **Toast Notifications**: Top-right corner for real-time updates
- **Modal Dialogs**: For confirmations (Delete device, Resolve alert)

### Specialized Components
- **Device Cards**: Device icon + name + status + last seen + quick actions
- **Video Feed Grid**: 2x2 or 3x3 grid with camera labels, play/pause controls
- **Timeline**: Vertical timeline for alert history with timestamps
- **Heatmap**: For pattern visualization (activity by hour/day)

---

## Dashboard-Specific Layouts

### Homeowner Dashboard
- Hero stats row: 4 KPI cards (Devices Online, Active Alerts, Energy Usage, Security Score)
- Device grid: 3-column card layout with device thumbnails
- Recent alerts table: Last 10 alerts with severity badges
- Surveillance feed: 2x2 camera grid

### Cloud Staff Dashboard  
- System health overview: Server metrics, uptime, API latency
- Multi-tenant overview: Table with tenant names, device counts, alert counts
- Real-time alert stream: Auto-updating list with WebSocket connection
- Charts row: Alert trends (line), Device distribution (donut), SLA compliance (bar)

### IoT Device Manager
- Search/filter bar at top
- Device table: Columns for Name, Type, Location, Status, Last Seen, Actions
- Detail drawer: Slides in from right when device selected
- Bulk actions toolbar: Appears when rows selected

### Alert Tracking Interface
- Filter sidebar: Severity, Type, House, Date range
- Alert list: Card-based with expandable details
- Detail view: Full alert context + AI prediction data + action history

---

## Animations

**Minimal, Purposeful Motion**:
- Page transitions: None (instant navigation)
- Card hovers: Subtle lift shadow (`hover:shadow-lg transition-shadow`)
- Button clicks: Scale down briefly (`active:scale-95`)
- Data updates: Gentle fade-in for new rows (`animate-fade-in`)
- Loading states: Spinner or skeleton screens (no elaborate animations)

---

## Images

### Hero/Landing Imagery
Not applicable - this is a dashboard application, not a marketing site. No large hero images.

### Dashboard Icons
- Use **Heroicons** (outline style) for navigation and UI controls
- Use **Lucide Icons** for device types (camera, microphone, sensor)
- Status icons: checkmark (online), x (offline), exclamation (warning)

### Mockup Elements
- Camera feed placeholders: 16:9 ratio rectangles with camera icon overlay
- Device thumbnails: 1:1 ratio icons with device type illustration
- Chart placeholders: Use actual Chart.js renderings with dummy data

---

## Accessibility

- **Focus States**: Visible focus rings on all interactive elements (`focus:ring-2 focus:ring-offset-2`)
- **Form Labels**: Always present and associated with inputs
- **ARIA Labels**: For icon-only buttons and status indicators
- **Keyboard Navigation**: Tab order follows visual hierarchy
- **Screen Reader**: Descriptive text for all critical metrics and states

---

## Implementation Notes

- **Responsive Breakpoints**: Design desktop-first, stack to single column on mobile
- **Loading States**: Show skeleton screens for slow-loading data tables
- **Empty States**: Friendly messages with CTAs when no data (e.g., "No alerts - all systems operational")
- **Error Handling**: Toast notifications for failures with retry options
- **Real-time Updates**: Use WebSocket connection indicators (green dot = connected)