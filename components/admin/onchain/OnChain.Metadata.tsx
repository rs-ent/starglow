/// components\admin\onchain\OnChain.Metadata.tsx

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useFiles } from "@/app/hooks/useFiles";
import { IPFSUploadResult } from "@/app/actions/files";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Copy,
    ExternalLink,
    RefreshCw,
    XCircle,
    Eye,
    FileJson,
    Link2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/app/hooks/useToast";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { NFTMetadata } from "./OnChain.types";
import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";
import Popup from "@/components/atoms/Popup";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useIPFSMetadata } from "@/app/queries/filesQueries";

// 메타데이터 폼 스키마
const metadataFormSchema = z.object({
    name: z.string().min(1, "Please enter a name"),
    description: z.string().min(1, "Please enter a description"),
    image: z.string().min(1, "Image URL is required for OpenSea compatibility"),
    attributes: z
        .array(
            z.object({
                trait_type: z.string().min(1, "Trait type is required"),
                value: z.string().min(1, "Value is required"),
            })
        )
        .optional(),
    external_url: z
        .string()
        .optional()
        .refine((val) => !val || /^https?:\/\/.+/.test(val), {
            message: "Must be a valid URL or empty",
        }),
    background_color: z
        .string()
        .regex(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i, "Invalid color code")
        .optional(),
    animation_url: z
        .string()
        .optional()
        .refine((val) => !val || /^https?:\/\/.+/.test(val), {
            message: "Must be a valid URL or empty",
        }),
    isGroupUpload: z.boolean().default(true),
    groupName: z.string().optional(),
    groupId: z.string().optional(),
});

type MetadataFormValues = z.infer<typeof metadataFormSchema>;

export interface OnChainMetadataProps {
    onMetadataUploaded?: (result: IPFSUploadResult) => void;
}

// 명확한 인터페이스 정의
interface IPFSGroupFile {
    id: string;
    cid: string;
    ipfsUrl: string;
    gatewayUrl: string;
    type: string;
    metadata?: string;
    createdAt: Date;
}

interface IPFSGroup {
    id: string;
    name: string;
    description?: string | null;
    isPublic: boolean;
    files?: IPFSGroupFile[];
    _count?: { files: number };
    createdAt: Date;
    updatedAt: Date;
}

