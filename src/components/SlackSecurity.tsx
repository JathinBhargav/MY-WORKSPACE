import React, { useState, useEffect } from 'react';
import { SlackLog, AppSecuritySettings, SlackSettings, NotificationSettings, GeneralFeedbackItem } from '../types';
import { 
  ShieldCheck, Send, KeyRound, CheckCircle2, Lock, Unlock, Terminal, 
  Settings, Sliders, Bell, Volume2, Sparkles, Star, ThumbsUp, HelpCircle, 
  Activity, Play, Check, TrendingUp, Info, ShieldAlert, BadgeInfo, Copy, BellRing
} from 'lucide-react';

const Slack: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.824a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.824 5.043a2.528 2.528 0 0 1-2.52-2.522A2.528 2.528 0 0 1 8.824 0a2.528 2.528 0 0 1 2.52 2.522v2.521h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.782a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.042zm10.134 3.762a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52 2.522h-2.522v-2.522zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.782a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043zm-3.762 10.134a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.522h-5.043z" />
  </svg>
);
import { playSynthesizedSound, ALERT_SOUNDS } from '../utils/audioSynth';

interface SlackSecurityProps {
  slackLogs: SlackLog[];
  securitySettings: AppSecuritySettings;
  slackSettings: SlackSettings;
  onUpdateSlack: (webhookUrl: string, channelName: string, isEnabled: boolean) => void;
  onUpdateSecurity: (passphrase: string, enable: boolean) => Promise<void>;
  onTestSlack: () => Promise<void>;
  isTestingSlack: boolean;
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  feedbacks: GeneralFeedbackItem[];
  onAddFeedback: (feedback: Omit<GeneralFeedbackItem, 'id' | 'timestamp'>) => void;
  fcmToken?: string;
}

