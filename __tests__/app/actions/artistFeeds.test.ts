import {
    createArtistFeed,
    getArtistFeeds,
    updateArtistFeed,
    deleteArtistFeed,
    createArtistFeedReaction,
    getArtistFeedReactions,
    updateArtistFeedReaction,
    deleteArtistFeedReaction,
} from "@/app/actions/artistFeeds";

// Mock Prisma Client
jest.mock("@/lib/prisma/client", () => ({
    prisma: {
        artistFeed: {
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        artistFeedReaction: {
            upsert: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

// Import after mocking
import { prisma } from "@/lib/prisma/client";

// Mock console.error to prevent noise in test output
const mockConsoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

describe("Artist Feeds Actions", () => {
    // Type-safe mock references
    const mockCreateFeed = prisma.artistFeed.create as jest.MockedFunction<
        typeof prisma.artistFeed.create
    >;
    const mockFindManyFeeds = prisma.artistFeed.findMany as jest.MockedFunction<
        typeof prisma.artistFeed.findMany
    >;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConsoleError.mockClear();
    });

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    describe("Artist Feed CRUD Operations", () => {
        describe("createArtistFeed", () => {
            describe("Happy Path", () => {
                it("should create artist feed successfully with all fields", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                        imageUrls: [
                            "https://example.com/image1.jpg",
                            "https://example.com/image2.jpg",
                        ],
                        videoUrls: ["https://example.com/video1.mp4"],
                        text: "Amazing performance tonight! 🎵",
                    };

                    const mockCreatedFeed = {
                        id: "feed-123",
                        artistId: "artist-123",
                        imageUrls: [
                            "https://example.com/image1.jpg",
                            "https://example.com/image2.jpg",
                        ],
                        videoUrls: ["https://example.com/video1.mp4"],
                        text: "Amazing performance tonight! 🎵",
                        createdAt: new Date("2024-01-15T10:00:00Z"),
                        updatedAt: new Date("2024-01-15T10:00:00Z"),
                    };

                    mockCreateFeed.mockResolvedValue(mockCreatedFeed);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toEqual(mockCreatedFeed);
                    expect(mockCreateFeed).toHaveBeenCalledTimes(1);
                    expect(mockCreateFeed).toHaveBeenCalledWith({
                        data: input,
                    });
                });

                it("should create artist feed with minimal required fields", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-456",
                        imageUrls: [],
                        videoUrls: [],
                        text: "Simple text post",
                    };

                    const mockCreatedFeed = {
                        id: "feed-456",
                        artistId: "artist-456",
                        imageUrls: [],
                        videoUrls: [],
                        text: "Simple text post",
                        createdAt: new Date("2024-01-15T10:00:00Z"),
                        updatedAt: new Date("2024-01-15T10:00:00Z"),
                    };

                    mockCreateFeed.mockResolvedValue(mockCreatedFeed);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toEqual(mockCreatedFeed);
                    expect(mockCreateFeed).toHaveBeenCalledWith({
                        data: input,
                    });
                });

                it("should handle empty text with media content", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-789",
                        imageUrls: ["https://example.com/image.jpg"],
                        videoUrls: [],
                        text: "",
                    };

                    const mockCreatedFeed = {
                        id: "feed-789",
                        artistId: "artist-789",
                        imageUrls: ["https://example.com/image.jpg"],
                        videoUrls: [],
                        text: "",
                        createdAt: new Date("2024-01-15T10:00:00Z"),
                        updatedAt: new Date("2024-01-15T10:00:00Z"),
                    };

                    mockCreateFeed.mockResolvedValue(mockCreatedFeed);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toEqual(mockCreatedFeed);
                });
            });

            describe("Error Cases", () => {
                it("should return null when database create fails", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                        imageUrls: [],
                        videoUrls: [],
                        text: "Test post",
                    };

                    const dbError = new Error("Database connection failed");
                    mockCreateFeed.mockRejectedValue(dbError);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toBeNull();
                    expect(mockConsoleError).toHaveBeenCalledWith(dbError);
                });

                it("should return null when foreign key constraint fails", async () => {
                    // Arrange
                    const input = {
                        artistId: "non-existent-artist",
                        imageUrls: [],
                        videoUrls: [],
                        text: "Test post",
                    };

                    const constraintError = new Error(
                        "Foreign key constraint failed"
                    );
                    mockCreateFeed.mockRejectedValue(constraintError);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toBeNull();
                    expect(mockConsoleError).toHaveBeenCalledWith(
                        constraintError
                    );
                });

                it("should return null when validation fails", async () => {
                    // Arrange
                    const input = {
                        artistId: "", // Invalid empty artistId
                        imageUrls: [],
                        videoUrls: [],
                        text: "Test post",
                    };

                    const validationError = new Error("Validation failed");
                    mockCreateFeed.mockRejectedValue(validationError);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toBeNull();
                    expect(mockConsoleError).toHaveBeenCalledWith(
                        validationError
                    );
                });
            });

            describe("Edge Cases", () => {
                it("should handle very long text content", async () => {
                    // Arrange
                    const longText = "A".repeat(10000); // 10KB text
                    const input = {
                        artistId: "artist-123",
                        imageUrls: [],
                        videoUrls: [],
                        text: longText,
                    };

                    const mockCreatedFeed = {
                        id: "feed-123",
                        artistId: "artist-123",
                        imageUrls: [],
                        videoUrls: [],
                        text: longText,
                        createdAt: new Date("2024-01-15T10:00:00Z"),
                        updatedAt: new Date("2024-01-15T10:00:00Z"),
                    };

                    mockCreateFeed.mockResolvedValue(mockCreatedFeed);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toEqual(mockCreatedFeed);
                });

                it("should handle many media URLs", async () => {
                    // Arrange
                    const manyImages = Array.from(
                        { length: 50 },
                        (_, i) => `https://example.com/image${i}.jpg`
                    );
                    const manyVideos = Array.from(
                        { length: 10 },
                        (_, i) => `https://example.com/video${i}.mp4`
                    );

                    const input = {
                        artistId: "artist-123",
                        imageUrls: manyImages,
                        videoUrls: manyVideos,
                        text: "Many media files",
                    };

                    const mockCreatedFeed = {
                        id: "feed-123",
                        artistId: "artist-123",
                        imageUrls: manyImages,
                        videoUrls: manyVideos,
                        text: "Many media files",
                        createdAt: new Date("2024-01-15T10:00:00Z"),
                        updatedAt: new Date("2024-01-15T10:00:00Z"),
                    };

                    mockCreateFeed.mockResolvedValue(mockCreatedFeed);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toEqual(mockCreatedFeed);
                });

                it("should handle special characters and emojis in text", async () => {
                    // Arrange
                    const specialText =
                        "🎵 Special chars: @#$%^&*()_+-=[]{}|;':\",./<>?~` 한글 中文 العربية";
                    const input = {
                        artistId: "artist-123",
                        imageUrls: [],
                        videoUrls: [],
                        text: specialText,
                    };

                    const mockCreatedFeed = {
                        id: "feed-123",
                        artistId: "artist-123",
                        imageUrls: [],
                        videoUrls: [],
                        text: specialText,
                        createdAt: new Date("2024-01-15T10:00:00Z"),
                        updatedAt: new Date("2024-01-15T10:00:00Z"),
                    };

                    mockCreateFeed.mockResolvedValue(mockCreatedFeed);

                    // Act
                    const result = await createArtistFeed({ input });

                    // Assert
                    expect(result).toEqual(mockCreatedFeed);
                });
            });
        });

        describe("getArtistFeeds", () => {
            const createMockFeed = (
                id: string,
                createdAt: string,
                text: string
            ) => ({
                id,
                artistId: "artist-123",
                imageUrls: [],
                videoUrls: [],
                text,
                createdAt: new Date(createdAt),
                updatedAt: new Date(createdAt),
                reactions: [
                    {
                        id: `reaction-${id}-1`,
                        artistFeedId: id,
                        playerId: "player-1",
                        reaction: "like",
                        comment: null,
                        createdAt: new Date(createdAt),
                        updatedAt: new Date(createdAt),
                    },
                ],
            });

            describe("Happy Path - Basic Functionality", () => {
                it("should return empty result when no input provided", async () => {
                    // Act
                    const result = await getArtistFeeds({});

                    // Assert
                    expect(result).toEqual({
                        feeds: [],
                        nextCursor: null,
                    });
                    expect(mockFindManyFeeds).not.toHaveBeenCalled();
                });

                it("should get first page of feeds without pagination", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                    };

                    const mockFeeds = [
                        createMockFeed(
                            "feed-1",
                            "2024-01-15T12:00:00Z",
                            "Latest post"
                        ),
                        createMockFeed(
                            "feed-2",
                            "2024-01-15T11:00:00Z",
                            "Earlier post"
                        ),
                        createMockFeed(
                            "feed-3",
                            "2024-01-15T10:00:00Z",
                            "Oldest post"
                        ),
                    ];

                    mockFindManyFeeds.mockResolvedValue(mockFeeds as any);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result.feeds).toEqual(mockFeeds);
                    expect(result.nextCursor).toEqual({
                        createdAt: "2024-01-15T10:00:00.000Z",
                        id: "feed-3",
                    });

                    expect(mockFindManyFeeds).toHaveBeenCalledWith({
                        where: {
                            artistId: "artist-123",
                        },
                        include: {
                            reactions: true,
                        },
                        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                        take: undefined,
                    });
                });

                it("should get feeds with limit", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                        pagination: {
                            limit: 2,
                        },
                    };

                    const mockFeeds = [
                        createMockFeed(
                            "feed-1",
                            "2024-01-15T12:00:00Z",
                            "Latest post"
                        ),
                        createMockFeed(
                            "feed-2",
                            "2024-01-15T11:00:00Z",
                            "Earlier post"
                        ),
                    ];

                    mockFindManyFeeds.mockResolvedValue(mockFeeds as any);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result.feeds).toEqual(mockFeeds);
                    expect(result.nextCursor).toEqual({
                        createdAt: "2024-01-15T11:00:00.000Z",
                        id: "feed-2",
                    });

                    expect(mockFindManyFeeds).toHaveBeenCalledWith({
                        where: {
                            artistId: "artist-123",
                        },
                        include: {
                            reactions: true,
                        },
                        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                        take: 2,
                    });
                });
            });

            describe("Advanced Pagination Logic", () => {
                it("should get next page using cursor (time-based pagination)", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                        pagination: {
                            cursor: {
                                createdAt: "2024-01-15T11:00:00Z",
                                id: "feed-2",
                            },
                            limit: 2,
                        },
                    };

                    const mockFeeds = [
                        createMockFeed(
                            "feed-3",
                            "2024-01-15T10:00:00Z",
                            "Older post"
                        ),
                        createMockFeed(
                            "feed-4",
                            "2024-01-15T09:00:00Z",
                            "Even older post"
                        ),
                    ];

                    mockFindManyFeeds.mockResolvedValue(mockFeeds as any);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result.feeds).toEqual(mockFeeds);
                    expect(result.nextCursor).toEqual({
                        createdAt: "2024-01-15T09:00:00.000Z",
                        id: "feed-4",
                    });

                    // 복잡한 OR 조건이 올바르게 전달되었는지 확인
                    expect(mockFindManyFeeds).toHaveBeenCalledWith({
                        where: {
                            artistId: "artist-123",
                            OR: [
                                {
                                    createdAt: {
                                        lt: new Date("2024-01-15T11:00:00Z"),
                                    },
                                },
                                {
                                    createdAt: new Date("2024-01-15T11:00:00Z"),
                                    id: { lt: "feed-2" },
                                },
                            ],
                        },
                        include: {
                            reactions: true,
                        },
                        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                        take: 2,
                    });
                });

                it("should handle same timestamp pagination (id-based tiebreaker)", async () => {
                    // Arrange - 같은 시간에 생성된 피드들의 페이지네이션
                    const sameTime = "2024-01-15T11:00:00Z";
                    const input = {
                        artistId: "artist-123",
                        pagination: {
                            cursor: {
                                createdAt: sameTime,
                                id: "feed-b",
                            },
                            limit: 2,
                        },
                    };

                    const mockFeeds = [
                        createMockFeed("feed-a", sameTime, "Post A"), // id가 더 작음
                    ];

                    mockFindManyFeeds.mockResolvedValue(mockFeeds as any);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(mockFindManyFeeds).toHaveBeenCalledWith({
                        where: {
                            artistId: "artist-123",
                            OR: [
                                {
                                    createdAt: {
                                        lt: new Date(sameTime),
                                    },
                                },
                                {
                                    createdAt: new Date(sameTime),
                                    id: { lt: "feed-b" }, // ID 기반 정렬
                                },
                            ],
                        },
                        include: {
                            reactions: true,
                        },
                        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                        take: 2,
                    });
                });

                it("should return null cursor when no more feeds available", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                        pagination: {
                            limit: 10,
                        },
                    };

                    mockFindManyFeeds.mockResolvedValue([]); // 빈 결과

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result.feeds).toEqual([]);
                    expect(result.nextCursor).toBeNull();
                });
            });

            describe("Error Cases", () => {
                it("should return empty result when database query fails", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                    };

                    const dbError = new Error("Database connection failed");
                    mockFindManyFeeds.mockRejectedValue(dbError);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result).toEqual({
                        feeds: [],
                        nextCursor: null,
                    });
                    expect(mockConsoleError).toHaveBeenCalledWith(dbError);
                });

                it("should handle invalid cursor gracefully", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                        pagination: {
                            cursor: {
                                createdAt: "invalid-date",
                                id: "feed-123",
                            },
                        },
                    };

                    const dateError = new Error("Invalid date format");
                    mockFindManyFeeds.mockRejectedValue(dateError);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result).toEqual({
                        feeds: [],
                        nextCursor: null,
                    });
                    expect(mockConsoleError).toHaveBeenCalledWith(dateError);
                });
            });

            describe("Regression Tests - Real-world Scenarios", () => {
                it("should handle large feed lists with proper pagination", async () => {
                    // Arrange - 대량의 피드 시뮬레이션
                    const input = {
                        artistId: "popular-artist",
                        pagination: {
                            limit: 20,
                        },
                    };

                    const mockFeeds = Array.from({ length: 20 }, (_, i) =>
                        createMockFeed(
                            `feed-${i}`,
                            new Date(Date.now() - i * 60000).toISOString(), // 1분씩 차이
                            `Post ${i}`
                        )
                    );

                    mockFindManyFeeds.mockResolvedValue(mockFeeds as any);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result.feeds).toHaveLength(20);
                    expect(result.nextCursor).toEqual({
                        createdAt: mockFeeds[19].createdAt.toISOString(),
                        id: "feed-19",
                    });
                });

                it("should include reactions in feed data", async () => {
                    // Arrange
                    const input = {
                        artistId: "artist-123",
                    };

                    const mockFeeds = [
                        createMockFeed(
                            "feed-1",
                            "2024-01-15T12:00:00Z",
                            "Post with reactions"
                        ),
                    ];

                    mockFindManyFeeds.mockResolvedValue(mockFeeds as any);

                    // Act
                    const result = await getArtistFeeds({ input });

                    // Assert
                    expect(result.feeds[0].reactions).toBeDefined();
                    expect(result.feeds[0].reactions).toHaveLength(1);
                    expect(result.feeds[0].reactions[0]).toEqual({
                        id: "reaction-feed-1-1",
                        artistFeedId: "feed-1",
                        playerId: "player-1",
                        reaction: "like",
                        comment: null,
                        createdAt: new Date("2024-01-15T12:00:00Z"),
                        updatedAt: new Date("2024-01-15T12:00:00Z"),
                    });
                });
            });
        });
    });
});
