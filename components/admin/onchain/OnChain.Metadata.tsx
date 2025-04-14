/// components\admin\onchain\OnChain.Metadata.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/app/hooks/useToast";
import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";
import {
    useCreateGroup,
    useUploadFiles,
    useLinkableMetadata,
    useCreateMetadata,
} from "@/app/hooks/useIpfs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, RefreshCw, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { METADATA_TYPE } from "@/app/actions/ipfs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// 메타데이터 폼 타입
export type MetadataFormValues = Omit<METADATA_TYPE, "background_color"> & {
    background_color?: string;
    collectionName: string;
};

// Zod 스키마
const metadataFormSchema = z.object({
    name: z.string().min(1, "Please enter a name"),
    description: z.string().min(1, "Please enter a description"),
    image: z.string().min(1, "Image URL is required"),
    external_url: z.string().url("Please enter a valid URL"),
    background_color: z
        .string()
        .regex(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i, "Invalid color code")
        .optional()
        .or(z.literal("")),
    animation_url: z
        .string()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    youtube_url: z.string().optional(),
    attributes: z
        .array(
            z.object({
                trait_type: z.string().min(1, "Trait type is required"),
                value: z.string().min(1, "Value is required"),
                display_type: z
                    .enum([
                        "number",
                        "boost_number",
                        "boost_percentage",
                        "date",
                        "string",
                    ])
                    .optional(),
                max_value: z.number().optional(),
            })
        )
        .default([]),
    properties: z.record(z.unknown()).optional(),
    collectionName: z.string().min(1, "Collection name is required"),
}) satisfies z.ZodType<MetadataFormValues>;

interface OnChainMetadataProps {
    onSelect?: (metadataId: string) => void;
    selectedMetadataId?: string | null;
}

