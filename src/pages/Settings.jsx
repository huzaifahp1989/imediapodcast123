import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, Radio, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    azuracast_url: "",
    azuracast_api_key: "",
    station_id: "",
    mount_point: "",
    dj_username: "",
    dj_password: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser.azuracast_settings) {
        setFormData(currentUser.azuracast_settings);
      }
    }).catch(() => {});
  }, []);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe({
        azuracast_settings: settings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success("✅ AzuraCast settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    
    if (!formData.azuracast_url) {
      toast.error("Please enter AzuraCast server URL");
      return;
    }
    
    saveSettingsMutation.mutate(formData);
  };

  const testConnection = async () => {
    if (!formData.azuracast_url) {
      toast.error("Please enter AzuraCast server URL first");
      return;
    }

    setTesting(true);
    try {
      const testUrl = formData.azuracast_url.replace(/\/$/, '');
      
      toast.info("Testing connection to " + testUrl + "...");
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      toast.success("✅ Server is reachable! (Note: Full connection test requires going live)");
      
    } catch (error) {
      toast.warning("⚠️ Could not verify connection (may be CORS blocked). Try saving and going live to test fully.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white glow-text">Streaming Settings</h1>
          <p className="text-purple-300 text-lg">Configure your AzuraCast server for live streaming</p>
        </div>

        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Radio className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            <strong>AzuraCast Integration:</strong> Connect your AzuraCast/Icecast server to enable real-time live audio streaming. 
            Hosts can broadcast live, and listeners will hear the audio instantly on the Live Radio page!
          </AlertDescription>
        </Alert>

        <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Radio className="w-5 h-5" />
              AzuraCast Server Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <Label className="text-purple-300">AzuraCast Server URL</Label>
                <Input
                  value={formData.azuracast_url}
                  onChange={(e) => setFormData({...formData, azuracast_url: e.target.value})}
                  placeholder="https://a4.asurahosting.com"
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
                <p className="text-xs text-purple-400 mt-1">Your AzuraCast installation URL (no trailing slash)</p>
              </div>

              <div>
                <Label className="text-purple-300">API Key (Optional)</Label>
                <Input
                  type="password"
                  value={formData.azuracast_api_key}
                  onChange={(e) => setFormData({...formData, azuracast_api_key: e.target.value})}
                  placeholder="Your AzuraCast API key"
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
                <p className="text-xs text-purple-400 mt-1">Generate this in AzuraCast: Settings → API Keys</p>
              </div>

              <div>
                <Label className="text-purple-300">Station ID</Label>
                <Input
                  value={formData.station_id}
                  onChange={(e) => setFormData({...formData, station_id: e.target.value})}
                  placeholder="1"
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
                <p className="text-xs text-purple-400 mt-1">Your station ID (usually 1 for first station, or check URL)</p>
              </div>

              <div>
                <Label className="text-purple-300">Mount Point</Label>
                <Input
                  value={formData.mount_point}
                  onChange={(e) => setFormData({...formData, mount_point: e.target.value})}
                  placeholder="/radio.mp3"
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
                <p className="text-xs text-purple-400 mt-1">Your stream mount point (e.g., /radio.mp3 or /live)</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-purple-300">DJ Username</Label>
                  <Input
                    value={formData.dj_username}
                    onChange={(e) => setFormData({...formData, dj_username: e.target.value})}
                    placeholder="source"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                  />
                </div>

                <div>
                  <Label className="text-purple-300">DJ Password</Label>
                  <Input
                    type="password"
                    value={formData.dj_password}
                    onChange={(e) => setFormData({...formData, dj_password: e.target.value})}
                    placeholder="Your DJ password"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  onClick={testConnection}
                  disabled={testing || !formData.azuracast_url}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {testing ? (
                    <>Testing...</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button 
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-sm">📋 Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-purple-200">
            <div>
              <strong className="text-purple-300">1. Server URL:</strong> Your AzuraCast installation URL
              <br />
              <span className="text-xs text-gray-400">Example: https://a4.asurahosting.com</span>
            </div>
            <div>
              <strong className="text-purple-300">2. Station ID:</strong> Usually "1" for your first station
              <br />
              <span className="text-xs text-gray-400">Or check your AzuraCast station URL</span>
            </div>
            <div>
              <strong className="text-purple-300">3. Mount Point:</strong> Go to Station → Mount Points in AzuraCast
              <br />
              <span className="text-xs text-gray-400">Common: /radio.mp3, /live, /stream</span>
            </div>
            <div>
              <strong className="text-purple-300">4. DJ Credentials:</strong> Go to Station → Streamers/DJs → Create DJ
              <br />
              <span className="text-xs text-gray-400">Create a new DJ account with username and password</span>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-green-500/10 border-green-500/50">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <AlertDescription className="text-green-200 text-sm">
            <strong>💡 Pro Tip:</strong> Save your settings, then go to Host Studio and click "Go Live". 
            Check the Debug Console there to see detailed connection logs and troubleshoot any issues!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}