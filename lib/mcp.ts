import axios from "axios";

const mcpClient = axios.create({
    baseURL: process.env.MCP_SERVER_URL,
    headers: {
        Authorization: `Bearer ${process.env.MCP_API_KEY}`,
        "Content-Type": "application/json",
    },
});

export const mcpApi = {
    // MCP 서버와 통신하는 메서드들을 여기에 추가
    async getData() {
        const response = await mcpClient.get("/api/data");
        return response.data;
    },

    async postData(data: any) {
        const response = await mcpClient.post("/api/data", data);
        return response.data;
    },
};

export default mcpApi;
