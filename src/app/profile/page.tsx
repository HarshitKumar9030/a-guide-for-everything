'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // User data state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('/avatars/default.png');
    const [provider, setProvider] = useState('Email');

    // Password update state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(''); const [passwordSuccess, setPasswordSuccess] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || '');
            setEmail(session.user.email || '');
            setAvatar(session.user.image || '/logo.svg');
            setProvider(session.user.provider || 'Email');
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

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
    };

    const handleAvatarClick = () => {
        document.getElementById('avatar-upload')?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

    };

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        }
    };

    const handleExportGuides = async () => {
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
                        </div>              <div className="pt-8">
                            <p className="text-white text-2xl">
                                Your Login Provider is <span className="text-primary">{provider}</span>
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-8">
                            <button
                                onClick={handleExportGuides}
                                className="h-[83px] bg-[#2A2A2A] hover:bg-[#323232] text-white rounded-[32px] border border-[#323232] px-6 transition-colors"
                            >
                                Export Guides
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="h-[83px] bg-[#410000] hover:bg-[#4B0000] text-white rounded-[32px] border border-[#4B0000] px-6 transition-colors"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>          </div>

                <div className="hidden lg:block absolute top-8 bottom-8 left-1/2 transform -translate-x-0.5 border-l border-dashed border-[#323232]"></div>

                <div className="p-8 md:p-12 lg:p-16 border-t border-dashed lg:border-t-0 border-[#323232]">            <div className="flex flex-col items-center mb-12">
                    <div className="relative">
                        <div className="w-[220px] h-[220px] rounded-full bg-[#272727] border border-[#323232] overflow-hidden">
                            {avatar && (
                                <Image
                                    src={avatar}
                                    alt="Profile picture"
                                    width={220}
                                    height={220}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        <div
                            onClick={handleAvatarClick}
                            className="absolute bottom-4 right-4 w-[60px] h-[60px] rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                            <Camera size={24} color="#1E1E1E" />
                        </div>

                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <span className="mt-4 text-white text-center">
                        Update your Avatar
                    </span>
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
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}