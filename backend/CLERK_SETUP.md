# Backend Clerk Setup Instructions

## Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```bash
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Existing environment variables
# ... your existing backend environment variables
```

## Getting Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Go to "API Keys" in the dashboard
4. Copy your **Secret Key** (starts with `sk_test_`)
5. Replace `sk_test_your_secret_key_here` in your `.env` file

## Important Security Notes

- **NEVER** commit the `CLERK_SECRET_KEY` to version control
- **NEVER** expose the secret key to the frontend
- The secret key is used for server-side token verification only
- Keep your secret key secure and rotate it regularly

## Development API Testing

For testing APIs during development, you can:

1. **Use Postman with Bearer tokens**: 
   - Get a token from your frontend app (inspect network requests)
   - Use the token in Authorization header: `Bearer YOUR_TOKEN`

2. **Create a test endpoint** for development:
   - Add a development-only endpoint that bypasses auth
   - Use environment variables to enable/disable this

3. **Use Clerk's test tokens**:
   - Generate test tokens from the Clerk dashboard
   - Use these for API testing during development 