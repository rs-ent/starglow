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
import { useIpfs } from "@/app/hooks/useIpfs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, RefreshCw, Eye, Calendar } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils/tailwind";
import { UploadResponse } from "pinata";
import { Metadata } from "@prisma/client";

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

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
                value: z.union([
                    z.string().min(1, "Value is required"),
                    z.number(),
                ]),
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
    onSelect?: (metadata: Metadata) => void;
    selectedMetadata?: Metadata | null;
}

export function OnChainMetadata({
    onSelect,
    selectedMetadata,
}: OnChainMetadataProps) {
    const toast = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("create");
    const [showPreview, setShowPreview] = useState(false);
    const [previewMetadata, setPreviewMetadata] =
        useState<METADATA_TYPE | null>(null);
    const [groupSelectionMode, setGroupSelectionMode] = useState<
        "create" | "select"
    >("create");

    const {
        createGroup,
        uploadNftMetadata,
        linkableMetadata,
        groups,

        isCreatingGroup,
        isLoadingLinkableMetadata,
        isLoadingGroups,
    } = useIpfs();

    const form = useForm<MetadataFormValues>({
        resolver: zodResolver(metadataFormSchema),
        defaultValues: {
            name: "",
            description: "",
            image: "",
            external_url: "https://report.starglow.io/",
            background_color: "",
            animation_url: "",
            attributes: [
                {
                    trait_type: "Glow Start",
                    value: Math.floor(new Date(2026, 1, 1).getTime() / 1000),
                    display_type: "date",
                },
                {
                    trait_type: "Glow End",
                    value: Math.floor(new Date(2026, 12, 31).getTime() / 1000),
                    display_type: "date",
                },
                {
                    trait_type: "Share Percentage",
                    value: 10,
                    display_type: "boost_percentage",
                },
            ],
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
            const result = await createGroup(collectionName);
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
        console.log("Form submission started", { data });
        try {
            setIsUploading(true);
            if (!currentGroupId) {
                console.log("No currentGroupId available");
                toast.error("Please create a collection group first");
                return;
            }

            console.log(
                "Preparing to submit metadata with groupId:",
                currentGroupId
            );
            const { collectionName, ...metadataFields } = data;
            console.log("Submitting metadata:", metadataFields);

            const response = await uploadNftMetadata(
                metadataFields as METADATA_TYPE,
                {
                    groupId: currentGroupId,
                    gateway: PINATA_GATEWAY,
                }
            );

            console.log("Metadata creation successful:", response);
            toast.success("Metadata created successfully");
            form.reset();
        } catch (error) {
            console.error("Error creating metadata:", error);
            toast.error("Failed to create metadata");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (results: UploadResponse[]) => {
        if (results.length === 0) return;
        if (!currentGroupId) {
            toast.error("Please create a collection group first");
            return;
        }

        try {
            setIsUploading(true);
            const result = results[0];

            if (result.cid) {
                const ipfsUrl = `${PINATA_GATEWAY}${result.cid}`;
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
            return ipfsUrl.replace(
                "ipfs://",
                PINATA_GATEWAY ?? "https://ipfs.io/ipfs/"
            );
        }
        return ipfsUrl;
    };

    // Group selection handler
    const handleGroupSelection = (groupId: string) => {
        setCurrentGroupId(groupId);

        // Find the selected group to get its name
        const selectedGroup = groups?.find((group) => group.id === groupId);
        if (selectedGroup) {
            // Set the collectionName field with the selected group's name
            form.setValue("collectionName", selectedGroup.name);

            // Also set the NFT name field with the same name as default
            form.setValue("name", selectedGroup.name);
        }

        toast.success("Collection group selected");
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
                                    onSubmit={form.handleSubmit(
                                        onSubmit,
                                        (errors) => {
                                            console.log(
                                                "Form validation failed",
                                                errors
                                            );
                                            toast.error(
                                                `Please fix the form errors before submitting`
                                            );
                                        }
                                    )}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        {/* Step 1: Create or Select Collection Group */}
                                        <div className="space-y-4 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-md font-medium">
                                                    1. Collection Group
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

                                            <div className="space-y-4">
                                                <FormItem>
                                                    <FormLabel>
                                                        Select Collection Group
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            handleGroupSelection
                                                        }
                                                        value={
                                                            currentGroupId ||
                                                            undefined
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a collection group" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {groups &&
                                                            groups.length >
                                                                0 ? (
                                                                groups.map(
                                                                    (group) => (
                                                                        <SelectItem
                                                                            key={
                                                                                group.id
                                                                            }
                                                                            value={
                                                                                group.id
                                                                            }
                                                                        >
                                                                            {
                                                                                group.name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )
                                                            ) : (
                                                                <SelectItem
                                                                    value="empty"
                                                                    disabled
                                                                >
                                                                    No groups
                                                                    available
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        Choose an existing
                                                        collection group or
                                                        create a new one
                                                    </FormDescription>
                                                </FormItem>

                                                <div className="flex gap-2 items-center justify-between">
                                                    <FormField
                                                        control={form.control}
                                                        name="collectionName"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Collection
                                                                    Name
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter collection name"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    {currentGroupId
                                                                        ? "Collection name from selected group"
                                                                        : "Enter a name for your new collection group"}
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {!currentGroupId && (
                                                        <Button
                                                            type="button"
                                                            onClick={
                                                                handleCreateGroup
                                                            }
                                                            disabled={
                                                                isCreatingGroup
                                                            }
                                                            className="w-52 h-10"
                                                        >
                                                            {isCreatingGroup ? (
                                                                <>
                                                                    <Spinner
                                                                        className="mr-2"
                                                                        size="sm"
                                                                    />
                                                                    Creating
                                                                    Collection
                                                                    Group...
                                                                </>
                                                            ) : (
                                                                "Create New Collection Group"
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
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
                                                                    placeholder="Description of the collection and metadata"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
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
                                                    groupId={
                                                        currentGroupId ??
                                                        undefined
                                                    }
                                                    gateway={PINATA_GATEWAY}
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

                                                            {/* Display Type Select */}
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`attributes.${index}.display_type`}
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex-1">
                                                                        <Select
                                                                            onValueChange={
                                                                                field.onChange
                                                                            }
                                                                            defaultValue={
                                                                                field.value
                                                                            }
                                                                            value={
                                                                                field.value
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Type" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="string">
                                                                                    Text
                                                                                </SelectItem>
                                                                                <SelectItem value="number">
                                                                                    Number
                                                                                </SelectItem>
                                                                                <SelectItem value="boost_number">
                                                                                    Boost
                                                                                    Number
                                                                                </SelectItem>
                                                                                <SelectItem value="boost_percentage">
                                                                                    Percentage
                                                                                </SelectItem>
                                                                                <SelectItem value="date">
                                                                                    Date
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            {/* Value Field (changes based on display_type) */}
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`attributes.${index}.value`}
                                                                render={({
                                                                    field,
                                                                }) => {
                                                                    const displayType =
                                                                        form.watch(
                                                                            `attributes.${index}.display_type`
                                                                        );

                                                                    // Date picker for date display type
                                                                    if (
                                                                        displayType ===
                                                                        "date"
                                                                    ) {
                                                                        return (
                                                                            <FormItem className="flex-1">
                                                                                <Popover>
                                                                                    <PopoverTrigger
                                                                                        asChild
                                                                                    >
                                                                                        <FormControl>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                className={cn(
                                                                                                    "w-full pl-3 text-left font-normal",
                                                                                                    !field.value &&
                                                                                                        "text-muted-foreground"
                                                                                                )}
                                                                                            >
                                                                                                {field.value ? (
                                                                                                    format(
                                                                                                        // If field.value is a timestamp (number), convert to Date
                                                                                                        typeof field.value ===
                                                                                                            "number"
                                                                                                            ? new Date(
                                                                                                                  field.value *
                                                                                                                      1000
                                                                                                              )
                                                                                                            : new Date(),
                                                                                                        "PPP"
                                                                                                    )
                                                                                                ) : (
                                                                                                    <span>
                                                                                                        Pick
                                                                                                        a
                                                                                                        date
                                                                                                    </span>
                                                                                                )}
                                                                                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                                                            </Button>
                                                                                        </FormControl>
                                                                                    </PopoverTrigger>
                                                                                    <PopoverContent
                                                                                        className="w-auto p-0"
                                                                                        align="start"
                                                                                    >
                                                                                        <CalendarComponent
                                                                                            mode="single"
                                                                                            selected={
                                                                                                typeof field.value ===
                                                                                                "number"
                                                                                                    ? new Date(
                                                                                                          field.value *
                                                                                                              1000
                                                                                                      )
                                                                                                    : undefined
                                                                                            }
                                                                                            onSelect={(
                                                                                                date
                                                                                            ) => {
                                                                                                if (
                                                                                                    date
                                                                                                ) {
                                                                                                    // Convert to Unix timestamp (seconds)
                                                                                                    field.onChange(
                                                                                                        Math.floor(
                                                                                                            date.getTime() /
                                                                                                                1000
                                                                                                        )
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                            initialFocus
                                                                                        />
                                                                                    </PopoverContent>
                                                                                </Popover>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        );
                                                                    }

                                                                    // Number inputs for numeric types
                                                                    if (
                                                                        [
                                                                            "number",
                                                                            "boost_number",
                                                                            "boost_percentage",
                                                                        ].includes(
                                                                            displayType ||
                                                                                ""
                                                                        )
                                                                    ) {
                                                                        return (
                                                                            <div className="flex-1 space-y-2">
                                                                                <FormItem>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            type="number"
                                                                                            placeholder="Value"
                                                                                            {...field}
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                // Convert string to number for numeric fields
                                                                                                field.onChange(
                                                                                                    Number(
                                                                                                        e
                                                                                                            .target
                                                                                                            .value
                                                                                                    )
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>

                                                                                {/* Max Value field for boost types */}
                                                                                {[
                                                                                    "boost_number",
                                                                                    "boost_percentage",
                                                                                ].includes(
                                                                                    displayType ||
                                                                                        ""
                                                                                ) && (
                                                                                    <FormField
                                                                                        control={
                                                                                            form.control
                                                                                        }
                                                                                        name={`attributes.${index}.max_value`}
                                                                                        render={({
                                                                                            field: maxValueField,
                                                                                        }) => (
                                                                                            <FormItem>
                                                                                                <FormControl>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        placeholder="Max Value"
                                                                                                        {...maxValueField}
                                                                                                        onChange={(
                                                                                                            e
                                                                                                        ) => {
                                                                                                            maxValueField.onChange(
                                                                                                                Number(
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <FormDescription className="text-xs">
                                                                                                    최대값
                                                                                                    (진행
                                                                                                    바용)
                                                                                                </FormDescription>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }

                                                                    // Default text input
                                                                    return (
                                                                        <FormItem className="flex-1">
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Value"
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    );
                                                                }}
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
                                                isUploading ||
                                                isCreatingGroup ||
                                                !currentGroupId
                                            }
                                            className="w-full"
                                        >
                                            {isUploading || isCreatingGroup
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
                            {linkableMetadata && linkableMetadata.length > 0 ? (
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
                                                        selectedMetadata?.id ===
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
                                                                selectedMetadata?.id ===
                                                                metadata.id
                                                            }
                                                            onChange={() =>
                                                                onSelect?.(
                                                                    metadata
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
