/// components/user/User.Wallets.Backup.Modal.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
    Shield,
    Eye,
    EyeOff,
    Copy,
    Check,
    AlertTriangle,
    Lock,
    ArrowRight,
    Wallet,
    Star,
    Sparkles,
    FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import {
    getPrivateKey,
    walletBackupPostProcess,
} from "@/app/story/userWallet/actions";
import { useToast } from "@/app/hooks/useToast";

interface NotifyWalletsBackupProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    walletAddress: string;
}

export default function NotifyWalletsBackup({
    isOpen,
    onClose,
    onComplete,
    walletAddress,
}: NotifyWalletsBackupProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [privateKey, setPrivateKey] = useState<string>("");
    const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
    const [isPrivateKeyCopied, setIsPrivateKeyCopied] = useState(false);
    const [isAddressCopied, setIsAddressCopied] = useState(false);
    const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
    const [agreedToResponsibility, setAgreedToResponsibility] = useState(false);
    const [agreedToPrivateKey, setAgreedToPrivateKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { data: session } = useSession();
    const toast = useToast();

    // Private Key 가져오기
    const fetchPrivateKey = useCallback(async () => {
        if (privateKey) return;

        setIsLoading(true);
        try {
            const key = await getPrivateKey(walletAddress);
            setPrivateKey(key);
        } catch (error) {
            console.error("Failed to fetch private key:", error);
            toast.error("Failed to fetch private key");
            onClose();
        } finally {
            setIsLoading(false);
        }
    }, [privateKey, walletAddress, onClose, toast]);

    // 백업 완료 처리
    const handleBackupComplete = async () => {
        if (!session?.user?.id) {
            toast.error("User not authenticated");
            return;
        }

        setIsLoading(true);
        try {
            const result = await walletBackupPostProcess({
                userId: session.user.id,
                walletAddress,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success("🎉 Backup completed successfully!");
            onComplete?.();
            onClose();
        } catch (error) {
            console.error("Failed to complete backup:", error);
            toast.error("Failed to complete backup");
        } finally {
            setIsLoading(false);
        }
    };

    // Private Key 복사
    const copyPrivateKey = async () => {
        await navigator.clipboard.writeText(privateKey).catch((error) => {
            console.error("Failed to copy private key:", error);
            toast.error("Copy Failed");
            return;
        });
        setIsPrivateKeyCopied(true);
        toast.success("🔐 Private Key Copied!");
        setTimeout(() => setIsPrivateKeyCopied(false), 3000);
    };

    // Wallet Address 복사
    const copyWalletAddress = async () => {
        await navigator.clipboard.writeText(walletAddress).catch((error) => {
            console.error("Failed to copy wallet address:", error);
            toast.error("Copy Failed");
            return;
        });
        setIsAddressCopied(true);
        toast.success("📋 Wallet Address Copied!");
        setTimeout(() => setIsAddressCopied(false), 3000);
    };

    // 스텝별 정의
    const steps = [
        {
            icon: (
                <AlertTriangle
                    className={cn(
                        "text-purple-400",
                        getResponsiveClass(40).frameClass
                    )}
                />
            ),
            title: "Security Alert",
            subtitle: "Important: Your Private Key is Powerful",
            content: (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-xl border border-purple-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="text-purple-400 w-5 h-5" />
                            <h4
                                className={cn(
                                    "text-purple-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                Your Private Key = Full Control
                            </h4>
                        </div>
                        <div className="space-y-2 text-gray-300">
                            <p
                                className={cn(
                                    "flex items-center gap-2",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                Controls ALL your crypto assets
                            </p>
                            <p
                                className={cn(
                                    "flex items-center gap-2",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                Never share with anyone (including us!)
                            </p>
                            <p
                                className={cn(
                                    "flex items-center gap-2",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                Store safely offline
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-4 rounded-xl border border-indigo-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Star className="text-indigo-400 w-5 h-5" />
                            <h4
                                className={cn(
                                    "text-indigo-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                Why Backup Now?
                            </h4>
                        </div>
                        <p
                            className={cn(
                                "text-gray-300",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Starglow is running on non-custodial model. Backup
                            now to keep full control of your assets!
                        </p>
                    </div>
                </div>
            ),
        },
        {
            icon: (
                <Shield
                    className={cn(
                        "text-purple-400",
                        getResponsiveClass(40).frameClass
                    )}
                />
            ),
            title: "Backup Methods",
            subtitle: "Choose Your Preferred Way",
            content: (
                <div className="space-y-3">
                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-xl border border-green-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Check className="text-green-400 w-4 h-4" />
                            </div>
                            <p
                                className={cn(
                                    "text-green-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                ✅ Write it Down (Recommended)
                            </p>
                        </div>
                        <p
                            className={cn(
                                "text-gray-300 ml-11",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Paper + Safe place = Best security
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-xl border border-blue-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Lock className="text-blue-400 w-4 h-4" />
                            </div>
                            <p
                                className={cn(
                                    "text-blue-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                ⚡ Password Manager
                            </p>
                        </div>
                        <p
                            className={cn(
                                "text-gray-300 ml-11",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            1Password, Bitwarden with 2FA
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 p-4 rounded-xl border border-red-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-red-400 w-4 h-4" />
                            </div>
                            <p
                                className={cn(
                                    "text-red-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                ❌ Never Do This
                            </p>
                        </div>
                        <p
                            className={cn(
                                "text-gray-300 ml-11",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Cloud storage, email, screenshots, chat apps
                        </p>
                    </div>
                </div>
            ),
        },
        {
            icon: (
                <FileText
                    className={cn(
                        "text-orange-400",
                        getResponsiveClass(40).frameClass
                    )}
                />
            ),
            title: "Disclaimer & Agreement",
            content: (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 p-4 rounded-xl border border-orange-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle
                                className={cn(
                                    "text-orange-400",
                                    getResponsiveClass(25).frameClass
                                )}
                            />
                            <h4
                                className={cn(
                                    "text-orange-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                Important Legal Notice
                            </h4>
                        </div>

                        <div className="space-y-3 text-gray-300">
                            <div className="bg-black/20 p-3 rounded-lg">
                                <p
                                    className={cn(
                                        "font-semibold text-red-300 mb-2",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    NO LIABILITY DISCLAIMER
                                </p>
                                <p
                                    className={cn(
                                        "leading-relaxed",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    By proceeding, you acknowledge that{" "}
                                    <strong>Starglow</strong> and its operators
                                    bear <strong>ZERO RESPONSIBILITY</strong>{" "}
                                    for any loss, theft, or damage to your
                                    private key or cryptocurrency assets.
                                </p>
                            </div>

                            <div className="bg-black/20 p-3 rounded-lg">
                                <p
                                    className={cn(
                                        "font-semibold text-yellow-300 mb-2",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    YOUR FULL RESPONSIBILITY
                                </p>
                                <ul className="space-y-1">
                                    <li
                                        className={cn(
                                            "flex items-start gap-2",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>
                                            You are solely responsible for
                                            securing your private key
                                        </span>
                                    </li>
                                    <li
                                        className={cn(
                                            "flex items-start gap-2",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>
                                            Any loss due to mismanagement is
                                            YOUR responsibility
                                        </span>
                                    </li>
                                    <li
                                        className={cn(
                                            "flex items-start gap-2",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>
                                            Starglow cannot recover lost private
                                            keys
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-black/20 p-3 rounded-lg">
                                <p
                                    className={cn(
                                        "font-semibold text-purple-300 mb-2",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    PRIVATE KEY RISKS
                                </p>
                                <ul className="space-y-1">
                                    <li
                                        className={cn(
                                            "flex items-start gap-2",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>
                                            If lost, your assets are PERMANENTLY
                                            lost
                                        </span>
                                    </li>
                                    <li
                                        className={cn(
                                            "flex items-start gap-2",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>
                                            If stolen, your assets can be stolen
                                        </span>
                                    </li>
                                    <li
                                        className={cn(
                                            "flex items-start gap-2",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>
                                            No insurance or recovery mechanism
                                            exists
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                            <Checkbox
                                id="disclaimer-agreement"
                                checked={agreedToDisclaimer}
                                onCheckedChange={(checked) =>
                                    setAgreedToDisclaimer(checked === true)
                                }
                                className="border-orange-500/50 data-[state=checked]:bg-orange-600 mt-1"
                            />
                            <label
                                htmlFor="disclaimer-agreement"
                                className={cn(
                                    "text-gray-300 leading-relaxed cursor-pointer",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <strong className="text-orange-300">
                                    I understand and agree to all terms above.
                                </strong>
                            </label>
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                            <Checkbox
                                id="disclaimer-agreement-responsibility"
                                checked={agreedToResponsibility}
                                onCheckedChange={(checked) =>
                                    setAgreedToResponsibility(checked === true)
                                }
                                className="border-orange-500/50 data-[state=checked]:bg-orange-600 mt-1"
                            />
                            <label
                                htmlFor="disclaimer-agreement-responsibility"
                                className={cn(
                                    "text-gray-300 leading-relaxed cursor-pointer",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <strong className="text-orange-300 font-bold">
                                    I acknowledge that Starglow bears ZERO
                                    responsibility for any loss or damage.
                                </strong>
                            </label>
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                            <Checkbox
                                id="disclaimer-agreement-private-key"
                                checked={agreedToPrivateKey}
                                onCheckedChange={(checked) =>
                                    setAgreedToPrivateKey(checked === true)
                                }
                                className="border-orange-500/50 data-[state=checked]:bg-orange-600 mt-1"
                            />
                            <label
                                htmlFor="disclaimer-agreement-private-key"
                                className={cn(
                                    "text-gray-300 leading-relaxed cursor-pointer",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <strong className="text-red-300 font-bold">
                                    I am fully responsible for securing my
                                    private key.
                                </strong>
                            </label>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: (
                <Wallet
                    className={cn(
                        "text-purple-400",
                        getResponsiveClass(50).frameClass
                    )}
                />
            ),
            title: "Your Wallet Info",
            subtitle: "Copy & Save Securely",
            content: (
                <div className="space-y-4">
                    {/* Wallet Address */}
                    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4 rounded-xl border border-purple-500/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p
                                className={cn(
                                    "text-purple-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                📍 Wallet Address
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyWalletAddress}
                                className="text-purple-300 border-purple-500/50 hover:bg-purple-900/50 bg-purple-900/20"
                            >
                                {isAddressCopied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-1" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg border border-purple-500/30">
                            <p
                                className={cn(
                                    "font-mono text-purple-300 break-all",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {walletAddress}
                            </p>
                        </div>
                    </div>

                    {/* Private Key */}
                    <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 p-4 rounded-xl border border-pink-500/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p
                                className={cn(
                                    "text-pink-300 font-bold",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                🔑 Private Key
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setIsPrivateKeyVisible(
                                            !isPrivateKeyVisible
                                        )
                                    }
                                    className="text-pink-300 border-pink-500/50 hover:bg-pink-900/50 bg-pink-900/20"
                                >
                                    {isPrivateKeyVisible ? (
                                        <>
                                            <EyeOff className="w-4 h-4 mr-1" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4 mr-1" />
                                            Show
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyPrivateKey}
                                    disabled={
                                        !privateKey || !isPrivateKeyVisible
                                    }
                                    className="text-green-300 border-green-500/50 hover:bg-green-900/50 bg-green-900/20 disabled:opacity-50"
                                >
                                    {isPrivateKeyCopied ? (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-1" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-black/40 p-3 rounded-lg border border-pink-500/30">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                        className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"
                                    />
                                    <span
                                        className={cn(
                                            "ml-2 text-purple-300",
                                            getResponsiveClass(5).textClass
                                        )}
                                    >
                                        Loading...
                                    </span>
                                </div>
                            ) : isPrivateKeyVisible ? (
                                <p
                                    className={cn(
                                        "font-mono text-green-300 break-all select-all",
                                        getResponsiveClass(5).textClass
                                    )}
                                >
                                    {privateKey}
                                </p>
                            ) : (
                                <p
                                    className={cn(
                                        "text-center text-gray-500 py-2",
                                        getResponsiveClass(5).textClass
                                    )}
                                >
                                    ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                                    <br />
                                    <span className="text-purple-400">
                                        {`Click "Show" to reveal`}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Security Tip */}
                    <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 p-3 rounded-xl border border-yellow-500/40 backdrop-blur-sm">
                        <p
                            className={cn(
                                "text-yellow-300 font-bold mb-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            💡 Quick Tip
                        </p>
                        <p
                            className={cn(
                                "text-gray-300",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Look around → Copy quickly → Store safely → Close
                            window
                        </p>
                    </div>
                </div>
            ),
        },

        {
            icon: (
                <div
                    className={cn("text-6xl", getResponsiveClass(40).textClass)}
                >
                    🎉
                </div>
            ),
            title: "Backup Complete!",
            content: (
                <div className="space-y-6 text-center">
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-purple-500/40 backdrop-blur-sm">
                        <h3
                            className={cn(
                                "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            Own Your Key
                            <br />
                            Protect Assets
                            <br />
                            Ready for Web3
                        </h3>
                    </div>

                    <Button
                        onClick={handleBackupComplete}
                        disabled={isLoading}
                        className={cn(
                            "font-main bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed",
                            getResponsiveClass(20).textClass,
                            getResponsiveClass(30).paddingClass
                        )}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                />
                                Processing...
                            </div>
                        ) : (
                            "Complete Backup!"
                        )}
                    </Button>
                </div>
            ),
        },
    ];

    const nextStep = () => {
        if (currentStep === 3 && !privateKey) {
            fetchPrivateKey().catch((error) => {
                console.error("Failed to fetch private key:", error);
            });
        }
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 2: // Disclaimer step
                return (
                    agreedToDisclaimer &&
                    agreedToResponsibility &&
                    agreedToPrivateKey
                );
            default:
                return true;
        }
    };

    // Private Key 가져오기 (모달이 열릴 때)
    useEffect(() => {
        if (isOpen && currentStep === 3 && !privateKey) {
            fetchPrivateKey().catch((error) => {
                console.error("Failed to fetch private key:", error);
            });
        }
    }, [isOpen, currentStep, fetchPrivateKey, privateKey]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-gray-900 via-purple-900/60 to-indigo-900/80 border-purple-300/30 p-0 overflow-hidden [&>button]:z-20 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
                <div className="relative">
                    {/* Progress bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800/50 z-10">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                            initial={{ width: "0%" }}
                            animate={{
                                width: `${
                                    ((currentStep + 1) / steps.length) * 100
                                }%`,
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className={cn("p-3 sm:p-5 md:p-8 pt-6")}
                            >
                                <div className="text-center mb-3">
                                    {steps[currentStep].icon && (
                                        <div
                                            className={cn("inline-block mb-2")}
                                        >
                                            {steps[currentStep].icon}
                                        </div>
                                    )}
                                    <h2
                                        className={cn(
                                            "font-bold text-white mb-2",
                                            getResponsiveClass(30).textClass
                                        )}
                                    >
                                        {steps[currentStep].title}
                                    </h2>
                                    <p
                                        className={cn(
                                            "text-gray-400 font-semibold",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        {steps[currentStep].subtitle}
                                    </p>
                                </div>

                                <div
                                    className={cn(
                                        "mt-6",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {steps[currentStep].content}
                                </div>

                                {/* Navigation */}
                                {currentStep < steps.length - 1 && (
                                    <div className="flex justify-between mt-[20px]">
                                        <button
                                            onClick={prevStep}
                                            className={cn(
                                                "rounded-lg text-purple-400 hover:text-purple-300 transition-colors bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30",
                                                getResponsiveClass(15)
                                                    .paddingClass,
                                                getResponsiveClass(10)
                                                    .textClass,
                                                currentStep === 0 && "invisible"
                                            )}
                                        >
                                            Previous
                                        </button>
                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceedToNext()}
                                            className={cn(
                                                "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25",
                                                getResponsiveClass(15)
                                                    .textClass,
                                                getResponsiveClass(25)
                                                    .paddingClass
                                            )}
                                        >
                                            Next
                                            <ArrowRight
                                                className={cn(
                                                    getResponsiveClass(20)
                                                        .frameClass
                                                )}
                                            />
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Step indicators */}
                        <div className="flex justify-center gap-2 pb-6">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        index === currentStep
                                            ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500"
                                            : "bg-purple-600/30 hover:bg-purple-500/50"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
