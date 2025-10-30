# GEMINI.md

## Project Overview

This is a website project built with Next.js and Payload CMS. It serves as a template for creating websites, blogs, or portfolios. The project includes a fully-functional backend, an enterprise-grade admin panel, and a production-ready website.

**Main Technologies:**

*   **Next.js:** A React framework for building server-side rendered and statically generated web applications.
*   **Payload CMS:** A headless CMS for managing content.
*   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
*   **MongoDB:** A NoSQL database used by Payload CMS.
*   **React:** A JavaScript library for building user interfaces.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.

**Architecture:**

The project is structured as a monorepo with the Next.js frontend and Payload CMS backend integrated. The `src` directory contains the source code for both the frontend and the backend. The `src/app` directory contains the Next.js application, while the `src/collections` and `src/globals` directories define the Payload CMS data structures.

## Building and Running

**Installation:**

```bash
pnpm install
```

**Running in Development:**

```bash
pnpm dev
```

This will start the development server at `http://localhost:3000`.

**Building for Production:**

```bash
pnpm build
```

**Running in Production:**

```bash
pnpm start
```

**Testing:**

*   **End-to-end tests:**

    ```bash
    pnpm test:e2e
    ```

*   **Integration tests:**

    ```bash
    pnpm test:int
    ```

**Linting:**

```bash
pnpm lint
```

To fix linting errors:

```bash
pnpm lint:fix
```

## Development Conventions

*   **Package Manager:** The project uses `pnpm` as the package manager.
*   **Code Style:** The project uses Prettier for code formatting and ESLint for linting.
*   **Testing:** The project uses Playwright for end-to-end testing and Vitest for integration testing.
*   **Commits:** The project follows the Conventional Commits specification for commit messages.
*   **Branching:** The project uses the GitFlow branching model.
