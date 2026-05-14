import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EncryptionPlayground from '@/components/learn/interactive/EncryptionPlayground';
import { ChevronLeft } from 'lucide-react';

export default function EncryptionPlaygroundPage() {
  return (
    <div className="min-h-screen bg-[#011623] flex flex-col">
      {/* Header Nav */}
      <div className="border-b border-white/10 bg-[#00101a]/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center">
            <Link to={createPageUrl('Home')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
         <EncryptionPlayground />
      </div>
    </div>
  );
}