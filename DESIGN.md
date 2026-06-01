# SceneClip Design System

A modern, highly customizable, responsive, and accessible design system for the SceneClip desktop application.

---

## 1. Design Principles

- **Visual Consistency**: Unified UI components replacing scattered inline configurations.
- **Material Hierarchy**: Elements transition from background canvas to card surface to overlays cleanly.
- **Accessibility (A11y)**: Proper ARIA roles, keyboard navigation, and focus management on all interactive controls.
- **Fluid & Responsive Layouts**: Full support for container queries and standard viewport responsiveness.
- **Motion-Friendly**: Structured styling that works seamlessly with animation frameworks like Framer Motion.

---

## 3. Style Tokens

Tokens are defined in `tokens.css` and exposed via `index.ts` constants.

### Spacing Scale
- `var(--spacing-1)`: 4px
- `var(--spacing-2)`: 8px
- `var(--spacing-3)`: 12px
- `var(--spacing-4)`: 16px
- `var(--spacing-6)`: 24px
- `var(--spacing-8)`: 32px

### Border Radius Scale
- `var(--radius-sm)`: 6px
- `var(--radius-md)`: 8px
- `var(--radius-lg)`: 12px
- `var(--radius-xl)`: 16px
- `var(--radius-full)`: 9999px

### Colors
Defined in `hsl()` variables mapping to standard dark/light modes:
- `--primary`, `--secondary`, `--accent`, `--destructive`, `--background`, `--card`, `--border`, `--input`, `--ring`

---

## 4. Reusable Component Usage

### Button
Supported variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `accent`
Supported sizes: `default`, `sm`, `lg`, `icon`

```tsx
import { Button } from "@/components/ui"

// Standard Usage
<Button variant="default" onClick={handleClick}>
  Click Me
</Button>

// Loading state (disables interactions and renders a spinner)
<Button variant="accent" isLoading>
  Downloading
</Button>
```

### Input
Standardized input box with prefix icon and error handling support.

```tsx
import { Input } from "@/components/ui"
import { Link } from "lucide-react"

<Input
  type="url"
  placeholder="Enter download link..."
  icon={<Link className="w-4 h-4" />}
  error={hasError}
  value={url}
  onChange={handleChange}
/>
```

### Select
Portal-based customized dropdown selection list with full keyboard arrow and enter controls.

```tsx
import { Select } from "@/components/ui"

const options = [
  { value: "best", label: "Best Quality" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" }
]

<Select
  value={quality}
  onChange={setQuality}
  options={options}
/>
```

### Checkbox
Custom accessible checkbox replacement.

```tsx
import { Checkbox } from "@/components/ui"

<Checkbox
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
  label="Enable subtitle downloads"
/>
```

### Badge
Status labels supporting soft background presets matching download states.

```tsx
import { Badge } from "@/components/ui"

<Badge variant="success">Completed</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="warning">Pending</Badge>
```

### Modal
Animated slide-up and fade modal overlay using framer-motion.

```tsx
import { Modal } from "@/components/ui"

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Task details"
>
  <div>Modal Content Goes Here</div>
</Modal>
```

---

## 5. Rules for Adding New Components

1. **Keep it Generic**: Design system components should contain no application-specific domain logic, translations (`t(...)` function calls), or global state. Pass these in via props.
2. **Handle States Cleanly**: Ensure every interactive control handles hover, active, focus, disabled, and loading states visually and accessibly.
3. **Use the Utility**: Merge custom class styling correctly using the `cn` helper:
   ```typescript
   className={cn("base-classes", customClassName)}
   ```
4. **Document It**: Add usage guidelines and mockups in this document.
