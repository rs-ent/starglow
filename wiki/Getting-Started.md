# Getting Started with Starglow

This guide will help you set up your development environment and get started with contributing to Starglow.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22 or higher)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) (optional, for local development with Supabase)

## Setting Up Your Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-organization/starglow.git
   cd starglow
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory by copying the `.env.example` file:

   ```bash
   cp .env.example .env.local
   ```

   Update the values in the `.env.local` file with your own credentials.

4. **Generate Prisma client**

   ```bash
   npx prisma generate
   ```

5. **Start the development server**

   ```bash
   yarn dev
   ```

   The application should now be running at [http://localhost:3000](http://localhost:3000).

## Project Structure

The project follows a specific structure to organize code effectively:

- `app/` - Next.js app directory
  - `actions/` - Server Actions for data operations
  - `queries/` - Functions for fetching data (with caching)
  - `mutations/` - Functions for modifying data
  - `hooks/` - React hooks for state management
  - `components/` - UI components

For more details, refer to the [Project Structure](Project-Structure) page.

## Recommended Development Workflow

1. Create a new branch for your feature or bugfix
2. Make changes and test locally
3. Commit your changes following our [commit message guidelines](Contributing-Guidelines#commit-message-guidelines)
4. Push your branch and create a pull request
5. Await review and address any feedback

## Troubleshooting

If you encounter any issues during setup, check the [Common Issues](Common-Issues) page or open a new issue on GitHub.

## Next Steps

- Review the [Contributing Guidelines](Contributing-Guidelines)
- Explore the codebase and get familiar with the project
- Check the [issues list](https://github.com/your-organization/starglow/issues) for tasks to work on
