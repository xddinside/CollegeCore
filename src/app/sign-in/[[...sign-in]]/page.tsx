import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight">CollegeCore</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        <SignIn 
          signUpUrl="/sign-up"
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