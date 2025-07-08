/// component/admin/x/Admin.X.RewardModal.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift, Send, AlertCircle, CheckCircle, RefreshCcw } from "lucide-react";

import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useTweets } from "@/app/actions/x/hooks";
import { useToast } from "@/app/hooks/useToast";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/tailwind";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { SelectedTweetInfo } from "./Admin.X.Dashboard";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminXRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTweets: SelectedTweetInfo[];
    selectedAuthor?: {
        id: string;
        authorId: string;
        name: string;
        username: string;
        profileImageUrl?: string;
        playerId?: string;
    } | null;
}

export default function AdminXRewardModal({
    isOpen,
    onClose,
    selectedTweets,
    selectedAuthor,
}: AdminXRewardModalProps) {
    const toast = useToast();
    const { giveGlowingRewardAsync } = useTweets();
    const { assets, isAssetsLoading } = useAssetsGet({
        getAssetsInput: {
            isActive: true,
        },
    });

    const [selectedAssetId, setSelectedAssetId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [reason, setReason] = useState<string>("GLOWING Rewards");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [forceToChangeReason, setForceToChangeReason] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!selectedAssetId) {
            toast.error("Please select a reward asset");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (!selectedAuthor?.playerId) {
            toast.error("This author doesn't have a connected player account");
            return;
        }

        try {
            setIsSubmitting(true);

            await giveGlowingRewardAsync({
                playerId: selectedAuthor.playerId,
                assetId: selectedAssetId,
                amount: Number(amount),
                tweetAuthorId: selectedAuthor.id,
                tweetIds: selectedTweets.map((t) => t.tweetId),
                reason: reason,
            });

            toast.success(
                `Successfully sent ${formatNumber(Number(amount))} ${
                    selectedAsset?.symbol
                } to @${selectedAuthor.username}!`
            );
            onClose();
            resetForm();
        } catch (error) {
            console.error("Error giving reward:", error);
            toast.error("Failed to send reward. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedAssetId("");
        setAmount("");
        setForceToChangeReason(false);
    };

    const selectedAsset = assets?.assets?.find((a) => a.id === selectedAssetId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-800">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Gift className="w-6 h-6 text-purple-400" />
                        </div>
                        Send Tweet Rewards
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Author Info */}
                    {selectedAuthor && (
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div className="flex items-center gap-4">
                                <img
                                    src={
                                        selectedAuthor.profileImageUrl ||
                                        "/default-avatar.jpg"
                                    }
                                    alt={selectedAuthor.name}
                                    className="w-14 h-14 rounded-full border-2 border-gray-700"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "/default-avatar.jpg";
                                    }}
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-white text-lg">
                                        {selectedAuthor.name}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        @{selectedAuthor.username}
                                    </p>
                                </div>
                                {selectedAuthor.playerId ? (
                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            Connected
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            Not Connected
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Selected Tweets */}
                    {selectedTweets.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">
                                    Selected Tweets
                                </Label>
                                <span className="text-sm text-gray-400">
                                    {selectedTweets.length} tweet
                                    {selectedTweets.length > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="max-h-[180px] overflow-y-auto space-y-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                                {selectedTweets.map((tweet, index) => (
                                    <div
                                        key={tweet.tweetId}
                                        className={cn(
                                            "text-sm p-3 bg-gray-800/50 rounded-lg",
                                            index !==
                                                selectedTweets.length - 1 &&
                                                "mb-2"
                                        )}
                                    >
                                        <p className="text-gray-300 line-clamp-2">
                                            {tweet.text}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2 font-mono">
                                            ID: {tweet.tweetId}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Asset Selection */}
                        <div className="space-y-2">
                            <Label className="text-base">Reward Asset</Label>
                            <Select
                                value={selectedAssetId}
                                onValueChange={setSelectedAssetId}
                                disabled={isAssetsLoading}
                            >
                                <SelectTrigger className="h-12 bg-gray-800 border-gray-700">
                                    <SelectValue placeholder="Select asset" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    {assets?.assets?.map((asset) => (
                                        <SelectItem
                                            key={asset.id}
                                            value={asset.id}
                                            className="hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-3">
                                                {asset.iconUrl && (
                                                    <Image
                                                        src={asset.iconUrl}
                                                        alt={asset.name}
                                                        width={24}
                                                        height={24}
                                                        className="rounded-full"
                                                    />
                                                )}
                                                <span className="font-medium">
                                                    {asset.name}
                                                </span>
                                                <span className="text-gray-400">
                                                    ({asset.symbol})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label className="text-base">Amount</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="h-12 pr-24 bg-gray-800 border-gray-700 text-lg"
                                />
                                {selectedAsset && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-md">
                                        {selectedAsset.iconUrl && (
                                            <Image
                                                src={selectedAsset.iconUrl}
                                                alt={selectedAsset.symbol}
                                                width={20}
                                                height={20}
                                                className="rounded-full"
                                            />
                                        )}
                                        <span className="text-sm font-medium text-gray-300">
                                            {selectedAsset.symbol}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label className="text-base flex justify-between items-center">
                            Reason (Optional)
                            {/* Force to change reason */}
                            <div className="space-y-2 flex flex-row items-center justify-end gap-2">
                                <Label className="text-base">
                                    Force to change reason
                                </Label>
                                <Checkbox
                                    checked={forceToChangeReason}
                                    onCheckedChange={(checked) =>
                                        setForceToChangeReason(
                                            checked === "indeterminate"
                                                ? false
                                                : checked
                                        )
                                    }
                                />
                            </div>
                        </Label>
                        <Textarea
                            value={reason}
                            disabled={!forceToChangeReason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for this reward"
                            rows={3}
                            className="bg-gray-800 border-gray-700"
                        />
                    </div>

                    {/* Warning for unconnected author */}
                    {selectedAuthor && !selectedAuthor.playerId && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-yellow-400">
                                        Author Not Connected
                                    </p>
                                    <p className="text-yellow-200/80 mt-1">
                                        This X account is not connected to a
                                        Starglow player account. The author
                                        needs to connect their account first to
                                        receive rewards.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="min-w-[100px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            !selectedAssetId ||
                            !amount ||
                            !selectedAuthor?.playerId
                        }
                        className={cn(
                            "min-w-[140px]",
                            "bg-purple-600 hover:bg-purple-700",
                            "disabled:bg-gray-700"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Reward
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
