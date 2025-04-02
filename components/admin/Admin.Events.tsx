"use client";

import { EventCategory, EventStatus } from "@prisma/client";
import { useState } from "react";
import FileUploader from "@/components/atoms/FileUploader";
import { useEvents } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import type { Language } from "@/types/language";
import { useToast } from "@/hooks/useToast";

const LANGUAGES: Language[] = ["ko", "en", "ja", "zh"];

export default function AdminEvents() {
    const router = useRouter();
    const { createEvent, isCreating } = useEvents({});
    const { success, error: showError } = useToast();

    // Form state
    const [category, setCategory] = useState<EventCategory>(
        EventCategory.concert
    );
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<EventStatus>(EventStatus.upcoming);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [location, setLocation] = useState("");
    const [price, setPrice] = useState<number | undefined>(undefined);

    // Image states
    const [bannerImage, setBannerImage] = useState<File[]>([]);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [detailImages, setDetailImages] = useState<Record<Language, File[]>>({
        ko: [],
        en: [],
        ja: [],
        zh: [],
    });
    const [content, setContent] = useState<Record<Language, string>>({
        ko: "",
        en: "",
        ja: "",
        zh: "",
    });
    const [error, setError] = useState<string | null>(null);

    // Add new state for uploaded URLs
    const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
    const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
    const [detailImageUrls, setDetailImageUrls] = useState<
        Record<Language, string | null>
    >({
        ko: null,
        en: null,
        ja: null,
        zh: null,
    });

    const handleBannerImageSelect = (files: File[]) => {
        setBannerImage(files);
    };

    const handleBannerImageUpload = (urls: string[]) => {
        setBannerImageUrl(urls[0] || null);
    };

    const handleGalleryImagesSelect = (files: File[]) => {
        setGalleryImages(files);
    };

    const handleGalleryImagesUpload = (urls: string[]) => {
        setGalleryImageUrls(urls);
    };

    const handleDetailImageSelect = (language: Language) => (files: File[]) => {
        setDetailImages((prev) => ({
            ...prev,
            [language]: files,
        }));
    };

    const handleDetailImageUpload =
        (language: Language) => (urls: string[]) => {
            setDetailImageUrls((prev) => ({
                ...prev,
                [language]: urls[0] || null,
            }));
        };

    const handleContentChange =
        (language: Language) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setContent((prev) => ({
                ...prev,
                [language]: e.target.value,
            }));
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const formData = new FormData();

            // Add basic form data
            formData.append("category", category);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("url", url);
            formData.append("status", status);
            formData.append("startDate", startDate.toISOString());
            formData.append("endDate", endDate.toISOString());
            formData.append("location", location);
            if (price) formData.append("price", price.toString());

            // Add uploaded URLs
            if (bannerImageUrl) {
                formData.append("bannerImg", bannerImageUrl);
            }
            if (galleryImageUrls.length > 0) {
                formData.append(
                    "galleryImgs",
                    JSON.stringify(galleryImageUrls)
                );
            }
            Object.entries(detailImageUrls).forEach(([lang, url]) => {
                if (url) {
                    formData.append(`detailImg_${lang}`, url);
                }
            });

            // Add content for each language
            formData.append("content", JSON.stringify(content));

            const response = await fetch("/api/admin/events", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to create event");
            }

            const result = await response.json();
            if (result.success) {
                success("Event created successfully");
                router.push("/admin/events");
            } else {
                throw new Error(result.error || "Failed to create event");
            }
        } catch (error) {
            console.error("Error creating event:", error);
            showError("Failed to create event");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Create Event</h1>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Category
                        </label>
                        <select
                            name="category"
                            className="w-full p-2 border rounded"
                            required
                        >
                            {Object.values(EventCategory).map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            className="w-full p-2 border rounded"
                            required
                        >
                            {Object.values(EventStatus).map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows={4}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Start Date
                        </label>
                        <input
                            type="datetime-local"
                            name="startDate"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            End Date
                        </label>
                        <input
                            type="datetime-local"
                            name="endDate"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Price
                        </label>
                        <input
                            type="number"
                            name="price"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Banner Image
                        </label>
                        <FileUploader
                            onFileSelect={handleBannerImageSelect}
                            onUploadComplete={handleBannerImageUpload}
                            multiple={false}
                        />
                        {bannerImageUrl && (
                            <div className="mt-2">
                                <p className="text-sm text-green-600">
                                    Uploaded successfully
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Gallery Images
                        </label>
                        <FileUploader
                            onFileSelect={handleGalleryImagesSelect}
                            onUploadComplete={handleGalleryImagesUpload}
                            multiple={true}
                        />
                        {galleryImageUrls.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm text-green-600">
                                    {galleryImageUrls.length} images uploaded
                                    successfully
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Event URL
                        </label>
                        <input
                            type="url"
                            name="url"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">
                        Detail Images by Language
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {LANGUAGES.map((lang) => (
                            <div key={lang}>
                                <label className="block text-sm font-medium mb-2">
                                    {lang.toUpperCase()} Detail Image
                                </label>
                                <FileUploader
                                    onFileSelect={handleDetailImageSelect(lang)}
                                    onUploadComplete={handleDetailImageUpload(
                                        lang
                                    )}
                                    multiple={false}
                                />
                                {detailImageUrls[lang] && (
                                    <div className="mt-2">
                                        <p className="text-sm text-green-600">
                                            Uploaded successfully
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">
                        Content by Language
                    </h2>
                    <div className="space-y-6">
                        {LANGUAGES.map((lang) => (
                            <div
                                key={lang}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {lang.toUpperCase()} Content
                                    </label>
                                    <textarea
                                        value={content[lang]}
                                        onChange={handleContentChange(lang)}
                                        className="w-full h-[400px] p-4 border rounded font-mono text-sm"
                                        placeholder="Enter HTML content here..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Preview
                                    </label>
                                    <div
                                        className="border rounded p-4 h-[400px] overflow-auto"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(
                                                content[lang] || "",
                                                {
                                                    ALLOWED_TAGS: [
                                                        "h1",
                                                        "h2",
                                                        "h3",
                                                        "h4",
                                                        "h5",
                                                        "h6",
                                                        "p",
                                                        "br",
                                                        "ul",
                                                        "ol",
                                                        "li",
                                                        "strong",
                                                        "em",
                                                        "u",
                                                        "a",
                                                        "img",
                                                        "table",
                                                        "thead",
                                                        "tbody",
                                                        "tr",
                                                        "th",
                                                        "td",
                                                        "span",
                                                        "div",
                                                    ],
                                                    ALLOWED_ATTR: [
                                                        "style",
                                                        "href",
                                                        "src",
                                                        "alt",
                                                        "target",
                                                        "class",
                                                    ],
                                                }
                                            ),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? "Creating..." : "Create Event"}
                    </button>
                </div>
            </form>
        </div>
    );
}
