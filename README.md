# DeskoSpojka - Board Game Session Matcher PWA

A Progressive Web Application for matchmaking board game players based on game preferences, availability, and skill level. Features a Tinder-like discovery interface and Discord integration for communication.

This project uses [Convex](https://convex.dev) as its backend and is connected to the deployment [`dazzling-okapi-190`](https://dashboard.convex.dev/d/dazzling-okapi-190).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`bun run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Development Workflow

### Task Management

This project uses [Task Master AI](https://github.com/AntonioRdC/task-master-ai) for tracking development progress. All tasks are managed through Task Master instead of manual TODO lists.

```bash
# View current tasks
task-master list

# Get next task to work on
task-master next

# View task details
task-master show <id>

# Mark task as complete
task-master set-status --id=<id> --status=done
```

### Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
