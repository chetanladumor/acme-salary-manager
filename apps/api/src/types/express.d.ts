export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
// TypeScript Declaration File.
//When you run npm run build, tsc ignores .d.ts files and compiles no code for them into dist/. They exist purely to tell the TypeScript compiler about types
//in Express, req.user does not exist on the base Request type. We use express.d.ts and TypeScript's declaration merging to extend Express's global Request interface so that req.user is strongly typed with our AuthUser interface across all controllers and middleware
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
