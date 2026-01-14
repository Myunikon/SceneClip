# PROMPT: Implement Interactive Tutorial (Walkthrough) with driver.js

**Role:** Expert Frontend Developer (React, Tauri, Framer Motion)
**Objective:** Implement a "First Run" interactive tour using `driver.js` that guides the user through the key features of the application.

## 1. Context & Tech Stack

- **App:** SceneClip (YouTube/Media Downloader).
- **Framework:** Tauri v2 + React + TypeScript.
- **State Management:** Zustand (Persist middleware).
- **Styling:** TailwindCSS + Shadcn/UI (Glassmorphism theme).
- **Animation:** Framer Motion (`AnimatePresence` is used heavily).

## 2. Requirements

### A. Installation

- Install `driver.js`: `npm install driver.js`
- Import CSS: `import 'driver.js/dist/driver.css'`

### B. State Management (`src/store/tutorialStore.ts`)

Create a Zustand store to track:

1.  `hasSeenTutorial` (boolean, persisted in `localStorage`): To ensure it only runs once automatically.
2.  `isTutorialActive` (boolean): To conditionally disable other interactions if needed.
3.  `startTutorial()`: Action to manually trigger the tour (e.g., from Help menu).
4.  `resetTutorial()`: For debugging.

### C. The Challenge: Dynamic Elements (Framer Motion)

The application uses `AnimatePresence` for dialogs (like the "Add Download" modal). The tutorial MUST handle this:

- **Problem:** If a step targets an element inside a modal that isn't open, `driver.js` will fail.
- **Solution:** Use `driver.js`'s `onHighlightStarted` or specific step logic to **programmatically open** the modal/menu before the step starts, and wait for the animation.

### D. Proposed Steps (Walkthrough Flow)

1.  **Welcome:** Center modal. "Welcome to SceneClip! Let's show you around."
2.  **Paste & Go:** Highlight the Main Input / Paste area.
3.  **Add Menu:**
    - _Action:_ Programmatically simulate click on the "+" button (or open the `AddDialog`).
    - _Highlight:_ The "Add New" bottom sheet/dialog.
    - _Text:_ "You can also manually add links and configure formats here."
4.  **History:** Highlight the History list.
5.  **Settings:** Highlight the Settings button.

### E. Styling

- Customize `driver.js` popover to match the app's **Dark/Glass** theme.
- Use standard Tailwind colors (`bg-slate-900`, `text-white`, `border-white/10`).

## 3. Implementation Checklist for the Agent

1.  [ ] Create `useTutorialStore`.
2.  [ ] Create `src/components/TutorialController.tsx` to initialize `driver` instance.
3.  [ ] Define the `steps` array with robust selectors (add `id` attributes to target components if missing).
4.  [ ] Handle the async nature of the "Add Dialog" appearing (use `setTimeout` or `MutationObserver` if necessary, or simple delays).
5.  [ ] Add a "Replay Tutorial" button in `GeneralSettings.tsx`.

## 4. Example Code Structure

```typescript
// src/components/TutorialController.tsx
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";
import { useTutorialStore } from "../store/tutorialStore";

export function TutorialController() {
  const { hasSeenTutorial, setHasSeen } = useTutorialStore();

  useEffect(() => {
    if (!hasSeenTutorial) {
      const driverObj = driver({
        showProgress: true,
        steps: [
          { popover: { title: "Welcome", description: "..." } },
          {
            element: "#add-btn",
            popover: { title: "Add Task", description: "..." },
          },
          // ... more steps
        ],
        onDestroyStarted: () => {
          setHasSeen(true); // Mark as seen on close
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }
  }, [hasSeenTutorial]);

  return null; // Logic only component
}
```

**Execute this plan maintaining purely strictly typed code.**
