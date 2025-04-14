/// lib\pinata\client.ts

import { PinataSDK } from "pinata";

declare global {
    var pinataClient: PinataSDK | undefined;
}

function getPinataClient() {
    return new PinataSDK({
        pinataJwt:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmMmQ5YWIwOC1jMjQ2LTQwNmEtOTdjZS04NGZiYTBjNGZmMTIiLCJlbWFpbCI6InJzLmVudC5jb250YWN0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjY2IwZDIyNTlmZWU2YTFhNmMzYSIsInNjb3BlZEtleVNlY3JldCI6IjZjOWIwZWNkYTAzMDE3ZTc0ZjAxMGM3ZWFjOTkzMGM2MGI5MzNjNWI5YzU0MjMxNDQ2ZDYyNWNkNmJiOGQ3OTgiLCJleHAiOjE3NzYwNDU2OTN9.z-rRbmTbMy5IdUO7sMMp5b4lqlxkihE5U2Re63Nq-lY",
    });
}

export const pinataClient = global.pinataClient || getPinataClient();

if (process.env.NODE_ENV !== "production") global.pinataClient = pinataClient;
