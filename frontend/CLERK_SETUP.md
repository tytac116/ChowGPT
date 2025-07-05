# Clerk Setup Instructions

## Environment Variables

Create a `.env` file in the `frontend` directory with the following content:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# API Configuration  
VITE_API_URL=http://localhost:3001/api
```

## Getting Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Go to "API Keys" in the dashboard
4. Copy your **Publishable Key** (starts with `pk_test_`)
5. Replace `pk_test_your_publishable_key_here` in your `.env` file

## Important Notes

- **NEVER** put the `CLERK_SECRET_KEY` in the frontend `.env` file
- The `VITE_` prefix makes the variable available to the React app
- The publishable key is safe to expose to the client-side 