# Starglow

Starglow is a modern web application built with Next.js, TypeScript, and Supabase.

## Collaboration Tools

### GitHub Actions

This project uses GitHub Actions for continuous integration and deployment:

1. **CI Workflow** - Runs on pull requests to verify code quality and builds

   - Linting
   - Build checking
   - Automatic reviews

2. **Database Schema Visualization** - Automatically generates and publishes database schema diagrams
   - Updates on schema changes
   - Available at GitHub Pages: [Schema Visualization](https://your-organization.github.io/starglow/)

### Development Tools

1. **Template Analysis Tool** - Analyzes component structures and visualizes relationships
   - Identifies component hierarchy based on Atomic Design principles
   - Generates documentation with component diagrams
   - Located in `/scripts` directory with results in `/wiki/template-analysis`
   - Run with `cd scripts && npx ts-node --project tsconfig.json analyzeTemplates.ts`

### GitHub Wiki

We maintain comprehensive documentation in our [GitHub Wiki](https://github.com/your-organization/starglow/wiki):

- Getting started guides
- Project structure documentation
- Tech stack details
- Contribution guidelines
- [Template Analysis Results](/wiki/template-analysis/README.md)

Please refer to the Wiki for detailed information about the project.

## Getting Started

1. Clone the repository

   ```
   git clone https://github.com/your-organization/starglow.git
   cd starglow
   ```

2. Install dependencies

   ```
   yarn install
   ```

3. Set up environment variables

   ```
   cp .env.example .env.local
   ```

   And update the variables with your own values.

4. Generate Prisma client

   ```
   npx prisma generate
   ```

5. Start the development server
   ```
   yarn dev
   ```

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](LICENSE)

## Contact

For questions and support, please open an issue on GitHub.
