import crypto from "crypto";
import {
    encrypt,
    decrypt,
    encryptPrivateKey,
    decryptPrivateKey,
} from "@/lib/utils/encryption";
import { put } from "@vercel/blob";

// Mock Vercel Blob
jest.mock("@vercel/blob", () => ({
    put: jest.fn(),
}));

// Mock fetch for decryptPrivateKey tests
global.fetch = jest.fn();

describe("Encryption Utils", () => {
    // 테스트용 환경 변수 설정
    const originalEnv = process.env;

    beforeAll(() => {
        process.env.ENCRYPTION_SECRET = "test-secret-key-for-testing-purposes";
        process.env.ENCRYPTION_METHOD = "aes-256-cbc";
        process.env.BLOB_PK_URL = "https://test-blob-url.com";
        process.env.BLOB_PK_READ_WRITE_TOKEN = "test-token";
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Basic Encryption/Decryption", () => {
        describe("Happy Path - Roundtrip Tests", () => {
            it("should encrypt and decrypt simple text correctly", () => {
                // Arrange
                const originalText = "Hello World";

                // Act
                const encrypted = encrypt(originalText);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(originalText);
                expect(encrypted).not.toBe(originalText);
                expect(encrypted).toContain(":"); // IV:encrypted 형식
            });

            it("should encrypt and decrypt complex text with special characters", () => {
                // Arrange
                const originalText =
                    "안녕하세요! @#$%^&*()_+-=[]{}|;':\",./<>?~`";

                // Act
                const encrypted = encrypt(originalText);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(originalText);
            });

            it("should encrypt and decrypt long text", () => {
                // Arrange
                const originalText = "A".repeat(10000); // 10KB 텍스트

                // Act
                const encrypted = encrypt(originalText);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(originalText);
            });

            it("should encrypt and decrypt JSON data", () => {
                // Arrange
                const originalData = {
                    privateKey: "0x1234567890abcdef",
                    address: "0xabcdef1234567890",
                    balance: 1000.5,
                };
                const originalText = JSON.stringify(originalData);

                // Act
                const encrypted = encrypt(originalText);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(originalText);
                expect(JSON.parse(decrypted)).toEqual(originalData);
            });
        });

        describe("Security Properties", () => {
            it("should produce different encrypted outputs for same input (due to random IV)", () => {
                // Arrange
                const text = "Same input text";

                // Act
                const encrypted1 = encrypt(text);
                const encrypted2 = encrypt(text);

                // Assert
                expect(encrypted1).not.toBe(encrypted2); // 다른 IV로 인해 다른 결과
                expect(decrypt(encrypted1)).toBe(text);
                expect(decrypt(encrypted2)).toBe(text);
            });

            it("should produce encrypted text that looks random", () => {
                // Arrange
                const text = "predictable text";

                // Act
                const encrypted = encrypt(text);

                // Assert
                expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+$/); // hex:hex 형식
                expect(encrypted.length).toBeGreaterThan(text.length); // 암호화로 인한 길이 증가
            });

            it("should handle empty string", () => {
                // Arrange
                const text = "";

                // Act
                const encrypted = encrypt(text);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(text);
            });
        });

        describe("Edge Cases", () => {
            it("should handle single character", () => {
                // Arrange
                const text = "A";

                // Act
                const encrypted = encrypt(text);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(text);
            });

            it("should handle text with newlines and tabs", () => {
                // Arrange
                const text = "Line 1\nLine 2\tTabbed\r\nWindows newline";

                // Act
                const encrypted = encrypt(text);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(text);
            });

            it("should handle Unicode characters", () => {
                // Arrange
                const text = "🚀 Unicode: 한글, 中文, العربية, עברית";

                // Act
                const encrypted = encrypt(text);
                const decrypted = decrypt(encrypted);

                // Assert
                expect(decrypted).toBe(text);
            });
        });

        describe("Error Cases", () => {
            it("should throw error when decrypting invalid format", () => {
                // Arrange
                const invalidHash = "invalid-format-without-colon";

                // Act & Assert
                expect(() => decrypt(invalidHash)).toThrow();
            });

            it("should throw error when decrypting malformed hex", () => {
                // Arrange
                const invalidHash = "invalidhex:alsoinvalidhex";

                // Act & Assert
                expect(() => decrypt(invalidHash)).toThrow();
            });

            it("should throw error when IV length is wrong", () => {
                // Arrange
                const shortIV = "abc123"; // 너무 짧은 IV
                const validEncrypted = "1234567890abcdef1234567890abcdef";
                const invalidHash = `${shortIV}:${validEncrypted}`;

                // Act & Assert
                expect(() => decrypt(invalidHash)).toThrow();
            });
        });
    });

    describe("Private Key Encryption/Decryption", () => {
        const mockPut = put as jest.MockedFunction<typeof put>;
        const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

        describe("Happy Path - Private Key Operations", () => {
            it("should encrypt private key and return correct structure", async () => {
                // Arrange
                const privateKey = "0x1234567890abcdef1234567890abcdef12345678";
                mockPut.mockResolvedValue({
                    url: "https://test-blob.com/test.key",
                    downloadUrl: "https://test-blob.com/test.key",
                    pathname: "test.key",
                    contentType: "text/plain",
                    contentDisposition: "inline",
                });

                // Act
                const result = await encryptPrivateKey(privateKey);

                // Assert
                expect(result).toHaveProperty("dbPart");
                expect(result).toHaveProperty("blobPart");
                expect(result).toHaveProperty("keyHash");
                expect(result).toHaveProperty("nonce");

                expect(typeof result.dbPart).toBe("string");
                expect(typeof result.blobPart).toBe("string");
                expect(typeof result.keyHash).toBe("string");
                expect(typeof result.nonce).toBe("string");

                expect(result.keyHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 해시
                expect(result.nonce).toMatch(/^[a-f0-9]{64}$/); // 32바이트 hex

                // Vercel Blob put이 호출되었는지 확인
                expect(mockPut).toHaveBeenCalledTimes(1);
                expect(mockPut).toHaveBeenCalledWith(
                    `${result.keyHash}.key`,
                    result.blobPart,
                    {
                        access: "public",
                        addRandomSuffix: false,
                        token: "test-token",
                    }
                );
            });

            it("should decrypt private key correctly (roundtrip test)", async () => {
                // Arrange
                const originalPrivateKey =
                    "0x1234567890abcdef1234567890abcdef12345678";

                // Mock Vercel Blob put
                mockPut.mockResolvedValue({
                    url: "https://test-blob.com/test.key",
                    downloadUrl: "https://test-blob.com/test.key",
                    pathname: "test.key",
                    contentType: "text/plain",
                    contentDisposition: "inline",
                });

                // Encrypt first
                const keyParts = await encryptPrivateKey(originalPrivateKey);

                // Mock fetch for decryption
                mockFetch.mockResolvedValue({
                    ok: true,
                    text: () => Promise.resolve(keyParts.blobPart),
                } as Response);

                // Act
                const decryptedPrivateKey = await decryptPrivateKey(keyParts);

                // Assert
                expect(decryptedPrivateKey).toBe(originalPrivateKey);
            });
        });

        describe("Edge Cases - Private Key Operations", () => {
            it("should handle short private keys", async () => {
                // Arrange
                const shortPrivateKey = "0x123";
                mockPut.mockResolvedValue({
                    url: "https://test-blob.com/test.key",
                    downloadUrl: "https://test-blob.com/test.key",
                    pathname: "test.key",
                    contentType: "text/plain",
                    contentDisposition: "inline",
                });

                // Act
                const result = await encryptPrivateKey(shortPrivateKey);

                // Assert
                expect(result).toHaveProperty("dbPart");
                expect(result).toHaveProperty("blobPart");
                expect(result).toHaveProperty("keyHash");
                expect(result).toHaveProperty("nonce");
            });

            it("should handle long private keys", async () => {
                // Arrange
                const longPrivateKey = "0x" + "a".repeat(128); // 매우 긴 키
                mockPut.mockResolvedValue({
                    url: "https://test-blob.com/test.key",
                    downloadUrl: "https://test-blob.com/test.key",
                    pathname: "test.key",
                    contentType: "text/plain",
                    contentDisposition: "inline",
                });

                // Act
                const result = await encryptPrivateKey(longPrivateKey);

                // Assert
                expect(result).toHaveProperty("dbPart");
                expect(result).toHaveProperty("blobPart");
                expect(result).toHaveProperty("keyHash");
                expect(result).toHaveProperty("nonce");
            });
        });

        describe("Error Cases - Private Key Operations", () => {
            it("should throw error when blob fetch fails", async () => {
                // Arrange
                const keyParts = {
                    dbPart: "test-db-part",
                    blobPart: "test-blob-part",
                    keyHash: "test-hash",
                    nonce: "test-nonce",
                };

                mockFetch.mockRejectedValue(new Error("Network error"));

                // Act & Assert
                await expect(decryptPrivateKey(keyParts)).rejects.toThrow(
                    "Network error"
                );
            });

            it("should throw error when key hash doesn't match", async () => {
                // Arrange
                const keyParts = {
                    dbPart: "test-db-part",
                    blobPart: "test-blob-part",
                    keyHash: "incorrect-hash",
                    nonce: "test-nonce",
                };

                mockFetch.mockResolvedValue({
                    ok: true,
                    text: () => Promise.resolve("different-blob-content"),
                } as Response);

                // Act & Assert
                await expect(decryptPrivateKey(keyParts)).rejects.toThrow(
                    "Invalid key hash"
                );
            });

            it("should throw error when nonce doesn't match", async () => {
                // Arrange - 실제 암호화된 데이터를 만들어서 nonce 불일치 상황 생성
                const originalPrivateKey = "0x1234567890abcdef";

                mockPut.mockResolvedValue({
                    url: "https://test-blob.com/test.key",
                    downloadUrl: "https://test-blob.com/test.key",
                    pathname: "test.key",
                    contentType: "text/plain",
                    contentDisposition: "inline",
                });

                const keyParts = await encryptPrivateKey(originalPrivateKey);

                // nonce를 변경하여 불일치 상황 생성
                const tamperedKeyParts = {
                    ...keyParts,
                    nonce: "different-nonce-" + "0".repeat(50), // 다른 nonce
                };

                mockFetch.mockResolvedValue({
                    ok: true,
                    text: () => Promise.resolve(keyParts.blobPart),
                } as Response);

                // Act & Assert
                await expect(
                    decryptPrivateKey(tamperedKeyParts)
                ).rejects.toThrow("Invalid nonce");
            });
        });
    });
});
