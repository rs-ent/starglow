"use client";

import { useState } from "react";

import { EventCategory, EventStatus } from "@prisma/client";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";

import { useEvents } from "@/app/hooks/useEvents";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";


import type { Language } from "@/app/types/language";


const LANGUAGES: Language[] = ["ko", "en", "ja", "zh"];

// Helper function to safely format date for datetime-local input
const formatDateForInput = (date: Date): string => {
    try {
        // Format as YYYY-MM-DDThh:mm (local timezone)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
        console.error("Invalid date:", date, error);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
};

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

    const handleBannerImageUpload = (files: { id: string; url: string }[]) => {
        if (files.length > 0) {
            setBannerImageUrl(files[0].url);
        }
    };

    const handleGalleryImagesUpload = (
        files: { id: string; url: string }[]
    ) => {
        const newUrls = files.map((file) => file.url);
        setGalleryImageUrls((prev) => [...prev, ...newUrls]);
    };

    const handleDetailImageUpload =
        (language: Language) => (files: { id: string; url: string }[]) => {
            if (files.length > 0) {
                setDetailImageUrls((prev: Record<Language, string | null>) => ({
                    ...prev,
                    [language]: files[0].url,
                }));
            }
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
            // Validate required fields
            if (!title || !category || !status || !startDate || !endDate) {
                setError("Please fill in all required fields");
                return;
            }

            const formData = new FormData();

            // Add basic form data
            formData.append("category", category);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("url", url || "");
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
            const detailImgObj: Record<string, string> = {};
            Object.entries(detailImageUrls).forEach(([lang, url]) => {
                if (url) {
                    detailImgObj[lang] = url;
                }
            });

            if (Object.keys(detailImgObj).length > 0) {
                formData.append("detailImg", JSON.stringify(detailImgObj));
            }

            // Add content for each language
            formData.append("content", JSON.stringify(content));

            await createEvent(formData);
            success("Event created successfully");
            router.push("/admin/events");
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
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value as EventCategory)
                            }
                            className="w-full p-2 border rounded"
                            required
                        >
                            {Object.values(EventCategory).map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as EventStatus)
                            }
                            className="w-full p-2 border rounded"
                            required
                        >
                            {Object.values(EventStatus).map((stat) => (
                                <option key={stat} value={stat}>
                                    {stat}
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
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                            value={formatDateForInput(startDate)}
                            onChange={(e) =>
                                setStartDate(new Date(e.target.value))
                            }
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
                            value={formatDateForInput(endDate)}
                            onChange={(e) =>
                                setEndDate(new Date(e.target.value))
                            }
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
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Price
                        </label>
                        <input
                            type="number"
                            value={price || ""}
                            onChange={(e) =>
                                setPrice(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                )
                            }
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Event URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Banner Image
                        </label>
                        <div className="flex items-center gap-2">
                            <FileUploader
                                purpose="event-banner"
                                bucket="events"
                                onComplete={handleBannerImageUpload}
                                multiple={false}
                            />
                            {bannerImageUrl && (
                                <div className="mt-2">
                                    <p className="text-sm text-green-600">
                                        Uploaded successfully
                                    </p>
                                    <div className="mt-2">
                                        <img
                                            src={bannerImageUrl}
                                            alt="Banner preview"
                                            className="max-h-48 rounded shadow-sm border border-gray-200"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Gallery Images
                        </label>
                        <div className="flex items-center gap-2">
                            <FileUploader
                                purpose="event-gallery"
                                bucket="events"
                                onComplete={handleGalleryImagesUpload}
                                multiple={true}
                            />
                            {galleryImageUrls.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-green-600">
                                        {galleryImageUrls.length} images
                                        uploaded successfully
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {galleryImageUrls.map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`Gallery image ${
                                                    index + 1
                                                }`}
                                                className="w-24 h-24 object-cover rounded shadow-sm border border-gray-200"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
                                <div className="flex items-center gap-2">
                                    <FileUploader
                                        purpose={`event-detail-${lang}`}
                                        bucket="events"
                                        onComplete={handleDetailImageUpload(
                                            lang
                                        )}
                                        multiple={false}
                                    />
                                    {detailImageUrls[lang] && (
                                        <div className="mt-2">
                                            <p className="text-sm text-green-600">
                                                Uploaded successfully
                                            </p>
                                            <div className="mt-2">
                                                <img
                                                    src={
                                                        detailImageUrls[lang] ||
                                                        ""
                                                    }
                                                    alt={`${lang.toUpperCase()} detail preview`}
                                                    className="max-h-48 rounded shadow-sm border border-gray-200"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
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
