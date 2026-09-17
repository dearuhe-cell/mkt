import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { Team } from '../types';
import { getShareableUrl } from '../services/api';

interface ShareTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
}

export const ShareTeamModal: React.FC<ShareTeamModalProps> = ({
  isOpen,
  onClose,
  team,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen || !team) return null;

  const shareUrl = getShareableUrl(team.code);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Quick QR code image URL from standard reliable QR generator API
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">팀 일정 초대 및 공유</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Team Name Callout */}
          <div className="text-center py-2">
            <span className="text-xs text-slate-500 block">공유 대상 팀</span>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">{team.name}</h4>
          </div>

          {/* Code Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-600">팀 참여 코드</span>
              <span className="text-[10px] text-slate-400">대소문자 무관</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white border border-slate-200 rounded-lg py-2 px-3 text-center font-mono font-bold text-base tracking-widest text-indigo-700 select-all">
                {team.code}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '복사됨' : '코드 복사'}</span>
              </button>
            </div>
          </div>

          {/* Direct Link Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-xs font-semibold text-slate-600 block mb-1.5">
              원클릭 접속 링크
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 truncate select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '복사 완료!' : '링크 복사'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Toggle */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="w-full px-4 py-2.5 bg-white hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-500" />
                <span>모바일용 QR 코드 열기</span>
              </div>
              <span className="text-[11px] text-indigo-600">{showQr ? '접기' : '보기'}</span>
            </button>

            {showQr && (
              <div className="p-4 bg-slate-50 text-center border-t border-slate-200 flex flex-col items-center">
                <img
                  src={qrApiUrl}
                  alt="QR Code"
                  className="w-44 h-44 rounded-lg bg-white p-2 border border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  스마트폰 기본 카메라로 스캔하면 바로 연결됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Helpful Tips Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 space-y-1">
            <div className="font-bold flex items-center gap-1 text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>로그인 없이 바로 참여하는 팁</span>
            </div>
            <p className="text-[11px] text-indigo-800/90 leading-relaxed">
              팀원에게 링크를 전송하면 아이디 생성이나 인증 과정 없이 브라우저에서 바로 일정을 열람하고 새 일정을 추가할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
