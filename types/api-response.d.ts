/// types\api-response.d.ts

interface apiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    status: number;
}