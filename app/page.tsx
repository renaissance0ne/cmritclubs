'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Github } from 'lucide-react';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ShadButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ShadButton.displayName = "Button"

const ShadCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
        {...props}
      />
    )
)
ShadCard.displayName = "Card"

const ShadCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    )
)
ShadCardHeader.displayName = "CardHeader"

const ShadCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
        {...props}
      />
    )
)
ShadCardTitle.displayName = "CardTitle"

const ShadCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
ShadCardDescription.displayName = "CardDescription"

const ShadCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
)
ShadCardContent.displayName = "CardContent"

export default function HomePage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && firebaseUser && user) {
        if (user.role === 'college_official') {
            // FIX: Explicitly type officialPath as string | undefined to resolve TypeScript error.
            let officialPath: string | undefined = user.officialRole;
            if (user.officialRole?.includes('hod')) {
                officialPath = 'hod';
            }
            if (officialPath) {
                router.push(`/${officialPath}/dashboard`);
            } else {
                router.push('/admin/dashboard'); 
            }
        } else {
            switch (user.status) {
                case 'approved':
                    router.push('/dashboard');
                    break;
                case 'pending':
                    router.push('/pending-approval');
                    break;
                case 'rejected':
                    router.push('/application-rejected');
                    break;
                case 'email_verified':
                    router.push('/application');
                    break;
                default:
                    router.push('/dashboard');
            }
        }
    }
  }, [loading, firebaseUser, user, router]);

  if (loading || firebaseUser) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
    );
  }


  return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="fixed top-4 right-4 z-50">
            <a href="https://github.com/renaissance0ne/cmritclubs" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                    <Github className="h-4 w-4" />
                </Button>
            </a>
        </div>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl mb-4">
              CMRIT Clubs Portal
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              A streamlined club management and permission system for students and faculty.
            </p>

            <div className="space-x-4 flex justify-center">
                <Button size="lg" onClick={() => router.push('/signup')}>
                    Sign Up for Clubs
                </Button>
                <Button size="lg" variant="secondary" onClick={() => router.push('/signin')}>
                    Sign In
                </Button>
            </div>
          </div>

          <Card className="mt-16 max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Platform Demo</CardTitle>
              <CardDescription>
                Watch how the CMRIT Clubs Portal works in action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
                <iframe
                  className="w-full h-full"
                  src="https://drive.google.com/file/d/154ew3Bs9cU_Ksx7lH2Z45Zvon-Ynh-6L/preview"
                  title="CMRIT Clubs Portal Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </CardContent>
          </Card>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Easy Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sign up with your college email and get verified quickly to join and manage clubs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permission Letters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Submit and track permission letters for your club events with a clear status overview.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Official Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A streamlined approval process for faculty and college officials to review requests.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
  );
}
