/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Youtube, ExternalLink, ChevronDown, ChevronUp, Play } from 'lucide-react';

interface YouTubeSectionProps {
  url?: string;
  videoId?: string;
}

export const YouTubeSection: React.FC<YouTubeSectionProps> = ({
  url = 'https://www.youtube.com/watch?v=1e_N5DHua64',
  videoId = '1e_N5DHua64',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section
      id="youtube-media-section"
      className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>추천 영상</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                YouTube
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              팀 일정 및 협업 중 함께 시청할 수 있는 영상입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            id="youtube-external-link-btn"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="새 탭에서 YouTube 열기"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">유튜브에서 보기</span>
          </a>
          <button
            id="youtube-toggle-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Player */}
      {isExpanded && (
        <div className="p-3 sm:p-5 bg-slate-950">
          <div className="relative w-full aspect-video max-w-4xl mx-auto rounded-xl overflow-hidden shadow-md bg-black">
            <iframe
              className="absolute top-0 left-0 w-full h-full border-0"
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
};
