'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import AvatarUpload from '@/components/core/AvatarUpload';
import ConfirmModal from '@/components/core/ConfirmModal';
import ErrorModal from '@/components/core/ErrorModal';
import { formatTimeRemaining } from '@/lib/rate-limit';

interface SubscriptionInfo {
    plan: 'free' | 'pro' | 'proplus';
    status?: string;
    period?: string;
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
}

interface UserLimitResponse {
    llamaGuides: number;
    geminiGuides: number;
    deepseekGuides: number;
    gpt41Guides: number;
    gpt41miniGuides: number;
    o3miniGuides: number;
    osslargeGuides: number;
    nanobananaGuides: number;
    lastExport: number;
    plan: 'free' | 'pro' | 'proplus';
    limits: {
        llamaMax: number; geminiMax: number; deepseekMax: number; gpt41Max: number; gpt41miniMax: number; o3miniMax: number; osslargeMax: number; nanobananaMax: number; exportCooldown: number;
    };
    remaining: { llama: number; gemini: number; deepseek: number; gpt41: number; gpt41mini: number; o3mini: number; osslarge: number; nanobanana: number };
}

export default function ProfilePage() {
    const { data: session, status } = useSession();

    // Basic profile states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [provider] = useState('Email');

    // Subscription & Limits
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [userLimits, setUserLimits] = useState<UserLimitResponse | null>(null);
    const [isGuideUsageOpen, setIsGuideUsageOpen] = useState(true);

    // Password update
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Export
    const [isExporting, setIsExporting] = useState(false);

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Error modal
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'warning' | 'success' }>(
        { isOpen: false, title: '', message: '', type: 'error' }
    );

    // Derived export cooldown remaining
    const exportRemainingMs = (() => {
        if (!userLimits) return 0;
        const elapsed = Date.now() - userLimits.lastExport;
        return Math.max(0, userLimits.limits.exportCooldown - elapsed);
    })();
    const canExport = exportRemainingMs === 0;

    // Fetch subscription & limits
    useEffect(() => {
        if (!session?.user) return;
        setName(session.user.name || 'User');
        setEmail(session.user.email || '');
        setAvatar(session.user.image || null);

        (async () => {
            try {
                const subRes = await fetch('/api/user/subscription');
                if (subRes.ok) {
                    const data = await subRes.json();
                    setSubscription(data.subscription || { plan: 'free' });
                }
            } catch (e) {
                console.error('Failed to fetch subscription', e);
            }
            try {
                const limRes = await fetch('/api/user/limits');
                if (limRes.ok) {
                    const data = await limRes.json();
                        setUserLimits(data);
                }
            } catch (e) {
                console.error('Failed to fetch limits', e);
            }
        })();
    }, [session]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update password');
            setPasswordSuccess('Password updated successfully');
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpdate = (url: string | null) => {
        setAvatar(url);
        // simple reload to refresh session image (assuming callback updates DB)
        window.location.reload();
    };

    const handleDeleteAccount = () => setShowDeleteModal(true);

    const confirmDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete account');
            await signOut({ callbackUrl: '/' });
            } catch (_err) {
                setErrorModal({
                    isOpen: true,
                    title: 'Delete Account Failed',
                    message: 'Failed to delete account. Please try again.',
                    type: 'error'
                });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleExportGuides = async () => {
        if (!canExport) return;
        setIsExporting(true);
        try {
            const res = await fetch('/api/export/guides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sendEmail: true }) });
            const data = await res.json();
            if (!res.ok) {
                if (data.timeRemaining) {
                    setErrorModal({
                        isOpen: true,
                        title: 'Export Cooldown Active',
                        message: `Next export in ${formatTimeRemaining(data.timeRemaining)}`,
                        type: 'warning'
                    });
                } else {
                    throw new Error(data.error || 'Failed export');
                }
            } else {
                setErrorModal({ isOpen: true, title: 'Export Started', message: 'Your guides will be emailed shortly.', type: 'success' });
                // refresh limits (lastExport updated)
                try { const limRes = await fetch('/api/user/limits'); if (limRes.ok) setUserLimits(await limRes.json()); } catch {}
            }
                } catch (_err) {
                    const msg = _err instanceof Error ? _err.message : 'Failed to export guides';
                    setErrorModal({ isOpen: true, title: 'Export Failed', message: msg, type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#141414]">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#141414] text-white p-8 text-center space-y-6">
                <h1 className="font-just-another-hand text-[96px] leading-none">Profile</h1>
                <p className="text-white/70 max-w-md">Sign in to view your profile, usage and manage your account.</p>
                <Link href="/auth/signin" className="px-8 py-4 rounded-2xl bg-primary text-black font-semibold hover:bg-primary/80 transition-colors">Sign In</Link>
            </div>
        );
    }

        interface UsageItem { key: string; label: string; color: string; value: number; max: number; remaining: number; plan?: 'pro' | 'proplus'; }
        const usageItems: UsageItem[] = userLimits ? ([
            { key: 'llama', label: 'Kimi (Base)', color: 'bg-primary', value: userLimits.llamaGuides, max: userLimits.limits.llamaMax, remaining: userLimits.remaining.llama },
            { key: 'gemini', label: 'Gemini', color: 'bg-blue-500', value: userLimits.geminiGuides, max: userLimits.limits.geminiMax, remaining: userLimits.remaining.gemini },
            { key: 'deepseek', label: 'DeepSeek', color: 'bg-green-500', value: userLimits.deepseekGuides, max: userLimits.limits.deepseekMax, remaining: userLimits.remaining.deepseek },
            { key: 'nanobanana', label: 'Nano Banana (Images)', color: 'bg-yellow-400 text-black', value: userLimits.nanobananaGuides, max: userLimits.limits.nanobananaMax, remaining: userLimits.remaining.nanobanana },
            { key: 'osslarge', label: 'OSS Large', color: 'bg-pink-500', value: userLimits.osslargeGuides, max: userLimits.limits.osslargeMax, remaining: userLimits.remaining.osslarge, plan: 'pro' },
            { key: 'o3mini', label: 'O3 Mini', color: 'bg-orange-500', value: userLimits.o3miniGuides, max: userLimits.limits.o3miniMax, remaining: userLimits.remaining.o3mini, plan: 'pro' },
            { key: 'gpt41', label: 'GPT-4.1', color: 'bg-blue-500', value: userLimits.gpt41Guides, max: userLimits.limits.gpt41Max, remaining: userLimits.remaining.gpt41, plan: 'proplus' },
            { key: 'gpt41mini', label: 'GPT-4.1 Mini', color: 'bg-purple-500', value: userLimits.gpt41miniGuides, max: userLimits.limits.gpt41miniMax, remaining: userLimits.remaining.gpt41mini, plan: 'proplus' },
        ]) : [];

    return (
        <div className="min-h-screen bg-[#141414] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="w-full max-w-7xl bg-[#1E1E1E] rounded-[72px] overflow-hidden shadow-xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[820px] relative">
                    {/* Left */}
                    <div className="p-8 md:p-12 lg:p-16">
                        <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-12">Profile</h1>
                        <div className="space-y-10">
                            <div className="space-y-2">
                                <label className="block text-white text-2xl">You&apos;re</label>
                                <input value={name} readOnly className="w-full h-[72px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-white text-2xl">Your Email is</label>
                                <input value={email} readOnly className="w-full h-[72px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] cursor-not-allowed" />
                            </div>
                            <div className="pt-2 text-white text-2xl">Login Provider <span className="text-primary">{provider}</span></div>

                            {/* Subscription */}
                            <div className="pt-4 space-y-4">
                                <h2 className="text-white text-2xl font-semibold">Subscription</h2>
                                {subscription ? (
                                    <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232] space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <div>
                                                <p className="text-gray-400">Current Plan</p>
                                                <p className="text-white text-lg font-semibold capitalize">{subscription.plan}
                                                    {subscription.plan !== 'free' && subscription.period && (
                                                        <span className="ml-2 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{subscription.period}</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Status</p>
                                                <p className={`text-lg font-semibold capitalize ${subscription.status === 'active' ? 'text-green-400' : subscription.status === 'past_due' ? 'text-yellow-400' : subscription.status === 'canceled' ? 'text-red-400' : 'text-gray-400'}`}>{subscription.status}</p>
                                            </div>
                                            {subscription.currentPeriodEnd && subscription.plan !== 'free' && (
                                                <div>
                                                    <p className="text-gray-400">{subscription.status === 'canceled' ? 'Access Ends' : 'Renewal Date'}</p>
                                                    <p className="text-white text-lg">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {subscription.stripeCustomerId && (
                                                <div>
                                                    <p className="text-gray-400">Customer ID</p>
                                                    <p className="text-white text-xs font-mono break-all">{subscription.stripeCustomerId}</p>
                                                </div>
                                            )}
                                        </div>
                                        {subscription.plan === 'free' && (
                                            <Link href="/pricing" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl transition-colors">Upgrade Plan</Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232]">
                                        <p className="text-white text-lg">Free Plan</p>
                                        <p className="text-gray-400 text-sm mt-2">You&apos;re currently on the free plan with limited access.</p>
                                        <Link href="/pricing" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl transition-colors mt-4">Upgrade Plan</Link>
                                    </div>
                                )}
                            </div>

                            {/* Usage */}
                            {userLimits && (
                                <div className="pt-4">
                                    <div className="flex items-center justify-between cursor-pointer mb-4 p-3 rounded-xl hover:bg-[#2A2A2A]/50 transition-colors group" onClick={() => setIsGuideUsageOpen(o => !o)}>
                                        <h3 className="text-white text-2xl group-hover:text-primary transition-colors">Guide Usage</h3>
                                        <ChevronDown className={`w-6 h-6 text-white group-hover:text-primary transition-transform ${isGuideUsageOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    {isGuideUsageOpen && (
                                        <div className="bg-[#2A2A2A] border border-[#323232] rounded-2xl p-4 space-y-5">
                                            {usageItems.map(item => {
                                                const unlimited = item.max >= 999999;
                                                const displayMax = unlimited ? '∞' : item.max;
                                                const percent = unlimited ? 100 : (item.max ? (item.value / item.max) * 100 : 0);
                                                const locked = item.max === 0;
                                                const requirement = locked ? (item.plan === 'proplus' ? 'Pro+' : item.plan === 'pro' ? 'Pro' : '') : '';
                                                return (
                                                    <div key={item.key} className="space-y-2">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-300 flex items-center gap-2">{item.label}
                                                                {locked && requirement && <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary border border-primary/30">{requirement} required</span>}
                                                                {unlimited && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Unlimited</span>}
                                                            </span>
                                                            <span className="text-white font-medium">{item.value}/{displayMax}{!unlimited && <span className="text-gray-400 ml-2">({item.remaining} left)</span>}</span>
                                                        </div>
                                                        <div className="w-full bg-background/90 rounded-full h-2 overflow-hidden">
                                                            <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="pt-2 text-[11px] text-gray-500 leading-relaxed border-t border-[#323232] mt-2">
                                                Upgrades: Pro unlocks OSS Large (Qwen3 32B, GPT-OSS 20B, GPT-OSS 120B) + O3 Mini. Pro+ adds GPT‑4.1 family & provides higher / unlimited tiers.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Export cooldown */}
                            {!canExport && (
                                <div className="bg-[#2A2A2A] border border-orange-500/30 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                                        <div>
                                            <h4 className="text-orange-400 font-medium">Export Cooldown Active</h4>
                                            <p className="text-gray-300 text-sm">Next export in {formatTimeRemaining(exportRemainingMs)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <button onClick={handleExportGuides} disabled={isExporting || !canExport} title={!canExport ? `Export in ${formatTimeRemaining(exportRemainingMs)}` : ''} className={`h-[66px] text-lg font-medium rounded-[26px] px-6 transition-colors flex-1 min-w-[160px] flex items-center justify-center ${!canExport ? 'bg-orange-900/50 text-orange-300 border border-orange-500/30 cursor-not-allowed' : 'bg-[#2A2A2A] hover:bg-[#323232] text-white border border-[#3a3a3a]'}`}>
                                    {isExporting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Export Guides'}
                                </button>
                                <button onClick={handleDeleteAccount} className="h-[66px] bg-[#410000] hover:bg-[#4B0000] text-white text-lg font-medium rounded-[26px] border border-[#5a0000] px-6 flex-1 min-w-[160px]">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block absolute top-8 bottom-8 left-1/2 transform -translate-x-0.5 border-l border-dashed border-[#323232]" />

                    {/* Right */}
                    <div className="p-8 md:p-12 lg:p-16 border-t border-dashed lg:border-t-0 border-[#323232] flex flex-col">
                        <div className="flex flex-col items-center mb-12">
                            <AvatarUpload currentAvatar={avatar} onAvatarUpdate={handleAvatarUpdate} size={200} />
                        </div>

                        {/* Upgrade CTA */}
                        <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary" /></div>
                                <h3 className="text-white font-semibold">Upgrade Plan</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">View pricing plans and upgrade your subscription for higher limits & advanced models.</p>
                            <Link href="/pricing" className="inline-flex items-center px-5 py-3 bg-primary hover:bg-primary/80 text-black text-sm font-semibold rounded-xl transition-colors">
                                View Pricing <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>

                        {/* Password Update */}
                        <div className="mt-10">
                            <h2 className="text-white text-2xl mb-4">Update Your Password</h2>
                            <div className="w-full border-t border-dashed border-[#323232] mb-6" />
                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-white text-xl">Old password</label>
                                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full h-[58px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232]" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-white text-xl">New password</label>
                                        <Link href="/auth/forgot-password" className="text-primary text-sm hover:underline">Forgot?</Link>
                                    </div>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full h-[58px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-white text-xl">Confirm new password</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full h-[58px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232]" />
                                </div>
                                {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
                                {passwordSuccess && <div className="text-green-500 text-sm">{passwordSuccess}</div>}
                                <div className="flex justify-center">
                                    <button type="submit" disabled={isLoading} className="bg-[#323232] hover:bg-[#3a3a3a] text-white font-medium px-8 py-4 rounded-2xl transition-colors w-[215px] h-[58px] disabled:opacity-70">{isLoading ? 'Updating...' : 'Submit'}</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <ConfirmModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={confirmDeleteAccount}
                        title="Delete Account"
                        message="Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including saved guides and profile information."
                        confirmText="Delete Account"
                        cancelText="Cancel"
                        isDangerous
                        isLoading={isDeleting}
                    />
                    <ErrorModal isOpen={errorModal.isOpen} onClose={() => setErrorModal(p => ({ ...p, isOpen: false }))} title={errorModal.title} message={errorModal.message} type={errorModal.type} />
                </div>
            </div>
        </div>
    );
}