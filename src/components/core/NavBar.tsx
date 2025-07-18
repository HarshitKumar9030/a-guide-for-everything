'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { User, LogOut, BookMarked, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/core/Avatar';

export default function NavBar() {
    const router = useRouter();
    const [showNavbar, setShowNavbar] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    const handlePush = (path: string) => {
        setShowDropdown(false);
        router.push(path);
    }

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const screenWidth = window.innerWidth;
            const isInTopArea = e.clientY < 50;
            const isInMiddleThird =
                screenWidth <= 768
                    ? e.clientX > screenWidth / 3 && e.clientX < (screenWidth * 2 / 3)
                    : true;

            if (isInTopArea && isInMiddleThird) {
                setShowNavbar(true);
            } else if (e.clientY > 200 && !showDropdown) {
                setShowNavbar(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [showDropdown]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const userInitial = session?.user?.name?.charAt(0) || 'U';

    if (!isClient) {
        return null; // Prevent hydration mismatch
    } function MobileNavDrawer({
        isOpen,
        onClose,
        isLoggedIn,
        session,
        onSignOut
    }: {
        isOpen: boolean;
        onClose: () => void;
        isLoggedIn: boolean;
        session: Session | null;
        onSignOut: () => void;
    }) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                            className="fixed inset-0 bg-black z-40"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ y: "-100%", scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: "-100%", scale: 0.95 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                                mass: 0.8
                            }}
                            className="fixed top-0 left-0 right-0 bg-[#1E1E1E] z-50 rounded-b-3xl shadow-2xl"
                        >
                            <div className="px-6 py-6">
                                <div className="flex justify-between items-center mb-6">
                                    <Image
                                        onClick={() => router.replace('/')}
                                        src="/logo-transparent.svg"
                                        alt="AGFE Logo"
                                        width={100}
                                        height={30}
                                        className="object-contain"
                                    />
                                    <motion.button
                                        onClick={onClose}
                                        className="text-white p-2 rounded-full hover:bg-white/10"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                {isLoggedIn ? (
                                    <>                                        <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex items-center space-x-4 mb-6 p-4 bg-[#272727] rounded-2xl"
                                    >
                                        <Avatar
                                            src={session?.user?.image}
                                            alt={session?.user?.name || 'User'}
                                            size={48}
                                            className="flex-shrink-0"
                                        />
                                        <div>
                                            <p className="text-white font-medium">{session?.user?.name}</p>
                                            <p className="text-gray-400 text-sm truncate">{session?.user?.email}</p>
                                        </div>
                                    </motion.div>                                        <div className="space-y-2">
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 }}
                                            >
                                                <Link href="/search" className="flex items-center p-4 bg-[#272727] rounded-xl text-white hover:bg-[#333333] transition-colors">
                                                    <Search className="mr-3" size={20} />
                                                    <span>Search Guides</span>
                                                </Link>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <Link href="/profile" className="flex items-center p-4 bg-[#272727] rounded-xl text-white hover:bg-[#333333] transition-colors">
                                                    <User className="mr-3" size={20} />
                                                    <span>Profile</span>
                                                </Link>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.25 }}
                                            >
                                                <Link href="/saved-guides" className="flex items-center p-4 bg-[#272727] rounded-xl text-white hover:bg-[#333333] transition-colors">
                                                    <BookMarked className="mr-3" size={20} />
                                                    <span>Saved Guides</span>
                                                </Link>
                                            </motion.div>

                                            <motion.button
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                                onClick={onSignOut}
                                                className="flex items-center p-4 w-full bg-[#272727] rounded-xl text-white hover:bg-[#333333] transition-colors"
                                            >
                                                <LogOut className="mr-3" size={20} />
                                                <span>Logout</span>
                                            </motion.button>
                                        </div>
                                    </>                                ) : (
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Link href="/search" className="flex items-center p-4 bg-[#272727] rounded-xl text-white hover:bg-[#333333] transition-colors">
                                                <Search className="mr-3" size={20} />
                                                <span>Search Guides</span>
                                            </Link>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                            className="flex justify-center"
                                        >
                                            <Link href="/auth/signin">
                                                <motion.div
                                                    className="bg-[#272727] hover:bg-[#333333] transition-colors text-white font-medium rounded-xl px-8 py-4"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    Get Started
                                                </motion.div>
                                            </Link>
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    }
    return (
        <>
            <AnimatePresence>
                {!isMobile && showNavbar && (
                    <motion.div
                        initial={{
                            y: -100,
                            scale: 0.9,
                            opacity: 0
                        }}
                        animate={{
                            y: 0,
                            scale: 1,
                            opacity: 1
                        }}
                        exit={{
                            y: -100,
                            scale: 0.9,
                            opacity: 0
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                            mass: 0.8
                        }}
                        className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[780px] px-4"
                    >                        <div className="mt-3">
                            <div className="bg-[#1E1E1E] rounded-[30px] h-[86px] flex items-center justify-between px-6 shadow-2xl border border-white/5">
                                <div>
                                    <Image
                                        src="/logo-transparent.svg"
                                        onClick={() => router.replace('/')}
                                        alt="AGFE Logo"
                                        width={84}
                                        height={28}
                                        className="object-contain cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <motion.div
                                        className=" w-[48px] h-[48px] rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                        onClick={() => router.push('/search')}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        title="Search Guides"
                                    >
                                        <Search className="w-5 h-5 text-white" />
                                    </motion.div>

                                    {!isLoggedIn ? (
                                        <Link href="/auth/signin">
                                            <motion.div
                                                className="bg-[#272727] rounded-[17px] px-5 py-2 cursor-pointer hover:bg-[#333333] transition-colors"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span className="text-white text-[16px]">Get Started</span>
                                            </motion.div>
                                        </Link>
                                    ) : (
                                        <div className="relative">
                                            <motion.div
                                                className="bg-[#272727] w-[58px] h-[58px] rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
                                                onClick={() => setShowDropdown(!showDropdown)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            >
                                                {session?.user?.image ? (
                                                    <Avatar
                                                        src={session.user.image}
                                                        alt={session.user.name || 'User'}
                                                        size={58}
                                                        className="border-0"
                                                    />
                                                ) : (
                                                    <span className="text-white text-[20px] font-normal">{userInitial}</span>
                                                )}
                                            </motion.div>

                                            <AnimatePresence>
                                                {showDropdown && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            y: -10,
                                                            scale: 0.95,
                                                            transformOrigin: "top right"
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                            scale: 1
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -10,
                                                            scale: 0.95
                                                        }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 25,
                                                            duration: 0.2
                                                        }}
                                                        className="absolute top-[70px] right-0 bg-[#272727] rounded-2xl py-2 min-w-[200px] shadow-2xl border border-white/10"
                                                    >
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.05 }}
                                                            className="px-4 py-3 border-b border-neutral-700"
                                                        >
                                                            <p className="text-white font-medium">{session?.user?.name}</p>
                                                            <p className="text-gray-400 text-sm truncate">{session?.user?.email}</p>
                                                        </motion.div>

                                                        <div className="py-1">
                                                            <motion.button
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.1 }}
                                                                onClick={() => handlePush('/profile')}
                                                                className="flex items-center px-4 py-2 w-full text-left text-white hover:bg-[#333333] transition-colors"
                                                            >
                                                                <User className="mr-2" size={18} />
                                                                <span>Profile</span>
                                                            </motion.button>

                                                            <motion.button
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.15 }}
                                                                onClick={()=> handlePush('/saved-guides')}
                                                                className="flex items-center px-4 py-2 w-full text-left text-white hover:bg-[#333333] transition-colors"
                                                            >
                                                                <BookMarked className="mr-2" size={18} />
                                                                <span>Saved Guides</span>
                                                            </motion.button>

                                                            <motion.button
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.2 }}
                                                                onClick={() => {
                                                                    signOut();
                                                                    setShowDropdown(false);
                                                                }}
                                                                className="flex items-center px-4 py-2 w-full text-left text-white hover:bg-[#333333] transition-colors"
                                                            >
                                                                <LogOut className="mr-2" size={18} />
                                                                <span>Logout</span>
                                                            </motion.button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isMobile && (
                    <motion.div
                        className="fixed top-0 left-0 right-0 h-12 z-40 flex justify-center"
                        onClick={() => setIsMobileDrawerOpen(true)}
                    >
                        <motion.div
                            initial={{ y: -10, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                                duration: 0.4
                            }}
                            className="w-16 h-1 bg-white/30 rounded-full mt-2 cursor-pointer"
                            whileHover={{ scale: 1.1, opacity: 1 }}
                            whileTap={{ scale: 0.9 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <MobileNavDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                isLoggedIn={isLoggedIn}
                session={session}
                onSignOut={() => {
                    signOut();
                    setIsMobileDrawerOpen(false);
                }}
            />
        </>
    );
}