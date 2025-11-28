
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Mic, Library, Rss, ChevronRight, Music, Sparkles, Video, Shield, User, MessageSquare, Heart, BarChart3, Search, Users, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [authTab, setAuthTab] = React.useState("signin");
  const [signinEmail, setSigninEmail] = React.useState("");
  const [signinPassword, setSigninPassword] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPassword, setSignupPassword] = React.useState("");
  const [signupConfirm, setSignupConfirm] = React.useState("");
  const [signupFullName, setSignupFullName] = React.useState("");
  const [signupDisplayName, setSignupDisplayName] = React.useState("");
  const [signinError, setSigninError] = React.useState("");
  const [signupError, setSignupError] = React.useState("");
  const [loadingSignin, setLoadingSignin] = React.useState(false);
  const [loadingSignup, setLoadingSignup] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
    const unsubscribe = base44.auth.onChange((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleSidebarSignIn = async (e) => {
    e.preventDefault();
    setSigninError("");
    if (!signinEmail || !signinPassword) { setSigninError("Email and password are required"); return; }
    try {
      setLoadingSignin(true);
      await base44.auth.signin({ email: signinEmail, password: signinPassword });
    } catch (err) {
      setSigninError(err?.message || "Sign in failed");
    } finally { setLoadingSignin(false); }
  };

  const handleSidebarSignUp = async (e) => {
    e.preventDefault();
    setSignupError("");
    if (!signupEmail || !signupPassword) { setSignupError("Email and password are required"); return; }
    if (signupPassword !== signupConfirm) { setSignupError("Passwords do not match"); return; }
    try {
      setLoadingSignup(true);
      await base44.auth.signup({ email: signupEmail, password: signupPassword, full_name: signupFullName, display_name: signupDisplayName });
    } catch (err) {
      setSignupError(err?.message || "Sign up failed");
    } finally { setLoadingSignup(false); }
  };

  const navigationItems = [
    {
      title: "Home",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "Search",
      url: createPageUrl("Search"),
      icon: Search,
    },
    {
      title: "Podcast Library",
      url: createPageUrl("Library"),
      icon: Library,
    },
    {
      title: "Islamic Audio",
      url: createPageUrl("Audio"),
      icon: Music,
    },
    {
      title: "Video Library",
      url: createPageUrl("VideoPodcast"),
      icon: Video,
    },
    {
      title: "Media Requests",
      url: createPageUrl("MediaRequest"),
      icon: MessageSquare,
    },
    {
      title: "My Favorites",
      url: createPageUrl("Favorites"),
      icon: Heart,
    },
    {
      title: "Community",
      url: createPageUrl("Community"),
      icon: Users,
    },
    {
      title: "Haramain Live",
      url: createPageUrl("HaramainLive"),
      icon: Sparkles,
    },
    {
      title: "RSS Feed",
      url: createPageUrl("RSS"),
      icon: Rss,
    },
  ];

  // Add user profile link for logged in users
  if (user) {
    navigationItems.push({
      title: "My Profile",
      url: createPageUrl("UserProfile"),
      icon: User,
    });
    navigationItems.push({
      title: "Creator Studio",
      url: createPageUrl("CreatorStudio"),
      icon: BarChart3,
    });
  }

  // Add moderation link for admin users
  if (user?.role === 'admin') {
    navigationItems.push({
      title: "Moderation",
      url: createPageUrl("Moderation"),
      icon: Shield,
    });
  }

  if (!user) {
    navigationItems.push({
      title: "Sign In",
      url: createPageUrl("SignIn"),
      icon: User,
    });
    navigationItems.push({
      title: "Sign Up",
      url: createPageUrl("SignUp"),
      icon: User,
    });
  }

  return (
    <>
      <style>{`
        :root {
          --primary: 160 84% 39%;
          --primary-foreground: 0 0% 100%;
          --secondary: 142 76% 36%;
          --background: 138 76% 97%;
          --foreground: 222 47% 11%;
          --card: 0 0% 100%;
          --card-foreground: 222 47% 11%;
          --popover: 0 0% 100%;
          --popover-foreground: 222 47% 11%;
          --muted: 142 50% 90%;
          --muted-foreground: 215 16% 47%;
          --accent: 142 76% 85%;
          --accent-foreground: 222 47% 11%;
          --border: 142 30% 85%;
          --input: 142 30% 85%;
          --ring: 160 84% 39%;
        }
        
        body {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%);
          background-attachment: fixed;
        }
        
        .glow-text {
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
      `}</style>

      <div className="min-h-screen flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white/90 backdrop-blur-xl border-r border-emerald-200 fixed h-full z-40 shadow-lg">
          <div className="p-6 border-b border-emerald-200">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-emerald-900 glow-text">PodcastHub</h2>
                <p className="text-xs text-emerald-600">Record & Share</p>
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                    <span className="font-medium flex-1">{item.title}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b-2 border-emerald-300 shadow-lg">
            <div className="flex items-center justify-between p-4">
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-emerald-900 glow-text">PodcastHub</h1>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 font-bold"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                  <span className="text-base font-bold">MENU</span>
                </button>
                {!user && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="px-3 py-2 h-auto bg-emerald-600 text-white text-sm">Sign In/Up</Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={6} className="sm:w-72 w-[88vw] max-w-[340px] p-3">
                      <Tabs value={authTab} onValueChange={setAuthTab}>
                        <TabsList className="bg-emerald-50">
                          <TabsTrigger value="signin" className="px-2 py-1 text-xs">Sign In</TabsTrigger>
                          <TabsTrigger value="signup" className="px-2 py-1 text-xs">Sign Up</TabsTrigger>
                        </TabsList>
                        <TabsContent value="signin" className="mt-2">
                          {signinError && (
                            <Alert className="mb-2">
                              <AlertDescription className="text-xs">{signinError}</AlertDescription>
                            </Alert>
                          )}
                          <form onSubmit={handleSidebarSignIn} className="space-y-1.5">
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Email</Label>
                              <Input type="email" value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Password</Label>
                              <Input type="password" value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 text-white h-8 text-sm" disabled={loadingSignin}>
                              {loadingSignin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                            </Button>
                          </form>
                        </TabsContent>
                        <TabsContent value="signup" className="mt-2">
                          {signupError && (
                            <Alert className="mb-2">
                              <AlertDescription className="text-xs">{signupError}</AlertDescription>
                            </Alert>
                          )}
                          <form onSubmit={handleSidebarSignUp} className="space-y-1.5">
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Email</Label>
                              <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Password</Label>
                              <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Confirm Password</Label>
                              <Input type="password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Full Name (optional)</Label>
                              <Input value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-emerald-800 text-[11px]">Display Name (optional)</Label>
                              <Input value={signupDisplayName} onChange={(e) => setSignupDisplayName(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 text-white h-8 text-sm" disabled={loadingSignup}>
                              {loadingSignup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                            </Button>
                          </form>
                        </TabsContent>
                      </Tabs>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <nav className="border-t-2 border-emerald-300 bg-white/98 backdrop-blur-xl p-4 shadow-xl">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                            : 'text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 bg-emerald-50'
                        }`}
                      >
                        <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                        <span className="font-bold text-base">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            )}
          </header>

          {/* Page Content */}
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
