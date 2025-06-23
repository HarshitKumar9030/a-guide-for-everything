'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AvatarUpload from '@/components/core/AvatarUpload';
import ConfirmModal from '@/components/core/ConfirmModal';
import { getTimeUntilNextExport, formatTimeRemaining } from '@/lib/rate-limit';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();    // User data state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [provider, setProvider] = useState('Email');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false); const [exportCooldown, setExportCooldown] = useState<number>(0);
    const [canExport, setCanExport] = useState<boolean>(true);
    const [userLimits, setUserLimits] = useState<{
        llamaGuides: number;
        geminiGuides: number;
        remaining: { llama: number; gemini: number };
        limits: { llamaMax: number; geminiMax: number };
    } | null>(null);

    // Delete account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); useEffect(() => {
        if (session?.user) {
            setName(session.user.name || '');
            setEmail(session.user.email || '');
            setAvatar(session.user.image || null);
            setProvider(session.user.provider || 'Email');
        }
    }, [session]); useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]); useEffect(() => {
        // Check export cooldown and fetch user limits on mount and update every minute
        const checkCooldownAndLimits = async () => {
            if (!session?.user?.email) return;

            try {
                const response = await fetch('/api/user/limits');
                if (response.ok) {
                    const data = await response.json();
                    const timeRemaining = getTimeUntilNextExport(data.lastExport);
                    setExportCooldown(timeRemaining);
                    setCanExport(timeRemaining === 0);
                    setUserLimits(data);
                }
            } catch (error) {
                console.error('Error checking export cooldown and limits:', error);
            }
        };

        checkCooldownAndLimits();
        const interval = setInterval(checkCooldownAndLimits, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [session?.user?.email]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            setPasswordSuccess('Password updated successfully');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Failed to update password:', error);
            setPasswordError(error instanceof Error ? error.message : 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    }; const handleAvatarUpdate = (newAvatarUrl: string | null) => {
        setAvatar(newAvatarUrl); // Can now be null
        // The session will be updated automatically via NextAuth callbacks
        window.location.reload(); // Refresh to get updated session
    }; const handleDeleteAccount = async () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }

            // Sign out and redirect to home page
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    }; const handleExportGuides = async () => {
        try {
            setIsExporting(true);

            const response = await fetch('/api/export/guides', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sendEmail: true }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to export guides');
            }

            alert(`Success! Your guides export (${data.guideCount} guides) has been sent to your email.`);
        } catch (error) {
            console.error('Export error:', error);
            // Fallback: try to download directly
            try {
                const fallbackResponse = await fetch('/api/export/guides', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sendEmail: false }),
                });

                if (fallbackResponse.ok) {
                    const blob = await fallbackResponse.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `agfe-guides-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    alert('Export downloaded successfully!');
                } else {
                    throw new Error('Export failed');
                }
            } catch (fallbackError) {
                console.error('Fallback export error:', fallbackError);
                alert('Failed to export guides. Please try again later.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#141414] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#141414] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="w-full max-w-7xl bg-[#1E1E1E] rounded-[72px] overflow-hidden shadow-xl">        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[800px] relative">

                <div className="p-8 md:p-12 lg:p-16">
                    <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-12">
                        Profile
                    </h1>

                    <div className="space-y-10">              <div className="space-y-2">
                        <label htmlFor="name" className="block text-white text-2xl">
                            You&apos;re
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            readOnly
                            className="w-full h-[72px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
                            placeholder="Your Name"
                        />
                    </div>              <div className="space-y-2">
                            <label htmlFor="email" className="block text-white text-2xl">
                                Your Email is
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                readOnly
                                className="w-full h-[72px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
                            />
                        </div>                        <div className="pt-8">
                            <p className="text-white text-2xl">
                                Your Login Provider is <span className="text-primary">{provider}</span>
                            </p>
                        </div>

                        {userLimits && (
                            <div className="pt-8">
                                <h3 className="text-white text-2xl mb-4">Guide Usage</h3>
                                <div className="bg-[#2A2A2A] border border-[#323232] rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Llama Guides:</span>
                                        <span className="text-white font-medium">
                                            {userLimits.llamaGuides}/{userLimits.limits.llamaMax}
                                            <span className="text-gray-400 ml-2">({userLimits.remaining.llama} left)</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-background/90 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(userLimits.llamaGuides / userLimits.limits.llamaMax) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Gemini Guides:</span>
                                        <span className="text-white font-medium">
                                            {userLimits.geminiGuides}/{userLimits.limits.geminiMax}
                                            <span className="text-gray-400 ml-2">({userLimits.remaining.gemini} left)</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-background/90 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(userLimits.geminiGuides / userLimits.limits.geminiMax) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 pt-8">
                            <button
                                onClick={handleExportGuides}
                                disabled={isExporting || !canExport}
                                className="h-[66px] py-2 md:py-0 bg-[#2A2A2A] hover:bg-[#323232] text-white text-lg font-medium rounded-[26px] border border-[#3a3a3a] px-5 transition-colors flex-1 min-w-[160px] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExporting ? 'Exporting...' : !canExport ? `Export in ${formatTimeRemaining(exportCooldown)}` : 'Export Guides'}
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="h-[66px] py-2 md:py-0 bg-[#410000] hover:bg-[#4B0000] text-white text-lg font-medium rounded-[26px] border border-[#5a0000] px-5 transition-colors flex-1 min-w-[160px]"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>          
                    </div>

                <div className="hidden lg:block absolute top-8 bottom-8 left-1/2 transform -translate-x-0.5 border-l border-dashed border-[#323232]"></div>                <div className="p-8 md:p-12 lg:p-16 border-t border-dashed lg:border-t-0 border-[#323232]">
                    <div className="flex flex-col items-center mb-16">
                        <AvatarUpload
                            currentAvatar={avatar}
                            onAvatarUpdate={handleAvatarUpdate}
                            size={220}
                        />
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center mb-4">
                            <h2 className="text-white text-2xl">Update Your Password</h2>
                        </div>

                        <div className="w-full border-t border-dashed border-[#323232] mb-6"></div>

                        <form onSubmit={handleUpdatePassword}>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label htmlFor="old-password" className="block text-white text-xl">
                                        Enter your old password
                                    </label>
                                    <input
                                        type="password"
                                        id="old-password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full h-[62px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="new-password" className="block text-white text-xl">
                                            Enter your new password
                                        </label>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-primary text-sm hover:underline"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <input
                                        type="password"
                                        id="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full h-[62px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirm-password" className="block text-white text-xl">
                                        Confirm your new password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-[62px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>

                                {passwordError && (
                                    <div className="text-red-500 text-sm">{passwordError}</div>
                                )}

                                {passwordSuccess && (
                                    <div className="text-green-500 text-sm">{passwordSuccess}</div>
                                )}

                                <div className="flex justify-center">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-[#323232] hover:bg-[#3a3a3a] text-white font-medium px-8 py-4 rounded-2xl transition-colors w-[215px] h-[58px] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Updating...' : 'Submit'}
                                    </button>
                                </div>
                            </div>
                        </form>            </div>
                </div>

                {/* Delete Account Confirmation Modal */}
                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDeleteAccount}
                    title="Delete Account"
                    message="Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including saved guides and profile information."
                    confirmText="Delete Account"
                    cancelText="Cancel"
                    isDangerous={true}
                    isLoading={isDeleting}
                />
            </div>
            </div>
        </div>
    );
}