# GROC_AR - Project Breakdown for Presentation

This document breaks the GROC_AR application into four main functional areas. You can use this guide to assign contributions and explain the project's architecture to your teacher.

---

### Portion 1: Core Application & UI Framework

**Contribution:** This person or group was responsible for the foundational user experience, building the main screens, managing the shopping list state, and implementing the overall visual design using Next.js, React, and ShadCN UI components.

**Key Files & Responsibilities:**
*   **`src/app/home/page.tsx`**: The central hub of the application. This file manages the overall state (like the shopping list) and orchestrates which view (`list`, `map`, `ar`, `profile`) is currently active.
*   **`src/components/shopping-list.tsx`**: The interactive shopping list. This component handles adding, removing, and marking items as complete. It also includes the product search/browse functionality.
*   **`src/app/cart/page.tsx`**: The checkout process. This screen simulates the payment process and saves the purchase history to local storage.
*   **`src/components/profile-page.tsx`**: Displays the user's past purchases from local storage in a clear, collapsible format.
*   **`src/components/ui/` (Directory)**: The collection of reusable UI components (Buttons, Cards, etc.) that create a consistent look and feel across the entire app.
*   **`src/app/globals.css` & `tailwind.config.ts`**: Defines the app's theme, color palette, and styling rules.

---

### Portion 2: Store Layout & Pathfinding Engine

**Contribution:** This person or group designed the "virtual store" and implemented the core navigation logic. They were responsible for the data structures and the algorithm that finds the most efficient route through the store.

**Key Files & Responsibilities:**
*   **`src/lib/data.ts`**: The "database" of the store. This file defines the `STORE_LAYOUT` grid, the complete list of `ALL_PRODUCTS`, and their precise locations (aisle and section).
*   **`src/lib/pathfinding.ts`**: The "brains" of the navigation. This contains two critical pieces:
    1.  **A\* Algorithm (`findPath`)**: A classic pathfinding algorithm that finds the shortest path between any two points on the store grid, avoiding shelves and walls.
    2.  **Instruction Generator (`getTurnByTurnInstructions`)**: Logic that takes a series of points from the A\* algorithm and translates them into human-readable directions (e.g., "Proceed straight," "Turn left").
*   **`src/lib/types.ts`**: Defines the TypeScript types and data structures used by the application, such as `Product`, `ShoppingListItem`, and `MapPoint`, ensuring data consistency.

---

### Portion 3: Turn-by-Turn Navigation Views (2D & Compass)

**Contribution:** This person or group focused on translating the pathfinding logic into user-friendly navigation interfaces. They built the components that visually guide the user through the store.

**Key Files & Responsibilities:**
*   **`src/components/store-map.tsx`**: A crucial component that creates a 2D visualization of the store. It dynamically renders the store layout, places items on shelves, and draws the optimal shopping path calculated by the pathfinding engine. It also shows the user's simulated position.
*   **`src/components/compass-view.tsx`**: A simplified navigation interface. It consumes the turn-by-turn instructions from `pathfinding.ts` and displays them one by one with a large directional arrow, making it easy for the user to follow the path step-by-step.

---

### Portion 4: Augmented Reality (AR) Navigation & AI Item Recognition

**Contribution:** This person or group implemented the most technically advanced feature. They were responsible for overlaying navigation instructions onto the live camera feed and integrating a GenAI model to visually recognize products.

**Key Files & Responsibilities:**
*   **`src/components/ar-view.tsx`**: The most complex component in the app. It manages:
    *   **Camera Access**: Requesting and displaying the device's camera feed.
    *   **AR Overlay**: Rendering the 3D-style navigation arrow and instructions over the live video.
    *   **AI Integration**: Capturing a frame from the video, sending it to a Genkit AI flow, and processing the result.
    *   **State Management**: Handling the complex state transitions between navigating, scanning, and finding items, and ensuring the map dot and instructions advance correctly.
*   **`src/ai/flows/find-item-flow.ts`**: The server-side Genkit AI flow. This file defines the prompt that instructs the AI model (Gemini) on how to analyze an image of a supermarket aisle and determine if a specific item is present. It defines the expected input (image + item name) and output (found status + guidance).