export function OnChainMetadata({
    onSelect,
    selectedMetadataId,
}: OnChainMetadataProps) {
    const toast = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("create");
    const [showPreview, setShowPreview] = useState(false);
    const [previewMetadata, setPreviewMetadata] =
        useState<METADATA_TYPE | null>(null);

    const createGroupMutation = useCreateGroup();
    const uploadFilesMutation = useUploadFiles();
    const createMetadataMutation = useCreateMetadata();
    const { data: linkableMetadata, isLoading: isLoadingMetadata } =
        useLinkableMetadata();

    const form = useForm<MetadataFormValues>({
        resolver: zodResolver(metadataFormSchema),
        defaultValues: {
            name: "",
            description: "",
            image: "",
            external_url: "",
            background_color: "",
            animation_url: "",
            attributes: [],
            collectionName: "",
        },
    });

    // 그룹 생성 함수
    const handleCreateGroup = async () => {
        const collectionName = form.watch("collectionName");
        const description = form.watch("description");

        if (!collectionName) {
            toast.error("Collection name is required");
            return;
        }

        try {
            const result = await createGroupMutation.mutateAsync(
                collectionName
            );
            setCurrentGroupId(result.id);
            toast.success("Collection group created successfully");
        } catch (error) {
            console.error("Error creating collection group:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create collection group"
            );
        }
    };

    const onSubmit = async (data: MetadataFormValues) => {
        try {
            setIsUploading(true);
            if (!currentGroupId) {
                toast.error("Please create a collection group first");
                return;
            }

            const { collectionName, ...metadataFields } = data;
            const response = await createMetadataMutation.mutateAsync({
                metadata: metadataFields as METADATA_TYPE,
                groupId: currentGroupId,
            });

            if (onSelect) {
                onSelect(response.id);
            }
            toast.success("Metadata created successfully");
            form.reset();
        } catch (error) {
            console.error("Error creating metadata:", error);
            toast.error("Failed to create metadata");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return;
        if (!currentGroupId) {
            toast.error("Please create a collection group first");
            return;
        }

        try {
            setIsUploading(true);
            const result = await uploadFilesMutation.mutateAsync({
                files,
                groupId: currentGroupId,
            });

            if (result.cid) {
                const ipfsUrl = `ipfs://${result.cid}`;
                form.setValue("image", ipfsUrl);
                toast.success("Image uploaded successfully");
            } else {
                throw new Error("Failed to upload image - No CID returned");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to upload image"
            );
        } finally {
            setIsUploading(false);
        }
    };

    // Attributes 관리 함수들
    const addAttribute = () => {
        const currentAttributes = form.getValues("attributes") || [];
        form.setValue("attributes", [
            ...currentAttributes,
            { trait_type: "", value: "" },
        ]);
    };

    const removeAttribute = (index: number) => {
        const currentAttributes = form.getValues("attributes") || [];
        form.setValue(
            "attributes",
            currentAttributes.filter((_, i) => i !== index)
        );
    };

    // 메타데이터 미리보기 핸들러
    const handlePreview = (metadata: METADATA_TYPE) => {
        setPreviewMetadata(metadata);
        setShowPreview(true);
    };

    // IPFS URL을 HTTP URL로 변환
    const getHttpUrl = (ipfsUrl: string) => {
        if (!ipfsUrl) return "";
        if (ipfsUrl.startsWith("ipfs://")) {
            return ipfsUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
        }
        return ipfsUrl;
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create Metadata</TabsTrigger>
                    <TabsTrigger value="list">Select Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create NFT Metadata</CardTitle>
                            <CardDescription>
                                Create metadata for your NFT collection
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        {/* Step 1: Create Collection Group */}
                                        <div className="space-y-4 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-md font-medium">
                                                    1. Create Collection Group
                                                </h3>
                                                {currentGroupId && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-green-500"
                                                    >
                                                        Collection Group Ready
                                                    </Badge>
                                                )}
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="collectionName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Collection Name
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter collection name"
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
                                                                placeholder="Description of the collection"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                type="button"
                                                onClick={handleCreateGroup}
                                                disabled={
                                                    createGroupMutation.isPending ||
                                                    !!currentGroupId
                                                }
                                                className="w-full"
                                            >
                                                {createGroupMutation.isPending ? (
                                                    <>
                                                        <Spinner
                                                            className="mr-2"
                                                            size="sm"
                                                        />
                                                        Creating Collection
                                                        Group...
                                                    </>
                                                ) : currentGroupId ? (
                                                    "Collection Group Created"
                                                ) : (
                                                    "Create Collection Group"
                                                )}
                                            </Button>
                                        </div>

                                        {/* Step 2: NFT Metadata */}
                                        <div className="space-y-4">
                                            <h3 className="text-md font-medium">
                                                2. NFT Metadata
                                            </h3>

                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            NFT Name
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter NFT name"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="space-y-2">
                                                <FormLabel>Image</FormLabel>
                                                <FileUploaderIPFS
                                                    onComplete={
                                                        handleFileUpload
                                                    }
                                                    multiple={false}
                                                />
                                            </div>

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
                                                                placeholder="IPFS URL or HTTP URL"
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
                                                                placeholder="https://..."
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            External website URL
                                                            for the NFT
                                                        </FormDescription>
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
                                                                type="color"
                                                                {...field}
                                                                className="h-10 px-2"
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Background color for
                                                            NFT display
                                                            (optional)
                                                        </FormDescription>
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
                                                                placeholder="https://..."
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            URL to a multimedia
                                                            attachment
                                                            (optional)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Attributes Section */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <FormLabel>
                                                        Attributes
                                                    </FormLabel>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={addAttribute}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Attribute
                                                    </Button>
                                                </div>

                                                {form
                                                    .watch("attributes")
                                                    ?.map((_, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex gap-2 items-start"
                                                        >
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`attributes.${index}.trait_type`}
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex-1">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Trait Type"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`attributes.${index}.value`}
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex-1">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Value"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    removeAttribute(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={
                                                isUploading || !currentGroupId
                                            }
                                            className="w-full"
                                        >
                                            {isUploading
                                                ? "Creating..."
                                                : "Create Metadata"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Metadata</CardTitle>
                            <CardDescription>
                                Select metadata to link with your collection
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingMetadata ? (
                                <div className="flex items-center justify-center py-8">
                                    <Spinner className="mr-2" />
                                    <span>Loading metadata...</span>
                                </div>
                            ) : linkableMetadata &&
                              linkableMetadata.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                Select
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>IPFS URL</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead className="w-[100px]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {linkableMetadata.map((metadata) => {
                                            const meta =
                                                metadata.metadata as METADATA_TYPE;
                                            return (
                                                <TableRow
                                                    key={metadata.id}
                                                    className={
                                                        selectedMetadataId ===
                                                        metadata.id
                                                            ? "bg-muted/50"
                                                            : ""
                                                    }
                                                >
                                                    <TableCell>
                                                        <input
                                                            type="radio"
                                                            name="metadata-selection"
                                                            checked={
                                                                selectedMetadataId ===
                                                                metadata.id
                                                            }
                                                            onChange={() =>
                                                                onSelect?.(
                                                                    metadata.id
                                                                )
                                                            }
                                                            className="w-4 h-4"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {meta.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {meta.description}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {meta.image}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(
                                                            metadata.createdAt
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handlePreview(
                                                                    meta
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No metadata available.</p>
                                    <p className="text-sm mt-2">
                                        Create new metadata in the &apos;Create
                                        Metadata&apos; tab.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* 메타데이터 미리보기 모달 */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Metadata Preview</DialogTitle>
                        <DialogDescription>
                            Preview the metadata content and image
                        </DialogDescription>
                    </DialogHeader>

                    {previewMetadata && (
                        <div className="space-y-6">
                            {/* 이미지 미리보기 */}
                            <div className="aspect-square w-full max-w-md mx-auto bg-black/5 rounded-lg overflow-hidden">
                                <img
                                    src={getHttpUrl(previewMetadata.image)}
                                    alt={previewMetadata.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* 메타데이터 정보 */}
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Name</h4>
                                    <p>{previewMetadata.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Description</h4>
                                    <p>{previewMetadata.description}</p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">
                                        External URL
                                    </h4>
                                    <p className="font-mono text-sm">
                                        {previewMetadata.external_url}
                                    </p>
                                </div>

                                {previewMetadata.animation_url && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Animation URL
                                        </h4>
                                        <p className="font-mono text-sm">
                                            {previewMetadata.animation_url}
                                        </p>
                                    </div>
                                )}

                                {/* Attributes */}
                                {previewMetadata.attributes &&
                                    previewMetadata.attributes.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">
                                                Attributes
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {previewMetadata.attributes.map(
                                                    (attr, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-muted p-2 rounded-md"
                                                        >
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    attr.trait_type
                                                                }
                                                            </p>
                                                            <p className="font-medium">
                                                                {attr.value}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowPreview(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
