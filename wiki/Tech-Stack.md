# Tech Stack

Starglow uses a modern web development stack to deliver a fast, reliable, and maintainable application.

## Frontend

- **Framework**: [Next.js](https://nextjs.org/) 15.x
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React](https://reactjs.org/) 19.x
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.x
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**:
  - [Zustand](https://github.com/pmndrs/zustand) - For global state
  - [TanStack Query](https://tanstack.com/query/latest) - For server state

## Backend

- **Framework**: [Next.js](https://nextjs.org/) with App Router and Server Components
- **API Strategy**: Server Actions
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [Supabase](https://supabase.io/) (PostgreSQL)
- **Authentication**: [Next Auth](https://next-auth.js.org/)
- **File Storage**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

## Development Tools

- **Package Manager**: [Yarn](https://yarnpkg.com/)
- **Linting**: [ESLint](https://eslint.org/)
- **Version Control**: [Git](https://git-scm.com/) / [GitHub](https://github.com/)
- **CI/CD**: GitHub Actions

## Deployment

- **Hosting**: [Vercel](https://vercel.com/)
- **Environments**:
  - Production: main branch
  - Preview: pull requests

## Monitoring & Analytics

- **Performance**: [Vercel Analytics](https://vercel.com/analytics) / [Speed Insights](https://vercel.com/docs/speed-insights)

## Database Schema Visualization

The database schema is automatically visualized through our GitHub Actions workflow and published to GitHub Pages. You can view the current schema [here](https://your-organization.github.io/starglow/).

## Dependencies

For a complete list of dependencies, please refer to our [package.json](https://github.com/your-organization/starglow/blob/main/package.json) file.

## Architecture Decisions

Key architectural decisions and their rationales:

1. **Server Components & Server Actions**: Utilized for improved performance and SEO
2. **Zustand + TanStack Query**: Combined for a clean approach to client and server state management
3. **Prisma + Supabase**: For type-safe database access with a reliable hosted PostgreSQL service
4. **Edge Functions**: For compute-intensive operations
