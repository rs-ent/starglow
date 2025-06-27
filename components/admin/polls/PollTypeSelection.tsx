/// components/admin/polls/PollTypeSelection.tsx

"use client";

interface PollTypeSelectionProps {
    onSelect: (type: "REGULAR" | "BETTING") => void;
}

export default function PollTypeSelection({
    onSelect,
}: PollTypeSelectionProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">
                폴 타입을 선택해주세요
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* 일반 투표 */}
                <button
                    onClick={() => onSelect("REGULAR")}
                    className="group flex flex-col items-center p-8 border-2 border-muted-foreground/20 rounded-xl hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-blue-900/50 to-cyan-900/50 hover:from-blue-900/70 hover:to-cyan-900/70"
                >
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        📊
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-200">
                        일반 투표
                    </h3>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        단순한 투표와 의견 수렴
                        <br />
                        <span className="font-medium">
                            참여 보상, 토큰게이팅, 정답 설정
                        </span>{" "}
                        등의 기능
                    </p>
                </button>

                {/* 베팅 투표 */}
                <button
                    onClick={() => onSelect("BETTING")}
                    className="group flex flex-col items-center p-8 border-2 border-muted-foreground/20 rounded-xl hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-orange-900/50 to-yellow-900/50 hover:from-orange-900/70 hover:to-yellow-900/70"
                >
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        💰
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-orange-200">
                        베팅 투표
                    </h3>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        베팅과 배당이 있는 예측 투표
                        <br />
                        <span className="font-medium">
                            베팅 풀, 배당률, 정산 시스템
                        </span>{" "}
                        포함
                    </p>
                </button>
            </div>
        </div>
    );
}
