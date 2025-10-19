# Smart Todo App

A modern todo application built with Next.js that implements smart task propagation and dependency management. Create tasks with dependencies and watch them update automatically based on their relationships.

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/tedhn/smart-todo.git
cd smart-todo
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: TailwindCSS + ShadcN UI components
- **State Management**: Zustand with persist middleware
- **Type Safety**: TypeScript
- **Databse**: Supabase
- **Component Library**: ShadcN UI (built on Radix UI)

## Features

- Create, edit, and delete tasks
- Add dependencies between tasks
- Automatic task status propagation
- Persistent storage using supabase
- Responsive design
- Dark/Light mode support

## Dependency Management Approach

Tasks use a directed acyclic graph (DAG) structure for dependency management:

1. **Task Creation**: Tasks can be created with zero or more dependencies
2. **Dependency Validation**: System prevents circular dependencies
3. **Status Propagation**: Completing a task triggers updates to dependent tasks

Example dependency flow:

```
Task A (complete) → Task B (unlocked) → Task C (locked)
```

## Data Structures

- **Tasks**: Array in Zustand store

```typescript
interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "blocked" | "done";
  dependencies: string[]; // IDs of tasks this depends on
  createdAt: Date;
  updatedAt: Date;
}
```

- **Dependencies**: Map<string, Set<string>> for efficient lookups
- **State Updates**: Queue-based propagation system

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Assumptions & Trade-offs

1. **Performance vs Simplicity**

   - Array-based storage for easier state updates
   - O(n) lookup time accepted for smaller datasets
   - Local state management for initial version

2. **Dependency Rules**

   - Tasks can only depend on existing tasks
   - No circular dependencies allowed
   - Dependencies are bi-directional (stored in both tasks)

3. **Storage Limitations**
   - Uses localStorage with 5MB limit
   - No server-side persistence in current version

## Future Improvements

1. **Backend Integration**

   - RESTful API with Node.js/Express
   - PostgreSQL database for persistence
   - WebSocket real-time updates

2. **Enhanced Features**

   - Due dates and reminders
   - Priority levels and sorting
   - Task categories and tags
   - Multi-user support
   - Bulk actions
   - Task templates

3. **Performance Optimizations**

   - Implement virtual scrolling
   - Add Redis caching layer
   - Optimize dependency graph traversal
   - Batch updates for dependencies

4. **Testing & Quality**
   - Increase unit test coverage
   - Add E2E tests with Cypress
   - Implement error boundaries
   - Add input validation
   - Improve error handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
