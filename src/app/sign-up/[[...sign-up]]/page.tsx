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
            variables: {
              colorBackground: '#161616',
              colorForeground: '#f2f2f2',
              colorPrimary: '#f2f2f2',
              colorPrimaryForeground: '#0f0f0f',
              colorInput: '#1c1c1c',
              colorInputForeground: '#f2f2f2',
              colorBorder: '#262626',
              colorMutedForeground: '#737373',
              colorNeutral: '#525252',
              colorRing: '#525252',
              colorShimmer: '#262626',
            },
            elements: {
              rootBox: 'w-full',
              card: 'border border-border bg-card shadow-none rounded-lg',
              footerActionLink: 'text-foreground hover:underline',
            },
          }}
        />
      </div>
    </div>
  );
}