export const SlackSecurity: React.FC<SlackSecurityProps> = ({
  slackLogs,
  securitySettings,
  slackSettings,
  onUpdateSlack,
  onUpdateSecurity,
  onTestSlack,
  isTestingSlack,
  notificationSettings,
  onUpdateNotificationSettings,
  feedbacks,
  onAddFeedback,
  fcmToken
}) => {
  // Current active sub-settings tab: 'channels' | 'notifications' | 'feedback_alignment' | 'fcm_config'
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'notifications' | 'feedback_alignment' | 'fcm_config'>('fcm_config');

  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedServerTokenIndex, setCopiedServerTokenIndex] = useState<number | null>(null);
  const [sendingPush, setSendingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const [serverTokens, setServerTokens] = useState<{ userId: string; token: string }[]>([]);
  const [isLoadingServerTokens, setIsLoadingServerTokens] = useState(false);

  const fetchServerTokens = async () => {
    setIsLoadingServerTokens(true);
    try {
      const response = await fetch('/api/active-tokens');
      if (response.ok) {
        try {
          const data = await response.json();
          if (data && data.success && data.tokens) {
            setServerTokens(data.tokens);
          }
        } catch (jsonErr) {
          console.warn('Failed to parse active-tokens JSON:', jsonErr);
        }
      }
    } catch (err) {
      console.error('Failed to load server registered tokens:', err);
    } finally {
      setIsLoadingServerTokens(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'fcm_config') {
      fetchServerTokens();
    }
  }, [activeSubTab]);

  // Channel Settings state
  const [webhookInput, setWebhookInput] = useState(slackSettings.webhookUrl);
  const [channelInput, setChannelInput] = useState(slackSettings.channelName);
  const [slackEnabled, setSlackEnabled] = useState(slackSettings.isEnabled);

  // Security passphrases
  const [passphraseInput, setPassphraseInput] = useState(securitySettings.passphrase || '');
  const [securityStatusMsg, setSecurityStatusMsg] = useState('');

  // Retraining state
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainingProgress, setRetrainingProgress] = useState(0);
  const [retrainingLogs, setRetrainingLogs] = useState<string[]>([]);

  const handleSlackSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSlack(webhookInput, channelInput, slackEnabled);
    setSecurityStatusMsg('Slack webhook proxy settings saved successfully!');
    setTimeout(() => setSecurityStatusMsg(''), 4000);
  };

  const handleSecurityToggle = async (enable: boolean) => {
    if (enable && !passphraseInput.trim()) {
      setSecurityStatusMsg('Please enter a strong security passcode.');
      return;
    }
    setSecurityStatusMsg('Configuring crypto locks...');
    try {
      await onUpdateSecurity(passphraseInput, enable);
      setSecurityStatusMsg(enable ? 'AES-GCM encryption locks activated on-device!' : 'Data decrypted. Plain-text mode active.');
    } catch (err: any) {
      setSecurityStatusMsg(err.message || 'Error occurred configuring cryptography.');
    }
    setTimeout(() => setSecurityStatusMsg(''), 4000);
  };

  // Toggle account for email summarization
  const toggleAccount = (email: string) => {
    onUpdateNotificationSettings(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => 
        acc.email === email ? { ...acc, isEnabled: !acc.isEnabled } : acc
      )
    }));
  };

  // Update summarization frequency selection
  const handleFrequencyChange = (freq: 'hourly' | 'daily' | 'weekly' | 'on-demand') => {
    onUpdateNotificationSettings(prev => ({
      ...prev,
      frequency: freq
    }));
  };

  // Update specific sound alert choice
  const handleSoundChange = (type: 'urgent' | 'newSummary' | 'reminder', soundId: string) => {
    onUpdateNotificationSettings(prev => {
      const updated = { ...prev };
      if (type === 'urgent') updated.urgentSoundId = soundId;
      if (type === 'newSummary') updated.newSummarySoundId = soundId;
      if (type === 'reminder') updated.reminderSoundId = soundId;
      return updated;
    });
    // Immediately play tone to preview custom choice
    playSynthesizedSound(soundId);
  };

  // Fake retraining sequence to outline data alignment loops
  const handleTriggerRetraining = () => {
    if (isRetraining) return;
    setIsRetraining(true);
    setRetrainingProgress(0);
    setRetrainingLogs([]);

    const steps = [
      'Initialized model alignment wrapper. Standard base model: gemini-3.5-flash.',
      `Fetching on-device alignment logs... Found ${feedbacks.length} human-in-the-loop annotations.`,
      'Filtering low-quality scores (Rating < 3) for targeted Supervised Fine-Tuning (SFT)...',
      'Configuring parameter-efficient target adapters (LoRA rank=8, alpha=16)...',
      'Executing localized offline reward calibration optimization...',
      'Epoch 1/3 - Loss: 0.4921 - Accuracy alignment score: 72.1%',
      'Epoch 2/3 - Loss: 0.2854 - Accuracy alignment score: 81.3%',
      'Epoch 3/3 - Loss: 0.1102 - Accuracy alignment score: 94.6%',
      'Validating safety token limits and hallucination filters... [OK]',
      'Local model fine-tuning adapters successfully updated on-disk.',
      'Deployment verified. Customized event detection weights activated!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setRetrainingLogs(prev => [...prev, `[ALIGN-BOT] ${steps[currentStep]}`]);
        setRetrainingProgress(Math.floor(((currentStep + 1) / steps.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsRetraining(false);
      }
    }, 900);
  };

  // Helpfulness aggregates
  const totalRatings = feedbacks.length;
  const averageRating = totalRatings > 0 
    ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1) 
    : '5.0';
  const helpfulCount = feedbacks.filter(f => f.isHelpful).length;
  const helpfulPercentage = totalRatings > 0 
    ? Math.round((helpfulCount / totalRatings) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="slack-security-panel">
      
      {/* Sidebar navigation selectors */}
      <div className="lg:col-span-1 bg-[#121212] border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-2.5 h-fit text-left">
        <h3 className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-bold mb-1.5 px-2">Control Sub-Panels</h3>
        
        <button
          onClick={() => setActiveSubTab('fcm_config')}
          className={`py-2 px-3 text-xs font-mono font-semibold tracking-wide rounded-xl border flex items-center transition-all ${
            activeSubTab === 'fcm_config'
              ? 'bg-amber-950/25 border-amber-900/40 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/45'
          }`}
        >
          <BellRing className="h-4 w-4 mr-2" />
          FCM Push Notifications
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`py-2 px-3 text-xs font-mono font-semibold tracking-wide rounded-xl border flex items-center transition-all ${
            activeSubTab === 'notifications'
              ? 'bg-amber-950/25 border-amber-900/40 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/45'
          }`}
        >
          <Bell className="h-4 w-4 mr-2" />
          Alert Presets & Sounds
        </button>

        <button
          onClick={() => setActiveSubTab('channels')}
          className={`py-2 px-3 text-xs font-mono font-semibold tracking-wide rounded-xl border flex items-center transition-all ${
            activeSubTab === 'channels'
              ? 'bg-amber-950/25 border-amber-900/40 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/45'
          }`}
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          Safety & Slack Bridges
        </button>

        <button
          onClick={() => setActiveSubTab('feedback_alignment')}
          className={`py-2 px-3 text-xs font-mono font-semibold tracking-wide rounded-xl border flex items-center transition-all ${
            activeSubTab === 'feedback_alignment'
              ? 'bg-amber-950/25 border-amber-900/40 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/45'
          }`}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Fine-Tuning Align
          {totalRatings > 0 && (
            <span className="ml-auto text-[9px] font-mono font-bold bg-amber-400 text-black py-0.5 px-1.5 rounded-full">
              {totalRatings}
            </span>
          )}
        </button>
      </div>

      {/* Main configuration container */}
      <div className="lg:col-span-3">

        {/* TAB 0: FCM PUSH NOTIFICATIONS & DEVICE TOKEN */}
        {activeSubTab === 'fcm_config' && (
          <div className="bg-[#121212] rounded-2xl border border-zinc-800/80 p-6 shadow-2xl text-left space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-100">
                    <BellRing className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">FCM Push Notification Gateway</h2>
                    <p className="text-xs text-zinc-500 font-mono">Verify cryptographic handshakes & retrieve device tokens</p>
                  </div>
                </div>
                
                {fcmToken ? (
                  <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-full animate-pulse">
                    ● ACTIVE HANDSHAKE
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold bg-amber-955/20 border border-amber-900/20 text-amber-550 rounded-full">
                    ▲ AWAITING HANDSHAKE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl pt-1">
                Your browser uses the certified <strong>VAPID key</strong> to request unique, secure channel coordinates (FCM Device Token) from Google Cloud. These coordinates authorize native desktop banner pushes.
              </p>
            </div>

            {/* FCM Token Display Card */}
            <div className="p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold font-mono text-zinc-350 uppercase tracking-wide">FCM Recipient Device Token</h4>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Use this unique string to route custom test payloads to this specific browser cockpit session.</p>
                </div>
                {fcmToken && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fcmToken);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2500);
                      }}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-mono font-semibold flex items-center transition-all ${
                        copiedToken 
                          ? 'bg-[#1b2b1b] border-emerald-500/30 text-emerald-400' 
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {copiedToken ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5 stroke-[3]" />
                          Token Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Copy Token String
                        </>
                      )}
                    </button>

                    <button
                      disabled={sendingPush}
                      onClick={async () => {
                        setSendingPush(true);
                        setPushStatus('Sending Test Push call to active local token...');
                        try {
                          const response = await fetch('/api/test-push', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              token: fcmToken,
                              title: '⚡ Cockpit Local Token Test Push',
                              body: 'Real-time test notification dispatched via Firebase Admin loop!'
                            })
                          });
                          const resData = await response.json();
                          if (response.ok) {
                            setPushStatus(`Test Push Delivered! trackingId: ${resData.trackingId}`);
                          } else {
                            setPushStatus(`FCM Error: ${resData.error || response.statusText}`);
                          }
                        } catch (error: any) {
                          setPushStatus(`Failed to request test push: ${error.message || error}`);
                        } finally {
                          setSendingPush(false);
                        }
                      }}
                      className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold flex items-center shadow-lg transition-all"
                    >
                      <BellRing className="h-3.5 w-3.5 mr-1.5" />
                      Test Push
                    </button>
                  </div>
                )}
              </div>

              {fcmToken ? (
                <div className="relative group">
                  <div className="bg-[#0b0b0c] font-mono text-[11px] leading-relaxed text-zinc-300 p-4 rounded-lg border border-zinc-950 max-h-36 overflow-y-auto break-all select-all scrollbar-thin scrollbar-thumb-zinc-800 text-left">
                    {fcmToken}
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Scrollable Area
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-950/15 border border-amber-900/30 rounded-lg flex items-start space-x-3">
                  <ShieldAlert className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                  <div className="text-xs text-zinc-350 space-y-1.5 text-left">
                    <p className="font-semibold text-amber-400 font-mono">No Token Yet / Permission Blocked in Sandbox </p>
                    <p className="leading-relaxed">
                      Please ensure you click <strong>"Allow Notifications"</strong> when prompted. Since you are viewing this app within an <strong>iframe sandbox</strong>, modern browsers block service workers and notification registers. 
                    </p>
                    <p className="leading-relaxed font-semibold text-zinc-350">
                      💡 <strong>Action Required:</strong> Click the <strong>"Open in New Tab"</strong> button at the top right of the AI Studio window to open the app on a direct page. Once open, authorize the permission. The server will capture your token instantly and display it below!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SERVER REGISTERED SECURE TOKENS LIST */}
            <div className="p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wide flex items-center">
                    <Activity className="h-4 w-4 text-emerald-400 mr-2" />
                    Server Registered Active Tokens ({serverTokens.length})
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                    These are verified channels currently cached by the node server. Even if your current iframe blocks registration, you can copy previous tokens or trigger tests to them here.
                  </p>
                </div>
                
                <button
                  onClick={fetchServerTokens}
                  disabled={isLoadingServerTokens}
                  className="py-1 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-zinc-750 disabled:opacity-50 flex items-center"
                >
                  {isLoadingServerTokens ? 'Fetching...' : '🔄 Refresh Live Servers List'}
                </button>
              </div>

              {serverTokens.length > 0 ? (
                <div className="space-y-2.5">
                  {serverTokens.map((st, idx) => (
                    <div key={idx} className="p-3 bg-[#0c0c0d] border border-zinc-850 rounded-lg flex items-center justify-between space-x-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold bg-amber-950/30 text-amber-400 border border-amber-900/40 px-1.5 py-0.5 rounded">
                            User: {st.userId}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {st.token.substring(0, 16)}...{st.token.substring(st.token.length - 12)}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono select-all break-all text-zinc-400 select-all leading-normal">
                          {st.token}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(st.token);
                            setCopiedServerTokenIndex(idx);
                            setTimeout(() => setCopiedServerTokenIndex(null), 2500);
                          }}
                          className={`py-1 px-2.5 rounded text-[10px] font-mono border transition-all ${
                            copiedServerTokenIndex === idx 
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {copiedServerTokenIndex === idx ? 'Copied!' : 'Copy'}
                        </button>
                        
                        <button
                          disabled={sendingPush}
                          onClick={async () => {
                            setSendingPush(true);
                            setPushStatus(`Sending Test Push to registered key for ${st.userId}...`);
                            try {
                              const response = await fetch('/api/test-push', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  token: st.token,
                                  title: '⚡ Cockpit Remote Connection Verified',
                                  body: 'FCM direct cloud admin route delivered successfully to this browser session!'
                                })
                              });
                              const resData = await response.json();
                              if (response.ok) {
                                setPushStatus(`Direct Web Service Push Success! trackingId: ${resData.trackingId}`);
                              } else {
                                setPushStatus(`Direct web service push rejected: ${resData.error || response.statusText}`);
                              }
                            } catch (error: any) {
                              setPushStatus(`Server pipeline connection failed: ${error.message || error}`);
                            } finally {
                              setSendingPush(false);
                            }
                          }}
                          className="py-1 px-2.5 rounded text-[10px] font-mono bg-amber-500 hover:bg-amber-400 text-black font-semibold uppercase tracking-wider transition-all"
                        >
                          Test Push
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-zinc-500 bg-zinc-950/30 rounded-lg text-xs font-mono border border-dashed border-zinc-900">
                  No active tokens currently recorded in the Express server cache. (Open in a new tab to create the first connection).
                </div>
              )}
            </div>

            {/* Test Push Simulator section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 bg-[#161616]/70 rounded-xl border border-zinc-800/85 space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase flex items-center">
                      <Terminal className="h-4 w-4 text-amber-500 mr-2" />
                      Client Notification Dispatch
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                      Verify that your system's notification layout intercepts and pops banners instantly.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1 text-left">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Alert Title</label>
                      <input 
                        defaultValue="Cyber Cockpit Notification" 
                        id="test-push-title"
                        className="w-full text-xs font-mono border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-150 focus:outline-none focus:border-amber-500"
                        placeholder="Push title..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Message Body</label>
                      <textarea 
                        defaultValue="This is a test desktop notification alert successfully intercepted by the background listener." 
                        id="test-push-body"
                        rows={2}
                        className="w-full text-xs font-sans border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-150 focus:outline-none focus:border-amber-500 resize-none"
                        placeholder="Push message contents...."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!fcmToken}
                  onClick={async () => {
                    const titleEl = document.getElementById('test-push-title') as HTMLInputElement;
                    const bodyEl = document.getElementById('test-push-body') as HTMLTextAreaElement;
                    const title = titleEl?.value || 'Cyber Cockpit Alert';
                    const body = bodyEl?.value || 'Test Signal received.';
                    
                    setSendingPush(true);
                    setPushStatus('Initializing alert dispatch sequence...');

                    setTimeout(() => {
                      try {
                        if ('Notification' in window && Notification.permission === 'granted') {
                          // Try via manual constructor for safe instant diagnostic feedback
                          new Notification(title, {
                            body: body,
                            icon: '/favicon.ico',
                            badge: '/favicon.ico',
                            requireInteraction: true
                          });
                          setPushStatus('Alert dispatched. Look at your desktop monitors!');
                        } else {
                          setPushStatus('Perms error: Ensure browser permissions allowed.');
                        }
                      } catch (err: any) {
                        setPushStatus(`Local Notification Error: ${err.message || err}`);
                      } finally {
                        setSendingPush(false);
                      }
                    }, 1200);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="h-4 w-4 mr-2 text-black" />
                  {sendingPush ? 'Broadcasting...' : 'Trigger Local Desktop Push'}
                </button>
              </div>

              {/* Server Payload diagnostics card */}
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl space-y-4 text-left">
                <div>
                  <h4 className="text-xs font-bold font-mono text-zinc-350 uppercase tracking-wide flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    Automated Webhook Simulator
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Test the pipeline: Express servers parse incoming emails, detect urgency, and push banners via Firebase Admin.</p>
                </div>

                <div className="space-y-4 pt-1">
                  {pushStatus && (
                    <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-lg text-xs font-mono text-amber-500 leading-normal">
                      &gt; {pushStatus}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Email Subject Line</label>
                      <input 
                        id="webhook-email-subject"
                        defaultValue="🚨 Action Required: High Priority Exam Security Alert"
                        className="w-full text-xs font-sans border border-zinc-800 rounded-lg p-2 bg-[#171717] text-zinc-200 focus:outline-none focus:border-amber-500"
                        placeholder="Subject..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Email Body Content</label>
                      <textarea 
                        id="webhook-email-body"
                        defaultValue="This is an automated notification warning because the server detected a critical system deadline threat."
                        rows={1}
                        className="w-full text-xs font-sans border border-zinc-800 rounded-lg p-2 bg-[#171717] text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                        placeholder="Body content..."
                      />
                    </div>
                  </div>

                  <button
                    disabled={!fcmToken}
                    onClick={async () => {
                      const subjectVal = (document.getElementById('webhook-email-subject') as HTMLInputElement)?.value || '';
                      const bodyVal = (document.getElementById('webhook-email-body') as HTMLTextAreaElement)?.value || '';
                      
                      setSendingPush(true);
                      setPushStatus('Posting real payload to /api/v1/incoming-email...');

                      try {
                        const response = await fetch('/api/v1/incoming-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            userId: 'vjs-user-id', 
                            subject: subjectVal, 
                            body: bodyVal 
                          })
                        });

                        const resData = await response.json();
                        if (response.ok) {
                          setPushStatus(`Webhook Success! trackingId: ${resData.trackingId || 'N/A'}`);
                        } else {
                          setPushStatus(`Webhook Rejected: ${resData.error || response.statusText}`);
                        }
                      } catch (err: any) {
                        setPushStatus(`Server Webhook Connection failed: ${err.message || err}`);
                      } finally {
                        setSendingPush(false);
                      }
                    }}
                    className="w-full mt-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5 mr-2 text-black" />
                    Simulate Webhook Trigger
                  </button>

                  <div className="text-[10px] text-zinc-500 space-y-1.5 font-sans leading-relaxed pt-2 border-t border-zinc-800/40">
                    <p>
                      <strong>Urgency filter rule:</strong> The webhook automatically parses subjects and bodies for primary urgent terms (<em>urgent, deadline, exam, important, action required</em>). Other emails are saved silently.
                    </p>
                    <p className="italic">
                      Deliveries flow through standard Service Workers defined in <code>public/firebase-messaging-sw.js</code>.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 1: NOTIFICATION ALERT AND SOUND PRESETS */}
        {activeSubTab === 'notifications' && (
          <div className="bg-[#121212] rounded-2xl border border-zinc-800/80 p-6 shadow-2xl text-left space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Enhanced Alert Modals</h2>
                  <p className="text-xs text-zinc-405 font-mono">Custom Android email integrations & frequency triggers</p>
                </div>
              </div>
              <p className="text-xs text-zinc-450 font-sans leading-relaxed">
                Tune your background email sync schedules and custom alert wave pitches so you can filter incoming noise on your device perfectly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Account selection checklist */}
              <div className="p-4 bg-[#161616]/70 rounded-xl border border-zinc-805 space-y-4">
                <div>
                  <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wide">1. Monitored Accounts ({notificationSettings.accounts.filter(a => a.isEnabled).length})</h4>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Toggle accounts permitted for AI parsing and background Summarization.</p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {notificationSettings.accounts.map((acc) => (
                    <div 
                      key={acc.email}
                      onClick={() => toggleAccount(acc.email)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        acc.isEnabled 
                          ? 'border-amber-500/40 bg-amber-950/10 text-zinc-100' 
                          : 'border-zinc-805 bg-zinc-900/30 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-mono font-semibold">{acc.label}</span>
                        <span className="block text-[10px] opacity-75">{acc.email}</span>
                      </div>
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${acc.isEnabled ? 'border-amber-500 bg-amber-500 text-black' : 'border-zinc-800'}`}>
                        {acc.isEnabled && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desired Summarization Frequency */}
              <div className="p-4 bg-[#161616]/70 rounded-xl border border-zinc-805 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wide">2. Summary Dispatch Frequency</h4>
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Choose how often your summaries are prepared and notified.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'hourly', label: 'Hourly Intervals', desc: 'Frequent updates' },
                      { id: 'daily', label: 'Daily Briefing', desc: 'End of work recap' },
                      { id: 'weekly', label: 'Weekly Summary', desc: 'Qbr level details' },
                      { id: 'on-demand', label: 'On-Demand Only', desc: 'When you tap parsing' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleFrequencyChange(opt.id as any)}
                        type="button"
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          notificationSettings.frequency === opt.id
                            ? 'border-amber-500 bg-amber-950/20 text-amber-400 font-bold'
                            : 'border-zinc-805 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900/50'
                        }`}
                      >
                        <span className="block text-[11px] font-mono leading-none">{opt.label}</span>
                        <span className="block text-[9px] opacity-65 text-zinc-500 mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-950/10 border border-amber-900/30 text-amber-400 rounded-lg text-[10px] font-sans flex items-start space-x-2 mt-4 md:mt-0">
                  <BadgeInfo className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                  <p>
                    Automatic summaries run as custom background service pipelines in compliance with device battery-saver restrictions.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Sound Alerts Controller */}
            <div className="p-5 bg-[#161616]/40 rounded-xl border border-zinc-800/80 space-y-4">
              <div>
                <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wide flex items-center">
                  <Volume2 className="h-4 w-4 text-amber-500 mr-2" />
                  3. Customize Alert Sinusoidal & Chirp Sounds
                </h4>
                <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Generate and choose unique client-synthesized wave tones to easily identify alert types over headphones.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Urgent deadlines sounds */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-red-400 font-semibold uppercase">🚨 Urgent Deadlines</label>
                  <div className="flex items-center space-x-1">
                    <select
                      value={notificationSettings.urgentSoundId}
                      onChange={(e) => handleSoundChange('urgent', e.target.value)}
                      className="flex-1 text-xs border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-150 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {ALERT_SOUNDS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => playSynthesizedSound(notificationSettings.urgentSoundId)}
                      type="button"
                      className="p-2 border border-zinc-800 bg-[#1e1e1e] hover:border-zinc-700 hover:text-white rounded-lg transition-all"
                      title="Preview sound tone"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* New summaries sounds */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-amber-400 font-semibold uppercase">📬 New AI Summaries</label>
                  <div className="flex items-center space-x-1">
                    <select
                      value={notificationSettings.newSummarySoundId}
                      onChange={(e) => handleSoundChange('newSummary', e.target.value)}
                      className="flex-1 text-xs border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-150 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {ALERT_SOUNDS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => playSynthesizedSound(notificationSettings.newSummarySoundId)}
                      type="button"
                      className="p-2 border border-zinc-800 bg-[#1e1e1e] hover:border-zinc-700 hover:text-white rounded-lg transition-all"
                      title="Preview sound tone"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Normal agenda task reminder sounds */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-blue-400 font-semibold uppercase">📆 Normal Reminders</label>
                  <div className="flex items-center space-x-1">
                    <select
                      value={notificationSettings.reminderSoundId}
                      onChange={(e) => handleSoundChange('reminder', e.target.value)}
                      className="flex-1 text-xs border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-150 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {ALERT_SOUNDS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => playSynthesizedSound(notificationSettings.reminderSoundId)}
                      type="button"
                      className="p-2 border border-zinc-800 bg-[#1e1e1e] hover:border-zinc-700 hover:text-white rounded-lg transition-all"
                      title="Preview sound tone"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono text-left pt-1 leading-normal">
                <strong>Pitch Guide:</strong> {ALERT_SOUNDS.map(s => `${s.name} (${s.frequency}Hz)`).join(' • ')}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHANNELS BRIDGES, CRYPTOGRAPHY LOCKS AND SLACK */}
        {activeSubTab === 'channels' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Encryption cryptography locks */}
              <div className="bg-[#121212] rounded-2xl border border-zinc-800/80 p-6 shadow-2xl text-left flex flex-col justify-between min-h-[380px]">
                <div className="space-y-5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">On-Device Cryptography</h2>
                      <p className="text-xs text-zinc-405 font-mono">Zero-Trust AES-GCM data encryption keys vault</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    Ensure complete client privacy. Enter a customized security passphrase below to activate military-grade 256-bit AES-GCM cryptographic encryption for all archived summaries on your local browser database.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1.5 flex items-center">
                        <KeyRound className="h-3 w-3 mr-1.5 text-amber-500" />
                        Crypto Access Passphrase
                      </label>
                      <input
                        type="password"
                        placeholder={securitySettings.isEncrypted ? '•••••••••••••••••' : 'Enter master security code'}
                        value={passphraseInput}
                        onChange={(e) => setPassphraseInput(e.target.value)}
                        className="w-full text-xs font-mono border border-zinc-800 rounded-lg p-2.5 bg-[#1a1a1a] text-zinc-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      {securitySettings.isEncrypted ? (
                        <button
                          type="button"
                          onClick={() => handleSecurityToggle(false)}
                          className="py-2 px-4 border border-red-900/40 text-red-400 bg-red-950/20 hover:bg-red-900/30 rounded-xl text-xs font-semibold flex items-center transition-all font-mono"
                        >
                          <Unlock className="h-4 w-4 mr-1.5" />
                          Deactivate Cryptex Vault
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSecurityToggle(true)}
                          className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center transition-all font-mono tracking-wide"
                        >
                          <Lock className="h-4 w-4 mr-1.5" />
                          Lock & Encrypt Local State
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {securityStatusMsg && (
                  <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs font-mono font-medium text-zinc-300 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400 flex-shrink-0" />
                    {securityStatusMsg}
                  </div>
                )}
              </div>

              {/* Slack integrated publisher card */}
              <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-left flex flex-col justify-between">
                <form onSubmit={handleSlackSave} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-955/35 border border-amber-900/50 rounded-xl text-amber-400">
                        <Slack className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Slack Broadcast Sync</h2>
                        <p className="text-xs text-zinc-405 font-mono">Proxy-managed instant dispatch alerts</p>
                      </div>
                    </div>
                    
                    <label className="flex items-center space-x-2 text-xs font-semibold font-mono text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={slackEnabled}
                        onChange={(e) => setSlackEnabled(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-805 text-amber-500 focus:ring-amber-505/50"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-405 mb-1">Slack Channel</label>
                      <input
                        type="text"
                        placeholder="#general"
                        value={channelInput}
                        onChange={(e) => setChannelInput(e.target.value)}
                        className="w-full text-xs font-mono border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-405 mb-1">Webhook URL</label>
                      <input
                        type="text"
                        placeholder="https://hooks.slack.com/services/..."
                        value={webhookInput}
                        onChange={(e) => setWebhookInput(e.target.value)}
                        className="w-full text-xs font-mono border border-zinc-800 rounded-lg p-2 bg-[#1a1a1a] text-zinc-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-1 font-sans">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 border border-zinc-800 hover:bg-zinc-900 text-xs font-bold rounded-lg text-zinc-350 transition-colors"
                    >
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      onClick={onTestSlack}
                      disabled={isTestingSlack}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold flex items-center transition-all disabled:opacity-50 font-mono tracking-wide"
                    >
                      <Send className="h-3 w-3 mr-1.5 text-black" />
                      {isTestingSlack ? 'Dispatching...' : 'Send Test Notification'}
                    </button>
                  </div>
                </form>

                <div className="mt-5 space-y-2 font-sans">
                  <label className="text-sm font-mono font-semibold text-zinc-400 flex items-center">
                    <Terminal className="h-4 w-4 mr-1.5 text-amber-500" />
                    Dispatch Console Stream
                  </label>
                  <div className="bg-[#070707] rounded-xl p-4 font-mono text-[10px] text-amber-400 h-32 overflow-y-auto border border-zinc-900 space-y-1 text-left select-none scrollbar-thin scrollbar-thumb-zinc-850">
                    {slackLogs.length === 0 ? (
                      <p className="text-zinc-650">// Console idle. Dispatch test webhook message above or sync a task to trigger notification log.</p>
                    ) : (
                      slackLogs.map((log, index) => (
                        <div key={`${log.id}_${index}`} className="flex items-start space-x-1.5">
                          <span className="text-zinc-650">[{log.timestamp}]</span>
                          <span className={log.status === 'sent' ? 'text-emerald-400 font-bold font-mono' : 'text-red-400 font-bold font-mono'}>
                            {log.status === 'sent' ? '✔ [SUCCESS]' : '✘ [FAILED]'}
                          </span>
                          <span className="text-zinc-200">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HUMAN IN THE LOOP ALIGNMENT AND OFFLINE MODEL RETRAINING */}
        {activeSubTab === 'feedback_alignment' && (
          <div className="bg-[#121212] rounded-2xl border border-[#212121] p-6 shadow-2xl text-left space-y-6 animate-fadeIn">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="flex items-start space-x-3 text-left">
                <div className="p-2.5 bg-amber-955/35 border border-[#3e2e1a] rounded-xl text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-serif italic text-amber-50/90 tracking-wide font-medium">Model Alignment and LLM Fine-Tuning</h2>
                  <p className="text-xs text-zinc-405 font-mono">Reinforcement Learning via human rating feedback loops</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-zinc-900 px-4 py-2 border border-zinc-800 rounded-xl font-mono text-xs">
                <div>
                  <span className="block text-zinc-500 text-[10px] uppercase font-bold">Accuracy Index</span>
                  <span className="text-white font-bold text-sm tracking-wide">{averageRating} ⭐</span>
                </div>
                <div className="w-[1px] h-8 bg-zinc-850"></div>
                <div>
                  <span className="block text-zinc-500 text-[10px] uppercase font-bold">Helpfulness</span>
                  <span className="text-emerald-400 font-bold text-sm">{helpfulPercentage}%</span>
                </div>
                <div className="w-[1px] h-8 bg-zinc-850"></div>
                <div>
                  <span className="block text-zinc-500 text-[10px] uppercase font-bold">Logged Items</span>
                  <span className="text-white font-bold text-sm">{totalRatings}</span>
                </div>
              </div>
            </div>

            {/* RETRAINING COGNITIVE PIPELINE OUTLINE */}
            <div className="p-5 bg-gradient-to-r from-amber-955/5 to-transparent rounded-xl border border-zinc-800/80 space-y-4">
              <div>
                <h3 className="text-xs font-bold font-mono tracking-wider text-amber-400 uppercase">Process Description: Periodical Reinforcement Optimization</h3>
                <p className="text-[11px] text-zinc-405 font-sans mt-1">
                  How does Vjathin's on-device feedback loop align and retrain the underlying models?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 font-sans text-xs">
                <div className="p-3 bg-[#151515] border border-zinc-805 rounded-lg space-y-1">
                  <span className="font-bold text-amber-500 font-mono text-[10px] block">STEP 1: CAPTURE LOGS</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Ratings, helpfulness toggles, and correction comments are cryptographically locked on-device.
                  </p>
                </div>
                
                <div className="p-3 bg-[#151515] border border-zinc-850 rounded-lg space-y-1">
                  <span className="font-bold text-amber-500 font-mono text-[10px] block">STEP 2: PREFERENCE PAIRING</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Low helpfulness alerts trigger a comparison pair against user edits, generating an offline preference pipeline.
                  </p>
                </div>

                <div className="p-3 bg-[#151515] border border-zinc-850 rounded-lg space-y-1">
                  <span className="font-bold text-amber-500 font-mono text-[10px] block">STEP 3: SFT FINE-TUNING</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Parameter-efficient adapters (LoRA weights) are fine-tuned on the corrections using Direct Preference Optimization (DPO).
                  </p>
                </div>

                <div className="p-3 bg-[#151515] border border-zinc-850 rounded-lg space-y-1">
                  <span className="font-bold text-amber-500 font-mono text-[10px] block">STEP 4: WEIGHT ACTIVATION</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Custom-aligned weights are checked for safety filters and re-deployed, maximizing recall rates.
                  </p>
                </div>
              </div>
            </div>

            {/* DYNAMIC OFFLINE TERMINAL ACTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: RETRAINING SIMULATOR ACTION */}
              <div className="p-5 bg-[#161616]/70 rounded-xl border border-zinc-805 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-200 uppercase flex items-center">
                      <Activity className="h-4 w-4 text-amber-500 mr-2" />
                      Adapter Alignment Console
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                      Verify local datasets and trigger fine-tuning updates directly into the localized summarizer models.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Retrainable Dataset Count</span>
                      <span className="font-mono text-white text-[11px]">{totalRatings} samples</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Current Base Model</span>
                      <span className="font-mono text-amber-400 font-semibold text-[11px]">gemini-3.5-flash-custom</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Target Adaptation Method</span>
                      <span className="font-mono text-white text-[11px]">LoRA (Rank=8, Alpha=16)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {isRetraining && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-405">
                        <span>Aligning Weights Policy...</span>
                        <span>{retrainingProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${retrainingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleTriggerRetraining}
                    disabled={isRetraining || totalRatings === 0}
                    type="button"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:hover:bg-amber-500 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center transition-all shadow-md shadow-amber-500/10"
                  >
                    <Sliders className={`h-4 w-4 mr-2 ${isRetraining ? 'animate-spin' : ''}`} />
                    {isRetraining ? 'Retraining adapters...' : totalRatings === 0 ? 'Collect ratings to retrain' : 'Execute model alignment optimization'}
                  </button>
                </div>
              </div>

              {/* Right Column: SIMULATED RETRAINING TERMINAL LINES LOGS */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-mono font-semibold text-zinc-400 flex items-center">
                  <Terminal className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  Alignment Optimizer Output Stream
                </label>
                <div className="bg-[#070707] rounded-xl p-4 font-mono text-[10px] text-amber-400 h-48 overflow-y-auto border border-zinc-900 space-y-1.5 text-left select-none flex-1 scrollbar-thin scrollbar-thumb-zinc-850">
                  {retrainingLogs.length === 0 ? (
                    <p className="text-zinc-650">
                      // Analyzer Offline. Click "Execute model alignment" to start simulated supervised adjustments.
                    </p>
                  ) : (
                    retrainingLogs.map((line, i) => (
                      <div key={i} className="text-zinc-150 flex items-start space-x-1">
                        <span className="text-zinc-650">[{new Date().toLocaleTimeString()}]</span>
                        <span className="text-emerald-400 font-mono font-bold">&gt;</span>
                        <span className="leading-normal font-mono">{line}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* FEEDBACK LIST LOG */}
            <div className="space-y-3.5 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-200 uppercase">Interactive Logs: Human Preference Aggregations</h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-850">
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8 bg-[#141414] border border-dashed border-zinc-805 rounded-xl">
                    <p className="text-xs text-zinc-500">No preference logs collected yet. Rate summaries in your mailing feed to generate charts.</p>
                  </div>
                ) : (
                  feedbacks.map((f, index) => (
                    <div key={`${f.id}_${index}`} className="p-3.5 border border-zinc-805 rounded-xl bg-zinc-900/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs leading-relaxed transition-all hover:bg-zinc-950/20">
                      <div className="space-y-1 flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-200 font-mono capitalize">[{f.sourceType.replace('_', ' ')}]</span>
                          <span className="text-[10px] text-zinc-550 font-mono truncate max-w-[200px]">({f.sourceTitle})</span>
                        </div>
                        <p className="text-zinc-350 italic font-sans">"{f.comment || 'No comment entered.'}"</p>
                      </div>

                      <div className="flex items-center space-x-4 bg-[#141414] px-3 py-1.5 border border-zinc-850 rounded-lg justify-between flex-shrink-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-zinc-405 font-mono text-[10px] uppercase">Rating</span>
                          <span className="font-bold text-amber-400">{f.rating} ⭐</span>
                        </div>
                        <div className="w-[1px] h-4 bg-zinc-800"></div>
                        <div className="flex items-center space-x-1">
                          <span className="text-zinc-405 font-mono text-[10px] uppercase">Correct</span>
                          <span className={f.isHelpful ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {f.isHelpful ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
