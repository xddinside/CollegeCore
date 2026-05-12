import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">CollegeCore</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your account</p>
        </div>
        <SignUp
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
          fallbackRedirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'border border-border shadow-none',
              formButtonPrimary: 'bg-primary text-primary-foreground hover:opacity-90',
              footerActionLink: 'text-foreground hover:underline',
            },
          }}
        />
      </div>
    </div>
  );
}
