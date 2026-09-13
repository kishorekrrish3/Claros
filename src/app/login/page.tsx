"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await loginAction(password);
      if (res.success) {
        toast.success("Welcome back to Claros");
        router.push("/");
        router.refresh();
      } else {
        setError(res.error || "Invalid password");
        toast.error(res.error || "Invalid password");
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-2">
            <LockIcon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Claros Finance</h1>
          <p className="text-sm text-muted-foreground">
            Enter your master password to access your dashboard.
          </p>
        </div>

        <Card className="border-border/60 shadow-lg backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Authentication</CardTitle>
            <CardDescription>
              Protected personal financial records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Master password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="h-11 text-base"
                />
                {error && (
                  <p className="text-xs text-destructive font-medium">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base gap-2 font-medium"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    Unlock Dashboard
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Encrypted session cookie • 100% self-hosted & private
        </p>
      </div>
    </div>
  );
}
