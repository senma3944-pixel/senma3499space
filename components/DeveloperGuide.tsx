
import React from 'react';

const SectionHeader: React.FC<{ children: React.ReactNode; icon: string }> = ({ children, icon }) => (
  <h3 className="text-lg font-bold mb-3 mt-8 flex items-center gap-2 text-[#1C1C1E]">
    <span className="text-xl">{icon}</span>
    {children}
  </h3>
);

const DeveloperGuide: React.FC = () => {
  return (
    <div className="space-y-4 pb-20 animate-fadeIn px-4">
      <div className="text-center py-6 px-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white shadow-xl mb-8">
        <h2 className="text-2xl font-extrabold mb-1">环境同步指南</h2>
        <p className="text-xs opacity-90">解决 404 错误与手机访问问题</p>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">
        <SectionHeader icon="🔍">找不到“新窗口打开”按钮？</SectionHeader>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          AI Studio 的界面会根据版本和窗口大小变化。如果刷新图标右侧没有按钮，请尝试以下位置：
        </p>
        
        <div className="space-y-6">
          {/* 方案 A */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">位置 A：预览窗格顶部</p>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
              <div className="text-[10px] text-slate-400">Preview</div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px]">🔄</div>
                <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center text-[8px] text-white">↗️</div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">点击这个 <span className="text-indigo-600 font-bold">斜向上箭头</span> 或方框图标。</p>
          </div>

          {/* 方案 B */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">位置 B：左侧/顶部 菜单栏</p>
            <div className="flex gap-2 items-center">
              <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[10px] text-slate-600">Share</div>
              <div className="px-2 py-1 bg-indigo-600 rounded text-[10px] text-white font-bold">Run in New Tab</div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">检查整个编辑器页面的右上角，寻找 <span className="text-indigo-600 font-bold">"Share"</span> 或 <span className="text-indigo-600 font-bold">"Open App"</span> 按钮。</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-xs text-amber-700 font-bold mb-1">⚠️ 为什么必须这样做？</p>
          <p className="text-[11px] text-amber-600 leading-relaxed">
            目前的“扫码 404”是因为 App 运行在 Google 的沙箱内（地址是 about:srcdoc）。只有在独立窗口打开后，App 才会获得一个以 <span className="font-mono">https://...</span> 开头的真实网址，扫码才能成功。
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperGuide;
