import { useUser } from '@/components/providers/UserProvider';
import { usePrivy } from '@privy-io/react-auth';

interface Transaction {
    id: string;
    user_id: string;
    amount_usd: number;
    provider: string;
    created_at: string;
    meta: any;
}

export default function EconomyAdmin() {
    const { authenticated } = usePrivy();
    const { profile } = useProfile();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [manualPrice, setManualPrice] = useState('79.22');
    const [isLocked, setIsLocked] = useState(true);

    const [grantId, setGrantId] = useState('');
    const [grantAmount, setGrantAmount] = useState('');
    const [grantReason, setGrantReason] = useState('Manual Reconciliation');

    useEffect(() => {
        if (authenticated && profile?.is_admin) {
            fetchTransactions();
        }
    }, [authenticated, profile]);

    const handlePriceLock = async () => {
        try {
            await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'SOL_PRICE_OVERRIDE', value: manualPrice, active: isLocked })
            });
            alert('MARKET SNAPSHOT LOCKED: ' + manualPrice);
        } catch (e) {
            alert('Lock Failed');
        }
    };

    const handleManualGrant = async () => {
        try {
            const res = await fetch('/api/admin/grant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetUserId: grantId, 
                    amountUsd: grantAmount, 
                    reason: grantReason 
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`SUCCESS: Granted ${data.credits} credits to ${grantId}`);
                fetchTransactions();
            } else {
                alert(`GRANT FAILED: ${data.error}`);
            }
        } catch (e) { alert('Grant Error'); }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/admin/transactions');
            const data = await res.json();
            if (data.success) setTransactions(data.transactions);
        } catch (e) { console.error('Fetch Failed'); }
        finally { setLoading(false); }
    };

    if (!profile?.is_admin) return <div className="p-20 text-center text-zinc-500 uppercase tracking-widest">Access Restricted // Admin Only</div>;

    return (
        <div className="min-h-screen bg-black p-8 font-mono text-zinc-300">
            <div className="mx-auto max-w-6xl space-y-12">
                <div className="flex justify-between items-end border-b border-zinc-900 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                            Revenue Controller
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-[#ff3333] font-bold">
                            Central Strategic Allocation // Institutional Terminal
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* 🛡️ MANUAL INFUSION TERMINAL */}
                    <div className="space-y-6 border border-zinc-800 p-8 bg-[#0a0a0a]">
                        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase italic">
                            Manual Credit Grant
                        </h2>
                        <div className="space-y-4">
                            <input 
                                className="w-full bg-black border border-zinc-800 p-4 text-xs focus:border-[#ff3333] outline-none"
                                placeholder="Target User ID"
                                value={grantId}
                                onChange={(e) => setGrantId(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <input 
                                    className="w-1/2 bg-black border border-zinc-800 p-4 text-xs focus:border-[#ff3333] outline-none"
                                    placeholder="Amount ($US)"
                                    value={grantAmount}
                                    onChange={(e) => setGrantAmount(e.target.value)}
                                />
                                <button 
                                    onClick={handleManualGrant}
                                    className="w-1/2 bg-[#ff3333] text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                >
                                    Grant Credits
                                </button>
                            </div>
                            <input 
                                className="w-full bg-black border border-zinc-800 p-4 text-xs focus:border-[#ff3333] outline-none"
                                placeholder="Reason (Audit Log)"
                                value={grantReason}
                                onChange={(e) => setGrantReason(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 🛡️ MARKET SNAPSHOT CONTROL */}
                    <div className="space-y-6 border border-zinc-800 p-8 bg-[#0a0a0a]">
                        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase italic">
                            Market Snapshot Controller
                        </h2>
                        <div className="flex gap-4">
                            <input 
                                className="flex-1 bg-black border border-zinc-800 p-4 text-xs focus:border-[#ff3333] outline-none"
                                value={manualPrice}
                                onChange={(e) => setManualPrice(e.target.value)}
                            />
                            <button 
                                onClick={handlePriceLock}
                                className="bg-white text-black font-black px-8 uppercase tracking-widest hover:bg-[#ff3333] hover:text-white transition-all"
                            >
                                Lock Market
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Warning: Bypasses live market oracles globally.</p>
                    </div>
                </div>

                {/* 🗄️ TRANSACTION ARCHIVE */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase italic">
                            Sovereign Settlement Ledger
                        </h2>
                        <input 
                            className="bg-zinc-900 border-none p-4 text-[10px] w-64 focus:ring-1 ring-zinc-700 outline-none uppercase font-bold tracking-widest"
                            placeholder="FILTER BY USER / REFERENCE / TX"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto border border-zinc-900 bg-[#050505]">
                        <table className="w-full text-left text-[10px] font-mono">
                            <thead className="bg-[#0a0a0a] text-zinc-500 uppercase tracking-widest border-b border-zinc-900 border-t border-zinc-900">
                                <tr>
                                    <th className="p-6">Timestamp</th>
                                    <th className="p-6">User Identity</th>
                                    <th className="p-6">Asset Type</th>
                                    <th className="p-6">Amount ($)</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6">Signature Hash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {transactions.filter(t => 
                                    t.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    t.meta?.txId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    t.meta?.reference?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((t) => (
                                    <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="p-6 text-zinc-600 font-bold">{new Date(t.created_at).toLocaleString()}</td>
                                        <td className="p-6 text-white font-bold">{t.user_id?.slice(0, 16)}...</td>
                                        <td className="p-6 uppercase text-[#ff3333] font-black tracking-widest">{t.provider}</td>
                                        <td className="p-6 font-black text-white italic text-sm">${t.amount_usd}</td>
                                        <td className="p-6">
                                            <span className="bg-[#111] px-3 py-1 text-[8px] border border-zinc-800 text-[#ff3333] font-black tracking-widest">SETTLED</span>
                                        </td>
                                        <td className="p-6 text-zinc-600 font-bold">
                                            {t.meta?.txId?.slice(0, 24)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
