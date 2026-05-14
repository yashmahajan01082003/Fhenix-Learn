import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EncryptedBranchingSimulator from '@/components/learn/interactive/EncryptedBranchingSimulator';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function BranchingSimulatorPage() {
  return (
    <div className="min-h-screen bg-[#011623] flex flex-col">
      
      {/* Header Nav */}
      <div className="border-b border-white/10 bg-[#00101a]/50 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center">
            <Link to={createPageUrl('Home')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12">
         <EncryptedBranchingSimulator />
      </div>

    </div>
  );
}