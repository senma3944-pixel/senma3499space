
import React, { useState, useRef, useEffect } from 'react';
import { AppTab, ClothItem, GeneratedResult, BackgroundOption } from './types';
import { CLOTHING_PRESETS, BACKGROUND_PRESETS } from './constants';
import { generateVirtualTryOn } from './services/geminiService';
import DeveloperGuide from './components/DeveloperGuide';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TRY_ON);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [selectedCloth, setSelectedCloth] = useState<ClothItem | null>(null);
  const [selectedBg, setSelectedBg] = useState<BackgroundOption>(BACKGROUND_PRESETS[0]);
  const [customCloths, setCustomCloths] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'model' | 'outfit' | 'scene'>('model');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [currentUrl, setCurrentUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isPWA) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
        setError(null);
      }
    } catch (err) {
      setError("相机开启失败，请确认浏览器权限设置。");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setPersonImage(canvas.toDataURL('image/jpeg', 0.85));
      stopCamera();
    }
  };

  const handleAddCustomCloth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedCloth(null);
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCustomCloths(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const startTryOn = async () => {
    if (!personImage) { setError("请先准备模特照片"); return; }
    if (!selectedCloth && customCloths.length === 0) { setError("请上传或挑选单品衣服"); return; }

    setIsGenerating(true);
    setError(null);
    try {
      let clothingImages: string[] = [];
      if (customCloths.length > 0) {
        clothingImages = customCloths;
      } else if (selectedCloth) {
        const res = await fetch(selectedCloth.imageUrl);
        // Fix: Explicitly cast res.blob() to Blob to resolve 'unknown' type error in TypeScript at line 84
        const imageBlob = (await res.blob()) as Blob;
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageBlob);
        });
        clothingImages = [base64];
      }
      
      const resultUrl = await generateVirtualTryOn(
        personImage, 
        clothingImages, 
        selectedCloth?.name || "设计师定制组合",
        selectedBg.prompt
      );
      
      setResults([{
        id: Date.now().toString(),
        imageUrl: resultUrl,
        timestamp: Date.now(),
        prompt: selectedCloth?.name || "灵感组合",
        scene: selectedBg.name
      }]);
    } catch (err: any) {
      setError("AI 渲染引擎繁忙，请稍后再试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 深度检测环境：检测 about:srcdoc 或 极短的内部地址
  const isSandbox = currentUrl.includes('srcdoc') || currentUrl.includes('localhost') || currentUrl.length < 30;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="min-h-screen flex flex-col pt-safe pb-safe bg-[#F8F9FB]">
      {/* 扫码同步弹窗 */}
      {showQRCode && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-xs p-8 rounded-[40px] text-center shadow-2xl animate-premium border-white/50">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">手机端同步</h3>
            
            {isSandbox ? (
              <div className="my-4 p-5 bg-indigo-50 rounded-[32px] border border-indigo-100 text-left">
                <p className="text-[10px] text-indigo-600 font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                  当前处于预览沙箱
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  检测到您直接在编辑器内运行。请尝试点击顶部栏的 <strong>"Share"</strong> 或寻找 <strong>"斜向上箭头"</strong> 图标。
                </p>
                <button 
                  onClick={() => setActiveTab(AppTab.DEV_GUIDE)} 
                  className="mt-3 text-[10px] text-indigo-600 font-bold underline"
                >
                  查看图文寻找指南
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mb-6 px-4">在手机上扫码，即可同步开启您的 AI 试衣间。</p>
            )}
            
            <div className={`bg-white p-5 rounded-[32px] inline-block shadow-inner mb-6 border border-slate-100 ${isSandbox ? 'opacity-20 grayscale' : ''}`}>
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={copyLink}
                className={`w-full py-4 rounded-2xl font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  copied ? 'bg-green-500 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}
              >
                {copied ? '✅ 已复制' : '🔗 复制链接'}
              </button>
              <button 
                onClick={() => setShowQRCode(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-widest uppercase active:scale-95 transition-all"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS 安装引导 */}
      {showInstallPrompt && (
        <div className="fixed top-24 left-6 right-6 z-[200] animate-premium">
          <div className="glass-panel p-4 rounded-3xl border-indigo-200 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="https://cdn-icons-png.flaticon.com/512/3534/3534312.png" className="w-10 h-10 rounded-xl" alt="icon" />
              <div>
                <p className="text-xs font-bold text-slate-800">安装 StyleStudio</p>
                <p className="text-[9px] text-slate-500">点击 <span className="text-blue-500 font-bold">分享</span> 选择 <span className="text-slate-800 font-bold">“添加到主屏幕”</span></p>
              </div>
            </div>
            <button onClick={() => setShowInstallPrompt(false)} className="text-slate-300 p-2 text-xl">✕</button>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="px-6 py-6 flex items-center justify-between z-50">
        <div onClick={() => setActiveTab(AppTab.TRY_ON)} className="cursor-pointer">
          <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900">StyleStudio</h1>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Genius Fashion AI</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowQRCode(true)}
            className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-all relative"
            title="手机扫码同步"
          >
            <span className="text-xl">📱</span>
            {isSandbox && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
          <div className="w-11 h-11 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white">
            <span className="text-sm">✨</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col max-w-lg mx-auto w-full px-4 overflow-hidden relative">
        {activeTab === AppTab.TRY_ON ? (
          <div className="flex-grow flex flex-col">
            {/* 核心画布区域 */}
            <div className="relative flex-shrink-0 aspect-[3.5/4.8] bg-slate-200 rounded-[44px] canvas-shadow overflow-hidden group">
              {isGenerating && <div className="scanning-line"></div>}
              
              {isGenerating ? (
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center animate-premium px-12 text-center">
                  <div className="w-24 h-24 relative mb-8">
                    <div className="absolute inset-0 rounded-full border-[4px] border-indigo-50"></div>
                    <div className="absolute inset-0 rounded-full border-[4px] border-indigo-600 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">🧥</div>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">多模态特征提取中</h3>
                  <p className="text-xs text-slate-400 leading-relaxed italic">“正在完美融合织物纹理与人像光影...”</p>
                </div>
              ) : results.length > 0 ? (
                <div className="w-full h-full relative group">
                  <img src={results[0].imageUrl} alt="Result" className="w-full h-full object-cover animate-fadeIn" />
                  <div className="absolute top-6 right-6 flex flex-col gap-4 scale-90 group-hover:scale-100 transition-transform">
                    <button 
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = results[0].imageUrl;
                            link.download = `Style-Result-${Date.now()}.png`;
                            link.click();
                        }} 
                        className="w-14 h-14 glass-panel rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all border-white"
                    >
                        <span className="text-2xl">💾</span>
                    </button>
                    <button 
                        onClick={() => setResults([])} 
                        className="w-14 h-14 glass-panel rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all border-white"
                    >
                        <span className="text-xl">🔄</span>
                    </button>
                  </div>
                </div>
              ) : personImage ? (
                <div className="w-full h-full relative">
                  <img src={personImage} className="w-full h-full object-cover animate-fadeIn" alt="Model" />
                  <button onClick={() => setPersonImage(null)} className="absolute top-6 left-6 w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-500">✕</button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white text-slate-300">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <span className="text-4xl opacity-20">👤</span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">请拍摄或上传模特照片</p>
                </div>
              )}

              {isCameraOpen && (
                <div className="absolute inset-0 z-30 bg-black animate-premium">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-8">
                    <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-[6px] border-indigo-600/30 ring-4 ring-white active:scale-90 transition-transform shadow-2xl"></button>
                    <button onClick={stopCamera} className="glass-panel text-white text-[10px] font-bold px-10 py-3 rounded-full border border-white/20 tracking-widest uppercase">放弃拍摄</button>
                  </div>
                </div>
              )}
            </div>

            {/* 控制面板 */}
            <div className="glass-panel mx-2 -mt-16 rounded-[40px] shadow-2xl z-40 p-6 mb-28 animate-premium border-white/60">
              <div className="flex bg-slate-200/40 p-1.5 rounded-2xl mb-6">
                {(['model', 'outfit', 'scene'] as const).map(m => (
                  <button 
                    key={m} 
                    onClick={() => setSelectionMode(m)} 
                    className={`flex-1 py-3 text-[11px] font-bold rounded-xl transition-all duration-300 ${
                        selectionMode === m ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {m === 'model' ? '人像模特' : m === 'outfit' ? '衣服选款' : '背景场景'}
                  </button>
                ))}
              </div>

              <div className="h-32 overflow-hidden">
                {selectionMode === 'model' && (
                  <div className="grid grid-cols-2 gap-4 animate-fadeIn h-full">
                    <button onClick={startCamera} className="h-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
                      <span className="text-2xl">📸</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">即刻拍摄</span>
                    </button>
                    <button onClick={() => document.getElementById('p-up')?.click()} className="h-full bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center gap-2 border border-indigo-100 active:scale-95 transition-all">
                      <span className="text-2xl">🖼️</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">从相册选</span>
                    </button>
                    <input id="p-up" type="file" className="hidden" accept="image/*" onChange={(e)=>{
                      const f = e.target.files?.[0];
                      if(f){ const r=new FileReader(); r.onload=()=>setPersonImage(r.result as string); r.readAsDataURL(f); }
                    }} />
                  </div>
                )}

                {selectionMode === 'outfit' && (
                  <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 animate-fadeIn h-full">
                    <div 
                      onClick={() => document.getElementById('c-up')?.click()}
                      className="flex-shrink-0 w-24 h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center transition-all hover:bg-slate-100"
                    >
                      <span className="text-xl text-slate-300">➕</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">本地单品</span>
                      <input id="c-up" type="file" multiple className="hidden" accept="image/*" onChange={handleAddCustomCloth} />
                    </div>
                    {customCloths.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 w-24 h-full rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md relative">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={(e)=>{e.stopPropagation(); setCustomCloths(p=>p.filter((_,i)=>i!==idx));}} className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full text-[10px] flex items-center justify-center">✕</button>
                      </div>
                    ))}
                    {CLOTHING_PRESETS.map(c => (
                      <div 
                        key={c.id} 
                        onClick={()=>{setSelectedCloth(c); setCustomCloths([]);}}
                        className={`flex-shrink-0 w-24 h-full rounded-2xl overflow-hidden border-2 transition-all ${selectedCloth?.id === c.id ? 'border-indigo-600 scale-95 shadow-lg' : 'border-transparent'}`}
                      >
                        <img src={c.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {selectionMode === 'scene' && (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 animate-fadeIn h-full">
                    {BACKGROUND_PRESETS.map(b => (
                      <button 
                        key={b.id} 
                        onClick={() => setSelectedBg(b)}
                        className={`flex-shrink-0 px-6 h-full rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                            selectedBg.id === b.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-95' : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}
                      >
                        <span className="text-2xl">{b.thumbnail}</span>
                        <span className="text-[10px] font-bold">{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={startTryOn}
                disabled={isGenerating || !personImage || (!selectedCloth && customCloths.length === 0)}
                className={`mt-8 w-full py-5 rounded-2xl font-bold text-sm tracking-widest uppercase btn-flow shadow-xl active:scale-95 transition-all text-white ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : 'shadow-indigo-200'
                }`}
              >
                {isGenerating ? 'AI 正在渲染极致画质...' : '✨ 开始虚拟试穿'}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-premium overflow-y-auto no-scrollbar h-full pb-32">
            <DeveloperGuide />
          </div>
        )}
      </main>

      {/* 底部 Tab 导航 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex gap-2 z-50 border-white/50">
        <button 
            onClick={() => setActiveTab(AppTab.TRY_ON)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                activeTab === AppTab.TRY_ON ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'
            }`}
        >
            <span className="text-xl">👔</span>
            {activeTab === AppTab.TRY_ON && <span className="text-xs font-bold">设计室</span>}
        </button>
        <button 
            onClick={() => setActiveTab(AppTab.DEV_GUIDE)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                activeTab === AppTab.DEV_GUIDE ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'
            }`}
        >
            <span className="text-xl">📖</span>
            {activeTab === AppTab.DEV_GUIDE && <span className="text-xs font-bold">指南</span>}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      {error && (
        <div className="fixed top-28 inset-x-8 glass-panel border-red-100 py-4 px-6 rounded-3xl text-red-600 text-xs font-bold text-center animate-premium z-[100] shadow-2xl">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default App;
