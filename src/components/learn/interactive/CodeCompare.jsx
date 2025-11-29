import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Switch } from '@/components/ui/switch';

export default function CodeCompare() {
  const [isEncrypted, setIsEncrypted] = useState(false);

  const plainCode = `// Plaintext Counter
contract Counter {
    uint256 public count;

    function add(uint256 value) public {
        count = count + value;
    }
}`;

  const fheCode = `// Encrypted Counter
import "@fhenixprotocol/contracts/FHE.sol";

contract EncryptedCounter {
    euint32 private count;

    function add(inEuint32 memory encryptedValue) public {
        euint32 value = FHE.asEuint32(encryptedValue);
        count = FHE.add(count, value);
    }
}`;

  return (
    <div className="my-10 rounded-2xl border border-white/10 overflow-hidden bg-[#00101a]">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
            <div className="font-bold text-white">Contract Comparison</div>
            <div className={`text-xs px-2 py-0.5 rounded border ${isEncrypted ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                {isEncrypted ? 'FHE Enabled' : 'Standard Solidity'}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-sm ${!isEncrypted ? 'text-white font-bold' : 'text-slate-500'}`}>Plain</span>
            <Switch 
                checked={isEncrypted}
                onCheckedChange={setIsEncrypted}
                className="data-[state=checked]:bg-[#0AD9DC]"
            />
            <span className={`text-sm ${isEncrypted ? 'text-[#0AD9DC] font-bold' : 'text-slate-500'}`}>Encrypted</span>
        </div>
      </div>
      
      <div className="relative group">
          <SyntaxHighlighter
            language="solidity"
            style={atomDark}
            customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: '#011623',
                fontSize: '0.9rem',
                lineHeight: '1.5'
            }}
            wrapLines={true}
          >
            {isEncrypted ? fheCode : plainCode}
          </SyntaxHighlighter>
          
          {/* Highlight changed lines indicator */}
          {isEncrypted && (
             <div className="absolute top-[4.5rem] left-0 w-1 h-16 bg-[#0AD9DC] shadow-[0_0_10px_#0AD9DC]" />
          )}
      </div>
      
      <div className="p-4 bg-white/5 text-xs text-slate-400 flex gap-4 border-t border-white/10">
          <div>
              <span className="font-bold text-white">Plaintext:</span> State is visible, inputs are public integers.
          </div>
          <div>
              <span className="font-bold text-[#0AD9DC]">FHE:</span> State is `euint`, inputs are `inEuint`, math uses `FHE.add`.
          </div>
      </div>
    </div>
  );
}