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
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
    Plus,
    Trash2,
    RefreshCw,
    Eye,
    Calendar,
    X,
    FileText,
    Tags,
    Tag,
    Type,
    Hash,
    TrendingUp,
    Percent,
    Image,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { METADATA_TYPE } from "@/app/actions/metadata";
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
import { useMetadata } from "@/app/hooks/useMetadata";

// MetadataPreviewDialog component for previewing metadata
function MetadataPreviewDialog({
    isOpen,
    onOpenChange,
    metadata,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    metadata: METADATA_TYPE | null;
}) {
    if (!metadata) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background to-muted/5">
                <DialogHeader className="space-y-3 pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {metadata.name}
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Preview and verify metadata content
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-8 py-6">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Image className="h-5 w-5 text-primary" />
                            Preview Image
                        </h3>
                        <div className="aspect-square w-full bg-black/5 rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                            <img
                                src={metadata.image}
                                alt={metadata.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Metadata Info Section */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Details
                            </h3>
                            <div className="grid gap-4">
                                <div className="p-4 bg-muted/10 rounded-lg space-y-2">
                                    <p className="text-sm font-medium text-primary">
                                        Description
                                    </p>
                                    <p className="text-sm">
                                        {metadata.description}
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/10 rounded-lg space-y-2">
                                    <p className="text-sm font-medium text-primary">
                                        External URL
                                    </p>
                                    <p className="text-sm font-mono break-all hover:text-primary transition-colors">
                                        {metadata.external_url}
                                    </p>
                                </div>
                                {metadata.animation_url && (
                                    <div className="p-4 bg-muted/10 rounded-lg space-y-2">
                                        <p className="text-sm font-medium text-primary">
                                            Animation URL
                                        </p>
                                        <p className="text-sm font-mono break-all hover:text-primary transition-colors">
                                            {metadata.animation_url}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attributes Section */}
                        {metadata.attributes &&
                            metadata.attributes.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Tags className="h-5 w-5 text-primary" />
                                        Attributes
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {metadata.attributes.map(
                                            (attr, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-muted/10 p-4 rounded-lg space-y-1.5 hover:bg-muted/20 transition-colors"
                                                >
                                                    <p className="text-xs font-medium text-primary">
                                                        {attr.trait_type}
                                                    </p>
                                                    <p className="font-medium text-sm">
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

                <DialogFooter className="border-t pt-4 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-muted/50 transition-colors"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Close Preview
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// AttributeFormField component to handle single attribute input
function AttributeFormField({
    index,
    form,
    onRemove,
}: {
    index: number;
    form: UseFormReturn<MetadataFormValues>;
    onRemove: () => void;
}) {
    const displayType = form.watch(`attributes.${index}.display_type`);

    return (
        <div className="p-5 border rounded-xl space-y-4 bg-muted/5 hover:bg-muted/10 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Tag className="h-3 w-3 text-primary" />
                    </div>
                    <h4 className="font-medium">Attribute #{index + 1}</h4>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name={`attributes.${index}.trait_type`}
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input
                                    placeholder="Trait Type"
                                    {...field}
                                    className="bg-background/50"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`attributes.${index}.display_type`}
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                            >
                                <SelectTrigger className="bg-background/50">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">
                                        <span className="flex items-center gap-2">
                                            <Type className="h-4 w-4" />
                                            Text
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="number">
                                        <span className="flex items-center gap-2">
                                            <Hash className="h-4 w-4" />
                                            Number
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="boost_number">
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Boost Number
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="boost_percentage">
                                        <span className="flex items-center gap-2">
                                            <Percent className="h-4 w-4" />
                                            Percentage
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="date">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Date
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name={`attributes.${index}.value`}
                        render={({ field }) => {
                            if (displayType === "date") {
                                return (
                                    <FormItem className="flex-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal bg-background/50",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
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
                                                                Pick a date
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
                                                    onSelect={(date) => {
                                                        if (date) {
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
                                ].includes(displayType || "")
                            ) {
                                return (
                                    <div className="flex-1 space-y-2">
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Value"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(
                                                            Number(
                                                                e.target.value
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
                                        ].includes(displayType || "") && (
                                            <FormField
                                                control={form.control}
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
                                                            최대값 (진행 바용)
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
                                        <Input placeholder="Value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// 메타데이터 폼 타입
export type MetadataFormValues = Omit<METADATA_TYPE, "background_color"> & {
    background_color?: string;
    collectionName: string;
    collectionKey: string;
};

// Zod 스키마
const metadataFormSchema = z.object({
    collectionKey: z.string().min(1, "Collection key is required"),
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

function generateShortId(length = 16) {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2);
    return (time + random).slice(0, length);
}

// MetadataListTab component for displaying and selecting metadata
function MetadataListTab({
    metadata,
    selectedId,
    onSelect,
    onPreview,
}: {
    metadata: Metadata[] | undefined;
    selectedId?: string | null;
    onSelect: (metadata: Metadata) => void;
    onPreview: (metadata: METADATA_TYPE) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Available Metadata</CardTitle>
                <CardDescription>
                    Select metadata to link with your collection
                </CardDescription>
            </CardHeader>
            <CardContent>
                {metadata && metadata.length > 0 ? (
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
                            {metadata.map((item) => {
                                const meta = item.metadata as METADATA_TYPE;
                                return (
                                    <TableRow
                                        key={item.id}
                                        className={
                                            selectedId === item.id
                                                ? "bg-muted/50"
                                                : ""
                                        }
                                    >
                                        <TableCell>
                                            <input
                                                type="radio"
                                                name="metadata-selection"
                                                checked={selectedId === item.id}
                                                onChange={() => onSelect(item)}
                                                className="w-4 h-4"
                                            />
                                        </TableCell>
                                        <TableCell>{meta.name}</TableCell>
                                        <TableCell>
                                            {meta.description}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {meta.image}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onPreview(meta)}
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
    );
}

// MetadataCreationForm component for the create tab
function MetadataCreationForm({
    form,
    onSubmit,
    isUploading,
    handleFileUpload,
    addAttribute,
    removeAttribute,
}: {
    form: UseFormReturn<MetadataFormValues>;
    onSubmit: (data: MetadataFormValues) => Promise<void>;
    isUploading: boolean;
    handleFileUpload: (results: { id: string; url: string }[]) => Promise<void>;
    addAttribute: () => void;
    removeAttribute: (index: number) => void;
}) {
    const toast = useToast();

    return (
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
                        onSubmit={form.handleSubmit(onSubmit, (errors) => {
                            console.log("Form validation failed", errors);
                            toast.error(
                                `Please fix the form errors before submitting`
                            );
                        })}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            {/* Step 1: Create Collection Key */}
                            <div className="space-y-4 border-b pb-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-md font-medium">
                                        1. Collection Key
                                    </h3>
                                    {form.watch("collectionKey") && (
                                        <Badge
                                            variant="outline"
                                            className="text-green-500"
                                        >
                                            Collection Key Ready
                                        </Badge>
                                    )}
                                </div>
                                <FormItem>
                                    <FormLabel>Collection Key</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter collection key"
                                            {...form.register("collectionKey")}
                                        />
                                    </FormControl>
                                </FormItem>

                                <div className="space-y-4">
                                    <div className="flex gap-2 items-center justify-between">
                                        <FormField
                                            control={form.control}
                                            name="collectionName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Collection Contract Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter collection name"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
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
                                                NFT Name (metadata.name)
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

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
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

                                <div className="space-y-2">
                                    <FormLabel>Image</FormLabel>
                                    <FileUploader
                                        purpose="metadata-image"
                                        onComplete={handleFileUpload}
                                        multiple={false}
                                        bucket="metadata"
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Image URL</FormLabel>
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
                                            <FormLabel>External URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                External website URL for the NFT
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
                                                Background color for NFT display
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
                                            <FormLabel>Animation URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                URL to a multimedia attachment
                                                (optional)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Attributes Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Attributes</FormLabel>
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
                                            <AttributeFormField
                                                key={index}
                                                index={index}
                                                form={form}
                                                onRemove={() =>
                                                    removeAttribute(index)
                                                }
                                            />
                                        ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isUploading}
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
    );
}

export function OnChainMetadata({
    onSelect,
    selectedMetadata,
}: OnChainMetadataProps) {
    const toast = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("create");
    const [showPreview, setShowPreview] = useState(false);
    const [previewMetadata, setPreviewMetadata] =
        useState<METADATA_TYPE | null>(null);

    const { linkableMetadata, createCollection, linkMetadata } = useMetadata();

    const form = useForm<MetadataFormValues>({
        resolver: zodResolver(metadataFormSchema),
        defaultValues: {
            collectionKey: generateShortId(),
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
                    value: "10%",
                    display_type: "string",
                },
            ],
            collectionName: "",
        },
    });

    const onSubmit = async (data: MetadataFormValues) => {
        console.log("Form submission started", { data });
        try {
            setIsUploading(true);

            const { collectionName, collectionKey, ...metadataFields } = data;
            console.log("Submitting metadata:", metadataFields);

            const response = await createCollection({
                metadata: metadataFields as METADATA_TYPE,
                collectionKey,
            });

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

    const handleFileUpload = async (results: { id: string; url: string }[]) => {
        if (results.length === 0) return;

        try {
            setIsUploading(true);
            const result = results[0];
            if (result.url) {
                form.setValue("image", result.url);
                console.log("Image uploaded successfully", result.url);
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

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create Metadata</TabsTrigger>
                    <TabsTrigger value="list">Select Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                    <MetadataCreationForm
                        form={form}
                        onSubmit={onSubmit}
                        isUploading={isUploading}
                        handleFileUpload={handleFileUpload}
                        addAttribute={addAttribute}
                        removeAttribute={removeAttribute}
                    />
                </TabsContent>

                <TabsContent value="list">
                    <MetadataListTab
                        metadata={linkableMetadata}
                        selectedId={selectedMetadata?.id}
                        onSelect={onSelect!}
                        onPreview={handlePreview}
                    />
                </TabsContent>
            </Tabs>

            <MetadataPreviewDialog
                isOpen={showPreview}
                onOpenChange={setShowPreview}
                metadata={previewMetadata}
            />
        </>
    );
}
