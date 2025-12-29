
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:gap-12 items-center justify-center text-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                    Your Financial Class Manager
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                    Organize Your Class Funds with KitaMo!
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                    A simple, modern, and transparent way to manage your class or organization's finances. Stay organized, track payments, and generate reports with ease.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Button asChild size="lg">
                    <Link href="/register">
                      Get Started for Free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">
                      Login
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need for Financial Tracking</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  KitaMo! provides a comprehensive set of tools to help student organizations manage their finances efficiently and transparently.
                </p>
              </div>
            </div>
            <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-8 mt-12">
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-card transition-all">
                <h3 className="text-lg font-bold">Financial Rooms</h3>
                <p className="text-sm text-muted-foreground">Create dedicated rooms for your organization or class to track collections and expenses in one place.</p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-card transition-all">
                <h3 className="text-lg font-bold">Real-Time Tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor payments and expenses as they happen with a live activity feed for all members.</p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-card transition-all">
                <h3 className="text-lg font-bold">Statement Generation</h3>
                <p className="text-sm text-muted-foreground">Easily generate and download financial statements for reporting and transparency.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