export default function OnChainMetadata({
    onMetadataUploaded,
}: OnChainMetadataProps) {
    const toast = useToast();
    const {
        uploadMetadataToIPFSGroup,
        isUploadingToIPFS,
        listGroups,
        getGroup,
        createIpfsGroup,
    } = useFiles();

    // 불필요한 상태 제거
    const [viewMetadata, setViewMetadata] = useState<IPFSUploadResult | null>(
        null
    );
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // 그룹 데이터 상태
    const [groups, setGroups] = useState<IPFSGroup[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    // 폼 설정
    const form = useForm({
        resolver: zodResolver(metadataFormSchema),
        defaultValues: {
            name: "",
            description: "",
            image: "",
            attributes: [
                {
                    trait_type: "glowStart",
                    value: "2030-01-01",
                },
                {
                    trait_type: "glowEnd",
                    value: "2030-12-31",
                },
                {
                    trait_type: "reportUrl",
                    value: "https://report.starglow.io/",
                },
                {
                    trait_type: "revenueShare",
                    value: "10%",
                },
            ],
            external_url: "",
            background_color: "",
            animation_url: "",
            groupName: "", // 그룹명 기본값 빈 문자열
        },
    });

    // 그룹 목록 로딩 - 한 번만 호출되도록 수정
    const loadGroups = useCallback(async () => {
        if (isLoadingGroups) return; // 이미 로딩 중이면 중복 호출 방지
        setIsLoadingGroups(true);
        try {
            const result = await listGroups(100);
            if (result.success) {
                setGroups(result.groups);
            } else {
                toast.error(result.error || "Failed to load groups");
            }
        } catch (error) {
            console.error("Error loading groups:", error);
            toast.error("Failed to load groups");
        } finally {
            setIsLoadingGroups(false);
        }
    }, [listGroups, isLoadingGroups]);

    // 그룹 생성 함수
    const createGroup = useCallback(
        async (name: string, description: string) => {
            setIsCreatingGroup(true);
            try {
                const result = await createIpfsGroup(name, description, true); // 공개 그룹으로 생성
                if (result.success && result.group) {
                    setCurrentGroupId(result.group.id);
                    toast.success("Pinata group created successfully");
                    return result.group.id;
                } else {
                    toast.error(
                        result.error || "Failed to create pinata group"
                    );
                }
            } catch (error) {
                console.error("Error creating pinata group:", error);
                toast.error("Failed to create pinata group");
            } finally {
                setIsCreatingGroup(false);
            }
            return null;
        },
        [createIpfsGroup]
    );

    // 폼 제출 함수 수정
    const onSubmit = async (data: MetadataFormValues) => {
        try {
            // 1단계: 그룹 생성 (또는 기존 그룹 ID 사용)
            const groupId =
                currentGroupId ||
                (await createGroup(
                    data.groupName || `${data.name}-collection`,
                    data.description
                ));

            if (!groupId) {
                toast.error("Failed to create or get group");
                return;
            }

            // 2단계: 메타데이터 객체 구성
            const metadata: NFTMetadata = {
                ...data,
                image: data.image || "",
                attributes: data.attributes?.filter(
                    (attr) =>
                        attr.trait_type?.trim() !== "" &&
                        attr.value?.trim() !== ""
                ),
            };

            // 3단계: 그룹 ID를 사용해 메타데이터 업로드
            const result = await uploadMetadataToIPFSGroup(
                metadata,
                undefined, // 그룹명 불필요
                groupId, // 그룹 ID 사용
                data.description
            );

            if (result.success) {
                form.reset();
                setCurrentGroupId(null); // 상태 초기화
                toast.success("Successfully uploaded metadata to pinata group");

                if (onMetadataUploaded) {
                    onMetadataUploaded(result);
                }
            } else {
                toast.error(result.error || "Failed to upload metadata");
            }
        } catch (error) {
            console.error("Error uploading metadata:", error);
            toast.error("Failed to upload metadata");
        }
    };

    // 파일 업로드 핸들러 수정
    const handleFileUploadComplete = useCallback(
        (
            files: {
                id: string;
                url: string;
                cid?: string;
                ipfsUrl?: string;
                groupId?: string;
            }[]
        ) => {
            if (files.length > 0) {
                // IPFS URL 설정
                const imageUrl = files[0].ipfsUrl || files[0].url;
                form.setValue("image", imageUrl);

                // 파일의 groupId 저장
                if (files[0].groupId) {
                    setCurrentGroupId(files[0].groupId);
                }

                toast.success(`Image uploaded successfully to IPFS`);
            }
        },
        [form]
    );

    // 메타데이터 뷰어 열기/닫기 핸들러 수정
    const openMetadataViewer = useCallback((file: IPFSGroupFile) => {
        setViewMetadata({
            success: true,
            cid: file.cid,
            ipfsUrl: file.ipfsUrl,
            gatewayUrl: file.gatewayUrl,
        });
        setIsViewerOpen(true);
    }, []);

    const closeMetadataViewer = useCallback(() => {
        setIsViewerOpen(false);
        // 뷰어가 닫히면 메타데이터 정보 초기화 (중요! 무한 로딩 방지)
        setViewMetadata(null);
    }, []);

    // viewMetadata 상태에 따라 최적화된 훅 사용
    // cid가 없을 때는 불필요한 API 호출을 하지 않음
    const cid = viewMetadata?.cid || "";
    // 훅 사용 규칙을 준수하도록 수정 - 최상위 레벨에서 호출
    const {
        data,
        isLoading: isLoadingSelectedMetadata,
        error: selectedMetadataError,
    } = useIPFSMetadata(isViewerOpen ? cid : "");

    // 메타데이터 내용 안전하게 접근
    const selectedMetadataContent = data?.metadata;

    // 클립보드에 복사
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    // 외부 링크 열기
    const openExternalLink = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // IPFS URL을 게이트웨이 URL로 변환하는 함수
    const convertToGatewayUrl = (ipfsUrl: string): string => {
        if (!ipfsUrl) return "";

        // ipfs:// 형식 처리
        if (ipfsUrl.startsWith("ipfs://")) {
            const cid = ipfsUrl.replace("ipfs://", "");
            return `https://ipfs.io/ipfs/${cid}`;
        }

        // 이미 HTTP URL인 경우 그대로 반환
        if (ipfsUrl.startsWith("http")) {
            return ipfsUrl;
        }

        return ipfsUrl;
    };

    return (
        <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload Metadata</TabsTrigger>
                <TabsTrigger value="history">Metadata History</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Create NFT Metadata</CardTitle>
                        <CardDescription>
                            Create and upload NFT metadata to IPFS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* 1단계: 그룹 생성 섹션 */}
                                <div className="space-y-4 border-b pb-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-md font-medium">
                                            1. Create Pinata Group
                                        </h3>
                                        {currentGroupId ? (
                                            <Badge
                                                variant="outline"
                                                className="text-green-500"
                                            >
                                                Pinata Group Ready
                                            </Badge>
                                        ) : null}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="groupName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Pinata Group Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Default: [NFT Name]-collection"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            isCreatingGroup || !!currentGroupId
                                        }
                                        onClick={() =>
                                            createGroup(
                                                form.watch("groupName") ||
                                                    `${form.watch(
                                                        "name"
                                                    )}-collection`,
                                                form.watch("description")
                                            )
                                        }
                                        className="w-full"
                                    >
                                        {isCreatingGroup ? (
                                            <>
                                                <Spinner
                                                    className="mr-2"
                                                    size="sm"
                                                />
                                                Creating Pinata Group...
                                            </>
                                        ) : currentGroupId ? (
                                            "Pinata Group Created"
                                        ) : (
                                            "Create Pinata Group"
                                        )}
                                    </Button>
                                </div>

                                {/* 2단계: 이미지 업로드 섹션 */}
                                <div className="space-y-4 border-b pb-4">
                                    <h3 className="text-md font-medium">
                                        2. Upload Image
                                    </h3>
                                    <div className="space-y-2">
                                        <FileUploaderIPFS
                                            bucket="nft-images"
                                            purpose="nft-metadata"
                                            multiple={false}
                                            optimizeImages={true}
                                            accept={{
                                                "image/*": [
                                                    ".png",
                                                    ".jpg",
                                                    ".jpeg",
                                                    ".gif",
                                                    ".webp",
                                                ],
                                            }}
                                            groupId={
                                                currentGroupId || undefined
                                            }
                                            onComplete={
                                                handleFileUploadComplete
                                            }
                                        />

                                        <FormField
                                            control={form.control}
                                            name="image"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Image URL
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="IPFS URL"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* 3단계: 메타데이터 설정 및 업로드 */}
                                <div className="space-y-4">
                                    <h3 className="text-md font-medium">
                                        3. Configure & Upload Metadata
                                    </h3>

                                    {/* 나머지 폼 필드들 */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NFT Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="NFT Name"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Description
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Description of the NFT"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="external_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    External URL
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="External URL"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="background_color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Background Color
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Background Color"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="animation_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Animation URL
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Animation URL"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isUploadingToIPFS}
                                    >
                                        {isUploadingToIPFS ? (
                                            <>
                                                <Spinner
                                                    className="mr-2"
                                                    size="sm"
                                                />
                                                Uploading Metadata...
                                            </>
                                        ) : (
                                            "Upload Metadata"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
                {/* 컬렉션 목록 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>NFT Metadata</CardTitle>
                            <CardDescription>
                                Manage your NFT metadata collections
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadGroups()}
                            disabled={isLoadingGroups}
                            className="flex items-center gap-1"
                        >
                            {isLoadingGroups ? (
                                <Spinner className="h-4 w-4 mr-1" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoadingGroups ? (
                            <div className="py-8 text-center">
                                <Spinner className="mx-auto" />
                                <p className="mt-2">Loading collections...</p>
                            </div>
                        ) : groups.length > 0 ? (
                            <div className="space-y-6">
                                {groups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="border rounded-lg p-4"
                                    >
                                        {/* 그룹 헤더 */}
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    {group.name}
                                                </h3>
                                                {group.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        group.isPublic
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {group.isPublic
                                                        ? "Public"
                                                        : "Private"}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {group._count?.files || 0}{" "}
                                                    files
                                                </span>
                                            </div>
                                        </div>

                                        {/* 그룹 파일 목록 */}
                                        {group.files &&
                                        group.files.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Type
                                                        </TableHead>
                                                        <TableHead>
                                                            CID
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.files.map((file) => (
                                                        <TableRow key={file.id}>
                                                            <TableCell>
                                                                {file.type}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs">
                                                                {file.cid.substring(
                                                                    0,
                                                                    16
                                                                )}
                                                                ...
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        copyToClipboard(
                                                                            file.cid,
                                                                            "CID"
                                                                        )
                                                                    }
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end space-x-1">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            openMetadataViewer(
                                                                                file
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        View
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            openExternalLink(
                                                                                file.gatewayUrl
                                                                            )
                                                                        }
                                                                    >
                                                                        <ExternalLink className="h-4 w-4 mr-1" />
                                                                        Gateway
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">
                                                No files in this collection
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <p>No collections found.</p>
                                <p className="text-sm mt-2">
                                    Create new metadata in the 'Upload Metadata'
                                    tab.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 메타데이터 뷰어 팝업 */}
            <Popup
                open={isViewerOpen}
                onClose={closeMetadataViewer}
                width="min(90vw, 800px)"
                height="90vh"
                className="p-6 bg-gray-800"
            >
                <div className="h-full overflow-auto">
                    <h3 className="text-xl font-semibold mb-4">
                        Metadata Details
                    </h3>
                    <div className="flex gap-2 flex-wrap mb-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                viewMetadata?.cid &&
                                copyToClipboard(viewMetadata.cid, "CID")
                            }
                            className="flex items-center gap-1"
                        >
                            <Copy className="h-4 w-4" />
                            Copy CID
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                viewMetadata?.ipfsUrl &&
                                copyToClipboard(
                                    viewMetadata.ipfsUrl,
                                    "IPFS URL"
                                )
                            }
                            className="flex items-center gap-1"
                        >
                            <FileJson className="h-4 w-4" />
                            Copy IPFS URI
                        </Button>

                        {viewMetadata?.gatewayUrl && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    openExternalLink(
                                        viewMetadata.gatewayUrl || ""
                                    )
                                }
                                className="flex items-center gap-1"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View in Gateway
                            </Button>
                        )}
                    </div>

                    <div className="bg-muted p-3 rounded-md mb-4 font-mono text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <span className="font-semibold min-w-[80px]">
                                CID:
                            </span>
                            <code className="bg-black/10 dark:bg-white/10 p-1 rounded flex-1 overflow-auto">
                                {viewMetadata?.cid}
                            </code>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-semibold min-w-[80px]">
                                IPFS URI:
                            </span>
                            <code className="bg-black/10 dark:bg-white/10 p-1 rounded flex-1 overflow-auto">
                                {viewMetadata?.ipfsUrl}
                            </code>
                        </div>
                    </div>

                    <div className="h-[calc(100%-200px)] overflow-auto">
                        {isLoadingSelectedMetadata ? (
                            <div className="py-8 text-center">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p>Loading metadata...</p>
                            </div>
                        ) : selectedMetadataError ? (
                            <div className="py-8 text-center text-red-500">
                                <p>Error loading metadata.</p>
                                <p className="text-sm">
                                    {String(selectedMetadataError)}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-md overflow-hidden border">
                                    <div className="bg-muted p-2 border-b font-medium">
                                        JSON Metadata
                                    </div>
                                    <pre className="bg-slate-900 p-4 overflow-auto text-sm max-h-[300px] whitespace-pre-wrap">
                                        {JSON.stringify(
                                            selectedMetadataContent,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>

                                {selectedMetadataContent?.image && (
                                    <div className="rounded-md overflow-hidden border">
                                        <div className="bg-muted p-2 border-b font-medium">
                                            Image Preview
                                        </div>
                                        <div className="p-4 flex justify-center bg-black">
                                            <img
                                                src={convertToGatewayUrl(
                                                    selectedMetadataContent.image
                                                )}
                                                alt="NFT Preview"
                                                className="max-w-full max-h-60 object-contain rounded-md"
                                                onError={(e) => {
                                                    console.error(
                                                        "Image loading error:",
                                                        selectedMetadataContent.image
                                                    );
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        "https://placehold.co/400x400/png?text=Image+Not+Available";
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Popup>
        </Tabs>
    );
}
