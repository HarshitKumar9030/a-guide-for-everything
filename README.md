This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your configuration:

```bash
cp .env.example .env.local
```

### Mailgun Setup

1. Sign up for a [Mailgun account](https://www.mailgun.com/)
2. Get your API key from the Mailgun dashboard
3. Add your domain to Mailgun or use the sandbox domain for testing
4. Add the following variables to your `.env.local`:

```bash
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain.com
MAILGUN_URL=https://api.mailgun.net  # or https://api.eu.mailgun.net for EU
APP_NAME=AGFE
```

The email functionality includes:
- Password reset emails with styled HTML templates
- Automatic fallback to plain text
- Secure token generation and validation

### Cloudinary Setup

1. Sign up for a [Cloudinary account](https://cloudinary.com/)
2. Get your credentials from the Cloudinary dashboard
3. Add the following variables to your `.env.local`:

```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

The avatar functionality includes:
- Image upload with automatic optimization
- Face-detection cropping for avatars
- 5MB file size limit
- Automatic format conversion (WebP, AVIF)
- Responsive image delivery

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
