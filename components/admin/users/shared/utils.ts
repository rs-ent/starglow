import { Star, Coins, DollarSign, Target } from "lucide-react";

/**
 * 지갑 주소를 단축된 형태로 표시
 */
export function truncateAddress(
    address: string,
    startLength = 6,
    endLength = 4
): string {
    if (!address || address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export function formatDate(dateString: string | Date): string {
    const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * 날짜시간을 한국어 형식으로 포맷팅
 */
export function formatDateTime(dateString: string | Date): string {
    const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
}

/**
 * 시간대 라벨 생성
 */
export function getTimeLabel(hour: number): string {
    if (hour === 0) return "12AM";
    if (hour === 12) return "12PM";
    if (hour < 12) return `${hour}AM`;
    return `${hour - 12}PM`;
}

/**
 * 요일 라벨 생성
 */
export function getDayLabel(dayOfWeek: number): string {
    const days = [
        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
    ];
    return days[dayOfWeek] || "알 수 없음";
}

/**
 * 요일 단축 라벨 생성
 */
export function getDayShortLabel(dayOfWeek: number): string {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[dayOfWeek] || "?";
}

/**
 * 인덱스 기반 색상 생성
 */
export function getIndexColor(index: number): string {
    const colors = [
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-orange-500",
        "bg-red-500",
        "bg-yellow-500",
        "bg-pink-500",
        "bg-indigo-500",
    ];
    return colors[index % colors.length];
}

/**
 * HSL 색상 생성
 */
export function getHslColor(
    index: number,
    saturation = 70,
    lightness = 50
): string {
    return `hsl(${index * 60}, ${saturation}%, ${lightness}%)`;
}

/**
 * 리스크 레벨 정보 반환
 */
export function getRiskLevel(score: number | string) {
    if (typeof score === "string") {
        switch (score.toLowerCase()) {
            case "high":
                return {
                    level: "high",
                    color: "destructive" as const,
                    label: "높음",
                };
            case "medium":
                return {
                    level: "medium",
                    color: "secondary" as const,
                    label: "보통",
                };
            case "low":
                return {
                    level: "low",
                    color: "outline" as const,
                    label: "낮음",
                };
            default:
                return {
                    level: "unknown",
                    color: "outline" as const,
                    label: "알 수 없음",
                };
        }
    }

    if (score >= 80)
        return { level: "high", color: "destructive" as const, label: "높음" };
    if (score >= 60)
        return { level: "medium", color: "secondary" as const, label: "보통" };
    return { level: "low", color: "outline" as const, label: "낮음" };
}

/**
 * 백분율 계산
 */
export function calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
}

/**
 * 숫자 포맷팅 (한국어)
 */
export function formatNumber(value: number): string {
    return value.toLocaleString("ko-KR");
}

/**
 * 활동 강도 색상 반환
 */
export function getActivityIntensity(count: number, maxCount: number): string {
    const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
    if (intensity > 80) return "bg-red-500";
    if (intensity > 60) return "bg-orange-500";
    if (intensity > 40) return "bg-yellow-500";
    if (intensity > 20) return "bg-green-500";
    return "bg-blue-500";
}

/**
 * 자산 타입 아이콘 반환
 */
export function getAssetTypeIcon(
    type: string
): React.ComponentType<{ className?: string }> {
    switch (type.toLowerCase()) {
        case "nft":
            return Star;
        case "token":
            return Coins;
        case "coin":
            return DollarSign;
        default:
            return Target;
    }
}

/**
 * 지갑 연령대 색상 반환
 */
export function getAgeGroupColor(ageGroup: string): string {
    if (ageGroup.includes("1주일")) return "bg-red-500";
    if (ageGroup.includes("1개월")) return "bg-orange-500";
    if (ageGroup.includes("3개월")) return "bg-yellow-500";
    if (ageGroup.includes("6개월")) return "bg-green-500";
    return "bg-blue-500";
}
